# 実費管理機能 設計ドキュメント

このディレクトリには、Astar Management システムの実費管理機能に関するすべての設計ドキュメントが含まれています。

## 📁 ドキュメント構成

### 1. 要件・仕様定義
- **`requirements.md`** - ビジネス要件・機能要件・非機能要件
- **`implementation-priority.md`** - 実装優先順位と段階的リリース計画

### 2. データベース設計
- **`data-model.md`** - エンティティ定義・リレーション設計
- **`expense-table-design.md`** - 実費テーブル詳細設計（DDL、インデックス、RLS）
- **`expense-balance-redesign.md`** - 残高管理方式の設計（ハイブリッド方式）

### 3. API設計
- **`api-specification.md`** - 基本的なAPI仕様
- **`expense-api-endpoints.md`** - 実費管理API エンドポイント詳細設計
- **`tag-management-api.md`** - タグ管理API設計（実費のタグ付け機能）
- **`attachment-api-design.md`** - 添付ファイルAPI設計（領収書アップロード）
- **`type-definitions.md`** - TypeScript型定義

### 4. フロントエンド設計
- **`ui-design.md`** - 画面レイアウト・ユーザーフロー・インタラクション
- **`component-design.md`** - Vueコンポーネント構成・状態管理
- **`ui-libraries.md`** - 使用するUIライブラリとコンポーネント
- **`frontend-routing-design.md`** - フロントエンドルーティング設計（URL構造・ナビゲーション）

## 🔗 関連ドキュメント

### 関連API仕様
- [請求管理API仕様](../../01-api-specifications/FEE_MANAGEMENT_API.md)
- [会計API仕様](../../01-api-specifications/ACCOUNTING_API.md)

### システム全体設計
- [統合API仕様](../../01-api-specifications/API_SPECIFICATION_UNIFIED.md)
- [API詳細設計](../../01-api-specifications/API_ENDPOINTS_DETAIL.md)
- [エラーハンドリング設計](../../05-system-design/error-handling-design.md)
- [権限システム設計](../../02-auth-security/permission-system-design.md)

## 📊 設計概要

### データフロー
```
フロントエンド (Vue3/Nuxt3)
    ↓
実費入力フォーム
    ↓
API Gateway (/api/v1/expenses)
    ↓
バックエンド (Spring Boot)
    ↓
PostgreSQL (expenses, expense_balances)
```

### 主要機能
1. **実費入力** - 日付、カテゴリ、金額、説明の入力
2. **収支管理** - 収入/支出の分離管理
3. **残高計算** - リアルタイム残高計算（ハイブリッド方式）
4. **案件紐付け** - 案件ごとの実費管理
5. **タグ付け** - 実費のカテゴリ分けと検索（個人/共有タグ）
6. **領収書管理** - 領収書画像のアップロードと紐付け
7. **レポート** - 期間別・案件別・カテゴリ別集計

### セキュリティ考慮事項
- マルチテナント対応（tenant_id による分離）
- Row Level Security (RLS) の実装
- 監査ログの記録
- 権限ベースのアクセス制御

## 🚀 実装ステータス

| フェーズ | 機能 | ステータス |
|---------|------|------------|
| Phase 1 | 基本的な実費入力 | 🟡 開発中 |
| Phase 1 | 収支残高表示 | 🔴 未着手 |
| Phase 2 | 案件別集計 | 🔴 未着手 |
| Phase 2 | レポート機能 | 🔴 未着手 |
| Phase 3 | 高度な分析 | 🔴 未着手 |

## 📝 更新履歴

- 2024-08-03: ドキュメント構成を整理・統合
- 2024-XX-XX: 初版作成