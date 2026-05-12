package com.project.appointmentservice.service;

import com.project.appointmentservice.client.LawyerServiceClient;
import com.project.appointmentservice.dto.*;
import com.project.appointmentservice.model.Appointment;
import com.project.appointmentservice.model.AppointmentStatus;
import com.project.appointmentservice.repository.AppointmentRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final LawyerServiceClient lawyerServiceClient;

    // ── CREATE ──────────────────────────────────────────────────

    public AppointmentResponseDTO createAppointment(AppointmentRequestDTO request) {

        // 1. Verify lawyer exists via inter-service call to lawyer-service
        LawyerResponseDTO lawyer = fetchLawyer(request.getLawyerId());

        // 2. Check the lawyer is available
        if (!lawyer.getIsAvailable()) {
            throw new IllegalArgumentException(
                    "Lawyer " + lawyer.getFullName() + " is currently not available for bookings");
        }

        // 3. Check for scheduling conflicts
        LocalDateTime requestedEnd = request.getAppointmentDateTime()
                .plusMinutes(request.getDurationMinutes());

        List<Appointment> conflicts = appointmentRepository
                .findByLawyerIdAndStatusAndAppointmentDateTimeBetween(
                        request.getLawyerId(),
                        AppointmentStatus.CONFIRMED,
                        request.getAppointmentDateTime().minusHours(3),
                        requestedEnd
                );

        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException(
                    "The lawyer already has a confirmed appointment in this time slot");
        }

        // 4. Create the appointment
        Appointment appointment = Appointment.builder()
                .clientId(request.getClientId())
                .lawyerId(request.getLawyerId())
                .appointmentDateTime(request.getAppointmentDateTime())
                .durationMinutes(request.getDurationMinutes())
                .description(request.getDescription())
                .status(AppointmentStatus.PENDING)
                // Snapshot the fee at booking time
                .consultationFee(lawyer.getConsultationFee())
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment created with id: {} for clientId: {} with lawyerId: {}",
                saved.getId(), saved.getClientId(), saved.getLawyerId());

        return mapToResponse(saved, lawyer.getFullName());
    }

    // ── READ ─────────────────────────────────────────────────────

    public AppointmentResponseDTO getById(Long id) {
        Appointment appointment = findById(id);
        LawyerResponseDTO lawyer = fetchLawyer(appointment.getLawyerId());
        return mapToResponse(appointment, lawyer.getFullName());
    }

    public List<AppointmentResponseDTO> getByClientId(Long clientId) {
        return appointmentRepository.findByClientId(clientId)
                .stream()
                .map(a -> {
                    String lawyerName = fetchLawyerName(a.getLawyerId());
                    return mapToResponse(a, lawyerName);
                })
                .collect(Collectors.toList());
    }

    public List<AppointmentResponseDTO> getByLawyerId(Long lawyerId) {
        return appointmentRepository.findByLawyerId(lawyerId)
                .stream()
                .map(a -> mapToResponse(a, fetchLawyerName(a.getLawyerId())))
                .collect(Collectors.toList());
    }

    public List<AppointmentResponseDTO> getByClientIdAndStatus(
            Long clientId, AppointmentStatus status) {
        return appointmentRepository.findByClientIdAndStatus(clientId, status)
                .stream()
                .map(a -> mapToResponse(a, fetchLawyerName(a.getLawyerId())))
                .collect(Collectors.toList());
    }

    public List<AppointmentResponseDTO> getByLawyerIdAndStatus(
            Long lawyerId, AppointmentStatus status) {
        return appointmentRepository.findByLawyerIdAndStatus(lawyerId, status)
                .stream()
                .map(a -> mapToResponse(a, fetchLawyerName(a.getLawyerId())))
                .collect(Collectors.toList());
    }

    public List<AppointmentResponseDTO> getAll() {
        return appointmentRepository.findAll()
                .stream()
                .map(a -> mapToResponse(a, fetchLawyerName(a.getLawyerId())))
                .collect(Collectors.toList());
    }

    // ── STATUS UPDATES ───────────────────────────────────────────

    public AppointmentResponseDTO updateStatus(Long id, AppointmentStatusUpdateDTO request) {
        Appointment appointment = findById(id);

        validateStatusTransition(appointment.getStatus(), request.getStatus());

        appointment.setStatus(request.getStatus());
        if (request.getLawyerNote() != null) {
            appointment.setLawyerNote(request.getLawyerNote());
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Appointment {} status updated to {}", id, request.getStatus());

        String lawyerName = fetchLawyerName(updated.getLawyerId());
        return mapToResponse(updated, lawyerName);
    }

    // Convenience: client cancels their own appointment
    public AppointmentResponseDTO cancelAppointment(Long id, Long clientId) {
        Appointment appointment = findById(id);

        if (!appointment.getClientId().equals(clientId)) {
            throw new IllegalArgumentException(
                    "You are not authorized to cancel this appointment");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalArgumentException("Cannot cancel a completed appointment");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalArgumentException("Appointment is already cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        Appointment updated = appointmentRepository.save(appointment);

        String lawyerName = fetchLawyerName(updated.getLawyerId());
        return mapToResponse(updated, lawyerName);
    }

    // ── HELPERS ──────────────────────────────────────────────────

    private Appointment findById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Appointment not found with id: " + id));
    }

    // Full fetch — used when we need lawyer details in the response
    private LawyerResponseDTO fetchLawyer(Long lawyerId) {
        try {
            return lawyerServiceClient.getLawyerById(lawyerId);
        } catch (FeignException.NotFound e) {
            throw new IllegalArgumentException(
                    "Lawyer not found with id: " + lawyerId);
        } catch (FeignException e) {
            throw new IllegalStateException(
                    "Could not reach lawyer-service. Please try again later.");
        }
    }

    // Name-only fetch — used when mapping lists (avoids redundant full fetches)
    private String fetchLawyerName(Long lawyerId) {
        try {
            return lawyerServiceClient.getLawyerById(lawyerId).getFullName();
        } catch (FeignException e) {
            // Don't fail the whole list just because lawyer-service is slow
            log.warn("Could not fetch lawyer name for lawyerId: {}", lawyerId);
            return "Unknown";
        }
    }

    /*
     * Valid status transitions:
     * PENDING  → CONFIRMED, REJECTED, CANCELLED
     * CONFIRMED → COMPLETED, CANCELLED
     * REJECTED, CANCELLED, COMPLETED → no further transitions
     */
    private void validateStatusTransition(
            AppointmentStatus current, AppointmentStatus next) {
        boolean valid = switch (current) {
            case PENDING -> next == AppointmentStatus.CONFIRMED
                    || next == AppointmentStatus.REJECTED
                    || next == AppointmentStatus.CANCELLED;
            case CONFIRMED -> next == AppointmentStatus.COMPLETED
                    || next == AppointmentStatus.CANCELLED;
            default -> false;
        };

        if (!valid) {
            throw new IllegalArgumentException(
                    "Cannot transition appointment from " + current + " to " + next);
        }
    }

    // ── MAPPER ───────────────────────────────────────────────────

    private AppointmentResponseDTO mapToResponse(Appointment a, String lawyerName) {
        return AppointmentResponseDTO.builder()
                .id(a.getId())
                .clientId(a.getClientId())
                .lawyerId(a.getLawyerId())
                .lawyerName(lawyerName)
                .appointmentDateTime(a.getAppointmentDateTime())
                .durationMinutes(a.getDurationMinutes())
                .description(a.getDescription())
                .status(a.getStatus())
                .lawyerNote(a.getLawyerNote())
                .consultationFee(a.getConsultationFee())
                .createdAt(a.getCreatedAt())
                .updatedAt(a.getUpdatedAt())
                .build();
    }
}