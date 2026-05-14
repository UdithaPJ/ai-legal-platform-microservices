CREATE TABLE IF NOT EXISTS appointments (
    id                    BIGSERIAL PRIMARY KEY,
    client_id             BIGINT NOT NULL,
    lawyer_id             BIGINT NOT NULL,
    appointment_date_time TIMESTAMP NOT NULL,
    duration_minutes      INTEGER NOT NULL,
    description           TEXT NOT NULL,
    status                VARCHAR(50) NOT NULL DEFAULT 'PENDING',
    lawyer_note           TEXT,
    consultation_fee      NUMERIC(10, 2) NOT NULL,
    created_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at            TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);