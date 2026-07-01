package com.project.documentservice.dto;

import java.time.OffsetDateTime;

public record DocumentFileResponseDTO(
        Long id,
        Long requestId,
        String fileName,
        String contentType,
        Long fileSizeBytes,
        OffsetDateTime createdAt
) {}
