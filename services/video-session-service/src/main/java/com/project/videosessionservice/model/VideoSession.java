package com.project.videosessionservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

@Entity
@Table(name = "video_sessions")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class VideoSession {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    // One session per appointment — enforced at DB and service level
    @Column(nullable = false, unique = true)
    private Long appointmentId;

    // Jitsi room name — used to build the meeting URL
    // Format: legal-platform-{appointmentId}-{uuid-suffix}
    @Column(nullable = false, unique = true)
    private String roomName;

    // Full Jitsi Meet URL both participants open in their browser
    @Column(nullable = false)
    private String meetingUrl;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private SessionStatus status;

    // Copied from appointment — when the session is scheduled for
    @Column(nullable = false)
    private LocalDateTime scheduledAt;

    // Timestamps for when the session was actually used
    private LocalDateTime startedAt;
    private LocalDateTime endedAt;

    @Column(name = "created_at", updatable = false)
    private LocalDateTime createdAt;

    @Column(name = "updated_at")
    private LocalDateTime updatedAt;

    @PrePersist
    protected void onCreate() {
        createdAt = LocalDateTime.now();
        updatedAt = LocalDateTime.now();
        if (status == null) status = SessionStatus.SCHEDULED;
    }

    @PreUpdate
    protected void onUpdate() {
        updatedAt = LocalDateTime.now();
    }
}