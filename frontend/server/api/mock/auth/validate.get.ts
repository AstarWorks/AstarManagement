/**
 * Mock session validation endpoint for frontend-only development
 */

import { mockUsers } from './mockData'

export default defineEventHandler(async (event) => {
  try {
    // Authorizationヘッダーを取得
    const authHeader = getHeader(event, 'authorization')
    
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Authorization header missing or invalid'
      })
    }

    // トークンを取得（Bearer プレフィックスを除去）
    const token = authHeader.substring(7)
    
    // Mock JWT の検証（本物のJWTではないので簡易検証）
    if (!token.startsWith('mock.')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token format'
      })
    }

    try {
      // トークンからペイロードを取得
      const [, payloadBase64] = token.split('.')
      const payload = JSON.parse(atob(payloadBase64!))
      
      // 有効期限チェック
      if (payload.exp && payload.exp < Math.floor(Date.now() / 1000)) {
        throw createError({
          statusCode: 401,
          statusMessage: 'Token expired'
        })
      }

      // ユーザー情報を返す
      const user = mockUsers.find(u => u.id === payload.sub)
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: 'User not found'
        })
      }

      return {
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenantSlug,
          plan: user.plan
        },
        valid: true
      }
    } catch {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid token'
      })
    }
  } catch (error) {
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})