# tasks-prioritized-english

## MVP Task Execution Order — Dependency Map

> **Assumptions**  
> Three parallel streams (**Infra / Back / Front**).  
> Full front-end work begins only after the OpenAPI spec and running API are established as a “contract.”  
> Task IDs follow `I-*` (Infra), `B-*` (Back), `F-*` (Front).

---

### Phase 0  •  Repository & Base Setup

| ID        | Task                                               | Depends | Effort |
|-----------|----------------------------------------------------|---------|--------|
| **I-0.1** | GitHub mono-repo skeleton (`infra/`, `apps/`)      | —       | 0.5 d  |
| **I-0.2** | Terraform state bucket (GCS) + `backend.tf`        | I-0.1   | 0.5 d  |
| **I-0.3** | Dev Docker-Compose (PG, MinIO, Keycloak)           | I-0.1   | 0.5 d  |
| **F-0.1** | Init Next.js + Bun (`apps/web`)                    | I-0.1   | 0.5 d  |
| **B-0.1** | Init Spring Boot project (`apps/api`)              | I-0.1   | 0.5 d  |

---

### Phase 1  •  Minimal Cloud Infrastructure

| ID        | Task                                                            | Depends        |
|-----------|-----------------------------------------------------------------|----------------|
| **I-1.1** | Terraform VPC / GKE (**dev**) / Artifact Registry               | I-0.2          |
| **I-1.2** | Cloud SQL (PG 15) dev instance                                  | I-0.2          |
| **I-1.3** | Install ArgoCD on dev cluster                                   | I-1.1          |
| **I-1.4** | Helm chart skeletons (`api`, `keycloak`, `postgres`)            | I-1.1          |
| **I-1.5** | GitHub Actions → image build & Argo sync (dev)                  | I-1.3, I-1.4   |

---

### Phase 2  •  Auth & RBAC Pipeline

| ID        | Task                                               | Depends          |
|-----------|----------------------------------------------------|------------------|
| **B-2.1** | Keycloak Realm / Client / Role import JSON         | I-1.3            |
| **B-2.2** | Spring Resource Server + RBAC annotations          | B-0.1, B-2.1     |
| **F-2.1** | NextAuth.js → Keycloak SSO integration             | F-0.1, B-2.1     |
| **F-2.2** | RBAC HOC / `<Can>` hook                            | F-2.1            |

*Outcome*: **JWT ⇄ Roles** round-trip works; log-in from front-end succeeds.

---

### Phase 3  •  OpenAPI Contract & CRUD Skeleton

| ID        | Task                                                        | Depends            |
|-----------|-------------------------------------------------------------|--------------------|
| **B-3.1** | JPA entities + Flyway V1 (`Matter`, `Stage`, …)             | B-0.1              |
| **B-3.2** | REST controllers CRUD (Matter, Stage, Memo, …)             | B-3.1              |
| **B-3.3** | GlobalException / Problem+JSON handler                      | B-3.2              |
| **B-3.4** | Springdoc-OpenAPI auto expose `/v3/api-docs`                | B-3.2              |
| **F-3.1** | *API stub generation* with `openapi-typescript`             | B-3.4              |
| **I-3.1** | Helm `api` chart → automatic deploy to dev                  | I-1.5, B-3.2       |

---

### Phase 4  •  Core Use-Cases (Sync CRUD + Kanban)

| ID         | Task                                            | Depends          |
|------------|-------------------------------------------------|------------------|
| **F-4.1**  | Protected layout + sidebar & header             | F-2.2            |
| **F-4.2**  | Kanban UI (React-DnD)                           | F-4.1, F-3.1     |
| **B-4.1**  | Stage PATCH (column move) logic                 | B-3.2            |
| **F-4.3**  | Matter creation form (POST)                     | F-4.1, F-3.1     |
| **CI-4.1** | Playwright scenario: login→create→drag-drop     | F-4.2, B-4.1     |

---

### Phase 5  •  Documents & OCR Stub

| ID        | Task                                             | Depends          |
|-----------|--------------------------------------------------|------------------|
| **B-5.1** | Pre-signed URL API + MinIO client                | B-3.2, I-1.1     |
| **B-5.2** | Tesseract stub at `/documents/{id}/ocr`          | B-5.1            |
| **F-5.1** | File-picker → UPLOAD component                   | F-3.1, B-5.1     |
| **F-5.2** | PDF viewer (`pdfjs-dist`)                        | F-5.1            |

---

### Phase 6  •  Search & Notifications

| ID        | Task                                             | Depends          |
|-----------|--------------------------------------------------|------------------|
| **B-6.1** | TSVector index + `/search` endpoint              | B-5.2            |
| **F-6.1** | Header search bar + results list                 | F-3.1, B-6.1     |
| **B-6.2** | `@Scheduled` due-date scan + Slack webhook       | B-3.1            |
| **F-6.2** | Notification bell + unread dropdown              | F-2.2, B-6.2     |

---

### Phase 7  •  Expenses, Memos, CSV

| ID        | Task                                | Depends          |
|-----------|-------------------------------------|------------------|
| **B-7.1** | Complete Expense & Memo CRUD        | B-3.2            |
| **F-7.1** | Memo tab / Expense table            | F-3.1, B-7.1     |
| **F-7.2** | CSV export (`papaparse`)            | F-7.1            |

---

### Phase 8  •  i18n, Full Tests, Release

| ID          | Task                                         | Depends   |
|-------------|----------------------------------------------|-----------|
| **F-8.1**   | Set up `next-intl` + translation files       | F-4.1     |
| **CI-8.1**  | Vitest coverage ≥ 80 %                       | all utils |
| **CI-8.2**  | GitHub Actions: `bun test` + docker push     | I-1.5     |
| **I-8.1**   | Import Prometheus / Grafana dashboards       | I-1.1     |
| **I-8.2**   | cert-manager + ExternalDNS / HTTPS           | I-1.1     |
| **MVP-TAG** | All CI green & dev URL publicly accessible   | all tasks |

---

### Dependency Flow (Summary)

