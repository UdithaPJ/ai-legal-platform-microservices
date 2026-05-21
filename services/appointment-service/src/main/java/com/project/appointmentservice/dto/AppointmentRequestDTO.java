package com.project.appointmentservice.dto;

import jakarta.validation.constraints.Max;
import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import jakarta.validation.constraints.Size;
import lombok.Data;

import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class AppointmentRequestDTO {

    @NotNull(message = "Client ID is required")
    private UUID clientId;

    @NotNull(message = "Lawyer ID is required")
    private UUID lawyerId;

    // Optional preferred time. The final time is chosen during scheduling.
    private OffsetDateTime appointmentDateTime;

    @NotNull(message = "Duration is required")
    @Min(value = 30, message = "Minimum duration is 30 minutes")
    @Max(value = 180, message = "Maximum duration is 180 minutes")
    private Integer durationMinutes;

    @NotBlank(message = "Description is required")
    @Size(min = 10, max = 1000, message = "Description must be between 10 and 1000 characters")
    private String description;
}
