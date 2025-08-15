# Feature-Based Architecture

## 構造

各フィーチャーは独立したモジュールとして構成されています：

```
features/
├── expense/              # 経費管理機能
├── case/                # 案件管理機能
└── auth/                # 認証機能
```

## フィーチャーモジュールの構造

各フィーチャーモジュールは以下の構造を持ちます：

```
feature-name/
├── components/          # フィーチャー専用コンポーネント
├── composables/         # フィーチャー専用Composables
├── pages/              # フィーチャーのページコンポーネント
├── stores/             # フィーチャーの状態管理
├── services/           # フィーチャーのAPIサービス
├── types/              # フィーチャーの型定義
├── tests/              # フィーチャーのテスト
└── index.ts            # パブリックAPI
```

## インポート方法

### フィーチャー内からのインポート
```typescript
// 相対パスを使用
import { useExpenseForm } from '../composables/useExpenseForm'
```

### 他のフィーチャーからのインポート
```typescript
// エイリアスを使用
import { ExpenseForm } from '@expense'
import { LoginForm } from '@auth'
```

### 共通モジュールのインポート
```typescript
import { Button } from '@ui/button'
import { useApiAuth } from '@shared/composables/api'
```

## 新しいフィーチャーの追加

1. `features/`配下に新しいディレクトリを作成
2. 標準的なディレクトリ構造を作成
3. `index.ts`でパブリックAPIを定義
4. `tsconfig.json`にパスエイリアスを追加（オプション）

## ベストプラクティス

- フィーチャー間の依存関係は最小限に
- 共通ロジックは`shared/`へ
- UIコンポーネントは`core/ui/`を使用
- 各フィーチャーは独立してテスト可能に