CREATE TABLE IF NOT EXISTS outbox_events (
    event_id            UUID PRIMARY KEY,
    aggregate_type      VARCHAR(100) NOT NULL,
    aggregate_id        VARCHAR(100) NOT NULL,
    event_type          VARCHAR(200) NOT NULL,
    schema_version      INTEGER NOT NULL,
    occurred_at         TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    correlation_id      VARCHAR(128),
    traceparent         VARCHAR(512),
    key                VARCHAR(200) NOT NULL,
    payload             JSONB NOT NULL,

    published_at        TIMESTAMP NULL,
    publish_attempts    INTEGER NOT NULL DEFAULT 0,
    last_error          TEXT
);

CREATE INDEX IF NOT EXISTS idx_outbox_unpublished ON outbox_events(published_at) WHERE published_at IS NULL;
CREATE INDEX IF NOT EXISTS idx_outbox_occurred_at ON outbox_events(occurred_at);
