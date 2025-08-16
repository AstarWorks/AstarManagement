import { setupServer } from 'msw/node'
import { authHandlers } from '../modules/auth/mocks/auth'
import { expenseHandlers } from 'frontend/app/modules/expense/__mocks__/expense'
import { tagHandlers } from 'frontend/app/modules/expense/__mocks__/tag'
import { attachmentHandlers } from 'frontend/app/modules/expense/__mocks__/attachment'

// MSW Server をセットアップ（テスト用） 
export const server = setupServer(
  ...authHandlers,
  ...expenseHandlers,
  ...tagHandlers,
  ...attachmentHandlers
)