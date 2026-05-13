package com.project.messaging.controller;

import com.project.messaging.dto.SendMessageRequest;
import com.project.messaging.model.Message;
import com.project.messaging.service.MessageService;
import lombok.RequiredArgsConstructor;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.UUID;

@RestController
@RequestMapping("/messages")
@RequiredArgsConstructor
public class MessageController {

    private final MessageService messageService;

    @PostMapping
    public Message sendMessage(@RequestBody SendMessageRequest request) {
        return messageService.sendMessage(
                request.getClientId(),
                request.getLawyerId(),
                request.getAppointmentId(),
                request.getSenderId(),
                request.getContent()
        );
    }

    @GetMapping("/{conversationId}")
    public List<Message> getMessages(@PathVariable UUID conversationId) {
        return messageService.getMessages(conversationId);
    }
}