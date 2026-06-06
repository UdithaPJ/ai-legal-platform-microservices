package com.project.user.events;

import jakarta.persistence.Column;
import jakarta.persistence.Entity;
import jakarta.persistence.Id;
import jakarta.persistence.Table;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

import java.time.LocalDateTime;
import java.util.UUID;

/**
 * Idempotency record — one row per processed Kafka message.
 * The {@code event_id} PRIMARY KEY constraint provides a database-level
 * duplicate-rejection guarantee even under concurrent consumer instances.
 */
@Entity
@Table(name = "consumed_events")
@Data
@Builder
@NoArgsConstructor
@AllArgsConstructor
public class ConsumedEvent {

    @Id
    @Column(name = "event_id", nullable = false)
    private UUID eventId;

    @Column(name = "event_type", nullable = false)
    private String eventType;

    /** The primary business identifier of the aggregate (e.g. keycloakId). */
    @Column(name = "aggregate_id", nullable = false)
    private String aggregateId;

    @Column(name = "topic")
    private String topic;

    @Column(name = "kafka_partition")
    private Integer kafkaPartition;

    @Column(name = "kafka_offset")
    private Long kafkaOffset;

    @Column(name = "correlation_id")
    private String correlationId;

    @Column(name = "traceparent")
    private String traceparent;

    @Column(name = "consumed_at")
    private LocalDateTime consumedAt;
}
