/**
 * Toast notification provider using Sonner
 * 
 * @description Provides toast notifications for user feedback,
 * particularly useful for real-time update notifications and
 * error handling.
 */

'use client'

import { Toaster } from 'sonner'

interface ToastProviderProps {
  children: React.ReactNode
}

/**
 * Toast provider component
 */
export function ToastProvider({ children }: ToastProviderProps) {
  return (
    <>
      {children}
      <Toaster
        position="top-right"
        expand={true}
        richColors={true}
        closeButton={true}
        toastOptions={{
          style: {
            background: 'hsl(var(--background))',
            color: 'hsl(var(--foreground))',
            border: '1px solid hsl(var(--border))',
          },
          className: 'sonner-toast',
          duration: 4000,
        }}
      />
    </>
  )
}