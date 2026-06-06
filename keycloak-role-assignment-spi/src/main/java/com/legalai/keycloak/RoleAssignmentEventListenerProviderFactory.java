package com.legalai.keycloak;

import org.jboss.logging.Logger;
import org.keycloak.Config;
import org.keycloak.events.EventListenerProvider;
import org.keycloak.events.EventListenerProviderFactory;
import org.keycloak.models.KeycloakSession;
import org.keycloak.models.KeycloakSessionFactory;

/**
 * Factory that registers {@link RoleAssignmentEventListenerProvider} under the
 * SPI ID {@value #PROVIDER_ID} and owns the lifecycle of the shared
 * {@link KafkaEventPublisher}.
 *
 * <p>The {@link KafkaEventPublisher} is created once in {@link #init} and
 * destroyed in {@link #close}.  Each provider instance receives the same
 * publisher reference — Kafka producers are thread-safe.
 *
 * <p>Kafka bootstrap server and topic are read from environment variables with
 * safe defaults for the local Docker Compose environment:
 * <ul>
 *   <li>{@code KAFKA_BOOTSTRAP_SERVERS} (default: {@code kafka:9092})</li>
 *   <li>{@code KAFKA_USER_EVENTS_TOPIC}  (default: {@code user.events.v1})</li>
 * </ul>
 *
 * Registration steps:
 * <ol>
 *   <li>Drop keycloak-role-assignment-spi.jar into /opt/keycloak/providers/</li>
 *   <li>Run: kc.sh build</li>
 *   <li>In Admin Console → Realm Settings → Events → Event listeners,
 *       add "role-assignment-listener".</li>
 * </ol>
 */
public class RoleAssignmentEventListenerProviderFactory implements EventListenerProviderFactory {

    private static final Logger LOG = Logger.getLogger(RoleAssignmentEventListenerProviderFactory.class);

    public static final String PROVIDER_ID = "role-assignment-listener";

    private KafkaEventPublisher publisher;

    @Override
    public EventListenerProvider create(KeycloakSession session) {
        return new RoleAssignmentEventListenerProvider(session, publisher);
    }

    @Override
    public void init(Config.Scope config) {
        String bootstrapServers = resolveEnv("KAFKA_BOOTSTRAP_SERVERS", "kafka:9092");
        String topic            = resolveEnv("KAFKA_USER_EVENTS_TOPIC",  "user.events.v1");

        LOG.infof("[RoleAssignment] Initialising KafkaEventPublisher — servers=%s topic=%s",
                bootstrapServers, topic);
        publisher = new KafkaEventPublisher(bootstrapServers, topic);
        LOG.infof("[RoleAssignment] EventListenerProviderFactory '%s' initialised.", PROVIDER_ID);
    }

    @Override
    public void postInit(KeycloakSessionFactory factory) {
        // Nothing to wire after the session factory is ready.
    }

    @Override
    public void close() {
        if (publisher != null) {
            publisher.close();
        }
        LOG.infof("[RoleAssignment] EventListenerProviderFactory '%s' closed.", PROVIDER_ID);
    }

    @Override
    public String getId() {
        return PROVIDER_ID;
    }

    // -------------------------------------------------------------------------

    private static String resolveEnv(String envVar, String defaultValue) {
        String value = System.getenv(envVar);
        if (value != null && !value.isBlank()) return value.trim();
        value = System.getProperty(envVar);
        if (value != null && !value.isBlank()) return value.trim();
        return defaultValue;
    }
}
