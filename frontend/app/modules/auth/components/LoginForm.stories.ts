import type { Meta, StoryObj } from '@storybook/vue3'
import { within, userEvent, expect } from 'storybook/test'
import LoginForm from './LoginForm.vue'

const meta: Meta<typeof LoginForm> = {
  title: 'Auth/LoginForm',
  component: LoginForm,
  parameters: {
    layout: 'centered',
    docs: {
      description: {
        component: `
Astar Management法律事務所業務管理システムのログインフォーム。

## 機能
- メールアドレス・パスワードによる認証
- バリデーション（VeeValidate + Zod）
- パスワード表示/非表示切り替え
- Remember Me機能
- ローディング状態表示
- エラーメッセージ表示

## 使用技術
- VeeValidate + Zod: フォームバリデーション
- shadcn-vue: UIコンポーネント
- Lucide Vue Next: アイコン
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
    isLoading: {
      control: 'boolean',
      description: 'ローディング状態',
    },
    authError: {
      control: 'text',
      description: '認証エラーメッセージ',
    },
  },
  args: {
    isLoading: false,
    authError: '',
  },
}

export default meta
type Story = StoryObj<typeof meta>

// デフォルトストーリー
export const Default: Story = {
  args: {},
}

// ローディング状態
export const Loading: Story = {
  args: {
    isLoading: true,
  },
  parameters: {
    docs: {
      description: {
        story: 'ログイン処理中の状態を表示します。',
      },
    },
  },
}

// エラー状態
export const WithError: Story = {
  args: {
    authError: 'メールアドレスまたはパスワードが正しくありません',
  },
  parameters: {
    docs: {
      description: {
        story: '認証エラーが発生した状態を表示します。',
      },
    },
  },
}

// バリデーションエラー
export const ValidationError: Story = {
  parameters: {
    docs: {
      description: {
        story: 'フォームバリデーションエラーの表示例です。',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 無効なメールアドレスを入力
    const emailInput = canvas.getByLabelText('メールアドレス')
    await userEvent.type(emailInput, 'invalid-email')

    // 短すぎるパスワードを入力
    const passwordInput = canvas.getByLabelText('パスワード')
    await userEvent.type(passwordInput, '123')

    // フォーカスを外してバリデーションを発火
    await userEvent.click(canvas.getByText('Astar Management'))

    // バリデーションエラーメッセージを確認
    await expect(canvas.getByText('有効なメールアドレスを入力してください')).toBeInTheDocument()
    await expect(canvas.getByText('パスワードは8文字以上で入力してください')).toBeInTheDocument()
  },
}

// 正常な入力フロー
export const ValidInput: Story = {
  parameters: {
    docs: {
      description: {
        story: '正常な入力を行った状態です。',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // 有効なメールアドレスを入力
    const emailInput = canvas.getByLabelText('メールアドレス')
    await userEvent.type(emailInput, 'lawyer@example.com')

    // 有効なパスワードを入力
    const passwordInput = canvas.getByLabelText('パスワード')
    await userEvent.type(passwordInput, 'password123')

    // Remember Me をチェック
    const rememberMeCheckbox = canvas.getByLabelText('ログイン状態を保持する')
    await userEvent.click(rememberMeCheckbox)

    // ログインボタンが有効になることを確認
    const loginButton = canvas.getByRole('button', { name: /ログイン/ })
    await expect(loginButton).not.toBeDisabled()
  },
}

// パスワード表示/非表示切り替え
export const PasswordToggle: Story = {
  parameters: {
    docs: {
      description: {
        story: 'パスワードの表示/非表示切り替え機能のテストです。',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // パスワードを入力
    const passwordInput = canvas.getByLabelText('パスワード')
    await userEvent.type(passwordInput, 'secretpassword')

    // 初期状態ではパスワードが隠されている
    await expect(passwordInput).toHaveAttribute('type', 'password')

    // パスワード表示ボタンをクリック
    const toggleButton = canvas.getByRole('button', { name: /パスワードを表示/ })
    await userEvent.click(toggleButton)

    // パスワードが表示される
    await expect(passwordInput).toHaveAttribute('type', 'text')

    // もう一度クリックして非表示に戻す
    const hideButton = canvas.getByRole('button', { name: /パスワードを隠す/ })
    await userEvent.click(hideButton)

    // パスワードが隠される
    await expect(passwordInput).toHaveAttribute('type', 'password')
  },
}

// フォーカス管理
export const FocusManagement: Story = {
  parameters: {
    docs: {
      description: {
        story: 'コンポーネント マウント時にメールフィールドにフォーカスが当たることを確認します。',
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)
    
    // メールフィールドにフォーカスが当たっていることを確認
    const emailInput = canvas.getByLabelText('メールアドレス')
    await expect(emailInput).toHaveFocus()
  },
}

// レスポンシブデザイン (モバイル)
export const Mobile: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'mobile1',
    },
    docs: {
      description: {
        story: 'モバイルデバイスでの表示例です。',
      },
    },
  },
  args: {},
}

// レスポンシブデザイン (タブレット)
export const Tablet: Story = {
  parameters: {
    viewport: {
      defaultViewport: 'tablet',
    },
    docs: {
      description: {
        story: 'タブレットデバイスでの表示例です。',
      },
    },
  },
  args: {},
}

// ダークテーマ
export const DarkTheme: Story = {
  parameters: {
    backgrounds: {
      default: 'dark',
    },
    docs: {
      description: {
        story: 'ダークテーマでの表示例です。',
      },
    },
  },
  args: {},
}

// 極端に長いエラーメッセージ
export const LongErrorMessage: Story = {
  args: {
    authError: 'システムエラーが発生しました。管理者に連絡してください。詳細: ネットワーク接続に問題があるか、サーバーが一時的に利用できない状態です。しばらく時間をおいてから再度お試しください。',
  },
  parameters: {
    docs: {
      description: {
        story: '長いエラーメッセージが適切に表示されることを確認します。',
      },
    },
  },
}

// Mock認証サービステスト用（本物の認証情報）
export const MockAuthenticationTest: Story = {
  parameters: {
    docs: {
      description: {
        story: `
Mock認証サービスをテストするためのストーリーです。

**テスト用認証情報:**
- 弁護士: tanaka@astellaw.co.jp / SecurePass123!
- 上級事務員: sato@astellaw.co.jp / SecurePass123! (2FA有効)
- 事務員: yamada@astellaw.co.jp / SecurePass123!
- 依頼者: client@example.com / ClientPass123!
        `,
      },
    },
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement)

    // Fill with valid lawyer credentials
    const emailInput = canvas.getByLabelText('メールアドレス')
    await userEvent.type(emailInput, 'tanaka@astellaw.co.jp')

    const passwordInput = canvas.getByLabelText('パスワード')
    await userEvent.type(passwordInput, 'SecurePass123!')

    // Enable remember me
    const rememberMeCheckbox = canvas.getByLabelText('ログイン状態を保持する')
    await userEvent.click(rememberMeCheckbox)
  },
}