package com.project.videosessionservice.dto;

import com.project.videosessionservice.model.SessionStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class VideoSessionResponseDTO {
    private Long id;
    private Long appointmentId;
    private String roomName;
    private String meetingUrl;
    private SessionStatus status;
    private LocalDateTime scheduledAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}