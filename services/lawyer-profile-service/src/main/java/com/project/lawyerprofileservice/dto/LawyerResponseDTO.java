package com.project.lawyerprofileservice.dto;

import com.project.lawyerprofileservice.model.Specialization;
import lombok.Builder;
import lombok.Data;

import java.time.LocalDateTime;
import java.util.List;

@Data
@Builder
public class LawyerResponseDTO {
    private Long id;
    private Long userId;
    private String fullName;
    private String email;
    private String phone;
    private String barRegistrationNumber;
    private List<Specialization> specializations;
    private Integer yearsOfExperience;
    private String bio;
    private Double consultationFee;
    private String location;
    private String profilePhotoUrl;
    private Boolean isAvailable;
    private LocalDateTime createdAt;
    private LocalDateTime updatedAt;
}