import { ref, computed } from 'vue'
import type { FilterConfig } from '~/components/matter/filters/FilterConfig'
import { useUsers } from './useUsers'

/**
 * Composable for managing dynamic filter options
 * Populates filter configurations with real data from APIs
 */
export function useFilterOptions() {
  const { loadLawyers, loadClerks, lawyers, clerks, isLoadingLawyers, isLoadingClerks } = useUsers()
  
  const isLoading = computed(() => isLoadingLawyers.value || isLoadingClerks.value)

  /**
   * Populate filter configs with dynamic options from APIs
   */
  const populateFilterConfigs = async (configs: FilterConfig[]): Promise<FilterConfig[]> => {
    // Load user data
    await Promise.all([loadLawyers(), loadClerks()])
    
    // Clone configs to avoid mutation
    const populatedConfigs = configs.map(config => ({ ...config }))
    
    // Populate lawyer options
    const lawyerConfig = populatedConfigs.find(c => c.field === 'assignedLawyer')
    if (lawyerConfig) {
      lawyerConfig.options = [...lawyers.value]
    }
    
    // Populate clerk options
    const clerkConfig = populatedConfigs.find(c => c.field === 'assignedClerk')
    if (clerkConfig) {
      clerkConfig.options = [...clerks.value]
    }
    
    return populatedConfigs
  }

  /**
   * Get reactive filter configs that update when user data changes
   */
  const getReactiveFilterConfigs = (baseConfigs: FilterConfig[]) => {
    return computed(() => {
      const configs = baseConfigs.map(config => ({ ...config }))
      
      // Update lawyer options
      const lawyerConfig = configs.find(c => c.field === 'assignedLawyer')
      if (lawyerConfig) {
        lawyerConfig.options = [...lawyers.value]
      }
      
      // Update clerk options
      const clerkConfig = configs.find(c => c.field === 'assignedClerk')
      if (clerkConfig) {
        clerkConfig.options = [...clerks.value]
      }
      
      return configs
    })
  }

  /**
   * Initialize filter options on component mount
   */
  const initializeFilterOptions = () => {
    // Load user data in background
    loadLawyers()
    loadClerks()
  }

  return {
    // State
    isLoading,
    
    // Methods
    populateFilterConfigs,
    getReactiveFilterConfigs,
    initializeFilterOptions
  }
}