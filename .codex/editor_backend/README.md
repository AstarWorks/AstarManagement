# Encrypted Document Service – Backend Design Notes

This document captures the initial architecture and delivery plan for the Obsidian-like document authoring backend. Scope is limited to the service side (API + persistence). The frontend and sync clients will consume these APIs later on.

## 1. Objectives & Constraints
- **Use PostgreSQL** as the single source of truth for documents, folders, metadata, and indexing artefacts.
- **Encrypt document payloads at rest**; only metadata required for listing/search may remain in plaintext.
- **Decryption handled inside the backend** so clients never see raw storage keys.
- **Support hierarchical workspaces**: arbitrary folder nesting, shared documents, and cross-links.
- **Enable concurrent read/search** operations with predictable latency under multi-user workloads.
- **Leave room for future offline/real-time syncing** without redesigning the storage layer.
- **Permissions**: Reuse the existing user/tenant permission specification as-is for now (暫定運用); refine once document-specific roles are introduced.

### Local runtime prerequisites
- Start PostgreSQL via `docker-compose up -d postgres-dev` in `infrastructure/local/docker/postgresql/` before running backend tasks.
- Launch the backend with `SPRING_PROFILES_ACTIVE=local ./gradlew bootRun`; Gradle will start the server mid-task. Stop with `Ctrl+C`.
- Execute backend tests with `./gradlew test` (covers the current suite).

## 2. High-Level Architecture
```
┌──────────────────────────────────────────────────────────────────────┐
│ REST API (Spring Boot + Kotlin)                                      │
│  ├─ DocumentController                                               │
│  ├─ FolderController                                                 │
│  ├─ SearchController                                                 │
│  └─ EncryptionKeyController (admin)                                  │
├──────────────────────────────────────────────────────────────────────┤
│ Application Layer                                                    │
│  ├─ DocumentService         ─┐                                       │
│  ├─ FolderService           ├─> uses EncryptionService, IndexService │
│  ├─ SearchService           │                                       │
│  ├─ KeyRotationService      │                                       │
│  └─ AuditService            │                                       │
├──────────────────────────────────────────────────────────────────────┤
│ Domain + Persistence                                                │
│  ├─ Entities (Document, DocumentRevision, Folder, Metadata, Tag)     │
│  ├─ Spring Data repositories (JPA/JDBC)                              │
│  ├─ Encryption adapters (AES-GCM + JCE / AWS KMS wrapper)            │
│  └─ PostgreSQL (table partitioning + FTS + JSONB)                    │
├──────────────────────────────────────────────────────────────────────┤
│ Background Workers (TaskExecutor / Coroutines)                       │
│  ├─ Asynchronous indexing (tsvector refresh)                         │
│  ├─ Key rotation / re-encryption jobs                                │
│  └─ Export/import processors                                         │
└──────────────────────────────────────────────────────────────────────┘
```

### Key Components
- **DocumentService**: orchestrates create/update/version operations. Handles optimistic locking and revision trees. Delegates payload (en/de)cryption to `EncryptionService`.
- **FolderService**: manages a materialized path or nested-set representation to support deep hierarchies and fast subtree queries.
- **EncryptionService**:
  - Uses envelope encryption. Generates per-document Data Encryption Keys (DEK) (AES-256-GCM) stored encrypted with a tenant-scoped Key Encryption Key (KEK).
  - KEK comes from either an HSM/KMS (preferred) or a local master key configured via environment variable/secret manager.
  - Provides streaming encrypt/decrypt helpers to keep memory usage predictable for large files.
- **SearchService** (deferred): Earlier drafts proposed a Postgres full-text index, but automated indexing is skipped for now because it would degrade search quality; future milestones will revisit requirements.
- **IndexService** (deferred): The async indexing pipeline is likewise on hold for the same reason; keep hooks for later once we can design a higher-quality search experience.
- **AuditService**: emits structured audit events (JSON) for later analytics/compliance.

## 3. Data Model (Draft)

| Table | Purpose | Notable columns |
|-------|---------|-----------------|
| `document_nodes` | Folder/document tree (Adjacency list + materialized path). | `id`, `parent_id`, `path`, `type`, `title`, `slug`, `tenant_id`, `created_at`, `updated_at` |
| `document_revisions` | Versioned encrypted payloads. | `id`, `document_id`, `revision_no`, `ciphertext BYTEA`, `dek_ciphertext BYTEA`, `nonce BYTEA`, `checksum`, `size_bytes`, `content_type`, `created_by`, `created_at` |
| `document_metadata` | Extended attributes (JSONB). | `document_id` (PK/FK), `metadata JSONB`, `tags TEXT[]`, `is_published`, `last_indexed_at` |
| `document_search_index` | Full-text search vectors. | `document_id` (PK/FK), `language`, `content_vector TSVECTOR` |
| `encryption_keys` | Tenant/Workspace KEKs + rotation info. | `tenant_id` (PK), `kek_ciphertext`, `kek_version`, `created_at`, `rotated_at` |
| `audit_events` | Immutable event log. | `id`, `tenant_id`, `actor_id`, `action`, `target_id`, `payload JSONB`, `created_at` |

- *Note*: `document_search_index` remains planned but unused in this milestone; we defer automated indexing to avoid degrading current search quality.

### Hierarchy Strategy
- Primary tree table `document_nodes` stores both folders and documents.
- `path` (ltree or text) enables subtree scans. `type` distinguishes folder vs document placeholder.
- Document revisions stored separately so `document_nodes` remains small and cache-friendly.

### Encryption Metadata
- Each revision row contains: `ciphertext`, `nonce`, `dek_ciphertext` (DEK encrypted with KEK via AES key wrap or RSA-OAEP).
- `checksum` (SHA-256) supports integrity verification and deduplication.

## 4. Security & Key Management
- **Master Key Strategy**: integrate with cloud KMS if available (AWS KMS, GCP KMS). Local dev fallback uses password-protected AES key derived with PBKDF2.
- **Rotation**: store `kek_version`; background `KeyRotationService` re-encrypts affected DEKs.
- **Transport Security**: enforce mTLS between services and clients (future). For now, require HTTPS and JWT-based auth (reuse existing Spring Security setup).
- **RBAC**: leverage current role/permission infrastructure (workspace roles) to guard CRUD and tree operations.
- **Auditability**: all decrypt operations recorded with actor ID + reason to detect abuse.

## 5. Concurrency & Performance
- Use Kotlin coroutines or Spring `TaskExecutor` with virtual threads (JDK 21) for decrypt/index workers.
- Encryption/decryption uses streaming (Java CipherInputStream) to avoid large heap usage.
- Search indexing jobs batched & executed in parallel; default thread pool sized by CPU cores but rate-limited per tenant.
- Postgres optimisations:
  - Partition `document_revisions` by tenant or by time for faster pruning.
  - Use `tsvector` GIN indexes for search.
  - Maintain covering indexes on `document_nodes (tenant_id, path)` and `document_metadata (tags)`.
- Cache frequently accessed metadata in Redis (optional future improvement) while keeping ciphertext only in Postgres.

## 6. API Surface (Draft)
- `POST /api/v1/documents` – create document, upload encrypted payload (multipart or JSON with base64).
- `GET /api/v1/documents/{id}` – returns metadata + decrypted content (if privileges allow).
- `PUT /api/v1/documents/{id}` – create new revision with optimistic locking header (`If-Match` / revision).
- `GET /api/v1/folders/{id}/children` – list nodes.
- `POST /api/v1/folders` – create folder (with slug normalization).
- `GET /api/v1/search?query=...` – FTS query returning snippets highlighting matches.
- Admin endpoints for KEK rotation and audit export.

All responses follow existing API envelope conventions (`success/data/error/timestamp`).

## 7. Delivery Plan

| Milestone | Goals | Notes |
|-----------|-------|-------|
| **M1 – Foundations (Week 1-2)** | Project skeleton, base entities, repository tests with Testcontainers, basic folder CRUD without encryption. | Reuse current Gradle setup, add Flyway baseline for document tables. |
| **M2 – Encryption Core (Week 3-4)** | Implement EncryptionService, KEK management, CRUD with encrypted payloads, integration tests covering round-trip encryption. | Introduce key provider abstraction to swap KMS/local keys. |
| **M3 – Search & Indexing (Week 5)** | Build async indexing pipeline, tsvector storage, search API with pagination, concurrency tests. | Use coroutine-based worker pool + metrics. |
| **M4 – Hardening (Week 6)** | RBAC integration, auditing, key rotation jobs, performance benchmarks, documentation. | Include load tests focusing on decrypt/search throughput. |

## 8. Open Questions / Risks
- **Search vs Encryption**: storing FTS vectors exposes keywords. Need security review; consider homomorphic/tokenized alternatives later.
- **Binary Attachments**: initial scope is Markdown; attachments may require separate storage (object store + encrypted references).
- **Real-time Collaboration**: current design focuses on revision snapshots. CRDT/operational transform support would require additional infrastructure.
- **Scaling**: monitor Postgres size; may need sharding/archival for very large tenants.

---
These notes should evolve as we validate requirements with stakeholders and integrate with existing auth/tenant modules.

---

# 暗号化ドキュメントサービス – バックエンド設計メモ（日本語訳）

本ドキュメントは Obsidian のような文書作成基盤のバックエンド（API と永続化層）の初期アーキテクチャと開発計画を示します。フロントエンドや同期クライアントは後でこの API 群を利用します。

## 1. 目的と制約
- 文書・フォルダ・メタデータ・インデックスを **PostgreSQL を唯一の信頼できる情報源** として管理する。
- 文書本体は **保存時に暗号化** し、一覧表示や検索に必要な最小限のメタデータのみ平文で保持する。
- **復号処理はバックエンド内で完結** させ、クライアントからストレージ鍵が見えないようにする。
- 任意の階層を持つフォルダや共有ドキュメント、相互リンクを扱える **階層型ワークスペース** に対応する。
- 複数ユーザーが同時に利用しても安定したレイテンシで **並列読取・検索** が行えるようにする。
- 将来的なオフライン同期やリアルタイム編集を考慮し、ストレージ層を大きく作り直さなくても拡張できる余地を残す。

## 2. 全体アーキテクチャ
```
┌──────────────────────────────────────────────────────────────────────┐
│ REST API (Spring Boot + Kotlin)                                      │
│  ├─ DocumentController                                               │
│  ├─ FolderController                                                 │
│  ├─ SearchController                                                 │
│  └─ EncryptionKeyController (admin)                                  │
├──────────────────────────────────────────────────────────────────────┤
│ アプリケーション層                                                   │
│  ├─ DocumentService         ─┐                                       │
│  ├─ FolderService           ├─> EncryptionService / IndexService を利用 │
│  ├─ SearchService           │                                       │
│  ├─ KeyRotationService      │                                       │
│  └─ AuditService            │                                       │
├──────────────────────────────────────────────────────────────────────┤
│ ドメイン + 永続化                                                   │
│  ├─ エンティティ (Document, DocumentRevision, Folder, Metadata, Tag) │
│  ├─ Spring Data リポジトリ (JPA/JDBC)                                │
│  ├─ 暗号化アダプタ (AES-GCM + JCE / AWS KMS ラッパー)               │
│  └─ PostgreSQL (パーティショニング + FTS + JSONB)                    │
├──────────────────────────────────────────────────────────────────────┤
│ バックグラウンドワーカー (TaskExecutor / コルーチン)                 │
│  ├─ 非同期インデックス更新 (tsvector 再生成)                        │
│  ├─ 鍵ローテーション / 再暗号化ジョブ                               │
│  └─ エクスポート / インポート処理                                  │
└──────────────────────────────────────────────────────────────────────┘
```

### 主要コンポーネント
- **DocumentService**: 文書の作成・更新・バージョン管理を統括。楽観的ロックやリビジョン木を扱い、本文の暗号化/復号は `EncryptionService` に委譲する。
- **FolderService**: 材化経路 (materialized path) またはネスト集合を用い、深い階層でも高速にサブツリーを取得できるようにする。
- **EncryptionService**:
  - エンベロープ暗号を採用。ドキュメントごとに Data Encryption Key (DEK, AES-256-GCM) を生成し、テナント単位の Key Encryption Key (KEK) で包んで保存。
  - KEK は HSM/KMS（推奨）または環境変数・シークレットマネージャから供給されるローカルマスターキーを用いる。
  - 大きなファイルでもメモリ使用量が予測可能になるよう、ストリーミング型の暗号化/復号ヘルパーを提供する。
- **SearchService**（保留）: Postgres の全文検索インデックスを使う案はあったが、現状の検索体験を悪化させる懸念があるため今回は実装しない。要件を再検討した後のマイルストーンで扱う予定。
- **IndexService**（保留）: 自動インデックス化パイプラインも同じ理由で未実装とし、将来の高品質な検索設計に向けたフックだけ残す。
- **AuditService**: 監査用イベントを JSON として発行し、コンプライアンス用途に備える。

## 3. データモデル（ドラフト）

| テーブル | 目的 | 主なカラム |
|----------|------|------------|
| `document_nodes` | フォルダ/ドキュメントの木構造（隣接リスト + materialized path）。 | `id`, `parent_id`, `path`, `type`, `title`, `slug`, `tenant_id`, `created_at`, `updated_at` |
| `document_revisions` | 暗号化された文書リビジョン。 | `id`, `document_id`, `revision_no`, `ciphertext BYTEA`, `dek_ciphertext BYTEA`, `nonce BYTEA`, `checksum`, `size_bytes`, `content_type`, `created_by`, `created_at` |
| `document_metadata` | 拡張メタデータ (JSONB)。 | `document_id` (PK/FK), `metadata JSONB`, `tags TEXT[]`, `is_published`, `last_indexed_at` |
| `document_search_index` | 全文検索インデックス。 | `document_id` (PK/FK), `language`, `content_vector TSVECTOR` |
| `encryption_keys` | テナント/ワークスペース単位の KEK とローテーション情報。 | `tenant_id` (PK), `kek_ciphertext`, `kek_version`, `created_at`, `rotated_at` |
| `audit_events` | 監査イベントログ（追記専用）。 | `id`, `tenant_id`, `actor_id`, `action`, `target_id`, `payload JSONB`, `created_at` |

- ※ `document_search_index` テーブルは設計上残しているが、検索品質悪化を避けるため今マイルストーンでは未使用のままとする。

### 階層構造の戦略
- `document_nodes` にフォルダとドキュメント両方を格納する。
- `path`（ltree もしくは text）でサブツリー検索を高速化し、`type` でフォルダと文書のプレースホルダーを区別。
- ドキュメント本文は別テーブルに保持し、`document_nodes` を軽量に保つ。

### 暗号化メタデータ
- 各リビジョンレコードに `ciphertext`, `nonce`, `dek_ciphertext`（DEK を KEK でラップしたもの）を保持。
- `checksum`（SHA-256）で完全性検証や重複検出を行う。

## 4. セキュリティと鍵管理
- **マスターキー戦略**: 可能であればクラウド KMS（AWS KMS, GCP KMS）と統合し、ローカル開発では PBKDF2 で導出したパスワード付き AES キーを利用する。
- **ローテーション**: `kek_version` を保持し、バックグラウンドの `KeyRotationService` が対象 DEK を順次再暗号化する。
- **通信の安全性**: 将来的にはサービス間/クライアントとの mTLS を想定。当面は HTTPS と JWT 認証（既存の Spring Security 設定）を必須化。
- **RBAC**: 既存のワークスペース権限モデルを活用し、CRUD やツリー操作を保護。
- **監査性**: すべての復号リクエストに利用者 ID と理由を記録し、不正利用を検知できるようにする。

## 5. 並列性とパフォーマンス
- 復号/インデックス用ワーカーには Kotlin コルーチンまたは Spring `TaskExecutor`（JDK 21 の仮想スレッド対応）を用いる。
- 暗号化/復号は Java の `CipherInputStream` などストリーミング処理を使い、大容量ファイルでもヒープ使用量を抑える。
- インデックス更新はバッチ実行かつ並列化し、デフォルトのスレッド数は CPU コア数に合わせつつテナントごとにレート制御。
- Postgres 最適化:
  - `document_revisions` をテナントまたは時間でパーティション分割し、不要領域の切り離しを高速化。
  - 検索には `tsvector` の GIN インデックスを利用。
  - `document_nodes (tenant_id, path)` や `document_metadata (tags)` に被覆インデックスを用意。
- よく参照されるメタデータは Redis キャッシュ（将来対応）で扱い、暗号化本文は Postgres のみに保持。

## 6. API インターフェース（ドラフト）
- `POST /api/v1/documents` – 文書作成。暗号化済み本文をアップロード（multipart または base64 JSON）。
- `GET /api/v1/documents/{id}` – メタデータと復号済み本文を返す（権限がある場合）。
- `PUT /api/v1/documents/{id}` – 楽観的ロックヘッダ（`If-Match` / revision）を使ったリビジョン追加。
- `GET /api/v1/folders/{id}/children` – 子ノード一覧。
- `POST /api/v1/folders` – フォルダ作成（スラッグ正規化を含む）。
- `GET /api/v1/search?query=...` – 全文検索。マッチ箇所をハイライトしたスニペットを返す。
- 管理用途として KEK ローテーションと監査ログエクスポートのエンドポイントを用意。

レスポンス形式は既存の API 規約（`success/data/error/timestamp`）に従う。

## 7. 開発計画

| マイルストーン | ゴール | 備考 |
|----------------|--------|------|
| **M1 – 基盤構築 (1〜2週)** | プロジェクト骨格、主要エンティティ、Testcontainers を使ったリポジトリテスト、暗号化なしの基本フォルダ CRUD。 | 既存の Gradle 設定を流用し、文書テーブル用の Flyway 初期マイグレーションを追加。 |
| **M2 – 暗号化コア (3〜4週)** | EncryptionService と KEK 管理、暗号化された CRUD、暗号化往復を検証する統合テスト。 | KMS/ローカル鍵を切り替えられるキー提供インターフェースを導入。 |
| **M3 – 検索とインデックス (5週)** | 非同期インデックスパイプライン、tsvector 保存、ページング付き検索 API、並列処理テスト。 | コルーチンベースのワーカープールとメトリクスを導入。 |
| **M4 – ハードニング (6週)** | RBAC 連携、監査、鍵ローテーションジョブ、性能ベンチ、ドキュメント整備。 | 復号/検索スループットに焦点を当てた負荷試験を含む。 |

## 8. 想定課題・リスク
- **検索と暗号化のトレードオフ**: tsvector によってキーワードが露出するため、セキュリティレビューが必要。将来的には準同型暗号やトークン化の検討余地あり。
- **バイナリアタッチメント**: 初期対象は Markdown だが、添付ファイルは別ストレージ（オブジェクトストア + 暗号化参照）が必要になる可能性がある。
- **リアルタイム共同編集**: 現状はリビジョンスナップショット前提。CRDT や OT を導入する場合は追加インフラが必要。
- **スケーリング**: Postgres のデータ量を監視し、大規模テナント向けにシャーディングやアーカイブ策を検討する。

---
要求の検証や既存の認証/テナントモジュールとの統合状況に合わせて、今後内容を更新していきます。

## Progress Log (2025-09-17)
- **M1-T7 進行中**: `EditorControllerIntegrationTest` を追加し、MockMvc でフォルダ/ドキュメント CRUD・パンくず・リビジョン一覧・404 応答を検証。テナント/ワークスペース/ロール権限をテスト内でシードし、エディタ機能トグル有効時のエンドツーエンド動作を確認。
- **M1-T6 完了**: エディタ API レイヤーを構築し、フォルダ/ドキュメントコントローラ・DTO・マッパー・例外ハンドラを実装。`app.features.editor.enabled` トグル配下で `success/data/error/timestamp` エンベロープを返すよう統一し、権限チェックを `hasPermissionRule('directory.*'|'document.*')` で適用。
- **M1-T5 完了**: `core/editor/domain/service/DocumentService.kt` を実装し、フォルダツリー/スラッグ生成との整合を取りつつプレーンテキストのドキュメント CRUD・リビジョン管理を提供。`DocumentAggregate` でノード・最新リビジョン・メタデータをセットで返却できるようにした。
- **統合テスト**: `integration/editor/service/DocumentServiceIntegrationTest` を追加し、Testcontainers 上で CRUD、リビジョン順序、メタデータ更新、削除の挙動を検証。
- **サポート更新**: `PropertyType` のシリアライゼーションを `multi_select`／`multiselect` 両対応に拡張し、`@OptIn(ExperimentalSerializationApi::class)` でビルド警告を解消。関連ユニットテストも更新。
- **品質維持**: Kotlin の `String.capitalize()` 非推奨箇所を `replaceFirstChar` へ差し替え。JWT 無効署名テスト用フィクスチャを再実装し、期待通り 401 を返すことを確認。`./gradlew test` を 2025-09-17 に実行し、全テスト成功を確認済み。
