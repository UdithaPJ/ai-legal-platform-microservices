package com.project.videosessionservice.dto;

import jakarta.validation.constraints.NotNull;
import lombok.Data;

import java.time.OffsetDateTime;

@Data
public class CreateVideoSessionRequestDTO {

    @NotNull(message = "Scheduled time is required")
    private OffsetDateTime scheduledAt;
}
