package com.project.appointmentservice.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class UserResponseDTO {
    private UUID id;
    private String fullName;
    private String email;
}
//public class UserResponseDTO {
//    private UUID id;
//    private String email;
//    private String fullName;
//    private String phone;
//    private String role;
//    private String profilePictureUrl;
//}