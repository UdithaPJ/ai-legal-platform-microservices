package com.project.videosessionservice.controller;

import com.project.videosessionservice.dto.CreateVideoSessionRequestDTO;
import com.project.videosessionservice.dto.VideoSessionResponseDTO;
import com.project.videosessionservice.service.VideoSessionService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

@RestController
@RequestMapping("/video-sessions")
@RequiredArgsConstructor
public class VideoSessionController {

    private final VideoSessionService videoSessionService;

    @PostMapping("/appointment/{appointmentId}")
    public ResponseEntity<VideoSessionResponseDTO> createSession(
            @PathVariable Long appointmentId,
            @Valid @RequestBody CreateVideoSessionRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(videoSessionService.createSession(appointmentId, request));
    }

    @GetMapping("/{id}")
    public ResponseEntity<VideoSessionResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(videoSessionService.getById(id));
    }

    @GetMapping("/appointment/{appointmentId}")
    public ResponseEntity<VideoSessionResponseDTO> getByAppointmentId(
            @PathVariable Long appointmentId) {
        return ResponseEntity.ok(videoSessionService.getByAppointmentId(appointmentId));
    }

    @PostMapping("/appointment/{appointmentId}/join")
    public ResponseEntity<VideoSessionResponseDTO> joinSession(
            @PathVariable Long appointmentId) {
        return ResponseEntity.ok(videoSessionService.joinSession(appointmentId));
    }

    @PostMapping("/appointment/{appointmentId}/end")
    public ResponseEntity<VideoSessionResponseDTO> endSession(
            @PathVariable Long appointmentId) {
        return ResponseEntity.ok(videoSessionService.endSession(appointmentId));
    }
}
