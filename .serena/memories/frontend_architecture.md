# Frontend Architecture - Feature-Based Structure

## 採用アーキテクチャ
**Feature-Based Architecture (Domain-Driven Design)**を採用

## ディレクトリ構造
```
frontend/app/
├── features/              # 機能別モジュール
│   ├── expense/          # 経費管理機能
│   │   ├── components/   # 経費用コンポーネント
│   │   ├── composables/  # 経費用Composables
│   │   ├── pages/        # 経費ページ
│   │   ├── services/     # 経費APIサービス
│   │   ├── types/        # 経費型定義
│   │   └── tests/        # 経費テスト
│   ├── case/            # 案件管理機能
│   │   └── (同様の構造)
│   └── auth/            # 認証機能
│       └── (同様の構造)
├── shared/              # 共有モジュール
│   ├── components/      # 共有コンポーネント
│   ├── composables/     # 共有Composables
│   ├── utils/          # ユーティリティ
│   └── types/          # 共通型定義
└── core/               # 基盤モジュール
    ├── ui/             # shadcn/uiコンポーネント
    ├── layouts/        # レイアウト
    ├── middleware/     # ミドルウェア
    └── config/         # 設定ファイル
```

## インポートパスエイリアス
```typescript
// tsconfig.json & nuxt.config.ts で定義
@features  -> app/features
@shared    -> app/shared  
@core      -> app/core
@ui        -> app/core/ui
@expense   -> app/features/expense
@case      -> app/features/case
@auth      -> app/features/auth
```

## インポート規則
- **index.tsは使用しない** - 直接ファイルパスを指定
- 例: `import { useLoginForm } from '@auth/composables/useLoginForm'`

## 利点
1. **スケーラビリティ**: 機能単位で独立して開発可能
2. **保守性**: 変更の影響範囲が明確
3. **チーム開発**: 機能単位で担当を分けやすい
4. **テスタビリティ**: 機能単位でテスト可能

## 注意点
- Nuxtの自動インポートは引き続き機能
- pagesディレクトリは各feature内に配置
- 標準的なNuxt構造からの移行なので、新規参画者には説明が必要