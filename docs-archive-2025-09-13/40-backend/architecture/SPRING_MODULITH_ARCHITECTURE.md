# Spring Modulith アーキテクチャ設計

## 概要

Astar Managementでは、**Modular Monolith**アプローチを採用し、Spring Modulithを使用してマイクロサービスへの段階的移行を可能にする設計を行います。

### 設計原則

1. **Simple over Easy**: 理解しやすく保守しやすい構造
2. **Generic over Specific**: 汎用的な基盤、特化はテンプレートで
3. **Event-Driven**: モジュール間の疎結合
4. **Clean Architecture**: 依存性の逆転と層分離
5. **Domain-Driven Design**: ビジネス価値中心の設計

## ディレクトリ構成

### Phase 1: 最小限実装（現在 - 1ヶ月）

**目標**: Auth0認証のみの動作する基盤

```
backend/src/main/kotlin/com/astarworks/astarmanagement/
├── AstarManagementApplication.kt              # メインエントリーポイント
│
├── core/                                      # システムコアモジュール
│   ├── domain/                               # ドメイン層
│   │   ├── model/
│   │   │   ├── User.kt                      # ユーザーエンティティ
│   │   │   ├── Tenant.kt                    # テナントエンティティ
│   │   │   └── AuditableEntity.kt           # 監査可能な基底エンティティ
│   │   ├── repository/
│   │   │   ├── UserRepository.kt            # ユーザーリポジトリ
│   │   │   └── TenantRepository.kt          # テナントリポジトリ
│   │   └── service/
│   │       └── TenantContextService.kt      # テナントコンテキストサービス
│   │
│   ├── application/                          # アプリケーション層
│   │   ├── usecase/
│   │   │   ├── CreateUserUseCase.kt         # ユーザー作成ユースケース
│   │   │   └── GetUserUseCase.kt            # ユーザー取得ユースケース
│   │   ├── service/
│   │   │   └── UserApplicationService.kt    # ユーザーアプリケーションサービス
│   │   └── dto/
│   │       ├── UserDto.kt                   # ユーザーDTO
│   │       └── TenantDto.kt                 # テナントDTO
│   │
│   ├── infrastructure/                       # インフラストラクチャ層
│   │   ├── persistence/
│   │   │   ├── JpaUserRepository.kt         # JPA実装
│   │   │   ├── UserEntity.kt               # JPAエンティティ
│   │   │   └── TenantEntity.kt             # JPAエンティティ
│   │   ├── security/
│   │   │   ├── Auth0Properties.kt           # Auth0設定
│   │   │   ├── JwtDecoderConfig.kt          # JWT復号化設定
│   │   │   ├── JwtAudienceValidator.kt      # JWT検証
│   │   │   └── SecurityConfig.kt            # セキュリティ設定
│   │   └── config/
│   │       ├── DatabaseConfig.kt            # データベース設定
│   │       └── CacheConfig.kt               # キャッシュ設定
│   │
│   └── api/                                 # API層（プレゼンテーション）
│       ├── controller/
│       │   ├── UserController.kt            # ユーザーAPI
│       │   └── HealthController.kt          # ヘルスチェック
│       ├── request/
│       │   └── CreateUserRequest.kt         # ユーザー作成リクエスト
│       ├── response/
│       │   ├── UserResponse.kt              # ユーザーレスポンス
│       │   └── ApiResponse.kt               # 共通レスポンス形式
│       └── exception/
│           └── GlobalExceptionHandler.kt    # グローバル例外ハンドラ
│
└── auth/                                     # 認証モジュール
    ├── application/
    │   └── service/
    │       └── AuthService.kt               # 認証サービス
    └── infrastructure/
        └── converter/
            └── Auth0JwtConverter.kt         # Auth0 JWT変換
```

### Phase 2: 基本機能拡張（1-3ヶ月）

**目標**: 汎用4コア機能の基礎実装

```
├── core/                                     # 既存のシステムコア
├── auth/                                     # 既存の認証
│
├── flexible-table/                           # 柔軟テーブル（Notion風）
│   ├── domain/
│   │   ├── model/
│   │   │   ├── Database.kt                  # テーブル定義
│   │   │   ├── Record.kt                    # レコード
│   │   │   ├── Property.kt                  # プロパティ定義
│   │   │   └── PropertyType.kt              # プロパティ型
│   │   ├── repository/
│   │   │   ├── DatabaseRepository.kt        # テーブル定義リポジトリ
│   │   │   └── RecordRepository.kt          # レコードリポジトリ
│   │   └── service/
│   │       ├── PropertyValidator.kt         # プロパティ検証
│   │       └── JsonSchemaService.kt         # JSONスキーマサービス
│   │
│   ├── application/
│   │   ├── usecase/
│   │   │   ├── CreateDatabaseUseCase.kt     # テーブル作成
│   │   │   ├── CreateRecordUseCase.kt       # レコード作成
│   │   │   └── QueryRecordUseCase.kt        # レコード検索
│   │   └── service/
│   │       └── FlexibleTableService.kt      # 柔軟テーブルサービス
│   │
│   ├── infrastructure/
│   │   └── persistence/
│   │       ├── JpaDatabaseRepository.kt     # JPA実装
│   │       └── JsonbRecordRepository.kt     # JSONB実装
│   │
│   └── api/
│       └── controller/
│           ├── DatabaseController.kt        # テーブル管理API
│           └── RecordController.kt          # レコード管理API
│
├── document/                                 # 階層ドキュメント（Obsidian風）
│   ├── domain/
│   │   ├── model/
│   │   │   ├── Document.kt                  # ドキュメント
│   │   │   ├── Folder.kt                    # フォルダ
│   │   │   ├── Variable.kt                  # テンプレート変数
│   │   │   └── DocumentVersion.kt           # バージョン管理
│   │   ├── repository/
│   │   │   ├── DocumentRepository.kt        # ドキュメントリポジトリ
│   │   │   └── FolderRepository.kt          # フォルダリポジトリ
│   │   └── service/
│   │       ├── MarkdownProcessor.kt         # Markdown処理
│   │       └── VariableResolver.kt          # 変数解決
│   │
│   ├── application/
│   │   ├── usecase/
│   │   │   ├── CreateDocumentUseCase.kt     # ドキュメント作成
│   │   │   ├── RenderDocumentUseCase.kt     # ドキュメント描画
│   │   │   └── SearchDocumentUseCase.kt     # ドキュメント検索
│   │   └── service/
│   │       └── DocumentService.kt           # ドキュメントサービス
│   │
│   ├── infrastructure/
│   │   ├── persistence/
│   │   │   ├── JpaDocumentRepository.kt     # JPA実装
│   │   │   └── FullTextSearchRepository.kt  # 全文検索
│   │   └── storage/
│   │       └── S3FileStorage.kt             # ファイル保存
│   │
│   └── api/
│       └── controller/
│           ├── DocumentController.kt        # ドキュメントAPI
│           └── FolderController.kt          # フォルダAPI
│
└── template/                                 # 業界テンプレート
    ├── domain/
    │   ├── model/
    │   │   ├── Template.kt                  # テンプレート定義
    │   │   ├── TemplateConfig.kt            # テンプレート設定
    │   │   └── IndustryType.kt              # 業界タイプ
    │   └── service/
    │       └── TemplateEngine.kt             # テンプレートエンジン
    │
    ├── application/
    │   ├── usecase/
    │   │   ├── ApplyTemplateUseCase.kt       # テンプレート適用
    │   │   └── CustomizeTemplateUseCase.kt   # テンプレートカスタマイズ
    │   └── service/
    │       └── TemplateService.kt            # テンプレートサービス
    │
    ├── infrastructure/
    │   └── persistence/
    │       └── JpaTemplateRepository.kt      # JPA実装
    │
    └── api/
        └── controller/
            └── TemplateController.kt         # テンプレートAPI
```

### Phase 3: 高度機能（3-6ヶ月）

**目標**: AIエージェント統合とワークフロー

```
├── 既存のすべてのモジュール...
│
├── ai-agent/                                 # AIエージェント統合
│   ├── domain/
│   │   ├── model/
│   │   │   ├── Agent.kt                     # AIエージェント
│   │   │   ├── Task.kt                      # AIタスク
│   │   │   ├── Context.kt                   # 実行コンテキスト
│   │   │   └── Knowledge.kt                 # ナレッジベース
│   │   └── service/
│   │       ├── AgentOrchestrator.kt         # エージェント協調
│   │       └── ContextBuilder.kt            # コンテキスト構築
│   │
│   ├── application/
│   │   ├── usecase/
│   │   │   ├── ExecuteTaskUseCase.kt        # タスク実行
│   │   │   └── TrainAgentUseCase.kt         # エージェント学習
│   │   └── service/
│   │       ├── LLMService.kt                # LLMサービス
│   │       └── RAGService.kt                # RAG検索
│   │
│   ├── infrastructure/
│   │   ├── llm/
│   │   │   ├── OpenAIProvider.kt            # OpenAI実装
│   │   │   ├── LocalLLMProvider.kt          # ローカルLLM
│   │   │   └── EmbeddingService.kt          # 埋め込み生成
│   │   └── vector/
│   │       └── VectorStoreRepository.kt     # ベクトルDB
│   │
│   └── api/
│       └── controller/
│           └── AgentController.kt           # AI API
│
├── workflow/                                 # ワークフロー管理
│   ├── domain/
│   │   ├── model/
│   │   │   ├── Workflow.kt                  # ワークフロー定義
│   │   │   ├── WorkflowInstance.kt          # 実行インスタンス
│   │   │   ├── WorkflowStep.kt              # ステップ定義
│   │   │   └── WorkflowState.kt             # 状態管理
│   │   └── service/
│   │       ├── WorkflowEngine.kt            # ワークフローエンジン
│   │       └── StateTransition.kt           # 状態遷移
│   │
│   ├── application/
│   │   └── usecase/
│   │       ├── StartWorkflowUseCase.kt      # ワークフロー開始
│   │       └── ProgressWorkflowUseCase.kt   # 進捗管理
│   │
│   └── infrastructure/
│       ├── persistence/
│       │   └── JpaWorkflowRepository.kt     # JPA実装
│       └── messaging/
│           └── WorkflowEventHandler.kt      # イベント処理
│
├── notification/                             # 通知システム
│   ├── domain/
│   │   ├── model/
│   │   │   ├── Notification.kt              # 通知
│   │   │   ├── NotificationTemplate.kt      # 通知テンプレート
│   │   │   └── NotificationChannel.kt       # 配信チャネル
│   │   └── service/
│   │       └── NotificationService.kt       # 通知サービス
│   │
│   ├── application/
│   │   └── usecase/
│   │       └── SendNotificationUseCase.kt   # 通知送信
│   │
│   └── infrastructure/
│       ├── email/
│       │   └── EmailProvider.kt             # メール送信
│       ├── slack/
│       │   └── SlackProvider.kt             # Slack送信
│       └── push/
│           └── WebPushProvider.kt           # Web Push
│
├── audit/                                    # 監査・ログ
│   ├── domain/
│   │   ├── model/
│   │   │   ├── AuditLog.kt                  # 監査ログ
│   │   │   ├── AuditEvent.kt                # 監査イベント
│   │   │   └── SecurityEvent.kt             # セキュリティイベント
│   │   └── service/
│   │       └── AuditService.kt              # 監査サービス
│   │
│   └── infrastructure/
│       ├── persistence/
│       │   └── TimeSeriesRepository.kt      # 時系列DB
│       └── export/
│           └── AuditExporter.kt             # 監査エクスポート
│
├── integration/                              # 外部連携
│   ├── domain/
│   │   ├── model/
│   │   │   ├── Integration.kt               # 統合設定
│   │   │   └── IntegrationEvent.kt          # 統合イベント
│   │   └── service/
│   │       └── IntegrationService.kt        # 統合サービス
│   │
│   └── infrastructure/
│       ├── webhook/
│       │   └── WebhookHandler.kt            # Webhook処理
│       ├── api/
│       │   ├── ExternalApiClient.kt         # 外部API
│       │   └── RateLimiter.kt               # レート制限
│       └── sync/
│           └── DataSynchronizer.kt          # データ同期
│
└── analytics/                                # 分析・レポート
    ├── domain/
    │   ├── model/
    │   │   ├── Report.kt                    # レポート定義
    │   │   ├── Metric.kt                    # メトリクス
    │   │   └── Dashboard.kt                 # ダッシュボード
    │   └── service/
    │       └── AnalyticsService.kt          # 分析サービス
    │
    ├── application/
    │   └── usecase/
    │       ├── GenerateReportUseCase.kt     # レポート生成
    │       └── CalculateMetricUseCase.kt    # メトリクス計算
    │
    └── infrastructure/
        ├── olap/
        │   └── OLAPRepository.kt            # OLAP処理
        └── visualization/
            └── ChartGenerator.kt            # チャート生成
```

## Clean Architecture 層構造詳細

### ドメイン層（Domain Layer）
```kotlin
// 各モジュールのドメイン層構造
domain/
├── model/                              # エンティティとバリューオブジェクト
│   ├── [Entity].kt                    # ビジネスエンティティ
│   ├── [ValueObject].kt               # バリューオブジェクト
│   └── [AggregateRoot].kt             # 集約ルート
├── repository/                         # リポジトリインターフェース
│   └── [Entity]Repository.kt          # リポジトリ契約
├── service/                           # ドメインサービス
│   └── [Domain]Service.kt             # ビジネスロジック
└── event/                            # ドメインイベント
    ├── [Entity]CreatedEvent.kt        # 作成イベント
    └── [Entity]UpdatedEvent.kt        # 更新イベント
```

### アプリケーション層（Application Layer）
```kotlin
application/
├── usecase/                           # ユースケース（業務プロセス）
│   ├── Create[Entity]UseCase.kt       # 作成ユースケース
│   ├── Update[Entity]UseCase.kt       # 更新ユースケース
│   └── Query[Entity]UseCase.kt        # 照会ユースケース
├── service/                           # アプリケーションサービス
│   └── [Entity]ApplicationService.kt  # 協調サービス
├── dto/                              # データ転送オブジェクト
│   ├── [Entity]Dto.kt                # エンティティDTO
│   └── [Entity]SearchDto.kt          # 検索DTO
└── port/                             # ポート（インターフェース）
    ├── input/                        # 入力ポート
    │   └── [UseCase]Port.kt          # ユースケースポート
    └── output/                       # 出力ポート
        └── [Repository]Port.kt       # リポジトリポート
```

### インフラストラクチャ層（Infrastructure Layer）
```kotlin
infrastructure/
├── persistence/                       # データ永続化
│   ├── Jpa[Entity]Repository.kt      # JPA実装
│   ├── [Entity]Entity.kt             # JPAエンティティ
│   └── [Entity]Mapper.kt             # エンティティマッパー
├── external/                         # 外部サービス連携
│   ├── [External]Client.kt           # 外部サービスクライアント
│   └── [External]Adapter.kt          # 外部サービスアダプター
├── messaging/                        # メッセージング
│   ├── [Event]Publisher.kt           # イベント発行
│   └── [Event]Handler.kt             # イベント処理
└── config/                          # 設定
    ├── [Module]Config.kt             # モジュール設定
    └── [Infrastructure]Config.kt     # インフラ設定
```

### API層（Presentation Layer）
```kotlin
api/
├── controller/                        # REST コントローラー
│   └── [Entity]Controller.kt         # APIエンドポイント
├── request/                          # リクエストDTO
│   ├── Create[Entity]Request.kt      # 作成リクエスト
│   ├── Update[Entity]Request.kt      # 更新リクエスト
│   └── [Entity]SearchRequest.kt      # 検索リクエスト
├── response/                         # レスポンスDTO
│   ├── [Entity]Response.kt           # エンティティレスポンス
│   ├── [Entity]ListResponse.kt       # リストレスポンス
│   └── ApiResponse.kt                # 共通レスポンス
└── exception/                        # 例外ハンドリング
    ├── [Module]ExceptionHandler.kt   # モジュール例外ハンドラ
    └── ApiErrorResponse.kt           # API エラーレスポンス
```

## モジュール間通信

### イベント駆動通信
```kotlin
// モジュール間のイベント通信例
@Component
class UserEventPublisher {
    @EventListener
    fun handleUserCreated(event: UserCreatedEvent) {
        // 他のモジュールに通知
        applicationEventPublisher.publishEvent(
            ModuleUserCreatedEvent(event.userId, event.email)
        )
    }
}

// 受信側モジュール
@Component
class FlexibleTableEventHandler {
    @EventListener
    fun handleUserCreated(event: ModuleUserCreatedEvent) {
        // デフォルトテーブルを作成
        createDefaultTablesForUser(event.userId)
    }
}
```

### API境界
```kotlin
// モジュール間のAPI境界定義
interface UserQueryPort {
    fun findById(userId: UUID): UserDto?
    fun findByEmail(email: String): UserDto?
}

// 他のモジュールからの利用
@Component
class FlexibleTableService(
    private val userQueryPort: UserQueryPort
) {
    fun createTableForUser(userId: UUID, tableRequest: CreateTableRequest) {
        val user = userQueryPort.findById(userId) 
            ?: throw UserNotFoundException(userId)
        // テーブル作成ロジック
    }
}
```

## テスト戦略

### モジュールテスト
```kotlin
@ModuleTest                           // Spring Modulith テストスライス
class FlexibleTableModuleTest {
    
    @Test
    fun `should create table successfully`() {
        // モジュール単体テスト
    }
    
    @Test 
    fun `should handle user created event`() {
        // イベント処理テスト
    }
}
```

### 統合テスト
```kotlin
@ApplicationModuleTest                // 複数モジュール統合テスト
class UserFlexibleTableIntegrationTest {
    
    @Test
    fun `should create default tables when user is created`() {
        // ユーザー作成 → テーブル自動作成のテスト
    }
}
```

### アーキテクチャテスト
```kotlin
@Test
class ArchitectureTest {
    
    @Test
    fun `modules should not have cyclic dependencies`() {
        // 循環依存チェック
    }
    
    @Test
    fun `domain layer should not depend on infrastructure`() {
        // レイヤー依存関係チェック  
    }
}
```

## データベース戦略

### マルチテナンシー実装
```sql
-- Row Level Security (RLS) 実装例
CREATE POLICY tenant_isolation ON users
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
    
CREATE POLICY tenant_isolation ON databases  
    USING (tenant_id = current_setting('app.current_tenant')::uuid);
```

### JSONB活用
```sql
-- 柔軟テーブルのレコード保存
CREATE TABLE records (
    id UUID PRIMARY KEY,
    database_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    data JSONB NOT NULL DEFAULT '{}',
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- 動的インデックス（プロパティごと）
CREATE INDEX idx_records_data_name ON records 
    USING GIN ((data->>'name'));
```

## 段階的移行戦略

### Phase 1 → Phase 2 移行
1. **新モジュール追加**: 既存コードに影響なし
2. **イベント連携実装**: 疎結合で段階的統合
3. **API境界確定**: インターフェース分離

### Phase 2 → Phase 3 移行
1. **高度機能モジュール追加**: 基本機能は維持
2. **AIエージェント統合**: 既存機能のAI化
3. **パフォーマンス最適化**: モジュール独立で改善

### 将来のマイクロサービス化
```yaml
# 独立性の高いモジュールから段階的に分離
Priority 1: analytics, notification  # 疎結合
Priority 2: ai-agent, workflow      # 複雑だが分離可能
Priority 3: flexible-table, document # コア機能（慎重に）
```

## まとめ

この設計により：

1. **段階的成長**: 最小限から高機能まで段階的実装
2. **保守性**: モジュール分離とClean Architecture
3. **拡張性**: 新機能追加が既存に影響しない
4. **テスト性**: 各層・各モジュールの独立テスト
5. **将来性**: マイクロサービス化への道筋

**Enterprise Obsidian + AI Native** のビジョンを実現する技術基盤となります。