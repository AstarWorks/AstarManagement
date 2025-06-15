# tasks-backend-japanese

### バックエンド MVPタスクリスト（Kotlin + Spring Boot + PostgreSQL 15）

---

#### 0. プロジェクト初期化

* **0-1**: `apps/api` モジュール作成（Spring Boot 3.x、Gradle KTS）
* **0-2**: 基本依存追加

    * `spring-boot-starter-web`, `spring-boot-starter-security`, `spring-boot-starter-validation`
    * `spring-data-jpa`, `flyway-core`, `springdoc-openapi-starter-webmvc-ui`
* **0-3**: Dev 用 `docker-compose`（PostgreSQL 15, Keycloak, MinIO）

---

#### 1. 認証・認可（Keycloak OIDC）

* **1-1**: Keycloak Realm/Client/Role インポート JSON 作成

    * Roles: `LAWYER`, `STAFF`, `CLIENT`
* **1-2**: Spring Resource Server 設定 (`spring-security-oauth2-resource-server`)
* **1-3**: `@PreAuthorize("hasRole('LAWYER')")` 用 RBAC アノテーションユーティリティ
* **1-4**: ヘルスチェック & メタ `/auth/info` エンドポイント

---

#### 2. コアドメイン & データモデル

* **2-1**: JPA エンティティ作成

    * `Matter`, `Stage`, `Document`, `Memo`, `Expense`, `User`
* **2-2**: Flyway V1 マイグレーションスクリプト
* **2-3**: 基本リポジトリ `CrudRepository` 実装

---

#### 3. REST API スケルトン

* **3-1**: MatterController – CRUD + ページネーション
* **3-2**: StageController – 進捗追加/PATCH
* **3-3**: DocumentController – メタ登録, GET, DELETE
* **3-4**: MemoController & ExpenseController – CRUD
* **3-5**: GlobalExceptionHandler – Problem+JSON 応答
* **3-6**: SpringDoc OpenAPI 生成 (`/v3/api-docs`)

---

#### 4. ドキュメント管理 & OCR Stub

* **4-1**: Pre-signed URL Service（MinIO SDK）
* **4-2**: `POST /documents/{id}/ocr` → Tesseract CLI 呼び出し stub
* **4-3**: OCR 結果を `document.text` に保存し TSVector 更新 (`to_tsvector`)

---

#### 5. 検索機能 MVP

* **5-1**: `SearchService` – `SELECT ... WHERE to_tsvector @@ plainto_tsquery(:q)`
* **5-2**: `GET /search?q=` エンドポイント
* **5-3**: スコア順（`ts_rank_cd`）で上位 20 件返却

---

#### 6. 期日リマインド & 通知

* **6-1**: Stage に `due_at`, `notified` カラム追加 (Flyway V2)
* **6-2**: `@Scheduled(fixedDelay=60000)` ジョブ → 24h 以内の未通知ステージ抽出
* **6-3**: Slack Webhook Service – `postMessage` JSON 呼び出し
* **6-4**: 通知履歴テーブル (`NotificationLog`) で冪等保証

---

#### 7. テスト & 品質

* **7-1**: JUnit5 + MockMvc ユニットテスト（Controller, Service）
* **7-2**: SpringBootTest + Testcontainers (PostgreSQL) 統合テスト
* **7-3**: Flyway Migration テスト (`FlywayTestExecutionListener`)

---

#### 8. CI/CD & 基本オブザーバビリティ

* **8-1**: GitHub Actions ― `./gradlew test` ＋ Testcontainers キャッシュ
* **8-2**: Docker Build & Push (`ghcr.io/org/api:commit`)
* **8-3**: Helm Chart (api, postgres, keycloak) 生成 → ArgoCD へ PR
* **8-4**: Spring Actuator + Micrometer Prometheus エンドポイント `/actuator/prometheus`
* **8-5**: OpenTelemetry Java Agent 設定（traceparent ヘッダー転送）

---

> **MVP 完了条件 (Back-end)**
>
> * エンドポイント 3-1〜3-4 が OpenAPI で定義どおり動作
> * OCR Stub 後の全文検索 5-1/5-2 が UI からヒット
> * 期日通知ジョブで Slack にメッセージ送信確認
> * JUnit & SpringBootTest が CI 上 100% パスし、Docker イメージが ArgoCD 経由で dev 環境に自動反映されること。
