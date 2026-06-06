# Keycloak Role Assignment SPI — Setup & Verification Guide

## Architecture Overview

```
Keycloakify Registration Page
        │  stores user attribute: role = "CLIENT" | "LAWYER"
        ▼
Keycloak REGISTER Event
        │
        ▼
RoleAssignmentEventListenerProvider
        │  reads user.getFirstAttribute("role")
        │  validates: only CLIENT / LAWYER allowed
        │  loads realm role via realm.getRole(...)
        ▼
user.grantRole(role)  ←  automatic, no frontend involvement
```

---

## Part 1 — Build & Deploy

### Local development (Docker Compose)

```bash
# From the repository root
cd infrastructure
docker compose build keycloak   # builds the multi-stage image (Maven + Keycloak)
docker compose up -d
```

The realm JSON at `infrastructure/keycloak/realms/legal-platform-realm.json` already
registers `role-assignment-listener` as an event listener, so no manual Admin Console
steps are needed for local dev.

### Manual JAR deployment (non-Docker)

```bash
# Build
cd keycloak-role-assignment-spi
mvn clean package -DskipTests

# Deploy
cp target/keycloak-role-assignment-spi.jar /opt/keycloak/providers/

# Rebuild Keycloak Quarkus distribution (required once after any provider change)
/opt/keycloak/bin/kc.sh build --db=postgres

# Start
/opt/keycloak/bin/kc.sh start-dev
```

---

## Part 2 — Manual Admin Console Configuration (if not using realm import)

1. Log in to Keycloak Admin Console → http://localhost:8181
2. Select realm: **legal-platform**
3. **Realm Settings → Events tab**
   - Set **Save Events** → ON
   - Add to **Event listeners**: `role-assignment-listener`
   - Under **Saved Types**, ensure `REGISTER` is checked
   - Click **Save**

---

## Part 3 — Verification Checklist

### Confirm SPI loaded

Check Keycloak logs on startup for:
```
[RoleAssignment] EventListenerProviderFactory 'role-assignment-listener' initialised.
```

If this line is absent:
- Confirm the JAR is present in `/opt/keycloak/providers/`
- Confirm `kc.sh build` was run after adding the JAR
- Confirm the service loader file exists:
  `META-INF/services/org.keycloak.events.EventListenerProviderFactory`

### Confirm event listener is registered in realm

Admin Console → Realm Settings → Events → Event listeners should show:
- `jboss-logging`
- `role-assignment-listener`

### Confirm role assignment after registration

1. Register a new user via the Keycloakify registration page selecting **Client**
2. Admin Console → Users → find the user → Role Mappings tab
   - Expected: `CLIENT` realm role is assigned
3. Check Keycloak logs for:
   ```
   [RoleAssignment] Role 'CLIENT' successfully assigned to user: id=... email=...
   ```

4. Repeat with a **Lawyer** registration and verify `LAWYER` role appears.

---

## Part 4 — Security Notes

| Attempted value | Result |
|----------------|--------|
| `CLIENT` | CLIENT realm role granted |
| `LAWYER` | LAWYER realm role granted |
| `client` / `lawyer` (lower-case) | Normalised to upper-case, role granted |
| `ADMIN` | Rejected — no role assigned |
| `SUPER_ADMIN` | Rejected — no role assigned |
| `""` / `null` / whitespace | Skipped — no role assigned |
| Any other value | Rejected — no role assigned |

The whitelist is defined as `Set.of("CLIENT", "LAWYER")` in
`RoleAssignmentEventListenerProvider`. To add a new allowed role, update this set
**and** create the corresponding realm role in Keycloak first.

---

## Part 5 — Running Tests

```bash
cd keycloak-role-assignment-spi
mvn test
```

Test scenarios covered:
- Scenario 1: CLIENT registration → CLIENT role assigned
- Scenario 2: LAWYER registration → LAWYER role assigned
- Scenario 3: role=ADMIN → rejected, no assignment
- Scenario 4: missing role attribute → no assignment
- Scenario 5: arbitrary/invalid values → no assignment
- Resilience: null realm, null user, missing realm role, unexpected exception
- Non-REGISTER events are fully ignored
- Factory lifecycle (init, postInit, close, getId)

---

## Part 6 — Keycloakify Theme JAR Version Note

The docker-compose volume mounts `keycloak-theme-for-kc-26.jar`. If you currently have
`keycloak-theme-for-kc-22-to-25.jar`, rename or rebuild the Keycloakify theme targeting
Keycloak 26.x:

```bash
# In your Keycloakify project
npx keycloakify build --keycloak-version 26
```

Place the output JAR at `infrastructure/keycloak/keycloak-theme-for-kc-26.jar`.
