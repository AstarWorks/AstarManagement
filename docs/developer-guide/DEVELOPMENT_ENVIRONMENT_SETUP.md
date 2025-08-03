# 開発環境セットアップガイド

## 概要

Astar Management の開発環境は、Docker Compose + Dev Containers を使用してチーム全体で統一された環境を提供します。段階的にサービスを起動し、スタートアップの仮説検証段階に適した軽量構成から始めます。

## 前提条件

- **対象者**: 中級〜上級開発者
- **重視事項**: チーム間の開発環境統一性
- **アーキテクチャ**: クリーンアーキテクチャ + 部分的TDD

## Phase 1: 基本ツールインストール

### 1.1 必須ツール

```bash
# Node.js (v20.x LTS推奨)
# Bunパッケージマネージャー
curl -fsSL https://bun.sh/install | bash

# Docker & Docker Compose
# 各OS公式インストーラーを使用

# Git (最新版)
# VSCode (推奨IDE)
```

### 1.2 VSCode拡張機能（必須）

```json
{
  "recommendations": [
    // Dev Containers
    "ms-vscode-remote.remote-containers",
    
    // TypeScript/Vue
    "Vue.volar",
    "Vue.vscode-typescript-vue-plugin",
    "bradlc.vscode-tailwindcss",
    
    // Kotlin/Spring
    "fwcd.kotlin",
    "vmware.vscode-spring-boot",
    
    // コード品質
    "esbenp.prettier-vscode",
    "dbaeumer.vscode-eslint",
    "ms-vscode.vscode-typescript-next",
    
    // Git
    "eamodio.gitlens",
    
    // その他
    "ms-vscode.vscode-json",
    "redhat.vscode-yaml",
    "ms-kubernetes-tools.vscode-kubernetes-tools"
  ]
}
```

## Phase 2: プロジェクトセットアップ

### 2.1 リポジトリクローン・設定

```bash
# リポジトリクローン
git clone https://github.com/your-org/Astar-management.git
cd Astar-management

# 環境設定ファイル作成
cp .env.example .env.local
cp backend/.env.example backend/.env.local
cp frontend/.env.example frontend/.env.local

# Git hooks設定
bun install -g lefthook
lefthook install
```

### 2.2 Dev Container起動

```bash
# VSCodeでプロジェクトを開く
code .

# Command Palette (Cmd/Ctrl + Shift + P)
# "Dev Containers: Reopen in Container" を実行
```

### 2.3 依存関係インストール

```bash
# Dev Container内で実行

# フロントエンド依存関係
cd frontend
bun install

# バックエンド依存関係
cd ../backend
./gradlew build

# 開発用証明書生成
mkcert -install
mkcert localhost 127.0.0.1 ::1
```

## Phase 3: 段階的サービス起動

### 3.1 Stage 1: 基本サービス（MVP開発）

```bash
# 基本構成のみ起動
docker-compose -f docker-compose.stage1.yml up -d

# 起動されるサービス:
# - PostgreSQL (メインDB)
# - Redis (セッション・キャッシュ)
# - MinIO (ファイルストレージ)
```

```yaml
# docker-compose.stage1.yml
version: '3.8'
services:
  postgres:
    image: postgres:15-alpine
    environment:
      POSTGRES_DB: Astar_management
      POSTGRES_USER: postgres
      POSTGRES_PASSWORD: postgres
    ports:
      - "5432:5432"
    volumes:
      - postgres_data:/var/lib/postgresql/data
      - ./database/init:/docker-entrypoint-initdb.d
    
  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    volumes:
      - redis_data:/data
    
  minio:
    image: minio/minio:latest
    command: server /data --console-address ":9001"
    environment:
      MINIO_ROOT_USER: minioadmin
      MINIO_ROOT_PASSWORD: minioadmin123
    ports:
      - "9000:9000"
      - "9001:9001"
    volumes:
      - minio_data:/data

volumes:
  postgres_data:
  redis_data:
  minio_data:
```

### 3.2 Stage 2: 検索・AI機能（機能拡張時）

```bash
# 検索・AI機能追加時に起動
docker-compose -f docker-compose.stage2.yml up -d

# 追加されるサービス:
# - Elasticsearch (全文検索)
# - Kibana (検索結果確認)
```

### 3.3 Stage 3: 監視・ログ（本格運用時）

```bash
# 監視・ログ機能追加時に起動
docker-compose -f docker-compose.stage3.yml up -d

# 追加されるサービス:
# - Prometheus (メトリクス)
# - Grafana (可視化)
# - Jaeger (分散トレーシング)
```

## Phase 4: アプリケーション起動

### 4.1 データベース初期化

```bash
# Flyway migration実行
cd backend
./gradlew flywayMigrate

# 開発用データ投入
./gradlew bootRun --args='--spring.profiles.active=dev --data.initialize=true'
```

### 4.2 バックエンド起動（クリーンアーキテクチャ）

```bash
# バックエンド開発サーバー起動
cd backend
./gradlew bootRun --args='--spring.profiles.active=dev'

# 起動確認
curl http://localhost:8080/actuator/health
curl http://localhost:8080/api/docs  # Swagger UI
```

#### バックエンドアーキテクチャ構成

```
backend/src/main/kotlin/dev/ryuzu/Astarmanagement/
├── domain/              # ドメイン層
│   ├── model/          # エンティティ・値オブジェクト
│   ├── repository/     # リポジトリインターface
│   └── service/        # ドメインサービス
├── application/         # アプリケーション層
│   ├── usecase/        # ユースケース
│   ├── dto/            # データ転送オブジェクト
│   └── port/           # ポートインターface
├── infrastructure/     # インフラ層
│   ├── repository/     # リポジトリ実装
│   ├── external/       # 外部API連携
│   └── config/         # 設定
└── presentation/       # プレゼンテーション層
    ├── controller/     # REST API
    ├── dto/            # リクエスト・レスポンス
    └── exception/      # 例外ハンドリング
```

### 4.3 フロントエンド起動

```bash
# フロントエンド開発サーバー起動
cd frontend
bun run dev

# Storybook起動（コンポーネント開発）
bun run storybook

# 起動確認
open http://localhost:3000      # アプリケーション
open http://localhost:6006      # Storybook
```

#### フロントエンドアーキテクチャ構成

```
frontend/src/
├── components/         # UIコンポーネント
│   ├── atomic/        # Atomic Design
│   ├── molecules/     
│   ├── organisms/     
│   └── templates/     
├── composables/       # ドメインロジック (Clean Architecture)
│   ├── useCase/       # ビジネスロジック
│   ├── useAuth/       # 認証ロジック
│   └── useApi/        # API連携
├── pages/             # ページコンポーネント
├── stores/            # Pinia状態管理
├── utils/             # ユーティリティ
├── types/             # TypeScript型定義
└── assets/            # 静的ファイル
```

## 開発ワークフロー

### TDD開発プロセス

```bash
# 1. テスト作成（Red）
# フロントエンド
bun run test:unit src/composables/__tests__/useCase.test.ts

# バックエンド
./gradlew test --tests UseCase*Test

# 2. 最小実装（Green）
# 機能実装

# 3. リファクタリング（Refactor）
# コードクリーンアップ

# 4. コミット
git add .
git commit -m "feat(use-case): implement user authentication use case

- Add user login validation
- Add password encryption
- Add session management

Test: All authentication tests pass"
```

### コード品質チェック

```bash
# フロントエンド品質チェック
bun run lint          # ESLint
bun run typecheck     # TypeScript
bun run test:unit     # Vitest
bun run test:e2e      # Playwright

# バックエンド品質チェック
./gradlew ktlintCheck  # Kotlinコードスタイル
./gradlew detekt      # 静的解析
./gradlew test        # ユニットテスト
./gradlew integrationTest  # 統合テスト
```

### Git ワークフロー

```bash
# ブランチ作成
git checkout -b feature/user-authentication

# 開発・テスト
# ... TDD サイクル

# プッシュ前チェック（lefthook自動実行）
git push origin feature/user-authentication

# プルリクエスト作成
gh pr create --title "feat: implement user authentication" \
  --body "## Summary
- Implement user login/logout
- Add JWT token management
- Add password validation

## Test plan
- [x] Unit tests pass
- [x] Integration tests pass
- [x] E2E tests pass"
```

## 環境変数設定

### フロントエンド (.env.local)

```bash
# API設定
NUXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NUXT_PUBLIC_WS_URL=ws://localhost:8080/ws

# 外部サービス
NUXT_PUBLIC_GOOGLE_CALENDAR_CLIENT_ID=your-google-client-id
NUXT_PUBLIC_MICROSOFT_GRAPH_CLIENT_ID=your-microsoft-client-id

# 開発設定
NUXT_DEVTOOLS=true
NUXT_PUBLIC_APP_ENV=development
```

### バックエンド (.env.local)

```bash
# データベース
SPRING_DATASOURCE_URL=jdbc:postgresql://localhost:5432/Astar_management
SPRING_DATASOURCE_USERNAME=postgres
SPRING_DATASOURCE_PASSWORD=postgres

# Redis
SPRING_REDIS_HOST=localhost
SPRING_REDIS_PORT=6379

# MinIO
MINIO_ENDPOINT=http://localhost:9000
MINIO_ACCESS_KEY=minioadmin
MINIO_SECRET_KEY=minioadmin123

# JWT
JWT_SECRET=your-jwt-secret-key-here
JWT_EXPIRATION=900  # 15 minutes

# AI/外部API
GOOGLE_VERTEX_AI_PROJECT_ID=your-project-id
GOOGLE_APPLICATION_CREDENTIALS=/path/to/service-account.json

# 開発設定
SPRING_PROFILES_ACTIVE=dev
LOGGING_LEVEL_ROOT=INFO
LOGGING_LEVEL_DEV_RYUZU=DEBUG
```

## トラブルシューティング

### よくある問題と解決法

#### 1. Dev Container起動失敗

```bash
# Docker Desktop起動確認
docker version

# キャッシュクリア
docker system prune -a

# Dev Container再ビルド
# Command Palette > "Dev Containers: Rebuild Container"
```

#### 2. フロントエンド起動失敗

```bash
# Node.js バージョン確認（v20.x必須）
node --version

# 依存関係再インストール
rm -rf node_modules .nuxt
bun install

# ポート競合確認
lsof -i :3000
```

#### 3. バックエンド起動失敗

```bash
# Java バージョン確認（21必須）
java --version

# Gradle キャッシュクリア
./gradlew clean build

# データベース接続確認
docker-compose logs postgres
```

#### 4. データベース接続エラー

```bash
# PostgreSQL起動確認
docker-compose ps postgres

# 接続テスト
psql -h localhost -U postgres -d Astar_management

# マイグレーション状態確認
./gradlew flywayInfo
```

## チーム開発ガイドライン

### 1. コミット規約

```bash
# Conventional Commits準拠
feat(scope): add new feature
fix(scope): fix bug
docs(scope): update documentation
style(scope): format code
refactor(scope): refactor code
test(scope): add tests
chore(scope): update dependencies
```

### 2. プルリクエスト規約

- **必須レビュアー**: 最低1名の承認
- **自動チェック**: 全テスト通過必須
- **マージ方法**: Squash and merge

### 3. ブランチ戦略

```
main              # 本番用
├── develop       # 開発統合
├── feature/*     # 機能開発
├── hotfix/*      # 緊急修正
└── release/*     # リリース準備
```

## Next Steps

開発環境構築完了後：

1. **サンプルコード確認**: `/examples` ディレクトリの参考実装
2. **API仕様確認**: `http://localhost:8080/api/docs` でSwagger UI
3. **Storybook確認**: `http://localhost:6006` でコンポーネント一覧
4. **テスト実行**: 全テストスイートの動作確認

---

**重要**: このガイド後は、全開発者が同一の環境で作業できることを確認してください。環境差異はバグの温床となります。