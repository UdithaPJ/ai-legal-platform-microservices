-- Idempotency table for Kafka event consumers.
-- The event_id PRIMARY KEY provides a database-level deduplication guarantee:
-- inserting a duplicate eventId raises a unique constraint violation which the
-- consumer catches and uses to skip already-processed messages.

CREATE TABLE IF NOT EXISTS consumed_events (
    event_id       UUID         PRIMARY KEY,
    event_type     VARCHAR(200) NOT NULL,
    aggregate_id   VARCHAR(255) NOT NULL,
    topic          VARCHAR(200),
    kafka_partition INTEGER,
    kafka_offset   BIGINT,
    correlation_id VARCHAR(128),
    traceparent    VARCHAR(512),
    consumed_at    TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
