# structure

### 1. Clarifying Background & Objectives  

#### Why introduce this system? (Business challenges / DX goals)

* Case files and documents are scattered across independent locations—spreadsheets, NAS, Google Drive, and paper—without integration.  
* Interactions with courts, banks, and other law firms are still paper-based, so paper persists in daily operations.  
* Case progress is managed via face-to-face meetings or low-visibility Excel sheets, making real-time grasp difficult.  
* Work must generally be done inside the office; remote work is hard.  
* Meeting notes and phone inquiries with clients are poorly recorded, leading to information gaps.  
* Recording and aggregating small, frequent cost items (expenses, per-diem) unique to lawyers is tedious and burdensome.  
* Creating standard documents often requires referencing multiple papers—inefficient and error-prone.  

#### Stakeholders  

* Lawyers (primary practitioners)  
* Clerks (support operations / accounting)  

#### Desired Outcomes  

* Centralized management of all internal data—cases, documents, accounting, communication history—with instant AI search.  
* Visualized case progress for easy status sharing inside and outside the office.  
* Lawyers can jot quick notes on smartphones that become searchable data.  
* Efficient recording and analysis of income/expenses for both lawyers and the firm.  

---

### 2. Current-State Analysis (As-Is)

#### Existing Business Processes

* Case progress tracked in Excel; a separate sheet per matter.  
* Client communication mainly via phone, email, FAX.  
* Phone notes are written on paper, making accumulation difficult.  
* Internal info sharing via LINE; history is hard to organize.  
* Expenses/per-diem recorded individually on paper memos by lawyers/clerks.  

#### Existing Tools & Pain Points  

* Spreadsheets (Excel, Google Sheets): No unified format, poor visibility.  
* Word/PDF on NAS: Versioning vague, search weak.  
* Email: Information dispersed, history tracking hard.  
* Paper: Physical storage of evidence/notes lowers efficiency.  

#### Ad-hoc vs. Routine Tasks

* **Ad-hoc**  
  * Client interviews/hearings  
  * Case-law research and drafting  

* **Routine**  
  * Standard document drafting based on evidence (complaints, answers, etc.)  
  * Application forms for banks/government offices  
  * Power-of-attorney creation; expense/per-diem collation  
  * Monthly accounting data aggregation for accountants  

---

### 3. Target-State Design (To-Be)

#### New Business Process

* View case progress and bottlenecks intuitively on a board UI.  
* Paper received is instantly scanned to PDF, OCR’d, and stored searchable.  
* Phone/email/LINE/Slack/Discord messages are captured into the system.  
* Extract structured data from PDFs and auto-populate predefined templates.  
* AI chat lets users query case info (“Where is this stuck?”, “Who is Mr. X?”).  
* Operations via GUI or AI agent (CLI/MCP API under the hood)—e.g., “Create this document” triggers auto-generation.  

#### IT vs. Manual Work

* **IT Responsibilities**  
  * OCR + structuring data from paper/PDF  
  * Template-based document generation  
  * Case progress management & SLA reminders  
  * Logging, summarizing, indexing client interactions  
  * Recording expenses/per-diem & outputting reports  

* **Still Manual**  
  * Mailing/hand-delivering stamped documents to courts, banks, other firms  
  * Physically scanning paper and initial registration  

---

### 4. Functional Requirements

#### 4.1 MVP Scope (Must-Have for first release)

* **Auth & 2FA**: Login, refresh, logout  
* **Discord-style RBAC**: Three default roles (Lawyer / Clerk / Client) with CRUD permissions  
* **Matter Management**: CRUD + Kanban progress (drag, timestamp)  
* **Document Management**: Manual upload, PDF viewer, OCR → full-text index  
* **Memo (Client/Internal)**: Register, list, search  
* **Expense/Per-Diem**: Record, CSV export  
* **Keyword Search**: Full-text + memos + matter name  
* **Due-date Reminders**: Email or Slack webhook  
* **REST API (OpenAPI)**: Expose all above features  
* **PostgreSQL 15**: Transactional DB  
* **CI/CD**: GitHub Actions unit/integration tests, ArgoCD deploy  
* **i18n**: JP / EN toggle  

#### 4.2 Post-MVP (Phase 2+)

* Vector search (pgvector / OpenSearch) + RAG AI chat  
* NAS/SharePoint watcher + auto-scan ingest  
* YAML templates + LLM doc generation  
* Event-driven via Kafka / NATS  
* AI suggestions (next task, clause extraction)  
* On-prem installer (k3s + MinIO + Harbor)  
* More languages (CN, KR)  
* Long-term audit log WORM storage  
* Distributed tracing dashboard  
* Tauri auto-updater (delta + signing)  

---

### 5. Non-Functional Requirements (Summary)

* **Security**: RBAC, encryption, audit log, 2FA mandatory  
* **Performance**: PDF first paint < 1 s, API p95 latency targets  
* **Scalability/Availability**: Kubernetes microservices; SLA 99.9% cloud, best-effort on-prem  
* **i18n**: Runtime JP/EN switch, extensible via i18next/Next-Intl  

---

### 6. Use-Case Definitions

* UC-01: Handle incoming calls/meetings, quick-memo save & search  
* UC-02: Record expenses/per-diem with receipt photo  
* UC-03: Progress reporting via dashboard; manual external steps logged  
* UC-04: Auto-generate documents from templates & source PDFs  
* UC-05: Slack/Discord reminders for delays and approaching deadlines  

---

### 8. Constraints & Assumptions

* **Cloud/on-prem parity**: Minimize GCP lock-in; provide OSS substitutes via Terraform modules.  
* **Infra stack**: GKE vs. k3s/RKE2, Cloud Storage vs. MinIO, Cloud SQL vs. self-managed PG + Patroni, Artifact Registry vs. Harbor.  
* **IaC**: Terraform + Helm + ArgoCD GitOps pipeline.  
* **Build tool**: Bun shared by Next.js & Tauri.  
* **CI/CD**: GitHub Actions (tests, SBOM, image build, lint), ArgoCD (deploy).  
* **Existing infra constraints**: NAS (SMB v3), OCR API region (Tokyo/East Japan).  

---

### 9. Risks & Mitigations

* Define technical & operational risks, plus mitigations in advance.  

---

### 10. Acceptance & Test Strategy

* **Unit → Integration → E2E** in CI.  
* Performance, accuracy tests in staging; SLO gate.  
* Pass criteria: “All must-have features done + SLO met + 0 critical sec findings”.  

---

### 11. Permission Model

* Discord-like roles + permissions, customizable.  
* Default non-removable roles:  
  * **Lawyer**: Full case access, edit evidence, update progress, view client.  
  * **Clerk**: View cases, enter accounting, limited progress edit, view evidence.  
  * **Client**: Read-only access to own cases, post memos, upload evidence.  
* Permissions granular by CRUD + export + settings.  
* Role changes/invites audited; operable via GUI & REST API.
