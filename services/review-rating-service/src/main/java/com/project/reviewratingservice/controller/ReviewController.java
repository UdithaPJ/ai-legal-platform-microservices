package com.project.reviewratingservice.controller;

import com.project.reviewratingservice.dto.*;
import com.project.reviewratingservice.service.ReviewService;
import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/reviews")
@RequiredArgsConstructor
public class ReviewController {

    private final ReviewService reviewService;

    // POST /reviews — Client submits a review
    @PostMapping
    public ResponseEntity<ReviewResponseDTO> submitReview(
            @Valid @RequestBody ReviewRequestDTO request) {
        return ResponseEntity.status(HttpStatus.CREATED)
                .body(reviewService.submitReview(request));
    }

    // GET /reviews/{id} — Get a single review
    @GetMapping("/{id}")
    public ResponseEntity<ReviewResponseDTO> getById(@PathVariable Long id) {
        return ResponseEntity.ok(reviewService.getById(id));
    }

    // GET /reviews/lawyer/{lawyerId} — All reviews for a lawyer
    @GetMapping("/lawyer/{lawyerId}")
    public ResponseEntity<List<ReviewResponseDTO>> getByLawyerId(
            @PathVariable Long lawyerId) {
        return ResponseEntity.ok(reviewService.getByLawyerId(lawyerId));
    }

    // GET /reviews/lawyer/{lawyerId}/summary — Rating breakdown for a lawyer
    // Called by lawyer-profile-service or frontend to display star ratings
    @GetMapping("/lawyer/{lawyerId}/summary")
    public ResponseEntity<LawyerRatingSummaryDTO> getRatingSummary(
            @PathVariable Long lawyerId) {
        return ResponseEntity.ok(reviewService.getRatingSummary(lawyerId));
    }

    // GET /reviews/client/{clientId} — All reviews submitted by a client
    @GetMapping("/client/{clientId}")
    public ResponseEntity<List<ReviewResponseDTO>> getByClientId(
            @PathVariable UUID clientId) {
        return ResponseEntity.ok(reviewService.getByClientId(clientId));
    }

    // PUT /reviews/{id}?clientId={clientId} — Client edits their review
    @PutMapping("/{id}")
    public ResponseEntity<ReviewResponseDTO> updateReview(
            @PathVariable Long id,
            @RequestParam UUID clientId,
            @Valid @RequestBody ReviewRequestDTO request) {
        return ResponseEntity.ok(reviewService.updateReview(id, clientId, request));
    }

    // DELETE /reviews/{id} — Delete a review (admin use)
    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteReview(@PathVariable Long id) {
        reviewService.deleteReview(id);
        return ResponseEntity.noContent().build();
    }
}