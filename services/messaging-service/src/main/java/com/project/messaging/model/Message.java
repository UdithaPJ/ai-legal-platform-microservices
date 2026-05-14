package com.project.messaging.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "messages")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Message {

    @Id
    private UUID id;

    private UUID conversationId;

    private String senderId;   // Keycloak ID

    @Column(columnDefinition = "TEXT")
    private String content;

    private String messageType;

    private Boolean isRead;

    private LocalDateTime createdAt;
}