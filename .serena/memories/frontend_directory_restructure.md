# Frontend Directory Restructure - 2025-08-15

## 実施した変更

### 1. ディレクトリ構造の変更
- `app/composables/` → 削除（移行完了）
- `app/components/` → 削除（移行完了）  
- `app/pages/expenses/` → 削除（空ディレクトリ）
- `app/core/` → `app/infrastructure/` へリネーム

### 2. ページファイルの統一
- `features/expense/pages/*` → `pages/expenses/`
- `features/case/pages/*` → `pages/cases/`
- `features/auth/pages/*` → `pages/auth/`

### 3. エイリアスパスの更新
- `@core` → `@infrastructure`
- `@ui` → `@infrastructure/ui`

### 4. 設定ファイルの更新
- nuxt.config.ts: エイリアス設定、shadcn設定、自動インポート設定
- tsconfig.json: パスマッピング更新

## 最終的なディレクトリ構造
```
frontend/app/
├── features/       # 機能別モジュール（DDD）
│   ├── auth/
│   ├── expense/
│   └── case/
├── shared/         # ビジネス共通層
│   ├── components/
│   ├── composables/
│   ├── types/
│   └── utils/
├── infrastructure/ # 技術基盤層（旧core）
│   ├── ui/        # shadcn/uiコンポーネント
│   ├── config/    # 技術設定
│   ├── layouts/   # レイアウト
│   └── middleware/# ミドルウェア
├── pages/         # 統一されたページディレクトリ
│   ├── auth/
│   ├── cases/
│   └── expenses/
├── stores/        # Piniaストア
├── locales/       # 国際化
└── types/         # 型定義
```

## 利点
- 責務の明確化: infrastructure（技術）とshared（ビジネス）の分離
- ページの統一: Nuxt3のファイルベースルーティングに準拠
- 移行の完了: 旧構造の残骸を削除