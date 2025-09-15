# Astar Management システムアーキテクチャ

## 1. システム概要

### 1.1 コアコンセプト
**Enterprise Obsidian + AI Native** - 汎用ビジネス管理プラットフォーム
- **汎用基盤**: 業界に依存しない4つのコア機能
- **業界テンプレート**: 特化したカスタマイズレイヤー  
- **AIエージェント**: 全機能への統一アクセス

### 1.2 4つのコア機能
1. **柔軟テーブル（Notion風）**: 動的プロパティシステム
2. **階層ドキュメント（Obsidian風）**: Markdownベース文書管理
3. **ハイブリッドマルチテナンシー**: 規模に応じた分離レベル
4. **Discord風ロール**: 動的権限管理システム

## 2. システム構成

### 2.1 全体アーキテクチャ

```
┌─────────────────────────────────────────────────────────────┐
│                    Presentation Layer                        │
│  ┌─────────────────────────────────────────────────────┐   │
│  │           Nuxt.js 3 Frontend                        │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ Foundation  │  │  Modules    │  │   Layouts   │ │   │
│  │  │ (共通基盤)   │  │(機能モジュール)│  │(レイアウト) │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
                      HTTPS (REST/GraphQL)
                               │
┌─────────────────────────────────────────────────────────────┐
│                     API Gateway                             │
│                  (Nginx / Traefik)                          │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                  Application Layer                          │
│  ┌─────────────────────────────────────────────────────┐   │
│  │          Spring Boot 3.x Backend                   │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │    Core     │  │  Flexible   │  │  Document   │ │   │
│  │  │  (システム)   │  │   Table     │  │   (文書)    │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  │  ┌─────────────┐  ┌─────────────┐  ┌─────────────┐ │   │
│  │  │ AI Agent    │  │ Template    │  │   Shared    │ │   │
│  │  │(AIエージェント)│  │(テンプレート)│  │   (共有)    │ │   │
│  │  └─────────────┘  └─────────────┘  └─────────────┘ │   │
│  └─────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────┘
                               │
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                            │
│  ┌─────────────┐  ┌─────────────┐  ┌─────────────────┐   │
│  │ PostgreSQL  │  │    Redis     │  │  Object Storage │   │
│  │    15.x     │  │  (Cache)     │  │   (MinIO/S3)    │   │
│  │- RLS分離    │  │- セッション   │  │- ファイル保存    │   │
│  │- JSONB      │  │- キャッシュ   │  │- バージョン管理  │   │
│  └─────────────┘  └─────────────┘  └─────────────────┘   │
└─────────────────────────────────────────────────────────────┘
```

### 2.2 ハイブリッドマルチテナンシー

```
┌─────────────────────────────────────────────────────────────┐
│                 Starter Plan (1,000円〜)                     │
│                 Shared DB + RLS                             │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐                │
│  │ Tenant A │  │ Tenant B │  │ Tenant C │                │
│  └──────────┘  └──────────┘  └──────────┘                │
│              Row Level Security                            │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│               Professional Plan (2,000円〜)                  │
│                 Dedicated Schema                            │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │   public     │  │ tenant_abc123 │                       │
│  │  (共有)       │  │   (専用)      │                       │
│  └──────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘

┌─────────────────────────────────────────────────────────────┐
│                Enterprise Plan (5,000円〜)                   │
│                Dedicated Container                          │
│  ┌──────────────┐  ┌──────────────┐                       │
│  │  Tenant A    │  │  Tenant B    │                       │
│  │  Container   │  │  Container   │                       │
│  │ - App Pod    │  │ - App Pod    │                       │
│  │ - DB Pod     │  │ - DB Pod     │                       │
│  └──────────────┘  └──────────────┘                       │
└─────────────────────────────────────────────────────────────┘
```

## 3. 技術スタック

### 3.1 Frontend Stack
```yaml
Framework: Nuxt 3.x
Language: TypeScript 5.x
UI Library: shadcn-vue (Radix Vue)
Styling: Tailwind CSS 3.x
State Management: Pinia
Data Fetching: Nuxt $fetch + async/await
Testing: Vitest + Playwright
Build Tool: Vite
```

### 3.2 Backend Stack
```yaml
Framework: Spring Boot 3.x
Language: Kotlin 1.9.x
Architecture: Modular Monolith (Spring Modulith)
Security: Spring Security + JWT
Data Access: Spring Data JPA + Hibernate
Database: PostgreSQL 15+
Cache: Redis 7+
Message Queue: Redis Streams
API: REST + GraphQL
Documentation: OpenAPI 3.0
```

### 3.3 Infrastructure Stack
```yaml
Containerization: Docker + Docker Compose
Orchestration: Kubernetes
Service Mesh: Istio (optional)
API Gateway: Nginx / Traefik
Monitoring: Prometheus + Grafana
Logging: ELK Stack
CI/CD: GitHub Actions + ArgoCD
IaC: Terraform
```

## 4. アーキテクチャ原則

### 4.1 レイヤード設計
```
┌─────────────────────────────────────┐
│        Presentation Layer           │ ← UI/UX、ユーザーインタラクション
├─────────────────────────────────────┤
│        Application Layer            │ ← ビジネスユースケース、ワークフロー
├─────────────────────────────────────┤
│          Domain Layer               │ ← ビジネスロジック、ドメインモデル
├─────────────────────────────────────┤
│       Infrastructure Layer          │ ← データ永続化、外部サービス
└─────────────────────────────────────┘
```

### 4.2 設計原則
1. **Simple over Easy**: 明確で理解しやすい実装を優先
2. **Generic over Specific**: 汎用性を重視、特化要素はテンプレートで
3. **Type Safety**: TypeScript/Kotlin による完全な型安全性
4. **Event-Driven**: モジュール間はイベントで疎結合
5. **API First**: フロントエンド・バックエンド完全分離

## 5. データアーキテクチャ

### 5.1 データモデル分類

```yaml
システムデータ (固定スキーマ):
  - tenants: テナント管理
  - users: ユーザー管理  
  - roles: ロール管理
  - workspaces: ワークスペース
  - audit_logs: 監査ログ

アプリケーションデータ (柔軟スキーマ):
  - databases: テーブル定義 (Notion風)
  - records: レコードデータ (JSONB)
  - documents: ドキュメント (Obsidian風)
  - folders: フォルダ階層
```

### 5.2 柔軟テーブルシステム

```sql
-- データベース定義
CREATE TABLE databases (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    properties JSONB NOT NULL DEFAULT '{}', -- 動的プロパティ定義
    settings JSONB DEFAULT '{}'
);

-- レコードデータ
CREATE TABLE records (
    id UUID PRIMARY KEY,
    database_id UUID NOT NULL,
    data JSONB NOT NULL DEFAULT '{}', -- 実際のデータ
    created_at TIMESTAMP DEFAULT NOW()
);
```

### 5.3 階層ドキュメントシステム

```sql
-- フォルダ階層
CREATE TABLE folders (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    parent_id UUID REFERENCES folders(id),
    name VARCHAR(255) NOT NULL,
    path TEXT NOT NULL -- /root/folder1/subfolder
);

-- ドキュメント
CREATE TABLE documents (
    id UUID PRIMARY KEY,
    workspace_id UUID NOT NULL,
    folder_id UUID REFERENCES folders(id),
    title VARCHAR(500) NOT NULL,
    content TEXT, -- Markdown
    variables JSONB DEFAULT '{}' -- テンプレート変数
);
```

## 6. API設計

### 6.1 REST API構造
```
/api/v1/
├── auth/              # 認証・認可
├── workspaces/        # ワークスペース管理
├── databases/         # データベース管理
│   └── {id}/records   # レコード管理
├── documents/         # ドキュメント管理
├── folders/           # フォルダ管理
├── users/             # ユーザー管理
└── roles/             # ロール管理
```

### 6.2 API設計原則
```yaml
原則:
  - RESTful: リソース指向URL設計
  - 一貫性: 統一されたレスポンス形式
  - バージョニング: URLパスでのバージョン管理
  - ページネーション: 大量データの効率的な取得
  - エラーハンドリング: 詳細なエラー情報の提供

レスポンス形式:
  成功: { data: T, meta: {...} }
  エラー: { error: { code, message, details } }
```

## 7. セキュリティアーキテクチャ

### 7.1 認証・認可フロー
```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   Frontend  │    │   Backend   │    │  Database   │
└─────────────┘    └─────────────┘    └─────────────┘
       │                   │                   │
       │ 1. Login Request  │                   │
       ├──────────────────►│                   │
       │                   │ 2. Validate User │
       │                   ├──────────────────►│
       │                   │ 3. User Data     │
       │                   │◄──────────────────┤
       │ 4. JWT + Refresh  │                   │
       │◄──────────────────┤                   │
       │                   │                   │
       │ 5. API Request    │                   │
       ├──────────────────►│ 6. Verify JWT &  │
       │                   │   Set Tenant      │
       │                   ├──────────────────►│
       │ 7. Response       │ 8. RLS Query      │
       │◄──────────────────┤◄──────────────────┤
```

### 7.2 多層防御
```yaml
レイヤー:
  1. Network: WAF + DDoS対策
  2. Application: JWT認証 + RBAC
  3. Database: RLS + 暗号化
  4. Infrastructure: セキュリティグループ
  5. Monitoring: 異常検知 + アラート
```

## 8. パフォーマンス設計

### 8.1 パフォーマンス目標
```yaml
Response Time (p95):
  - API: < 200ms
  - Page Load: < 2秒
  - Search: < 1秒
  - Large Query: < 5秒

Throughput:
  - 1000 concurrent users/tenant
  - 10000 API requests/minute
  - 100万 records/database

Availability:
  - 99.9% uptime
  - < 4時間 planned maintenance/month
```

### 8.2 スケーリング戦略
```yaml
Horizontal Scaling:
  - アプリケーション: Kubernetes Auto Scaling
  - データベース: Read Replicas
  - キャッシュ: Redis Cluster

Vertical Scaling:
  - CPU/Memory: Pod リソース調整
  - Storage: 動的ボリューム拡張

Caching Strategy:
  - L1: Browser Cache
  - L2: CDN Cache  
  - L3: Redis Cache
  - L4: Database Query Cache
```

## 9. 運用・監視

### 9.1 監視項目
```yaml
Infrastructure:
  - CPU/Memory/Disk使用率
  - Network I/O
  - Container健康状態

Application:
  - API レスポンスタイム
  - エラー率
  - ビジネスメトリクス

Security:
  - 認証失敗
  - 不正アクセス試行
  - 権限昇格試行
```

### 9.2 ログ管理
```yaml
Log Types:
  - Access Log: 全APIアクセス
  - Audit Log: データ変更履歴
  - Error Log: エラー情報
  - Security Log: セキュリティイベント

Storage:
  - ELK Stack: 検索・分析
  - Object Storage: 長期保存
  - 暗号化: 保存時・転送時
```

## 10. 災害復旧・事業継続

### 10.1 バックアップ戦略
```yaml
Database:
  - Full Backup: 日次
  - Incremental: 1時間毎  
  - Point-in-Time Recovery: 可能
  - Geo Replication: 他リージョン

Files:
  - Object Storage: 3拠点レプリケーション
  - Version Control: 30日間
  - Encryption: AES-256

RPO/RTO:
  - RPO: 1時間 (データ損失許容)
  - RTO: 4時間 (復旧時間目標)
```

### 10.2 事業継続計画
```yaml
Scenario Planning:
  - 単一障害: Auto Failover
  - リージョン障害: Manual Failover  
  - 大規模災害: DR Site切り替え

Communication:
  - Status Page: リアルタイム状況
  - Email/SMS: 重要アラート
  - Slack: 内部コミュニケーション
```

## まとめ

このシステムアーキテクチャにより：
1. **汎用性**: あらゆる業界・規模に対応
2. **柔軟性**: Notion + Obsidian風の自由なデータ管理
3. **スケーラビリティ**: ハイブリッドマルチテナンシー
4. **セキュリティ**: エンタープライズレベルの保護
5. **運用性**: 包括的な監視・復旧体制

これにより「Enterprise Obsidian + AI Native」の vision を実現し、小中規模企業のDX実現をサポートします。