-- V5: Onboarding schema changes
--
-- 1. Make years_of_experience and consultation_fee nullable so that an initial
--    "skeleton" lawyer record can be created immediately after Keycloak
--    registration, before the lawyer completes the onboarding wizard.
--
-- 2. Default is_available to FALSE for new accounts (lawyer is hidden until
--    admin approves).
--
-- 3. Add verification_status to track the lawyer through the onboarding and
--    admin-review lifecycle.

ALTER TABLE lawyers
    ALTER COLUMN years_of_experience DROP NOT NULL;

ALTER TABLE lawyers
    ALTER COLUMN consultation_fee DROP NOT NULL;

ALTER TABLE lawyers
    ALTER COLUMN is_available SET DEFAULT FALSE;

ALTER TABLE lawyers
    ADD COLUMN IF NOT EXISTS verification_status VARCHAR(50)
        NOT NULL DEFAULT 'PENDING_ONBOARDING';

-- Backfill existing rows that already have complete profiles as VERIFIED
-- (they were created via the old REST endpoint and are considered onboarded).
UPDATE lawyers
SET verification_status = 'VERIFIED'
WHERE years_of_experience IS NOT NULL
  AND consultation_fee    IS NOT NULL
  AND is_available        = TRUE;
