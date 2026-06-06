package com.project.lawyerprofileservice.repository;

import com.project.lawyerprofileservice.model.LawyerDocument;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;

@Repository
public interface LawyerDocumentRepository extends JpaRepository<LawyerDocument, Long> {

    List<LawyerDocument> findByLawyerId(Long lawyerId);
}
