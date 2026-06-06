package com.legalai.keycloak;

import org.jboss.logging.Logger;
import org.keycloak.events.Event;
import org.keycloak.events.EventListenerProvider;
import org.keycloak.events.EventType;
import org.keycloak.events.admin.AdminEvent;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;

import java.util.Set;

/**
 * Keycloak Event Listener SPI that:
 *   1. Assigns CLIENT or LAWYER realm roles on user registration.
 *   2. Publishes a {@code UserRegistered} domain event to Kafka after a
 *      successful role grant.
 *
 * <h3>fullName resolution order</h3>
 * <ol>
 *   <li>Custom attribute {@code full_name} — set by the Keycloakify registration form.</li>
 *   <li>Keycloak built-in {@code firstName} + {@code lastName} — set when using the
 *       standard Keycloak registration form.</li>
 *   <li>Just {@code firstName} alone — handles forms that only collect a given name.</li>
 *   <li>{@code username} — last resort; always non-null in Keycloak.</li>
 * </ol>
 *
 * <p>If the resolved fullName is still blank, the event is <em>not</em> published and
 * an error is logged so that the misconfiguration is caught early rather than producing
 * corrupt user records downstream.
 */
public class RoleAssignmentEventListenerProvider implements EventListenerProvider {

    private static final Logger LOG = Logger.getLogger(RoleAssignmentEventListenerProvider.class);

    private static final Set<String> ALLOWED_ROLES = Set.of("CLIENT", "LAWYER");

    private final KeycloakSession     session;
    private final KafkaEventPublisher publisher;

    public RoleAssignmentEventListenerProvider(
            KeycloakSession session,
            KafkaEventPublisher publisher) {
        this.session   = session;
        this.publisher = publisher;
    }

    // -------------------------------------------------------------------------
    // EventListenerProvider
    // -------------------------------------------------------------------------

    @Override
    public void onEvent(Event event) {
        if (EventType.REGISTER != event.getType()) {
            return;
        }
        LOG.infof("[RoleAssignment] REGISTER event received — userId=%s realmId=%s",
                event.getUserId(), event.getRealmId());
        try {
            processRegistration(event);
        } catch (Exception ex) {
            // Never let an SPI exception break the registration flow.
            LOG.errorf(ex, "[RoleAssignment] Unexpected error for userId=%s", event.getUserId());
        }
    }

    @Override
    public void onEvent(AdminEvent adminEvent, boolean includeRepresentation) { }

    @Override
    public void close() { }

    // -------------------------------------------------------------------------
    // Internal logic
    // -------------------------------------------------------------------------

    private void processRegistration(Event event) {
        RealmModel realm = session.realms().getRealm(event.getRealmId());
        if (realm == null) {
            LOG.warnf("[RoleAssignment] Realm not found: %s — skipping.", event.getRealmId());
            return;
        }

        UserModel user = session.users().getUserById(realm, event.getUserId());
        if (user == null) {
            LOG.warnf("[RoleAssignment] User not found: %s — skipping.", event.getUserId());
            return;
        }

        LOG.infof("[RoleAssignment] Processing registration: id=%s email=%s username=%s",
                user.getId(), user.getEmail(), user.getUsername());

        String rawRoleAttr = user.getFirstAttribute("role");
        if (rawRoleAttr == null || rawRoleAttr.isBlank()) {
            LOG.warnf("[RoleAssignment] User %s has no 'role' attribute — skipping.", user.getId());
            return;
        }

        String normalised = rawRoleAttr.trim().toUpperCase();
        if (!ALLOWED_ROLES.contains(normalised)) {
            LOG.warnf("[RoleAssignment] Rejected disallowed role '%s' for user %s.",
                    rawRoleAttr, user.getId());
            return;
        }

        // ── Role assignment ──────────────────────────────────────────────────
        RoleModel role = realm.getRole(normalised);
        if (role == null) {
            LOG.errorf("[RoleAssignment] Realm role '%s' does not exist in realm '%s'. userId=%s",
                    normalised, realm.getName(), user.getId());
            return;
        }

        if (user.hasRole(role)) {
            LOG.infof("[RoleAssignment] User %s already holds role %s.", user.getId(), normalised);
        } else {
            user.grantRole(role);
            LOG.infof("[RoleAssignment] Role '%s' granted to user id=%s email=%s",
                    normalised, user.getId(), user.getEmail());
        }

        // ── Event publishing ─────────────────────────────────────────────────
        publishUserRegisteredEvent(user, normalised);
    }

    private void publishUserRegisteredEvent(UserModel user, String role) {
        try {
            String fullName = resolveFullName(user);

            // Diagnostic log — shows exactly what each source produces so
            // a misconfigured form is visible in Keycloak logs immediately.
            LOG.infof("[RoleAssignment] Name resolution for userId=%s: " +
                      "attr(full_name)='%s' firstName='%s' lastName='%s' username='%s' → resolved='%s'",
                    user.getId(),
                    user.getFirstAttribute("full_name"),
                    user.getFirstName(),
                    user.getLastName(),
                    user.getUsername(),
                    fullName);

            // Guard: refuse to publish an event with a blank fullName so that
            // the root cause is surfaced as a clear log error rather than a
            // downstream database constraint violation.
            if (fullName == null || fullName.isBlank()) {
                LOG.errorf("[RoleAssignment] Cannot resolve fullName for userId=%s — " +
                           "UserRegistered event NOT published. " +
                           "Ensure the registration form sets the 'full_name' user attribute.",
                        user.getId());
                return;
            }

            String phone             = user.getFirstAttribute("phone");
            String barRegNumber      = user.getFirstAttribute("bar_registration_number");

            LOG.infof("[RoleAssignment] Publishing UserRegistered: " +
                      "keycloakId=%s email=%s fullName='%s' phone=%s role=%s barReg=%s",
                    user.getId(), user.getEmail(), fullName, phone, role, barRegNumber);

            UserRegisteredEvent domainEvent = new UserRegisteredEvent(
                    user.getId(),
                    user.getEmail(),
                    fullName,
                    phone,
                    role,
                    barRegNumber
            );

            publisher.publish(domainEvent);

        } catch (Exception ex) {
            // Kafka failure must NOT roll back the registration.
            LOG.errorf(ex,
                    "[RoleAssignment] Failed to publish UserRegistered event for userId=%s. " +
                    "Manual reconciliation may be needed.", user.getId());
        }
    }

    /**
     * Resolves the user's full name using the priority chain documented in the class Javadoc.
     * Never returns null — falls back to username at minimum.
     */
    private String resolveFullName(UserModel user) {
        // 1. Custom attribute set by Keycloakify registration form
        String fromAttr = user.getFirstAttribute("full_name");
        if (fromAttr != null && !fromAttr.isBlank()) {
            return fromAttr.trim();
        }

        // 2. Keycloak built-in firstName + lastName (standard Keycloak form)
        String first = user.getFirstName();
        String last  = user.getLastName();
        boolean hasFirst = first != null && !first.isBlank();
        boolean hasLast  = last  != null && !last.isBlank();

        if (hasFirst && hasLast) {
            return first.trim() + " " + last.trim();
        }

        // 3. firstName alone (form only collected a given name)
        if (hasFirst) {
            return first.trim();
        }

        // 4. Last resort — username is guaranteed non-null by Keycloak
        String username = user.getUsername();
        if (username != null && !username.isBlank()) {
            LOG.warnf("[RoleAssignment] fullName could not be resolved from form attributes " +
                      "for userId=%s — falling back to username. " +
                      "Check that the registration form sets the 'full_name' attribute.",
                    user.getId());
            return username.trim();
        }

        return null; // triggers the guard above and blocks publishing
    }
}
