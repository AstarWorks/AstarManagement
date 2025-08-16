import { setupServer } from 'msw/node'
import { authHandlers } from '~/modules/auth/__mocks__/users'
import { expenseHandlers } from '~/modules/expense/__mocks__/expense'
import { tagHandlers } from '~/modules/expense/__mocks__/tag'
import { attachmentHandlers } from '~/modules/expense/__mocks__/attachment'

// MSW Server をセットアップ（テスト用） 
export const server = setupServer(
  ...authHandlers,
  ...expenseHandlers,
  ...tagHandlers,
  ...attachmentHandlers
)