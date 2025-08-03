/**
 * トークンマネージャー - Simple over Easy
 * 法律事務所向けJWT処理とセキュリティ管理の専門責任
 * 依存関係を最小化した最適化バージョン
 */

import { decodeJwt } from 'jose'
import { JWT_CONFIG } from '~/config/authConfig'
import type { IAuthTokens } from '~/types/auth'
import { z } from 'zod'

/**
 * JWT ペイロードのスキーマ定義
 */
const JWTPayloadSchema = z.object({
  userId: z.string(),
  email: z.string().email(),
  roles: z.array(z.string()),
  permissions: z.array(z.string()),
  iat: z.number(),
  exp: z.number(),
  iss: z.string(),
  aud: z.string(),
})

export type JWTPayload = z.infer<typeof JWTPayloadSchema>

/**
 * トークン管理の結果型
 */
export interface ITokenValidationResult {
  isValid: boolean
  isExpired: boolean
  payload?: JWTPayload
  error?: string
}

/**
 * トークンマネージャーコンポーザブル
 */
export const useTokenManager = () => {
  /**
   * トークンの有効期限をチェック
   */
  const isTokenExpired = (tokens: IAuthTokens | null, lastActivity: number): boolean => {
    if (!tokens) return true
    
    const now = Math.floor(Date.now() / 1000)
    const tokenCreatedAt = Math.floor(lastActivity / 1000)
    
    return (tokenCreatedAt + tokens.expiresIn) < now
  }

  /**
   * JWTペイロードをデコードして検証
   */
  const decodeAndValidateToken = (token: string): ITokenValidationResult => {
    try {
      // まずデコードを試行
      const decoded = decodeJwt(token)
      
      // Zodスキーマで検証
      const parseResult = JWTPayloadSchema.safeParse(decoded)
      
      if (!parseResult.success) {
        return {
          isValid: false,
          isExpired: false,
          error: 'Invalid token payload structure'
        }
      }

      const payload = parseResult.data
      const now = Math.floor(Date.now() / 1000)
      
      // 有効期限チェック
      const isExpired = payload.exp < now
      
      // issuer/audience チェック
      const isIssuerValid = payload.iss === JWT_CONFIG.issuer
      const isAudienceValid = payload.aud === JWT_CONFIG.audience
      
      return {
        isValid: isIssuerValid && isAudienceValid && !isExpired,
        isExpired,
        payload: isExpired ? undefined : payload,
        error: isExpired ? 'Token expired' : 
               !isIssuerValid ? 'Invalid issuer' :
               !isAudienceValid ? 'Invalid audience' : undefined
      }
    } catch (error) {
      return {
        isValid: false,
        isExpired: false,
        error: error instanceof Error ? error.message : 'Token decode failed'
      }
    }
  }

  /**
   * JWTトークンを検証（法律事務所セキュリティ要件対応）
   * 本番環境では署名検証が必要、開発環境ではデコードのみ
   */
  const verifyToken = async (token: string): Promise<ITokenValidationResult> => {
    // 開発環境では簡易検証、本番では厳密検証
    const isDevelopment = process.env.NODE_ENV === 'development'
    
    if (isDevelopment) {
      return decodeAndValidateToken(token)
    }
    
    // 本番環境では外部の署名検証サービスを呼び出し
    // (法律事務所の要件では、セキュリティ監査のため外部検証が必要)
    try {
      interface ITokenVerificationResponse {
        valid: boolean
        payload?: JWTPayload
        error?: string
      }
      
      const verificationResult = await $fetch<ITokenVerificationResponse>('/api/auth/verify-token', {
        method: 'POST',
        body: { token }
      })
      
      if (!verificationResult.valid) {
        return {
          isValid: false,
          isExpired: false,
          error: verificationResult.error || 'Token verification failed'
        }
      }
      
      if (verificationResult.payload) {
        const parseResult = JWTPayloadSchema.safeParse(verificationResult.payload)
        
        if (!parseResult.success) {
          return {
            isValid: false,
            isExpired: false,
            error: 'Invalid token payload structure'
          }
        }
        
        return {
          isValid: true,
          isExpired: false,
          payload: parseResult.data
        }
      } else {
        return {
          isValid: false,
          isExpired: false,
          error: 'No payload in verification response'
        }
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Token verification failed'
      const isExpired = errorMessage.includes('expired') || errorMessage.includes('exp')
      
      return {
        isValid: false,
        isExpired,
        error: errorMessage
      }
    }
  }

  /**
   * トークンの有効性を総合判定
   */
  const validateTokens = async (tokens: IAuthTokens | null, lastActivity: number): Promise<ITokenValidationResult> => {
    if (!tokens?.accessToken) {
      return {
        isValid: false,
        isExpired: true,
        error: 'No access token available'
      }
    }

    // 時刻ベースの有効期限チェック
    if (isTokenExpired(tokens, lastActivity)) {
      return {
        isValid: false,
        isExpired: true,
        error: 'Token expired by time calculation'
      }
    }

    // JWT内容の検証
    return await verifyToken(tokens.accessToken)
  }

  /**
   * トークンリフレッシュが必要かチェック
   */
  const shouldRefreshToken = (tokens: IAuthTokens | null, lastActivity: number): boolean => {
    if (!tokens) return false
    
    const now = Math.floor(Date.now() / 1000)
    const tokenCreatedAt = Math.floor(lastActivity / 1000)
    const expiresAt = tokenCreatedAt + tokens.expiresIn
    
    // 有効期限の5分前になったらリフレッシュ
    const refreshThreshold = 5 * 60 // 5分
    
    return (expiresAt - now) <= refreshThreshold
  }

  /**
   * ユーザーIDをトークンから抽出
   */
  const extractUserIdFromToken = (token: string): string | null => {
    const result = decodeAndValidateToken(token)
    return result.payload?.userId || null
  }

  return {
    isTokenExpired,
    decodeAndValidateToken,
    verifyToken,
    validateTokens,
    shouldRefreshToken,
    extractUserIdFromToken,
  }
}