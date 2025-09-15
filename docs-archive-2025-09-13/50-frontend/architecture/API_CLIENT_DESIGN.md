# Frontend API Client Design

## 概要

本ドキュメントは、Astar Managementのフロントエンドにおける API クライアント層の設計を定義します。開発環境でのモックデータと本番環境での実APIをシームレスに切り替え可能な、保守性の高いアーキテクチャを実現します。

## 設計原則

### Simple over Easy
- 暗黙的な魔法より明示的な実装を優先
- フレームワークの抽象化より直接的な実装を選択
- 複雑な依存関係を避け、シンプルな構造を維持

### 段階的移行
- 既存コードを壊さずに新しいパターンへ移行可能
- モジュール単位での採用が可能
- 学習コストを最小限に抑える設計

### 型安全性
- TypeScriptの型システムを最大限活用
- anyの使用を禁止
- インターフェースによる契約の明確化

## アーキテクチャ

### レイヤー構造

```
frontend/app/
├── shared/                      # 共有層
│   ├── api/                    # API基盤
│   │   ├── core/              # コア機能
│   │   ├── clients/           # クライアント実装
│   │   └── mock/              # モックデータ
│   └── composables/           # 共通フック
│       └── api/
├── modules/                     # 機能モジュール
│   └── [feature]/
│       ├── repositories/      # データアクセス層
│       ├── composables/       # UIフック
│       └── services/          # ビジネスロジック
└── foundation/                  # 基盤層
    └── config/
        └── apiConfig.ts        # API設定
```

### コンポーネント責務

#### 1. API Client層（shared/api）
- **BaseApiClient**: リトライ、エラーハンドリング、共通処理
- **MockApiClient**: 開発環境用のモックデータ提供
- **RealApiClient**: 実APIとの通信
- **ApiError**: 統一エラー型

#### 2. Repository層（modules/*/repositories）
- データアクセスの抽象化
- キャッシュ管理
- APIクライアントの利用
- ビジネスエンティティへの変換

#### 3. Composable層（modules/*/composables）
- UIコンポーネント向けのフック
- リアクティブなデータ管理
- ローディング状態の管理
- エラー状態の管理

## Mock/Real切り替え

### 環境変数による制御

```bash
# .env.frontend-only (モック環境)
NUXT_PUBLIC_API_MODE=mock
NUXT_PUBLIC_API_CACHE_ENABLED=true

# .env.development (統合環境)
NUXT_PUBLIC_API_MODE=real
NUXT_PUBLIC_API_BASE_URL=http://localhost:8080/api/v1
NUXT_PUBLIC_API_TIMEOUT=30000
NUXT_PUBLIC_API_RETRY_COUNT=3
```

### スクリプトによる起動

```json
{
  "scripts": {
    "dev:frontend": "nuxt dev --dotenv .env.frontend-only",
    "dev:integrated": "nuxt dev --dotenv .env.development"
  }
}
```

### Factory パターンによる実装

```typescript
export const useApiClient = (): BaseApiClient => {
  const config = getApiConfig()
  
  if (config.mode === 'mock') {
    return new MockApiClient(config)
  }
  return new RealApiClient(config)
}
```

## モックデータ管理

### ハンドラーベースの実装

```typescript
// shared/api/mock/handlers/expenses.ts
export default function expensesHandler(options: RequestOptions) {
  const { method, endpoint, params, body } = options
  
  switch (method) {
    case 'GET':
      return mockExpenseList(params)
    case 'POST':
      return mockCreateExpense(body)
    // ...
  }
}
```

### Vite glob import による自動登録

```typescript
const modules = import.meta.glob<{ default: MockHandler }>(
  '../mock/handlers/*.ts',
  { eager: true }
)
```

### API遅延シミュレーション

```typescript
// 100-300ms のランダム遅延
await new Promise(resolve => 
  setTimeout(resolve, 100 + Math.random() * 200)
)
```

## エラーハンドリング

### ApiError クラス

```typescript
export class ApiError extends Error {
  constructor(
    public readonly details: {
      message: string
      statusCode: number
      code: string
      details?: any
    }
  ) {
    super(details.message)
  }
  
  isAuthError(): boolean
  isNetworkError(): boolean
  isValidationError(): boolean
}
```

### エラー分類

- **認証エラー（401, 403）**: ログイン画面へリダイレクト
- **ネットワークエラー**: リトライ可能
- **検証エラー（422）**: フォームエラー表示
- **サーバーエラー（5xx）**: エラー画面表示

### リトライ戦略

```typescript
const retryableCodes = [408, 429, 500, 502, 503, 504]

private async withRetry<T>(
  fn: () => Promise<T>,
  retries: number
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    if (retries > 0 && this.isRetryable(error)) {
      await this.delay(1000)
      return this.withRetry(fn, retries - 1)
    }
    throw error
  }
}
```

## キャッシュ戦略

### useAsyncData によるキャッシュ

```typescript
const { data, refresh } = await useAsyncData(
  cacheKey,
  fetcher,
  {
    server: false,
    lazy: true,
    ttl: 5000 // 5秒キャッシュ
  }
)
```

### キャッシュキー生成

```typescript
protected cacheKey(...parts: (string | number | undefined)[]): string {
  const validParts = parts.filter(p => p !== undefined)
  return `${this.constructor.name}:${validParts.join(':')}`
}
```

### 明示的な無効化

```typescript
// 作成・更新・削除後にキャッシュをクリア
await clearNuxtData('ExpenseRepository:list')
```

## パフォーマンス最適化

### シングルトンパターン

```typescript
let clientInstance: BaseApiClient | null = null

export const useApiClient = (): BaseApiClient => {
  if (!clientInstance) {
    clientInstance = createClient()
  }
  return clientInstance
}
```

### HMR対応

```typescript
if (import.meta.hot) {
  import.meta.hot.dispose(() => {
    clientInstance = null
  })
}
```

### 並列リクエスト

```typescript
const [expenses, categories] = await Promise.all([
  repository.listExpenses(),
  repository.listCategories()
])
```

## セキュリティ考慮事項

### 認証トークン管理
- トークンはHttpOnlyクッキーまたはセキュアなストレージに保存
- リクエストごとに自動的にヘッダーに付与
- トークン期限切れ時の自動リフレッシュ

### CORS設定
- 開発環境と本番環境で適切なCORS設定
- プリフライトリクエストの最適化

### データサニタイゼーション
- XSS対策のための出力エスケープ
- SQLインジェクション対策（バックエンド側）

## ベストプラクティス

### 1. Repository の実装

```typescript
export class ExpenseApiRepository extends BaseRepository implements IExpenseRepository {
  async list(params?: ExpenseListParams): Promise<PaginatedResponse<Expense>> {
    return this.withCache(
      this.cacheKey('list', JSON.stringify(params)),
      () => this.client.request({
        endpoint: '/expenses',
        method: 'GET',
        params
      }),
      { ttl: 5000 }
    )
  }
}
```

### 2. Composable の実装

```typescript
export const useExpense = () => {
  const repository = useExpenseRepository()
  
  const list = (params?: ExpenseListParams) => {
    return useAsyncData(
      ['expenses', params],
      () => repository.list(params),
      { server: false, lazy: true }
    )
  }
  
  return { list }
}
```

### 3. エラーハンドリング

```typescript
try {
  const data = await repository.create(formData)
  toast.success('作成しました')
  return data
} catch (error) {
  if (error instanceof ApiError) {
    if (error.isValidationError()) {
      // フォームエラー表示
    } else if (error.isAuthError()) {
      // ログイン画面へ
    }
  }
  toast.error('エラーが発生しました')
  throw error
}
```

## 移行ガイド

### 段階1: Repository層の実装
1. インターフェース定義
2. Mock/API実装の作成
3. 既存のAPI呼び出しをRepositoryに置き換え

### 段階2: Composableの更新
1. Repositoryを使用するように更新
2. エラーハンドリングの統一
3. キャッシュ戦略の適用

### 段階3: 既存コードのクリーンアップ
1. 直接的なAPI呼び出しの削除
2. 重複コードの削除
3. 型定義の整理

## 関連ドキュメント

- [Frontend Architecture](./FRONTEND_ARCHITECTURE.md)
- [API Client Implementation Specification](../../40-specs/frontend/api-client-implementation.md)
- [API Configuration](../../../frontend/app/foundation/config/apiConfig.ts)