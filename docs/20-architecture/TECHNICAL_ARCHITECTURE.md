# 技術アーキテクチャ設計書

## 1. アーキテクチャ概要

### 1.1 システム構成
```
┌─────────────────────────────────────────────────────────────┐
│                      クライアント層                           │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Web Application (Nuxt.js 3.x)                      │   │
│  │   - Vue 3 + TypeScript                               │   │
│  │   - Pinia (State Management)                         │   │
│  │   - TailwindCSS + shadcn-vue                        │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
                        HTTPS (REST API)
                                │
┌─────────────────────────────────────────────────────────────┐
│                       API Gateway                            │
│                    (Nginx / Traefik)                         │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                    アプリケーション層                         │
│  ┌─────────────────────────────────────────────────────┐   │
│  │   Backend API (Spring Boot 3.x + Kotlin)            │   │
│  │   - Spring Security (JWT認証)                        │   │
│  │   - Spring Data JPA                                 │   │
│  │   - Spring Validation                               │   │
│  │   - Kotlinx Serialization                           │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                                │
┌─────────────────────────────────────────────────────────────┐
│                        データ層                              │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ PostgreSQL  │  │    Redis     │  │  MinIO/S3       │   │
│  │    15.x     │  │  (Cache)     │  │ (File Storage)  │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 1.2 アーキテクチャ原則

1. **レイヤードアーキテクチャ**
   - プレゼンテーション層、ビジネスロジック層、データアクセス層の明確な分離
   - 各層は下位層にのみ依存

2. **マイクロサービス準備**
   - モジュラーモノリスとして開始
   - 将来的なマイクロサービス化を考慮した設計

3. **コンテナファースト**
   - すべてのコンポーネントをコンテナ化
   - Kubernetes対応のマニフェスト管理

4. **API駆動開発**
   - フロントエンドとバックエンドの完全な分離
   - OpenAPI仕様に基づくAPI設計

## 2. フロントエンドアーキテクチャ

### 2.1 技術スタック詳細

#### コア技術
- **Nuxt.js 3.x**: SSR/SSG対応のVueフレームワーク
- **Vue 3**: Composition APIを使用
- **TypeScript 5.x**: 型安全性の確保
- **Vite**: 高速な開発環境

#### 状態管理
- **Pinia**: Vue 3公式の状態管理ライブラリ
- **VueUse**: Composition API用のユーティリティ集

#### UI/UX
- **TailwindCSS 3.x**: ユーティリティファーストCSS
- **shadcn-vue**: RadixUIベースのコンポーネントライブラリ
- **Lucide Icons**: アイコンライブラリ

#### 開発ツール
- **ESLint + Prettier**: コード品質管理
- **Vitest**: ユニットテスト
- **Playwright**: E2Eテスト
- **Storybook**: コンポーネント開発

### 2.2 ディレクトリ構造
```
frontend/
├── .nuxt/                    # Nuxt.js生成ファイル
├── assets/                   # 静的アセット
│   └── css/                 
├── components/              # Vueコンポーネント
│   ├── common/             # 共通コンポーネント
│   ├── case/              # 事件管理関連
│   ├── billing/           # 報酬管理関連
│   └── ui/                # UIコンポーネント
├── composables/            # Composition API関数
├── layouts/               # レイアウトコンポーネント
├── middleware/            # ルートミドルウェア
├── pages/                 # ページコンポーネント
│   ├── cases/            # 事件管理ページ
│   ├── billing/          # 報酬管理ページ
│   └── settings/         # 設定ページ
├── plugins/              # Nuxtプラグイン
├── public/               # 静的ファイル
├── server/               # サーバーサイド処理
├── stores/               # Pinia stores
│   ├── auth.ts          # 認証ストア
│   ├── case.ts          # 事件管理ストア
│   └── billing.ts       # 報酬管理ストア
├── types/                # TypeScript型定義
├── utils/                # ユーティリティ関数
└── nuxt.config.ts        # Nuxt設定
```

### 2.3 状態管理設計

#### Piniaストア構成
```typescript
// stores/case.ts
export const useCaseStore = defineStore('case', () => {
  // State
  const cases = ref<Case[]>([])
  const currentCase = ref<Case | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const activeCases = computed(() => 
    cases.value.filter(c => c.status === 'active')
  )

  // Actions
  const fetchCases = async () => {
    loading.value = true
    try {
      const data = await $fetch('/api/cases')
      cases.value = data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }

  return {
    cases: readonly(cases),
    currentCase: readonly(currentCase),
    loading: readonly(loading),
    error: readonly(error),
    activeCases,
    fetchCases
  }
})
```

## 3. バックエンドアーキテクチャ

### 3.1 技術スタック詳細

#### コア技術
- **Kotlin 1.9.x**: 言語
- **Spring Boot 3.x**: フレームワーク
- **Spring Security**: 認証・認可
- **Spring Data JPA**: ORM

#### データ処理
- **Kotlinx Serialization**: JSON処理
- **Jackson**: 補助的なJSON処理
- **Hibernate Validator**: バリデーション

#### 開発ツール
- **Gradle 8.x**: ビルドツール
- **Detekt**: 静的解析
- **JUnit 5 + MockK**: テスティング

### 3.2 パッケージ構造
```
backend/
├── src/main/kotlin/com/Astar/
│   ├── AstarApplication.kt      # メインクラス
│   ├── config/                  # 設定クラス
│   │   ├── SecurityConfig.kt
│   │   ├── JpaConfig.kt
│   │   └── WebConfig.kt
│   ├── domain/                  # ドメインモデル
│   │   ├── case/               # 事件管理
│   │   │   ├── Case.kt
│   │   │   ├── CaseStatus.kt
│   │   │   └── CaseRepository.kt
│   │   ├── billing/            # 報酬管理
│   │   │   ├── Invoice.kt
│   │   │   ├── Payment.kt
│   │   │   └── BillingRepository.kt
│   │   └── user/               # ユーザー管理
│   ├── application/            # アプリケーションサービス
│   │   ├── case/
│   │   │   ├── CaseService.kt
│   │   │   └── CaseDto.kt
│   │   └── billing/
│   ├── infrastructure/         # インフラ層
│   │   ├── persistence/        # DB実装
│   │   └── external/           # 外部連携
│   ├── presentation/           # プレゼンテーション層
│   │   ├── rest/              # REST API
│   │   │   ├── CaseController.kt
│   │   │   └── BillingController.kt
│   │   └── dto/               # リクエスト/レスポンスDTO
│   └── security/              # セキュリティ
│       ├── JwtTokenProvider.kt
│       └── UserDetailsServiceImpl.kt
└── src/test/                  # テストコード
```

### 3.3 レイヤー設計

#### Domain層
- エンティティとビジネスルールを定義
- フレームワーク非依存
- リポジトリインターフェースを定義

#### Application層
- ユースケースの実装
- トランザクション境界の管理
- DTOの定義と変換

#### Infrastructure層
- リポジトリの実装
- 外部サービスとの連携
- 技術的な詳細の実装

#### Presentation層
- REST APIエンドポイント
- リクエスト/レスポンスの処理
- 認証・認可の適用

## 4. データベース設計

### 4.1 基本方針
- PostgreSQL 15.xを使用
- マルチテナンシー対応（スキーマ分離方式）
- 監査ログの自動記録
- ソフトデリートの実装

### 4.2 命名規則
- テーブル名: 複数形のsnake_case（例: cases, invoices）
- カラム名: snake_case
- 主キー: id (UUID)
- 外部キー: テーブル名_id
- タイムスタンプ: created_at, updated_at, deleted_at

### 4.3 共通カラム
```sql
-- すべてのテーブルに含まれる共通カラム
id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
created_by UUID NOT NULL,
updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
updated_by UUID NOT NULL,
deleted_at TIMESTAMP,
deleted_by UUID,
version INTEGER NOT NULL DEFAULT 0  -- 楽観的ロック用
```

## 5. API設計

### 5.1 設計原則
- RESTful APIの原則に従う
- リソース指向のURL設計
- 適切なHTTPメソッドの使用
- ステータスコードの正しい使用

### 5.2 URL構造
```
/api/v1/cases           # 事件一覧・作成
/api/v1/cases/{id}      # 事件詳細・更新・削除
/api/v1/cases/{id}/documents  # 事件に紐づく書類
/api/v1/invoices        # 請求書一覧・作成
/api/v1/invoices/{id}   # 請求書詳細・更新・削除
/api/v1/users           # ユーザー管理
/api/v1/auth/login      # ログイン
/api/v1/auth/refresh    # トークンリフレッシュ
```

### 5.3 レスポンス形式
```json
{
  "data": {
    // レスポンスデータ
  },
  "meta": {
    "timestamp": "2024-01-01T00:00:00Z",
    "version": "1.0.0"
  },
  "pagination": {
    "page": 1,
    "perPage": 20,
    "total": 100,
    "totalPages": 5
  }
}
```

### 5.4 エラーレスポンス
```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "入力値が不正です",
    "details": [
      {
        "field": "title",
        "message": "タイトルは必須です"
      }
    ],
    "timestamp": "2024-01-01T00:00:00Z"
  }
}
```

## 6. セキュリティアーキテクチャ

### 6.1 認証・認可
- JWT (JSON Web Token) ベースの認証
- アクセストークン（15分）とリフレッシュトークン（7日）
- Role-Based Access Control (RBAC)
- リソースレベルの権限制御

### 6.2 セキュリティ対策
- HTTPS必須
- CORS設定
- Rate Limiting
- SQLインジェクション対策（PreparedStatement）
- XSS対策（入力値検証・サニタイジング）
- CSRF対策（SameSite Cookie）

### 6.3 データ保護
- パスワードのbcryptハッシュ化
- 機密データの暗号化（AES-256）
- 監査ログの記録
- バックアップの暗号化

## 7. インフラストラクチャ

### 7.1 コンテナ構成
```yaml
# docker-compose.yml
version: '3.8'
services:
  frontend:
    build: ./frontend
    ports:
      - "3000:3000"
    environment:
      - API_URL=http://backend:8080
  
  backend:
    build: ./backend
    ports:
      - "8080:8080"
    environment:
      - DB_HOST=postgres
      - REDIS_HOST=redis
    depends_on:
      - postgres
      - redis
  
  postgres:
    image: postgres:15-alpine
    environment:
      - POSTGRES_DB=Astar
      - POSTGRES_USER=Astar
      - POSTGRES_PASSWORD=password
    volumes:
      - postgres_data:/var/lib/postgresql/data
  
  redis:
    image: redis:7-alpine
    volumes:
      - redis_data:/data
  
  minio:
    image: minio/minio:latest
    command: server /data
    environment:
      - MINIO_ROOT_USER=admin
      - MINIO_ROOT_PASSWORD=password
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 7.2 Kubernetes対応
- Helmチャートの提供
- ConfigMapとSecretの分離
- ヘルスチェックの実装
- オートスケーリング対応

## 8. 監視・ロギング

### 8.1 ロギング
- 構造化ログ（JSON形式）
- ログレベルの適切な使用
- トレースIDによる追跡
- 集約ログの実装（ELKスタック対応）

### 8.2 メトリクス
- Prometheusメトリクスの公開
- ビジネスメトリクスの定義
- SLI/SLOの設定

### 8.3 ヘルスチェック
- /health/liveness: 生存確認
- /health/readiness: 準備状態確認
- 依存サービスのチェック

## 9. 開発環境

### 9.1 必要なツール
- Node.js 20.x LTS
- JDK 17 or 21
- Docker & Docker Compose
- Git

### 9.2 開発フロー
1. フィーチャーブランチでの開発
2. プルリクエストによるコードレビュー
3. 自動テストの実行
4. ステージング環境でのテスト
5. 本番環境へのデプロイ

## 10. パフォーマンス考慮事項

### 10.1 フロントエンド
- コード分割と遅延ロード
- 画像の最適化（WebP対応）
- CDNの活用
- Service Workerによるキャッシング

### 10.2 バックエンド
- データベースインデックスの最適化
- N+1問題の回避
- キャッシュ戦略（Redis活用）
- 非同期処理の活用

### 10.3 目標値
- API応答時間: p95 < 200ms
- ページ読み込み時間: < 2秒
- 同時接続数: 1000ユーザー
- 可用性: 99.9%