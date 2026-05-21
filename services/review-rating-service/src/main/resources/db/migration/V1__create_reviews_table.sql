CREATE TABLE IF NOT EXISTS reviews (
    id                  BIGSERIAL PRIMARY KEY,
    lawyer_id           UUID NOT NULL,
    client_id           UUID NOT NULL,
    appointment_id      BIGINT NOT NULL UNIQUE,
    rating              INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment             TEXT,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_reviews_lawyer_id ON reviews(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_reviews_client_id ON reviews(client_id);