package com.project.lawyerprofileservice.dto;

import com.project.lawyerprofileservice.model.Specialization;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.math.BigDecimal;
import java.util.List;

@Data
public class LawyerUpdateRequestDTO {

    @NotEmpty(message = "At least one specialization is required")
    private List<Specialization> specializations;

    @NotNull(message = "Years of experience is required")
    @Min(value = 0, message = "Years of experience cannot be negative")
    private Integer yearsOfExperience;

    private String bio;

    @NotNull(message = "Consultation fee is required")
    @DecimalMin(value = "0.0", inclusive = false,
            message = "Consultation fee must be positive")
    private BigDecimal consultationFee;

    private String location;

    private Boolean isAvailable;
}