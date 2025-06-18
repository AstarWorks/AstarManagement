import { create } from 'zustand'
import { subscribeWithSelector } from 'zustand/middleware'

interface Theme {
  mode: 'light' | 'dark' | 'system'
  language: 'en' | 'jp'
}

interface UiState {
  // Theme management
  theme: Theme
  
  // Sidebar and layout state
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  
  // Loading states
  isLoading: boolean
  loadingMessage?: string
  
  // Modal and overlay states
  activeModal?: string
  modalData?: unknown
  
  // Actions
  setTheme: (theme: Partial<Theme>) => void
  toggleSidebar: () => void
  toggleSidebarCollapse: () => void
  setLoading: (isLoading: boolean, message?: string) => void
  openModal: (modalId: string, data?: unknown) => void
  closeModal: () => void
}

export const useUiStore = create<UiState>()(
  subscribeWithSelector((set) => ({
    // Initial state
    theme: {
      mode: 'system',
      language: 'en'
    },
    sidebarOpen: true,
    sidebarCollapsed: false,
    isLoading: false,
    loadingMessage: undefined,
    activeModal: undefined,
    modalData: undefined,

    // Actions
    setTheme: (newTheme) =>
      set((state) => ({
        theme: { ...state.theme, ...newTheme }
      })),

    toggleSidebar: () =>
      set((state) => ({
        sidebarOpen: !state.sidebarOpen
      })),

    toggleSidebarCollapse: () =>
      set((state) => ({
        sidebarCollapsed: !state.sidebarCollapsed
      })),

    setLoading: (isLoading, message) =>
      set({
        isLoading,
        loadingMessage: message
      }),

    openModal: (modalId, data) =>
      set({
        activeModal: modalId,
        modalData: data
      }),

    closeModal: () =>
      set({
        activeModal: undefined,
        modalData: undefined
      })
  }))
)

// Selector hooks for optimized re-renders
export const useTheme = () => useUiStore((state) => state.theme)
export const useSidebarState = () => useUiStore((state) => ({
  open: state.sidebarOpen,
  collapsed: state.sidebarCollapsed
}))
export const useLoadingState = () => useUiStore((state) => ({
  isLoading: state.isLoading,
  message: state.loadingMessage
}))
export const useModalState = () => useUiStore((state) => ({
  activeModal: state.activeModal,
  data: state.modalData
}))

// Utility function for theme persistence
export const persistTheme = () => {
  const theme = useUiStore.getState().theme
  if (typeof window !== 'undefined') {
    localStorage.setItem('aster-theme', JSON.stringify(theme))
  }
}

// Load theme from localStorage on initialization
export const loadPersistedTheme = () => {
  if (typeof window !== 'undefined') {
    const saved = localStorage.getItem('aster-theme')
    if (saved) {
      try {
        const theme = JSON.parse(saved)
        useUiStore.getState().setTheme(theme)
      } catch (error) {
        console.warn('Failed to load persisted theme:', error)
      }
    }
  }
}