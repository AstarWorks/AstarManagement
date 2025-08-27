import type { Meta, StoryObj } from '@storybook/vue3-vite'
import QuickActionCard from './QuickActionCard.vue'
import type { QuickActionStats } from './QuickActionCard.vue'

// Storybookのメタデータを定義します
const meta: Meta<typeof QuickActionCard> = {
  title: 'Components/Cards/QuickActionCard',
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

// 1. 基本的なカードのストーリー
export const Default: Story = {
  args: {
    title: '新しいプロジェクト',
    description: '新しいプロジェクトを作成し、タスクの管理を始めます。',
    icon: 'lucide:plus-circle',
    to: '/projects/new',
    stats: [], // 統計情報なし
  },
};

// 2. 統計情報を持つカードのストーリー
export const WithStats: Story = {
  args: {
    ...Default.args, // Defaultの引数を継承
    title: '今月の売上',
    description: '今月の売上実績と前月比のトレンドを確認します。',
    icon: 'lucide:dollar-sign',
    to: '/sales/monthly',
    stats: [
      { label: '総売上', value: '¥1,250,000', trend: 'up' },
      { label: '新規顧客', value: 82, trend: 'down' },
      { label: 'コンバージョン率', value: '3.5%', trend: 'neutral' },
    ] as QuickActionStats[],
  },
};

// 3. 長いテキストを持つカードのストーリー
export const WithLongText: Story = {
  args: {
    ...WithStats.args, // WithStatsの引数を継承
    title: '非常に長くて詳細なタイトルがここに表示される場合のテスト',
    description: 'これは説明文の例です。このテキストはカードのレイアウトが長いコンテンツをどのように処理するかをテストするために意図的に長く作られています。改行やテキストの折り返しが正しく行われるか確認しましょう。',
    icon: 'lucide:file-text',
    to: '/reports/long-text-example',
  },
};