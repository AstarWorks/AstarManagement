# フロントエンドアーキテクチャ設計書

## 1. 概要

### 1.1 アーキテクチャ方針
- **Feature-Based Architecture**: 機能ごとにモジュール化
- **Foundation Layer**: 共通基盤の分離
- **Type Safety**: TypeScript完全準拠
- **Component Driven**: コンポーネント駆動開発

### 1.2 技術スタック
- **Framework**: Nuxt 3.x
- **Language**: TypeScript 5.x
- **UI Library**: shadcn-vue (Radix Vue based)
- **State Management**: Pinia
- **Styling**: Tailwind CSS
- **Testing**: Vitest + Playwright
- **i18n**: @nuxtjs/i18n

## 2. ディレクトリ構造

```
frontend/
├── app/                          # アプリケーションコード
│   ├── foundation/               # 基盤層
│   │   ├── api/                 # API通信
│   │   │   ├── useApi.ts       # 基本APIフック
│   │   │   └── useAsyncData.ts # 非同期データ取得
│   │   ├── components/          # 共通コンポーネント
│   │   │   ├── common/         # 汎用コンポーネント
│   │   │   │   ├── feedback/   # フィードバック
│   │   │   │   ├── states/     # 状態表示
│   │   │   │   └── user/       # ユーザー関連
│   │   │   └── ui/             # UIプリミティブ
│   │   │       ├── alert/      
│   │   │       ├── button/     
│   │   │       ├── card/       
│   │   │       ├── dialog/     
│   │   │       ├── form/       
│   │   │       ├── input/      
│   │   │       ├── select/     
│   │   │       ├── table/      
│   │   │       └── ...         
│   │   ├── composables/         # 共通Composables
│   │   │   ├── form/           # フォーム関連
│   │   │   ├── navigation/     # ナビゲーション
│   │   │   ├── table/          # テーブル関連
│   │   │   └── ui/             # UI関連
│   │   ├── config/              # 設定
│   │   │   ├── apiConfig.ts    
│   │   │   ├── authConfig.ts   
│   │   │   └── navigationConfig.ts
│   │   ├── lib/                 # ライブラリ
│   │   │   └── utils/          
│   │   │       ├── cn.ts       # クラス名結合
│   │   │       └── validationHelpers.ts
│   │   ├── stores/              # 共通ストア
│   │   │   ├── navigation.ts   
│   │   │   └── ui.ts           
│   │   └── types/               # 共通型定義
│   │       ├── api.ts          
│   │       ├── navigation.ts   
│   │       └── ui.ts           
│   │
│   ├── modules/                  # 機能モジュール
│   │   ├── auth/               # 認証モジュール
│   │   │   ├── components/     
│   │   │   ├── composables/    
│   │   │   ├── stores/         
│   │   │   └── types/          
│   │   ├── workspace/          # ワークスペース管理（新規）
│   │   │   ├── components/     
│   │   │   ├── composables/    
│   │   │   ├── stores/         
│   │   │   └── types/          
│   │   ├── database/           # 柔軟テーブル（新規）
│   │   │   ├── components/     
│   │   │   │   ├── views/      # 各種ビュー
│   │   │   │   │   ├── TableView.vue
│   │   │   │   │   ├── KanbanView.vue
│   │   │   │   │   ├── CalendarView.vue
│   │   │   │   │   └── GalleryView.vue
│   │   │   │   ├── properties/ # プロパティ管理
│   │   │   │   └── records/    # レコード管理
│   │   │   ├── composables/    
│   │   │   ├── stores/         
│   │   │   └── types/          
│   │   ├── document/           # ドキュメント管理
│   │   │   ├── components/     
│   │   │   │   ├── editor/     # Markdownエディタ
│   │   │   │   ├── tree/       # フォルダツリー
│   │   │   │   └── graph/      # グラフビュー
│   │   │   ├── composables/    
│   │   │   ├── stores/         
│   │   │   └── types/          
│   │   ├── project/            # プロジェクト管理（旧case）
│   │   │   ├── components/     
│   │   │   │   ├── kanban/     # カンバンボード
│   │   │   │   ├── list/       # リストビュー
│   │   │   │   └── detail/     # 詳細ビュー
│   │   │   ├── composables/    
│   │   │   ├── config/         
│   │   │   ├── stores/         
│   │   │   └── types/          
│   │   ├── expense/            # 経費管理
│   │   │   ├── components/     
│   │   │   ├── composables/    
│   │   │   ├── stores/         
│   │   │   └── types/          
│   │   └── dashboard/          # ダッシュボード
│   │       ├── components/     
│   │       ├── composables/    
│   │       └── types/          
│   │
│   ├── layouts/                 # レイアウト
│   │   ├── default.vue         # デフォルトレイアウト
│   │   ├── auth.vue            # 認証レイアウト
│   │   └── components/         # レイアウトコンポーネント
│   │       ├── header/         
│   │       ├── sidebar/        
│   │       └── footer/         
│   │
│   ├── middleware/              # ミドルウェア
│   │   ├── auth.ts             # 認証チェック
│   │   ├── guest.ts            # ゲストチェック
│   │   ├── rbac.ts             # ロールベースアクセス
│   │   └── security.ts         # セキュリティヘッダー
│   │
│   ├── pages/                   # ページコンポーネント
│   │   ├── index.vue           # ホーム
│   │   ├── login.vue           # ログイン
│   │   ├── workspaces/         # ワークスペース
│   │   ├── databases/          # データベース
│   │   ├── documents/          # ドキュメント
│   │   ├── projects/           # プロジェクト
│   │   └── expenses/           # 経費
│   │
│   ├── plugins/                 # Nuxtプラグイン
│   │   └── useSSRWidth.ts      
│   │
│   ├── shared/                  # 共有リソース
│   │   ├── components/         
│   │   ├── composables/        
│   │   └── utils/              
│   │
│   ├── types/                   # グローバル型定義
│   │   ├── auth.d.ts          
│   │   ├── user-profile.ts     
│   │   └── security.ts         
│   │
│   └── utils/                   # ユーティリティ
│       └── auth-validation.ts  
│
├── i18n/                        # 国際化
│   └── locales/                
│       └── ja/                 # 日本語
│           ├── foundation/     # 基盤メッセージ
│           └── modules/        # モジュール別メッセージ
│
├── server/                      # サーバーサイドAPI
│   └── api/                    
│       ├── auth/               
│       └── user/               
│
├── public/                      # 静的ファイル
│   ├── favicon.ico            
│   └── robots.txt             
│
└── config files                 # 設定ファイル
    ├── nuxt.config.ts          
    ├── tsconfig.json           
    ├── tailwind.config.js      
    ├── components.json         # shadcn-vue設定
    └── vitest.config.ts        
```

## 3. モジュール設計

### 3.1 Foundation Layer（基盤層）

#### 責務
- 全モジュールで共通利用される機能の提供
- UIコンポーネントライブラリの管理
- API通信の基盤実装
- 共通型定義とユーティリティ

#### 主要コンポーネント
```typescript
// foundation/api/useApi.ts
export const useApi = () => {
  const { $fetch } = useNuxtData()
  
  return {
    get: <T>(url: string, options?: RequestOptions) => 
      $fetch<T>(url, { method: 'GET', ...options }),
    post: <T>(url: string, body: any, options?: RequestOptions) => 
      $fetch<T>(url, { method: 'POST', body, ...options }),
    // ...
  }
}
```

### 3.2 Feature Modules（機能モジュール）

#### モジュール構造テンプレート
```
module-name/
├── components/          # モジュール専用コンポーネント
├── composables/        # モジュール専用Composables
├── config/            # モジュール設定
├── schemas/           # バリデーションスキーマ
├── services/          # APIサービス層
├── stores/            # 状態管理
├── types/             # 型定義
├── tests/             # テスト
└── index.ts           # パブリックAPI
```

#### モジュール間通信
- **疎結合**: モジュール間の直接依存を避ける
- **イベント駆動**: 必要に応じてイベントバスを使用
- **共通ストア経由**: グローバルな状態はfoundation/storesで管理

### 3.3 新モジュール: Flexible Table System

```typescript
// modules/database/types/index.ts
export interface Database {
  id: string
  name: string
  icon?: string
  properties: Property[]
  views: View[]
}

export interface Property {
  id: string
  name: string
  type: PropertyType
  config: PropertyConfig
}

export interface Record {
  id: string
  databaseId: string
  data: JsonValue
  createdAt: Date
  updatedAt: Date
}

export interface View {
  id: string
  name: string
  type: 'table' | 'kanban' | 'calendar' | 'gallery' | 'gantt'
  config: ViewConfig
}
```

### 3.4 新モジュール: Document Management

```typescript
// modules/document/types/index.ts
export interface Document {
  id: string
  title: string
  path: string
  content: string
  folderId?: string
  tags: string[]
  links: DocumentLink[]
}

export interface Folder {
  id: string
  name: string
  parentId?: string
  path: string
  icon?: string
}

export interface DocumentLink {
  sourceId: string
  targetId: string
  type: 'reference' | 'embed' | 'mention'
}
```

## 4. 状態管理

### 4.1 Pinia Store設計

```typescript
// foundation/stores/workspace.ts
export const useWorkspaceStore = defineStore('workspace', () => {
  const currentWorkspace = ref<Workspace | null>(null)
  const workspaces = ref<Workspace[]>([])
  
  const setCurrentWorkspace = (workspace: Workspace) => {
    currentWorkspace.value = workspace
  }
  
  return {
    currentWorkspace: readonly(currentWorkspace),
    workspaces: readonly(workspaces),
    setCurrentWorkspace
  }
})
```

### 4.2 Store階層
1. **Foundation Stores**: 全体で共有される状態
   - auth: 認証情報
   - ui: UI状態（サイドバー、テーマ等）
   - navigation: ナビゲーション状態

2. **Module Stores**: モジュール固有の状態
   - workspace: ワークスペース管理
   - database: データベース・レコード管理
   - document: ドキュメント管理

## 5. コンポーネント設計

### 5.1 コンポーネント階層

```
UIプリミティブ (foundation/components/ui)
    ↓
共通コンポーネント (foundation/components/common)
    ↓
モジュールコンポーネント (modules/*/components)
    ↓
ページコンポーネント (pages)
```

### 5.2 shadcn-vue統合

```vue
<!-- foundation/components/ui/button/Button.vue -->
<template>
  <button
    :class="cn(buttonVariants({ variant, size }), $attrs.class)"
    v-bind="$attrs"
  >
    <slot />
  </button>
</template>

<script setup lang="ts">
import { cn } from '@/foundation/lib/utils/cn'
import { buttonVariants } from './variants'

interface Props {
  variant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link'
  size?: 'default' | 'sm' | 'lg' | 'icon'
}

defineProps<Props>()
</script>
```

## 6. API通信

### 6.1 API Layer設計

```typescript
// modules/database/services/databaseService.ts
export const useDatabaseService = () => {
  const api = useApi()
  
  return {
    async getDatabases(workspaceId: string) {
      return api.get<Database[]>(`/api/workspaces/${workspaceId}/databases`)
    },
    
    async createDatabase(workspaceId: string, data: CreateDatabaseDto) {
      return api.post<Database>(`/api/workspaces/${workspaceId}/databases`, data)
    },
    
    async updateDatabase(id: string, data: UpdateDatabaseDto) {
      return api.put<Database>(`/api/databases/${id}`, data)
    }
  }
}
```

### 6.2 エラーハンドリング

```typescript
// foundation/composables/useAsyncOperation.ts
export const useAsyncOperation = () => {
  const loading = ref(false)
  const error = ref<Error | null>(null)
  
  const execute = async <T>(operation: () => Promise<T>): Promise<T | null> => {
    loading.value = true
    error.value = null
    
    try {
      const result = await operation()
      return result
    } catch (e) {
      error.value = e as Error
      console.error('Operation failed:', e)
      return null
    } finally {
      loading.value = false
    }
  }
  
  return {
    loading: readonly(loading),
    error: readonly(error),
    execute
  }
}
```

## 7. 国際化（i18n）

### 7.1 ディレクトリ構造

```
i18n/
└── locales/
    ├── ja/
    │   ├── foundation/          # 基盤メッセージ
    │   │   ├── common.json     
    │   │   ├── form.json       
    │   │   └── navigation.json 
    │   └── modules/            # モジュール別
    │       ├── workspace/      
    │       ├── database/       
    │       └── document/       
    └── en/                     # 英語（同じ構造）
```

### 7.2 使用方法

```vue
<template>
  <h1>{{ $t('modules.workspace.title') }}</h1>
  <p>{{ $t('foundation.common.welcome', { name: user.name }) }}</p>
</template>
```

## 8. テスト戦略

### 8.1 ユニットテスト

```typescript
// modules/database/composables/useDatabase.test.ts
import { describe, it, expect } from 'vitest'
import { useDatabase } from './useDatabase'

describe('useDatabase', () => {
  it('should create a new database', async () => {
    const { createDatabase } = useDatabase()
    const result = await createDatabase({
      name: 'Test Database',
      properties: []
    })
    expect(result).toBeDefined()
    expect(result.name).toBe('Test Database')
  })
})
```

### 8.2 コンポーネントテスト

```typescript
// foundation/components/ui/button/Button.test.ts
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

describe('Button', () => {
  it('renders slot content', () => {
    const wrapper = mount(Button, {
      slots: {
        default: 'Click me'
      }
    })
    expect(wrapper.text()).toBe('Click me')
  })
})
```

## 9. パフォーマンス最適化

### 9.1 コード分割

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  vite: {
    build: {
      rollupOptions: {
        output: {
          manualChunks: {
            'ui-components': ['@/foundation/components/ui'],
            'database-module': ['@/modules/database'],
            'document-module': ['@/modules/document']
          }
        }
      }
    }
  }
})
```

### 9.2 遅延ロード

```vue
<template>
  <LazyDatabaseView v-if="showDatabase" />
</template>

<script setup>
const DatabaseView = defineAsyncComponent(() => 
  import('@/modules/database/components/DatabaseView.vue')
)
</script>
```

## 10. セキュリティ

### 10.1 CSP設定

```typescript
// nuxt.config.ts
export default defineNuxtConfig({
  security: {
    headers: {
      contentSecurityPolicy: {
        'default-src': ["'self'"],
        'script-src': ["'self'", "'unsafe-inline'"],
        'style-src': ["'self'", "'unsafe-inline'"]
      }
    }
  }
})
```

### 10.2 認証ミドルウェア

```typescript
// middleware/auth.ts
export default defineNuxtRouteMiddleware((to, from) => {
  const { isAuthenticated } = useAuth()
  
  if (!isAuthenticated.value) {
    return navigateTo('/nin')
  }
})
```

## まとめ

このフロントエンドアーキテクチャは：
1. **Foundation Layer**: 共通基盤の明確な分離
2. **Feature Modules**: 機能単位のモジュール化
3. **Type Safety**: 完全な型安全性
4. **Modern Stack**: 最新技術の活用
5. **Scalable**: 拡張可能な設計

これにより、保守性が高く、拡張可能なフロントエンドアプリケーションを実現します。