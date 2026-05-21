package com.project.reviewratingservice.dto;

import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.UUID;

@Data
@Builder
public class ReviewResponseDTO {
    private Long id;
    private UUID lawyerId;
    private UUID clientId;
    private String clientName;       // resolved from user-service
    private Long appointmentId;
    private Integer rating;
    private String comment;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}