package com.project.appointmentservice.events;

import com.fasterxml.jackson.databind.ObjectMapper;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@EnableKafka
public class WorkflowEventsListener {

    private final ObjectMapper objectMapper;

    @KafkaListener(topics = "${app.kafka.topics.workflowEvents}")
    public void onMessage(String payload) {
        WorkflowEvent event;
        try {
            event = objectMapper.readValue(payload, WorkflowEvent.class);
        } catch (Exception e) {
            log.warn("Ignoring invalid workflow event payload");
            return;
        }

        if (event.eventType() == WorkflowEventType.VIDEO_SESSION_ENDED) {
            log.info("Received VIDEO_SESSION_ENDED for appointment {}. Completion is explicit.",
                    event.appointmentId());
        }
    }
}
