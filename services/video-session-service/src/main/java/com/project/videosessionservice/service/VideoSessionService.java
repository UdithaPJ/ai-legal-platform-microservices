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
    private final JaaSTokenService jaaSTokenService;

    /** e.g. https://8x8.vc */
    @Value("${jitsi.base-url}")
    private String jitsiBaseUrl;

    /** JaaS app id — prefixed into the meeting URL as /<appId>/<room> */
    @Value("${jaas.app-id}")
    private String appId;

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
        // 8x8 JaaS requires the appId as a path segment: https://8x8.vc/<appId>/<room>
        String meetingUrl = jitsiBaseUrl + "/" + appId + "/" + roomName;

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

        return mapToResponse(saved, null);
    }

    public VideoSessionResponseDTO getById(Long id) {
        return mapToResponse(findById(id), null);
    }

    public VideoSessionResponseDTO getByAppointmentId(
            Long appointmentId, boolean moderator, String userId, String displayName, String email) {
        VideoSession session = videoSessionRepository.findByAppointmentId(appointmentId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "No video session found for appointmentId: " + appointmentId));
        String token = jaaSTokenService.signToken(
                session.getRoomName(), userId, displayName, email, moderator);
        return mapToResponse(session, token);
    }

    public VideoSessionResponseDTO joinSession(
            Long appointmentId, boolean moderator, String userId, String displayName, String email) {
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

        String token = jaaSTokenService.signToken(
                session.getRoomName(), userId, displayName, email, moderator);
        return mapToResponse(session, token);
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

        return mapToResponse(updated, null);
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

    private VideoSessionResponseDTO mapToResponse(VideoSession session, String jitsiToken) {
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
                .jitsiToken(jitsiToken)
                .build();
    }
}
