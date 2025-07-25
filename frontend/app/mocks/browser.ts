import { setupWorker } from 'msw/browser'
import { authHandlers } from './handlers/auth'

// MSW Worker をセットアップ
export const worker = setupWorker(...authHandlers)

// 開発環境での自動起動
if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
  worker.start({
    onUnhandledRequest: 'bypass',
    serviceWorker: {
      url: '/mockServiceWorker.js',
    },
  })
}