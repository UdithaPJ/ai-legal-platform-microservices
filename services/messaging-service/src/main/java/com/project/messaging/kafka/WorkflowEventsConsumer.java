package com.project.messaging.kafka;

import com.fasterxml.jackson.databind.ObjectMapper;
import com.project.messaging.events.WorkflowEvent;
import com.project.messaging.events.WorkflowEventType;
import com.project.messaging.model.Message;
import com.project.messaging.service.MessageService;
import lombok.RequiredArgsConstructor;
import lombok.extern.slf4j.Slf4j;
import org.springframework.kafka.annotation.EnableKafka;
import org.springframework.kafka.annotation.KafkaListener;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
@Slf4j
@EnableKafka
public class WorkflowEventsConsumer {

    private final ObjectMapper objectMapper;
    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @KafkaListener(topics = "${app.kafka.topics.workflowEvents}")
    public void onMessage(String payload) {
        WorkflowEvent event;
        try {
            event = objectMapper.readValue(payload, WorkflowEvent.class);
        } catch (Exception e) {
            log.warn("Ignoring invalid workflow event payload");
            return;
        }

        if (event.eventType() == null
                || event.appointmentId() == null
                || event.clientId() == null
                || event.lawyerId() == null) {
            return;
        }

        WorkflowMessage workflowMessage = switch (event.eventType()) {
            case APPOINTMENT_REQUESTED -> new WorkflowMessage(
                    "New appointment request received",
                    false
            );
            case APPOINTMENT_ACCEPTED, APPOINTMENT_CONFIRMED -> new WorkflowMessage(
                    "Appointment accepted. Chat enabled.",
                    true
            );
            case APPOINTMENT_REJECTED -> new WorkflowMessage(
                    "Appointment rejected",
                    false
            );
            case VIDEO_REQUESTED -> new WorkflowMessage(
                    "Video consultation requested",
                    true
            );
            case APPOINTMENT_SCHEDULED -> new WorkflowMessage(
                    buildScheduledContent(event),
                    true
            );
            case APPOINTMENT_COMPLETED -> new WorkflowMessage(
                    "Appointment completed",
                    true
            );
            default -> null;
        };

        if (workflowMessage == null) {
            return;
        }

        Message saved = messageService.sendSystemMessage(
                event.clientId(),
                event.lawyerId(),
                event.appointmentId(),
                workflowMessage.content(),
                workflowMessage.enableConversation()
        );

        messagingTemplate.convertAndSend(
                "/topic/conversations/" + saved.getConversationId(),
                saved
        );
    }

    private String buildScheduledContent(WorkflowEvent event) {
        if (event.meetingUrl() != null && !event.meetingUrl().isBlank()) {
            return "Appointment scheduled. Meeting link: " + event.meetingUrl();
        }
        return "Appointment scheduled";
    }

    private record WorkflowMessage(String content, boolean enableConversation) {
    }
}
