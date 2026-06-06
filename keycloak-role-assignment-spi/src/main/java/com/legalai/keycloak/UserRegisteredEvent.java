package com.legalai.keycloak;

/**
 * Value object representing the data payload of a UserRegistered domain event.
 * Serialised to JSON inside a CloudEvents envelope before publishing to Kafka.
 */
public class UserRegisteredEvent {

    private final String keycloakId;
    private final String email;
    private final String fullName;
    private final String phone;
    private final String role;
    /** null for CLIENT registrations */
    private final String barRegistrationNumber;

    public UserRegisteredEvent(
            String keycloakId,
            String email,
            String fullName,
            String phone,
            String role,
            String barRegistrationNumber) {
        this.keycloakId = keycloakId;
        this.email = email;
        this.fullName = fullName;
        this.phone = phone;
        this.role = role;
        this.barRegistrationNumber = barRegistrationNumber;
    }

    public String getKeycloakId()            { return keycloakId; }
    public String getEmail()                 { return email; }
    public String getFullName()              { return fullName; }
    public String getPhone()                 { return phone; }
    public String getRole()                  { return role; }
    public String getBarRegistrationNumber() { return barRegistrationNumber; }
}
