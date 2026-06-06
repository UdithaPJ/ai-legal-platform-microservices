package com.project.lawyerprofileservice.controller;

import com.project.lawyerprofileservice.dto.*;
import com.project.lawyerprofileservice.model.LawyerDocument;
import com.project.lawyerprofileservice.service.LawyerOnboardingService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

/**
 * Onboarding wizard endpoints for authenticated lawyers.
 *
 * All paths are under {@code /lawyers/onboarding/{userId}} where {@code userId}
 * is the Keycloak subject (UUID).  The API Gateway should ensure that the JWT
 * subject matches the {@code userId} path variable before forwarding requests.
 */
@RestController
@RequestMapping("/lawyers/onboarding/{userId}")
@RequiredArgsConstructor
public class LawyerOnboardingController {

    private final LawyerOnboardingService onboardingService;

    /** GET current onboarding status — called by the frontend on page load. */
    @GetMapping
    public ResponseEntity<LawyerResponseDTO> getStatus(@PathVariable UUID userId) {
        return ResponseEntity.ok(onboardingService.getOnboardingStatus(userId));
    }

    /** Step 1 — Professional Information (years of experience + bio). */
    @PutMapping("/step1")
    public ResponseEntity<LawyerResponseDTO> saveStep1(
            @PathVariable UUID userId,
            @Valid @RequestBody OnboardingStep1Request request) {
        return ResponseEntity.ok(onboardingService.saveStep1(userId, request));
    }

    /** Step 2 — Practice Areas (specializations). */
    @PutMapping("/step2")
    public ResponseEntity<LawyerResponseDTO> saveStep2(
            @PathVariable UUID userId,
            @Valid @RequestBody OnboardingStep2Request request) {
        return ResponseEntity.ok(onboardingService.saveStep2(userId, request));
    }

    /** Step 3 — Consultation Settings (fee + location). */
    @PutMapping("/step3")
    public ResponseEntity<LawyerResponseDTO> saveStep3(
            @PathVariable UUID userId,
            @Valid @RequestBody OnboardingStep3Request request) {
        return ResponseEntity.ok(onboardingService.saveStep3(userId, request));
    }

    /** Step 4a — Upload a verification document. */
    @PostMapping("/documents")
    public ResponseEntity<LawyerDocument> uploadDocument(
            @PathVariable UUID userId,
            @Valid @RequestBody DocumentUploadRequest request) {
        return ResponseEntity.ok(onboardingService.saveDocument(userId, request));
    }

    /** Step 4b — List uploaded documents. */
    @GetMapping("/documents")
    public ResponseEntity<List<LawyerDocument>> getDocuments(@PathVariable UUID userId) {
        return ResponseEntity.ok(onboardingService.getDocuments(userId));
    }

    /**
     * Step 5 — Submit profile for admin review.
     * Changes verificationStatus to PENDING_VERIFICATION.
     */
    @PostMapping("/submit")
    public ResponseEntity<LawyerResponseDTO> submit(@PathVariable UUID userId) {
        return ResponseEntity.ok(onboardingService.submitForVerification(userId));
    }
}
