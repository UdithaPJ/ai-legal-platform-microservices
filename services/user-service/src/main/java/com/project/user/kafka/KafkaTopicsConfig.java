package com.project.user.kafka;

import org.apache.kafka.clients.admin.NewTopic;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.config.TopicBuilder;

/**
 * Declares the Kafka topics consumed by user-service so that they are
 * auto-created on startup if they do not already exist.
 * {@code KAFKA_AUTO_CREATE_TOPICS_ENABLE=true} is set on the broker in
 * docker-compose; these beans act as an explicit contract.
 */
@Configuration
public class KafkaTopicsConfig {

    @Bean
    public NewTopic userEventsTopic(
            @Value("${app.kafka.topics.userEvents}") String topic) {
        return TopicBuilder.name(topic)
                .partitions(3)
                .replicas(1)
                .build();
    }

    @Bean
    public NewTopic userEventsDlqTopic(
            @Value("${app.kafka.topics.userEventsDlq}") String topic) {
        return TopicBuilder.name(topic)
                .partitions(3)
                .replicas(1)
                .build();
    }
}
