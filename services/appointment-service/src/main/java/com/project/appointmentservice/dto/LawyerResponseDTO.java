package com.project.appointmentservice.dto;

import lombok.Data;
import java.math.BigDecimal;
import java.util.UUID;

@Data
public class LawyerResponseDTO {
    private Long id;
    private UUID userId;
    private Boolean isAvailable;
    private BigDecimal consultationFee;
}