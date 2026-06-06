package com.project.lawyerprofileservice.kafka;

import org.apache.kafka.common.TopicPartition;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.kafka.core.KafkaTemplate;
import org.springframework.kafka.listener.CommonErrorHandler;
import org.springframework.kafka.listener.DefaultErrorHandler;
import org.springframework.kafka.listener.DeadLetterPublishingRecoverer;
import org.springframework.kafka.support.ExponentialBackOffWithMaxRetries;

/**
 * Shared Kafka error handler with exponential back-off (5 retries, 1s → 30s).
 *
 * <p>Routes failed records to the appropriate DLQ based on the source topic:
 * <ul>
 *   <li>{@code review.events.v1} → {@code review.events.v1.dlq}</li>
 *   <li>{@code user.events.v1}   → {@code user.events.v1.dlq}</li>
 * </ul>
 */
@Configuration
public class KafkaConsumerErrorHandlerConfig {

    @Bean
    public CommonErrorHandler kafkaErrorHandler(
            KafkaTemplate<String, String> kafkaTemplate,
            @Value("${app.kafka.topics.reviewEventsDlq}") String reviewDlq,
            @Value("${app.kafka.topics.userEventsDlq}")   String userDlq) {

        DeadLetterPublishingRecoverer recoverer = new DeadLetterPublishingRecoverer(
                kafkaTemplate,
                (record, ex) -> {
                    // Route to the DLQ that corresponds to the source topic
                    String dlq = record.topic().startsWith("user.") ? userDlq : reviewDlq;
                    return new TopicPartition(dlq, record.partition());
                }
        );

        ExponentialBackOffWithMaxRetries backOff = new ExponentialBackOffWithMaxRetries(5);
        backOff.setInitialInterval(1_000L);
        backOff.setMultiplier(2.0);
        backOff.setMaxInterval(30_000L);

        return new DefaultErrorHandler(recoverer, backOff);
    }
}
