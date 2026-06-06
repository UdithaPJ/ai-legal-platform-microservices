package com.project.lawyerprofileservice.service;

import com.project.lawyerprofileservice.dto.*;
import com.project.lawyerprofileservice.model.Lawyer;
import com.project.lawyerprofileservice.model.LawyerDocument;
import com.project.lawyerprofileservice.model.VerificationStatus;
import com.project.lawyerprofileservice.repository.LawyerDocumentRepository;
import com.project.lawyerprofileservice.repository.LawyerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

/**
 * Handles each step of the lawyer onboarding wizard.
 *
 * <p>All write operations find the lawyer by {@code userId} (= Keycloak ID).
 * Steps are saved independently so that the lawyer can resume the wizard
 * after navigating away.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class LawyerOnboardingService {

    private final LawyerRepository         lawyerRepository;
    private final LawyerDocumentRepository documentRepository;

    // ── Step 1: Professional Information ─────────────────────────────────────

    @Transactional
    public LawyerResponseDTO saveStep1(UUID userId, OnboardingStep1Request request) {
        Lawyer lawyer = findLawyerByUserId(userId);
        requireStatus(lawyer, VerificationStatus.PENDING_ONBOARDING,
                VerificationStatus.REJECTED); // allow re-onboarding after rejection

        lawyer.setYearsOfExperience(request.getYearsOfExperience());
        lawyer.setBio(request.getBio());

        return mapToResponse(lawyerRepository.save(lawyer));
    }

    // ── Step 2: Practice Areas ────────────────────────────────────────────────

    @Transactional
    public LawyerResponseDTO saveStep2(UUID userId, OnboardingStep2Request request) {
        Lawyer lawyer = findLawyerByUserId(userId);
        requireStatus(lawyer, VerificationStatus.PENDING_ONBOARDING,
                VerificationStatus.REJECTED);

        lawyer.setSpecializations(request.getSpecializations());

        return mapToResponse(lawyerRepository.save(lawyer));
    }

    // ── Step 3: Consultation Settings ────────────────────────────────────────

    @Transactional
    public LawyerResponseDTO saveStep3(UUID userId, OnboardingStep3Request request) {
        Lawyer lawyer = findLawyerByUserId(userId);
        requireStatus(lawyer, VerificationStatus.PENDING_ONBOARDING,
                VerificationStatus.REJECTED);

        lawyer.setConsultationFee(request.getConsultationFee());
        lawyer.setLocation(request.getLocation());

        return mapToResponse(lawyerRepository.save(lawyer));
    }

    // ── Step 4: Document Upload ───────────────────────────────────────────────

    @Transactional
    public LawyerDocument saveDocument(UUID userId, DocumentUploadRequest request) {
        Lawyer lawyer = findLawyerByUserId(userId);
        requireStatus(lawyer, VerificationStatus.PENDING_ONBOARDING,
                VerificationStatus.REJECTED);

        LawyerDocument doc = LawyerDocument.builder()
                .lawyerId(lawyer.getId())
                .documentType(request.getDocumentType())
                .fileUrl(request.getFileUrl())
                .uploadedAt(LocalDateTime.now())
                .build();

        LawyerDocument saved = documentRepository.save(doc);
        log.info("Document saved lawyerId={} type={}", lawyer.getId(), request.getDocumentType());
        return saved;
    }

    public List<LawyerDocument> getDocuments(UUID userId) {
        Lawyer lawyer = findLawyerByUserId(userId);
        return documentRepository.findByLawyerId(lawyer.getId());
    }

    // ── Step 5: Submit for Verification ──────────────────────────────────────

    @Transactional
    public LawyerResponseDTO submitForVerification(UUID userId) {
        Lawyer lawyer = findLawyerByUserId(userId);
        requireStatus(lawyer, VerificationStatus.PENDING_ONBOARDING,
                VerificationStatus.REJECTED);

        // Basic completeness check
        if (lawyer.getYearsOfExperience() == null) {
            throw new IllegalStateException("Complete Step 1 before submitting.");
        }
        if (lawyer.getSpecializations() == null || lawyer.getSpecializations().isEmpty()) {
            throw new IllegalStateException("Complete Step 2 before submitting.");
        }
        if (lawyer.getConsultationFee() == null || lawyer.getLocation() == null) {
            throw new IllegalStateException("Complete Step 3 before submitting.");
        }

        List<LawyerDocument> docs = documentRepository.findByLawyerId(lawyer.getId());
        if (docs.isEmpty()) {
            throw new IllegalStateException("Upload at least one document before submitting.");
        }

        lawyer.setVerificationStatus(VerificationStatus.PENDING_VERIFICATION);
        log.info("Lawyer userId={} submitted for verification", userId);

        return mapToResponse(lawyerRepository.save(lawyer));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    public LawyerResponseDTO getOnboardingStatus(UUID userId) {
        return mapToResponse(findLawyerByUserId(userId));
    }

    private Lawyer findLawyerByUserId(UUID userId) {
        return lawyerRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Lawyer profile not found for userId: " + userId));
    }

    private void requireStatus(Lawyer lawyer, VerificationStatus... allowed) {
        for (VerificationStatus s : allowed) {
            if (lawyer.getVerificationStatus() == s) return;
        }
        throw new IllegalStateException(
                "Action not permitted in status: " + lawyer.getVerificationStatus());
    }

    private LawyerResponseDTO mapToResponse(Lawyer l) {
        return LawyerResponseDTO.builder()
                .id(l.getId())
                .userId(l.getUserId())
                .barRegistrationNumber(l.getBarRegistrationNumber())
                .specializations(l.getSpecializations())
                .yearsOfExperience(l.getYearsOfExperience())
                .bio(l.getBio())
                .consultationFee(l.getConsultationFee())
                .location(l.getLocation())
                .isAvailable(l.getIsAvailable())
                .verificationStatus(l.getVerificationStatus())
                .averageRating(l.getAverageRating())
                .reviewCount(l.getReviewCount())
                .createdAt(l.getCreatedAt())
                .updatedAt(l.getUpdatedAt())
                .build();
    }
}
