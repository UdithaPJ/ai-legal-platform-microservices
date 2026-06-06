package com.project.lawyerprofileservice.repository;

import com.project.lawyerprofileservice.model.Lawyer;
import com.project.lawyerprofileservice.model.Specialization;
import com.project.lawyerprofileservice.model.VerificationStatus;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

@Repository
public interface LawyerRepository extends JpaRepository<Lawyer, Long> {

    Optional<Lawyer> findByUserId(UUID userId);

    /** Returns only VERIFIED + available lawyers (client-facing search). */
    List<Lawyer> findByIsAvailableTrueAndVerificationStatus(VerificationStatus status);

    @Query("SELECT DISTINCT l FROM Lawyer l JOIN l.specializations s " +
           "WHERE s = :specialization " +
           "AND l.isAvailable = true " +
           "AND l.verificationStatus = 'VERIFIED'")
    List<Lawyer> findVerifiedBySpecialization(@Param("specialization") Specialization specialization);

    List<Lawyer> findByVerificationStatus(VerificationStatus status);

    boolean existsByBarRegistrationNumber(String barRegistrationNumber);

    boolean existsByUserId(UUID userId);
}
