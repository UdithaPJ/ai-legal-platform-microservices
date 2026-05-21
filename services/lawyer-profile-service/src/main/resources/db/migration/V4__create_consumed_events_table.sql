CREATE TABLE IF NOT EXISTS consumed_events (
    event_id        UUID PRIMARY KEY,
    event_type      VARCHAR(200) NOT NULL,
    lawyer_id       UUID NOT NULL,
    topic           VARCHAR(200),
    kafka_partition INTEGER,
    kafka_offset    BIGINT,
    correlation_id  VARCHAR(128),
    traceparent     VARCHAR(512),
    consumed_at     TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_consumed_events_lawyer_id ON consumed_events(lawyer_id);
CREATE INDEX IF NOT EXISTS idx_consumed_events_consumed_at ON consumed_events(consumed_at);