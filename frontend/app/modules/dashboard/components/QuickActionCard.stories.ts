import type { Meta, StoryObj } from '@storybook/vue3-vite'
import QuickActionCard from './QuickActionCard.vue'
import type { QuickActionStats } from './QuickActionCard.vue'

// Storybookのメタデータを定義します
const meta: Meta<typeof QuickActionCard> = {
  title: 'Dashboard/Cards/QuickActionCard',
  component: QuickActionCard,
  tags: ['autodocs'], // Storybookの自動ドキュメント生成を有効にします
  argTypes: {
    // 各propsのコントロール方法を定義します
    title: {
      control: 'text',
      description: 'カードのタイトル',
    },
    description: {
      control: 'text',
      description: 'カードの説明文',
    },
    icon: {
      control: 'text',
      description: '表示するアイコン名 (例: "lucide:plus-circle")',
    },
    to: {
      control: 'text',
      description: 'リンク先のパス',
    },
    stats: {
      control: 'object',
      description: '表示する統計情報の配列',
    },
  },
  // Storyをレンダリングする際のラッパーを定義し、見やすくします
  render: (args) => ({
    components: { QuickActionCard },
    setup() {
      return { args };
    },
    template: `
      <div class="p-4 max-w-sm">
        <QuickActionCard v-bind="args" />
      </div>
    `,
  }),
};

export default meta;
type Story = StoryObj<typeof QuickActionCard>;

// 基本的なカードのストーリー
export const Default: Story = {
  args: {
    title: '新しいプロジェクト',
    description: '新しいプロジェクトを作成し、タスクの管理を始めます。',
    icon: 'lucide:plus-circle',
    to: '/projects/new',
    stats: [], // 統計情報なし
  },
};

// 経費カード (Expense)
export const Expense: Story = {
  name: '経費カード (Expense)',
  args: {
    title: '経費',
    description: 'お知らせ',
    icon: 'lucide:credit-card',
    to: '/expenses/new',
    stats: [
      { label: 'Total Expenses', value: 47, trend: 'up' },
      { label: 'This Month', value: 12 }  
    ] as QuickActionStats[],
  }
}

// 実費カード (ActualExpense)
export const ActualExpense: Story = {
  name: '実費カード (Actual Expense)',
  args: {
    title: '実費を登録',
    description: 'お知らせ',
    icon: 'lucide:wallet',
    to: '/actual-expenses/new',
    stats: [
      { label: 'This Month', value: '¥125,000', trend: 'up' },
      { label: 'Pending', value: 3 }  
    ] as QuickActionStats[],
  }
}

// インポートカード (Import)
export const Import: Story = {
  name: 'インポートカード (Import)',
  args: {
    title: 'インポート',
    description: 'お知らせ',
    icon: 'lucide:import',
    to: '/imports/new',
    stats: [
      {label: '', value: ''},
      {label: '', value: ''}
    ] as QuickActionStats[], // 統計情報なし
  }
} 

// エクスポートカード (Export)
export const Export: Story = {
  name: 'エクスポートカード (Export)',
  args: {
    title: 'エクスポート',
    description: 'お知らせ',
    icon: 'lucide:bar-chart-3',
    to: '/exports/new',
    stats: [
      { label: 'Balance', value: '¥892,500', trend: 'up' },
      { label: 'Categories', value: 8 } 
    ] as QuickActionStats[],
  }
}

// 統計情報なしのカード
export const NoStats: Story = {
  name: 'カード without Stats',
  args: {
    title: '新しいプロジェクト',
    description: '新しいプロジェクトを作成し、タスクの管理を始めます。',
    icon: 'lucide:plus-circle',
    to: '/',
    stats: [
      {label: '', value: ''},
      {label: '', value: ''}
    ] as QuickActionStats[], // 統計情報が空の配列
  }
}

// 長いテキストのカード
export const LongText: Story = {
  name: 'カード with Long Text',
  args: {
    title: 'これは非常に長いタイトルの例です。カードのレイアウトがどのように対応するかを確認します。',
    description: 'これは非常に長い説明文の例です。カードのレイアウトがどのように対応するかを確認します。テキストが折り返され、見やすく表示されることを期待しています。',
    icon: 'lucide:info',
    to: '/',
    stats: [
      { label: 'Total Expenses', value: 47, trend: 'up' },
      { label: 'This Month', value: 12 }  
    ] as QuickActionStats[],
  }
}