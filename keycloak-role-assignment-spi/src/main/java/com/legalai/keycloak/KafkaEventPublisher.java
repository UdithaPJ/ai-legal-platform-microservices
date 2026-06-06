package com.legalai.keycloak;

import org.apache.kafka.clients.producer.KafkaProducer;
import org.apache.kafka.clients.producer.ProducerConfig;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.serialization.StringSerializer;
import org.jboss.logging.Logger;

import java.nio.charset.StandardCharsets;
import java.time.Instant;
import java.util.Properties;
import java.util.UUID;

/**
 * Thin wrapper around a {@link KafkaProducer} for publishing domain events from within
 * the Keycloak SPI.  The producer is created once (in the factory's {@code init}) and
 * shared across provider instances for the lifetime of the Keycloak process.
 *
 * <p>JSON is built manually to avoid shading Jackson alongside kafka-clients.
 */
public class KafkaEventPublisher implements AutoCloseable {

    private static final Logger LOG = Logger.getLogger(KafkaEventPublisher.class);

    static final String EVENT_TYPE  = "com.legalplatform.user.registered.v1";
    static final int    SCHEMA_VER  = 1;
    static final String EVENT_SOURCE = "/keycloak/registration";

    private final KafkaProducer<String, String> producer;
    private final String topic;

    public KafkaEventPublisher(String bootstrapServers, String topic) {
        this.topic = topic;

        Properties props = new Properties();
        props.put(ProducerConfig.BOOTSTRAP_SERVERS_CONFIG,  bootstrapServers);
        props.put(ProducerConfig.KEY_SERIALIZER_CLASS_CONFIG,   StringSerializer.class.getName());
        props.put(ProducerConfig.VALUE_SERIALIZER_CLASS_CONFIG, StringSerializer.class.getName());
        // At-least-once delivery with idempotent consumer on the other side
        props.put(ProducerConfig.ACKS_CONFIG,    "all");
        props.put(ProducerConfig.RETRIES_CONFIG, "3");
        props.put(ProducerConfig.ENABLE_IDEMPOTENCE_CONFIG, "false"); // no transactions needed here

        this.producer = new KafkaProducer<>(props);
        LOG.infof("[KafkaEventPublisher] Initialised — bootstrapServers=%s topic=%s",
                bootstrapServers, topic);
    }

    /**
     * Builds a CloudEvents envelope around the {@link UserRegisteredEvent} and sends
     * it to Kafka.  The Kafka record key is the user's Keycloak ID so that all events
     * for the same user land in the same partition (ordering guarantee per user).
     */
    public void publish(UserRegisteredEvent event) {
        String eventId      = UUID.randomUUID().toString();
        String correlationId = UUID.randomUUID().toString();
        String payload      = buildCloudEventJson(eventId, event);

        ProducerRecord<String, String> record =
                new ProducerRecord<>(topic, event.getKeycloakId(), payload);

        // Attach CloudEvents-compatible Kafka headers (mirrors review-rating-service pattern)
        record.headers()
                .add("eventId",       eventId.getBytes(StandardCharsets.UTF_8))
                .add("eventType",     EVENT_TYPE.getBytes(StandardCharsets.UTF_8))
                .add("schemaVersion", String.valueOf(SCHEMA_VER).getBytes(StandardCharsets.UTF_8))
                .add("correlationId", correlationId.getBytes(StandardCharsets.UTF_8));

        producer.send(record, (metadata, ex) -> {
            if (ex != null) {
                LOG.errorf(ex,
                        "[KafkaEventPublisher] Failed to publish UserRegistered event " +
                        "eventId=%s keycloakId=%s", eventId, event.getKeycloakId());
            } else {
                LOG.infof("[KafkaEventPublisher] Published UserRegistered eventId=%s " +
                          "keycloakId=%s topic=%s partition=%d offset=%d",
                        eventId, event.getKeycloakId(),
                        metadata.topic(), metadata.partition(), metadata.offset());
            }
        });

        // Flush immediately — Keycloak's SPI lifecycle does not have a "commit" phase
        // where we can rely on background flushing before the JVM handles the next request.
        producer.flush();
    }

    @Override
    public void close() {
        try {
            producer.close();
            LOG.info("[KafkaEventPublisher] Producer closed.");
        } catch (Exception ex) {
            LOG.warnf(ex, "[KafkaEventPublisher] Error while closing producer.");
        }
    }

    // -------------------------------------------------------------------------
    // JSON building — manual to avoid shading Jackson
    // -------------------------------------------------------------------------

    private String buildCloudEventJson(String eventId, UserRegisteredEvent event) {
        StringBuilder sb = new StringBuilder(256);
        sb.append('{');
        sb.append("\"specversion\":\"1.0\",");
        sb.append("\"id\":\"").append(esc(eventId)).append("\",");
        sb.append("\"type\":\"").append(EVENT_TYPE).append("\",");
        sb.append("\"source\":\"").append(EVENT_SOURCE).append("\",");
        sb.append("\"time\":\"").append(Instant.now()).append("\",");
        sb.append("\"schemaVersion\":").append(SCHEMA_VER).append(',');
        sb.append("\"data\":{");
        sb.append("\"keycloakId\":\"").append(esc(event.getKeycloakId())).append("\",");
        sb.append("\"email\":\"").append(esc(event.getEmail())).append("\",");
        sb.append("\"fullName\":\"").append(esc(event.getFullName())).append("\",");
        sb.append("\"role\":\"").append(esc(event.getRole())).append('"');

        if (event.getPhone() != null && !event.getPhone().isBlank()) {
            sb.append(",\"phone\":\"").append(esc(event.getPhone())).append('"');
        }
        if (event.getBarRegistrationNumber() != null && !event.getBarRegistrationNumber().isBlank()) {
            sb.append(",\"barRegistrationNumber\":\"")
              .append(esc(event.getBarRegistrationNumber())).append('"');
        }

        sb.append("}}");
        return sb.toString();
    }

    /**
     * Minimal JSON string escape.
     *
     * <p><strong>Null policy</strong>: callers are responsible for ensuring required fields
     * are non-null before calling this method. Passing null here for a required field
     * would silently produce an empty-string value in the JSON and corrupt downstream data.
     * Optional fields (phone, barRegistrationNumber) are handled with explicit null guards
     * in {@link #buildCloudEventJson} and are never passed here when null.
     */
    private static String esc(String s) {
        if (s == null) {
            // This should never happen for required fields — the provider guards against it.
            // Throw so that the bug surfaces here rather than as a DB constraint downstream.
            throw new IllegalArgumentException(
                    "Attempted to serialize a null required field into the Kafka JSON payload. " +
                    "Ensure fullName is resolved before calling publish().");
        }
        return s.replace("\\", "\\\\")
                .replace("\"", "\\\"")
                .replace("\n", "\\n")
                .replace("\r", "\\r")
                .replace("\t", "\\t");
    }
}
