```markdown
# tasks-backend-english

### Backend MVP Task List (Kotlin + Spring Boot + PostgreSQL 15)

---

#### 0. Project Initialization

* **0-1**: Create `apps/api` module (Spring Boot 3.x, Gradle KTS)  
* **0-2**: Add core dependencies  

    * `spring-boot-starter-web`, `spring-boot-starter-security`, `spring-boot-starter-validation`  
    * `spring-data-jpa`, `flyway-core`, `springdoc-openapi-starter-webmvc-ui`
* **0-3**: Dev `docker-compose` with PostgreSQL 15, Keycloak, MinIO  

---

#### 1. Authentication & Authorization (Keycloak OIDC)

* **1-1**: Create Keycloak Realm / Client / Role import JSON  

    * Roles: `LAWYER`, `STAFF`, `CLIENT`
* **1-2**: Configure Spring Resource Server (`spring-security-oauth2-resource-server`)  
* **1-3**: RBAC annotation utility using `@PreAuthorize("hasRole('LAWYER')")`  
* **1-4**: Health check & meta endpoint `/auth/info`  

---

#### 2. Core Domain & Data Model

* **2-1**: Create JPA entities  

    * `Matter`, `Stage`, `Document`, `Memo`, `Expense`, `User`
* **2-2**: Flyway V1 migration script  
* **2-3**: Basic repositories implementing `CrudRepository`  

---

#### 3. REST API Skeleton

* **3-1**: `MatterController` — CRUD + pagination  
* **3-2**: `StageController` — add / PATCH progress stages  
* **3-3**: `DocumentController` — register metadata, GET, DELETE  
* **3-4**: `MemoController` & `ExpenseController` — CRUD  
* **3-5**: `GlobalExceptionHandler` — Problem+JSON responses  
* **3-6**: SpringDoc OpenAPI generation (`/v3/api-docs`)  

---

#### 4. Document Management & OCR Stub

* **4-1**: Pre-signed URL service (MinIO SDK)  
* **4-2**: `POST /documents/{id}/ocr` → invoke Tesseract CLI stub  
* **4-3**: Save OCR result to `document.text` and update TSVector (`to_tsvector`)  

---

#### 5. Search Function MVP

* **5-1**: `SearchService` — `SELECT ... WHERE to_tsvector @@ plainto_tsquery(:q)`  
* **5-2**: Endpoint `GET /search?q=`  
* **5-3**: Return top 20 results ordered by score (`ts_rank_cd`)  

---

#### 6. Due-Date Reminder & Notification

* **6-1**: Add `due_at`, `notified` columns to `Stage` (Flyway V2)  
* **6-2**: `@Scheduled(fixedDelay = 60000)` job → find unnotified stages due within 24 h  
* **6-3**: Slack Webhook service — send `postMessage` JSON  
* **6-4**: Guarantee idempotency via `NotificationLog` table  

---

#### 7. Testing & Quality

* **7-1**: Unit tests with JUnit 5 + MockMvc (Controller, Service)  
* **7-2**: Integration tests with SpringBootTest + Testcontainers (PostgreSQL)  
* **7-3**: Flyway migration test (`FlywayTestExecutionListener`)  

---

#### 8. CI/CD & Basic Observability

* **8-1**: GitHub Actions — `./gradlew test` plus Testcontainers cache  
* **8-2**: Docker build & push (`ghcr.io/org/api:<commit>`)  
* **8-3**: Generate Helm chart (api, postgres, keycloak) → PR to ArgoCD  
* **8-4**: Expose Spring Actuator + Micrometer Prometheus at `/actuator/prometheus`  
* **8-5**: Configure OpenTelemetry Java Agent (propagate `traceparent` header)  

---

> **MVP Completion Criteria (Back-end)**
>
> * Endpoints 3-1 to 3-4 behave exactly as defined in OpenAPI.  
> * Full-text search (5-1/5-2) hits from UI after OCR stub.  
> * Slack message verified from due-date notification job.  
> * All JUnit & SpringBootTest cases pass in CI; Docker image auto-deployed to dev via ArgoCD.
```
