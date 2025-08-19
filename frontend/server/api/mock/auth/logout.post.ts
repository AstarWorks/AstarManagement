/**
 * Mock logout endpoint for frontend-only development
 */

export default defineEventHandler(async (_event) => {
  try {
    // Mock環境では特別な処理は不要
    // クライアント側でトークンを削除すれば十分
    
    return {
      success: true,
      message: 'Logged out successfully'
    }
  } catch {
    throw createError({
      statusCode: 500,
      statusMessage: 'Internal server error'
    })
  }
})