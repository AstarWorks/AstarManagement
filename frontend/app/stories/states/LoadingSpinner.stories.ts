import type { Meta, StoryObj } from '@storybook/vue3'
import LoadingSpinner from '@shared/components/states/LoadingSpinner.vue'

const meta: Meta<typeof LoadingSpinner> = {
  title: 'States/LoadingSpinner',
  component: LoadingSpinner,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
汎用的なローディングスピナーコンポーネント。

## 機能
- サイズ変更 (sm/md/lg)
- カラーバリエーション (primary/secondary/muted)
- ラベル表示
- インライン表示対応

## 使用場面
- データ読み込み中
- API通信中
- ファイルアップロード中
- フォーム送信中
        `,
      },
    },
    backgrounds: {
      values: [
        { name: 'light', value: '#ffffff' },
        { name: 'legal-gray', value: '#f8f9fa' },
        { name: 'dark', value: '#1a1a1a' },
      ],
      default: 'legal-gray',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    size: {
      control: 'select',
      options: ['sm', 'md', 'lg'],
      description: 'スピナーのサイズ',
    },
    variant: {
      control: 'select', 
      options: ['primary', 'secondary', 'muted'],
      description: 'カラーバリエーション',
    },
    label: {
      control: 'text',
      description: 'ローディングラベル',
    },
    inline: {
      control: 'boolean',
      description: 'インライン表示',
    },
  },
  args: {
    size: 'md',
    variant: 'primary',
    inline: false,
  },
}

export default meta
type Story = StoryObj<typeof meta>

// デフォルト
export const Default: Story = {
  args: {},
}

// サイズバリエーション
export const Small: Story = {
  args: {
    size: 'sm',
  },
  parameters: {
    docs: {
      description: {
        story: '小さいサイズのスピナー。ボタン内での使用に適しています。',
      },
    },
  },
}

export const Large: Story = {
  args: {
    size: 'lg',
  },
  parameters: {
    docs: {
      description: {
        story: '大きいサイズのスピナー。メインローディング表示に適しています。',
      },
    },
  },
}

// カラーバリエーション
export const Secondary: Story = {
  args: {
    variant: 'secondary',
  },
  parameters: {
    docs: {
      description: {
        story: 'セカンダリカラーのスピナー。',
      },
    },
  },
}

export const Muted: Story = {
  args: {
    variant: 'muted',
  },
  parameters: {
    docs: {
      description: {
        story: 'ミュートカラーのスピナー。控えめな表示に使用。',
      },
    },
  },
}

// ラベル付き
export const WithLabel: Story = {
  args: {
    label: 'データを読み込んでいます...',
  },
  parameters: {
    docs: {
      description: {
        story: 'ラベル付きのスピナー。ユーザーに何が起きているかを伝えます。',
      },
    },
  },
}

// インライン表示
export const Inline: Story = {
  args: {
    size: 'sm',
    inline: true,
    label: '処理中',
  },
  parameters: {
    docs: {
      description: {
        story: 'インライン表示のスピナー。テキスト内での使用に適しています。',
      },
    },
  },
  decorators: [
    () => ({
      template: '<div>この文章の後に <story /> が表示されます。</div>',
    }),
  ],
}

// サイズ比較
export const SizeComparison: Story = {
  render: () => ({
    components: { LoadingSpinner },
    template: `
      <div class="flex items-center gap-8">
        <div class="text-center">
          <LoadingSpinner size="sm" />
          <p class="mt-2 text-sm">Small</p>
        </div>
        <div class="text-center">
          <LoadingSpinner size="md" />
          <p class="mt-2 text-sm">Medium</p>
        </div>
        <div class="text-center">
          <LoadingSpinner size="lg" />
          <p class="mt-2 text-sm">Large</p>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: '全サイズの比較表示',
      },
    },
  },
}

// カラー比較
export const ColorComparison: Story = {
  render: () => ({
    components: { LoadingSpinner },
    template: `
      <div class="flex items-center gap-8">
        <div class="text-center">
          <LoadingSpinner variant="primary" />
          <p class="mt-2 text-sm">Primary</p>
        </div>
        <div class="text-center">
          <LoadingSpinner variant="secondary" />
          <p class="mt-2 text-sm">Secondary</p>
        </div>
        <div class="text-center">
          <LoadingSpinner variant="muted" />
          <p class="mt-2 text-sm">Muted</p>
        </div>
      </div>
    `,
  }),
  parameters: {
    docs: {
      description: {
        story: '全カラーバリエーションの比較表示',
      },
    },
  },
}

// ダークテーマ
export const DarkTheme: Story = {
  args: {
    label: '読み込み中...',
  },
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'ダークテーマでの表示例',
      },
    },
  },
}