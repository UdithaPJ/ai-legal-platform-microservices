package com.project.user.events;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Represents the {@code data} node inside a CloudEvents-envelope
 * {@code com.legalplatform.user.registered.v1} Kafka message.
 *
 * <p>The full envelope looks like:
 * <pre>
 * {
 *   "specversion": "1.0",
 *   "id": "...",
 *   "type": "com.legalplatform.user.registered.v1",
 *   "source": "/keycloak/registration",
 *   "schemaVersion": 1,
 *   "data": { ... this class ... }
 * }
 * </pre>
 */
@Data
@NoArgsConstructor
@JsonIgnoreProperties(ignoreUnknown = true)
public class UserRegisteredEvent {

    @JsonProperty("keycloakId")
    private String keycloakId;

    @JsonProperty("email")
    private String email;

    @JsonProperty("fullName")
    private String fullName;

    @JsonProperty("phone")
    private String phone;

    /** One of: CLIENT, LAWYER */
    @JsonProperty("role")
    private String role;

    /** Present only when role = LAWYER */
    @JsonProperty("barRegistrationNumber")
    private String barRegistrationNumber;
}
