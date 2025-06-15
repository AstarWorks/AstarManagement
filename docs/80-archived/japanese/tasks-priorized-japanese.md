# tasks-priorized-japanese

## MVP タスク実行順 ― 依存関係マップ

> *前提*: 3 ストリーム（**Infra／Back／Front**）を並行しつつも、
> OpenAPI 仕様と実動 API が “契約” として成立してから Front-End 実装を本格化する。
> 各タスク ID を `I-*` (Infra) / `B-*` (Back) / `F-*` (Front) で表記。

---

### Phase 0 : リポジトリ & 基盤準備

| ID        | 内容                                          | 依存    | 所要   |
| --------- | ------------------------------------------- | ----- | ---- |
| **I-0.1** | GitHub Mono-repo 雛形 (`infra/`, `apps/`)     | －     | 0.5d |
| **I-0.2** | Terraform State-Bucket (GCS) & `backend.tf` | I-0.1 | 0.5d |
| **I-0.3** | Dev Docker-Compose (PG, MinIO, Keycloak)    | I-0.1 | 0.5d |
| **F-0.1** | Next.js + Bun 初期化 (`apps/web`)              | I-0.1 | 0.5d |
| **B-0.1** | Spring Boot プロジェクト (`apps/api`)             | I-0.1 | 0.5d |

---

### Phase 1 : インフラ最小クラウド環境

| ID        | 内容                                                  | 依存           |
| --------- | --------------------------------------------------- | ------------ |
| **I-1.1** | Terraform で VPC / GKE(**dev**) / Artifact Registry  | I-0.2        |
| **I-1.2** | Cloud SQL(PG 15) dev インスタンス                         | I-0.2        |
| **I-1.3** | ArgoCD インストール (dev クラスタ)                            | I-1.1        |
| **I-1.4** | Helm Chart skeleton (`api`, `keycloak`, `postgres`) | I-1.1        |
| **I-1.5** | GitHub Actions → Image build & Argo sync (dev)      | I-1.3, I-1.4 |

---

### Phase 2 : 認証・RBACパイプライン

| ID        | 内容                                        | 依存           |
| --------- | ----------------------------------------- | ------------ |
| **B-2.1** | Keycloak Realm/Client/Role JSON           | I-1.3        |
| **B-2.2** | Spring Resource Server + RBAC Annotations | B-0.1, B-2.1 |
| **F-2.1** | NextAuth.js → Keycloak 連携 (SSO)           | F-0.1, B-2.1 |
| **F-2.2** | RBAC HOC / `<Can>` Hook                   | F-2.1        |

*成果*: **JWT → 角色** が往復し、フロントでログインできる。

---

### Phase 3 : OpenAPI コントラクト & CRUD スケルトン

| ID        | 内容                                          | 依存           |
| --------- | ------------------------------------------- | ------------ |
| **B-3.1** | JPA エンティティ & Flyway V1 (Matter, Stage …)    | B-0.1        |
| **B-3.2** | REST Controller CRUD（Matter, Stage, Memo …） | B-3.1        |
| **B-3.3** | GlobalException / Problem+JSON              | B-3.2        |
| **B-3.4** | springdoc-openapi 自動公開 `/v3/api-docs`       | B-3.2        |
| **F-3.1** | *API スタブ生成* (`openapi-typescript`)          | B-3.4        |
| **I-3.1** | Helm `api` Chart → dev オートデプロイ              | I-1.5, B-3.2 |

---

### Phase 4 : 核心ユースケース (同期 CRUD + カンバン)

| ID         | 内容                                     | 依存           |
| ---------- | -------------------------------------- | ------------ |
| **F-4.1**  | 保護レイアウト + サイドバー & Header               | F-2.2        |
| **F-4.2**  | カンバン UI（React-DnD）                     | F-4.1, F-3.1 |
| **B-4.1**  | Stage PATCH (列移動) ロジック                 | B-3.2        |
| **F-4.3**  | Matter 作成フォーム (POST)                   | F-4.1, F-3.1 |
| **CI-4.1** | Playwright: login→create→drag-drop テスト | F-4.2, B-4.1 |

---

### Phase 5 : ドキュメント & OCR スタブ

| ID        | 内容                                   | 依存           |
| --------- | ------------------------------------ | ------------ |
| **B-5.1** | Pre-signed URL API + MinIO Client    | B-3.2, I-1.1 |
| **B-5.2** | `/documents/{id}/ocr` Tesseract Stub | B-5.1        |
| **F-5.1** | ファイル選択→UPLOAD コンポ                    | F-3.1, B-5.1 |
| **F-5.2** | PDF ビューア (`pdfjs-dist`)              | F-5.1        |

---

### Phase 6 : 検索 & 通知

| ID        | 内容                                  | 依存           |
| --------- | ----------------------------------- | ------------ |
| **B-6.1** | TSVector Index + `/search` Endpoint | B-5.2        |
| **F-6.1** | ヘッダー検索バー＋結果リスト                      | F-3.1, B-6.1 |
| **B-6.2** | `@Scheduled` 期日監視 + Slack Webhook   | B-3.1        |
| **F-6.2** | 通知ベル & 未読ドロップダウン                    | F-2.2, B-6.2 |

---

### Phase 7 : 実費・メモ・CSV

| ID        | 内容                       | 依存           |
| --------- | ------------------------ | ------------ |
| **B-7.1** | Expense & Memo CRUD 完全実装 | B-3.2        |
| **F-7.1** | メモタブ / Expense テーブル      | F-3.1, B-7.1 |
| **F-7.2** | CSV エクスポート (papaparse)   | F-7.1        |

---

### Phase 8 : i18n・テスト完備・リリース

| ID          | 内容                                     | 依存       |
| ----------- | -------------------------------------- | -------- |
| **F-8.1**   | `next-intl` / 翻訳ファイル整備                 | F-4.1    |
| **CI-8.1**  | Vitest Coverage ≥ 80 %                 | 全ユーティリティ |
| **CI-8.2**  | GitHub Actions: bun test + docker push | I-1.5    |
| **I-8.1**   | Prometheus/Grafana Dashboards import   | I-1.1    |
| **I-8.2**   | cert-manager + ExternalDNS / HTTPS     | I-1.1    |
| **MVP-TAG** | すべての CI がグリーン & dev URL 公開             | 全タスク     |

---

### 依存関係チャート (概要)

```
Infra P0 → Auth/RBAC (B-2,F-2) 
         → OpenAPI (B-3) → Front CRUD UI (F-3/4) 
         → Doc/OCR (B-5) → Doc UI (F-5) 
         → Search & Notification (B-6) → UI hooks (F-6) 
         → Expenses/Notes (B-7) → UI (F-7) 
         → i18n & QA → Release
```

**先行して用意すべきもの**

* Terraform/GKE/ArgoCD **(I-1.x)** → API の継続デプロイ先
* **OpenAPI 仕様** **(B-3.4)** → Front/Back の契約
* Keycloak Realm JSON **(B-2.1)** → 全レイヤ認証

これに従えば、各チームがブロッカーなしで並行開発しつつ、MVP 完成までのクリティカルパスを維持できます。
