package com.project.messaging.config;

import lombok.RequiredArgsConstructor;
import org.springframework.messaging.*;
import org.springframework.messaging.simp.stomp.*;
import org.springframework.messaging.support.MessageBuilder;
import org.springframework.messaging.support.ChannelInterceptor;
import org.springframework.security.oauth2.jwt.*;
import org.springframework.stereotype.Component;

import com.project.messaging.model.Conversation;
import com.project.messaging.repository.ConversationRepository;

import java.util.Map;
import java.util.UUID;

@Component
@RequiredArgsConstructor
public class JwtChannelInterceptor implements ChannelInterceptor {

    private final JwtDecoder jwtDecoder;
    private final ConversationRepository conversationRepository;

    private static final String PRINCIPAL_SESSION_KEY = "principal";

    private JwtPrincipal decodePrincipal(String authHeader) {
        if (authHeader == null || !authHeader.startsWith("Bearer ")) {
            throw new MessagingException("Missing or invalid Authorization header");
        }

        String token = authHeader.substring(7);
        Jwt jwt = jwtDecoder.decode(token);
        return new JwtPrincipal(jwt);
    }

    /**
     * Ensures accessor.getUser() is populated.
     * @return true if the accessor was mutated (user added/changed) and message headers should be rebuilt.
     */
    private boolean ensureUserPresent(StompHeaderAccessor accessor, boolean requireToken) {
        if (accessor.getUser() != null) {
            return false;
        }

        Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
        if (sessionAttributes != null) {
            Object existing = sessionAttributes.get(PRINCIPAL_SESSION_KEY);
            if (existing instanceof JwtPrincipal principal) {
                accessor.setUser(principal);
                return true;
            }
        }

        String authHeader = accessor.getFirstNativeHeader("Authorization");
        if (authHeader == null) {
            authHeader = accessor.getFirstNativeHeader("authorization");
        }

        if (authHeader == null) {
            if (requireToken) {
                throw new MessagingException("Missing Authorization header");
            }
            return false;
        }

        JwtPrincipal principal = decodePrincipal(authHeader);
        accessor.setUser(principal);
        if (sessionAttributes != null) {
            sessionAttributes.put(PRINCIPAL_SESSION_KEY, principal);
        }
        return true;
    }

    @Override
    public Message<?> preSend(Message<?> message, MessageChannel channel) {

        StompHeaderAccessor accessor = StompHeaderAccessor.wrap(message);

        if (accessor.getCommand() == null) {
            return message;
        }

        if (StompCommand.CONNECT.equals(accessor.getCommand())) {

            boolean mutated = ensureUserPresent(accessor, true);

            if (mutated) {
                // Persist the Principal for subsequent frames on this session.
                Map<String, Object> sessionAttributes = accessor.getSessionAttributes();
                if (sessionAttributes != null && accessor.getUser() instanceof JwtPrincipal principal) {
                    sessionAttributes.put(PRINCIPAL_SESSION_KEY, principal);
                }
                return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
            }

            return message;
        }

        if (StompCommand.SUBSCRIBE.equals(accessor.getCommand())) {
            boolean mutated = ensureUserPresent(accessor, false);

            if (accessor.getUser() == null) {
                throw new MessagingException("Unauthenticated STOMP SUBSCRIBE");
            }

            String destination = accessor.getDestination();
            if (destination != null && destination.startsWith("/topic/conversations/")) {
                String conversationIdPart = destination.substring("/topic/conversations/".length());
                UUID conversationId;
                try {
                    conversationId = UUID.fromString(conversationIdPart);
                } catch (IllegalArgumentException ex) {
                    throw new MessagingException("Invalid conversation destination: " + destination, ex);
                }

                String userId = accessor.getUser().getName();
                Conversation conversation = conversationRepository.findById(conversationId)
                        .orElseThrow(() -> new MessagingException("Conversation not found: " + conversationId));

                if (!userId.equals(conversation.getClientId()) && !userId.equals(conversation.getLawyerId())) {
                    throw new MessagingException("Unauthorized conversation subscription");
                }
            }

            if (mutated) {
                return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
            }

            return message;
        }

        if (StompCommand.SEND.equals(accessor.getCommand())) {
            boolean mutated = ensureUserPresent(accessor, false);

            if (accessor.getUser() == null) {
                throw new MessagingException("Unauthenticated STOMP SEND");
            }

            if (mutated) {
                return MessageBuilder.createMessage(message.getPayload(), accessor.getMessageHeaders());
            }

            return message;
        }

        return message;
    }
}