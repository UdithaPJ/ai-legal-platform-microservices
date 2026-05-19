package com.project.reviewratingservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "reviews")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Review {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // Lawyer profile service ID (Long, PK of lawyer table)
    @Column(nullable = false)
    private Long lawyerId;

    // User service UUID of the client submitting the review
    @Column(nullable = false)
    private UUID clientId;

    // Appointment that this review is for — one review per appointment
    @Column(nullable = false, unique = true)
    private Long appointmentId;

    // 1 to 5 star rating
    @Column(nullable = false)
    private Integer rating;

    // Optional written comment
    @Column(columnDefinition = "TEXT")
    private String comment;

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
}