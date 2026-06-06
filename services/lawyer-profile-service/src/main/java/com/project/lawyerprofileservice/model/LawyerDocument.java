package com.project.lawyerprofileservice.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;

/**
 * Metadata record for a verification document uploaded by a lawyer.
 * The binary file is stored in object storage; only the URL is persisted here.
 */
@Entity
@Table(name = "lawyer_documents")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class LawyerDocument {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    /** FK → lawyers.id */
    @Column(name = "lawyer_id", nullable = false)
    private Long lawyerId;

    /**
     * One of: BAR_COUNCIL_CERTIFICATE, NATIONAL_ID, PRACTICING_CERTIFICATE
     * (stored as a plain string so new types can be added without a schema change).
     */
    @Column(name = "document_type", nullable = false)
    private String documentType;

    /** Publicly accessible URL (presigned S3 URL or MinIO path). */
    @Column(name = "file_url", nullable = false)
    private String fileUrl;

    @Column(name = "uploaded_at")
    private LocalDateTime uploadedAt;

    @PrePersist
    protected void onPersist() {
        if (uploadedAt == null) uploadedAt = LocalDateTime.now();
    }
}
