/**
 * Toast Notification Plugin
 * 
 * @description Provides global toast notification functionality throughout the application.
 * This is the Vue/Nuxt equivalent of the React ToastProvider.
 */

// Note: Importing defineNuxtPlugin from global auto-imports instead of '#app'
import { reactive } from 'vue'

export interface Toast {
  id: string
  title: string
  description?: string
  type?: 'default' | 'success' | 'error' | 'warning' | 'info'
  duration?: number
  action?: {
    label: string
    onClick: () => void
  }
}

interface ToastState {
  toasts: Toast[]
}

// Global toast state
const state = reactive<ToastState>({
  toasts: []
})

// Toast methods
const toast = {
  show(options: Omit<Toast, 'id'>) {
    const id = Date.now().toString()
    const newToast: Toast = {
      id,
      duration: 5000,
      type: 'default',
      ...options
    }
    
    state.toasts.push(newToast)
    
    // Auto-dismiss after duration
    if (newToast.duration && newToast.duration > 0) {
      setTimeout(() => {
        toast.dismiss(id)
      }, newToast.duration)
    }
    
    return id
  },
  
  dismiss(id: string) {
    const index = state.toasts.findIndex(t => t.id === id)
    if (index > -1) {
      state.toasts.splice(index, 1)
    }
  },
  
  success(title: string, description?: string) {
    return toast.show({ title, description, type: 'success' })
  },
  
  error(title: string, description?: string) {
    return toast.show({ title, description, type: 'error' })
  },
  
  warning(title: string, description?: string) {
    return toast.show({ title, description, type: 'warning' })
  },
  
  info(title: string, description?: string) {
    return toast.show({ title, description, type: 'info' })
  }
}

export default defineNuxtPlugin(() => {
  return {
    provide: {
      toast,
      toastState: state
    }
  }
})

// Type declarations for auto-imports
// Note: Commenting out '#app' module declaration due to TypeScript resolution issues
// declare module '#app' {
//   interface NuxtApp {
//     $toast: typeof toast
//     $toastState: ToastState
//   }
// }

declare module 'vue' {
  interface ComponentCustomProperties {
    $toast: typeof toast
    $toastState: ToastState
  }
}