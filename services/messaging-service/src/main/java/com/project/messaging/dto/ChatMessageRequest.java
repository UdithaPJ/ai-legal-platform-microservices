package com.project.messaging.dto;

import lombok.Data;

import java.util.UUID;

@Data
public class ChatMessageRequest {

    private UUID conversationId;
    private String content;
}
