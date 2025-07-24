import type { FilterOption } from '~/components/matter/filters/FilterConfig'

export interface User {
  id: string
  name: string
  email: string
  role: 'LAWYER' | 'CLERK' | 'CLIENT'
  active: boolean
}

export interface Lawyer extends User {
  role: 'LAWYER'
  specializations: string[]
}

export interface Clerk extends User {
  role: 'CLERK'
  department: string
}

/**
 * Composable for managing user data and filter options
 */
export function useUsers() {
  // Fetch lawyers for filter dropdown
  const fetchLawyers = async (): Promise<FilterOption[]> => {
    try {
      const response = await $fetch<FilterOption[]>('/api/users/lawyers')
      return response
    } catch (error) {
      console.error('Failed to fetch lawyers:', error)
      return []
    }
  }

  // Fetch clerks for filter dropdown
  const fetchClerks = async (): Promise<FilterOption[]> => {
    try {
      const response = await $fetch<FilterOption[]>('/api/users/clerks')
      return response
    } catch (error) {
      console.error('Failed to fetch clerks:', error)
      return []
    }
  }

  // Cached lawyers with reactive state
  const lawyers = ref<FilterOption[]>([])
  const clerks = ref<FilterOption[]>([])
  const isLoadingLawyers = ref(false)
  const isLoadingClerks = ref(false)

  // Load lawyers with caching
  const loadLawyers = async (force = false) => {
    if (lawyers.value.length > 0 && !force) {
      return lawyers.value
    }

    isLoadingLawyers.value = true
    try {
      lawyers.value = await fetchLawyers()
      return lawyers.value
    } finally {
      isLoadingLawyers.value = false
    }
  }

  // Load clerks with caching
  const loadClerks = async (force = false) => {
    if (clerks.value.length > 0 && !force) {
      return clerks.value
    }

    isLoadingClerks.value = true
    try {
      clerks.value = await fetchClerks()
      return clerks.value
    } finally {
      isLoadingClerks.value = false
    }
  }

  // Load both lawyers and clerks
  const loadAllUsers = async (force = false) => {
    await Promise.all([
      loadLawyers(force),
      loadClerks(force)
    ])
  }

  return {
    // State
    lawyers: readonly(lawyers),
    clerks: readonly(clerks),
    isLoadingLawyers: readonly(isLoadingLawyers),
    isLoadingClerks: readonly(isLoadingClerks),
    
    // Methods
    fetchLawyers,
    fetchClerks,
    loadLawyers,
    loadClerks,
    loadAllUsers
  }
}