# CLAUDE.md - Astar Management Configuration

## Project Overview

**Astar Management - 汎用ビジネス管理プラットフォーム**
- **コアコンセプト**: AI-Agent + Notion + Obsidian の融合
- **ポジショニング**: 企業向けObsidian + AIネイティブ
- **アーキテクチャ**: 汎用基盤SaaS + 業界特化テンプレート
- **対象**: 小中規模企業（1-100名）のDX実現
- **フェーズ**: MVP開発段階（法律事務所テンプレートから開始）

### プラットフォーム戦略

**汎用基盤**: 業界に依存しない4つのコア機能
1. **プロジェクト管理** - カンバン形式 & テーブル形式でのワークフロー管理、進捗可視化
2. **経費管理** - テーブル形式での財務管理、時間・コスト追跡
3. **顧客管理** - テーブル形式でのリレーション管理、CRM機能
4. **文書管理** - 階層型Markdownドキュメント、変数システム、AIエージェント統合

### データ表現哲学

**Notion + Obsidian リスペクト**:
- **テーブル**: 構造化データの管理（プロジェクト、経費、顧客）
- **階層型ドキュメント**: 非構造化情報の管理（会議録、ノート、書類）
- **双方向リンク**: テーブル ↔ ドキュメント間の自由な関連付け
- **統一インターフェース**: すべてがテーブルまたはドキュメントで表現可能

**テンプレート特化**: 業界別カスタマイズ
- **法律事務所テンプレート** (最初の実装)
- **将来展開**: 司法書士、物流業界、不動産管理等

### AIエージェント統合

**全機能AIアクセス可能**:
- プラットフォームの全機能をAIが操作・実行
- 自然言語でのタスク指示・実行
- ローカル/クラウド両対応LLM
- 組織データからのRAG学習

## Core Principles

### Simple over Easy
- Prefer explicit, straightforward solutions over clever abstractions
- Choose readable code over clever optimizations
- Minimize dependencies and complexity
- Direct implementation preferred over framework magic

### TypeScript Standards
- **NEVER use `any` type in production code**
- Always define proper interfaces and types
- Use strict TypeScript configuration
- Prefer type safety over convenience

## Essential Rules

### Internationalization (i18n)
- **NO hardcoded strings** - Always use `$t('key')` for user-facing text
- Support both Japanese and English
- Structure keys hierarchically: `auth.login.title`

### Code Quality
- Run `bun run typecheck` after TypeScript changes
- Run `bun run test` after code changes
- Create Storybook stories for components
- Follow Clean Architecture principles

### Backend Architecture (Spring Boot)
- **Service Layer Required**: All business logic must be in service classes with `@Transactional` annotations
- **Repository Pattern**: Repositories handle only CRUD operations, no business logic
- **Controller Pattern**: Controllers delegate to services, handle only HTTP concerns
- **Layer Flow**: Controller → Service → Repository (never skip service layer)
- **Transaction Boundaries**: Use `@Transactional` for write operations, `@Transactional(readOnly = true)` for read operations

### Template System Requirements
- **コード**: 完全に業界非依存、汎用的な実装のみ
- **テンプレート**: 業界特化の設定・スキーマ・ワークフロー
- **データ分離**: ハイブリッド型マルチテナントアーキテクチャ
  - Starter: Shared DB + RLS（コスト効率重視）
  - Professional: Dedicated Schema（バランス型）
  - Enterprise: Dedicated Container（高セキュリティ）

### Discord風ロールシステム
- **初期ロールなし**: システムには事前定義されたロールは存在しない
- **動的ロール作成**: 管理者が組織のニーズに合わせてロールを作成
- **テンプレート同梱**: 業界テンプレートに事前定義されたロールをインポート可能
- **複数ロール付与**: 1ユーザーに複数ロールを付与して柔軟な権限設定
- **階層なし**: ロール間に継承関係はなく、すべて独立
- **色分けと表示**: Discord風の色分けとロール表示機能

### Security & Multi-tenancy Requirements
- Implement tenant isolation for all data operations
- Add audit logging for sensitive operations
- Protect confidential business data
- Use Row Level Security (RLS) for multi-tenancy
- Dynamic role-based access control with template role import

## Backend Status
- **Build**: `./gradlew build -x test`
- **Run**: `SPRING_PROFILES_ACTIVE=default ./gradlew bootRun`