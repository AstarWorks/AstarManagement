# Non-Functional Requirements (NFR)

> **Purpose**: Define quality, operational, and compliance standards that must be achieved for the MVP release. Each requirement includes measurable SLOs/KPIs or clear operational guidelines.

---

## 1. Security Requirements

| ID | Requirement | Metrics / Standards |
|----|-------------|-------------------|
| SEC-01 | Multi-Factor Authentication | All users must use TOTP or FIDO2 authentication |
| SEC-02 | Encryption Standards | At-rest: AES-256-GCM / In-transit: TLS 1.3 minimum |
| SEC-03 | Role-Based Access Control | Discord-style roles + permissions, principle of least privilege |
| SEC-04 | Audit Logging | Create/Update/Delete/Login events stored as JSON Lines for 10 years |
| SEC-05 | Security Scanning | Zero critical vulnerabilities at CI; High-severity patches within 72 hours |

## 2. Performance & Scalability

| ID | Metric | SLO (p95) | Notes |
|----|--------|-----------|--------|
| PERF-01 | PDF Initial Display | < 1.0 second | For PDFs ≤ 10MB, first load |
| PERF-02 | API Response Time | < 300 ms | For /matters, /search endpoints |
| PERF-03 | OCR Throughput | ≥ 60 pages/minute | A4 300dpi, GPU A10G |
| SCALE-01 | Concurrent Connections | 200 WebSocket sessions | Tested on single GKE dev node |
| SCALE-02 | Horizontal Scaling | <10% degradation when scaling 3→6 replicas | HPA trigger at 70% CPU |

## 3. Availability & Reliability

| ID | Requirement | Metrics / Standards |
|----|-------------|-------------------|
| AVAIL-01 | API Uptime | ≥ 99.9% monthly (cloud deployment) |
| AVAIL-02 | Mean Time to Recovery | < 4 hours (cloud); best-effort for on-premises |
| DR-01 | Recovery Point Objective | ≤ 5 minutes (Cloud SQL PITR) |
| DR-02 | Recovery Time Objective | ≤ 30 minutes (managed service failover) |

## 4. Observability & Operations

| ID | Requirement | Implementation |
|----|-------------|----------------|
| OBS-01 | Metrics Collection | Prometheus + Grafana dashboards (API latency, error rate, DB connections) |
| OBS-02 | Distributed Tracing | OpenTelemetry Collector → Tempo (dev) / Cloud Trace (prod) |
| OBS-03 | Centralized Logging | Loki (dev) / Cloud Logging (prod) with 30-day retention |
| OBS-04 | Alerting | Alertmanager → Slack: Latency >1s, ErrorRate >1% (5-minute window) |

## 5. Legal & Compliance

| ID | Requirement | Compliance Standards |
|----|-------------|---------------------|
| COMP-01 | Data Privacy | Japanese Personal Information Protection Act / GDPR (when EEA clients present) |
| COMP-02 | Legal Professional Standards | Attorney-client privilege and document management policies |
| COMP-03 | Electronic Records Compliance | Tamper detection & timestamping for receipts/expenses (e-Document Act) |

## 6. Internationalization (i18n) & Localization

### Language Support
* **Initial Release**: Japanese and English
* **Implementation**: Externalized JSON language resources
* **Selection**: Based on `Accept-Language` header or user UI preference

### Currency Support
* **Supported**: JPY and USD
* **Formatting**: Locale-dependent formatters for numbers and currency

## 7. Maintainability & Extensibility

| ID | Requirement | Metrics / Standards |
|----|-------------|-------------------|
| MAINT-01 | Modular Architecture | Frontend: Next.js App Router / Backend: Spring Boot with Hexagonal Architecture |
| MAINT-02 | Code Coverage | ≥ 70% (combined unit and integration tests) |
| MAINT-03 | Deployment Frequency | Daily to dev environment; weekly to production with zero downtime |

## 8. Infrastructure Constraints

### Core Requirements
* **Infrastructure as Code**: Terraform + Helm + ArgoCD (GitOps workflow)
* **Cloud Portability**: All cloud-dependent features must have OSS alternatives
  * Cloud Storage ↔ MinIO
  * Cloud SQL ↔ PostgreSQL with Patroni
  * Artifact Registry ↔ Harbor

### GPU Resources
* **Development**: A10G spot instances
* **Production**: L4 spot instances
* **Failover Strategy**: API-level fallback when spot instances unavailable

---

## 9. Browser & Device Support

| Platform | Minimum Version | Notes |
|----------|----------------|--------|
| Chrome | 100+ | Primary target |
| Firefox | 100+ | Full support |
| Safari | 15+ | iOS/macOS |
| Edge | 100+ | Chromium-based |
| Mobile | iOS 15+, Android 10+ | Responsive design |

---

## 10. Performance Budget

### Frontend
* **Initial Page Load**: < 3 seconds (3G connection)
* **Time to Interactive**: < 5 seconds
* **Lighthouse Score**: > 90 (Performance, Accessibility)

### Backend
* **Database Query Time**: p99 < 100ms
* **File Upload Speed**: > 10 MB/s (local network)
* **Search Response**: < 500ms for 1M documents

---

*Last updated: 2025-06-15*