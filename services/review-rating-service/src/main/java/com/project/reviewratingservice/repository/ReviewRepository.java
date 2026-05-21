package com.project.reviewratingservice.repository;

import com.project.reviewratingservice.model.Review;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface ReviewRepository extends JpaRepository<Review, Long> {

    // All reviews for a specific lawyer (used for listing + average)
    List<Review> findByLawyerId(UUID lawyerId);

    // All reviews submitted by a specific client
    List<Review> findByClientId(UUID clientId);

    // Check if a review already exists for this appointment
    boolean existsByAppointmentId(Long appointmentId);

    // Check if this client already reviewed this lawyer
    // (secondary guard — primary is existsByAppointmentId)
    boolean existsByLawyerIdAndClientId(UUID lawyerId, UUID clientId);

    // Find review for a specific appointment (for update/delete)
    Optional<Review> findByAppointmentId(Long appointmentId);

    // Average rating for a lawyer — computed in DB for efficiency
    @Query("SELECT AVG(r.rating) FROM Review r WHERE r.lawyerId = :lawyerId")
    Double findAverageRatingByLawyerId(@Param("lawyerId") UUID lawyerId);

    // Count per star level — used for the rating breakdown
    @Query("SELECT COUNT(r) FROM Review r WHERE r.lawyerId = :lawyerId AND r.rating = :rating")
    Integer countByLawyerIdAndRating(
            @Param("lawyerId") UUID lawyerId,
            @Param("rating") Integer rating);

    // Total review count for a lawyer
    Integer countByLawyerId(UUID lawyerId);
}