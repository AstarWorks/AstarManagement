'use client'

import { useEffect, useState } from 'react'

export function MockServiceWorkerProvider({ children }: { children: React.ReactNode }) {
  const [mockReady, setMockReady] = useState(false)

  useEffect(() => {
    const enableMocks = process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true'
    
    if (typeof window !== 'undefined' && enableMocks) {
      import('../mocks/browser').then(({ worker }) => {
        worker.start({
          onUnhandledRequest: 'bypass',
          serviceWorker: {
            url: '/mockServiceWorker.js'
          }
        }).then(() => {
          setMockReady(true)
          console.log('[MSW] Mock Service Worker started successfully')
        })
      })
    } else {
      setMockReady(true)
    }
  }, [])

  // Show loading state while mocks are being initialized
  if (process.env.NEXT_PUBLIC_ENABLE_MOCKS === 'true' && !mockReady) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-gray-900"></div>
          <p className="mt-2 text-sm text-gray-600">Initializing mock services...</p>
        </div>
      </div>
    )
  }

  return <>{children}</>
}