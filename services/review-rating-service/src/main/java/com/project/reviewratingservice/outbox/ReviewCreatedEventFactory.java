package com.project.reviewratingservice.outbox;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.reviewratingservice.model.Review;
import lombok.RequiredArgsConstructor;
import org.slf4j.MDC;
import org.springframework.stereotype.Component;

import java.time.OffsetDateTime;
import java.util.LinkedHashMap;
import java.util.Map;
import java.util.UUID;

import static com.project.reviewratingservice.observability.CorrelationIdFilter.MDC_CORRELATION_ID;
import static com.project.reviewratingservice.observability.CorrelationIdFilter.MDC_TRACEPARENT;

@Component
@RequiredArgsConstructor
public class ReviewCreatedEventFactory {

    public static final String EVENT_TYPE = "com.legalplatform.review.created.v1";
    public static final int SCHEMA_VERSION = 1;

    private final ObjectMapper objectMapper;

    public OutboxEvent buildOutboxEvent(Review savedReview) {
        UUID eventId = UUID.randomUUID();

        Map<String, Object> envelope = new LinkedHashMap<>();
        envelope.put("specversion", "1.0");
        envelope.put("id", eventId.toString());
        envelope.put("type", EVENT_TYPE);
        envelope.put("source", "review-rating-service");
        envelope.put("time", OffsetDateTime.now().toString());
        envelope.put("subject", "lawyer/" + savedReview.getLawyerId());
        envelope.put("schemaVersion", SCHEMA_VERSION);

        Map<String, Object> data = new LinkedHashMap<>();
        data.put("reviewId", savedReview.getId());
        data.put("lawyerId", savedReview.getLawyerId());
        data.put("rating", savedReview.getRating());
        data.put("createdAt", savedReview.getCreatedAt() != null ? savedReview.getCreatedAt().toString() : null);
        envelope.put("data", data);

        String payload;
        try {
            payload = objectMapper.writeValueAsString(envelope);
        } catch (JsonProcessingException e) {
            throw new IllegalStateException("Failed to serialize ReviewCreated event", e);
        }

        String correlationId = MDC.get(MDC_CORRELATION_ID);
        String traceparent = MDC.get(MDC_TRACEPARENT);

        return OutboxEvent.builder()
                .eventId(eventId)
                .aggregateType("Review")
                .aggregateId(String.valueOf(savedReview.getId()))
                .eventType(EVENT_TYPE)
                .schemaVersion(SCHEMA_VERSION)
                .occurredAt(java.time.LocalDateTime.now())
                .correlationId(correlationId)
                .traceparent(traceparent)
                .key(String.valueOf(savedReview.getLawyerId()))
                .payload(payload)
                .publishAttempts(0)
                .build();
    }
}
