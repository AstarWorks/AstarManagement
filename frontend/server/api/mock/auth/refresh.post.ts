/**
 * Mock token refresh endpoint for frontend-only development
 */

import { mockUsers, createMockToken, createMockRefreshToken } from './mockData'

export default defineEventHandler(async (event) => {
  try {
    // リクエストボディを取得
    const body = await readBody(event)
    
    if (!body.refreshToken) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Refresh token is required'
      })
    }

    // リフレッシュトークンの検証（簡易）
    if (!body.refreshToken.startsWith('refresh.')) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid refresh token format'
      })
    }

    try {
      // リフレッシュトークンからユーザーIDを抽出
      const [, encodedData] = body.refreshToken.split('.')
      const decodedData = atob(encodedData)
      
      // ユーザーIDを抽出（timestampも含まれているので最初の部分のみ）
      const userId = decodedData.replace(/\d+$/, '')
      
      // ユーザー検索
      const user = mockUsers.find(u => u.id === userId)
      if (!user) {
        throw createError({
          statusCode: 401,
          statusMessage: 'User not found'
        })
      }

      // 新しいトークンを生成
      const newToken = createMockToken(user)
      const newRefreshToken = createMockRefreshToken(user)

      return {
        token: newToken,
        refreshToken: newRefreshToken,
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
          tenantId: user.tenantId,
          tenantSlug: user.tenantSlug,
          plan: user.plan
        }
      }
    } catch {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid refresh token'
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