import type { Meta, StoryObj } from '@storybook/vue3'
import { ref } from 'vue'
import ErrorBoundary from '@shared/components/states/ErrorBoundary.vue'

const meta: Meta<typeof ErrorBoundary> = {
  title: 'States/ErrorBoundary',
  component: ErrorBoundary,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Vue 3用エラーバウンダリーコンポーネント。子コンポーネントでエラーが発生した際にアプリケーション全体がクラッシュすることを防ぎます。

## 機能
- 子コンポーネントのエラーをキャッチ
- カスタムフォールバックコンポーネント対応
- エラー発生時のコールバック
- リセット機能
- プロパティ変更時の自動リセット

## 使用場面
- 重要なコンポーネントの周りに配置
- 動的コンポーネントの読み込み
- サードパーティコンポーネントの統合
        `,
      },
    },
    backgrounds: {
      default: 'legal-gray',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    onError: {
      action: 'error-caught',
      description: 'エラーが発生した際のコールバック',
    },
    resetOnPropsChange: {
      control: 'boolean',
      description: 'プロパティ変更時に自動リセット',
    },
  },
  args: {
    resetOnPropsChange: true,
  },
}

export default meta
type Story = StoryObj<typeof meta>

// 正常な子コンポーネント
const NormalComponent = {
  template: `
    <div class="p-4 border border-green-200 bg-green-50 rounded-lg">
      <h3 class="text-lg font-semibold text-green-800">正常なコンポーネント</h3>
      <p class="text-green-700">このコンポーネントは正常に動作しています。</p>
      <button class="mt-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700">
        正常なボタン
      </button>
    </div>
  `,
}

// エラーを発生させるコンポーネント
const ErrorComponent = {
  setup() {
    const shouldError = ref(false)
    
    const triggerError = () => {
      shouldError.value = true
    }

    // エラーを意図的に発生させる
    watchEffect(() => {
      if (shouldError.value) {
        throw new Error('テスト用のエラーが発生しました')
      }
    })

    return {
      triggerError
    }
  },
  template: `
    <div class="p-4 border border-red-200 bg-red-50 rounded-lg">
      <h3 class="text-lg font-semibold text-red-800">エラーテスト用コンポーネント</h3>
      <p class="text-red-700">このボタンをクリックするとエラーが発生します。</p>
      <button 
        @click="triggerError"
        class="mt-2 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
      >
        エラーを発生させる
      </button>
    </div>
  `,
}

// デフォルト（正常状態）
export const Default: Story = {
  render: (args) => ({
    components: { ErrorBoundary, NormalComponent },
    setup: () => ({ args }),
    template: `
      <ErrorBoundary v-bind="args">
        <NormalComponent />
      </ErrorBoundary>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: '正常なコンポーネントが正しく表示されることを確認します。',
      },
    },
  },
}

// エラー状態のシミュレーション
export const WithError: Story = {
  render: (args) => ({
    components: { ErrorBoundary, ErrorComponent },
    setup: () => ({ args }),
    template: `
      <ErrorBoundary v-bind="args">
        <ErrorComponent />
      </ErrorBoundary>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'エラーが発生した際のフォールバック表示をテストします。「エラーを発生させる」ボタンをクリックしてください。',
      },
    },
  },
}

// カスタムフォールバック
export const CustomFallback: Story = {
  render: (args) => ({
    components: { ErrorBoundary, ErrorComponent },
    setup: () => ({ 
      args: {
        ...args,
        fallback: {
          props: ['error', 'errorInfo', 'retry'],
          template: `
            <div class="p-6 border border-yellow-300 bg-yellow-50 rounded-lg max-w-md">
              <div class="flex items-center gap-2 mb-3">
                <svg class="w-6 h-6 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.728-.833-2.498 0L4.316 15.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
                <h3 class="text-lg font-semibold text-yellow-800">カスタムエラーメッセージ</h3>
              </div>
              <p class="text-yellow-700 mb-4">申し訳ございませんが、予期しないエラーが発生しました。</p>
              <div class="flex gap-2">
                <button 
                  @click="retry"
                  class="px-4 py-2 bg-yellow-600 text-white rounded hover:bg-yellow-700"
                >
                  再試行
                </button>
                <button 
                  @click="() => window.location.reload()"
                  class="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
                >
                  ページを再読み込み
                </button>
              </div>
            </div>
          `,
        }
      }
    }),
    template: `
      <ErrorBoundary v-bind="args">
        <ErrorComponent />
      </ErrorBoundary>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'カスタムフォールバックコンポーネントを使用した例。独自のエラー表示を定義できます。',
      },
    },
  },
}

// 複数の子コンポーネント
export const MultipleChildren: Story = {
  render: (args) => ({
    components: { ErrorBoundary, NormalComponent, ErrorComponent },
    setup: () => ({ args }),
    template: `
      <ErrorBoundary v-bind="args">
        <div class="space-y-4">
          <NormalComponent />
          <NormalComponent />
          <ErrorComponent />
        </div>
      </ErrorBoundary>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: '複数の子コンポーネントがある場合のエラーハンドリング。一つがエラーになると全体がフォールバック表示になります。',
      },
    },
  },
}

// ネストしたエラーバウンダリー
export const Nested: Story = {
  render: (args) => ({
    components: { ErrorBoundary, NormalComponent, ErrorComponent },
    setup: () => ({ args }),
    template: `
      <ErrorBoundary v-bind="args">
        <div class="space-y-4">
          <NormalComponent />
          <ErrorBoundary>
            <ErrorComponent />
          </ErrorBoundary>
          <NormalComponent />
        </div>
      </ErrorBoundary>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: 'ネストしたエラーバウンダリー。内側のエラーバウンダリーがエラーをキャッチし、外側の正常なコンポーネントは影響を受けません。',
      },
    },
  },
}