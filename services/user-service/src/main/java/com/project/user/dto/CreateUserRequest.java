package com.project.user.dto;

import lombok.Data;

@Data
public class CreateUserRequest {

    private String keycloakId;
    private String email;
    private String fullName;
    private String phone;
    private String role;
}