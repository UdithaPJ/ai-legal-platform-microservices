package com.project.lawyerprofileservice.service;

import com.project.lawyerprofileservice.dto.LawyerRequestDTO;
import com.project.lawyerprofileservice.dto.LawyerResponseDTO;
import com.project.lawyerprofileservice.model.Lawyer;
import com.project.lawyerprofileservice.model.Specialization;
import com.project.lawyerprofileservice.repository.LawyerRepository;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;

import java.util.List;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class LawyerService {

    private final LawyerRepository lawyerRepository;

    public LawyerResponseDTO createProfile(LawyerRequestDTO request) {
        if (lawyerRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("A lawyer profile with this email already exists");
        }
        if (lawyerRepository.existsByBarRegistrationNumber(request.getBarRegistrationNumber())) {
            throw new IllegalArgumentException("A lawyer with this bar registration number already exists");
        }
        if (lawyerRepository.existsByUserId(request.getUserId())) {
            throw new IllegalArgumentException("A profile already exists for this user");
        }

        Lawyer lawyer = Lawyer.builder()
                .userId(request.getUserId())
                .fullName(request.getFullName())
                .email(request.getEmail())
                .phone(request.getPhone())
                .barRegistrationNumber(request.getBarRegistrationNumber())
                .specializations(request.getSpecializations())
                .yearsOfExperience(request.getYearsOfExperience())
                .bio(request.getBio())
                .consultationFee(request.getConsultationFee())
                .location(request.getLocation())
                .profilePhotoUrl(request.getProfilePhotoUrl())
                .isAvailable(request.getIsAvailable() != null ? request.getIsAvailable() : true)
                .build();

        Lawyer saved = lawyerRepository.save(lawyer);
        log.info("Lawyer profile created with id: {}", saved.getId());
        return mapToResponse(saved);
    }

    public List<LawyerResponseDTO> getAllLawyers() {
        return lawyerRepository.findAll()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public LawyerResponseDTO getById(Long id) {
        Lawyer lawyer = lawyerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lawyer not found with id: " + id));
        return mapToResponse(lawyer);
    }

    public LawyerResponseDTO getByUserId(Long userId) {
        Lawyer lawyer = lawyerRepository.findByUserId(userId)
                .orElseThrow(() -> new IllegalArgumentException("Lawyer profile not found for userId: " + userId));
        return mapToResponse(lawyer);
    }

    public List<LawyerResponseDTO> getBySpecialization(String specializationType) {
        Specialization specialization;
        try {
            specialization = Specialization.valueOf(specializationType.toUpperCase());
        } catch (IllegalArgumentException e) {
            throw new IllegalArgumentException("Invalid specialization type: " + specializationType);
        }
        return lawyerRepository.findBySpecialization(specialization)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<LawyerResponseDTO> getAvailableLawyers() {
        return lawyerRepository.findByIsAvailableTrue()
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public List<LawyerResponseDTO> search(String keyword) {
        return lawyerRepository.searchByKeyword(keyword)
                .stream()
                .map(this::mapToResponse)
                .collect(Collectors.toList());
    }

    public LawyerResponseDTO updateProfile(Long id, LawyerRequestDTO request) {
        Lawyer lawyer = lawyerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lawyer not found with id: " + id));

        if (!lawyer.getEmail().equals(request.getEmail())
                && lawyerRepository.existsByEmail(request.getEmail())) {
            throw new IllegalArgumentException("Email already in use by another lawyer");
        }

        lawyer.setFullName(request.getFullName());
        lawyer.setEmail(request.getEmail());
        lawyer.setPhone(request.getPhone());
        lawyer.setSpecializations(request.getSpecializations());
        lawyer.setYearsOfExperience(request.getYearsOfExperience());
        lawyer.setBio(request.getBio());
        lawyer.setConsultationFee(request.getConsultationFee());
        lawyer.setLocation(request.getLocation());
        lawyer.setProfilePhotoUrl(request.getProfilePhotoUrl());
        if (request.getIsAvailable() != null) {
            lawyer.setIsAvailable(request.getIsAvailable());
        }

        Lawyer updated = lawyerRepository.save(lawyer);
        log.info("Lawyer profile updated for id: {}", id);
        return mapToResponse(updated);
    }

    public LawyerResponseDTO toggleAvailability(Long id) {
        Lawyer lawyer = lawyerRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException("Lawyer not found with id: " + id));
        lawyer.setIsAvailable(!lawyer.getIsAvailable());
        return mapToResponse(lawyerRepository.save(lawyer));
    }

    public void deleteProfile(Long id) {
        if (!lawyerRepository.existsById(id)) {
            throw new IllegalArgumentException("Lawyer not found with id: " + id);
        }
        lawyerRepository.deleteById(id);
        log.info("Lawyer profile deleted for id: {}", id);
    }

    private LawyerResponseDTO mapToResponse(Lawyer lawyer) {
        return LawyerResponseDTO.builder()
                .id(lawyer.getId())
                .userId(lawyer.getUserId())
                .fullName(lawyer.getFullName())
                .email(lawyer.getEmail())
                .phone(lawyer.getPhone())
                .barRegistrationNumber(lawyer.getBarRegistrationNumber())
                .specializations(lawyer.getSpecializations())
                .yearsOfExperience(lawyer.getYearsOfExperience())
                .bio(lawyer.getBio())
                .consultationFee(lawyer.getConsultationFee())
                .location(lawyer.getLocation())
                .profilePhotoUrl(lawyer.getProfilePhotoUrl())
                .isAvailable(lawyer.getIsAvailable())
                .createdAt(lawyer.getCreatedAt())
                .updatedAt(lawyer.getUpdatedAt())
                .build();
    }
}