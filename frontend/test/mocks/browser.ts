import { setupWorker } from 'msw/browser'
import { authHandlers } from '../modules/auth/mocks/auth'
import { expenseHandlers } from 'frontend/app/modules/expense/__mocks__/expense'
import { tagHandlers } from 'frontend/app/modules/expense/__mocks__/tag'
import { attachmentHandlers } from 'frontend/app/modules/expense/__mocks__/attachment'

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