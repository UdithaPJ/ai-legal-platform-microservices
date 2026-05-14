package com.project.appointmentservice.dto;

import com.project.appointmentservice.model.AppointmentStatus;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

@Data
public class AppointmentStatusUpdateDTO {

    @NotNull(message = "Status is required")
    private AppointmentStatus status;

    // Optional note from the lawyer (e.g. reason for rejection)
    private String lawyerNote;
}