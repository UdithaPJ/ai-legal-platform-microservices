package com.project.messaging.controller;

import com.project.messaging.dto.SendMessageRequest;
import com.project.messaging.model.Conversation;
import com.project.messaging.model.Message;
import com.project.messaging.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.messaging.simp.SimpMessagingTemplate;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.GetMapping;
import org.springframework.web.bind.annotation.PathVariable;
import org.springframework.web.bind.annotation.PostMapping;
import org.springframework.web.bind.annotation.RequestBody;
import org.springframework.web.bind.annotation.RequestMapping;
import org.springframework.web.bind.annotation.RestController;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;
    private final SimpMessagingTemplate messagingTemplate;

    @PostMapping
    public Message sendMessage(
            @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String userId = jwt.getSubject();

        Message message = messageService.sendMessage(
                request.getClientId(),
                request.getLawyerId(),
                request.getAppointmentId(),
                userId,
                request.getContent()
        );

        messagingTemplate.convertAndSend(
                "/topic/conversations/" + message.getConversationId(),
                message
        );

        return message;
    }

    @GetMapping("/{conversationId}")
    public List<Message> getMessages(@PathVariable UUID conversationId) {
        return messageService.getMessages(conversationId);
    }

    @GetMapping("/conversations/me")
    public List<Conversation> getMyConversations(@AuthenticationPrincipal Jwt jwt) {
        return messageService.getUserConversations(jwt.getSubject());
    }
}
