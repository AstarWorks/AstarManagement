# システムアーキテクチャ

## 全体構成

```
┌─────────────────────────────────────────────────────────┐
│                     クライアント層                        │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐   │
│  │   Web App   │  │   Mobile    │  │   AI Agent   │   │
│  │  (Nuxt 3)   │  │   (Future)  │  │   (MCP/CLI)  │   │
│  └─────────────┘  └─────────────┘  └─────────────┘   │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      API Gateway                         │
│                  (Spring Cloud Gateway)                  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                    アプリケーション層                     │
│  ┌──────────────────────────────────────────────────┐  │
│  │               Spring Boot Application             │  │
│  │  ┌──────────┐  ┌──────────┐  ┌──────────┐    │  │
│  │  │   Auth    │  │   Table   │  │    Doc    │    │  │
│  │  │  Module   │  │  Module   │  │  Module   │    │  │
│  │  └──────────┘  └──────────┘  └──────────┘    │  │
│  │  ┌──────────┐  ┌──────────┐                    │  │
│  │  │    AI     │  │  Tenant   │                    │  │
│  │  │  Module   │  │  Module   │                    │  │
│  │  └──────────┘  └──────────┘                    │  │
│  └──────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────┐
│                      データ層                            │
│  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │  PostgreSQL  │  │     Redis    │  │   MinIO/S3  │  │
│  │   (JSONB)    │  │   (Cache)    │  │   (Files)   │  │
│  └──────────────┘  └──────────────┘  └────────────┘  │
└─────────────────────────────────────────────────────────┘
```

## レイヤーアーキテクチャ

### プレゼンテーション層
- **Nuxt 3**: SSR/SPA対応のVue.jsフレームワーク
- **WebSocket**: リアルタイム同期
- **PWA**: オフライン対応（将来）

### アプリケーション層
- **Spring Boot**: マイクロサービス的モジュラーモノリス
- **Spring Modulith**: モジュール間の疎結合
- **Domain-Driven Design**: ビジネスロジックの凝集

### インフラストラクチャ層
- **PostgreSQL**: メインデータストア（JSONB活用）
- **Redis**: セッション、キャッシュ、リアルタイム
- **MinIO/S3**: ファイルストレージ

## モジュール設計

### Auth Module（認証・認可）
```kotlin
com.astarworks.astarmanagement.core.auth/
├── domain/
│   ├── User
│   ├── Role
│   └── Permission
├── application/
│   ├── AuthService
│   └── RoleService
└── infrastructure/
    ├── JwtTokenProvider
    └── SecurityConfig
```

### Table Module（柔軟テーブル）
```kotlin
com.astarworks.astarmanagement.core.table/
├── domain/
│   ├── FlexibleTable
│   ├── TableSchema
│   └── TableRecord
├── application/
│   ├── TableService
│   └── QueryService
└── infrastructure/
    └── JsonbRepository
```

### Document Module（ドキュメント管理）
```kotlin
com.astarworks.astarmanagement.core.document/
├── domain/
│   ├── Document
│   ├── Folder
│   └── Variable
├── application/
│   ├── DocumentService
│   └── VersionService
└── infrastructure/
    └── MarkdownProcessor
```

### AI Module（AIエージェント）
```kotlin
com.astarworks.astarmanagement.core.ai/
├── domain/
│   ├── Agent
│   └── Conversation
├── application/
│   ├── AgentService
│   └── McpService
└── infrastructure/
    ├── OpenAIClient
    └── ClaudeClient
```

## データモデル

### マルチテナント戦略

```sql
-- Starter: Row Level Security
CREATE POLICY tenant_isolation ON all_tables
  USING (tenant_id = current_setting('app.tenant_id'));

-- Professional: Schema分離
CREATE SCHEMA tenant_xyz;
SET search_path TO tenant_xyz;

-- Enterprise: Container分離
-- 専用のPostgreSQLインスタンス
```

### 柔軟テーブル（JSONB）

```sql
CREATE TABLE flexible_tables (
  id UUID PRIMARY KEY,
  tenant_id UUID NOT NULL,
  table_name VARCHAR(255) NOT NULL,
  schema JSONB NOT NULL,  -- カラム定義
  created_at TIMESTAMP,
  UNIQUE(tenant_id, table_name)
);

CREATE TABLE table_records (
  id UUID PRIMARY KEY,
  table_id UUID REFERENCES flexible_tables(id),
  data JSONB NOT NULL,    -- 実データ
  created_at TIMESTAMP,
  updated_at TIMESTAMP
);

-- 高速検索用のGINインデックス
CREATE INDEX idx_records_data ON table_records USING GIN (data);
```

## セキュリティ

### 認証フロー
```
1. ユーザーログイン → Spring Security
2. JWT発行 → Redis保存
3. APIアクセス → JWT検証
4. テナント識別 → RLS適用
```

### 権限モデル
```yaml
Permission:
  format: "resource:action:scope"
  example: "table:write::/projects/*"

Role:
  - name: "プロジェクトマネージャー"
  - permissions: ["table:*::/projects/*", "document:*::/docs/*"]
  - color: "#FF5733"
```

## パフォーマンス最適化

### キャッシュ戦略
1. **Redis**: セッション、頻繁アクセスデータ
2. **Application Cache**: 計算結果
3. **CDN**: 静的アセット
4. **Browser Cache**: APIレスポンス

### データベース最適化
- JSONB GINインデックス
- パーティショニング（大規模テナント）
- Connection Pooling
- Read Replica（将来）

## スケーラビリティ

### 水平スケーリング
```yaml
Kubernetes Deployment:
  replicas: 3-10
  autoscaling:
    minReplicas: 3
    maxReplicas: 10
    targetCPU: 70%
```

### 垂直スケーリング
```yaml
PostgreSQL:
  Starter: 2 vCPU, 4GB RAM
  Professional: 4 vCPU, 16GB RAM  
  Enterprise: 8 vCPU, 32GB RAM
```

## 開発環境

### ローカル開発
```yaml
docker-compose:
  - postgres: 5432
  - redis: 6379
  - minio: 9000
  - backend: 8080
  - frontend: 3000
```

### CI/CD
```yaml
GitHub Actions:
  - test: 単体テスト、統合テスト
  - build: Dockerイメージ作成
  - deploy: Kubernetes適用
```

## 監視・運用

### モニタリング
- **Prometheus**: メトリクス収集
- **Grafana**: ダッシュボード
- **ELK Stack**: ログ分析
- **Sentry**: エラートラッキング

### バックアップ
- PostgreSQL: 日次フルバックアップ、継続的WAL
- ファイル: S3クロスリージョンレプリケーション
- 設定: Git管理