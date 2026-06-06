package com.project.lawyerprofileservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.math.RoundingMode;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Entity
@Table(name = "lawyers")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Lawyer {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(name = "user_id", nullable = false, unique = true)
    private UUID userId;

    @Column(nullable = false, unique = true)
    private String barRegistrationNumber;

    @Enumerated(EnumType.STRING)
    @ElementCollection(fetch = FetchType.EAGER)
    @CollectionTable(
            name = "lawyer_specializations",
            joinColumns = @JoinColumn(name = "lawyer_id")
    )
    @Column(name = "specialization")
    private List<Specialization> specializations;

    // Nullable: populated during onboarding Step 1
    @Column
    private Integer yearsOfExperience;

    @Column(columnDefinition = "TEXT")
    private String bio;

    // Nullable: populated during onboarding Step 3
    @Column(name = "consultation_fee", precision = 10, scale = 2)
    private BigDecimal consultationFee;

    private String location;

    // FALSE by default — flipped to TRUE only when admin sets VERIFIED
    @Column(nullable = false)
    @Builder.Default
    private Boolean isAvailable = false;

    @Column(name = "total_rating", nullable = false)
    @Builder.Default
    private Integer totalRating = 0;

    @Column(name = "review_count", nullable = false)
    @Builder.Default
    private Integer reviewCount = 0;

    @Column(name = "average_rating", nullable = false, precision = 10, scale = 2)
    @Builder.Default
    private BigDecimal averageRating = BigDecimal.ZERO;

    /**
     * Tracks the lawyer through the onboarding → admin-review lifecycle.
     * Default: PENDING_ONBOARDING (skeleton record created on registration).
     */
    @Enumerated(EnumType.STRING)
    @Column(name = "verification_status", nullable = false)
    @Builder.Default
    private VerificationStatus verificationStatus = VerificationStatus.PENDING_ONBOARDING;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }

    /** Updates the rolling average rating when a new review arrives. */
    public void applyNewRating(int rating) {
        int newTotal = (totalRating != null ? totalRating : 0) + rating;
        int newCount = (reviewCount != null ? reviewCount : 0) + 1;
        this.totalRating = newTotal;
        this.reviewCount = newCount;
        this.averageRating = newCount > 0
                ? BigDecimal.valueOf(newTotal).divide(BigDecimal.valueOf(newCount), 2, RoundingMode.HALF_UP)
                : BigDecimal.ZERO;
    }
}
