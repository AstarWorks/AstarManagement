import { http, HttpResponse } from 'msw'
import type { LoginResponse, RefreshTokenResponse, User, AuthTokens } from '~/types/auth'

// モックユーザーデータ
const mockUsers: User[] = [
  {
    id: '1',
    email: 'lawyer@example.com',
    name: '田中 太郎',
    roles: [
      {
        id: '1',
        name: 'LAWYER',
        displayName: '弁護士',
        description: '法律事務所の弁護士',
        permissions: [
          {
            id: '1',
            name: 'MATTER_READ',
            displayName: '案件閲覧',
            description: '案件情報を閲覧できる',
            resource: 'matter',
            action: 'read',
          },
          {
            id: '2',
            name: 'MATTER_WRITE',
            displayName: '案件編集',
            description: '案件情報を編集できる',
            resource: 'matter',
            action: 'write',
          },
          {
            id: '3',
            name: 'CLIENT_READ',
            displayName: '依頼者閲覧',
            description: '依頼者情報を閲覧できる',
            resource: 'client',
            action: 'read',
          },
          {
            id: '4',
            name: 'CLIENT_WRITE',
            displayName: '依頼者編集',
            description: '依頼者情報を編集できる',
            resource: 'client',
            action: 'write',
          },
        ],
      },
    ],
    permissions: [],
    twoFactorEnabled: false,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
  {
    id: '2',
    email: 'clerk@example.com',
    name: '佐藤 花子',
    roles: [
      {
        id: '2',
        name: 'CLERK',
        displayName: '事務員',
        description: '法律事務所の事務員',
        permissions: [
          {
            id: '1',
            name: 'MATTER_READ',
            displayName: '案件閲覧',
            description: '案件情報を閲覧できる',
            resource: 'matter',
            action: 'read',
          },
          {
            id: '3',
            name: 'CLIENT_READ',
            displayName: '依頼者閲覧',
            description: '依頼者情報を閲覧できる',
            resource: 'client',
            action: 'read',
          },
        ],
      },
    ],
    permissions: [],
    twoFactorEnabled: true,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z',
  },
]

// モック認証トークン生成
const generateMockTokens = (): AuthTokens => ({
  accessToken: 'mock-access-token-' + Date.now(),
  refreshToken: 'mock-refresh-token-' + Date.now(),
  expiresIn: 3600, // 1時間
  tokenType: 'Bearer',
})

// 認証関連のMSWハンドラー
export const authHandlers = [
  // ログイン
  http.post('/api/auth/login', async ({ request }) => {
    const body = await request.json() as { email: string; password: string; rememberMe?: boolean }

    // バリデーション
    if (!body.email || !body.password) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'メールアドレスとパスワードは必須です',
            timestamp: new Date().toISOString(),
            path: '/api/auth/login',
          },
        },
        { status: 400 }
      )
    }

    // ユーザー検索
    const user = mockUsers.find(u => u.email === body.email)

    // 認証失敗のシミュレート
    if (!user || body.password !== 'password123') {
      return HttpResponse.json(
        {
          error: {
            code: 'INVALID_CREDENTIALS',
            message: 'メールアドレスまたはパスワードが正しくありません',
            timestamp: new Date().toISOString(),
            path: '/api/auth/login',
          },
        },
        { status: 401 }
      )
    }

    // 2要素認証が有効な場合
    if (user.twoFactorEnabled) {
      return HttpResponse.json({
        requiresTwoFactor: true,
        twoFactorChallenge: 'mock-2fa-challenge-' + Date.now(),
      } as Partial<LoginResponse>)
    }

    // 成功レスポンス
    const tokens = generateMockTokens()
    return HttpResponse.json({
      user: {
        ...user,
        permissions: user.roles.flatMap(role => role.permissions),
      },
      tokens,
    } as LoginResponse)
  }),

  // 2要素認証確認
  http.post('/api/auth/verify-2fa', async ({ request }) => {
    const body = await request.json() as { challenge: string; token: string }

    // 簡単な2FAトークン検証（実際は6桁の数字）
    if (body.token !== '123456') {
      return HttpResponse.json(
        {
          error: {
            code: 'INVALID_2FA_TOKEN',
            message: '認証コードが正しくありません',
            timestamp: new Date().toISOString(),
            path: '/api/auth/verify-2fa',
          },
        },
        { status: 401 }
      )
    }

    // 2FA対応ユーザーを返す（事務員）
    const user = mockUsers.find(u => u.twoFactorEnabled)!
    const tokens = generateMockTokens()

    return HttpResponse.json({
      user: {
        ...user,
        permissions: user.roles.flatMap(role => role.permissions),
      },
      tokens,
    } as LoginResponse)
  }),

  // トークンリフレッシュ
  http.post('/api/auth/refresh', async ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          error: {
            code: 'MISSING_TOKEN',
            message: 'リフレッシュトークンが必要です',
            timestamp: new Date().toISOString(),
            path: '/api/auth/refresh',
          },
        },
        { status: 401 }
      )
    }

    const tokens = generateMockTokens()
    return HttpResponse.json({ tokens } as RefreshTokenResponse)
  }),

  // ログアウト
  http.post('/api/auth/logout', () => {
    return HttpResponse.json({ message: 'ログアウトしました' })
  }),

  // ユーザー情報取得
  http.get('/api/auth/me', ({ request }) => {
    const authHeader = request.headers.get('Authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return HttpResponse.json(
        {
          error: {
            code: 'UNAUTHORIZED',
            message: '認証が必要です',
            timestamp: new Date().toISOString(),
            path: '/api/auth/me',
          },
        },
        { status: 401 }
      )
    }

    // デフォルトで弁護士ユーザーを返す
    const user = mockUsers[0]
    return HttpResponse.json({
      ...user,
      permissions: user.roles.flatMap(role => role.permissions),
    })
  }),

  // パスワードリセット要求
  http.post('/api/auth/forgot-password', async ({ request }) => {
    const body = await request.json() as { email: string }

    if (!body.email) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'メールアドレスは必須です',
            timestamp: new Date().toISOString(),
            path: '/api/auth/forgot-password',
          },
        },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      message: 'パスワードリセットメールを送信しました',
      success: true,
    })
  }),

  // パスワードリセット
  http.post('/api/auth/reset-password', async ({ request }) => {
    const body = await request.json() as { token: string; newPassword: string }

    if (!body.token || !body.newPassword) {
      return HttpResponse.json(
        {
          error: {
            code: 'VALIDATION_ERROR',
            message: 'トークンと新しいパスワードは必須です',
            timestamp: new Date().toISOString(),
            path: '/api/auth/reset-password',
          },
        },
        { status: 400 }
      )
    }

    return HttpResponse.json({
      message: 'パスワードがリセットされました',
      success: true,
    })
  }),
]