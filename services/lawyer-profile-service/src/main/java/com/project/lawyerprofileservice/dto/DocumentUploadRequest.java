package com.project.lawyerprofileservice.dto;

import jakarta.validation.constraints.NotBlank;
import lombok.Data;

/**
 * Step 4 — Document metadata submitted after the client uploads the file
 * directly to object storage and receives a URL back.
 *
 * Accepted documentType values:
 *   BAR_COUNCIL_CERTIFICATE, NATIONAL_ID, PRACTICING_CERTIFICATE
 */
@Data
public class DocumentUploadRequest {

    @NotBlank(message = "documentType is required")
    private String documentType;

    @NotBlank(message = "fileUrl is required")
    private String fileUrl;
}
