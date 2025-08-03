# プロジェクト構造設計書

## 1. 設計原則

### 1.1 基本原則
- **モジュラーモノリス**: Spring Modulithを活用した将来のマイクロサービス化を見据えた設計
- **明確な境界**: 各モジュール間の依存関係を最小化
- **イベント駆動**: モジュール間通信はイベントベース
- **DDD（ドメイン駆動設計）**: ビジネスロジックを中心とした設計

## 2. ディレクトリ構造

```
Astar-management/
├── backend/                           # バックエンドモノリス (Spring Boot)
│   ├── api/                          # APIエンドポイント層
│   │   ├── rest/                     # REST API
│   │   ├── graphql/                  # GraphQL API
│   │   └── websocket/                # WebSocket エンドポイント
│   ├── modules/                      # Spring Modulith モジュール
│   │   ├── auth/                     # 認証・認可モジュール
│   │   ├── case-management/          # 案件管理モジュール
│   │   ├── document/                 # 文書管理モジュール
│   │   ├── communication/            # コミュニケーションモジュール
│   │   ├── financial/                # 財務管理モジュール
│   │   ├── calendar/                 # カレンダー・スケジュール管理
│   │   ├── client/                   # クライアント管理
│   │   └── shared/                   # 共有モジュール
│   ├── infrastructure/               # インフラストラクチャ層
│   │   ├── persistence/              # データ永続化
│   │   ├── messaging/                # メッセージング
│   │   ├── storage/                  # ファイルストレージ
│   │   └── external/                 # 外部サービス統合
│   └── config/                       # 設定ファイル
│       ├── application.yml           # アプリケーション設定
│       └── logback.xml               # ロギング設定
│
├── frontend/                         # フロントエンド (Nuxt.js)
│   ├── components/                   # UIコンポーネント
│   │   ├── atoms/                    # 基本コンポーネント
│   │   ├── molecules/                # 複合コンポーネント
│   │   ├── organisms/                # 複雑なコンポーネント
│   │   └── templates/                # ページテンプレート
│   ├── composables/                  # Vue Composables
│   ├── pages/                        # ページコンポーネント
│   │   ├── cases/                    # 案件管理ページ
│   │   ├── documents/                # 文書管理ページ
│   │   ├── financial/                # 財務管理ページ
│   │   ├── calendar/                 # カレンダーページ
│   │   └── settings/                 # 設定ページ
│   ├── layouts/                      # レイアウトコンポーネント
│   ├── middleware/                   # ルートミドルウェア
│   ├── plugins/                      # Nuxtプラグイン
│   ├── stores/                       # Pinia ストア
│   ├── utils/                        # ユーティリティ関数
│   ├── types/                        # TypeScript型定義
│   └── assets/                       # 静的アセット
│       ├── css/                      # スタイルシート
│       └── images/                   # 画像ファイル
│
├── infrastructure/                   # インフラストラクチャ設定
│   ├── docker/                       # Docker設定
│   │   ├── backend/                  # バックエンド用Dockerfile
│   │   ├── frontend/                 # フロントエンド用Dockerfile
│   │   └── compose/                  # Docker Compose設定
│   ├── kubernetes/                   # Kubernetes マニフェスト
│   │   ├── base/                     # 基本設定
│   │   ├── overlays/                 # 環境別設定
│   │   └── components/               # 再利用可能コンポーネント
│   └── terraform/                    # Terraform設定
│       ├── modules/                  # Terraformモジュール
│       └── environments/             # 環境別設定
│
├── docs/                             # プロジェクトドキュメント
│   ├── architecture/                 # アーキテクチャ文書
│   ├── api/                          # API仕様（OpenAPI/GraphQL）
│   ├── deployment/                   # デプロイメントガイド
│   └── development/                  # 開発ガイド
│
├── tests/                            # 統合テスト・E2Eテスト
│   ├── e2e/                          # E2Eテスト
│   ├── integration/                  # 統合テスト
│   ├── performance/                  # パフォーマンステスト
│   └── fixtures/                     # テストデータ
│
├── scripts/                          # ビルド・デプロイスクリプト
│   ├── build/                        # ビルドスクリプト
│   ├── deploy/                       # デプロイスクリプト
│   └── dev/                          # 開発用スクリプト
│
└── .github/                          # GitHub設定
    ├── workflows/                    # GitHub Actions
    ├── ISSUE_TEMPLATE/               # イシューテンプレート
    └── CODEOWNERS                    # コードオーナー設定
```

## 3. モジュール詳細設計

### 3.1 Backend モジュール構造

```
backend/modules/case-management/
├── api/                              # モジュールAPI（公開インターフェース）
│   ├── commands/                     # コマンド（CQRS）
│   │   ├── CreateCaseCommand.kt
│   │   ├── UpdateCaseCommand.kt
│   │   └── CloseCaseCommand.kt
│   ├── queries/                      # クエリ（CQRS）
│   │   ├── GetCaseQuery.kt
│   │   └── SearchCasesQuery.kt
│   └── events/                       # ドメインイベント
│       ├── CaseCreatedEvent.kt
│       └── CaseStatusChangedEvent.kt
├── domain/                           # ドメインモデル
│   ├── model/                        # エンティティ・値オブジェクト
│   │   ├── Case.kt
│   │   ├── CaseStatus.kt
│   │   └── CaseParty.kt
│   ├── service/                      # ドメインサービス
│   │   └── CaseValidationService.kt
│   └── repository/                   # リポジトリインターフェース
│       └── CaseRepository.kt
├── application/                      # アプリケーションサービス
│   └── usecase/                      # ユースケース
│       ├── CreateCaseUseCase.kt
│       ├── UpdateCaseUseCase.kt
│       └── SearchCaseUseCase.kt
├── infrastructure/                   # インフラストラクチャ実装
│   ├── persistence/                  # データ永続化実装
│   │   ├── JpaCaseRepository.kt
│   │   └── CaseEntity.kt
│   └── messaging/                    # メッセージング実装
│       └── CaseEventPublisher.kt
└── web/                              # Web層（REST/GraphQL）
    ├── rest/                         # RESTコントローラー
    │   └── CaseController.kt
    └── graphql/                      # GraphQLリゾルバー
        └── CaseResolver.kt
```

### 3.2 Frontend 構造詳細

```
frontend/
├── components/
│   ├── atoms/
│   │   ├── AButton.vue              # ボタンコンポーネント
│   │   ├── AInput.vue               # 入力フィールド
│   │   ├── AIcon.vue                # アイコン
│   │   └── ALabel.vue               # ラベル
│   ├── molecules/
│   │   ├── MFormField.vue           # フォームフィールド
│   │   ├── MSearchBar.vue           # 検索バー
│   │   ├── MDataTable.vue           # データテーブル
│   │   └── MNotification.vue        # 通知
│   └── organisms/
│       ├── OCaseCard.vue            # 案件カード
│       ├── OKanbanBoard.vue         # カンバンボード
│       ├── ODocumentViewer.vue      # 文書ビューア
│       └── OCalendar.vue            # カレンダー
├── composables/
│   ├── useCase.ts                   # 案件管理
│   ├── useDocument.ts               # 文書管理
│   ├── useFinancial.ts              # 財務管理
│   └── useAuth.ts                   # 認証管理
├── stores/
│   ├── auth.ts                      # 認証ストア
│   ├── case.ts                      # 案件ストア
│   ├── document.ts                  # 文書ストア
│   └── ui.ts                        # UIストア
└── types/
    ├── case.ts                      # 案件関連型定義
    ├── document.ts                  # 文書関連型定義
    └── common.ts                    # 共通型定義
```

## 4. 技術スタック

### 4.1 Backend
- **言語**: Kotlin (Java 21)
- **フレームワーク**: Spring Boot 3.5.0
- **モジュール化**: Spring Modulith
- **認証**: Spring Security + OAuth2/JWT
- **データベース**: PostgreSQL 15 + Spring Data JPA
- **キャッシュ**: Redis
- **メッセージング**: Redis Streams / Spring Events
- **API**: REST + GraphQL
- **ドキュメント**: OpenAPI 3.0 + GraphQL Schema

### 4.2 Frontend
- **フレームワーク**: Nuxt.js 3.17.5
- **言語**: TypeScript 5
- **UI**: Vue 3 + Composition API
- **スタイリング**: Tailwind CSS + shadcn-vue
- **状態管理**: Pinia
- **データフェッチ**: TanStack Query
- **フォーム**: VeeValidate + Zod
- **アイコン**: Lucide Vue Next

### 4.3 Infrastructure
- **コンテナ**: Docker
- **オーケストレーション**: Kubernetes (GKE/k3s)
- **CI/CD**: GitHub Actions + ArgoCD
- **IaC**: Terraform
- **モニタリング**: Prometheus + Grafana
- **ログ**: ELK Stack

## 5. 開発ガイドライン

### 5.1 コーディング規約
- **Kotlin**: 
  - Kotlin公式スタイルガイド準拠
  - 関数は30行以内を目安
  - 明確な命名規則の使用
- **TypeScript/Vue**: 
  - Vue公式スタイルガイド準拠
  - Composition APIの使用
  - Props/Emitsの型定義必須

### 5.2 テスト戦略
- **単体テスト**: 
  - ビジネスロジック: 100%カバレッジ目標
  - JUnit 5 (Backend) / Vitest (Frontend)
- **統合テスト**: 
  - モジュール間連携の検証
  - TestContainers使用
- **E2Eテスト**: 
  - 主要ユーザーシナリオの検証
  - Playwright使用

### 5.3 ドキュメント戦略
- **コード内ドキュメント**: 
  - KDoc (Kotlin) / JSDoc (TypeScript)
  - 公開APIは必須
- **API仕様**: 
  - OpenAPI自動生成
  - GraphQL Schema自動生成
- **アーキテクチャ文書**: 
  - ADR (Architecture Decision Records)
  - 設計書の継続的更新

## 6. セキュリティ考慮事項

### 6.1 認証・認可
- **Multi-Factor Authentication (2FA)**: 必須
- **Role-Based Access Control (RBAC)**: Discord風の柔軟な権限管理
- **JWT**: アクセストークン (15分) + リフレッシュトークン (7日)

### 6.2 データ保護
- **暗号化**: 
  - 保存時: AES-256
  - 通信時: TLS 1.3
- **監査ログ**: 全操作の記録
- **個人情報保護**: GDPR/個人情報保護法準拠

### 6.3 セキュリティ対策
- **OWASP Top 10対策**: 
  - SQLインジェクション防止
  - XSS対策
  - CSRF対策
- **依存関係管理**: 
  - 定期的な脆弱性スキャン
  - 自動アップデート
- **アクセス制御**: 
  - 最小権限の原則
  - IPホワイトリスト (管理画面)