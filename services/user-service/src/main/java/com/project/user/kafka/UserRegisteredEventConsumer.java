package com.project.user.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.user.dto.CreateUserRequest;
import com.project.user.events.ConsumedEvent;
import com.project.user.events.ConsumedEventRepository;
import com.project.user.events.UserRegisteredEvent;
import com.project.user.service.UserService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.consumer.ConsumerRecord;
import org.apache.kafka.common.header.Header;
import org.slf4j.MDC;
import org.springframework.dao.DataIntegrityViolationException;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.Optional;
import java.util.UUID;

import static com.project.user.observability.CorrelationIdFilter.MDC_CORRELATION_ID;
import static com.project.user.observability.CorrelationIdFilter.MDC_TRACEPARENT;

/**
 * Consumes {@code com.legalplatform.user.registered.v1} events from the
 * {@code user.events.v1} Kafka topic and creates a user record in the local database.
 *
 * <p><b>Idempotency</b>: the {@code event_id} is written to {@code consumed_events}
 * inside the same transaction. A PRIMARY KEY violation on that table is caught and
 * used to skip already-processed messages.
 *
 * <p><b>Validation</b>: all required fields are checked before the user is created
 * so that a missing value surfaces here as a clear log error — not as a cryptic
 * database constraint violation.
 *
 * <p><b>Error handling</b>: non-duplicate failures propagate up and are retried with
 * exponential back-off by {@link KafkaConsumerConfig}, then routed to the DLQ.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserRegisteredEventConsumer {

    static final String EVENT_TYPE = "com.legalplatform.user.registered.v1";

    private final ObjectMapper            objectMapper;
    private final UserService             userService;
    private final ConsumedEventRepository consumedEventRepository;

    @KafkaListener(topics = "${app.kafka.topics.userEvents}")
    @Transactional
    public void onMessage(ConsumerRecord<String, String> record) throws Exception {
        String correlationId = headerAsString(record, "correlationId")
                .orElseGet(() -> UUID.randomUUID().toString());
        headerAsString(record, "traceparent").ifPresent(tp -> MDC.put(MDC_TRACEPARENT, tp));
        MDC.put(MDC_CORRELATION_ID, correlationId);

        try {
            JsonNode root = objectMapper.readTree(record.value());

            String type = root.path("type").asText(null);
            if (!EVENT_TYPE.equals(type)) {
                log.warn("Skipping unsupported event type={} topic={} partition={} offset={}",
                        type, record.topic(), record.partition(), record.offset());
                return;
            }

            UUID eventId = headerAsString(record, "eventId")
                    .map(UUID::fromString)
                    .orElseGet(() -> UUID.fromString(root.path("id").asText()));

            JsonNode data = root.path("data");
            UserRegisteredEvent event = objectMapper.treeToValue(data, UserRegisteredEvent.class);

            // ── Diagnostic log — shows every field as received from Kafka ────
            log.info("[UserRegisteredConsumer] Event received: " +
                     "eventId={} keycloakId='{}' email='{}' fullName='{}' phone='{}' role='{}' barReg='{}'",
                    eventId,
                    event.getKeycloakId(),
                    event.getEmail(),
                    event.getFullName(),
                    event.getPhone(),
                    event.getRole(),
                    event.getBarRegistrationNumber());

            // ── Required-field validation — fail early with a clear message ──
            validateEvent(event, eventId);

            // ── Idempotency guard ────────────────────────────────────────────
            try {
                consumedEventRepository.save(ConsumedEvent.builder()
                        .eventId(eventId)
                        .eventType(EVENT_TYPE)
                        .aggregateId(event.getKeycloakId())
                        .topic(record.topic())
                        .kafkaPartition(record.partition())
                        .kafkaOffset(record.offset())
                        .correlationId(correlationId)
                        .traceparent(MDC.get(MDC_TRACEPARENT))
                        .consumedAt(LocalDateTime.now())
                        .build());
            } catch (DataIntegrityViolationException dup) {
                log.info("Duplicate event ignored eventId={} topic={} partition={} offset={}",
                        eventId, record.topic(), record.partition(), record.offset());
                return;
            }

            // ── User creation ────────────────────────────────────────────────
            try {
                userService.createUser(CreateUserRequest.builder()
                        .keycloakId(event.getKeycloakId())
                        .email(event.getEmail())
                        .fullName(event.getFullName())
                        .phone(event.getPhone())
                        .role(event.getRole())
                        .build());

                log.info("[UserRegisteredConsumer] User created: eventId={} keycloakId={} role={}",
                        eventId, event.getKeycloakId(), event.getRole());

            } catch (IllegalArgumentException alreadyExists) {
                // User was created by a concurrent path (e.g. admin seed).
                log.info("[UserRegisteredConsumer] User already exists for keycloakId={} — skipping. eventId={}",
                        event.getKeycloakId(), eventId);
            }

        } finally {
            MDC.remove(MDC_CORRELATION_ID);
            MDC.remove(MDC_TRACEPARENT);
        }
    }

    // ── Helpers ───────────────────────────────────────────────────────────────

    /**
     * Validates all required fields of the deserialized event.
     * Throws {@link IllegalArgumentException} — treated as non-retryable by the
     * error handler and routed to the DLQ after logging.
     */
    private void validateEvent(UserRegisteredEvent event, UUID eventId) {
        if (isBlank(event.getKeycloakId())) {
            throw new IllegalArgumentException(
                    "[UserRegisteredConsumer] keycloakId is null/blank in event eventId=" + eventId);
        }
        if (isBlank(event.getEmail())) {
            throw new IllegalArgumentException(
                    "[UserRegisteredConsumer] email is null/blank in event eventId=" + eventId
                    + " keycloakId=" + event.getKeycloakId());
        }
        if (isBlank(event.getFullName())) {
            throw new IllegalArgumentException(
                    "[UserRegisteredConsumer] fullName is null/blank in event eventId=" + eventId
                    + " keycloakId=" + event.getKeycloakId()
                    + ". This usually means the Keycloak SPI read getFirstName()/getLastName() "
                    + "instead of the 'full_name' custom attribute set by the registration form.");
        }
        if (isBlank(event.getRole())) {
            throw new IllegalArgumentException(
                    "[UserRegisteredConsumer] role is null/blank in event eventId=" + eventId
                    + " keycloakId=" + event.getKeycloakId());
        }
    }

    private static boolean isBlank(String s) {
        return s == null || s.isBlank();
    }

    private Optional<String> headerAsString(ConsumerRecord<String, String> record, String name) {
        Header header = record.headers().lastHeader(name);
        return header == null
                ? Optional.empty()
                : Optional.of(new String(header.value(), StandardCharsets.UTF_8));
    }
}
