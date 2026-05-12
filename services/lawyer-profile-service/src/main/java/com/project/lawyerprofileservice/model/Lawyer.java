package com.project.lawyerprofileservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.List;

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
    private Long userId;

    @Column(nullable = false)
    private String fullName;

    @Column(nullable = false, unique = true)
    private String email;

    @Column(nullable = false)
    private String phone;

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

    @Column(nullable = false)
    private Integer yearsOfExperience;

    @Column(columnDefinition = "TEXT")
    private String bio;

    @Column(nullable = false)
    private Double consultationFee;

    private String location;

    private String profilePhotoUrl;

    @Column(nullable = false)
    private Boolean isAvailable;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (isAvailable == null) isAvailable = true;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}