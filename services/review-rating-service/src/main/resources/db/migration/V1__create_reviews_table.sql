CREATE TABLE IF NOT EXISTS reviews (
    id                  BIGSERIAL PRIMARY KEY,
    lawyer_id           BIGINT NOT NULL,
    client_id           UUID NOT NULL,
    appointment_id      BIGINT NOT NULL UNIQUE,
    rating              INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment             TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- One review per appointment (enforced by UNIQUE on appointment_id above)
-- Fast lookups by lawyer for average rating calculations
CREATE INDEX IF NOT EXISTS idx_reviews_lawyer_id ON reviews(lawyer_id);

-- Fast lookups by client for their review history
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);