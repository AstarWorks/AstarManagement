# データベース設計

このディレクトリには、データベース設計関連のドキュメントが含まれています。

## 📋 ドキュメント一覧

- **database-migration-design.md** - データベースマイグレーション設計
  - Flywayを使用したマイグレーション戦略
  - バージョン管理方針
  - ロールバック手順

## 🗄️ データベース設計原則

1. **正規化** - 適切なレベルの正規化（通常は第3正規形）
2. **マルチテナント対応** - tenant_idによるデータ分離
3. **監査対応** - created_at, updated_at, created_by, updated_by
4. **論理削除** - deleted_at, deleted_by
5. **Row Level Security** - PostgreSQLのRLS機能を活用

## 📊 主要テーブル

### 認証・ユーザー管理
- users - ユーザー情報
- sessions - セッション管理
- roles - ロール定義
- permissions - 権限定義

### 業務データ
- tenants - テナント（事務所）
- cases - 案件
- clients - 顧客
- expenses - 実費
- invoices - 請求書
- documents - 文書

## 🔗 関連ドキュメント

### 機能別テーブル設計
- [実費テーブル設計](../04-feature-specs/expense-input/expense-table-design.md)
- [認証テーブル設計](../02-auth-security/auth-database-design.md)

### その他
- [API仕様](../01-api-specifications/)
- [セキュリティ設計](../02-auth-security/)