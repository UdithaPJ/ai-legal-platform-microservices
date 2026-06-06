package com.project.lawyerprofileservice.events;

import com.fasterxml.jackson.annotation.JsonIgnoreProperties;
import com.fasterxml.jackson.annotation.JsonProperty;
import lombok.Data;
import lombok.NoArgsConstructor;

/**
 * Data payload of a {@code com.legalplatform.user.registered.v1} Kafka event.
 * Lawyer-profile-service uses this to create the initial skeleton lawyer record.
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

    /** CLIENT or LAWYER */
    @JsonProperty("role")
    private String role;

    /** Present only when role = LAWYER */
    @JsonProperty("barRegistrationNumber")
    private String barRegistrationNumber;
}
