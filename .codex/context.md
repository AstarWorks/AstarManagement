# Session Context – Astar Management Repo

_Last updated: 2025-09-17 (session by Codex agent)._ Keep expanding this file whenever we learn or change something significant so future sessions boot with full continuity.

## Project Snapshot
- **Product**: “Astar Management” – legal case management SaaS targeting law firms. Monolithic repo with backend (`backend/`), frontend (`frontend/`), docs, infra scripts.
- **Core pillars**:
  - Multi-tenant account/workspace model (Auth0 orgs ↔ tenants). Slack-like user membership where a user can span multiple tenants.
  - Dynamic table system (Notion-style) storing schema in Postgres JSONB with optimistic locking and RLS.
  - Role/permission model with dynamic roles, resource groups, and fine-grained permission rules that map onto Spring Security authorities.

## Recent Updates (2025-09-17)
- M1-T8 完了: エディタモジュール向け README を `docs/backend/features/editor/` に追加し、`app.features.editor.enabled` トグルの利用方法（`local` プロファイル既定有効 / 環境変数での上書き）を整理。`docs/backend/README.md` を更新して機能一覧へ編入。
- M1-T9 進行中: OpenAPI 生成設定を `build.gradle.kts` の `openApi` ブロックに追加し、`generateOpenApiDocs` で editor フィーチャが常時有効になるように調整。コントローラへ `@Tag` を付与し、バックエンドドキュメントに OpenAPI 更新手順とフロント型再生成コマンドを追記。
- M1-T10 着手: `DocumentNode` / `DocumentMetadata` に `version` を追加し、更新・削除をバージョンチェック付きにリファクタ。API DTO へ `nodeVersion` / `metadataVersion` を追加し、409 `EDITOR_CONFLICT` を返すハンドラと競合検知テスト（フォルダ・ドキュメント）を実装。
- M1-T7 完了: `EditorControllerIntegrationTest` を整備し、MockMvc でフォルダ/ドキュメント CRUD・パンくず・リビジョン・削除後 404 まで検証。テスト専用の `EditorSecurityTestConfig` で JWT 変換/Authorization をスタブ化しつつ、`TenantContextService` を各リクエスト前に明示セットして RLS コンテキストを再現。`./gradlew test`（ローカル実行）でグリーン確認済み。
- M1-T6 完了: エディタのフォルダ/ドキュメント REST コントローラ、DTO、例外ハンドラを実装。機能トグル配下で `success/data/error/timestamp` エンベロープを返すよう統一。
- M1-T5 完了: `DocumentService` を実装し、プレーンテキスト CRUD + リビジョン管理に対応。`DocumentAggregate` でノード/最新リビジョン/メタデータをまとめて返却。
- `DocumentServiceIntegrationTest` を追加し、Testcontainers 上での CRUD・メタデータ・削除検証を実施。
- `PropertyType` enum を `multi_select` / `multiselect` 双方向に対応させ、`JsonNames` 利用に伴う警告を `@OptIn(ExperimentalSerializationApi::class)` で解消。関連シリアライゼーションテストを更新。
- `TableControllerIntegrationTest` などテスト内の `String.capitalize()` を `replaceFirstChar` に置き換え、Kotlin の非推奨警告を除去。
- JWT 無効署名テスト用フィクスチャを調整し、シグネチャ部分だけを確実に破損させる実装に変更。
- `./gradlew test` を実行（2025-09-17）済み。`JwtAuthenticationIntegrationTest` を含む全テストが成功することを確認。

## Backend Deep Notes (`backend/`)
- **Entry point**: `AstarManagementApplication.kt` uses `@EnableJdbcRepositories` reflecting heavy Spring Data JDBC usage rather than full JPA for custom repositories.
- **Configurations**:
  - `application.yml` sets Kotlin serialization as preferred mapper, configures Auth0 issuer/jwk URIs, enabling Caffeine cache for JWKS. Profiles default to `local` unless overridden.
  - `application-local.yml` targets Postgres at `172.80.0.1:5433`, flips on mock auth (`auth.mock.enabled=true`), and repoints issuer to `http://localhost:8080/mock-auth`.
  - Logging tuned via `logback-spring.xml`. RLS toggled by `app.security.rls.enabled` (not on by default in local).
- **Auth Module** (`core/auth`):
  - `SecurityConfig.kt` centralizes HttpSecurity rules. Most API endpoints delegated to `CustomAuthorizationManager`. Swagger endpoints only open in dev profile via `developmentOnlyAccess()` guard.
  - `TenantAwareJwtAuthenticationConverter.kt` dev central: inspects JWT for `org_id`. Without it, yields `SetupModeAuthentication` or `MultiTenantAuthentication`. With it, builds `AuthenticatedUserContext` plus authorities by invoking `PermissionService`. **Note**: prints debug logs to stdout – keep in mind for production.
  - `JwtClaimsExtractor` (not fully reviewed yet) is responsible for bridging JWT claims to DB lookups. It powers the context creation.
  - Controllers of interest: `AuthController`, `AuthSetupController`, `RoleController`, `UserRoleController`, etc. `/api/v1/auth/me` returns different payloads for setup vs established tenants.
- **Tenant + Workspace**:
  - `core/tenant/domain/service/TenantService.kt` handles creation, slug uniqueness, Auth0 org linking, activation toggles. Offers simplified `create()` and `findAll()` wrappers for test-data endpoints.
  - `TenantContextService`: per-thread UUID storage with helper `withTenantContext` guard. This ties into RLS.
  - `shared/infrastructure/security/RLSInterceptor.kt`: `@Aspect` hooking `@Transactional` methods. When active, sets Postgres session vars `app.current_tenant_id` and `app.current_user_id`. Works with `TenantContextService` and `UserRepository` to translate Auth0 sub → internal user id.
  - `core/workspace` domain ensures name length constraints, holds `tenantId`, `teamId`, `createdBy`. `WorkspaceService` not reviewed yet but likely orchestrates repos.
- **Flexible Table Domain** (`core/table`):
  - Domain models: `Table`, `Record`, `PropertyDefinition`, `PropertyType`. Table ensures property order validity, duplicate key checks, rename helpers.
  - `TableRepositoryImpl` extends `BaseJsonbRepository`. Handles JSONB serialization (via `TableMapper`). Creates JDBC arrays for `property_order`. Update increments `version` column manually.
  - Migration chain `V012` onwards builds dynamic table infrastructure, `V025` adds descriptions. There's an outstanding TODO for record count metrics stored per table (observed fields in DTO but not tied to DB yet?).
  - Validation layer under `core/table/infrastructure/validation` uses Jakarta annotations + custom validators (`@ValidTableName`, `PropertyKeyValidator` etc.).
- **Shared Infrastructure**:
  - `BaseJsonbRepository` is generic for JSONB persistence with optimistic locking support. Uses manual SQL via JdbcTemplate and `RETURNING *` to reconstruct domain.
  - Serializers for Instant/UUID (`shared/infrastructure/config/SerializationConfig.kt`) provide Kotlinx serialization bridging.
  - `TestDataController` intentionally unauthenticated for dev. It uses `TenantService` to seed sample tenants. Danger if accidentally enabled in prod.
- **Tests**:
  - `src/test/kotlin/...` contains integration scaffolding with Testcontainers. `IntegrationTestBase` boots Postgres containers. 新設の `DocumentServiceIntegrationTest` や既存オンボーディング/RLS/権限シナリオなどを含む。`./gradlew test`（2025-09-17 実行）で全テスト成功を確認済み。
  - Mock auth utilities under `shared/testing` (controllers/services) to simulate Auth0.

## Frontend Deep Notes (`frontend/`)
- **Nuxt config** (`nuxt.config.ts`):
  - SSR enabled, but Nitro preset `static` indicates SPA-style deployment with pre-render. API proxy set up for `/api/v1 -> http://localhost:8080` unless `frontend-only` mode.
  - Modules: ESLint, Pinia (with persisted state), VueUse, shadcn-nuxt, i18n, Auth (`@sidebase/nuxt-auth` hooking Auth.js). Strict TypeScript enabled.
  - Runtime public env toggles `apiMode`, `apiBaseUrl`, websockets, feature flags like AI/offline (currently false by default).
- **Auth**:
  - Sign-in UI at `app/pages/signin.vue` (not yet inspected). `modules/auth/components/SignInForm.vue` uses vee-validate + simple watchers; Development panel available under `isDevelopment` flag to auto-fill credentials.
  - `app/middleware/redirect.ts` routes `/` to `/dashboard` or `/signin` based on `useAuth()` status. Additional security middleware stub for 2FA (future expansion) in `app/middleware/security.ts` using shared state `security-settings`.
  - `auth` module types define `SecuritySettings`, `BusinessProfile`, etc., prepping for richer flows.
- **Table Experience**:
  - `useTable` composable wraps repository pattern, selecting between real API and `MockTableRepository`. Logging ensures we know when mock is used (makes debugging easier).
  - `useTableList.ts` handles persistence of sort/view mode via `useLocalStorage`, uses `useAsyncData` with `server:false`. Contains multiple console logs – consider pruning later.
  - UI components `TableList.vue`, `TableListGrid`, `TableListTable` offer view toggles and selection/batch actions. Batch deletion uses `useTableDeletion` composable.
  - Record management via `useRecordData.ts` (supports infinite scroll, toast notifications with `vue-sonner`). Batch create/update expects backend endpoints `/api/v1/records/batch` etc. Need to confirm backend matches the payload shapes (observed potential mismatch: backend may not yet have `batchSize` fields? verify before relying).
- **Global Foundation**:
  - Config files under `app/foundation/config` centralize API constants, navigation, languages. Example: `apiConfig.ts` enumerates `retryableCodes`, file upload constraints, endpoints (some not yet implemented on backend, e.g., `/documents` routes – treat as roadmap).
  - Stores: `useNavigationStore` with persist plugin storing `currentNavigationId`. Comments encourage migrating to composables.
  - Layout: `app/layouts/default.vue` handles responsive sidebar, keyboard shortcuts (Ctrl/Cmd+B toggles). `useBreakpoints` from VueUse used for mobile detection.
  - i18n: `app/i18n.config.ts` default locale `ja`. Only `ja` messages currently imported from `i18n/locales/ja`. Provide caution if we need `en` fallback.
- **Module interplay**:
  - `useApiClient` chooses between `MockApiClient` and `RealApiClient` (Zodios). It resets on HMR/app unmount. `useApi()` referenced in repositories likely exported from generated `app/shared/api/zod-client.ts` (Zod schema auto-generated). Need to examine Real/Mock clients when integrating new endpoints.
  - Dashboard page uses `useDashboardData` composable (not yet read) pulling stats + activities. Quick actions adapt to mock mode (uses `MOCK_TABLE_IDS`).

## Infrastructure & Docs
- `docs/backend/README.md` + `docs/frontend/README.md` provide high-level architecture diagrams and intended features beyond current code (e.g., GraphQL mention even though backend seems REST-focused now). Keep them in sync when we implement/rename modules.
- `docs/infrastructure/multitenancy.md` spells out three-tier separation (Starter shared DB with RLS, Professional dedicated schema, Enterprise isolated containers). Contains code snippets for schema creation + Kubernetes manifest skeletons.
- `docs/planned/` has future design notes for AI agent integration and document management (both backend + frontend). Useful for aligning new feature work.
- `infrastructure/local/docker/postgresql` (not opened yet) hosts Docker Compose + init scripts. Use when needing local DB beyond default remote IP.
- `scripts/minio-init.sh` presumably seeds buckets; not reviewed yet.

## Open Questions / Investigation Targets
1. **API Alignment**: Confirm backend exposes all endpoints referenced in `app/foundation/config/apiConfig.ts` (Documents, Dashboard stats, etc.). Some may be placeholders; avoid wiring UI to missing endpoints without feature flags.
2. **Batch Record Endpoints**: Validate request/response contract. Frontend expects `records` payload when calling `createRecordsBatch`/`updateRecordsBatch`. Check backend `RecordController` for actual structure; if absent, plan to implement or guard with mock mode.
3. **Permission serialization**: Zod schemas in `app/shared/api/zod-client.ts` expect properties like `ResourceGroupRule` with `groupId`, etc. Ensure backend DTOs align (look into `core/auth/api/dto`).
4. **Testing coverage**: No frontend tests were run; confirm `bun run test` passes once we begin altering modules. Backend integration tests rely on containerized DB; may need to adjust configuration to avoid hitting `172.80.0.1` when running inside CI.
5. **Console noise**: Multiple `println`/`console.log` debug statements (converter, composables) – plan to replace with structured logging or guard by env before production.
6. **Data seeding**: Explore migrations or scripts that create default templates/workspaces. YAML templates under `src/main/resources/templates/business/*.yaml` feed `YamlTemplateRepository` but we should ensure migrations populate DB or server loads them at runtime.

## Workflow Tips / Reminders
- Backend run: `cd backend && SPRING_PROFILES_ACTIVE=local ./gradlew bootRun`; be sure `postgres-dev` from `infrastructure/local/docker/postgresql/docker-compose.yml` is running (`docker-compose up -d postgres-dev`).
- Backend tests: `cd backend && ./gradlew test` (this covers the current suite; other tasks optional).
- Frontend run: `cd frontend && bun install && bun run dev`. Use `NUXT_PUBLIC_API_MODE=mock` for standalone UI iteration. After backend API change, execute `bun run openapi:all` to regenerate typed clients into `app/shared/api/generated`.
- When editing backend, keep Kotlin 4-space indent; frontend uses 2 spaces per ESLint/Prettier config.
- `.codex/context.md` is for the agent only; user doesn't need to read it. Keep updating this file proactively at each milestone (explicit user request). Note this expectation in every update (done at top of file).

## Pending TODOs / Ideas (carry forward)
- Review `core/table/api/controller/TableController.kt` + record controllers to map to frontend needs (not yet read this session).
- Investigate `backend/openapi.json` – determine how it is generated and ensure it stays current; frontend’s `openapi.json` might be older snapshot.
- Audit `tests/` root dir (currently only README) – maybe houses end-to-end or contract tests in future.
- Check `backend/docs` (e.g., `comprehensive-testing-analysis.md`, `transaction-management-analysis.md`) for patterns or decisions we should maintain.
- Evaluate Auth0 dependency: there are mock controllers; identify how to toggle between real Auth0 and mock during local dev.

## Meta
- User explicitly wants us to create/update this context file each session (“この作業は勝手に&頻繁に行うことを推奨”). Continue complying without prompting, adding timestamps.
- When we conclude future sessions, recap modifications here. Include any open PR ideas, troublesome commands, or environment quirks encountered.

## Update – 2025-09-17
- Needed to start Postgres with `docker-compose up -d postgres-dev`; running with elevated permissions due to Docker socket restrictions.
- Backend boot command `SPRING_PROFILES_ACTIVE=local ./gradlew bootRun` initially failed when Gradle defaulted to `/home/node/.gradle` and on network download attempts; workaround was setting `GRADLE_USER_HOME=../.gradle` and reusing pre-downloaded Gradle in repo.
- Encountered lingering `bootRun` Java process holding port 8080; resolved via `lsof -i :8080` and `kill <pid>`.
- Final bootRun attempt logged a successful startup before CLI timeout stopped the process; confirmed 8080 free afterward.
- Added V026 migration scaffolding for editor document schema; deferred automated search indexing to avoid quality drop. Gradle/Flyway migration command still blocked in sandbox (wildcard IP error).
- Implemented editor domain models with JDBC repositories/mappers and added integration test coverage harness via Testcontainers (rerun locally to confirm). Latest build leaves only pre-existing PropertyType serialization tests failing.

## Update – 2025-02-16
- Added `.codex/editor_backend/M1.md` describing the detailed plan for Milestone 1 (service foundation & plaintext CRUD). Use it as source of truth for initial implementation scope before encryption.
- Reminder: each new session should begin by skimming the repository to refresh overall architecture/context before diving into tasks.
- Session ending soon (2025-02-16). Next agent should start by reviewing repository overview and Milestone M1 plan before resuming work.
