package com.project.messaging.repository;

import com.project.messaging.model.Conversation;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.util.List;
import java.util.Optional;
import java.util.UUID;

public interface ConversationRepository extends JpaRepository<Conversation, UUID> {

    Optional<Conversation> findByClientIdAndLawyerIdAndAppointmentId(
            String clientId,
            String lawyerId,
            Long appointmentId
    );

    @Query("""
        SELECT c FROM Conversation c
        WHERE c.clientId = :userId OR c.lawyerId = :userId
    """)
    List<Conversation> findConversationsByUser(@Param("userId") String userId);
}