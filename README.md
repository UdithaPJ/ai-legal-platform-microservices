# AI Legal Platform — Microservices

A distributed legal services platform: Spring Boot microservices, a Next.js 15 frontend, Keycloak for auth, Kafka for events, Consul for service discovery, and an AI document-analysis service powered by Ollama + pgvector.

For production, all backend services are exposed to the internet via Cloudflare Tunnel (no public ports, no static IP needed) and video calls run through 8x8 JaaS so no media bridge or port-forwarding is required.

---

## Architecture at a glance

| Tier | Component | Tech | Port (dev) |
|---|---|---|---|
| Edge | API Gateway | Spring Cloud Gateway (WebFlux) | 8080 |
| Auth | Keycloak (custom SPI for role assignment) | Keycloak 26 | 8181 |
| Services | User, Lawyer Profile, Appointment, Messaging, Review-Rating, Video Session | Spring Boot 3 | 8081-8086 |
| AI | Document analysis | FastAPI + Ollama + pgvector | 8087 |
| Discovery | Consul | HashiCorp Consul | 8500 |
| Events | Kafka + Zookeeper | Confluent | 29092 |
| DB | Postgres (one logical DB per service) | Postgres 16 | 5432 |
| Frontend | Web UI | Next.js 15 + Auth.js v5 | 3000 |
| Video | JaaS (8x8.vc) | 8x8 hosted | n/a |
| Public ingress (prod) | Cloudflare Tunnel | cloudflared | n/a |

---

## Prerequisites

- **Docker Desktop** (Windows / macOS / Linux)
- **Node.js 20+** (Next.js dev server)
- **JDK 21** (only for local Maven runs outside Docker)
- **Cloudflare account** (free) — only for public-domain deployment
- **8x8 JaaS account** (free tier) — only for video calls

---

## Quick start (development, localhost only)

```powershell
# 1. Bring up the entire backend stack
cd infrastructure
docker compose up -d

# 2. Start the frontend
cd ../legal-platform-web
npm install
# create .env.local — see "Environment files" below
npm run dev
```

Then:
- Frontend: http://localhost:3000
- Keycloak admin: http://localhost:8181/admin (user: `admin`, password: `admin`)
- API Gateway: http://localhost:8080
- Consul UI: http://localhost:8500
- Swagger / OpenAPI: http://localhost:8080/swagger-ui.html

> **First run takes 5–10 minutes** — Maven downloads dependencies and Keycloak imports the realm. Watch `docker compose logs -f keycloak api-gateway`.

### Environment files for development

Create `legal-platform-web/.env.local`:

```env
AUTH_SECRET=replace-with-a-32-char-random-string
AUTH_URL=http://localhost:3000
KEYCLOAK_CLIENT_ID=api-gateway-client
KEYCLOAK_CLIENT_SECRET=replace-with-the-secret-from-keycloak-admin
KEYCLOAK_ISSUER=http://localhost:8181/realms/legal-platform
API_GATEWAY_URL=http://localhost:8080
NEXT_PUBLIC_API_GATEWAY_URL=http://localhost:8080
```

Get `KEYCLOAK_CLIENT_SECRET` from Keycloak admin → Clients → `api-gateway-client` → **Credentials** tab. Generate `AUTH_SECRET` with:

```powershell
node -e "console.log(require('crypto').randomBytes(32).toString('hex'))"
```

---

## Production deployment (Cloudflare Tunnel + JaaS)

This setup exposes the platform on the domain (e.g. `legalai.bond`) without static IPs, port-forwarding, or paid hosting beyond the Cloudflare/JaaS free tiers.

### One-time setup

#### 1. Cloudflare Tunnel

```powershell
# Install cloudflared (winget / brew / apt)
cloudflared tunnel login
cloudflared tunnel create legal-platform
# Note the tunnel UUID — also saved to %USERPROFILE%\.cloudflared\<uuid>.json
cloudflared tunnel route dns legal-platform api.legalai.bond
cloudflared tunnel route dns legal-platform auth.legalai.bond
cloudflared tunnel route dns legal-platform app.legalai.bond
```

Copy the credentials file to where the container reads it:

```powershell
Copy-Item "$env:USERPROFILE\.cloudflared\<uuid>.json" `
    "infrastructure\cloudflare\tunnel-credentials.json"
```

Edit `infrastructure/cloudflare/cloudflared-config.yml` and replace the `tunnel:` UUID with yours.

#### 2. 8x8 JaaS (for video calls)

1. Sign up at [jaas.8x8.vc](https://jaas.8x8.vc) (free tier)
2. **API Keys** → **Add API key** → generate a new keypair → **download the private key**
3. Save the private key at:
   ```
   infrastructure/jaas/jaas-private-key.pk
   ```
4. Copy your **App ID** (`vpaas-magic-cookie-...`) and **Key ID** (`<appId>/<keyId>`). Set them in `services/video-session-service/src/main/resources/application.yaml` under `jaas:` or pass via env vars `JAAS_APP_ID` / `JAAS_KID`.

#### 3. Keycloak realm — production redirect URIs

The `legal-platform-realm.json` already has these. If you previously imported the realm on a fresh DB, edit live in the admin console:

- Realm `legal-platform` → Clients → `api-gateway-client`
  - **Valid redirect URIs**: add `https://app.legalai.bond/*`
  - **Valid post-logout redirect URIs**: add `https://app.legalai.bond/*`
  - **Web origins**: add `https://app.legalai.bond`

#### 4. Production frontend env

Create `legal-platform-web/.env.tunnel`:

```env
AUTH_SECRET=<your secret>
AUTH_URL=https://app.legalai.bond
AUTH_TRUST_HOST=true
KEYCLOAK_CLIENT_ID=api-gateway-client
KEYCLOAK_CLIENT_SECRET=<from Keycloak admin>
KEYCLOAK_ISSUER=https://auth.legalai.bond/realms/legal-platform
API_GATEWAY_URL=https://api.legalai.bond
NEXT_PUBLIC_API_GATEWAY_URL=https://api.legalai.bond
```

### Run it

```powershell
# Bring up backend + Cloudflare tunnel
cd infrastructure
docker compose -f docker-compose.yml -f docker-compose.tunnel.yml build cloudflared video-session-service
docker compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d

# Start the Next.js frontend with production env
cd ../legal-platform-web
npm run tunnel
```

Open `https://app.legalai.bond` — everything routes through Cloudflare, video calls go through JaaS.

---

## Project layout

```
.
├── infrastructure/                # Docker Compose, Cloudflare, JaaS, Keycloak realm
│   ├── docker-compose.yml         # Base — all services for dev
│   ├── docker-compose.tunnel.yml  # Production override (Cloudflare + JaaS env vars)
│   ├── cloudflare/                # cloudflared image + ingress config
│   ├── jaas/                      # JaaS RSA private key  (git-ignored)
│   └── keycloak/realms/           # Realm JSON imported on first start
│
├── api-gateway/                   # Spring Cloud Gateway (WebFlux), JWT validation
│
├── services/
│   ├── user-service/              # User CRUD + profile
│   ├── lawyer-profile-service/    # Lawyer profiles + search
│   ├── appointment-service/       # Booking + scheduling
│   ├── messaging-service/         # WebSocket chat (STOMP)
│   ├── review-rating-service/     # Reviews
│   ├── video-session-service/     # JaaS JWT signing + session lifecycle
│   └── ai-analysis-service/       # Python FastAPI — Ollama + pgvector
│
├── keycloak-role-assignment-spi/  # Custom Keycloak SPI: auto-assigns CLIENT/LAWYER roles
│
└── legal-platform-web/            # Next.js 15 + Auth.js v5 frontend
```

---

## Common operations

```powershell
# Tail logs for a service
docker compose logs -f api-gateway

# Restart one service after code changes
docker compose -f infrastructure/docker-compose.yml build video-session-service
docker compose -f infrastructure/docker-compose.yml up -d --force-recreate video-session-service

# Reset the database (DESTROYS all data)
docker compose -f infrastructure/docker-compose.yml down -v
docker compose -f infrastructure/docker-compose.yml up -d

# Tail the Cloudflare tunnel
docker logs cloudflared --follow
```

---

## Sensitive files — never commit

The root `.gitignore` ignores these. Before pushing to a public repo, run `git status` and double-check nothing sensitive appears:

| Path | What it is | Source |
|---|---|---|
| `infrastructure/cloudflare/tunnel-credentials.json` | Cloudflare tunnel UUID + secret | `cloudflared tunnel create` |
| `infrastructure/jaas/jaas-private-key.pk` | 8x8 JaaS RSA private key | JaaS dashboard |
| `infrastructure/.env.tunnel` | Reserved for tunnel env overrides | hand-crafted |
| `infrastructure/.env.jitsi` | Self-hosted Jitsi secrets (not currently used) | hand-crafted |
| `legal-platform-web/.env.local` | Dev `AUTH_SECRET`, `KEYCLOAK_CLIENT_SECRET` | hand-crafted |
| `legal-platform-web/.env.tunnel` | Prod `AUTH_SECRET`, `KEYCLOAK_CLIENT_SECRET` | hand-crafted |

If you accidentally commit one of these, rotate the secret at its source (Keycloak admin, Cloudflare dashboard, JaaS dashboard) **immediately** — gitignoring after the fact doesn't help.

---

## Tech stack

- **Backend**: Spring Boot 3, Spring Cloud 2025, Spring Cloud Gateway (WebFlux), Spring Security, Spring Data JPA, Spring Kafka, Flyway, JJWT
- **Auth**: Keycloak 26 with custom Java SPI for automatic role assignment
- **Frontend**: Next.js 15 (App Router), React 19, Auth.js v5 (Keycloak provider), Tailwind, shadcn/ui
- **AI**: FastAPI, Ollama, pgvector, pydantic-settings
- **Infra**: Docker Compose, Consul, Kafka, Postgres 16, Cloudflare Tunnel, 8x8 JaaS

---

## License

Proprietary. All rights reserved.
