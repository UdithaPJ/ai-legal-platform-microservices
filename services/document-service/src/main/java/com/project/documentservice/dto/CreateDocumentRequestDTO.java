package com.project.documentservice.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;

import java.util.UUID;

public record CreateDocumentRequestDTO(
        Long appointmentId,

        @NotNull(message = "clientId is required")
        UUID clientId,

        @NotNull(message = "lawyerId is required")
        UUID lawyerId,

        @NotBlank(message = "documentType is required")
        String documentType,

        String description
) {}
