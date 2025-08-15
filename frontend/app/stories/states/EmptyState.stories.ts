import type { Meta, StoryObj } from '@storybook/vue3'
import { action } from '@storybook/addon-actions'
import { FileText, Search, Filter } from 'lucide-vue-next'
import EmptyState from '@shared/components/states/EmptyState.vue'

const meta: Meta<typeof EmptyState> = {
  title: 'States/EmptyState',
  component: EmptyState,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
汎用的な空状態表示コンポーネント。データがない場合やフィルター結果が空の場合に使用します。

## 機能
- カスタマイズ可能なタイトル・説明文
- アイコン表示（絵文字またはLucideコンポーネント）
- プライマリ・セカンダリアクションボタン
- コンパクト表示モード
- スロットによる拡張

## 使用場面
- データが存在しない初期状態
- 検索結果が0件の場合
- フィルター条件に該当するデータがない場合
- 削除後の空リスト
        `,
      },
    },
    backgrounds: {
      default: 'legal-gray',
    },
  },
  tags: ['autodocs'],
  argTypes: {
    title: {
      control: 'text',
      description: 'タイトルテキスト',
    },
    description: {
      control: 'text',
      description: '説明テキスト',
    },
    icon: {
      control: 'text',
      description: 'アイコン（絵文字）',
    },
    compact: {
      control: 'boolean',
      description: 'コンパクト表示',
    },
  },
  args: {
    title: 'データがありません',
    description: 'まだデータが登録されていません。',
    icon: '📄',
    compact: false,
  },
}

export default meta
type Story = StoryObj<typeof meta>

// デフォルト
export const Default: Story = {
  args: {},
}

// アクション付き
export const WithActions: Story = {
  args: {
    title: '実費データがありません',
    description: '最初の実費を記録して、支出管理を始めましょう。',
    icon: '💰',
    primaryAction: {
      label: '実費を追加',
      onClick: action('primary-action-clicked'),
      variant: 'default',
    },
    secondaryActions: [
      {
        label: 'サンプルデータを読み込む',
        onClick: action('secondary-action-clicked'),
        variant: 'outline',
      },
      {
        label: 'ヘルプを見る',
        onClick: action('help-clicked'),
        variant: 'ghost',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'プライマリアクションとセカンダリアクション付きの空状態。ユーザーが次に何をすべきかを明確に示します。',
      },
    },
  },
}

// Lucideアイコン使用
export const WithLucideIcon: Story = {
  args: {
    title: '検索結果がありません',
    description: '検索条件を変更してお試しください。',
    icon: Search,
    primaryAction: {
      label: '検索条件をクリア',
      onClick: action('clear-search'),
      variant: 'outline',
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'Lucide Vueアイコンを使用した空状態。より洗練されたデザインになります。',
      },
    },
  },
}

// コンパクト表示
export const Compact: Story = {
  args: {
    title: 'タスクがありません',
    description: '今日のタスクは完了しました。',
    icon: '✅',
    compact: true,
    primaryAction: {
      label: '新しいタスクを追加',
      onClick: action('add-task'),
    },
  },
  parameters: {
    docs: {
      description: {
        story: 'コンパクト表示モード。サイドバーや小さなセクション内での使用に適しています。',
      },
    },
    layout: 'padded',
  },
}

// フィルター結果が空
export const FilteredEmpty: Story = {
  args: {
    title: 'フィルター結果がありません',
    description: '選択した条件に一致するデータがありません。',
    icon: Filter,
    primaryAction: {
      label: 'フィルターをクリア',
      onClick: action('clear-filters'),
      variant: 'outline',
    },
    secondaryActions: [
      {
        label: 'フィルターを変更',
        onClick: action('modify-filters'),
        variant: 'ghost',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'フィルター適用後にデータが0件になった場合の表示例。',
      },
    },
  },
}

// 削除後の空状態
export const AfterDeletion: Story = {
  args: {
    title: 'すべて削除されました',
    description: 'リストからすべてのアイテムが削除されました。',
    icon: '🗑️',
    primaryAction: {
      label: '新しいアイテムを追加',
      onClick: action('add-new'),
    },
    secondaryActions: [
      {
        label: '削除を元に戻す',
        onClick: action('undo-delete'),
        variant: 'outline',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'データ削除後の空状態。元に戻すオプションを提供します。',
      },
    },
  },
}

// エラー状態風の空状態
export const ErrorStyle: Story = {
  args: {
    title: 'データを読み込めませんでした',
    description: 'サーバーに接続できません。インターネット接続を確認してください。',
    icon: '⚠️',
    primaryAction: {
      label: '再試行',
      onClick: action('retry'),
      variant: 'default',
    },
    secondaryActions: [
      {
        label: 'オフラインで続行',
        onClick: action('offline-mode'),
        variant: 'ghost',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: 'エラー状態に近い空状態。データ取得の失敗などで使用。',
      },
    },
  },
}

// 長いテキスト
export const LongText: Story = {
  args: {
    title: '法律事務所管理システムへようこそ',
    description: 'Astar Managementは、小中規模法律事務所向けの包括的な業務管理システムです。案件管理、顧客管理、文書管理、請求管理などの機能を統合し、効率的な法律実務をサポートします。まずは最初の案件を登録して、システムの活用を始めましょう。',
    icon: FileText,
    primaryAction: {
      label: '最初の案件を作成',
      onClick: action('create-first-case'),
    },
    secondaryActions: [
      {
        label: 'チュートリアルを見る',
        onClick: action('view-tutorial'),
        variant: 'outline',
      },
      {
        label: 'サンプルデータをインポート',
        onClick: action('import-sample'),
        variant: 'ghost',
      },
    ],
  },
  parameters: {
    docs: {
      description: {
        story: '長いタイトルと説明文の表示例。適切にレイアウトされることを確認します。',
      },
    },
  },
}

// モバイル表示
export const Mobile: Story = {
  args: {
    title: 'メッセージがありません',
    description: '新しいメッセージが届くとここに表示されます。',
    icon: '💬',
    primaryAction: {
      label: 'メッセージを送信',
      onClick: action('send-message'),
    },
  },
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'モバイルデバイスでの表示例',
      },
    },
  },
}

// ダークテーマ
export const DarkTheme: Story = {
  args: {
    title: 'ダークモード対応',
    description: 'ダークテーマでも適切に表示されます。',
    icon: '🌙',
    primaryAction: {
      label: 'アクション',
      onClick: action('dark-action'),
    },
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