package com.project.videosessionservice.dto;

import lombok.Data;
import java.time.OffsetDateTime;
import java.util.UUID;

@Data
public class AppointmentResponseDTO {
    private Long id;
    private UUID clientId;
    private UUID lawyerId;
    private String status;               // must be "CONFIRMED"
    private OffsetDateTime appointmentDateTime;
}