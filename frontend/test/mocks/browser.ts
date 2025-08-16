import { setupWorker } from 'msw/browser'
import { authHandlers } from '~/modules/auth/__mocks__/users'
import { expenseHandlers } from '~/modules/expense/__mocks__/expense'
import { tagHandlers } from '~/modules/expense/__mocks__/tag'
import { attachmentHandlers } from '~/modules/expense/__mocks__/attachment'

// MSW Worker をセットアップ
export const worker = setupWorker(
  ...authHandlers,
  ...expenseHandlers,
  ...tagHandlers,
  ...attachmentHandlers
)

// 開発環境での自動起動
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  })
}