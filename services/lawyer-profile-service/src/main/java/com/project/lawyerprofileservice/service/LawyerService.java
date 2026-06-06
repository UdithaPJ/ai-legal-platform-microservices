package com.project.lawyerprofileservice.service;

import com.project.lawyerprofileservice.dto.LawyerRequestDTO;
import com.project.lawyerprofileservice.dto.LawyerResponseDTO;
import com.project.lawyerprofileservice.dto.LawyerUpdateRequestDTO;
import com.project.lawyerprofileservice.model.Lawyer;
import com.project.lawyerprofileservice.model.Specialization;
import com.project.lawyerprofileservice.model.VerificationStatus;
import com.project.lawyerprofileservice.repository.LawyerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LawyerService {

    private final LawyerRepository lawyerRepository;

    public LawyerResponseDTO createProfile(LawyerRequestDTO request) {
        if (lawyerRepository.existsByBarRegistrationNumber(request.getBarRegistrationNumber())) {
            throw new IllegalArgumentException("A lawyer with this bar registration number already exists");
        }
        if (lawyerRepository.existsByUserId(request.getUserId())) {
            throw new IllegalArgumentException("A profile already exists for this user");
        }

        Lawyer lawyer = Lawyer.builder()
                .userId(request.getUserId())
                .barRegistrationNumber(request.getBarRegistrationNumber())
                .specializations(request.getSpecializations())
                .yearsOfExperience(request.getYearsOfExperience())
                .bio(request.getBio())
                .consultationFee(request.getConsultationFee())
                .location(request.getLocation())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : false)
                // Profiles created via API are treated as already verified (admin-seeded data)
                .verificationStatus(VerificationStatus.VERIFIED)
                .build();

        Lawyer saved = lawyerRepository.save(lawyer);
        log.info("Lawyer profile created via REST id={}", saved.getId());
        return mapToResponse(saved);
    }

    /** Returns ALL lawyers — for admin/internal use only. */
    public List<LawyerResponseDTO> getAllLawyers() {
        return lawyerRepository.findAll().stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public LawyerResponseDTO getById(Long id) {
        return mapToResponse(lawyerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lawyer not found with id: " + id)));
    }

    public LawyerResponseDTO getByUserId(UUID userId) {
        return mapToResponse(lawyerRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Lawyer profile not found for userId: " + userId)));
    }

    /**
     * Client-facing search: only VERIFIED + available lawyers are returned.
     * This enforces Part 8 (search visibility rules).
     */
    public List<LawyerResponseDTO> getAvailableLawyers() {
        return lawyerRepository
                .findByIsAvailableTrueAndVerificationStatus(VerificationStatus.VERIFIED)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<LawyerResponseDTO> getBySpecialization(String specializationType) {
        Specialization specialization;
        try {
            specialization = Specialization.valueOf(specializationType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid specialization type: " + specializationType);
        }
        return lawyerRepository.findVerifiedBySpecialization(specialization).stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public LawyerResponseDTO updateProfile(Long id, LawyerUpdateRequestDTO request) {
        Lawyer lawyer = lawyerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lawyer not found with id: " + id));

        lawyer.setSpecializations(request.getSpecializations());
        lawyer.setYearsOfExperience(request.getYearsOfExperience());
        lawyer.setBio(request.getBio());
        lawyer.setConsultationFee(request.getConsultationFee());
        lawyer.setLocation(request.getLocation());
        if (request.getIsAvailable() != null) {
            lawyer.setIsAvailable(request.getIsAvailable());
        }

        log.info("Lawyer profile updated id={}", id);
        return mapToResponse(lawyerRepository.save(lawyer));
    }

    public LawyerResponseDTO toggleAvailability(Long id) {
        Lawyer lawyer = lawyerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lawyer not found with id: " + id));
        // Availability toggle is only meaningful for VERIFIED lawyers
        if (lawyer.getVerificationStatus() != VerificationStatus.VERIFIED) {
            throw new IllegalStateException("Only VERIFIED lawyers can toggle availability.");
        }
        lawyer.setIsAvailable(!lawyer.getIsAvailable());
        return mapToResponse(lawyerRepository.save(lawyer));
    }

    public void deleteProfile(Long id) {
        if (!lawyerRepository.existsById(id)) {
            throw new IllegalArgumentException("Lawyer not found with id: " + id);
        }
        lawyerRepository.deleteById(id);
        log.info("Lawyer profile deleted id={}", id);
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
