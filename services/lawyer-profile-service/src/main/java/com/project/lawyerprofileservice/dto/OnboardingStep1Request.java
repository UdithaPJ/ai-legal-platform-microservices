package com.project.lawyerprofileservice.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import lombok.Data;

/** Step 1 — Professional Information */
@Data
public class OnboardingStep1Request {

    @NotNull(message = "Years of experience is required")
    @Min(value = 0, message = "Years of experience must be 0 or more")
    private Integer yearsOfExperience;

    @NotBlank(message = "Bio is required")
    private String bio;
}
