package com.project.messaging.model;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;
import java.util.UUID;

@Entity
@Table(name = "conversations")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Conversation {

    @Id
    private UUID id;

    private String clientId;
    private String lawyerId;

    private Long appointmentId;

    private UUID documentId;

    private Boolean enabled;

    private LocalDateTime createdAt;
}
