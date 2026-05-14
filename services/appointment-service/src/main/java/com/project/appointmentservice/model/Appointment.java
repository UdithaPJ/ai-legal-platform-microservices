package com.project.appointmentservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.LocalDateTime;

@Entity
@Table(name = "appointments")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class Appointment {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // ID from user-service (the client making the booking)
    @Column(nullable = false)
    private Long clientId;

    // ID from lawyer-service (the lawyer being booked)
    @Column(nullable = false)
    private Long lawyerId;

    // Requested date and time for the consultation
    @Column(nullable = false)
    private LocalDateTime appointmentDateTime;

    // Duration in minutes (e.g. 30, 60)
    @Column(nullable = false)
    private Integer durationMinutes;

    // What the client wants to discuss
    @Column(columnDefinition = "TEXT", nullable = false)
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AppointmentStatus status;

    // Optional note from the lawyer when accepting or rejecting
    @Column(columnDefinition = "TEXT")
    private String lawyerNote;

    // Consultation fee snapshot at booking time
    // (fee may change later; we store what was agreed at booking)
    @Column(nullable = false)
    private BigDecimal consultationFee;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = AppointmentStatus.PENDING;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}