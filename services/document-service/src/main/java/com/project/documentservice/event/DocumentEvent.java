package com.project.documentservice.event;

import com.fasterxml.jackson.annotation.JsonInclude;

import java.time.OffsetDateTime;
import java.util.UUID;

@JsonInclude(JsonInclude.Include.NON_NULL)
public record DocumentEvent(
        DocumentEventType eventType,
        Long requestId,
        Long appointmentId,
        UUID clientId,
        UUID lawyerId,
        String documentType,
        String message,
        OffsetDateTime occurredAt
) {}
