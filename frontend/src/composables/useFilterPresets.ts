import { ref, computed, watch } from 'vue'
import type { FilterPreset, FilterState, FilterValue } from '~/components/matter/filters/FilterConfig'

const STORAGE_KEY = 'matter-filter-presets'
const STORAGE_VERSION = '1.0'
const MAX_USER_PRESETS = 20

interface StoredPresets {
  version: string
  presets: FilterPreset[]
  lastUpdated: number
}

/**
 * Composable for managing filter presets with full CRUD operations
 * Supports system presets, user presets, import/export, and advanced management
 */
export function useFilterPresets() {
  const isClient = process.client
  
  // System presets (read-only, always available)
  const systemPresets: FilterPreset[] = [
    {
      id: 'active-matters',
      name: 'Active Matters',
      description: 'All matters currently in progress',
      filters: [
        { field: 'status', operator: 'in', value: ['IN_PROGRESS', 'REVIEW', 'WAITING_CLIENT'] }
      ],
      isDefault: true,
      isPublic: true,
      isSystem: true,
      createdAt: '2024-01-01T00:00:00Z',
      lastUsed: new Date().toISOString()
    },
    {
      id: 'high-priority',
      name: 'High Priority',
      description: 'Urgent and high priority matters',
      filters: [
        { field: 'priority', operator: 'in', value: ['HIGH', 'URGENT'] }
      ],
      isPublic: true,
      isSystem: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'overdue',
      name: 'Overdue Matters',
      description: 'Matters past their due date',
      filters: [
        { field: 'dueDate', operator: 'less', value: new Date() },
        { field: 'status', operator: 'in', value: ['IN_PROGRESS', 'REVIEW'] }
      ],
      isPublic: true,
      isSystem: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'recent',
      name: 'Recently Created',
      description: 'Matters created in the last 7 days',
      filters: [
        { 
          field: 'createdAt', 
          operator: 'greater', 
          value: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) 
        }
      ],
      isPublic: true,
      isSystem: true,
      createdAt: '2024-01-01T00:00:00Z'
    },
    {
      id: 'my-assignments',
      name: 'My Assignments',
      description: 'Matters assigned to me',
      filters: [
        { field: 'assignedLawyer', operator: 'equals', value: 'current_user' }
      ],
      isPublic: false,
      isSystem: true,
      createdAt: '2024-01-01T00:00:00Z'
    }
  ]

  // User presets (stored in localStorage)
  const userPresets = ref<FilterPreset[]>([])
  const selectedPresetId = ref<string | null>(null)
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // All presets (system + user)
  const allPresets = computed(() => [...systemPresets, ...userPresets.value])
  
  // Public presets (available to all users)
  const publicPresets = computed(() => allPresets.value.filter(p => p.isPublic !== false))
  
  // User's private presets
  const privatePresets = computed(() => userPresets.value.filter(p => !p.isPublic && !p.isSystem))
  
  // Currently selected preset
  const selectedPreset = computed(() => 
    selectedPresetId.value ? allPresets.value.find(p => p.id === selectedPresetId.value) : null
  )

  /**
   * Generate unique ID for new presets
   */
  const generatePresetId = (): string => {
    const timestamp = Date.now()
    const random = Math.random().toString(36).substr(2, 5)
    return `user-${timestamp}-${random}`
  }

  /**
   * Validate preset data
   */
  const validatePreset = (preset: Partial<FilterPreset>): string[] => {
    const errors: string[] = []
    
    if (!preset.name?.trim()) {
      errors.push('Preset name is required')
    }
    
    if (preset.name && preset.name.length > 50) {
      errors.push('Preset name must be 50 characters or less')
    }
    
    if (!preset.filters || !Array.isArray(preset.filters) || preset.filters.length === 0) {
      errors.push('Preset must have at least one filter')
    }
    
    if (preset.description && preset.description.length > 200) {
      errors.push('Description must be 200 characters or less')
    }
    
    return errors
  }

  /**
   * Serialize presets for storage
   */
  const serializePresets = (presets: FilterPreset[]): string => {
    const data: StoredPresets = {
      version: STORAGE_VERSION,
      presets: presets.map(preset => ({
        ...preset,
        // Convert Date objects to ISO strings
        filters: preset.filters.map(filter => ({
          ...filter,
          value: filter.value instanceof Date 
            ? filter.value.toISOString()
            : Array.isArray(filter.value) && filter.value.some(v => v instanceof Date)
            ? filter.value.map(v => v instanceof Date ? v.toISOString() : v)
            : filter.value
        }))
      })),
      lastUpdated: Date.now()
    }
    
    return JSON.stringify(data)
  }

  /**
   * Deserialize presets from storage
   */
  const deserializePresets = (data: string): FilterPreset[] => {
    try {
      const parsed: StoredPresets = JSON.parse(data)
      
      if (parsed.version !== STORAGE_VERSION) {
        console.warn('Preset version mismatch, ignoring stored presets')
        return []
      }
      
      return parsed.presets.map(preset => ({
        ...preset,
        // Restore Date objects
        filters: preset.filters.map(filter => ({
          ...filter,
          value: 
            // Handle date range arrays
            Array.isArray(filter.value) && filter.value.length === 2 && 
            typeof filter.value[0] === 'string' && typeof filter.value[1] === 'string' &&
            (filter.field === 'dueDate' || filter.field === 'createdAt')
              ? [new Date(filter.value[0]), new Date(filter.value[1])]
            // Handle single date strings
            : typeof filter.value === 'string' && 
              (filter.field === 'dueDate' || filter.field === 'createdAt')
              ? new Date(filter.value)
            : filter.value
        }))
      }))
    } catch (error) {
      console.error('Failed to deserialize presets:', error)
      return []
    }
  }

  /**
   * Load presets from localStorage
   */
  const loadPresets = () => {
    if (!isClient) return
    
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        userPresets.value = deserializePresets(stored)
      }
    } catch (err) {
      console.error('Failed to load presets:', err)
      error.value = 'Failed to load saved presets'
    }
  }

  /**
   * Save presets to localStorage
   */
  const savePresets = () => {
    if (!isClient) return
    
    try {
      const serialized = serializePresets(userPresets.value)
      localStorage.setItem(STORAGE_KEY, serialized)
      error.value = null
    } catch (err) {
      console.error('Failed to save presets:', err)
      error.value = 'Failed to save presets'
    }
  }

  /**
   * Create a new preset
   */
  const createPreset = async (
    name: string, 
    filters: FilterValue[], 
    options: {
      description?: string
      isPublic?: boolean
      overwrite?: boolean
    } = {}
  ): Promise<FilterPreset | null> => {
    const errors = validatePreset({ name, filters, description: options.description })
    if (errors.length > 0) {
      error.value = errors.join(', ')
      return null
    }

    // Check for duplicate names
    const existingPreset = userPresets.value.find(p => 
      p.name.toLowerCase() === name.toLowerCase()
    )
    
    if (existingPreset && !options.overwrite) {
      error.value = 'A preset with this name already exists'
      return null
    }

    // Check user preset limit
    if (!existingPreset && userPresets.value.length >= MAX_USER_PRESETS) {
      error.value = `Maximum of ${MAX_USER_PRESETS} user presets allowed`
      return null
    }

    const preset: FilterPreset = {
      id: existingPreset?.id || generatePresetId(),
      name: name.trim(),
      description: options.description?.trim(),
      filters: [...filters],
      isPublic: options.isPublic ?? false,
      isSystem: false,
      createdBy: 'current_user', // TODO: Get from auth context
      createdAt: existingPreset?.createdAt || new Date().toISOString(),
      lastUsed: new Date().toISOString()
    }

    if (existingPreset) {
      // Update existing preset
      const index = userPresets.value.findIndex(p => p.id === preset.id)
      userPresets.value[index] = preset
    } else {
      // Add new preset
      userPresets.value.push(preset)
    }

    savePresets()
    error.value = null
    return preset
  }

  /**
   * Update an existing preset
   */
  const updatePreset = async (
    id: string, 
    updates: Partial<FilterPreset>
  ): Promise<FilterPreset | null> => {
    const preset = userPresets.value.find(p => p.id === id)
    if (!preset) {
      error.value = 'Preset not found'
      return null
    }

    if (preset.isSystem) {
      error.value = 'Cannot modify system presets'
      return null
    }

    const updatedPreset = { ...preset, ...updates }
    const errors = validatePreset(updatedPreset)
    if (errors.length > 0) {
      error.value = errors.join(', ')
      return null
    }

    const index = userPresets.value.findIndex(p => p.id === id)
    userPresets.value[index] = updatedPreset

    savePresets()
    error.value = null
    return updatedPreset
  }

  /**
   * Delete a preset
   */
  const deletePreset = async (id: string): Promise<boolean> => {
    const preset = userPresets.value.find(p => p.id === id)
    if (!preset) {
      error.value = 'Preset not found'
      return false
    }

    if (preset.isSystem) {
      error.value = 'Cannot delete system presets'
      return false
    }

    userPresets.value = userPresets.value.filter(p => p.id !== id)
    
    if (selectedPresetId.value === id) {
      selectedPresetId.value = null
    }

    savePresets()
    error.value = null
    return true
  }

  /**
   * Apply a preset (mark as used and return filter state)
   */
  const applyPreset = async (id: string): Promise<FilterState | null> => {
    const preset = allPresets.value.find(p => p.id === id)
    if (!preset) {
      error.value = 'Preset not found'
      return null
    }

    // Update last used timestamp for user presets
    if (!preset.isSystem) {
      await updatePreset(id, { lastUsed: new Date().toISOString() })
    }

    selectedPresetId.value = id
    
    return {
      filters: [...preset.filters],
      quickSearch: '',
      activePreset: id,
      sortBy: 'createdAt',
      sortDirection: 'desc'
    }
  }

  /**
   * Export presets to JSON
   */
  const exportPresets = (includeSystem = false): string => {
    const presetsToExport = includeSystem ? allPresets.value : userPresets.value
    return JSON.stringify({
      version: STORAGE_VERSION,
      exportedAt: new Date().toISOString(),
      presets: presetsToExport
    }, null, 2)
  }

  /**
   * Import presets from JSON
   */
  const importPresets = async (jsonData: string, options: {
    overwrite?: boolean
    makePublic?: boolean
  } = {}): Promise<{ imported: number, errors: string[] }> => {
    const result = { imported: 0, errors: [] as string[] }
    
    try {
      const data = JSON.parse(jsonData)
      
      if (!data.presets || !Array.isArray(data.presets)) {
        result.errors.push('Invalid preset format')
        return result
      }

      for (const presetData of data.presets) {
        // Skip system presets on import
        if (presetData.isSystem) continue
        
        const preset = await createPreset(
          presetData.name,
          presetData.filters,
          {
            description: presetData.description,
            isPublic: options.makePublic ?? presetData.isPublic,
            overwrite: options.overwrite
          }
        )
        
        if (preset) {
          result.imported++
        } else if (error.value) {
          result.errors.push(`${presetData.name}: ${error.value}`)
          error.value = null // Clear error for next iteration
        }
      }
      
    } catch (err) {
      result.errors.push('Invalid JSON format')
    }
    
    return result
  }

  /**
   * Get preset usage statistics
   */
  const getPresetStats = () => {
    return {
      total: allPresets.value.length,
      system: systemPresets.length,
      user: userPresets.value.length,
      public: publicPresets.value.length,
      private: privatePresets.value.length,
      mostUsed: userPresets.value
        .filter(p => p.lastUsed)
        .sort((a, b) => new Date(b.lastUsed!).getTime() - new Date(a.lastUsed!).getTime())
        .slice(0, 5)
    }
  }

  // Initialize on client
  if (isClient) {
    loadPresets()
  }

  return {
    // State
    allPresets,
    systemPresets,
    userPresets,
    publicPresets,
    privatePresets,
    selectedPreset,
    selectedPresetId,
    isLoading,
    error,
    
    // Methods
    createPreset,
    updatePreset,
    deletePreset,
    applyPreset,
    exportPresets,
    importPresets,
    loadPresets,
    savePresets,
    getPresetStats,
    
    // Utils
    validatePreset,
    generatePresetId
  }
}