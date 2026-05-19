package com.project.videosessionservice.service;

import com.project.videosessionservice.client.AppointmentServiceClient;
import com.project.videosessionservice.dto.AppointmentResponseDTO;
import com.project.videosessionservice.dto.VideoSessionResponseDTO;
import com.project.videosessionservice.model.SessionStatus;
import com.project.videosessionservice.model.VideoSession;
import com.project.videosessionservice.repository.VideoSessionRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VideoSessionService {

    private final VideoSessionRepository videoSessionRepository;
    private final AppointmentServiceClient appointmentServiceClient;

    @Value("${jitsi.base-url}")
    private String jitsiBaseUrl;

    // ── CREATE ──────────────────────────────────────────────────

    public VideoSessionResponseDTO createSession(Long appointmentId) {

        // 1. Prevent duplicate sessions for the same appointment
        if (videoSessionRepository.existsByAppointmentId(appointmentId)) {
            throw new IllegalArgumentException(
                    "A video session already exists for appointment: " + appointmentId);
        }

        // 2. Verify appointment exists and is CONFIRMED
        AppointmentResponseDTO appointment = fetchAppointment(appointmentId);

        if (!"CONFIRMED".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalArgumentException(
                    "A video session can only be created for a CONFIRMED appointment. " +
                            "Current status: " + appointment.getStatus());
        }

        // 3. Generate a unique, human-readable Jitsi room name.
        //    Format: legal-{appointmentId}-{random-suffix}
        //    The UUID suffix ensures uniqueness even if appointment IDs repeat
        //    across environments. Spaces and special chars must be avoided
        //    as the room name becomes part of the URL.
        String roomName = "legal-" + appointmentId + "-"
                + UUID.randomUUID().toString().substring(0, 8);

        String meetingUrl = jitsiBaseUrl + "/" + roomName;

        // 4. Save the session
        VideoSession session = VideoSession.builder()
                .appointmentId(appointmentId)
                .roomName(roomName)
                .meetingUrl(meetingUrl)
                .status(SessionStatus.SCHEDULED)
                .scheduledAt(appointment.getAppointmentDateTime())
                .build();

        VideoSession saved = videoSessionRepository.save(session);
        log.info("Video session created for appointmentId: {} — room: {}",
                appointmentId, roomName);

        return mapToResponse(saved);
    }

    // ── READ ─────────────────────────────────────────────────────

    // Get session by its own ID
    public VideoSessionResponseDTO getById(Long id) {
        return mapToResponse(findById(id));
    }

    // Get session by appointmentId — primary lookup used by frontend
    public VideoSessionResponseDTO getByAppointmentId(Long appointmentId) {
        VideoSession session = videoSessionRepository
                .findByAppointmentId(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No video session found for appointmentId: " + appointmentId));
        return mapToResponse(session);
    }

    // ── SESSION LIFECYCLE ────────────────────────────────────────

    // Called when either participant opens the meeting URL.
    // Transitions SCHEDULED → ACTIVE and records the start time.
    public VideoSessionResponseDTO joinSession(Long appointmentId) {
        VideoSession session = findByAppointmentId(appointmentId);

        if (session.getStatus() == SessionStatus.ENDED) {
            throw new IllegalArgumentException(
                    "This session has already ended");
        }

        // Only transition to ACTIVE if currently SCHEDULED
        // (second participant joining should not reset startedAt)
        if (session.getStatus() == SessionStatus.SCHEDULED) {
            session.setStatus(SessionStatus.ACTIVE);
            session.setStartedAt(LocalDateTime.now());
            videoSessionRepository.save(session);
            log.info("Video session ACTIVE for appointmentId: {}", appointmentId);
        }

        return mapToResponse(session);
    }

    // Called when the consultation is finished.
    // Transitions ACTIVE (or SCHEDULED) → ENDED and records the end time.
    public VideoSessionResponseDTO endSession(Long appointmentId) {
        VideoSession session = findByAppointmentId(appointmentId);

        if (session.getStatus() == SessionStatus.ENDED) {
            throw new IllegalArgumentException(
                    "This session has already ended");
        }

        session.setStatus(SessionStatus.ENDED);
        session.setEndedAt(LocalDateTime.now());

        VideoSession updated = videoSessionRepository.save(session);
        log.info("Video session ENDED for appointmentId: {}", appointmentId);

        return mapToResponse(updated);
    }

    // ── HELPERS ──────────────────────────────────────────────────

    private VideoSession findById(Long id) {
        return videoSessionRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Video session not found with id: " + id));
    }

    private VideoSession findByAppointmentId(Long appointmentId) {
        return videoSessionRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No video session found for appointmentId: " + appointmentId));
    }

    private AppointmentResponseDTO fetchAppointment(Long appointmentId) {
        try {
            return appointmentServiceClient.getAppointmentById(appointmentId);
        } catch (FeignException.NotFound e) {
            throw new IllegalArgumentException(
                    "Appointment not found with id: " + appointmentId);
        } catch (FeignException e) {
            throw new IllegalStateException(
                    "Could not reach appointment-service. Please try again later.");
        }
    }

    // ── MAPPER ───────────────────────────────────────────────────

    private VideoSessionResponseDTO mapToResponse(VideoSession s) {
        return VideoSessionResponseDTO.builder()
                .id(s.getId())
                .appointmentId(s.getAppointmentId())
                .roomName(s.getRoomName())
                .meetingUrl(s.getMeetingUrl())
                .status(s.getStatus())
                .scheduledAt(s.getScheduledAt())
                .startedAt(s.getStartedAt())
                .endedAt(s.getEndedAt())
                .createdAt(s.getCreatedAt())
                .updatedAt(s.getUpdatedAt())
                .build();
    }
}