import type { Meta, StoryObj } from '@storybook/vue3'
import DashboardQuickActions from './DashboardQuickActions.vue'

// コンポーネントのメタ情報を定義
const meta: Meta<typeof DashboardQuickActions> = {
  title: 'Modules/Dashboard/Sections/DashboardQuickActions',
  component: DashboardQuickActions,
  parameters: {
    // ストーリーがページ全体に表示されるようにレイアウトを調整
    layout: 'fullscreen',
  },
  // グローバルな依存関係をモックするためのデコレーター
  decorators: [
    (story) => ({
      components: { story },
      template: '<div class="p-8"><story /></div>',
      // Nuxtのi18nプラグインが提供する $t 関数をモック化
      // これにより、コンポーネントがエラーなくレンダリングされる
      global: {
        mocks: {
          $t: (key: string) => key, // 翻訳キーをそのまま表示するシンプルなモック
        },
      },
    }),
  ],
}

export default meta
type Story = StoryObj<typeof meta>

// 基本的な表示を確認するためのデフォルトストーリー
export const Default: Story = {}