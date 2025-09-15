# フロントエンド概要

## Nuxt 3アプリケーション

Vue 3 + Nuxt 3で構築されたモダンなSPA/SSRアプリケーション。
shadcn-vueによる統一されたUIコンポーネントライブラリを採用。

## 技術スタック

### フレームワーク
- **Nuxt 3**: SSR/SPA対応のVue.jsメタフレームワーク
- **Vue 3**: Composition API使用
- **TypeScript 5**: 型安全な開発
- **Bun**: 高速なパッケージマネージャー

### UI/スタイリング
- **shadcn-vue**: Radix UIベースのコンポーネント
- **Tailwind CSS**: ユーティリティファーストCSS
- **Lucide Icons**: アイコンライブラリ

### 状態管理
- **Pinia**: Vue 3公式の状態管理
- **VueUse**: Composition APIユーティリティ

## ドキュメント構成

```
frontend/
├── features/              # 機能別詳細ドキュメント
│   ├── auth/             # 認証UI・フロー
│   ├── table/            # テーブルビュー機能
│   ├── workspace/        # ワークスペース管理UI
│   ├── user/             # ユーザープロフィール
│   ├── role/             # ロール管理UI
│   ├── membership/       # メンバー招待UI
│   ├── template/         # テンプレート選択UI
│   └── dashboard/        # ダッシュボード
├── components/           # 共通コンポーネント設計
└── architecture/        # フロントエンド設計書
```

## 実装済み機能

### コア機能
1. **[認証](./features/auth/)**: ログイン、セットアップウィザード
2. **[テーブルビュー](./features/table/)**: カンバン、テーブル、ギャラリー表示
3. **[ワークスペース](./features/workspace/)**: ファイルツリー、権限表示

### 管理機能
4. **[ユーザー管理](./features/user/)**: プロフィール編集
5. **[ロール管理](./features/role/)**: Discord風ロール表示
6. **[メンバーシップ](./features/membership/)**: 招待、メンバー一覧
7. **[テンプレート](./features/template/)**: テンプレート選択・適用
8. **[ダッシュボード](./features/dashboard/)**: 統計、クイックアクセス

### 計画中の機能
- **ドキュメントエディタ**: Markdownリッチエディタ
- **AIチャット**: サイドバーAIアシスタント

## ディレクトリ構成

```
frontend/app/
├── assets/          # 静的アセット
├── components/      # 再利用可能コンポーネント
├── composables/     # Composition API関数
├── layouts/         # レイアウトコンポーネント
├── middleware/      # ルートミドルウェア
├── pages/           # ルートページ
├── plugins/         # Nuxtプラグイン
├── stores/          # Piniaストア
└── utils/           # ユーティリティ関数
```

## コンポーネント設計

### 基本原則
1. **単一責任**: 1コンポーネント1機能
2. **Props駆動**: データは親から子へ
3. **イベント駆動**: 子から親への通信
4. **型安全**: TypeScriptで全て型定義

### コンポーネント例
```vue
<script setup lang="ts">
interface Props {
  title: string
  description?: string
  variant?: 'default' | 'primary' | 'secondary'
}

const props = withDefaults(defineProps<Props>(), {
  variant: 'default'
})

const emit = defineEmits<{
  click: [event: MouseEvent]
  update: [value: string]
}>()
</script>

<template>
  <Card @click="emit('click', $event)">
    <CardHeader>
      <CardTitle>{{ title }}</CardTitle>
      <CardDescription v-if="description">
        {{ description }}
      </CardDescription>
    </CardHeader>
  </Card>
</template>
```

## 状態管理パターン

### Piniaストア
```typescript
export const useWorkspaceStore = defineStore('workspace', () => {
  // State
  const currentWorkspace = ref<Workspace | null>(null)
  const workspaces = ref<Workspace[]>([])
  
  // Getters
  const workspaceCount = computed(() => workspaces.value.length)
  
  // Actions
  async function fetchWorkspaces() {
    const { data } = await $fetch('/api/v1/workspaces')
    workspaces.value = data
  }
  
  async function selectWorkspace(id: string) {
    currentWorkspace.value = workspaces.value.find(w => w.id === id)
  }
  
  return {
    currentWorkspace,
    workspaces,
    workspaceCount,
    fetchWorkspaces,
    selectWorkspace
  }
})
```

## API統合

### APIクライアント
```typescript
// composables/useApi.ts
export const useApi = () => {
  const config = useRuntimeConfig()
  
  return $fetch.create({
    baseURL: config.public.apiBase,
    headers: {
      'Content-Type': 'application/json'
    },
    onRequest({ options }) {
      const token = useAuthStore().token
      if (token) {
        options.headers = {
          ...options.headers,
          Authorization: `Bearer ${token}`
        }
      }
    },
    onResponseError({ response }) {
      if (response.status === 401) {
        navigateTo('/login')
      }
    }
  })
}
```

### データフェッチング
```vue
<script setup lang="ts">
// サーバーサイドフェッチ
const { data: tables } = await useFetch('/api/v1/tables')

// クライアントサイドフェッチ
const { data, pending, error, refresh } = await useLazyFetch(
  '/api/v1/tables',
  {
    query: { page: 1, size: 20 }
  }
)

// 手動フェッチ
const api = useApi()
async function createTable() {
  const result = await api('/tables', {
    method: 'POST',
    body: { name: 'New Table' }
  })
}
</script>
```

## i18n（国際化）

### 設定
```typescript
// i18n.config.ts
export default defineI18nConfig(() => ({
  legacy: false,
  locale: 'ja',
  messages: {
    ja: {
      welcome: 'ようこそ',
      auth: {
        login: 'ログイン',
        logout: 'ログアウト'
      }
    },
    en: {
      welcome: 'Welcome',
      auth: {
        login: 'Login',
        logout: 'Logout'
      }
    }
  }
}))
```

### 使用方法
```vue
<template>
  <div>
    <h1>{{ $t('welcome') }}</h1>
    <Button>{{ $t('auth.login') }}</Button>
  </div>
</template>
```

## ビルド・開発

### スクリプト
```json
{
  "scripts": {
    "dev": "nuxt dev",
    "build": "nuxt build",
    "preview": "nuxt preview",
    "typecheck": "nuxt typecheck",
    "test": "vitest",
    "test:ui": "vitest --ui",
    "storybook": "storybook dev -p 6006"
  }
}
```

### 環境変数
```bash
# .env
NUXT_PUBLIC_API_BASE=http://localhost:8080/api
NUXT_PUBLIC_WS_URL=ws://localhost:8080/ws
```

## パフォーマンス最適化

### コード分割
```typescript
// 動的インポート
const HeavyComponent = defineAsyncComponent(
  () => import('~/components/HeavyComponent.vue')
)
```

### 画像最適化
```vue
<template>
  <NuxtImg
    src="/image.jpg"
    width="800"
    height="400"
    loading="lazy"
    :modifiers="{ quality: 80, format: 'webp' }"
  />
</template>
```

### キャッシュ戦略
```typescript
// ページキャッシュ
definePageMeta({
  keepalive: true
})

// APIキャッシュ
const { data } = await useFetch('/api/data', {
  getCachedData(key) {
    const nuxt = useNuxtData()
    return nuxt.data[key] || nuxt.payload.data[key]
  }
})
```

## テスト戦略

### 単体テスト
```typescript
// components/Button.test.ts
import { mount } from '@vue/test-utils'
import Button from './Button.vue'

describe('Button', () => {
  it('renders properly', () => {
    const wrapper = mount(Button, {
      props: { label: 'Click me' }
    })
    expect(wrapper.text()).toContain('Click me')
  })
})
```

### E2Eテスト
```typescript
// e2e/login.test.ts
import { test, expect } from '@playwright/test'

test('user can login', async ({ page }) => {
  await page.goto('/login')
  await page.fill('input[name="email"]', 'user@example.com')
  await page.fill('input[name="password"]', 'password')
  await page.click('button[type="submit"]')
  await expect(page).toHaveURL('/dashboard')
})
```