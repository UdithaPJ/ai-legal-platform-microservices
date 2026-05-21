CREATE TABLE IF NOT EXISTS appointments (
    id                    BIGSERIAL PRIMARY KEY,
    client_id             UUID NOT NULL,
    lawyer_id             UUID NOT NULL,
    meeting_url TEXT,
    duration_minutes      INTEGER NOT NULL,
    description           TEXT NOT NULL,
    status                VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    lawyer_note           TEXT,
    consultation_fee      NUMERIC(10, 2) NOT NULL,
    created_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);