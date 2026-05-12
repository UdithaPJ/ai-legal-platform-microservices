package com.project.appointmentservice.dto;

import lombok.Data;

@Data
public class LawyerResponseDTO {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private Boolean isAvailable;
    private Double consultationFee;
}