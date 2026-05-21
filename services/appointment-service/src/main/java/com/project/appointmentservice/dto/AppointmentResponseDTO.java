package com.project.appointmentservice.dto;

import com.project.appointmentservice.model.AppointmentStatus;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
@Builder
public class AppointmentResponseDTO {
    private Long id;
    private UUID clientId;
    private UUID lawyerId;
    private String lawyerName;       // Fetched from lawyer-service and embedded
    private OffsetDateTime appointmentDateTime;
    private Integer durationMinutes;
    private String description;
    private AppointmentStatus status;
    private String lawyerNote;
    private String meetingUrl;
    private BigDecimal consultationFee;
    private OffsetDateTime createdAt;
    private OffsetDateTime updatedAt;
}
