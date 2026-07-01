# LegalAI — Microservices

## Table of Contents

- [Introduction](#introduction)
- [Architecture](#architecture)
  - [Design Decisions](#design-decisions)
  - [Microservices](#microservices)
    - [Implementation Methods](#implementation-methods)
    - [Core Services](#core-services)
    - [Discovery Server](#discovery-server)
    - [API Gateway](#api-gateway)
- [User Interface](#user-interface)
- [API Testing Tools](#api-testing-tools)
- [Deployment](#deployment)
  - [Local Machine](#local-machine)
  - [Docker Containers](#docker-containers)
  - [Cloud Deployment](#cloud-deployment)
- [Source Code](#source-code)
  - [Development Challenges](#development-challenges)

---

## Introduction

**LegalAI** is a distributed, cloud-ready web application that connects clients with legal professionals. It allows clients to discover lawyers, book appointments, exchange documents, hold real-time video consultations, and communicate via a live chat interface — all from a single web application.

A standout feature is the **AI-powered document analysis engine**, which accepts uploaded legal contracts (PDF and DOCX) and uses a locally-hosted large language model (LLM) to produce a structured analysis: a plain-English summary, a breakdown of risky clauses ranked by severity, and actionable recommendations. This gives clients immediate insight into legal documents without requiring prior legal expertise.

### Core Features

| Feature | Description |
|---|---|
| Lawyer Discovery | Browse and filter lawyers by specialization and availability |
| Appointment Booking | Clients request, schedule, and manage appointments with lawyers |
| Real-Time Messaging | WebSocket-powered chat between client and lawyer within an appointment |
| Video Consultations | Jitsi-as-a-Service (JaaS) embedded video calls linked to appointments |
| Document Requests | Lawyers request documents from clients; clients upload directly via the platform |
| AI Document Analysis | Contract analysis with clause risk detection using a RAG pipeline and a local LLM |
| Review & Rating | Clients submit star ratings and written reviews after completed appointments |
| Role-Based Access | Separate dashboard experiences for clients, lawyers, and admins |

The overall goal is to make quality legal assistance more accessible by reducing friction in the client–lawyer relationship and providing AI-assisted legal literacy tools.

---

## Architecture

### Design Decisions

The application is decomposed into independent microservices rather than built as a monolith for the following reasons:

**Independent deployability and scalability.** Each functional domain (appointments, messaging, video, documents, AI analysis) has different load characteristics. The AI analysis service is CPU-intensive and benefits from being scaled independently without affecting the lightweight appointment service.

**Technology heterogeneity.** The core business services are implemented in Java (Spring Boot) because the Spring ecosystem offers mature libraries for security, data access, service discovery, and inter-service communication. The AI analysis service is implemented in Python (FastAPI) because Python has the best ecosystem for NLP, document parsing, and LLM orchestration. A microservices architecture allows this mix without coupling the runtimes.

**Fault isolation.** A failure in the review or messaging service does not bring down appointment booking or document management. Each service has its own database, preventing cross-service data corruption.

**Domain-driven boundaries.** Each service owns a single bounded context:

| Service | Domain |
|---|---|
| User Service | User identity and profile data |
| Lawyer Profile Service | Lawyer onboarding, profiles, and availability |
| Appointment Service | Appointment lifecycle and scheduling |
| Messaging Service | Real-time conversations |
| Video Session Service | Video call session management |
| Document Service | Document request lifecycle and file storage |
| AI Analysis Service | Contract ingestion, embedding, and LLM analysis |
| Review & Rating Service | Post-appointment client reviews |

**Asynchronous event propagation.** Where services need to react to events in other services (e.g., a new user registered in Keycloak triggers profile creation in User Service and Lawyer Profile Service), Apache Kafka is used for decoupled, durable event delivery. This avoids tight synchronous dependencies between services at write time.

---

## Microservices

### Implementation Methods

The Java-based microservices follow the **Netflix OSS-inspired Spring Cloud stack**:

- **Spring Cloud Gateway** — reactive API gateway that handles routing, JWT authentication, and CORS.
- **HashiCorp Consul** — service registry and discovery. All Spring Boot services register themselves with Consul on startup, and the gateway uses `lb://` (load-balanced) URIs to resolve service addresses dynamically.
- **Spring Cloud OpenFeign** — declarative HTTP client used for synchronous inter-service calls. Feign clients resolve service addresses via Consul rather than hardcoded URLs.
- **Spring Cloud LoadBalancer** — client-side load balancing integrated with Consul for distributing requests across service instances.
- **Apache Kafka** (Confluent) — asynchronous event streaming between services, used for user registration events, review rating denormalization, and appointment workflow events.
- **Spring Security OAuth2 Resource Server** — JWT validation using Keycloak-issued tokens at the gateway and at individual services.
- **Keycloak** — identity and access management. A custom SPI (Service Provider Interface) is deployed into Keycloak to publish a Kafka event whenever a new user registers.
- **pgvector + PostgreSQL** — each service has its own PostgreSQL database. The AI analysis service uses the `pgvector` extension to store and query sentence embeddings for retrieval-augmented generation (RAG).
- **MinIO** — S3-compatible object storage for uploaded legal documents in the Document Service.
- **Ollama** — local LLM inference server running `phi3:mini` (generation) and `nomic-embed-text` (embeddings) for fully offline AI analysis.

The Python AI Analysis Service uses:

- **FastAPI** with async SQLAlchemy for non-blocking I/O.
- **python-consul** for self-registration with the Consul discovery server.
- **Ollama Python SDK** for embedding and generation requests.
- **PyMuPDF / python-docx** for document text extraction.

---

### Core Services

#### 1. User Service

**Port:** `8081`

Manages user profiles in the platform's own database, kept in sync with Keycloak via a Kafka event consumer. When Keycloak fires a `user.events.v1` event on successful registration, the User Service creates a corresponding profile record. Profile pictures are stored on the local filesystem (or a mounted volume in Docker).

**REST API Endpoints:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/users` | Create a new user profile (triggered by Keycloak registration event) |
| `GET` | `/users` | Retrieve all user profiles (admin) |
| `GET` | `/users/{id}` | Retrieve a user by internal UUID |
| `GET` | `/users/keycloak/{keycloakId}` | Look up a user profile by their Keycloak subject ID |
| `PUT` | `/users/{id}` | Update a user's name, email, or other profile fields |
| `POST` | `/users/{id}/profile-picture` | Upload a profile picture (multipart form data) |

**Inter-service interactions:**

- Consumed by **Appointment Service** via OpenFeign to resolve client display names during appointment creation.
- Consumed by **Video Session Service** via OpenFeign to look up participant details before generating a JaaS JWT.
- Consumed by **Review & Rating Service** via OpenFeign to validate that the reviewing client exists.
- Publishes profile picture files served publicly via the `/uploads/**` path, proxied through the API Gateway.

---

#### 2. Lawyer Profile Service

**Port:** `8082`

Manages the lawyer-facing side of the platform: onboarding, specializations, bio, hourly rate, and availability toggle. Lawyers register as users first (via Keycloak) and then complete an onboarding flow to create their lawyer profile. A Kafka consumer listens for `user.events.v1` to track Keycloak-side registrations for lawyers. A second Kafka consumer listens for review events to denormalize the average rating onto the lawyer profile.

**REST API Endpoints:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/lawyers` | Create a new lawyer profile after onboarding |
| `GET` | `/lawyers` | List all lawyer profiles (public) |
| `GET` | `/lawyers/{id}` | Get a lawyer by internal ID |
| `GET` | `/lawyers/user/{userId}` | Get a lawyer profile by their user UUID |
| `GET` | `/lawyers/specialization/{type}` | Filter lawyers by practice area |
| `GET` | `/lawyers/available` | List only lawyers currently marked as available |
| `PUT` | `/lawyers/{id}` | Update a lawyer's profile details |
| `PATCH` | `/lawyers/{id}/availability` | Toggle a lawyer's availability status |
| `DELETE` | `/lawyers/{id}` | Remove a lawyer profile (admin) |

**Inter-service interactions:**

- Consumed by **Appointment Service** via OpenFeign to validate that a lawyer exists and retrieve their profile when creating or viewing an appointment.
- Consumed by **User Service** via OpenFeign (`LawyerServiceClient`) to check whether a user also has a lawyer profile.
- Receives review rating aggregates from **Review & Rating Service** via Kafka to keep the denormalized average rating up to date.

---

#### 3. Appointment Service

**Port:** `8083`

Orchestrates the full appointment lifecycle: a client requests an appointment with a specific lawyer, the lawyer accepts or rejects, the appointment is scheduled to a specific date/time, a video session can be initiated, and ultimately the appointment is marked complete or cancelled. It is the most interconnected service in the system, communicating synchronously with User Service and Lawyer Profile Service via Feign and publishing workflow events to Kafka.

**REST API Endpoints:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/appointments` | Client creates a new appointment request |
| `GET` | `/appointments` | List all appointments (admin) |
| `GET` | `/appointments/{id}` | Get a specific appointment by ID |
| `GET` | `/appointments/client/{clientId}` | List appointments for a given client |
| `GET` | `/appointments/client/{clientId}/status/{status}` | Filter a client's appointments by status |
| `GET` | `/appointments/lawyer/{lawyerId}` | List appointments for a given lawyer |
| `GET` | `/appointments/lawyer/{lawyerId}/status/{status}` | Filter a lawyer's appointments by status |
| `PATCH` | `/appointments/{id}/status` | Update appointment status (e.g., ACCEPTED, REJECTED) |
| `PUT` | `/appointments/{id}/status` | Full status replacement |
| `POST` | `/appointments/{id}/video-request` | Client requests a video call for an appointment |
| `POST` | `/appointments/{id}/schedule` | Lawyer schedules the appointment to a date/time |
| `PATCH` | `/appointments/{id}/complete` | Mark an appointment as completed |
| `PATCH` | `/appointments/{id}/cancel` | Cancel an appointment |

**Inter-service interactions:**

- Calls **User Service** (`UserServiceClient`) and **Lawyer Profile Service** (`LawyerServiceClient`) via Feign to validate participants during appointment creation.
- Calls **Video Session Service** (`VideoSessionServiceClient`) via Feign to provision a JaaS video room when a video call is requested.
- Publishes appointment workflow events to Kafka (topic: `appointment.workflow.events`) consumed by **Messaging Service** to auto-create a conversation thread when an appointment is accepted.

---

#### 4. Messaging Service

**Port:** `8084`

Provides real-time text messaging between a client and a lawyer within the context of a specific appointment. Messages are persisted to PostgreSQL. The service uses Spring WebSocket with the STOMP sub-protocol; the API Gateway routes WebSocket upgrade requests on the `/ws-chat/**` path to this service using the `lb:ws://` URI scheme. JWT authentication is validated at the STOMP `CONNECT` frame within the service rather than at the gateway.

**REST API Endpoints:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/messages` | Send a message (also broadcasts to WebSocket topic) |
| `GET` | `/messages/{conversationId}` | Retrieve all messages in a conversation |
| `GET` | `/messages/conversations/me` | List all conversations for the authenticated user |

**WebSocket Topics:**

| Destination | Description |
|---|---|
| `/topic/conversations/{conversationId}` | Subscribe to receive live messages in a conversation |
| `/app/chat` | STOMP application endpoint for sending messages |

**Inter-service interactions:**

- Consumes `appointment.workflow.events` from Kafka (`WorkflowEventsConsumer`) to automatically create a `Conversation` record when an appointment transitions to `ACCEPTED`, linking the client and lawyer to a shared thread.

---

#### 5. Video Session Service

**Port:** `8086`

Manages video consultation sessions powered by **Jitsi as a Service (JaaS)**. When a video call is initiated for an appointment, this service creates a session record and generates a signed JWT using the platform's RSA private key. This JWT is passed to the JaaS API to create a conference room and is returned to the frontend, which embeds the Jitsi Meet iFrame SDK. Each participant (client or lawyer) joins using their own JWT with appropriate moderator/participant privileges.

**REST API Endpoints:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/video-sessions/appointment/{appointmentId}` | Create a new video session for an appointment |
| `GET` | `/video-sessions/{id}` | Get a session record by session ID |
| `GET` | `/video-sessions/appointment/{appointmentId}` | Get session details and generate a participant JWT |
| `POST` | `/video-sessions/appointment/{appointmentId}/join` | Join a session (generates a participant or moderator JWT) |
| `POST` | `/video-sessions/appointment/{appointmentId}/end` | End the active session |

**Inter-service interactions:**

- Calls **Appointment Service** (`AppointmentServiceClient`) via Feign to verify the appointment exists and retrieve its participants before issuing a session.
- Calls **User Service** (`UserServiceClient`) via Feign to retrieve participant display names for the JaaS JWT claims.
- Publishes video session lifecycle events to Kafka (`WorkflowEventPublisher`) for other services to react to session state changes.

---

#### 6. Document Service

**Port:** `8088`

Manages the lifecycle of document requests between lawyers and clients. A lawyer creates a document request specifying what is needed (e.g., identification, proof of residence). The client responds by uploading the file directly through the platform. Uploaded files are stored in **MinIO** (S3-compatible object storage) and referenced in PostgreSQL.

**REST API Endpoints:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/documents/requests` | Lawyer creates a new document request |
| `GET` | `/documents/requests/{id}` | Get a specific document request |
| `GET` | `/documents/requests/client/{clientId}` | List all document requests for a client |
| `GET` | `/documents/requests/lawyer/{lawyerId}` | List all document requests sent by a lawyer |
| `GET` | `/documents/requests/appointment/{appointmentId}` | Get document requests linked to an appointment |
| `PATCH` | `/documents/requests/{id}/status` | Update request status (PENDING, FULFILLED, REJECTED) |
| `POST` | `/documents/requests/{id}/upload` | Client uploads a file to fulfill a request (multipart) |
| `GET` | `/documents/files/{fileId}/download` | Download an uploaded document from MinIO |

**Inter-service interactions:**

- Publishes document lifecycle events via Kafka (`DocumentEventPublisher`) so other services can react to document state changes without polling.
- MinIO acts as the binary store; PostgreSQL records metadata (filename, MIME type, MinIO object key, status).

---

#### 7. AI Analysis Service

**Port:** `8087`

The only Python-based service, built with **FastAPI**. It implements a **Retrieval-Augmented Generation (RAG)** pipeline for legal document analysis. Users upload a PDF or DOCX file; the service extracts the text, queries a pgvector store of legal reference clauses for semantically relevant context, and submits a structured prompt to a locally-hosted LLM (Ollama `phi3:mini`). The LLM returns a JSON analysis object containing a summary, a list of risky clauses with severity levels, and a plain-English explanation. All analysis runs asynchronously as a FastAPI `BackgroundTask` so the upload endpoint returns immediately.

**REST API Endpoints:**

| Method | Path | Description |
|---|---|---|
| `POST` | `/analysis/documents` | Upload a PDF or DOCX for analysis (async background processing) |
| `GET` | `/analysis/documents/{document_id}` | Poll the status and retrieve analysis results when complete |
| `GET` | `/analysis/documents` | List all uploaded documents for the authenticated user |
| `POST` | `/analysis/knowledge/ingest` | Admin: ingest a legal reference document into the vector store |
| `POST` | `/analysis/knowledge/ingest-csv` | Admin: bulk-ingest legal clauses from a CUAD CSV dataset |
| `GET` | `/analysis/knowledge/stats` | Get vector store statistics (chunk counts per source) |
| `GET` | `/health` | Health check (used by Consul and Docker) |

**Inter-service interactions:**

- Self-registers with **Consul** using the `python-consul` library on startup so the API Gateway can route `/analysis/**` requests via `lb://ai-analysis-service`.
- Communicates with **Ollama** over HTTP (`ollama.AsyncClient`) for both embedding generation (`nomic-embed-text`) and text generation (`phi3:mini`).
- Uses **pgvector** within PostgreSQL as the vector similarity search backend for the RAG retrieval step.

---

#### 8. Review & Rating Service

**Port:** `8085`

Allows clients to submit a star rating and written review after a completed appointment. Validates that the appointment exists and was completed before accepting the review. Rating summaries (average, distribution by star) are aggregated and published to Kafka so the Lawyer Profile Service can denormalize the score onto the lawyer profile without a synchronous cross-service query.

**REST API Endpoints:**

| Method | Path | Description |
|---|---|---|
| `GET` | `/reviews` | List all reviews (admin) |
| `POST` | `/reviews` | Client submits a review for a completed appointment |
| `GET` | `/reviews/{id}` | Get a specific review |
| `GET` | `/reviews/lawyer/{lawyerId}` | List all reviews for a given lawyer |
| `GET` | `/reviews/lawyer/{lawyerId}/summary` | Get average rating and star-distribution breakdown |
| `GET` | `/reviews/client/{clientId}` | List all reviews submitted by a client |
| `PUT` | `/reviews/{id}?clientId={clientId}` | Client edits their existing review |
| `DELETE` | `/reviews/{id}` | Delete a review (admin) |

**Inter-service interactions:**

- Calls **Appointment Service** (`AppointmentServiceClient`) via Feign to verify the appointment is `COMPLETED` before accepting a review submission.
- Calls **User Service** (`UserServiceClient`) via Feign to validate that the client submitting the review is a known platform user.
- Publishes rating events to Kafka (`OutboxPublisher`) consumed by **Lawyer Profile Service** to update the denormalized average rating.

---

### Discovery Server

**HashiCorp Consul** serves as the service registry and discovery mechanism, replacing Netflix Eureka.

**Service Registration:**  
Every Spring Boot microservice declares `spring.cloud.consul.discovery.register: true` in its `application.yaml`. On startup, Spring Cloud Consul automatically registers the service under its `spring.application.name` (e.g., `user-service`, `lawyer-service`) with:

- A unique instance ID in the format `{service-name}-{port}`
- The service's IP address (`prefer-ip-address: true`) for container networking
- A health check URL pointing to `/actuator/health`, polled by Consul every 30 seconds

The Python AI Analysis Service registers itself programmatically using the `python-consul` library, calling `consul.agent.service.register()` at startup with the same health check convention.

**Health Monitoring:**  
Consul continuously polls each registered service's health endpoint. If a service fails its health check (e.g., returns non-200 or times out), Consul marks it as `critical` and stops routing traffic to that instance. The Spring Cloud LoadBalancer in the API Gateway reads the Consul catalog and only routes requests to instances in the `passing` state.

**Service Lookup:**  
The API Gateway and all Feign clients use `lb://service-name` URIs. Spring Cloud LoadBalancer resolves these by querying Consul for all healthy instances of the named service and applies a round-robin strategy. This means no service address is ever hardcoded — every service call is resolved dynamically at request time.

The Consul UI is accessible at `http://localhost:8500` and shows the registration status, health, and metadata for all services.

---

### API Gateway

**Port:** `8080`

Built with **Spring Cloud Gateway** (reactive/WebFlux), the API Gateway is the single ingress point for all external traffic. It handles:

**Routing:**  
Path-based routing rules in `application.yaml` map URL prefixes to downstream services using Consul load-balanced URIs. For example:

```
Path=/appointments/** → lb://appointment-service
Path=/ws-chat/**      → lb:ws://messaging-service   (WebSocket upgrade)
Path=/analysis/**     → lb://ai-analysis-service
Path=/documents/**    → lb://document-service
```

OpenAPI doc endpoints for each service are also routed with a `RewritePath` filter so the Swagger UI aggregator can fetch individual service specs through a single gateway URL.

**JWT Authentication:**  
A custom `ReactiveJwtDecoder` bean validates Bearer tokens issued by Keycloak. Rather than using Spring's default issuer URI resolution (which fails with Docker's internal vs. external hostname mismatch), the decoder is built directly from the JWKS URI and validates the `iss` claim against a configurable list of trusted issuers. This supports both local development (`http://localhost:8181`) and production (`https://auth.legalai.bond`) without code changes.

**CORS:**  
A `CorsConfig` bean reads allowed origins from the `cors.allowed-origins` property (overridable via the `CORS_ALLOWED_ORIGINS` environment variable in production), enabling controlled cross-origin access for the frontend.

**Public vs. Protected Routes:**  
The security filter chain permits actuator health endpoints, static file uploads, Swagger/OpenAPI documentation endpoints, and WebSocket handshake paths (JWT validated downstream at the STOMP CONNECT frame). All other routes require a valid JWT, with role-based path restrictions available via configuration.

**Aggregated Swagger UI:**  
A single Swagger UI at `http://localhost:8080/swagger-ui.html` aggregates the OpenAPI specifications from all services, providing a unified API explorer for the entire platform.

---

## User Interface

The frontend is a **Next.js 15** application written in **TypeScript**, using the App Router with route groups that create isolated layout trees for each user role.

**Framework and Libraries:**

| Tool | Purpose |
|---|---|
| Next.js 15 (App Router) | Server and client components, file-based routing, layout groups |
| TypeScript | Type safety across all components and API calls |
| Tailwind CSS | Utility-first styling |
| shadcn/ui + Base UI | Pre-built, accessible component primitives (dialogs, dropdowns, badges, etc.) |
| TanStack Query (React Query) | Server state management, caching, and background refetching |
| Zustand | Client-side state for UI-specific concerns (sidebar, active conversation) |
| React Hook Form + Zod | Form state management and schema validation |
| NextAuth.js v5 | Authentication session management with Keycloak as the OAuth2/OIDC provider |
| @stomp/stompjs | WebSocket STOMP client for real-time messaging |
| Lucide React | Icon library |
| Sonner | Toast notification system |

**Route Structure:**

The application uses Next.js route groups to separate layouts by role:

```
/(public)   — sign-in and error pages (unauthenticated)
/(client)   — client dashboard, lawyers, appointments, documents, analysis, conversations
/(lawyer)   — lawyer dashboard, appointments, pending review, documents, profile, onboarding
/(admin)    — administrative views
```

Each group has its own layout that enforces role-based access control by reading the NextAuth session and checking the user's Keycloak realm role. Unauthorized access redirects to `/unauthorized`.

**Key UI Features:**

- **Lawyer Discovery:** Grid of lawyer cards with specialization badges and availability indicators. Clients can browse and initiate an appointment request in-flow.
- **Appointment Management:** Status-aware views for both clients and lawyers, with inline actions (schedule, cancel, request video call, complete).
- **Real-Time Chat:** STOMP WebSocket connection established when a conversation is opened; incoming messages are pushed to the UI without polling.
- **Video Consultation:** Jitsi Meet iFrame SDK embedded inline; the session JWT is fetched from the Video Session Service and passed directly to the SDK.
- **AI Document Analysis:** Drag-and-drop file upload with live polling on the document status until the background analysis completes, then renders the structured results (summary, risk-ranked clauses, plain-English explanation).
- **Document Requests:** Lawyers create requests; clients see pending requests and upload files directly from their document dashboard.
- **Reviews:** Post-appointment rating modal with a 1–5 star selector and comment field.

The frontend is deployed to **Azure Static Web Apps**. The `staticwebapp.config.json` handles SPA routing for the Azure deployment target.

---

## API Testing Tools

**Postman** was used throughout development to test and document each service's REST API independently, before the frontend existed and as a regression check during integration.

**Collection Organization:**  
A separate Postman collection was created for each microservice, with folders grouping requests by resource (e.g., Appointments > CRUD, Appointments > Status Transitions). Environment variables (`{{BASE_URL}}`, `{{TOKEN}}`, `{{CLIENT_ID}}`) allowed the same requests to run against local Docker and tunnelled production environments by switching the active environment.

**Authentication:**  
The Keycloak token endpoint (`/realms/legal-platform/protocol/openid-connect/token`) was saved as a pre-request script. The returned `access_token` was stored in a collection variable and injected as `Authorization: Bearer {{TOKEN}}` on all protected requests.

**Testing Workflows:**  
End-to-end flows were tested as Postman sequences:
1. Register a user → Keycloak issues a token → User Service creates a profile.
2. Create a lawyer profile → Client books an appointment → Lawyer accepts → Client requests video call → Video session is created.
3. Client uploads a document → Appointment is completed → Client submits a review → Rating summary reflects the new score.
4. Upload a legal contract to AI Analysis → Poll for status → Verify the structured JSON analysis is returned.

**Swagger UI:**  
The aggregated Swagger UI at `http://localhost:8080/swagger-ui.html` was used to explore available endpoints during development. Individual services expose `/v3/api-docs` for machine-readable specs, which Postman can import directly via the "Import from URL" feature to auto-generate request collections.

---

## Deployment

### Local Machine

**Prerequisites:** Java 21, Maven 3.9+, Node.js 20+, Docker Desktop

#### Infrastructure-only mode (recommended for development)

1. **Start infrastructure services:**
   ```bash
   cd infrastructure
   docker compose up -d postgres keycloak consul zookeeper kafka ollama minio
   ```

2. **Pull required Ollama models** (first time only):
   ```bash
   docker exec ollama ollama pull nomic-embed-text
   docker exec ollama ollama pull phi3:mini
   ```

3. **Run each Spring Boot service** (from the project root, in separate terminals):
   ```bash
   cd services/user-service            && ./mvnw spring-boot:run
   cd services/lawyer-profile-service  && ./mvnw spring-boot:run
   cd services/appointment-service     && ./mvnw spring-boot:run
   cd services/messaging-service       && ./mvnw spring-boot:run
   cd services/video-session-service   && ./mvnw spring-boot:run
   cd services/document-service        && ./mvnw spring-boot:run
   cd services/review-rating-service   && ./mvnw spring-boot:run
   cd api-gateway                      && ./mvnw spring-boot:run
   ```

4. **Run the AI Analysis Service:**
   ```bash
   cd services/ai-analysis-service
   pip install -r requirements.txt
   uvicorn app.main:app --port 8087 --reload
   ```

5. **Run the frontend:**
   ```bash
   cd legal-platform-web
   npm install
   npm run dev
   ```

The application is available at `http://localhost:3000`. The API Gateway is at `http://localhost:8080`. Consul UI is at `http://localhost:8500`. Keycloak admin console is at `http://localhost:8181`.

---

### Docker Containers

The full backend stack can be started as Docker containers using the provided `docker-compose.yml`.

1. **Build and start all services:**
   ```bash
   cd infrastructure
   docker compose up -d --build
   ```

2. **Pull Ollama models** (first time only):
   ```bash
   docker exec ollama ollama pull nomic-embed-text
   docker exec ollama ollama pull phi3:mini
   ```

3. **Start the frontend** (run locally or deploy separately):
   ```bash
   cd legal-platform-web
   npm install && npm run dev
   ```

4. **Check service health:**
   ```bash
   docker compose ps
   docker compose logs -f <service-name>
   ```

5. **Rebuild a single service** after a code change:
   ```bash
   docker compose up -d --build user-service
   ```

**Service port map:**

| Service | Port |
|---|---|
| API Gateway | 8080 |
| User Service | 8081 |
| Lawyer Profile Service | 8082 |
| Appointment Service | 8083 |
| Messaging Service | 8084 |
| Review & Rating Service | 8085 |
| Video Session Service | 8086 |
| AI Analysis Service | 8087 |
| Document Service | 8088 |
| Keycloak | 8181 |
| Consul UI | 8500 |
| MinIO Console | 9001 |
| Ollama | 11434 |
| PostgreSQL | 5433 |

---

### Cloud Deployment

The platform is designed to run in the cloud with the following recommended architecture:

**Backend services (cloud VM with Docker Compose):**

A cloud VM (e.g., Oracle Cloud Free Tier Ampere A1, AWS EC2, or Azure VM) running Docker Compose mirrors the local setup exactly and requires minimal configuration changes.

```bash
# On the cloud VM
git clone <repo-url>
cd infrastructure
docker compose up -d --build
```

**Exposing services externally via Cloudflare Tunnel:**

A **Cloudflare Tunnel** (`cloudflared`) is included in `docker-compose.tunnel.yml` to expose the API Gateway to a public domain without opening firewall ports or configuring a static IP.

```bash
docker compose -f docker-compose.yml -f docker-compose.tunnel.yml up -d
```

The tunnel configuration in `infrastructure/cloudflare/cloudflared-config.yml` maps the public hostname to the internal `api-gateway:8080` container.

**Frontend deployment (Azure Static Web Apps):**

1. Create a Static Web App resource in Azure and link it to the GitHub repository.

2. Set the following environment variables in the Azure SWA configuration:
   - `NEXTAUTH_URL` — the deployed frontend URL
   - `NEXTAUTH_SECRET` — a securely generated random string
   - `KEYCLOAK_CLIENT_ID`, `KEYCLOAK_CLIENT_SECRET`, `KEYCLOAK_ISSUER` — Keycloak credentials
   - `NEXT_PUBLIC_API_URL` — the public API Gateway URL (Cloudflare Tunnel hostname)

3. Push to the linked branch — Azure GitHub Actions CI/CD deploys automatically.

**Alternatively, deploy to Vercel:**
```bash
cd legal-platform-web
npx vercel --prod
```

**Production checklist:**
- Replace MinIO with AWS S3 or Azure Blob Storage; update `MINIO_ENDPOINT` and credentials accordingly.
- Set strong Keycloak admin passwords and switch from `start-dev` to `start` mode.
- Set `CORS_ALLOWED_ORIGINS` to the production frontend domain.
- Add the production Keycloak issuer URL to `keycloak.trusted-issuers` in the API Gateway config.
- Enable Ollama GPU support if running on a GPU-enabled instance by uncommenting the `deploy.resources` block in `docker-compose.yml`.
- Use Docker secrets or a cloud secrets manager (AWS Secrets Manager, Azure Key Vault) for database passwords and API keys rather than plain environment variables.
- Postgres is backed up daily via the `postgres-backup` service in `docker-compose.yml` (`prodrigestivill/postgres-backup-local`), writing gzipped `pg_dump`s per database to `infrastructure/postgres/backups/` with a 7-day/4-week/6-month retention policy. This directory is git-ignored and must never be committed — the dumps contain real user data. For durability beyond a single host, periodically copy this directory to off-host/cloud storage.

---

## Source Code

### Development Challenges

**1. Keycloak hostname mismatch between Docker and browser**

Inside Docker, services communicate with Keycloak at `http://keycloak:8080`. But tokens issued to the browser carry `iss=http://localhost:8181/realms/...`. This caused JWT validation failures at the API Gateway because the issuer in the token did not match the discovery document fetched from the internal Docker hostname.

The solution was to build a custom `ReactiveJwtDecoder` that fetches the JWKS from a separately configurable URI (`KEYCLOAK_JWKS_URI` env var pointing to the internal Docker hostname) while validating the `iss` claim against a separate configurable list of trusted issuers (`keycloak.trusted-issuers`). This decouples key material fetching from issuer validation, allowing both to be set independently per environment without any code changes.

**2. Asynchronous AI analysis to avoid request timeouts**

The initial design called the LLM synchronously during the document upload request. For large documents, this caused HTTP gateway timeouts (over 30 seconds). The service was refactored to use FastAPI's `BackgroundTasks`: the upload endpoint saves the file, creates a `Document` record with `status: "pending"`, immediately returns a `201` response with the document ID, and schedules `_run_analysis()` as a background task. The frontend polls `GET /analysis/documents/{id}` until the status changes to `completed` or `failed`.

**3. WebSocket routing through Spring Cloud Gateway**

Spring Cloud Gateway requires a different URI scheme for WebSocket routes (`lb:ws://` instead of `lb://`). Additionally, browsers cannot send an `Authorization` header during the HTTP upgrade handshake, making gateway-level WebSocket JWT validation impractical without a query-parameter token (a security risk). The solution was to leave the WebSocket handshake path as a permitted passthrough at the gateway and move JWT validation downstream into the Messaging Service, where the token arrives as a STOMP header on the `CONNECT` frame and is validated using Spring Security's `AuthenticationManager`.

**4. Consul self-registration for the Python FastAPI service**

Spring Cloud auto-configures Consul registration for Spring Boot services. The Python service required manual registration using the `python-consul` library, including implementing a lifespan event handler to deregister the service cleanly on shutdown. Without explicit deregistration, Consul would retain a stale `critical` entry until the TTL expired, causing the API Gateway to attempt routing to a dead instance and returning 503 errors to clients.

**5. RAG retrieval quality and the vector knowledge base**

Initial AI analysis results were poor because the vector knowledge base was empty. Ingesting the CUAD (Contract Understanding Atticus Dataset) legal clause dataset in bulk via the `/analysis/knowledge/ingest-csv` endpoint significantly improved retrieval relevance. A clause-boundary-aware chunking strategy was also important for embedding quality — splitting on fixed token counts caused partial clauses to produce misleading similarity scores against user queries.

**6. Role propagation from Keycloak to Spring Security**

Keycloak issues roles in the JWT under `realm_access.roles`. Spring Security's default JWT converter does not map these to Spring `GrantedAuthority` objects automatically. A custom `JwtAuthConverter` was implemented in the API Gateway to extract the `realm_access.roles` array and prefix each value with `ROLE_`, making them compatible with Spring's `hasRole()` checks and available for path-level security rules in the `SecurityWebFilterChain`.
