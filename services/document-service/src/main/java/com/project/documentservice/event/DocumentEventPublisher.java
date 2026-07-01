package com.project.documentservice.event;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class DocumentEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @Value("${app.kafka.topics.documentEvents}")
    private String topic;

    public void publish(DocumentEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(topic, event.eventType().name(), payload);
        } catch (JsonProcessingException e) {
            log.warn("Could not serialize document event: {}", event.eventType());
        } catch (RuntimeException e) {
            log.warn("Could not publish document event: {}", event.eventType());
        }
    }
}
