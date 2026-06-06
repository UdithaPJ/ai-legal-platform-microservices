package com.project.reviewratingservice.service;

import com.project.reviewratingservice.client.AppointmentServiceClient;
import com.project.reviewratingservice.client.UserServiceClient;
import com.project.reviewratingservice.dto.*;
import com.project.reviewratingservice.model.Review;
import com.project.reviewratingservice.outbox.OutboxEventRepository;
import com.project.reviewratingservice.outbox.ReviewCreatedEventFactory;
import com.project.reviewratingservice.repository.ReviewRepository;
import feign.FeignException;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;
import java.util.UUID;
import java.util.stream.Collectors;

@Service
@RequiredArgsConstructor
@Slf4j
public class ReviewService {

    private final ReviewRepository reviewRepository;
    private final AppointmentServiceClient appointmentServiceClient;
    private final UserServiceClient userServiceClient;
    private final OutboxEventRepository outboxEventRepository;
    private final ReviewCreatedEventFactory reviewCreatedEventFactory;

    // ── CREATE ──────────────────────────────────────────────────

    @Transactional
    public ReviewResponseDTO submitReview(ReviewRequestDTO request) {

        // 1. Verify the appointment exists and belongs to this client/lawyer pair
        AppointmentResponseDTO appointment = fetchAppointment(request.getAppointmentId());

        if (!appointment.getLawyerId().equals(request.getLawyerId())) {
            throw new IllegalArgumentException(
                    "This appointment does not belong to the specified lawyer");
        }
        if (!appointment.getClientId().equals(request.getClientId())) {
            throw new IllegalArgumentException(
                    "This appointment does not belong to the specified client");
        }

        // 2. Verify the appointment is COMPLETED
        // Only completed consultations can be reviewed
        if (!"COMPLETED".equalsIgnoreCase(appointment.getStatus())) {
            throw new IllegalArgumentException(
                    "A review can only be submitted after the consultation is completed. " +
                            "Current status: " + appointment.getStatus());
        }

        // 3. Prevent duplicate reviews for the same appointment
        if (reviewRepository.existsByAppointmentId(request.getAppointmentId())) {
            throw new IllegalArgumentException(
                    "A review has already been submitted for this appointment");
        }

        // 4. Prevent a client from reviewing the same lawyer more than once
        // (a client might have multiple appointments with the same lawyer)
        if (reviewRepository.existsByLawyerIdAndClientId(
                request.getLawyerId(), request.getClientId())) {
            throw new IllegalArgumentException(
                    "You have already submitted a review for this lawyer");
        }

        // 5. Save the review
        Review review = Review.builder()
                .lawyerId(request.getLawyerId())
                .clientId(request.getClientId())
                .appointmentId(request.getAppointmentId())
                .rating(request.getRating())
                .comment(request.getComment())
                .build();

        Review saved = reviewRepository.save(review);
        log.info("Review submitted for lawyerId: {} by clientId: {} — rating: {}",
                saved.getLawyerId(), saved.getClientId(), saved.getRating());

        outboxEventRepository.save(reviewCreatedEventFactory.buildOutboxEvent(saved));

        String clientName = fetchClientName(saved.getClientId());
        return mapToResponse(saved, clientName);
    }

    // ── READ ─────────────────────────────────────────────────────

    public ReviewResponseDTO getById(Long id) {
        Review review = findById(id);
        return mapToResponse(review, fetchClientName(review.getClientId()));
    }

    public List<ReviewResponseDTO> getByLawyerId(UUID lawyerId) {
        return reviewRepository.findByLawyerId(lawyerId)
                .stream()
                .map(r -> mapToResponse(r, fetchClientName(r.getClientId())))
                .collect(Collectors.toList());
    }

    public List<ReviewResponseDTO> getByClientId(UUID clientId) {
        return reviewRepository.findByClientId(clientId)
                .stream()
                .map(r -> mapToResponse(r, fetchClientName(r.getClientId())))
                .collect(Collectors.toList());
    }

    public List<ReviewResponseDTO> getAllReviews() {
        return reviewRepository.findAll()
                .stream()
                .map(r -> mapToResponse(r, fetchClientName(r.getClientId())))
                .collect(Collectors.toList());
    }

    // Returns the full rating breakdown for a lawyer's profile page
    public LawyerRatingSummaryDTO getRatingSummary(UUID lawyerId) {

        Integer total = reviewRepository.countByLawyerId(lawyerId);
        Double average = reviewRepository.findAverageRatingByLawyerId(lawyerId);

        // Round to 1 decimal place; return 0.0 if no reviews yet
        double roundedAverage = (average != null)
                ? Math.round(average * 10.0) / 10.0
                : 0.0;

        return LawyerRatingSummaryDTO.builder()
                .lawyerId(lawyerId)
                .averageRating(roundedAverage)
                .totalReviews(total != null ? total : 0)
                .fiveStars(countStars(lawyerId, 5))
                .fourStars(countStars(lawyerId, 4))
                .threeStars(countStars(lawyerId, 3))
                .twoStars(countStars(lawyerId, 2))
                .oneStar(countStars(lawyerId, 1))
                .build();
    }

    // ── UPDATE ───────────────────────────────────────────────────

    // Clients can edit the comment and rating of their own review
    public ReviewResponseDTO updateReview(Long id, UUID clientId, ReviewRequestDTO request) {

        Review review = findById(id);

        // Verify ownership — only the original reviewer can edit
        if (!review.getClientId().equals(clientId)) {
            throw new IllegalArgumentException(
                    "You are not authorized to update this review");
        }

        review.setRating(request.getRating());
        review.setComment(request.getComment());

        Review updated = reviewRepository.save(review);
        log.info("Review {} updated by clientId: {}", id, clientId);

        return mapToResponse(updated, fetchClientName(updated.getClientId()));
    }

    // ── DELETE ───────────────────────────────────────────────────

    public void deleteReview(Long id) {
        if (!reviewRepository.existsById(id)) {
            throw new IllegalArgumentException("Review not found with id: " + id);
        }
        reviewRepository.deleteById(id);
        log.info("Review {} deleted", id);
    }

    // ── HELPERS ──────────────────────────────────────────────────

    private Review findById(Long id) {
        return reviewRepository.findById(id)
                .orElseThrow(() -> new IllegalArgumentException(
                        "Review not found with id: " + id));
    }

    private AppointmentResponseDTO fetchAppointment(Long appointmentId) {
        try {
            return appointmentServiceClient.getAppointmentById(appointmentId);
        } catch (FeignException.NotFound e) {
            throw new IllegalArgumentException(
                    "Appointment not found with id: " + appointmentId);
        } catch (FeignException e) {
            throw new IllegalStateException(
                    "Could not reach appointment-service. Please try again later.");
        }
    }

    private String fetchClientName(UUID clientId) {
        try {
            return userServiceClient.getUserById(clientId).getFullName();
        } catch (FeignException e) {
            log.warn("Could not fetch user name for clientId: {}", clientId);
            return "Unknown";
        }
    }

    private Integer countStars(UUID lawyerId, Integer stars) {
        Integer count = reviewRepository.countByLawyerIdAndRating(lawyerId, stars);
        return count != null ? count : 0;
    }

    // ── MAPPER ───────────────────────────────────────────────────

    private ReviewResponseDTO mapToResponse(Review r, String clientName) {
        return ReviewResponseDTO.builder()
                .id(r.getId())
                .lawyerId(r.getLawyerId())
                .clientId(r.getClientId())
                .clientName(clientName)
                .appointmentId(r.getAppointmentId())
                .rating(r.getRating())
                .comment(r.getComment())
                .createdAt(r.getCreatedAt())
                .updatedAt(r.getUpdatedAt())
                .build();
    }
}
