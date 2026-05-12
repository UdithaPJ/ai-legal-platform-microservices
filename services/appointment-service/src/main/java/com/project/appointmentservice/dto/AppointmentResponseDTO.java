package com.project.appointmentservice.dto;

import com.project.appointmentservice.model.AppointmentStatus;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;

@Data
@Builder
public class AppointmentResponseDTO {
    private Long id;
    private Long clientId;
    private Long lawyerId;
    private String lawyerName;       // Fetched from lawyer-service and embedded
    private LocalDateTime appointmentDateTime;
    private Integer durationMinutes;
    private String description;
    private AppointmentStatus status;
    private String lawyerNote;
    private Double consultationFee;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}