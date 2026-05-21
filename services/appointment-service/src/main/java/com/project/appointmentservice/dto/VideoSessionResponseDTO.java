package com.project.appointmentservice.dto;

import lombok.Data;

import java.time.LocalDateTime;

@Data
public class VideoSessionResponseDTO {
    private Long id;
    private Long appointmentId;
    private String roomName;
    private String meetingUrl;
    private String status;
    private LocalDateTime scheduledAt;
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}
