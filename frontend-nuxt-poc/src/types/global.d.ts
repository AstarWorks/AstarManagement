/**
 * Global Type Declarations
 * 
 * @description Global type extensions for window object and other globals
 * used throughout the application.
 */

declare global {
  interface Window {
    $nuxt?: {
      $serviceWorker?: {
        isUpdateAvailable: {
          value: boolean
        }
      }
      $toast?: {
        info: (title: string, message: string, options?: any) => void
        success: (title: string, message: string) => void
        warning: (title: string, message: string) => void
        error: (title: string, message: string) => void
      }
    }
  }
}

export {}