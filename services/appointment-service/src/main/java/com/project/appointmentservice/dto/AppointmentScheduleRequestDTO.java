package com.project.appointmentservice.dto;

import jakarta.validation.constraints.Future;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class AppointmentScheduleRequestDTO {

    @NotNull(message = "Appointment date and time is required")
    @Future(message = "Appointment must be scheduled in the future")
    private OffsetDateTime appointmentDateTime;
}
