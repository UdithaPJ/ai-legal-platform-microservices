package com.project.user.service.impl;

import com.project.user.dto.CreateUserRequest;
import com.project.user.dto.UpdateUserRequest;
import com.project.user.dto.UserResponse;
import com.project.user.exception.ResourceNotFoundException;
import com.project.user.model.User;
import com.project.user.repository.UserRepository;
import com.project.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
@Slf4j
public class UserServiceImpl implements UserService {

    private final UserRepository userRepository;

    @Value("${file.upload-dir}")
    private String uploadDir;

    @Override
    public UserResponse createUser(CreateUserRequest request) {

        // ── Validate all required fields before any DB operation ─────────────
        // Validating here catches null values from ANY caller (Kafka consumer,
        // REST controller, future integrations) and surfaces them as a clear
        // application error rather than a cryptic DB constraint message.

        if (isBlank(request.getKeycloakId())) {
            throw new IllegalArgumentException("keycloakId is required");
        }

        UUID userId;
        try {
            userId = UUID.fromString(request.getKeycloakId());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("keycloakId must be a valid UUID");
        }

        if (isBlank(request.getEmail())) {
            throw new IllegalArgumentException("email is required");
        }

        // fullName guard — the field that produced the NOT NULL constraint error.
        // Common root cause: auth.ts used kp.name (Keycloak OIDC "name" claim)
        // which is null when the registration form sets "full_name" as a custom
        // attribute instead of Keycloak's built-in firstName/lastName fields.
        if (isBlank(request.getFullName())) {
            throw new IllegalArgumentException(
                    "fullName is required (received: '" + request.getFullName() + "'). " +
                    "Ensure the Keycloak SPI reads the 'full_name' user attribute, " +
                    "not getFirstName()/getLastName() which Keycloakify may not populate.");
        }

        if (isBlank(request.getRole())) {
            throw new IllegalArgumentException("role is required");
        }

        if (userRepository.existsById(userId)) {
            throw new IllegalArgumentException("User already exists");
        }

        // ── Diagnostic log — shows the complete request before persisting ────
        log.info("[UserServiceImpl] Creating user: keycloakId={} email='{}' fullName='{}' phone='{}' role='{}'",
                request.getKeycloakId(),
                request.getEmail(),
                request.getFullName(),
                request.getPhone(),
                request.getRole());

        User user = User.builder()
                .id(userId)
                .keycloakId(request.getKeycloakId())
                .email(request.getEmail())
                .fullName(request.getFullName())
                .phone(request.getPhone())
                .role(request.getRole())
                .createdAt(LocalDateTime.now())
                .updatedAt(LocalDateTime.now())
                .build();

        userRepository.save(user);

        log.info("[UserServiceImpl] User persisted: id={} keycloakId={} role={}",
                user.getId(), user.getKeycloakId(), user.getRole());

        return mapToResponse(user);
    }

    @Override
    public UserResponse getUser(UUID id) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        return mapToResponse(user);
    }

    @Override
    public UserResponse getUserByKeycloakId(String keycloakId) {
        User user = userRepository.findByKeycloakId(keycloakId)
                .orElseThrow(() -> new ResourceNotFoundException("User not found for keycloakId: " + keycloakId));
        return mapToResponse(user);
    }

    @Override
    public List<UserResponse> getAllUsers() {
        return userRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    @Override
    public UserResponse updateUser(UUID id, UpdateUserRequest request) {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));
        user.setFullName(request.getFullName());
        user.setPhone(request.getPhone());
        user.setUpdatedAt(LocalDateTime.now());
        userRepository.save(user);
        return mapToResponse(user);
    }

    @Override
    public String uploadProfilePicture(UUID id, MultipartFile file) throws IOException {
        User user = userRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException("User not found"));

        File directory = new File(uploadDir);
        if (!directory.exists()) directory.mkdirs();

        String fileName = UUID.randomUUID() + "_" + file.getOriginalFilename();
        Path filePath = Paths.get(uploadDir, fileName);
        Files.copy(file.getInputStream(), filePath);

        String imageUrl = "/uploads/profile-pictures/" + fileName;
        user.setProfilePictureUrl(imageUrl);
        userRepository.save(user);
        return imageUrl;
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private UserResponse mapToResponse(User user) {
        return UserResponse.builder()
                .id(user.getId())
                .email(user.getEmail())
                .fullName(user.getFullName())
                .phone(user.getPhone())
                .role(user.getRole())
                .profilePictureUrl(user.getProfilePictureUrl())
                .build();
    }
}
