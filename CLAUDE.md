# CLAUDE.md - Astar Management Configuration

## Project Overview

**Astar Management - 法律事務所向け業務管理システム**
- 対象: 小中規模法律事務所（1-10名）のDX実現
- フェーズ: MVP開発段階

### 主要な4機能 (実装優先順位)

**Phase 1 (優先実装)**:
1. **案件管理** - カンバン形式 & テーブル形式での進捗可視化、ステータス管理
2. **請求管理** - 実費の簡単な入力フォームと事務所、弁護士、案件それぞれの単位での統計

**Phase 2 (後期実装)**:
1. **顧客管理** - 依頼者情報の一元管理、連絡履歴追跡 -> 時系列順に顧客対応が見られれば良い
2. **文書管理** - 契約書・資料のデジタル保存、検索機能 -> VSCode風書類編集とテンプレ文書の変数埋め込み

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

### Legal Domain Requirements
- Implement tenant isolation for all data operations
- Add audit logging for sensitive operations
- Protect attorney-client privilege data
- Use Row Level Security (RLS) for multi-tenancy

## Backend Status
- **Build**: `./gradlew build -x test`
- **Run**: `SPRING_PROFILES_ACTIVE=default ./gradlew bootRun`