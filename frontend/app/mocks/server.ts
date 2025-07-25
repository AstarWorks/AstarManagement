import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'

// MSW Server をセットアップ（テスト用）
export const server = setupServer(...authHandlers)