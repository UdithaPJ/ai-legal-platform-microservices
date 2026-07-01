CREATE TABLE IF NOT EXISTS document_requests (
    id                  BIGSERIAL PRIMARY KEY,
    appointment_id      BIGINT,
    client_id           UUID NOT NULL,
    lawyer_id           UUID NOT NULL,
    document_type       VARCHAR(100) NOT NULL,
    description         TEXT,
    status              VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    rejection_reason    TEXT,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_doc_requests_client_id ON document_requests (client_id);
CREATE INDEX idx_doc_requests_lawyer_id ON document_requests (lawyer_id);
CREATE INDEX idx_doc_requests_appointment_id ON document_requests (appointment_id);

CREATE TABLE IF NOT EXISTS documents (
    id                  BIGSERIAL PRIMARY KEY,
    request_id          BIGINT NOT NULL REFERENCES document_requests(id),
    file_name           VARCHAR(500) NOT NULL,
    file_key            VARCHAR(1000) NOT NULL,
    content_type        VARCHAR(200),
    file_size_bytes     BIGINT,
    created_at          TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX idx_documents_request_id ON documents (request_id);
