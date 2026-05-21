package com.project.videosessionservice.service;

import com.project.videosessionservice.dto.CreateVideoSessionRequestDTO;
import com.project.videosessionservice.dto.VideoSessionResponseDTO;
import com.project.videosessionservice.events.WorkflowEvent;
import com.project.videosessionservice.events.WorkflowEventPublisher;
import com.project.videosessionservice.events.WorkflowEventType;
import com.project.videosessionservice.model.SessionStatus;
import com.project.videosessionservice.model.VideoSession;
import com.project.videosessionservice.repository.VideoSessionRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.time.OffsetDateTime;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class VideoSessionService {

    private final VideoSessionRepository videoSessionRepository;
    private final WorkflowEventPublisher workflowEventPublisher;

    @Value("${jitsi.base-url}")
    private String jitsiBaseUrl;

    public VideoSessionResponseDTO createSession(
            Long appointmentId,
            CreateVideoSessionRequestDTO request
    ) {
        if (videoSessionRepository.existsByAppointmentId(appointmentId)) {
            throw new IllegalArgumentException(
                    "A video session already exists for appointment: " + appointmentId);
        }

        String roomName = "legal-" + appointmentId + "-"
                + UUID.randomUUID().toString().substring(0, 8);
        String meetingUrl = jitsiBaseUrl + "/" + roomName;

        VideoSession session = VideoSession.builder()
                .appointmentId(appointmentId)
                .roomName(roomName)
                .meetingUrl(meetingUrl)
                .status(SessionStatus.SCHEDULED)
                .scheduledAt(request.getScheduledAt().toLocalDateTime())
                .build();

        VideoSession saved = videoSessionRepository.save(session);
        log.info("Video session created for appointmentId: {} with room: {}",
                appointmentId, roomName);

        return mapToResponse(saved);
    }

    public VideoSessionResponseDTO getById(Long id) {
        return mapToResponse(findById(id));
    }

    public VideoSessionResponseDTO getByAppointmentId(Long appointmentId) {
        VideoSession session = videoSessionRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No video session found for appointmentId: " + appointmentId));
        return mapToResponse(session);
    }

    public VideoSessionResponseDTO joinSession(Long appointmentId) {
        VideoSession session = findByAppointmentId(appointmentId);

        if (session.getStatus() == SessionStatus.ENDED) {
            throw new IllegalArgumentException("This session has already ended");
        }

        if (session.getStatus() == SessionStatus.SCHEDULED) {
            session.setStatus(SessionStatus.ACTIVE);
            session.setStartedAt(LocalDateTime.now());
            session = videoSessionRepository.save(session);
            log.info("Video session ACTIVE for appointmentId: {}", appointmentId);
        }

        return mapToResponse(session);
    }

    public VideoSessionResponseDTO endSession(Long appointmentId) {
        VideoSession session = findByAppointmentId(appointmentId);

        if (session.getStatus() == SessionStatus.ENDED) {
            throw new IllegalArgumentException("This session has already ended");
        }

        session.setStatus(SessionStatus.ENDED);
        session.setEndedAt(LocalDateTime.now());

        VideoSession updated = videoSessionRepository.save(session);
        log.info("Video session ENDED for appointmentId: {}", appointmentId);

        workflowEventPublisher.publish(new WorkflowEvent(
                WorkflowEventType.VIDEO_SESSION_ENDED,
                appointmentId,
                null,
                null,
                null,
                null,
                "Video session ended",
                OffsetDateTime.now()
        ));

        return mapToResponse(updated);
    }

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

    private VideoSessionResponseDTO mapToResponse(VideoSession session) {
        return VideoSessionResponseDTO.builder()
                .id(session.getId())
                .appointmentId(session.getAppointmentId())
                .roomName(session.getRoomName())
                .meetingUrl(session.getMeetingUrl())
                .status(session.getStatus())
                .scheduledAt(session.getScheduledAt())
                .startedAt(session.getStartedAt())
                .endedAt(session.getEndedAt())
                .createdAt(session.getCreatedAt())
                .updatedAt(session.getUpdatedAt())
                .build();
    }
}
