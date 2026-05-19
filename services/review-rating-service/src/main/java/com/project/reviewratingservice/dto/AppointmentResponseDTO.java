package com.project.reviewratingservice.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class AppointmentResponseDTO {
    private Long id;
    private Long lawyerId;
    private Long clientId;        // appointment-service uses Long for clientId
    private String status;        // "COMPLETED" is required before review allowed
}