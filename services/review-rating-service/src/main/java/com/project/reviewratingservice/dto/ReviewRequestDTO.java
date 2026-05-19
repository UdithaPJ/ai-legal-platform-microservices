package com.project.reviewratingservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.UUID;

@Data
public class ReviewRequestDTO {

    @NotNull(message = "Lawyer ID is required")
    private Long lawyerId;

    @NotNull(message = "Client ID is required")
    private UUID clientId;

    @NotNull(message = "Appointment ID is required")
    private Long appointmentId;

    @NotNull(message = "Rating is required")
    @Min(value = 1, message = "Rating must be at least 1")
    @Max(value = 5, message = "Rating must be at most 5")
    private Integer rating;

    @Size(max = 1000, message = "Comment must not exceed 1000 characters")
    private String comment;
}