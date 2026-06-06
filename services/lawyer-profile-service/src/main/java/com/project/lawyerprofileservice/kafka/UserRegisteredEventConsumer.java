package com.project.lawyerprofileservice.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.lawyerprofileservice.events.ConsumedEvent;
import com.project.lawyerprofileservice.events.ConsumedEventRepository;
import com.project.lawyerprofileservice.events.UserRegisteredEvent;
import com.project.lawyerprofileservice.model.Lawyer;
import com.project.lawyerprofileservice.model.VerificationStatus;
import com.project.lawyerprofileservice.repository.LawyerRepository;
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

import static com.project.lawyerprofileservice.observability.CorrelationIdFilter.MDC_CORRELATION_ID;
import static com.project.lawyerprofileservice.observability.CorrelationIdFilter.MDC_TRACEPARENT;

/**
 * Listens on {@code user.events.v1} for LAWYER registrations and creates the
 * initial skeleton {@link Lawyer} record (status = PENDING_ONBOARDING,
 * isAvailable = false).
 *
 * <p>CLIENT registrations are acknowledged and silently skipped.
 *
 * <p>Idempotency is enforced via the {@code consumed_events} table — duplicates
 * are silently discarded.
 */
@Component
@RequiredArgsConstructor
@Slf4j
public class UserRegisteredEventConsumer {

    private static final String EVENT_TYPE = "com.legalplatform.user.registered.v1";

    private final ObjectMapper            objectMapper;
    private final LawyerRepository        lawyerRepository;
    private final ConsumedEventRepository consumedEventRepository;

    @KafkaListener(
            topics          = "${app.kafka.topics.userEvents}",
            groupId         = "${spring.kafka.consumer.group-id}")
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
                log.warn("Skipping unsupported event type={} topic={}", type, record.topic());
                return;
            }

            UUID eventId = headerAsString(record, "eventId")
                    .map(UUID::fromString)
                    .orElseGet(() -> UUID.fromString(root.path("id").asText()));

            JsonNode data = root.path("data");
            UserRegisteredEvent event = objectMapper.treeToValue(data, UserRegisteredEvent.class);

            // ── Idempotency guard ────────────────────────────────────────────
            try {
                consumedEventRepository.save(ConsumedEvent.builder()
                        .eventId(eventId)
                        .eventType(EVENT_TYPE)
                        .lawyerId(UUID.fromString(event.getKeycloakId()))
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

            // ── Only handle LAWYER registrations ─────────────────────────────
            if (!"LAWYER".equalsIgnoreCase(event.getRole())) {
                log.debug("Skipping non-LAWYER registration for keycloakId={}", event.getKeycloakId());
                return;
            }

            UUID userId = UUID.fromString(event.getKeycloakId());

            if (lawyerRepository.existsByUserId(userId)) {
                log.info("Lawyer profile already exists for userId={} — skipping. eventId={}",
                        userId, eventId);
                return;
            }

            if (lawyerRepository.existsByBarRegistrationNumber(event.getBarRegistrationNumber())) {
                log.warn("Duplicate barRegistrationNumber={} for userId={} — skipping.",
                        event.getBarRegistrationNumber(), userId);
                return;
            }

            // ── Create skeleton lawyer profile ────────────────────────────────
            Lawyer lawyer = Lawyer.builder()
                    .userId(userId)
                    .barRegistrationNumber(event.getBarRegistrationNumber())
                    .isAvailable(false)
                    .verificationStatus(VerificationStatus.PENDING_ONBOARDING)
                    .build();

            lawyerRepository.save(lawyer);

            log.info("Skeleton lawyer profile created userId={} lawyerId={} barReg={} eventId={}",
                    userId, lawyer.getId(), event.getBarRegistrationNumber(), eventId);

        } finally {
            MDC.remove(MDC_CORRELATION_ID);
            MDC.remove(MDC_TRACEPARENT);
        }
    }

    private Optional<String> headerAsString(ConsumerRecord<String, String> record, String name) {
        Header header = record.headers().lastHeader(name);
        return header == null
                ? Optional.empty()
                : Optional.of(new String(header.value(), StandardCharsets.UTF_8));
    }
}
