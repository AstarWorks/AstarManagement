# tasks-test

### MVP Test Task List (Unit → Integration → E2E + Non‑functional)

| ID        | Category          | Description                                                                                       | Priority | Owner      |
| --------- | ----------------- | ------------------------------------------------------------------------------------------------- | -------- | ---------- |
| **T-1.1** | **Unit**          | Stub domain‑level unit tests for all JPA entities (equals/hashCode)                               | P0       | Test‑Agent |
| **T-1.2** | **Unit**          | Service‑layer tests for Matter CRUD, Stage transition, Memo, Expense                              | P0       | Test‑Agent |
| **T-1.3** | **Unit**          | RBAC annotation tests (`@PreAuthorize`) for each role                                             | P0       | Test‑Agent |
| **T-1.4** | **Unit**          | Utility tests: JWT role extraction, date helpers                                                  | P1       | Test‑Agent |
| **T-2.1** | **Integration**   | SpringBootTest + Testcontainers (PostgreSQL) for REST endpoints `/matters`, `/memos`, `/expenses` | P0       | Test‑Agent |
| **T-2.2** | **Integration**   | Flyway migration test ensures V1/V2 run cleanly in fresh DB                                       | P0       | Test‑Agent |
| **T-2.3** | **Integration**   | Keycloak test container – OIDC login & token refresh flow                                         | P1       | Test‑Agent |
| **T-2.4** | **Integration**   | MinIO container – pre‑signed URL upload & download validation                                     | P1       | Test‑Agent |
| **T-3.1** | **E2E (Web)**     | Playwright: Login → Create Matter → Upload Doc → Kanban move → Log out                            | P0       | Test‑Agent |
| **T-3.2** | **E2E (Web)**     | Playwright: Expense add → CSV export verifies row count                                           | P1       | Test‑Agent |
| **T-3.3** | **E2E (Mobile)**  | Tauri/Playwright: Quick memo save → Search returns memo                                           | P2       | Test‑Agent |
| **T-4.1** | **Performance**   | K6: p95 PDF first‑paint < 1 s under 50 concurrent users                                           | P1       | Perf‑Agent |
| **T-4.2** | **Performance**   | K6: API `/search` p95 latency < 300 ms @ 100 rps                                                  | P1       | Perf‑Agent |
| **T-5.1** | **Security**      | OWASP ZAP automated scan – 0 Critical / High                                                      | P0       | Sec‑Agent  |
| **T-5.2** | **Security**      | SCA (Trivy) – 0 Critical CVEs in images                                                           | P0       | Sec‑Agent  |
| **T-6.1** | **i18n**          | Snapshot test – JP/EN locale switch renders identical layout                                      | P2       | Test‑Agent |
| **T-7.1** | **Observability** | Prometheus scrape verifies API metrics exposed & dashboard 200 OK                                 | P1       | Ops‑Agent  |

---

## Test Automation Pipeline

1. **GitHub Actions**

    * Stage **`unit`** → run `bun test` + `./gradlew test`, collect coverage.
    * Stage **`integration`** → spin Testcontainers, execute SpringBootTest.
    * Stage **`e2e-web`** → Playwright headless; artifacts uploaded.
    * Stage **`security`** → Trivy image scan + ZAP baseline.
    * Stage **`perf`** (nightly) → K6 against dev.
2. **ArgoCD** deploys images only if all stages green.
3. **Grafana** shows live pass‑rate and latency dashboards.

---

### Exit Criteria for MVP

* 100 % passing **T‑1.x – T‑3.x** in CI
* Coverage ≥ 80 % lines / statements (Vitest + JUnit)
* Performance SLO satisfied (T‑4.1 / T‑4.2)
* 0 Critical vulnerabilities (T‑5.1 / T‑5.2)
* Prometheus API p95 latency dashboard confirms SLA 99.9 % uptime during 72‑h soak test

*Last updated: 2025‑06‑15 (OpenAI o3)*
