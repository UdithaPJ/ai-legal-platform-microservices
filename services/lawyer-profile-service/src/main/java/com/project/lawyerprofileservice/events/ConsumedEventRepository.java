package com.project.lawyerprofileservice.events;

import org.springframework.data.jpa.repository.JpaRepository;

import java.util.UUID;

public interface ConsumedEventRepository extends JpaRepository<ConsumedEvent, UUID> {
}
