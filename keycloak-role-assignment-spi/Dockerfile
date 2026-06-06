# ─── Stage 1: Build the SPI JAR ───────────────────────────────────────────────
FROM maven:3.9-eclipse-temurin-21-alpine AS spi-builder

WORKDIR /build

# Cache dependencies separately from source so repeated builds stay fast.
COPY pom.xml .
RUN mvn dependency:go-offline --no-transfer-progress -q

COPY src/ src/
RUN mvn clean package -DskipTests --no-transfer-progress

# ─── Stage 2: Build a Keycloak image with the SPI pre-compiled in ─────────────
FROM quay.io/keycloak/keycloak:26.0.7 AS keycloak-builder

# Copy the SPI JAR into the providers directory.
COPY --from=spi-builder /build/target/keycloak-role-assignment-spi.jar \
     /opt/keycloak/providers/keycloak-role-assignment-spi.jar

# Pre-build the Quarkus distribution so startup is fast and the SPI is baked in.
# --db=postgres tells the build which DB dialect to prepare; no connection is made here.
RUN /opt/keycloak/bin/kc.sh build --db=postgres

# ─── Stage 3: Minimal runtime image ──────────────────────────────────────────
FROM quay.io/keycloak/keycloak:26.0.7

# Bring in the pre-built Quarkus artefacts (providers compiled in).
COPY --from=keycloak-builder /opt/keycloak/ /opt/keycloak/

ENTRYPOINT ["/opt/keycloak/bin/kc.sh"]
