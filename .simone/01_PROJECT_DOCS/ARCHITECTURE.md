# Architecture Document - Astar Management

## System Overview

Astar Managementは、汎用ビジネス管理プラットフォームとして設計された、業界特化テンプレート対応のSaaSアプリケーションです。

### Core Concept
- **プラットフォーム思想**: AI-Agent + Notion + Obsidian の融合
- **アーキテクチャ**: 汎用基盤SaaS + 業界特化テンプレート
- **ターゲット**: 小中規模企業（1-100名）のDX実現

## Technical Stack

### Backend
- **Framework**: Spring Boot 3.4.2
- **Language**: Kotlin 2.2.0
- **Database**: PostgreSQL with Multi-tenant RLS
- **Authentication**: Auth0 (移行中)
- **API Style**: RESTful API
- **Build Tool**: Gradle

### Frontend
- **Framework**: Nuxt.js 3
- **UI Library**: Vue 3 + TailwindCSS
- **Component Library**: shadcn-vue
- **Table Management**: TanStack Table v8
- **State Management**: Pinia
- **Authentication**: Sidebase Auth + Auth0
- **Build Tool**: Bun

### Infrastructure
- **Object Storage**: S3互換 (添付ファイル用)
- **Container**: Docker
- **CI/CD**: GitHub Actions (予定)

## Architecture Patterns

### Backend Architecture
```
backend/
├── modules/           # ドメイン駆動設計によるモジュール
│   ├── auth/         # 認証・認可
│   ├── financial/    # 経費管理
│   └── shared/       # 共通基盤
├── domain/           # ドメインエンティティ
├── application/      # ビジネスロジック
├── infrastructure/   # 技術的実装
└── presentation/     # API層
```

### Frontend Architecture
```
frontend/
├── app/
│   ├── foundation/   # 基盤層（旧infrastructure）
│   ├── modules/      # 機能モジュール
│   ├── composables/  # Vue Composables
│   └── utils/        # ユーティリティ
├── i18n/            # 国際化リソース
└── components/       # UIコンポーネント
```

## Core Features (4つのコア機能)

### 1. Project Management (プロジェクト管理)
- カンバン/テーブル形式での案件管理
- 進捗追跡とステータス管理
- タスク管理と期限管理

### 2. Expense Management (経費管理)
- 実費・経費の記録と追跡
- タグ管理とカテゴリ分類
- ファイル添付機能
- CSVインポート/エクスポート

### 3. Customer Management (顧客管理)
- 顧客情報の一元管理
- リレーション管理
- コミュニケーション履歴

### 4. Document Management (文書管理)
- 階層型Markdownドキュメント
- 変数システムによる動的コンテンツ
- バージョン管理
- テンプレート機能

## Data Architecture

### Multi-tenancy Strategy
- **Row Level Security (RLS)**: PostgreSQLのRLSによるテナント分離
- **Tenant Context**: セッション変数によるコンテキスト管理
- **Data Isolation**: 完全なデータ分離を保証

### Flexible Schema Design
- **JSONB Storage**: 柔軟なスキーマ対応
- **Template System**: 業界別テンプレートによるカスタマイズ
- **EAV Pattern**: プロパティの動的追加・変更

### Storage Strategy
- **PostgreSQL**: メタデータ、構造化データ、Markdownコンテンツ
- **Object Storage**: 添付ファイル、画像、大容量ファイル

## Security Architecture

### Authentication & Authorization
- **Authentication**: Auth0による認証委譲
- **JWT Validation**: Spring SecurityでのJWT検証
- **Dynamic Roles**: Discord風の動的ロールシステム
- **Resource-based Permissions**: リソースベースの権限管理

### Security Measures
- **HTTPS/TLS**: 全通信の暗号化
- **CORS**: 適切なCORS設定
- **Input Validation**: 入力値検証
- **SQL Injection Prevention**: パラメータ化クエリ
- **XSS Prevention**: コンテンツサニタイゼーション

## Integration Points

### Auth0 Integration
- Post-Login Actions for tenant resolution
- Custom Claims for role management
- JIT provisioning for new users

### API Integration
- RESTful API endpoints
- JWT Bearer token authentication
- CORS enabled for SPA

### Variable System
- Dynamic content rendering
- Real-time data synchronization
- Template variable expansion

## Development Guidelines

### Code Organization
- **Clean Architecture**: 層の責任分離
- **Domain Driven Design**: ドメインモデル中心
- **SOLID Principles**: 設計原則の遵守

### Testing Strategy
- **Unit Tests**: ビジネスロジックのテスト
- **Integration Tests**: API統合テスト
- **E2E Tests**: ユーザーシナリオテスト

### Documentation
- **API Documentation**: OpenAPI/Swagger
- **Code Comments**: 重要なロジックの説明
- **Architecture Decision Records**: 設計決定の記録

## Deployment Architecture

### Environment Strategy
- **Development**: ローカル開発環境
- **Staging**: 本番同等の検証環境
- **Production**: 本番環境

### Scaling Strategy
- **Horizontal Scaling**: アプリケーション層
- **Database Pooling**: コネクション管理
- **Cache Layer**: Redis (将来実装)

## Future Considerations

### Planned Features
- AI Agent Integration
- Real-time Collaboration
- Advanced Analytics
- Mobile Applications

### Technical Debt
- Legacy authentication code removal
- Performance optimization
- Test coverage improvement

## References

- [Platform Vision](../../docs/00-overview/PLATFORM_VISION.md)
- [System Architecture](../../docs/20-architecture/SYSTEM_ARCHITECTURE.md)
- [Auth0 Integration](../../docs/40-specs/02-auth-security/auth0-integration-architecture.md)
- [Database Design](../../docs/40-specs/03-database-design/)

---
*Last Updated: 2025-01-18*
*Managed by Simone Framework*