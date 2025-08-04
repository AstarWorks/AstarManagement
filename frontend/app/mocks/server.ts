import { setupServer } from 'msw/node'
import { authHandlers } from './handlers/auth'
import { expenseHandlers } from './handlers/expense'
import { tagHandlers } from './handlers/tag'
import { attachmentHandlers } from './handlers/attachment'

// MSW Server をセットアップ（テスト用） 
export const server = setupServer(
  ...authHandlers,
  ...expenseHandlers,
  ...tagHandlers,
  ...attachmentHandlers
)