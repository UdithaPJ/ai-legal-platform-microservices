CREATE TABLE IF NOT EXISTS video_sessions (
    id                  BIGSERIAL PRIMARY KEY,
    appointment_id      BIGINT NOT NULL UNIQUE,
    room_name           VARCHAR(255) NOT NULL UNIQUE,
    meeting_url         VARCHAR(500) NOT NULL,
    status              VARCHAR(50) NOT NULL DEFAULT 'SCHEDULED',
    scheduled_at        TIMESTAMP NOT NULL,
    started_at          TIMESTAMP,
    ended_at            TIMESTAMP,
    created_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at          TIMESTAMP DEFAULT CURRENT_TIMESTAMP
    );

-- One session per appointment (enforced by UNIQUE on appointment_id)
CREATE INDEX IF NOT EXISTS idx_video_sessions_appointment_id
    ON video_sessions(appointment_id);