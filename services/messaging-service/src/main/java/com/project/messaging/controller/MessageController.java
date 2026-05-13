package com.project.messaging.controller;

import com.project.messaging.dto.SendMessageRequest;
import com.project.messaging.model.Conversation;
import com.project.messaging.model.Message;
import com.project.messaging.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public Message sendMessage(
            @RequestBody SendMessageRequest request,
            @AuthenticationPrincipal Jwt jwt
    ) {

        String userId = jwt.getSubject();

        System.out.println("User ID: " + userId);

        return messageService.sendMessage(
                request.getClientId(),
                request.getLawyerId(),
                request.getAppointmentId(),
                userId,
                request.getContent()
        );
    }

    @GetMapping("/{conversationId}")
    public List<Message> getMessages(@PathVariable UUID conversationId) {
        return messageService.getMessages(conversationId);
    }

    @GetMapping("/conversations/me")
    public List<Conversation> getMyConversations(@AuthenticationPrincipal Jwt jwt) {

        String userId = jwt.getSubject();

        return messageService.getUserConversations(userId);
    }
}