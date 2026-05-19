package com.project.videosessionservice.controller;

import com.project.videosessionservice.dto.VideoSessionResponseDTO;
import com.project.videosessionservice.service.VideoSessionService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/video-sessions")
@RequiredArgsConstructor
public class VideoSessionController {

    private final VideoSessionService videoSessionService;

    // POST /video-sessions/appointment/{appointmentId}
    // Creates a session for a confirmed appointment.
    // Called by the lawyer or system after the appointment is confirmed.
    @PostMapping("/appointment/{appointmentId}")
    public ResponseEntity<VideoSessionResponseDTO> createSession(
            @PathVariable Long appointmentId) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(videoSessionService.createSession(appointmentId));
    }

    // GET /video-sessions/{id}
    // Get session by session ID
    @GetMapping("/{id}")
    public ResponseEntity<VideoSessionResponseDTO> getById(
            @PathVariable Long id) {
        return ResponseEntity.ok(videoSessionService.getById(id));
    }

    // GET /video-sessions/appointment/{appointmentId}
    // Primary lookup — frontend uses appointmentId to get the meeting URL
    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<VideoSessionResponseDTO> getByAppointmentId(
            @PathVariable Long appointmentId) {
        return ResponseEntity.ok(
                videoSessionService.getByAppointmentId(appointmentId));
    }

    // POST /video-sessions/appointment/{appointmentId}/join
    // Called when a participant opens the meeting.
    // Transitions SCHEDULED → ACTIVE.
    @PostMapping("/appointment/{appointmentId}/join")
    public ResponseEntity<VideoSessionResponseDTO> joinSession(
            @PathVariable Long appointmentId) {
        return ResponseEntity.ok(videoSessionService.joinSession(appointmentId));
    }

    // POST /video-sessions/appointment/{appointmentId}/end
    // Called when the consultation finishes.
    // Transitions ACTIVE → ENDED.
    @PostMapping("/appointment/{appointmentId}/end")
    public ResponseEntity<VideoSessionResponseDTO> endSession(
            @PathVariable Long appointmentId) {
        return ResponseEntity.ok(videoSessionService.endSession(appointmentId));
    }
}