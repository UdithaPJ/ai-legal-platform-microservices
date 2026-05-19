package com.project.reviewratingservice.dto;

import lombok.Data;
import java.util.UUID;

@Data
public class UserResponseDTO {
    private UUID id;
    private String fullName;
    private String email;
}