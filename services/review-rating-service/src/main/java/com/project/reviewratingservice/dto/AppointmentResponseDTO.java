package com.project.reviewratingservice.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class AppointmentResponseDTO {
    private Long id;
    private UUID lawyerId;
    private UUID clientId;
    private String status;        // "COMPLETED" is required before review allowed
}