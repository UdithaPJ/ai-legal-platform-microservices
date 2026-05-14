package com.project.messaging.controller;

import com.project.messaging.dto.ChatMessageRequest;
import com.project.messaging.model.Message;
import com.project.messaging.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.handler.annotation.*;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.stereotype.Controller;
import org.springframework.messaging.MessagingException;

import java.security.Principal;

@Controller
@RequiredArgsConstructor
public class WebSocketController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @MessageMapping("/chat.send")
    public void sendMessage(
            @Payload ChatMessageRequest request,
            Principal principal
    ) {

                if (principal == null) {
                        throw new MessagingException("Unauthenticated WebSocket message");
                }

                String senderId = principal.getName();

        Message message = messageService.sendMessageToConversation(
                request.getConversationId(),
                senderId,
                request.getContent()
        );

        messagingTemplate.convertAndSend(
                "/topic/conversations/" + request.getConversationId(),
                message
        );
    }
}
