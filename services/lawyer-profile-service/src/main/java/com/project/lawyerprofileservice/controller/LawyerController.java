package com.project.lawyerprofileservice.controller;

import com.project.lawyerprofileservice.dto.LawyerRequestDTO;
import com.project.lawyerprofileservice.dto.LawyerResponseDTO;
import com.project.lawyerprofileservice.service.LawyerService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/lawyers")
@RequiredArgsConstructor
public class LawyerController {

    private final LawyerService lawyerService;

    @PostMapping
    public ResponseEntity<LawyerResponseDTO> createProfile(
            @Valid @RequestBody LawyerRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(lawyerService.createProfile(request));
    }

    @GetMapping
    public ResponseEntity<List<LawyerResponseDTO>> getAllLawyers() {
        return ResponseEntity.ok(lawyerService.getAllLawyers());
    }

    @GetMapping("/{id}")
    public ResponseEntity<LawyerResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(lawyerService.getById(id));
    }

    @GetMapping("/user/{userId}")
    public ResponseEntity<LawyerResponseDTO> getByUserId(@PathVariable UUID userId) {
        return ResponseEntity.ok(lawyerService.getByUserId(userId));
    }

    @GetMapping("/specialization/{type}")
    public ResponseEntity<List<LawyerResponseDTO>> getBySpecialization(
            @PathVariable String type) {
        return ResponseEntity.ok(lawyerService.getBySpecialization(type));
    }

    @GetMapping("/available")
    public ResponseEntity<List<LawyerResponseDTO>> getAvailableLawyers() {
        return ResponseEntity.ok(lawyerService.getAvailableLawyers());
    }

//    @GetMapping("/search")
//    public ResponseEntity<List<LawyerResponseDTO>> search(
//            @RequestParam String keyword) {
//        return ResponseEntity.ok(lawyerService.search(keyword));
//    }

    @PutMapping("/{id}")
    public ResponseEntity<LawyerResponseDTO> updateProfile(
            @PathVariable Long id,
            @Valid @RequestBody LawyerRequestDTO request) {
        return ResponseEntity.ok(lawyerService.updateProfile(id, request));
    }

    @PatchMapping("/{id}/availability")
    public ResponseEntity<LawyerResponseDTO> toggleAvailability(@PathVariable Long id) {
        return ResponseEntity.ok(lawyerService.toggleAvailability(id));
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteProfile(@PathVariable Long id) {
        lawyerService.deleteProfile(id);
        return ResponseEntity.noContent().build();
    }
}