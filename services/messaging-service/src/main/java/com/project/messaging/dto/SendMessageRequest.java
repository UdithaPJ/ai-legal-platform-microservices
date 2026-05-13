package com.project.messaging.dto;

import lombok.Data;


@Data
public class SendMessageRequest {

    private String clientId;
    private String lawyerId;
    private Long appointmentId;

    private String senderId;
    private String content;
}