package com.project.lawyerprofileservice.dto;

import com.project.lawyerprofileservice.model.Specialization;
import jakarta.validation.constraints.*;
import lombok.Data;

import java.util.List;

@Data
public class LawyerRequestDTO {

    @NotNull(message = "User ID is required")
    private Long userId;

    @NotBlank(message = "Full name is required")
    private String fullName;

    @Email(message = "Invalid email format")
    @NotBlank(message = "Email is required")
    private String email;

    @NotBlank(message = "Phone number is required")
    private String phone;

    @NotBlank(message = "Bar registration number is required")
    private String barRegistrationNumber;

    @NotEmpty(message = "At least one specialization is required")
    private List<Specialization> specializations;

    @NotNull(message = "Years of experience is required")
    @Min(value = 0, message = "Years of experience cannot be negative")
    private Integer yearsOfExperience;

    private String bio;

    @NotNull(message = "Consultation fee is required")
    @DecimalMin(value = "0.0", inclusive = false, message = "Consultation fee must be positive")
    private Double consultationFee;

    private String location;

    private String profilePhotoUrl;

    private Boolean isAvailable;
}