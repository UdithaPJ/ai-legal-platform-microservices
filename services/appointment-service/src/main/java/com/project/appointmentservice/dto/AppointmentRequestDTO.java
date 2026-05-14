package com.project.appointmentservice.dto;

import jakarta.validation.constraints.*;
import lombok.Data;

import java.time.LocalDateTime;

@Data
public class AppointmentRequestDTO {

    @NotNull(message = "Client ID is required")
    private Long clientId;

    @NotNull(message = "Lawyer ID is required")
    private Long lawyerId;

    @NotNull(message = "Appointment date and time is required")
    @Future(message = "Appointment must be scheduled in the future")
    private LocalDateTime appointmentDateTime;

    @NotNull(message = "Duration is required")
    @Min(value = 30, message = "Minimum duration is 30 minutes")
    @Max(value = 180, message = "Maximum duration is 180 minutes")
    private Integer durationMinutes;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 1000, message = "Description must be between 10 and 1000 characters")
    private String description;
}