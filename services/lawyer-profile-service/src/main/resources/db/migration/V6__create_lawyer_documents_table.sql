-- V6: Lawyer verification documents
--
-- Stores metadata for files uploaded during the onboarding wizard (Step 4).
-- The actual binary files live in object storage (S3 / MinIO); only the URL
-- and document type are persisted here.

CREATE TABLE IF NOT EXISTS lawyer_documents (
    id            BIGSERIAL    PRIMARY KEY,
    lawyer_id     BIGINT       NOT NULL,
    document_type VARCHAR(100) NOT NULL,
    file_url      VARCHAR(500) NOT NULL,
    uploaded_at   TIMESTAMP    DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_lawyer_documents_lawyer
        FOREIGN KEY (lawyer_id)
        REFERENCES lawyers (id)
        ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_lawyer_documents_lawyer_id
    ON lawyer_documents (lawyer_id);
