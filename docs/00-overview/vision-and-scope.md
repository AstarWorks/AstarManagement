# Vision & Scope

## 1. Product Vision

> **"Transforming paper-bound legal practices through cloud and AI innovation,**
> **enabling lawyers, staff, and clients to collaborate seamlessly**
> **with real-time information access—anytime, anywhere."**

* **Mission**: Centralize case management, documents, accounting, and communications into a unified platform with intelligent search, visual progress tracking, and automated notifications to achieve zero information gaps.

* **Key Differentiators**:
    1. **Legal-focused RAG & Automated Document Generation** - Specialized AI for legal document templates and intelligent content creation
    2. **Discord-style RBAC** - Flexible, multi-tier permission system including secure client access
    3. **Hybrid Cloud Architecture** - Seamless deployment on both GCP and on-premises infrastructure
    4. **AI-Powered Workflow** - Conversational AI chat and intelligent agents with full CLI/MCP API support
    5. **Visual Collaboration** - Intuitive, paper-like experience through integrations with tools like tldraw

## 2. Scope

### 2.1 MVP (Beta) Release Scope

| Category | Features | Notes |
|----------|----------|-------|
| Authentication & Access | OIDC + 2FA / Discord-style RBAC | Keycloak-based |
| Case Management | Matter CRUD, Kanban progress board, deadline notifications | Slack Webhook integration |
| Document Management | Manual upload + PDF viewer, OCR full-text indexing | MinIO → Cloud Storage |
| Communication | Client/Internal memo CRUD, expense tracking with CSV export | |
| Search | Full-text keyword search (PostgreSQL text search) | Vector search in next phase |
| Internationalization | Japanese/English toggle | Language files & locale parameters |
| DevOps | GitHub Actions → ArgoCD, Terraform IaC | Dev/Prod environments |

### 2.2 Out of Scope (MVP Phase)

* Vector search & AI chat (RAG)
* NAS monitoring & automatic scanner ingestion
* YAML templates + LLM document generation
* Kafka/NATS event-driven architecture
* On-premises automated installer
* Cross-platform Tauri app with auto-updater

## 3. Stakeholders

| Role | Primary Concerns / KPIs |
|------|------------------------|
| Lawyers | Deadline compliance, document creation efficiency, mobile access |
| Clerks | Expense entry efficiency, progress visibility, call memo accuracy |
| Clients | Case progress transparency, evidence upload capability, communication history |
| PM/System Admin | Uptime (>99.9%), SLO achievement, audit log retention |

## 4. Success Metrics (MVP)

| Metric | Target |
|--------|--------|
| Kanban board adoption | 100% (all cases) |
| Document first-paint speed | p95 < 1.0s |
| Memo registration → search hit rate | 100% within 30s |
| Missed deadline alerts | 0 incidents |
| API uptime | 99.9% / month |

## 5. Milestones

| Phase | Timeline | Key Deliverables |
|-------|----------|------------------|
| **Alpha PoC** | ~2025-08 | Matter CRUD + PDF viewer + Keycloak auth (dev environment) |
| **Beta (MVP)** | 2025-10 | All MVP features listed in this document / 5 law firm pilot |
| **GA v1.0** | 2026-01 | RAG search, auto-ingestion, YAML template document generation |

## 6. High-Level Risks & Mitigation Strategies

| Risk | Impact | Mitigation |
|------|--------|------------|
| GPU spot shortage delaying OCR/RAG | Document search delays | OpenAI API fallback / caching strategy |
| Keycloak service failure | Complete login outage | HA configuration + Cloud SQL failover |
| Data classification errors | Confidentiality breach | Data classification review gates & DLP auditing |

---

**Revision History**

* v0.1 2025-06-15 Initial draft (OpenAI o3)
* v0.2 2025-06-15 English revision based on comprehensive project understanding