// Simple toast composable for notifications
import { ref } from 'vue'

export interface Toast {
  id: string
  title?: string
  description?: string
  variant?: 'default' | 'success' | 'error' | 'warning'
}

const toasts = ref<Toast[]>([])

export function useToast() {
  const showToast = (message: string, variant: 'success' | 'error' | 'warning' | 'default' = 'default') => {
    const toast: Toast = {
      id: Date.now().toString(),
      description: message,
      variant
    }
    
    toasts.value.push(toast)
    
    // Auto-remove after 3 seconds
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== toast.id)
    }, 3000)
  }

  const toast = (options: Partial<Toast>) => {
    const newToast: Toast = {
      id: Date.now().toString(),
      ...options
    }
    
    toasts.value.push(newToast)
    
    setTimeout(() => {
      toasts.value = toasts.value.filter(t => t.id !== newToast.id)
    }, 3000)
  }

  return {
    showToast,
    toast,
    toasts: toasts as Readonly<typeof toasts>
  }
}