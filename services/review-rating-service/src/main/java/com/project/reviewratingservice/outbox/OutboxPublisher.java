package com.project.reviewratingservice.outbox;

import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.apache.kafka.clients.producer.ProducerRecord;
import org.apache.kafka.common.header.internals.RecordHeader;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.nio.charset.StandardCharsets;
import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
@Slf4j
public class OutboxPublisher {

    private final OutboxEventRepository outboxEventRepository;
    private final KafkaTemplate<String, String> kafkaTemplate;

    @Value("${app.kafka.topics.reviewEvents}")
    private String reviewEventsTopic;

    @Value("${app.outbox.batchSize:50}")
    private int batchSize;

    @Scheduled(fixedDelayString = "${app.outbox.publisherDelayMs:2000}")
    @Transactional
    public void publishPending() {
        List<OutboxEvent> batch = outboxEventRepository.lockNextBatch(batchSize);
        if (batch.isEmpty()) {
            return;
        }

        for (OutboxEvent event : batch) {
            try {
                ProducerRecord<String, String> record = new ProducerRecord<>(reviewEventsTopic, event.getKey(), event.getPayload());
                record.headers()
                        .add(new RecordHeader("eventId", event.getEventId().toString().getBytes(StandardCharsets.UTF_8)))
                        .add(new RecordHeader("eventType", event.getEventType().getBytes(StandardCharsets.UTF_8)))
                        .add(new RecordHeader("schemaVersion", String.valueOf(event.getSchemaVersion()).getBytes(StandardCharsets.UTF_8)));

                if (event.getCorrelationId() != null) {
                    record.headers().add(new RecordHeader("correlationId", event.getCorrelationId().getBytes(StandardCharsets.UTF_8)));
                }
                if (event.getTraceparent() != null) {
                    record.headers().add(new RecordHeader("traceparent", event.getTraceparent().getBytes(StandardCharsets.UTF_8)));
                }

                kafkaTemplate.send(record).get();

                event.setPublishedAt(LocalDateTime.now());
                event.setPublishAttempts(event.getPublishAttempts() + 1);
                event.setLastError(null);

                log.info("Published outbox eventId={} type={} key={} to topic={}",
                        event.getEventId(), event.getEventType(), event.getKey(), reviewEventsTopic);

            } catch (Exception ex) {
                event.setPublishAttempts(event.getPublishAttempts() + 1);
                event.setLastError(ex.getMessage());
                log.warn("Failed publishing outbox eventId={} attempt={} error={}",
                        event.getEventId(), event.getPublishAttempts(), ex.toString());
            }
        }

        outboxEventRepository.saveAll(batch);
    }
}
