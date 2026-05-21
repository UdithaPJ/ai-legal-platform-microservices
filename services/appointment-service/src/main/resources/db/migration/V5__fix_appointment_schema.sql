ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS appointment_date_time TIMESTAMPTZ NULL;

ALTER TABLE appointments
    ADD COLUMN IF NOT EXISTS meeting_url TEXT;

ALTER TABLE appointments
    ALTER COLUMN status SET DEFAULT 'REQUESTED';

UPDATE appointments
SET status = 'REQUESTED'
WHERE status = 'PENDING';

UPDATE appointments
SET status = 'ACCEPTED'
WHERE status = 'CONFIRMED';
