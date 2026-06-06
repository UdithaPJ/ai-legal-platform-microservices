package com.project.lawyerprofileservice.service;

import com.project.lawyerprofileservice.dto.LawyerResponseDTO;
import com.project.lawyerprofileservice.model.Lawyer;
import com.project.lawyerprofileservice.model.LawyerDocument;
import com.project.lawyerprofileservice.model.VerificationStatus;
import com.project.lawyerprofileservice.repository.LawyerDocumentRepository;
import com.project.lawyerprofileservice.repository.LawyerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

/**
 * Admin-only operations for the lawyer verification workflow.
 */
@Service
@RequiredArgsConstructor
@Slf4j
public class AdminVerificationService {

    private final LawyerRepository         lawyerRepository;
    private final LawyerDocumentRepository documentRepository;

    /** All lawyers waiting for admin review. */
    public List<LawyerResponseDTO> getPendingVerification() {
        return lawyerRepository
                .findByVerificationStatus(VerificationStatus.PENDING_VERIFICATION)
                .stream()
                .map(this::mapToResponse)
                .toList();
    }

    /** All lawyers at any status (admin overview). */
    public List<LawyerResponseDTO> getAllForAdmin() {
        return lawyerRepository.findAll().stream()
                .map(this::mapToResponse)
                .toList();
    }

    public LawyerResponseDTO getById(Long id) {
        return mapToResponse(findById(id));
    }

    public List<LawyerDocument> getDocuments(Long lawyerId) {
        return documentRepository.findByLawyerId(lawyerId);
    }

    /**
     * Approve a lawyer:
     * <ul>
     *   <li>verificationStatus → VERIFIED</li>
     *   <li>isAvailable → true  (lawyer is now searchable)</li>
     * </ul>
     */
    @Transactional
    public LawyerResponseDTO approve(Long id) {
        Lawyer lawyer = findById(id);
        lawyer.setVerificationStatus(VerificationStatus.VERIFIED);
        lawyer.setIsAvailable(true);
        log.info("Admin approved lawyer id={} userId={}", id, lawyer.getUserId());
        return mapToResponse(lawyerRepository.save(lawyer));
    }

    /**
     * Reject a lawyer:
     * <ul>
     *   <li>verificationStatus → REJECTED</li>
     *   <li>isAvailable → false</li>
     * </ul>
     * The lawyer can re-submit after correcting their profile.
     */
    @Transactional
    public LawyerResponseDTO reject(Long id) {
        Lawyer lawyer = findById(id);
        lawyer.setVerificationStatus(VerificationStatus.REJECTED);
        lawyer.setIsAvailable(false);
        log.info("Admin rejected lawyer id={} userId={}", id, lawyer.getUserId());
        return mapToResponse(lawyerRepository.save(lawyer));
    }

    /**
     * Suspend a previously verified lawyer.
     */
    @Transactional
    public LawyerResponseDTO suspend(Long id) {
        Lawyer lawyer = findById(id);
        if (lawyer.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new IllegalStateException("Only VERIFIED lawyers can be suspended.");
        }
        lawyer.setVerificationStatus(VerificationStatus.SUSPENDED);
        lawyer.setIsAvailable(false);
        log.info("Admin suspended lawyer id={} userId={}", id, lawyer.getUserId());
        return mapToResponse(lawyerRepository.save(lawyer));
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    private Lawyer findById(Long id) {
        return lawyerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lawyer not found: " + id));
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
