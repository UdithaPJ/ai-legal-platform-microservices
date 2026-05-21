package com.project.appointmentservice.service;

import com.project.appointmentservice.dto.CreateVideoSessionRequestDTO;
import com.project.appointmentservice.client.LawyerServiceClient;
import com.project.appointmentservice.client.UserServiceClient;
import com.project.appointmentservice.dto.VideoSessionResponseDTO;
import com.project.appointmentservice.client.VideoSessionServiceClient;
import com.project.appointmentservice.dto.AppointmentRequestDTO;
import com.project.appointmentservice.dto.AppointmentResponseDTO;
import com.project.appointmentservice.dto.AppointmentScheduleRequestDTO;
import com.project.appointmentservice.dto.AppointmentStatusUpdateDTO;
import com.project.appointmentservice.dto.LawyerResponseDTO;
import com.project.appointmentservice.events.WorkflowEvent;
import com.project.appointmentservice.events.WorkflowEventPublisher;
import com.project.appointmentservice.events.WorkflowEventType;
import com.project.appointmentservice.model.Appointment;
import com.project.appointmentservice.model.AppointmentStatus;
import com.project.appointmentservice.repository.AppointmentRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.time.OffsetDateTime;
import java.util.EnumSet;
import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class AppointmentService {

    private final AppointmentRepository appointmentRepository;
    private final LawyerServiceClient lawyerServiceClient;
    private final UserServiceClient userServiceClient;
    private final VideoSessionServiceClient videoSessionServiceClient;
    private final WorkflowEventPublisher workflowEventPublisher;

    public AppointmentResponseDTO createAppointment(AppointmentRequestDTO request) {
        LawyerResponseDTO lawyer = fetchLawyerByUserId(request.getLawyerId());

        if (!lawyer.getIsAvailable()) {
            throw new IllegalArgumentException(
                    "Lawyer is currently not available for bookings");
        }

        Appointment appointment = Appointment.builder()
                .clientId(request.getClientId())
                .lawyerId(request.getLawyerId())
                .appointmentDateTime(request.getAppointmentDateTime())
                .durationMinutes(request.getDurationMinutes())
                .description(request.getDescription())
                .status(AppointmentStatus.REQUESTED)
                .consultationFee(lawyer.getConsultationFee())
                .build();

        Appointment saved = appointmentRepository.save(appointment);
        log.info("Appointment created with id: {} for clientId: {} with lawyerId: {}",
                saved.getId(), saved.getClientId(), saved.getLawyerId());

        workflowEventPublisher.publish(new WorkflowEvent(
                WorkflowEventType.APPOINTMENT_REQUESTED,
                saved.getId(),
                saved.getClientId().toString(),
                saved.getLawyerId().toString(),
                saved.getMeetingUrl(),
                saved.getAppointmentDateTime(),
                "New appointment request",
                OffsetDateTime.now()
        ));

        return mapToResponse(saved, fetchLawyerName(lawyer.getUserId()));
    }

    public AppointmentResponseDTO getById(Long id) {
        Appointment appointment = findById(id);
        return mapToResponse(appointment, fetchLawyerName(appointment.getLawyerId()));
    }

    public List<AppointmentResponseDTO> getByClientId(UUID clientId) {
        return appointmentRepository.findByClientId(clientId)
                .stream()
                .map(a -> mapToResponse(a, fetchLawyerName(a.getLawyerId())))
                .collect(Collectors.toList());
    }

    public List<AppointmentResponseDTO> getByLawyerId(UUID lawyerId) {
        return appointmentRepository.findByLawyerId(lawyerId)
                .stream()
                .map(a -> mapToResponse(a, fetchLawyerName(a.getLawyerId())))
                .collect(Collectors.toList());
    }

    public List<AppointmentResponseDTO> getByClientIdAndStatus(
            UUID clientId, AppointmentStatus status) {
        return appointmentRepository.findByClientIdAndStatus(clientId, status)
                .stream()
                .map(a -> mapToResponse(a, fetchLawyerName(a.getLawyerId())))
                .collect(Collectors.toList());
    }

    public List<AppointmentResponseDTO> getByLawyerIdAndStatus(
            UUID lawyerId, AppointmentStatus status) {
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

    public AppointmentResponseDTO updateStatus(Long id, AppointmentStatusUpdateDTO request) {
        Appointment appointment = findById(id);
        AppointmentStatus nextStatus = request.getStatus();

        validateStatusTransition(appointment.getStatus(), nextStatus);

        appointment.setStatus(nextStatus);
        if (request.getLawyerNote() != null) {
            appointment.setLawyerNote(request.getLawyerNote());
        }

        Appointment updated = appointmentRepository.save(appointment);
        log.info("Appointment {} status updated to {}", id, nextStatus);

        publishLifecycleEvent(updated, nextStatus);

        return mapToResponse(updated, fetchLawyerName(updated.getLawyerId()));
    }

    public AppointmentResponseDTO requestVideoCall(Long id) {
        Appointment appointment = findById(id);

        if (appointment.getStatus() != AppointmentStatus.ACCEPTED) {
            throw new IllegalArgumentException(
                    "Video can only be requested after the appointment is accepted");
        }

        appointment.setStatus(AppointmentStatus.VIDEO_REQUESTED);
        Appointment updated = appointmentRepository.save(appointment);

        workflowEventPublisher.publish(new WorkflowEvent(
                WorkflowEventType.VIDEO_REQUESTED,
                updated.getId(),
                updated.getClientId().toString(),
                updated.getLawyerId().toString(),
                updated.getMeetingUrl(),
                updated.getAppointmentDateTime(),
                "Video consultation requested",
                OffsetDateTime.now()
        ));

        return mapToResponse(updated, fetchLawyerName(updated.getLawyerId()));
    }

    public AppointmentResponseDTO scheduleAppointment(
            Long id, AppointmentScheduleRequestDTO request) {
        Appointment appointment = findById(id);

        if (appointment.getStatus() != AppointmentStatus.VIDEO_REQUESTED) {
            throw new IllegalArgumentException(
                    "Only video-requested appointments can be scheduled");
        }

        OffsetDateTime scheduledStart = request.getAppointmentDateTime();
        OffsetDateTime scheduledEnd = scheduledStart.plusMinutes(appointment.getDurationMinutes());

        List<Appointment> conflicts = appointmentRepository
                .findByLawyerIdAndStatusInAndAppointmentDateTimeBetween(
                        appointment.getLawyerId(),
                        EnumSet.of(AppointmentStatus.SCHEDULED),
                        scheduledStart.minusHours(3),
                        scheduledEnd
                )
                .stream()
                .filter(existing -> !existing.getId().equals(appointment.getId()))
                .collect(Collectors.toList());

        if (!conflicts.isEmpty()) {
            throw new IllegalArgumentException(
                    "The lawyer already has a scheduled appointment in this time slot");
        }

        appointment.setAppointmentDateTime(scheduledStart);
        appointment.setStatus(AppointmentStatus.SCHEDULED);

        Appointment scheduled = appointmentRepository.save(appointment);

        VideoSessionResponseDTO session;
        try {
            session = videoSessionServiceClient.createSession(
                    scheduled.getId(),
                    new CreateVideoSessionRequestDTO(scheduledStart)
            );
        } catch (FeignException e) {
            throw new IllegalStateException(
                    "Could not create the meeting link. Please try scheduling again.");
        }

        if (session != null) {
            scheduled.setMeetingUrl(session.getMeetingUrl());
            scheduled = appointmentRepository.save(scheduled);
        }

        workflowEventPublisher.publish(new WorkflowEvent(
                WorkflowEventType.APPOINTMENT_SCHEDULED,
                scheduled.getId(),
                scheduled.getClientId().toString(),
                scheduled.getLawyerId().toString(),
                scheduled.getMeetingUrl(),
                scheduled.getAppointmentDateTime(),
                "Appointment scheduled",
                OffsetDateTime.now()
        ));

        return mapToResponse(scheduled, fetchLawyerName(scheduled.getLawyerId()));
    }

    public AppointmentResponseDTO completeAppointment(Long id) {
        Appointment appointment = findById(id);

        if (!EnumSet.of(
                AppointmentStatus.ACCEPTED,
                AppointmentStatus.VIDEO_REQUESTED,
                AppointmentStatus.SCHEDULED
        ).contains(appointment.getStatus())) {
            throw new IllegalArgumentException(
                    "Only accepted, video-requested, or scheduled appointments can be marked as completed");
        }

        appointment.setStatus(AppointmentStatus.COMPLETED);
        Appointment updated = appointmentRepository.save(appointment);

        workflowEventPublisher.publish(new WorkflowEvent(
                WorkflowEventType.APPOINTMENT_COMPLETED,
                updated.getId(),
                updated.getClientId().toString(),
                updated.getLawyerId().toString(),
                updated.getMeetingUrl(),
                updated.getAppointmentDateTime(),
                "Appointment completed",
                OffsetDateTime.now()
        ));

        return mapToResponse(updated, fetchLawyerName(updated.getLawyerId()));
    }

    public AppointmentResponseDTO cancelAppointment(Long id, UUID clientId) {
        Appointment appointment = findById(id);

        if (!appointment.getClientId().equals(clientId)) {
            throw new IllegalArgumentException(
                    "You are not authorized to cancel this appointment");
        }
        if (appointment.getStatus() == AppointmentStatus.COMPLETED) {
            throw new IllegalArgumentException(
                    "Cannot cancel a completed appointment");
        }
        if (appointment.getStatus() == AppointmentStatus.CANCELLED) {
            throw new IllegalArgumentException(
                    "Appointment is already cancelled");
        }

        appointment.setStatus(AppointmentStatus.CANCELLED);
        Appointment updated = appointmentRepository.save(appointment);

        return mapToResponse(updated, fetchLawyerName(updated.getLawyerId()));
    }

    private Appointment findById(Long id) {
        return appointmentRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Appointment not found with id: " + id));
    }

    private LawyerResponseDTO fetchLawyerByUserId(UUID lawyerUserId) {
        try {
            return lawyerServiceClient.getLawyerByUserId(lawyerUserId);
        } catch (FeignException.NotFound e) {
            throw new IllegalArgumentException(
                    "Lawyer not found with userId: " + lawyerUserId);
        } catch (FeignException e) {
            throw new IllegalStateException(
                    "Could not reach lawyer-service. Please try again later.");
        }
    }

    private String fetchLawyerName(UUID lawyerUserId) {
        try {
            return userServiceClient.getUserById(lawyerUserId).getFullName();
        } catch (FeignException e) {
            log.warn("Could not fetch user name for userId: {}", lawyerUserId);
            return "Unknown";
        }
    }

    private void validateStatusTransition(AppointmentStatus current, AppointmentStatus next) {
        boolean valid = switch (current) {
            case REQUESTED -> next == AppointmentStatus.ACCEPTED
                    || next == AppointmentStatus.REJECTED
                    || next == AppointmentStatus.CANCELLED;
            case ACCEPTED, VIDEO_REQUESTED, SCHEDULED ->
                    next == AppointmentStatus.CANCELLED;
            default -> false;
        };

        if (!valid) {
            throw new IllegalArgumentException(
                    "Cannot transition appointment from " + current + " to " + next);
        }
    }

    private AppointmentResponseDTO mapToResponse(Appointment appointment, String lawyerName) {
        return AppointmentResponseDTO.builder()
                .id(appointment.getId())
                .clientId(appointment.getClientId())
                .lawyerId(appointment.getLawyerId())
                .lawyerName(lawyerName)
                .appointmentDateTime(appointment.getAppointmentDateTime())
                .durationMinutes(appointment.getDurationMinutes())
                .description(appointment.getDescription())
                .status(appointment.getStatus())
                .lawyerNote(appointment.getLawyerNote())
                .meetingUrl(appointment.getMeetingUrl())
                .consultationFee(appointment.getConsultationFee())
                .createdAt(appointment.getCreatedAt())
                .updatedAt(appointment.getUpdatedAt())
                .build();
    }

    private void publishLifecycleEvent(Appointment appointment, AppointmentStatus status) {
        WorkflowEventType eventType = switch (status) {
            case ACCEPTED -> WorkflowEventType.APPOINTMENT_ACCEPTED;
            case REJECTED -> WorkflowEventType.APPOINTMENT_REJECTED;
            default -> null;
        };

        if (eventType == null) {
            return;
        }

        workflowEventPublisher.publish(new WorkflowEvent(
                eventType,
                appointment.getId(),
                appointment.getClientId().toString(),
                appointment.getLawyerId().toString(),
                appointment.getMeetingUrl(),
                appointment.getAppointmentDateTime(),
                "Appointment " + status.name().toLowerCase(),
                OffsetDateTime.now()
        ));
    }
}
