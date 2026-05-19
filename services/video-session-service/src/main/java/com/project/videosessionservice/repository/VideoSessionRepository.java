package com.project.videosessionservice.repository;

import com.project.videosessionservice.model.VideoSession;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.Optional;

@Repository
public interface VideoSessionRepository extends JpaRepository<VideoSession, Long> {

    // Primary lookup — most operations use appointmentId
    Optional<VideoSession> findByAppointmentId(Long appointmentId);

    // Guard against duplicate session creation
    boolean existsByAppointmentId(Long appointmentId);
}