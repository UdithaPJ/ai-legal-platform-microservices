package com.project.appointmentservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.math.BigDecimal;
import java.time.OffsetDateTime;
import java.time.ZoneOffset;
import java.util.UUID;

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
    private UUID clientId;

    // ID from lawyer-service (the lawyer being booked)
    @Column(nullable = false)
    private UUID lawyerId;

    // Requested date and time for the consultation
    @Column
    private OffsetDateTime appointmentDateTime;

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

    @Column(name = "meeting_url", columnDefinition = "TEXT")
    private String meetingUrl;

    // Consultation fee snapshot at booking time
    // (fee may change later; we store what was agreed at booking)
    @Column(nullable = false)
    private BigDecimal consultationFee;

    @Column(name = "created_at", updatable = false)
    private OffsetDateTime createdAt;

    @Column(name = "updated_at")
    private OffsetDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = OffsetDateTime.now(ZoneOffset.UTC);
        updatedAt = OffsetDateTime.now(ZoneOffset.UTC);
        if (status == null) status = AppointmentStatus.REQUESTED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = OffsetDateTime.now(ZoneOffset.UTC);
    }
}
