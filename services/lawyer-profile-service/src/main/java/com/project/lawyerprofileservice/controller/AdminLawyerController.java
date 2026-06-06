package com.project.lawyerprofileservice.controller;

import com.project.lawyerprofileservice.dto.AdminDecisionRequest;
import com.project.lawyerprofileservice.dto.LawyerResponseDTO;
import com.project.lawyerprofileservice.model.LawyerDocument;
import com.project.lawyerprofileservice.service.AdminVerificationService;
import lombok.RequiredArgsConstructor;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;

/**
 * Admin-only endpoints for the lawyer verification workflow.
 * The API Gateway should enforce that the caller holds the ADMIN realm role
 * before forwarding requests to these paths.
 */
@RestController
@RequestMapping("/admin/lawyers")
@RequiredArgsConstructor
public class AdminLawyerController {

    private final AdminVerificationService adminService;

    /** All lawyers across all statuses. */
    @GetMapping
    public ResponseEntity<List<LawyerResponseDTO>> getAll() {
        return ResponseEntity.ok(adminService.getAllForAdmin());
    }

    /** Lawyers awaiting review (status = PENDING_VERIFICATION). */
    @GetMapping("/pending")
    public ResponseEntity<List<LawyerResponseDTO>> getPending() {
        return ResponseEntity.ok(adminService.getPendingVerification());
    }

    /** Full profile details for a single lawyer. */
    @GetMapping("/{id}")
    public ResponseEntity<LawyerResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getById(id));
    }

    /** Uploaded verification documents for a lawyer. */
    @GetMapping("/{id}/documents")
    public ResponseEntity<List<LawyerDocument>> getDocuments(@PathVariable Long id) {
        return ResponseEntity.ok(adminService.getDocuments(id));
    }

    /**
     * Approve a lawyer.
     * Sets verificationStatus = VERIFIED and isAvailable = true.
     */
    @PostMapping("/{id}/approve")
    public ResponseEntity<LawyerResponseDTO> approve(
            @PathVariable Long id,
            @RequestBody(required = false) AdminDecisionRequest request) {
        return ResponseEntity.ok(adminService.approve(id));
    }

    /**
     * Reject a lawyer.
     * Sets verificationStatus = REJECTED and isAvailable = false.
     * The lawyer may re-submit after correcting their profile.
     */
    @PostMapping("/{id}/reject")
    public ResponseEntity<LawyerResponseDTO> reject(
            @PathVariable Long id,
            @RequestBody(required = false) AdminDecisionRequest request) {
        return ResponseEntity.ok(adminService.reject(id));
    }

    /**
     * Suspend a previously verified lawyer.
     */
    @PostMapping("/{id}/suspend")
    public ResponseEntity<LawyerResponseDTO> suspend(
            @PathVariable Long id,
            @RequestBody(required = false) AdminDecisionRequest request) {
        return ResponseEntity.ok(adminService.suspend(id));
    }
}
