import { setupWorker } from 'msw/browser'
import { authHandlers } from './handlers/auth'
import { expenseHandlers } from './handlers/expense'
import { tagHandlers } from './handlers/tag'
import { attachmentHandlers } from './handlers/attachment'

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