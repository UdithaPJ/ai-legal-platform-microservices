package com.project.documentservice.dto;

import com.project.documentservice.model.DocumentRequestStatus;
import jakarta.validation.constraints.NotNull;

public record UpdateRequestStatusDTO(
        @NotNull(message = "status is required")
        DocumentRequestStatus status,

        String rejectionReason
) {}
