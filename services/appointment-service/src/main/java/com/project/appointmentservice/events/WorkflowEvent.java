package com.project.appointmentservice.events;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record WorkflowEvent(
        WorkflowEventType eventType,
        Long appointmentId,
        String clientId,
        String lawyerId,
        String meetingUrl,
        OffsetDateTime appointmentDateTime,
        String message,
        OffsetDateTime occurredAt
) {
}
