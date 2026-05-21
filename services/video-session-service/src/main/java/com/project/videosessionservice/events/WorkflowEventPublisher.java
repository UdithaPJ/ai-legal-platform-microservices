package com.project.videosessionservice.events;

import com.fasterxml.jackson.core.JsonProcessingException;
import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.stereotype.Service;

@Service
@RequiredArgsConstructor
@Slf4j
public class WorkflowEventPublisher {

    private final KafkaTemplate<String, String> kafkaTemplate;
    private final ObjectMapper objectMapper;

    @org.springframework.beans.factory.annotation.Value("${app.kafka.topics.workflowEvents}")
    private String topic;

    public void publish(WorkflowEvent event) {
        try {
            String payload = objectMapper.writeValueAsString(event);
            kafkaTemplate.send(topic, event.eventType().name(), payload);
        } catch (JsonProcessingException e) {
            log.warn("Could not serialize workflow event: {}", event.eventType());
        } catch (RuntimeException e) {
            log.warn("Could not publish workflow event: {}", event.eventType());
        }
    }
}
