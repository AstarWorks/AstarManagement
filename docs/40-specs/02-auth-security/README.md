# 認証・セキュリティ設計

このディレクトリには、認証システムとセキュリティ関連の設計書が含まれています。

## 📋 ドキュメント一覧

- **auth-hybrid-architecture.md** - ハイブリッド認証アーキテクチャ
  - JWT + セッションのハイブリッド方式
  - 認証フローの詳細
  - セキュリティ考慮事項

- **auth-database-design.md** - 認証データベース設計
  - ユーザーテーブル設計
  - セッション管理
  - 監査ログ

- **permission-system-design.md** - 権限システム設計
  - RBAC（Role-Based Access Control）
  - 権限定義とスコープ
  - Row Level Security (RLS)

## 🔐 セキュリティ原則

1. **最小権限の原則** - 必要最小限の権限のみ付与
2. **多層防御** - 複数のセキュリティレイヤーで保護
3. **監査証跡** - すべての重要操作をログ記録
4. **データ暗号化** - 保存時・転送時の暗号化

## 🏗️ アーキテクチャ概要

```
┌─────────────┐     ┌─────────────┐     ┌─────────────┐
│   Client    │────▶│  API Gateway │────▶│   Backend   │
└─────────────┘     └─────────────┘     └─────────────┘
      │                    │                     │
      │              JWT validation         Session check
      │                    │                     │
      └────────────────────┴─────────────────────┘
                     Authentication Layer
```

## 🔗 関連ドキュメント
- [API仕様](../01-api-specifications/)
- [データベース設計](../03-database-design/)
- [エラーハンドリング](../05-system-design/error-handling-design.md)