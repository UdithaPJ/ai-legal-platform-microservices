package com.project.lawyerprofileservice.repository;

import com.project.lawyerprofileservice.model.Lawyer;
import com.project.lawyerprofileservice.model.Specialization;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface LawyerRepository extends JpaRepository<Lawyer, Long> {

    Optional<Lawyer> findByEmail(String email);

    Optional<Lawyer> findByUserId(Long userId);

    List<Lawyer> findByIsAvailableTrue();

    @Query("SELECT DISTINCT l FROM Lawyer l JOIN l.specializations s WHERE s = :specialization")
    List<Lawyer> findBySpecialization(@Param("specialization") Specialization specialization);

    @Query("SELECT l FROM Lawyer l WHERE " +
            "LOWER(l.fullName) LIKE LOWER(CONCAT('%', :keyword, '%')) OR " +
            "LOWER(l.location) LIKE LOWER(CONCAT('%', :keyword, '%'))")
    List<Lawyer> searchByKeyword(@Param("keyword") String keyword);

    boolean existsByEmail(String email);

    boolean existsByBarRegistrationNumber(String barRegistrationNumber);

    boolean existsByUserId(Long userId);
}