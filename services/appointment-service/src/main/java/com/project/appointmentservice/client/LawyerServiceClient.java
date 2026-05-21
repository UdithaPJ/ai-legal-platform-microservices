package com.project.appointmentservice.client;

import com.project.appointmentservice.dto.LawyerResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

// "lawyer-service" must exactly match spring.application.name in lawyer-service
@FeignClient(name = "lawyer-service")
public interface LawyerServiceClient {

    @GetMapping("/lawyers/{id}")
    LawyerResponseDTO getLawyerById(@PathVariable("id") Long id);

    @GetMapping("/lawyers/user/{userId}")
    LawyerResponseDTO getLawyerByUserId(@PathVariable("userId") UUID userId);
}