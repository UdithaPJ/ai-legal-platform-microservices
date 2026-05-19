package com.project.videosessionservice.client;

import com.project.videosessionservice.dto.AppointmentResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

@FeignClient(name = "appointment-service")
public interface AppointmentServiceClient {

    @GetMapping("/appointments/{id}")
    AppointmentResponseDTO getAppointmentById(@PathVariable("id") Long id);
}