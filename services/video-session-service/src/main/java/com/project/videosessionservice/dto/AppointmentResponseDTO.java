package com.project.videosessionservice.dto;

import lombok.Data;
import java.time.LocalDateTime;

@Data
public class AppointmentResponseDTO {
    private Long id;
    private Long clientId;
    private Long lawyerId;
    private String status;               // must be "CONFIRMED"
    private LocalDateTime appointmentDateTime;
}