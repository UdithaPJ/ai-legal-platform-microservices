package com.project.lawyerprofileservice.dto;

import com.project.lawyerprofileservice.model.Specialization;
import jakarta.validation.constraints.NotEmpty;
import lombok.Data;

import java.util.List;

/** Step 2 — Practice Areas */
@Data
public class OnboardingStep2Request {

    @NotEmpty(message = "At least one specialization is required")
    private List<Specialization> specializations;
}
