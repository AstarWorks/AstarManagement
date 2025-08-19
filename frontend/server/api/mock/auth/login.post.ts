/**
 * Mock login endpoint for frontend-only development
 */

import { findUserByEmail, validatePassword, createMockToken, createMockRefreshToken } from './mockData'

export default defineEventHandler(async (event) => {
  try {
    // リクエストボディを取得
    const body = await readBody(event)
    
    // 必須フィールドの検証
    if (!body.email || !body.password) {
      throw createError({
        statusCode: 400,
        statusMessage: 'Email and password are required'
      })
    }

    // ユーザー検索
    const user = findUserByEmail(body.email)
    if (!user) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    // パスワード検証
    if (!validatePassword(user, body.password)) {
      throw createError({
        statusCode: 401,
        statusMessage: 'Invalid credentials'
      })
    }

    // トークン生成
    const token = createMockToken(user)
    const refreshToken = createMockRefreshToken(user)

    // レスポンス（Sidebase Authの期待する形式）
    return {
      token,
      refreshToken,
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
  } catch (error) {
    // エラーハンドリング
    if (error instanceof Error && 'statusCode' in error) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})