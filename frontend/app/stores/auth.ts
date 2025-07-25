import { defineStore } from 'pinia'
import { mockAuthService } from '~/services/mockAuth'
import type { 
  User, 
  AuthTokens, 
  LoginCredentials, 
  AuthStatus, 
  TwoFactorStatus,
  LoginResponse,
  RefreshTokenResponse,
  ApiErrorResponse 
} from '~/types/auth'

export interface AuthState {
  user: User | null
  tokens: AuthTokens | null
  status: AuthStatus
  twoFactorStatus: TwoFactorStatus
  error: string | null
  isLoading: boolean
  lastActivity: number
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    tokens: null,
    status: 'idle',
    twoFactorStatus: 'disabled',
    error: null,
    isLoading: false,
    lastActivity: Date.now(),
  }),

  getters: {
    /**
     * 認証済みユーザーかどうか
     */
    isAuthenticated: (state): boolean => {
      return Boolean(state.user && state.tokens && state.status === 'authenticated')
    },

    /**
     * ローディング中かどうか
     */
    isLoadingState: (state): boolean => {
      return state.isLoading || state.status === 'loading'
    },

    /**
     * エラー状態かどうか
     */
    hasError: (state): boolean => {
      return state.status === 'error' && Boolean(state.error)
    },

    /**
     * ユーザーの権限リスト
     */
    permissions: (state): string[] => {
      if (!state.user) return []
      return state.user.permissions.map(p => p.name)
    },

    /**
     * ユーザーのロールリスト
     */
    roles: (state): string[] => {
      if (!state.user) return []
      return state.user.roles.map(r => r.name)
    },

    /**
     * トークンの有効期限チェック
     */
    isTokenExpired: (state): boolean => {
      if (!state.tokens) return true
      
      const now = Math.floor(Date.now() / 1000)
      // トークンの作成時刻 + 有効期限 < 現在時刻ならば期限切れ
      const tokenCreatedAt = Math.floor(state.lastActivity / 1000)
      return (tokenCreatedAt + state.tokens.expiresIn) < now
    },

    /**
     * 2要素認証が必要かどうか
     */
    requiresTwoFactor: (state): boolean => {
      return state.twoFactorStatus === 'required'
    },
  },

  actions: {
    /**
     * ログイン処理
     */
    async login(credentials: LoginCredentials): Promise<void> {
      this.setLoading(true)
      this.clearError()

      try {
        const response = await mockAuthService.login(credentials)

        if (response.requiresTwoFactor) {
          // 2要素認証が必要な場合
          this.twoFactorStatus = 'required'
          this.status = 'unauthenticated'
          // チャレンジ情報を一時保存（実際はセキュアな方法で）
          sessionStorage.setItem('2fa-challenge', response.twoFactorChallenge || '')
        } else {
          // 通常のログイン成功
          this.setAuthData(response.user!, response.tokens!)
          this.status = 'authenticated'
          this.twoFactorStatus = response.user!.twoFactorEnabled ? 'enabled' : 'disabled'
        }
      } catch (error: any) {
        this.handleAuthError(error)
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * 2要素認証確認
     */
    async verifyTwoFactor(token: string): Promise<void> {
      this.setLoading(true)
      this.clearError()

      try {
        const challenge = sessionStorage.getItem('2fa-challenge')
        if (!challenge) {
          throw new Error('2要素認証チャレンジが見つかりません')
        }

        const response = await mockAuthService.verify2FA(challenge, token)

        this.setAuthData(response.user!, response.tokens!)
        this.status = 'authenticated'
        this.twoFactorStatus = 'enabled'
        
        // チャレンジ情報をクリア
        sessionStorage.removeItem('2fa-challenge')
      } catch (error: any) {
        this.handleAuthError(error)
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * ログアウト処理
     */
    async logout(): Promise<void> {
      this.setLoading(true)

      try {
        // サーバーサイドでのセッション無効化
        if (this.tokens?.accessToken) {
          await mockAuthService.logout()
        }
      } catch (error) {
        // ログアウトAPIの失敗は無視（クライアント側はクリアする）
        console.warn('Logout API failed:', error)
      } finally {
        this.clearAuthData()
        this.setLoading(false)
      }
    },

    /**
     * トークンリフレッシュ
     */
    async refreshTokens(): Promise<boolean> {
      if (!this.tokens?.refreshToken) {
        this.clearAuthData()
        return false
      }

      try {
        const response = await mockAuthService.refreshToken(this.tokens.refreshToken)

        this.tokens = response.tokens
        this.updateLastActivity()
        return true
      } catch (error) {
        console.error('Token refresh failed:', error)
        this.clearAuthData()
        return false
      }
    },

    /**
     * ユーザー情報取得
     */
    async fetchUser(): Promise<void> {
      if (!this.tokens?.accessToken) {
        this.status = 'unauthenticated'
        return
      }

      this.setLoading(true)

      try {
        // Mock implementation - decode user from token
        const payload = JSON.parse(atob(this.tokens.accessToken))
        const mockUsers = await import('~/services/mockAuth').then(m => m.MOCK_USERS)
        const user = Object.values(mockUsers).find(u => u.id === payload.userId)
        
        if (!user) {
          throw new Error('User not found')
        }

        this.user = {
          id: user.id,
          email: user.email,
          name: user.name,
          nameKana: user.nameKana,
          roles: user.roles,
          permissions: user.permissions,
          avatar: user.avatar,
          firmId: user.firmId,
          firmName: user.firmName,
          isActive: user.isActive,
          twoFactorEnabled: user.twoFactorEnabled,
          lastLoginAt: user.lastLoginAt,
          profile: user.profile,
          preferences: user.preferences
        }
        this.status = 'authenticated'
        this.updateLastActivity()
      } catch (error: any) {
        if (error.message.includes('token') || error.message.includes('expired')) {
          // トークンが無効な場合、リフレッシュを試行
          const refreshSuccess = await this.refreshTokens()
          if (refreshSuccess) {
            // リフレッシュ成功後、再度ユーザー情報を取得
            await this.fetchUser()
          }
        } else {
          this.handleAuthError(error)
        }
      } finally {
        this.setLoading(false)
      }
    },

    /**
     * 権限チェック
     */
    hasPermission(permission: string): boolean {
      return this.permissions.includes(permission)
    },

    /**
     * ロールチェック
     */
    hasRole(role: string): boolean {
      return this.roles.includes(role)
    },

    /**
     * 複数権限のいずれかを持っているかチェック
     */
    hasAnyPermission(permissions: string[]): boolean {
      return permissions.some(permission => this.hasPermission(permission))
    },

    /**
     * 複数ロールのいずれかを持っているかチェック
     */
    hasAnyRole(roles: string[]): boolean {
      return roles.some(role => this.hasRole(role))
    },

    /**
     * 認証データ設定
     */
    setAuthData(user: User, tokens: AuthTokens): void {
      this.user = user
      this.tokens = tokens
      this.updateLastActivity()
      
      // 永続化
      this.persistAuthData()
    },

    /**
     * 認証データクリア
     */
    clearAuthData(): void {
      this.user = null
      this.tokens = null
      this.status = 'unauthenticated'
      this.twoFactorStatus = 'disabled'
      this.error = null
      this.lastActivity = Date.now()
      
      // 永続化データもクリア
      this.clearPersistedAuthData()
    },

    /**
     * ローディング状態設定
     */
    setLoading(loading: boolean): void {
      this.isLoading = loading
      this.status = loading ? 'loading' : this.status
    },

    /**
     * エラー設定
     */
    setError(error: string): void {
      this.error = error
      this.status = 'error'
    },

    /**
     * エラークリア
     */
    clearError(): void {
      this.error = null
      if (this.status === 'error') {
        this.status = 'idle'
      }
    },

    /**
     * 最終アクティビティ時刻更新
     */
    updateLastActivity(): void {
      this.lastActivity = Date.now()
    },

    /**
     * 認証エラーハンドリング
     */
    handleAuthError(error: any): void {
      let errorMessage = 'ログインに失敗しました'
      
      if (error.data?.error) {
        const apiError = error.data.error as ApiErrorResponse['error']
        errorMessage = apiError.message || errorMessage
      } else if (error.message) {
        errorMessage = error.message
      }

      this.setError(errorMessage)
    },

    /**
     * 認証データの永続化
     */
    persistAuthData(): void {
      if (import.meta.client && this.user && this.tokens) {
        const authData = {
          user: this.user,
          tokens: this.tokens,
          lastActivity: this.lastActivity,
        }
        localStorage.setItem('auth-data', JSON.stringify(authData))
      }
    },

    /**
     * 永続化データの復元
     */
    restoreAuthData(): void {
      // サーバーサイドでは実行しない
      if (import.meta.server) return
      
      try {
        const authDataString = localStorage.getItem('auth-data')
        if (authDataString) {
          const authData = JSON.parse(authDataString)
          
          // データの有効性チェック
          if (authData.user && authData.tokens && authData.lastActivity) {
            this.user = authData.user
            this.tokens = authData.tokens
            this.lastActivity = authData.lastActivity
            
            // トークンの有効期限チェック
            if (!this.isTokenExpired) {
              this.status = 'authenticated'
              this.twoFactorStatus = authData.user.twoFactorEnabled ? 'enabled' : 'disabled'
            } else {
              // トークンが期限切れの場合はクリア
              this.clearAuthData()
            }
          } else {
            // 不正なデータの場合はクリア
            this.clearAuthData()
          }
        } else {
          // データが存在しない場合は未認証状態に
          this.status = 'unauthenticated'
        }
      } catch (error) {
        console.error('Failed to restore auth data:', error)
        this.clearPersistedAuthData()
        this.status = 'unauthenticated'
      }
    },

    /**
     * 永続化データのクリア
     */
    clearPersistedAuthData(): void {
      if (import.meta.client) {
        localStorage.removeItem('auth-data')
      }
    },

    /**
     * 初期化処理
     */
    initialize(): void {
      // クライアントサイドでのみ実行
      if (import.meta.server) return
      
      this.restoreAuthData()
      
      // 定期的なトークンリフレッシュのセットアップ
      this.setupTokenRefresh()
    },

    /**
     * 自動トークンリフレッシュのセットアップ
     */
    setupTokenRefresh(): void {
      // 5分ごとにトークンの有効期限をチェック
      setInterval(() => {
        if (this.isAuthenticated && this.isTokenExpired) {
          this.refreshTokens()
        }
      }, 5 * 60 * 1000) // 5分
    },
  },

  // Pinia永続化プラグインの設定
  persist: {
    key: 'auth-store',
    paths: ['user', 'tokens', 'lastActivity'],
  },
})