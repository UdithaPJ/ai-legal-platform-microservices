package com.project.messaging.service;

import com.project.messaging.model.Conversation;
import com.project.messaging.model.Message;
import com.project.messaging.repository.ConversationRepository;
import com.project.messaging.repository.MessageRepository;
import lombok.RequiredArgsConstructor;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.List;
import java.util.UUID;

@Service
@RequiredArgsConstructor
public class MessageService {

    private final MessageRepository messageRepository;
    private final ConversationRepository conversationRepository;

    public Message sendMessage(
            String clientId,
            String lawyerId,
            Long appointmentId,
            String senderId,
            String content
    ) {

        // 1. Find or create conversation
        Conversation conversation = conversationRepository
                .findByClientIdAndLawyerIdAndAppointmentId(clientId, lawyerId, appointmentId)
                .orElseGet(() -> {
                    Conversation newConv = Conversation.builder()
                            .id(UUID.randomUUID())
                            .clientId(clientId)
                            .lawyerId(lawyerId)
                            .appointmentId(appointmentId)
                            .createdAt(LocalDateTime.now())
                            .build();
                    return conversationRepository.save(newConv);
                });

        // 2. Create message
        Message message = Message.builder()
                .id(UUID.randomUUID())
                .conversationId(conversation.getId())
                .senderId(senderId)
                .content(content)
                .messageType("TEXT")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        return messageRepository.save(message);
    }

    public List<Message> getMessages(UUID conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }
}