package com.project.reviewratingservice.client;

import com.project.reviewratingservice.dto.UserResponseDTO;
import org.springframework.cloud.openfeign.FeignClient;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;

import java.util.UUID;

@FeignClient(name = "user-service")
public interface UserServiceClient {

    @GetMapping("/users/{id}")
    UserResponseDTO getUserById(@PathVariable("id") UUID id);
}