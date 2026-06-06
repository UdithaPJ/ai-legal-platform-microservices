package com.project.user.service;

import com.project.user.dto.CreateUserRequest;
import com.project.user.dto.UpdateUserRequest;
import com.project.user.dto.UserResponse;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.util.List;
import java.util.UUID;

public interface UserService {

	UserResponse createUser(CreateUserRequest request);

	UserResponse getUser(UUID id);

	UserResponse getUserByKeycloakId(String keycloakId);

	List<UserResponse> getAllUsers();

	UserResponse updateUser(UUID id, UpdateUserRequest request);

	String uploadProfilePicture(UUID id, MultipartFile file) throws IOException;
}