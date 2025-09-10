import type { Meta, StoryObj } from '@storybook/vue3'
import LayoutAgent from './LayoutAgent.vue'

// コンポーネントのメタ情報を定義
const meta: Meta<typeof LayoutAgent> = {
    title: 'Agent/AgentHeader',
    component: LayoutAgent,
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
export const Default: Story = {}