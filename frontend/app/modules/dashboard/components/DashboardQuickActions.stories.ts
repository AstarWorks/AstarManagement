import type { Meta, StoryObj } from '@storybook/vue3'
import DashboardQuickActions from './DashboardQuickActions.vue'

// コンポーネントのメタ情報を定義
const meta: Meta<typeof DashboardQuickActions> = {
  title: 'Dashboard/DashboardQuickActions',
  component: DashboardQuickActions,
  tags: ['autodocs'],
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

// デフォルトストーリーもpropsを使うように変更
export const Default: Story = {
  args: {
    listStats: [
      { label: 'Total Expenses', value: 47, trend: 'up' },
      { label: 'This Month', value: 12 }
    ],
    expenseStats: [
      { label: 'This Month', value: '¥125,000', trend: 'up' },
      { label: 'Pending', value: 3 }
    ],
    reportStats: [
      { label: 'Balance', value: '¥892,500', trend: 'up' },
      { label: 'Categories', value: 8 }
    ]
  }
}

// ✨ NEW ✨: データが空の配列の場合
export const NoData: Story = {
  name: '空の状態 (No Data)',
 args: {
    listStats: [
      { label: 'Total Expenses', value: '' , trend: 'neutral' },
      { label: 'This Month', value: '' }
    ],
    expenseStats: [
      { label: 'This Month', value: '', trend: 'neutral' },
      { label: 'Pending', value: '' }
    ],
    reportStats: [
      { label: 'Balance', value: '', trend: 'neutral' },
      { label: 'Categories', value: '' }
    ]
  }
}

export const WithVariousTrends: Story = {
  name: '様々なトレンド表示',
  args: {
    listStats: [
      { label: 'Profit', value: '¥50,000', trend: 'up' },
      { label: 'Costs', value: '¥30,000', trend: 'down' }
    ],
    expenseStats: [
      { label: 'Active Users', value: 150, trend: 'neutral' },
      { label: 'New Signups', value: 25 } // trendなし
    ],
    reportStats: [
      { label: 'Server Load', value: '80%', trend: 'down' },
      { label: 'Uptime', value: '99.9%', trend: 'up' }
    ]
  }
}

export const WithLongText: Story = {
  name: '長いテキストの表示',
  args: {
    listStats: [
      { label: '先月から継続しているアクティブユーザーの合計数', value: 9999 },
      { label: '今月のコンバージョン率', value: '88.88%' }
    ],
    expenseStats: [
      { label: '非常に長いラベルを持つ経費の合計金額', value: '¥999,999,999,999' },
      { label: '保留中の申請', value: 123 }
    ],
    reportStats: [
      { label: 'Server Load', value: '80%', trend: 'down' },
      { label: 'Uptime', value: '99.9%', trend: 'up' }
    ]
  }
}
