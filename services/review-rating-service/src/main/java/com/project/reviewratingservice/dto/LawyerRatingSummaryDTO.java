package com.project.reviewratingservice.dto;

import lombok.Builder;
import lombok.Data;

@Data
@Builder
public class LawyerRatingSummaryDTO {
    private Long lawyerId;
    private Double averageRating;     // rounded to 1 decimal place
    private Integer totalReviews;
    private Integer fiveStars;
    private Integer fourStars;
    private Integer threeStars;
    private Integer twoStars;
    private Integer oneStar;
}