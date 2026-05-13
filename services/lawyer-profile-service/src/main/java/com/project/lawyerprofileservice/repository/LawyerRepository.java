package com.project.lawyerprofileservice.repository;

import com.project.lawyerprofileservice.model.Lawyer;
import com.project.lawyerprofileservice.model.Specialization;
import jakarta.validation.constraints.NotNull;
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

    List<Lawyer> findByIsAvailableTrue();

    @Query("SELECT DISTINCT l FROM Lawyer l JOIN l.specializations s WHERE s = :specialization")
    List<Lawyer> findBySpecialization(@Param("specialization") Specialization specialization);

    boolean existsByBarRegistrationNumber(String barRegistrationNumber);

    boolean existsByUserId(@NotNull(message = "User ID is required") UUID userId);
}