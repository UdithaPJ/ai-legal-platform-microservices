package com.project.lawyerprofileservice.dto;

import com.project.lawyerprofileservice.model.Specialization;
import lombok.Builder;
import lombok.Data;

import java.math.BigDecimal;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Data
@Builder
public class LawyerResponseDTO {

    private Long id;

    private UUID userId;

    private String barRegistrationNumber;

    private List<Specialization> specializations;

    private Integer yearsOfExperience;

    private String bio;

    private BigDecimal consultationFee;

    private String location;

    private Boolean isAvailable;

    private BigDecimal averageRating;

    private Integer reviewCount;

    private LocalDateTime createdAt;

    private LocalDateTime updatedAt;
}