# 仕様書ディレクトリ (40-specs)

このディレクトリには、Astar Management システムの詳細設計仕様書が含まれています。

## 📁 ディレクトリ構成

### [01-api-specifications/](./01-api-specifications/)
APIエンドポイントの詳細設計書

- **API_SPECIFICATION.md** - API基本仕様
- **API_SPECIFICATION_UNIFIED.md** - 統合API仕様
- **API_ENDPOINTS_DETAIL.md** - APIエンドポイント詳細
- **ACCOUNTING_API.md** - 会計API仕様
- **FEE_MANAGEMENT_API.md** - 請求管理API仕様
- **DASHBOARD_API_SPECIFICATION.md** - ダッシュボードAPI仕様
- **DOCUMENT_CREATION_API.md** - 文書作成API仕様
- **TEMPLATE_API_SPECIFICATION.md** - テンプレートAPI仕様
- **attachment-api-design.md** - 添付ファイルAPI設計
- **tag-management-api.md** - タグ管理API設計

### [02-auth-security/](./02-auth-security/)
認証・セキュリティ関連の設計書

- **auth-hybrid-architecture.md** - ハイブリッド認証アーキテクチャ
- **auth-database-design.md** - 認証データベース設計
- **permission-system-design.md** - 権限システム設計

### [03-database-design/](./03-database-design/)
データベース設計関連のドキュメント

- **database-migration-design.md** - データベースマイグレーション設計

### [04-feature-specs/](./04-feature-specs/)
機能別の詳細設計書

- **expense-input/** - 実費管理機能設計
  - 要件定義、UI設計、データモデル、API仕様など

### [05-system-design/](./05-system-design/)
システム全体に関わる設計書

- **error-handling-design.md** - エラーハンドリング設計
- **i18n-implementation-guide.md** - 国際化実装ガイド
- **overall-design-review.md** - 全体設計レビュー

## 🎯 設計原則

1. **Simple over Easy** - 複雑な抽象化より明確で直接的な実装
2. **Type Safety** - TypeScriptによる型安全性の確保
3. **Multi-tenancy** - マルチテナント対応の徹底
4. **Security First** - セキュリティを最優先に設計

## 📋 ドキュメント利用ガイド

### 新機能開発時
1. `04-feature-specs/` に機能別ディレクトリを作成
2. 要件定義 → データモデル → API設計 → UI設計の順で文書化
3. 関連するAPI仕様は `01-api-specifications/` に配置

### API開発時
1. `01-api-specifications/` の統合仕様を確認
2. エラーハンドリングは `05-system-design/error-handling-design.md` に準拠
3. 認証・権限は `02-auth-security/` の設計に従う

### データベース変更時
1. `03-database-design/database-migration-design.md` のガイドラインに従う
2. マルチテナント対応とRLSの実装を忘れずに

## 🔄 更新履歴

- 2024-08-03: ディレクトリ構成を整理・グループ化
- 2024-XX-XX: 初版作成