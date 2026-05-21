package com.project.lawyerprofileservice.kafka;

import com.fasterxml.jackson.databind.JsonNode;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.lawyerprofileservice.events.ConsumedEvent;
import com.project.lawyerprofileservice.events.ConsumedEventRepository;
import com.project.lawyerprofileservice.model.Lawyer;
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

@Component
@RequiredArgsConstructor
@Slf4j
public class ReviewEventsConsumer {

    private static final String REVIEW_CREATED_TYPE = "com.legalplatform.review.created.v1";

    private final ObjectMapper objectMapper;
    private final LawyerRepository lawyerRepository;
    private final ConsumedEventRepository consumedEventRepository;

    @KafkaListener(topics = "${app.kafka.topics.reviewEvents}")
    @Transactional
    public void onMessage(ConsumerRecord<String, String> record) throws Exception {
        String correlationId = headerAsString(record, "correlationId").orElse(UUID.randomUUID().toString());
        headerAsString(record, "traceparent").ifPresent(tp -> MDC.put(MDC_TRACEPARENT, tp));
        MDC.put(MDC_CORRELATION_ID, correlationId);

        try {
            JsonNode root = objectMapper.readTree(record.value());
            String type = root.path("type").asText(null);
            if (type == null || (!type.equals(REVIEW_CREATED_TYPE))) {
                throw new IllegalArgumentException("Unsupported event type: " + type);
            }

            UUID eventId = headerAsString(record, "eventId")
                    .map(UUID::fromString)
                    .orElseGet(() -> UUID.fromString(root.path("id").asText()));

            JsonNode data = root.path("data");
                UUID lawyerUserId = UUID.fromString(data.path("lawyerId").asText());
            int rating = data.path("rating").asInt();

            try {
                consumedEventRepository.save(ConsumedEvent.builder()
                        .eventId(eventId)
                        .eventType(type)
                        .lawyerId(lawyerUserId)
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

                Lawyer lawyer = lawyerRepository.findByUserId(lawyerUserId)
                    .orElseThrow(() -> new IllegalArgumentException(
                        "Lawyer not found for userId=" + lawyerUserId));

            lawyer.applyNewRating(rating);
            lawyerRepository.save(lawyer);

            log.info("Applied ReviewCreated eventId={} lawyerUserId={} rating={} newAvg={} count={}",
                    eventId, lawyerUserId, rating, lawyer.getAverageRating(), lawyer.getReviewCount());
        } finally {
            MDC.remove(MDC_CORRELATION_ID);
            MDC.remove(MDC_TRACEPARENT);
        }
    }

    private Optional<String> headerAsString(ConsumerRecord<String, String> record, String name) {
        Header header = record.headers().lastHeader(name);
        if (header == null) {
            return Optional.empty();
        }
        return Optional.of(new String(header.value(), StandardCharsets.UTF_8));
    }
}
