package com.project.documentservice.repository;

import com.project.documentservice.model.DocumentRequest;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.UUID;

@Repository
public interface DocumentRequestRepository extends JpaRepository<DocumentRequest, Long> {

    List<DocumentRequest> findByClientIdOrderByCreatedAtDesc(UUID clientId);

    List<DocumentRequest> findByLawyerIdOrderByCreatedAtDesc(UUID lawyerId);

    List<DocumentRequest> findByAppointmentIdOrderByCreatedAtDesc(Long appointmentId);
}
