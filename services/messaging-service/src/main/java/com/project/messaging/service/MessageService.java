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
        if (!senderId.equals(clientId) && !senderId.equals(lawyerId)) {
            throw new RuntimeException("Unauthorized: sender not part of conversation");
        }

        Conversation conversation = conversationRepository
                .findByClientIdAndLawyerIdAndAppointmentId(clientId, lawyerId, appointmentId)
                .orElseThrow(() -> new RuntimeException(
                        "Conversation is not available for this appointment"));

        validateConversationEnabled(conversation);

        return saveUserMessage(conversation.getId(), senderId, content);
    }

    public Message sendSystemMessage(
            String clientId,
            String lawyerId,
            Long appointmentId,
            String content,
            boolean enableConversation
    ) {
        Conversation conversation = ensureConversation(
                clientId, lawyerId, appointmentId, enableConversation);

        Message message = Message.builder()
                .id(UUID.randomUUID())
                .conversationId(conversation.getId())
                .senderId("SYSTEM")
                .content(content)
                .messageType("SYSTEM")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        return messageRepository.save(message);
    }

    public List<Message> getMessages(UUID conversationId) {
        return messageRepository.findByConversationIdOrderByCreatedAtAsc(conversationId);
    }

    public List<Conversation> getUserConversations(String userId) {
        return conversationRepository.findConversationsByUser(userId);
    }

    public Message sendMessageToConversation(
            UUID conversationId,
            String senderId,
            String content
    ) {
        Conversation conversation = conversationRepository.findById(conversationId)
                .orElseThrow(() -> new RuntimeException("Conversation not found"));

        if (!senderId.equals(conversation.getClientId())
                && !senderId.equals(conversation.getLawyerId())) {
            throw new RuntimeException("Unauthorized");
        }

        validateConversationEnabled(conversation);

        return saveUserMessage(conversationId, senderId, content);
    }

    private Conversation ensureConversation(
            String clientId,
            String lawyerId,
            Long appointmentId,
            boolean enableConversation
    ) {
        Conversation conversation = conversationRepository
                .findByClientIdAndLawyerIdAndAppointmentId(clientId, lawyerId, appointmentId)
                .orElseGet(() -> conversationRepository.save(Conversation.builder()
                        .id(UUID.randomUUID())
                        .clientId(clientId)
                        .lawyerId(lawyerId)
                        .appointmentId(appointmentId)
                        .enabled(enableConversation)
                        .createdAt(LocalDateTime.now())
                        .build()));

        if (enableConversation && !Boolean.TRUE.equals(conversation.getEnabled())) {
            conversation.setEnabled(true);
            conversation = conversationRepository.save(conversation);
        }

        return conversation;
    }

    private void validateConversationEnabled(Conversation conversation) {
        if (!Boolean.TRUE.equals(conversation.getEnabled())) {
            throw new RuntimeException("Conversation is not enabled for messaging yet");
        }
    }

    private Message saveUserMessage(UUID conversationId, String senderId, String content) {
        Message message = Message.builder()
                .id(UUID.randomUUID())
                .conversationId(conversationId)
                .senderId(senderId)
                .content(content)
                .messageType("TEXT")
                .isRead(false)
                .createdAt(LocalDateTime.now())
                .build();

        return messageRepository.save(message);
    }
}
