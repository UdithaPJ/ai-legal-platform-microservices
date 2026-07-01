package com.project.documentservice.dto;

import com.project.documentservice.model.DocumentRequestStatus;

import java.time.OffsetDateTime;
import java.util.List;
import java.util.UUID;

public record DocumentRequestResponseDTO(
        Long id,
        Long appointmentId,
        UUID clientId,
        UUID lawyerId,
        String documentType,
        String description,
        DocumentRequestStatus status,
        String rejectionReason,
        List<DocumentFileResponseDTO> documents,
        OffsetDateTime createdAt,
        OffsetDateTime updatedAt
) {}
