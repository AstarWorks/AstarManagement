import { defineStore } from 'pinia'
import { ref, computed, watch, nextTick, onMounted, onUnmounted } from 'vue'
import type { Matter } from '~/types/matter'

// Advanced state management pattern for matter detail pages
export interface TabState {
  scrollPosition: number
  formData: Record<string, any>
  selectedItems: string[]
  viewMode: string
  lastUpdated: number
}

export interface MatterDetailState {
  // Core data
  matter: Matter | null
  loading: boolean
  error: string | null
  
  // UI state
  activeTab: string
  sidebarCollapsed: boolean
  
  // Sub-tab states for advanced views
  subTabs: {
    tasks: 'kanban' | 'table'
    schedule: 'list' | 'calendar'
    documents: 'grid' | 'list'
  }
  
  // Tab-specific state preservation
  tabStates: Map<string, TabState>
  
  // State synchronization
  isDirty: boolean
  autoSaveEnabled: boolean
  lastSyncTime: number
  
  // Performance optimization
  prefetchedMatters: Map<string, Matter>
  preloadQueue: string[]
  
  // User preferences
  preferences: {
    defaultTab: string
    sidebarPosition: 'left' | 'right'
    autoSaveInterval: number
    keepAliveTimeout: number
  }
}

export const useMatterDetailStore = defineStore('matterDetail', () => {
  // Core reactive state
  const matter = ref<Matter | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // UI state
  const activeTab = ref('overview')
  const sidebarCollapsed = ref(false)
  
  // Advanced sub-tab state management
  const subTabs = ref({
    tasks: 'kanban' as 'kanban' | 'table',
    schedule: 'list' as 'list' | 'calendar',
    documents: 'grid' as 'grid' | 'list'
  })
  
  // Tab-specific state preservation
  const tabStates = ref(new Map<string, TabState>())
  
  // State synchronization
  const isDirty = ref(false)
  const autoSaveEnabled = ref(true)
  const lastSyncTime = ref(Date.now())
  
  // Performance optimization
  const prefetchedMatters = ref(new Map<string, Matter>())
  const preloadQueue = ref<string[]>([])
  
  // User preferences
  const preferences = ref({
    defaultTab: 'overview',
    sidebarPosition: 'left' as 'left' | 'right',
    autoSaveInterval: 30000, // 30 seconds
    keepAliveTimeout: 300000 // 5 minutes
  })
  
  // Computed properties
  const currentTabState = computed(() => {
    return tabStates.value.get(activeTab.value) || createDefaultTabState()
  })
  
  const hasUnsavedChanges = computed(() => {
    return isDirty.value || Array.from(tabStates.value.values()).some(state => 
      Date.now() - state.lastUpdated < preferences.value.autoSaveInterval
    )
  })
  
  const nextMatterId = computed(() => {
    // Logic to determine next matter in sequence
    return preloadQueue.value[0] || null
  })
  
  const previousMatterId = computed(() => {
    // Logic to determine previous matter in sequence
    return preloadQueue.value[preloadQueue.value.length - 1] || null
  })
  
  // Core actions
  const loadMatter = async (matterId: string) => {
    try {
      loading.value = true
      error.value = null
      
      // Check prefetch cache first
      if (prefetchedMatters.value.has(matterId)) {
        matter.value = prefetchedMatters.value.get(matterId)!
        loading.value = false
        return
      }
      
      // Load from API
      const response = await $fetch<Matter>(`/api/matters/${matterId}`)
      matter.value = response
      
      // Cache the loaded matter
      prefetchedMatters.value.set(matterId, response)
      
      // Initialize tab states if not exists
      if (!tabStates.value.has(activeTab.value)) {
        tabStates.value.set(activeTab.value, createDefaultTabState())
      }
      
      // Trigger prefetch for adjacent matters
      await prefetchAdjacentMatters(matterId)
      
    } catch (err: any) {
      error.value = err.data?.message || 'Failed to load matter'
      console.error('Error loading matter:', err)
    } finally {
      loading.value = false
    }
  }
  
  // Advanced tab management
  const setActiveTab = (tabId: string, subView?: string) => {
    // Save current tab state before switching
    saveCurrentTabState()
    
    // Switch to new tab
    activeTab.value = tabId
    
    // Handle sub-view switching
    if (subView && tabId in subTabs.value) {
      (subTabs.value as any)[tabId] = subView
    }
    
    // Initialize tab state if not exists
    if (!tabStates.value.has(tabId)) {
      tabStates.value.set(tabId, createDefaultTabState())
    }
    
    // Mark as accessed
    const tabState = tabStates.value.get(tabId)!
    tabState.lastUpdated = Date.now()
  }
  
  const setSubTabView = (tabId: keyof typeof subTabs.value, view: string) => {
    if (tabId in subTabs.value) {
      (subTabs.value as any)[tabId] = view
      
      // Update URL to reflect sub-view
      const route = useRoute()
      const router = useRouter()
      
      router.replace({
        query: {
          ...route.query,
          tab: tabId,
          view: view
        }
      })
      
      // Save state change
      markDirty()
    }
  }
  
  // State preservation methods
  const saveTabState = (tabId: string, stateUpdate: Partial<TabState>) => {
    const currentState = tabStates.value.get(tabId) || createDefaultTabState()
    const updatedState = {
      ...currentState,
      ...stateUpdate,
      lastUpdated: Date.now()
    }
    
    tabStates.value.set(tabId, updatedState)
    markDirty()
  }
  
  const saveCurrentTabState = () => {
    // This would be called from components to save their current state
    const tabId = activeTab.value
    
    // Get current scroll position
    const scrollPosition = window.pageYOffset || document.documentElement.scrollTop
    
    saveTabState(tabId, {
      scrollPosition,
      lastUpdated: Date.now()
    })
  }
  
  const restoreTabState = (tabId: string) => {
    const state = tabStates.value.get(tabId)
    if (state) {
      // Restore scroll position
      nextTick(() => {
        window.scrollTo(0, state.scrollPosition)
      })
      
      return state
    }
    return createDefaultTabState()
  }
  
  // Performance optimization methods
  const prefetchAdjacentMatters = async (currentMatterId: string) => {
    try {
      // Get adjacent matter IDs (this would come from a list context)
      const adjacentIds = await $fetch<string[]>(`/api/matters/${currentMatterId}/adjacent`)
      
      // Add to preload queue
      preloadQueue.value = adjacentIds
      
      // Prefetch next matter
      if (adjacentIds.length > 0) {
        const nextId = adjacentIds[0]
        if (!prefetchedMatters.value.has(nextId)) {
          const nextMatter = await $fetch<Matter>(`/api/matters/${nextId}`)
          prefetchedMatters.value.set(nextId, nextMatter)
        }
      }
    } catch (err) {
      console.warn('Failed to prefetch adjacent matters:', err)
    }
  }
  
  const navigateToMatter = async (matterId: string) => {
    // Check if we have prefetched data
    if (prefetchedMatters.value.has(matterId)) {
      await loadMatter(matterId)
      return true
    }
    
    // Load normally
    await loadMatter(matterId)
    return true
  }
  
  const getNextMatter = async () => {
    if (nextMatterId.value) {
      await navigateToMatter(nextMatterId.value)
      return nextMatterId.value
    }
    return null
  }
  
  const getPreviousMatter = async () => {
    if (previousMatterId.value) {
      await navigateToMatter(previousMatterId.value)
      return previousMatterId.value
    }
    return null
  }
  
  // Auto-save functionality
  const markDirty = () => {
    isDirty.value = true
    
    if (autoSaveEnabled.value) {
      // Debounced auto-save
      setTimeout(() => {
        if (isDirty.value) {
          autoSave()
        }
      }, preferences.value.autoSaveInterval)
    }
  }
  
  const autoSave = async () => {
    try {
      // Save current state to localStorage or API
      const stateSnapshot = {
        activeTab: activeTab.value,
        subTabs: subTabs.value,
        tabStates: Object.fromEntries(tabStates.value),
        preferences: preferences.value
      }
      
      localStorage.setItem(`matterDetail_${matter.value?.id}`, JSON.stringify(stateSnapshot))
      
      isDirty.value = false
      lastSyncTime.value = Date.now()
      
    } catch (err) {
      console.error('Auto-save failed:', err)
    }
  }
  
  const loadSavedState = (matterId: string) => {
    try {
      const saved = localStorage.getItem(`matterDetail_${matterId}`)
      if (saved) {
        const state = JSON.parse(saved)
        
        activeTab.value = state.activeTab || 'overview'
        subTabs.value = { ...subTabs.value, ...state.subTabs }
        preferences.value = { ...preferences.value, ...state.preferences }
        
        // Restore tab states
        if (state.tabStates) {
          tabStates.value = new Map(Object.entries(state.tabStates))
        }
      }
    } catch (err) {
      console.warn('Failed to load saved state:', err)
    }
  }
  
  // Utility functions
  const createDefaultTabState = (): TabState => ({
    scrollPosition: 0,
    formData: {},
    selectedItems: [],
    viewMode: 'default',
    lastUpdated: Date.now()
  })
  
  const clearTabStates = () => {
    tabStates.value.clear()
    isDirty.value = false
  }
  
  const toggleSidebar = () => {
    sidebarCollapsed.value = !sidebarCollapsed.value
    saveTabState(activeTab.value, { lastUpdated: Date.now() })
  }
  
  // Keyboard shortcuts handler
  const handleKeyboardShortcut = (event: KeyboardEvent) => {
    if (event.ctrlKey && event.key >= '1' && event.key <= '9') {
      event.preventDefault()
      const tabIndex = parseInt(event.key) - 1
      
      // Get available tabs based on user permissions
      try {
        const authStore = useAuthStore()
        const availableTabs = getAvailableTabsForUser(authStore.user)
        
        if (tabIndex < availableTabs.length) {
          setActiveTab(availableTabs[tabIndex].id)
        }
      } catch (err) {
        console.warn('Failed to get auth store for keyboard shortcuts:', err)
      }
    }
  }
  
  // Cleanup
  const cleanup = () => {
    saveCurrentTabState()
    clearTabStates()
    prefetchedMatters.value.clear()
    preloadQueue.value = []
  }
  
  // Watchers for auto-save
  watch([activeTab, subTabs], () => {
    markDirty()
  }, { deep: true })
  
  // Setup keyboard listeners
  onMounted(() => {
    document.addEventListener('keydown', handleKeyboardShortcut)
  })
  
  onUnmounted(() => {
    document.removeEventListener('keydown', handleKeyboardShortcut)
    cleanup()
  })
  
  return {
    // State
    matter: readonly(matter),
    loading: readonly(loading),
    error: readonly(error),
    activeTab: readonly(activeTab),
    sidebarCollapsed: readonly(sidebarCollapsed),
    subTabs: readonly(subTabs),
    preferences: readonly(preferences),
    
    // Computed
    currentTabState,
    hasUnsavedChanges,
    nextMatterId,
    previousMatterId,
    
    // Actions
    loadMatter,
    setActiveTab,
    setSubTabView,
    saveTabState,
    saveCurrentTabState,
    restoreTabState,
    prefetchAdjacentMatters,
    navigateToMatter,
    getNextMatter,
    getPreviousMatter,
    markDirty,
    autoSave,
    loadSavedState,
    clearTabStates,
    toggleSidebar,
    cleanup
  }
})

// Helper function to get available tabs based on user role
const getAvailableTabsForUser = (user: any) => {
  const tabConfig = [
    { id: 'overview', roles: ['client', 'lawyer', 'clerk'] },
    { id: 'tasks', roles: ['lawyer', 'clerk'] },
    { id: 'schedule', roles: ['lawyer', 'clerk'] },
    { id: 'communications', roles: ['lawyer', 'clerk'] },
    { id: 'documents', roles: ['client', 'lawyer', 'clerk'] },
    { id: 'fax', roles: ['lawyer', 'clerk'] },
    { id: 'billing', roles: ['client', 'lawyer', 'clerk'] },
    { id: 'notes', roles: ['lawyer', 'clerk'] }
  ]
  
  if (!user) return tabConfig.slice(0, 1)
  
  return tabConfig.filter(tab => 
    tab.roles.includes(user.role.toLowerCase())
  )
}