# tasks-infrastructure-japanese

### インフラ MVPタスクリスト（GCP + Terraform + Helm + ArgoCD）

---

#### 0.  リポジトリ & IaC 基盤

* **0-1**: GitHub `infra/` モノレポ構成作成

    * `/terraform` - 環境別ワークスペース（dev / prod）
    * `/helm` - アプリごとのチャート (`api`, `web`, `keycloak`, `postgres`, `minio`)
* **0-2**: Terraform ルートモジュール雛形

    * `main.tf`, `variables.tf`, `backend.tf`（GCS State-Bucket）

---

#### 1. GCP 基盤プロビジョニング（Terraform）

* **1-1**: プロジェクト / サービス API 有効化

    * `compute`, `container`, `cloudsql`, `storage`, `artifactregistry`
* **1-2**: ネットワーク

    * VPC `lawx`, サブネット `dev`, `prod`
    * Cloud NAT ＋ Cloud Router
* **1-3**: GKE クラスタ

    * `lawx-dev-gke`（1 node-pool, e2-standard-4）
    * `lawx-prod-gke`（3 node-pool: app / db-ha / ingress）
    * Autopilot *off*（柔軟性確保）
* **1-4**: Cloud SQL for PostgreSQL 15（dev / prod）

    * Private IP, HA disabled in dev, enabled in prod
    * pgvector 拡張有効化
* **1-5**: Artifact Registry (us-docker)

    * Repo `lawx` → GH Actions から push

---

#### 2. GitOps パイプライン

* **2-1**: ArgoCD インストール (Helm)

    * Namespace `argocd` in dev / prod クラスタ
    * SSO (Keycloak OIDC) で RBAC
* **2-2**: アプリケーション定義

    * アプリ `api`, `web`, `keycloak`, `postgres`, `minio`
    * `*/helm` チャートを Git リポジトリ参照
* **2-3**: 自動同期ポリシー

    * dev = Auto-Sync, prod = Manual+PR approval

---

#### 3. 共通サービスチャート

* **3-1**: **Keycloak** Helm

    * ExternalIngress (HTTPS) + GKE LB
    * Postgres Cloud SQL via Cloud SQL Proxy sidecar
* **3-2**: **Postgres** Helm (dev用)

    * StatefulSet + PV / prod は Cloud SQL
* **3-3**: **MinIO** Helm (dev用)

    * 1 Replication, PV 設定
* **3-4**: **API** Helm

    * Secrets: DB URL, Keycloak OIDC Issuer, Slack Webhook
    * PodDisruptionBudget, HPA (cpu 70%)
* **3-5**: **Web (Next.js)** Helm

    * nginx-ingress + rewrite to `/`
    * Env VAR: API\_BASE\_URL

---

#### 4. CI/CD 連携

* **4-1**: GitHub Actions — Terraform

    * `tfsec`, `terraform fmt`, `plan` → PR comment
    * `apply` on merge to `main`
* **4-2**: GitHub Actions — Docker build

    * `api`, `web` イメージ → Artifact Registry push
    * `helm package` & `helm push` to Git repo (Helm-OCI optional)
* **4-3**: ArgoCD Image Updater

    * Watch GHCR tags → auto PR to Helm values (dev only)

---

#### 5. オブザーバビリティ & セキュリティ

* **5-1**: Prometheus-operator (kube-prom-stack Helm)

    * scrape ArgoCD, api pods, node exporter
* **5-2**: Grafana ダッシュボードインポート

    * API latency / error rate, Postgres Overview
* **5-3**: Loki + Grafana Loki-stack (optional in dev)

    * Cloud Logging export rule for prod
* **5-4**: ExternalDNS + cert-manager (Let’s Encrypt)

    * `dev.lawx.example.com` / `app.lawx.example.com`
* **5-5**: Vault or Secret Manager (later)

    * MVP: Kubernetes Secrets + sealed-secrets for non-PII

---

#### 6. データ保護 & バックアップ

* **6-1**: Cloud SQL automated backups (7 days)

    * Binary-Log enabled for PITR in prod
* **6-2**: MinIO snapshot (dev) & Cloud Storage versioning (prod)
* **6-3**: Terraform outputs → Monitoring channel (Slack)

---

#### 7. Runbook & ドキュメント

* **7-1**: README: `make dev-up`, `make tf-plan`, `make argo-sync`
* **7-2**: インシデント SOP: DB failover, Keycloak recovery
* **7-3**: チームアクセス権 (GCP IAM, ArgoCD RBAC) 定義

---

> **MVP 完了条件 (Infrastructure)**
>
> 1. `terraform apply` で **dev 環境**の VPC, GKE, Cloud SQL, Artifact Registry が作成される
> 2. `helm install` → ArgoCD 自動同期で **web / api / keycloak** が起動し、`/health` が 200
> 3. GitHub Actions の Docker build → dev クラスタへ自動デプロイが通る
> 4. Prometheus & Grafana で API p95 latency ダッシュボードが表示できる
