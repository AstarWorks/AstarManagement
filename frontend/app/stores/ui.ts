import { defineStore } from 'pinia'

export const useUIStore = defineStore('ui', () => {
  // State
  const sidebarOpen = ref(true)
  const theme = ref<'light' | 'dark'>('light')
  const loading = ref(false)
  const notifications = ref<Array<{
    id: string
    type: 'success' | 'error' | 'warning' | 'info'
    title: string
    message?: string
    duration?: number
  }>>([])

  // Getters
  const isDark = computed(() => theme.value === 'dark')
  const hasNotifications = computed(() => notifications.value.length > 0)

  // Actions
  const toggleSidebar = () => {
    sidebarOpen.value = !sidebarOpen.value
  }

  const setSidebarOpen = (open: boolean) => {
    sidebarOpen.value = open
  }

  const toggleTheme = () => {
    theme.value = theme.value === 'light' ? 'dark' : 'light'
    
    // Apply theme to document
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', theme.value === 'dark')
      localStorage.setItem('theme', theme.value)
    }
  }

  const setTheme = (newTheme: 'light' | 'dark') => {
    theme.value = newTheme
    
    if (import.meta.client) {
      document.documentElement.classList.toggle('dark', newTheme === 'dark')
      localStorage.setItem('theme', newTheme)
    }
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const addNotification = (notification: Omit<typeof notifications.value[0], 'id'>) => {
    const id = Math.random().toString(36).substr(2, 9)
    const newNotification = {
      id,
      duration: 5000,
      ...notification,
    }
    
    notifications.value.push(newNotification)

    // Auto remove after duration
    if (newNotification.duration && newNotification.duration > 0) {
      setTimeout(() => {
        removeNotification(id)
      }, newNotification.duration)
    }

    return id
  }

  const removeNotification = (id: string) => {
    const index = notifications.value.findIndex(n => n.id === id)
    if (index > -1) {
      notifications.value.splice(index, 1)
    }
  }

  const clearNotifications = () => {
    notifications.value = []
  }

  // Initialize theme from localStorage
  const initializeTheme = () => {
    if (import.meta.client) {
      const savedTheme = localStorage.getItem('theme') as 'light' | 'dark' | null
      if (savedTheme) {
        setTheme(savedTheme)
      } else {
        // Detect system preference
        const prefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches
        setTheme(prefersDark ? 'dark' : 'light')
      }
    }
  }

  return {
    // State
    sidebarOpen: readonly(sidebarOpen),
    theme: readonly(theme),
    loading: readonly(loading),
    notifications: readonly(notifications),
    
    // Getters
    isDark,
    hasNotifications,
    
    // Actions
    toggleSidebar,
    setSidebarOpen,
    toggleTheme,
    setTheme,
    setLoading,
    addNotification,
    removeNotification,
    clearNotifications,
    initializeTheme,
  }
})