package com.legalai.keycloak;

import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.DisplayName;
import org.junit.jupiter.api.Nested;
import org.junit.jupiter.api.Test;
import org.junit.jupiter.api.extension.ExtendWith;
import org.junit.jupiter.params.ParameterizedTest;
import org.junit.jupiter.params.provider.NullAndEmptySource;
import org.junit.jupiter.params.provider.ValueSource;
import org.keycloak.events.Event;
import org.keycloak.events.EventType;
import org.keycloak.events.admin.AdminEvent;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.RealmModel;
import org.keycloak.models.RealmProvider;
import org.keycloak.models.RoleModel;
import org.keycloak.models.UserModel;
import org.keycloak.models.UserProvider;
import org.mockito.Mock;
import org.mockito.junit.jupiter.MockitoExtension;

import static org.mockito.ArgumentMatchers.any;
import static org.mockito.Mockito.never;
import static org.mockito.Mockito.verify;
import static org.mockito.Mockito.verifyNoInteractions;
import static org.mockito.Mockito.when;

@ExtendWith(MockitoExtension.class)
@DisplayName("RoleAssignmentEventListenerProvider")
class RoleAssignmentEventListenerProviderTest {

    private static final String REALM_ID   = "legal-platform";
    private static final String USER_ID    = "user-uuid-001";
    private static final String USER_EMAIL = "test@legalai.com";
    private static final String FULL_NAME  = "Test User";
    private static final String USERNAME   = "testuser";

    @Mock private KeycloakSession     session;
    @Mock private RealmProvider       realmProvider;
    @Mock private UserProvider        userProvider;
    @Mock private RealmModel          realm;
    @Mock private UserModel           user;
    @Mock private RoleModel           clientRole;
    @Mock private RoleModel           lawyerRole;
    @Mock private Event               event;
    // Mocked publisher so no real Kafka connection is attempted in unit tests
    @Mock private KafkaEventPublisher publisher;

    private RoleAssignmentEventListenerProvider provider;

    @BeforeEach
    void setUp() {
        // Inject mock publisher so the provider never touches a real Kafka broker
        provider = new RoleAssignmentEventListenerProvider(session, publisher);

        // Default: every event arrives as a REGISTER for the test user
        when(event.getType()).thenReturn(EventType.REGISTER);
        when(event.getRealmId()).thenReturn(REALM_ID);
        when(event.getUserId()).thenReturn(USER_ID);

        when(session.realms()).thenReturn(realmProvider);
        when(session.users()).thenReturn(userProvider);
        when(realmProvider.getRealm(REALM_ID)).thenReturn(realm);
        when(userProvider.getUserById(realm, USER_ID)).thenReturn(user);
        when(realm.getName()).thenReturn(REALM_ID);
        when(realm.getRole("CLIENT")).thenReturn(clientRole);
        when(realm.getRole("LAWYER")).thenReturn(lawyerRole);

        when(user.getId()).thenReturn(USER_ID);
        when(user.getEmail()).thenReturn(USER_EMAIL);
        when(user.getUsername()).thenReturn(USERNAME);

        // Stub name-resolution attributes.
        // The "full_name" custom attribute is set by Keycloakify.
        // The provider calls getFirstAttribute("full_name") before falling back to
        // getFirstName() / getLastName() / getUsername() — so stubbing it here
        // means the resolved fullName will equal FULL_NAME in all tests that reach
        // publishUserRegisteredEvent(), which keeps assertions focused on role assignment.
        when(user.getFirstAttribute("full_name")).thenReturn(FULL_NAME);
    }

    // =========================================================================
    // Scenario 1 — CLIENT registration
    // =========================================================================

    @Nested
    @DisplayName("Scenario 1 — CLIENT registration assigns CLIENT role")
    class ClientRegistration {

        @Test
        void exactMatch_shouldGrantClientRole() {
            when(user.getFirstAttribute("role")).thenReturn("CLIENT");
            when(user.hasRole(clientRole)).thenReturn(false);

            provider.onEvent(event);

            verify(user).grantRole(clientRole);
            verify(user, never()).grantRole(lawyerRole);
        }

        @Test
        void lowercaseValue_shouldNormaliseAndGrantClientRole() {
            when(user.getFirstAttribute("role")).thenReturn("client");
            when(user.hasRole(clientRole)).thenReturn(false);

            provider.onEvent(event);

            verify(user).grantRole(clientRole);
        }

        @Test
        void alreadyHasRole_shouldNotGrantAgain() {
            when(user.getFirstAttribute("role")).thenReturn("CLIENT");
            when(user.hasRole(clientRole)).thenReturn(true);

            provider.onEvent(event);

            verify(user, never()).grantRole(any());
        }
    }

    // =========================================================================
    // Scenario 2 — LAWYER registration
    // =========================================================================

    @Nested
    @DisplayName("Scenario 2 — LAWYER registration assigns LAWYER role")
    class LawyerRegistration {

        @Test
        void exactMatch_shouldGrantLawyerRole() {
            when(user.getFirstAttribute("role")).thenReturn("LAWYER");
            when(user.hasRole(lawyerRole)).thenReturn(false);

            provider.onEvent(event);

            verify(user).grantRole(lawyerRole);
            verify(user, never()).grantRole(clientRole);
        }

        @Test
        void lowercaseValue_shouldNormaliseAndGrantLawyerRole() {
            when(user.getFirstAttribute("role")).thenReturn("lawyer");
            when(user.hasRole(lawyerRole)).thenReturn(false);

            provider.onEvent(event);

            verify(user).grantRole(lawyerRole);
        }

        @Test
        void alreadyHasRole_shouldNotGrantAgain() {
            when(user.getFirstAttribute("role")).thenReturn("LAWYER");
            when(user.hasRole(lawyerRole)).thenReturn(true);

            provider.onEvent(event);

            verify(user, never()).grantRole(any());
        }
    }

    // =========================================================================
    // Scenario 3 — ADMIN role value must be rejected
    // =========================================================================

    @Nested
    @DisplayName("Scenario 3 — ADMIN role value must be rejected")
    class AdminRoleRejection {

        @Test
        void adminValue_shouldNeverGrantAnyRole() {
            when(user.getFirstAttribute("role")).thenReturn("ADMIN");

            provider.onEvent(event);

            verify(user, never()).grantRole(any());
        }

        @Test
        void adminLowercase_shouldNeverGrantAnyRole() {
            when(user.getFirstAttribute("role")).thenReturn("admin");

            provider.onEvent(event);

            verify(user, never()).grantRole(any());
        }
    }

    // =========================================================================
    // Scenario 4 — Missing role attribute
    // =========================================================================

    @Nested
    @DisplayName("Scenario 4 — Missing role attribute results in no assignment")
    class MissingRoleAttribute {

        @ParameterizedTest(name = "role attribute = [{0}]")
        @NullAndEmptySource
        @ValueSource(strings = {"   "})
        void blankOrNullAttribute_shouldSkipAssignment(String roleValue) {
            when(user.getFirstAttribute("role")).thenReturn(roleValue);

            provider.onEvent(event);

            verify(user, never()).grantRole(any());
        }
    }

    // =========================================================================
    // Scenario 5 — Invalid / arbitrary role values
    // =========================================================================

    @Nested
    @DisplayName("Scenario 5 — Invalid role values are rejected")
    class InvalidRoleValues {

        @ParameterizedTest(name = "role = [{0}]")
        @ValueSource(strings = {
            "SUPER_ADMIN",
            "superadmin",
            "ROOT",
            "MODERATOR",
            "SYSTEM",
            "CLIENT;DROP TABLE users;--",
            "CLIENT LAWYER",
            "../admin",
            "role_admin"
        })
        void disallowedRoleValues_shouldNeverGrantAnyRole(String illegalRole) {
            when(user.getFirstAttribute("role")).thenReturn(illegalRole);

            provider.onEvent(event);

            verify(user, never()).grantRole(any());
        }
    }

    // =========================================================================
    // Non-REGISTER events must be ignored entirely
    // =========================================================================

    @Nested
    @DisplayName("Non-REGISTER events are ignored")
    class NonRegisterEvents {

        @ParameterizedTest(name = "EventType.{0}")
        @ValueSource(strings = {"LOGIN", "LOGIN_ERROR", "LOGOUT", "UPDATE_PROFILE", "UPDATE_PASSWORD"})
        void nonRegisterEventType_shouldNotTouchSession(String eventTypeName) {
            EventType type = EventType.valueOf(eventTypeName);
            when(event.getType()).thenReturn(type);

            provider.onEvent(event);

            verifyNoInteractions(session);
            verify(user, never()).grantRole(any());
        }
    }

    // =========================================================================
    // Resilience — missing realm / user should not throw
    // =========================================================================

    @Nested
    @DisplayName("Resilience — null realm or user must not propagate exceptions")
    class Resilience {

        @Test
        void realmNotFound_shouldLogAndReturn() {
            when(realmProvider.getRealm(REALM_ID)).thenReturn(null);

            provider.onEvent(event);

            verify(user, never()).grantRole(any());
        }

        @Test
        void userNotFound_shouldLogAndReturn() {
            when(userProvider.getUserById(realm, USER_ID)).thenReturn(null);

            provider.onEvent(event);

            verify(user, never()).grantRole(any());
        }

        @Test
        void realmRoleDoesNotExist_shouldLogAndReturn() {
            when(user.getFirstAttribute("role")).thenReturn("CLIENT");
            when(realm.getRole("CLIENT")).thenReturn(null);

            provider.onEvent(event);

            verify(user, never()).grantRole(any());
        }

        @Test
        void unexpectedException_shouldNotPropagateToKeycloak() {
            when(user.getFirstAttribute("role")).thenThrow(new RuntimeException("DB unavailable"));

            // Must not throw — SPI exceptions must never break the registration flow
            provider.onEvent(event);
        }
    }

    // =========================================================================
    // Admin events must always be no-ops
    // =========================================================================

    @Test
    @DisplayName("Admin events are always ignored")
    void adminEvent_isIgnored(@Mock AdminEvent adminEvent) {
        provider.onEvent(adminEvent, true);
        provider.onEvent(adminEvent, false);

        verifyNoInteractions(session);
    }

    // =========================================================================
    // Factory contract
    // =========================================================================

    @Nested
    @DisplayName("RoleAssignmentEventListenerProviderFactory contract")
    class FactoryTest {

        private final RoleAssignmentEventListenerProviderFactory factory =
                new RoleAssignmentEventListenerProviderFactory();

        @Test
        void providerIdIsCorrect() {
            assert "role-assignment-listener".equals(factory.getId());
        }

        @Test
        void createReturnsProvider() {
            // create() requires a publisher to be set; call init() first.
            // We point at a non-existent broker so the KafkaProducer is created
            // in memory only — no TCP connection is made until send() is called.
            System.setProperty("KAFKA_BOOTSTRAP_SERVERS", "localhost:19999");
            System.setProperty("KAFKA_USER_EVENTS_TOPIC",  "user.events.v1");
            try {
                factory.init(null);
                var created = factory.create(session);
                assert created instanceof RoleAssignmentEventListenerProvider;
            } finally {
                System.clearProperty("KAFKA_BOOTSTRAP_SERVERS");
                System.clearProperty("KAFKA_USER_EVENTS_TOPIC");
                // Close quickly — KafkaEventPublisher.close() swallows exceptions,
                // so even if the broker is unreachable this will not hang.
                factory.close();
            }
        }

        @Test
        void lifecycleMethodsDoNotThrow() {
            System.setProperty("KAFKA_BOOTSTRAP_SERVERS", "localhost:19999");
            System.setProperty("KAFKA_USER_EVENTS_TOPIC",  "user.events.v1");
            try {
                factory.init(null);
                factory.postInit(null);
                factory.close();
            } finally {
                System.clearProperty("KAFKA_BOOTSTRAP_SERVERS");
                System.clearProperty("KAFKA_USER_EVENTS_TOPIC");
            }
        }
    }
}
