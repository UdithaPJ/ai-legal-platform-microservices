package com.project.appointmentservice.client;

import com.project.appointmentservice.dto.CreateVideoSessionRequestDTO;
import com.project.appointmentservice.dto.VideoSessionResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;

@FeignClient(name = "video-session-service")
public interface VideoSessionServiceClient {

    @PostMapping("/video-sessions/appointment/{appointmentId}")
    VideoSessionResponseDTO createSession(
            @PathVariable("appointmentId") Long appointmentId,
            @RequestBody CreateVideoSessionRequestDTO request
    );
}
