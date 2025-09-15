# API仕様書

このディレクトリには、Astar Management システムのAPI仕様書が含まれています。

## 📋 ドキュメント一覧

### 基本仕様
- **API_SPECIFICATION.md** - API基本仕様（認証、エラー処理、共通仕様）
- **API_SPECIFICATION_UNIFIED.md** - 統合API仕様（全エンドポイント一覧）
- **API_ENDPOINTS_DETAIL.md** - APIエンドポイント詳細設計

### 機能別API仕様
- **ACCOUNTING_API.md** - 会計API（収支管理、レポート）
- **FEE_MANAGEMENT_API.md** - 請求管理API（請求書作成、支払管理）
- **DASHBOARD_API_SPECIFICATION.md** - ダッシュボードAPI（統計、サマリー）
- **DOCUMENT_CREATION_API.md** - 文書作成API（文書生成、編集）
- **TEMPLATE_API_SPECIFICATION.md** - テンプレートAPI（テンプレート管理）

*注: タグ管理APIと添付ファイルAPIは実費管理機能の一部として [expense-input](../04-feature-specs/expense-input/) に移動されました。*

## 🔗 API設計ガイドライン

### RESTful設計原則
- リソース指向のURL設計
- 適切なHTTPメソッドの使用
- ステータスコードの正しい利用

### 共通仕様
- 認証: JWT Bearer Token
- エラー形式: 統一されたエラーレスポンス
- ページネーション: limit/offset方式
- 日時形式: ISO 8601

### バージョニング
- URLパス方式: `/api/v1/`
- 後方互換性の維持

## 📝 関連ドキュメント
- [エラーハンドリング設計](../05-system-design/error-handling-design.md)
- [認証設計](../02-auth-security/auth-hybrid-architecture.md)
- [権限システム](../02-auth-security/permission-system-design.md)