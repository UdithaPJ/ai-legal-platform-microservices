package com.project.lawyerprofileservice.dto;

import jakarta.validation.constraints.DecimalMin;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.math.BigDecimal;

/** Step 3 — Consultation Settings */
@Data
public class OnboardingStep3Request {

    @NotNull(message = "Consultation fee is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Fee must be greater than zero")
    private BigDecimal consultationFee;

    @NotBlank(message = "Location is required")
    private String location;
}
