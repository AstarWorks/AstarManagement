import { http, HttpResponse } from 'msw'
import type { LoginResponse, RefreshTokenResponse, User, AuthTokens } from '@auth/types/auth'

// モックユーザーデータ
const mockUsers: User[] = [
  {
    id: '1',
    email: 'lawyer@example.com',
    name: '田中 太郎',
    nameKana: 'タナカ タロウ',
    avatar: null,
    firmId: 'firm-1',
    firmName: '田中法律事務所',
    isActive: true,
    lastLoginAt: new Date('2024-01-01T00:00:00Z'),
    roles: [
      {
        id: '1',
        name: 'LAWYER',
        displayName: '弁護士',
        description: '法律事務所の弁護士',
        isSystemRole: true,
        permissions: [
          'MATTER_READ',
          'MATTER_WRITE', 
          'CLIENT_READ',
          'CLIENT_WRITE'
        ],
      },
    ],
    permissions: [],
    twoFactorEnabled: false,
    profile: {
      barNumber: '12345',
      department: '民事部',
      specialization: ['民事訴訟', '契約法'],
      phone: '03-1234-5678',
      extension: '101',
      hireDate: '2020-04-01',
    },
    preferences: {
      language: 'ja',
      timezone: 'Asia/Tokyo',
      theme: 'light',
      notifications: {
        email: true,
        browser: true,
        mobile: false,
      },
    },
  },
  {
    id: '2',
    email: 'clerk@example.com',
    name: '佐藤 花子',
    nameKana: 'サトウ ハナコ',
    avatar: null,
    firmId: 'firm-1',
    firmName: '田中法律事務所',
    isActive: true,
    lastLoginAt: new Date('2024-01-01T00:00:00Z'),
    roles: [
      {
        id: '2',
        name: 'CLERK',
        displayName: '事務員',
        description: '法律事務所の事務員',
        isSystemRole: true,
        permissions: [
          'MATTER_READ',
          'CLIENT_READ'
        ],
      },
    ],
    permissions: [],
    twoFactorEnabled: true,
    profile: {
      department: '事務部',
      phone: '03-1234-5678',
      extension: '102',
      hireDate: '2021-06-01',
    },
    preferences: {
      language: 'ja',
      timezone: 'Asia/Tokyo',
      theme: 'light',
      notifications: {
        email: true,
        browser: false,
        mobile: true,
      },
    },
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
    if (!user) {
      return HttpResponse.json(
        {
          error: {
            code: 'USER_NOT_FOUND',
            message: 'ユーザーが見つかりません',
            timestamp: new Date().toISOString(),
            path: '/api/auth/me',
          },
        },
        { status: 404 }
      )
    }

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