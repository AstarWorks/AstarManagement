# tasks-infrastructure-english

### Infrastructure MVP Task List (GCP + Terraform + Helm + ArgoCD)

---

#### 0. Repository & IaC Foundation

* **0-1**: Create GitHub mono-repo structure under `infra/`

    * `/terraform` – environment workspaces (`dev` / `prod`)
    * `/helm` – per-app charts (`api`, `web`, `keycloak`, `postgres`, `minio`)
* **0-2**: Scaffold Terraform root module

    * `main.tf`, `variables.tf`, `backend.tf` (GCS state bucket)

---

#### 1. GCP Base Provisioning (Terraform)

* **1-1**: Enable project / service APIs

    * `compute`, `container`, `cloudsql`, `storage`, `artifactregistry`
* **1-2**: Networking

    * VPC `lawx`, subnets `dev`, `prod`
    * Cloud NAT + Cloud Router
* **1-3**: GKE Clusters

    * `lawx-dev-gke` (1 node pool, e2-standard-4)
    * `lawx-prod-gke` (3 node pools: app / db-ha / ingress)
    * Autopilot **off** for flexibility
* **1-4**: Cloud SQL for PostgreSQL 15 (dev / prod)

    * Private IP; HA disabled in dev, enabled in prod
    * Enable pgvector extension
* **1-5**: Artifact Registry (`us-docker`)

    * Repo `lawx` — push from GitHub Actions

---

#### 2. GitOps Pipeline

* **2-1**: Install ArgoCD via Helm

    * Namespace `argocd` in both dev / prod clusters
    * Enable SSO (Keycloak OIDC) for RBAC
* **2-2**: Define applications

    * Apps: `api`, `web`, `keycloak`, `postgres`, `minio`
    * Helm charts pulled from Git repo `*/helm`
* **2-3**: Sync policies

    * dev = Auto-Sync, prod = Manual + PR approval

---

#### 3. Common Service Charts

* **3-1**: **Keycloak** Helm

    * External Ingress (HTTPS) + GKE load balancer
    * Cloud SQL via Cloud SQL Proxy sidecar
* **3-2**: **Postgres** Helm (dev only)

    * StatefulSet + PV; prod uses Cloud SQL
* **3-3**: **MinIO** Helm (dev only)

    * Single-replica, PV configured
* **3-4**: **API** Helm

    * Secrets: DB URL, Keycloak issuer, Slack webhook
    * PodDisruptionBudget, HPA (CPU 70 %)
* **3-5**: **Web (Next.js)** Helm

    * nginx-ingress + rewrite to `/`
    * Env VAR: `API_BASE_URL`

---

#### 4. CI/CD Integration

* **4-1**: GitHub Actions — Terraform

    * `tfsec`, `terraform fmt`, `plan` → post as PR comments
    * `apply` on merge to `main`
* **4-2**: GitHub Actions — Docker build

    * Build `api`, `web` images → push to Artifact Registry
    * `helm package` & `helm push` to Git repo (Helm-OCI optional)
* **4-3**: ArgoCD Image Updater

    * Watch GHCR tags → auto PR to Helm values (dev only)

---

#### 5. Observability & Security

* **5-1**: Prometheus-operator (`kube-prom-stack` Helm)

    * Scrape ArgoCD, API pods, node exporter
* **5-2**: Import Grafana dashboards

    * API latency/error rate, Postgres overview
* **5-3**: Loki + Grafana Loki-stack (optional in dev)

    * Cloud Logging export rule for prod
* **5-4**: ExternalDNS + cert-manager (Let’s Encrypt)

    * `dev.lawx.example.com` / `app.lawx.example.com`
* **5-5**: Vault or Secret Manager (later)

    * MVP: Kubernetes Secrets + sealed-secrets for non-PII

---

#### 6. Data Protection & Backup

* **6-1**: Cloud SQL automated backups (7 days)

    * Binary log enabled for PITR in prod
* **6-2**: MinIO snapshots (dev) & Cloud Storage versioning (prod)
* **6-3**: Terraform outputs → Slack monitoring channel

---

#### 7. Runbook & Documentation

* **7-1**: README: `make dev-up`, `make tf-plan`, `make argo-sync`
* **7-2**: Incident SOP: DB failover, Keycloak recovery
* **7-3**: Team access matrix (GCP IAM, ArgoCD RBAC)

---

> **MVP Completion Criteria (Infrastructure)**
>
> 1. Running `terraform apply` creates **dev** VPC, GKE, Cloud SQL, and Artifact Registry.
> 2. `helm install` + ArgoCD auto-sync brings up **web / api / keycloak**; `/health` returns 200.
> 3. GitHub Actions Docker build auto-deploys to dev cluster.
> 4. Prometheus & Grafana show API p95 latency dashboard.
