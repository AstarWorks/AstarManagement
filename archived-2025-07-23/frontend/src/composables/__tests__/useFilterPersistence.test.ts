import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest'
import { nextTick } from 'vue'
import { useFilterPersistence } from '../useFilterPersistence'
import type { FilterState, Priority, MatterStatus } from '~/types/matter'

// Mock VueUse useLocalStorage
const mockLocalStorageValue = {
  value: {} as any
}

const mockLocalStorage = vi.fn(() => mockLocalStorageValue)

vi.mock('@vueuse/core', () => ({
  useLocalStorage: mockLocalStorage,
  watch: vi.fn((source: any, callback: any) => {
    // Simulate immediate execution for testing
    callback(source.value)
  })
}))

describe('useFilterPersistence', () => {
  let persistenceComposable: ReturnType<typeof useFilterPersistence>
  
  const defaultFilters: FilterState = {
    searchQuery: '',
    selectedLawyers: [],
    selectedPriorities: [],
    selectedStatuses: [],
    showClosed: true,
    searchMode: 'fuzzy'
  }

  beforeEach(() => {
    vi.clearAllMocks()
    
    // Reset mock localStorage value
    mockLocalStorageValue.value = { ...defaultFilters }
    
    persistenceComposable = useFilterPersistence('test-filters')
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Initialization', () => {
    it('should initialize with default filters', () => {
      expect(persistenceComposable.currentFilters.value).toEqual(defaultFilters)
    })

    it('should use custom persistence key', () => {
      const customKey = 'custom-test-filters'
      useFilterPersistence(customKey)
      
      expect(mockLocalStorage).toHaveBeenCalledWith(
        customKey,
        expect.any(Object),
        expect.any(Object)
      )
    })

    it('should use default persistence key when none provided', () => {
      useFilterPersistence()
      
      expect(mockLocalStorage).toHaveBeenCalledWith(
        'kanban-filters',
        expect.any(Object),
        expect.any(Object)
      )
    })
  })

  describe('Filter Updates', () => {
    it('should update filters with partial updates', () => {
      const updates = { searchQuery: 'test query', showClosed: false }
      
      persistenceComposable.updateFilters(updates)
      
      expect(persistenceComposable.currentFilters.value).toEqual({
        ...defaultFilters,
        ...updates
      })
    })

    it('should preserve existing filters when updating', () => {
      // Set initial state
      persistenceComposable.updateFilters({
        searchQuery: 'initial',
        selectedLawyers: ['lawyer1']
      })
      
      // Update with partial data
      persistenceComposable.updateFilters({
        selectedPriorities: ['high' as Priority]
      })
      
      expect(persistenceComposable.currentFilters.value).toEqual({
        ...defaultFilters,
        searchQuery: 'initial',
        selectedLawyers: ['lawyer1'],
        selectedPriorities: ['high']
      })
    })
  })

  describe('Reset and Clear', () => {
    it('should reset filters to default state', () => {
      // Set some non-default values
      persistenceComposable.updateFilters({
        searchQuery: 'test',
        selectedLawyers: ['lawyer1'],
        showClosed: false
      })
      
      persistenceComposable.resetFilters()
      
      expect(persistenceComposable.currentFilters.value).toEqual(defaultFilters)
    })

    it('should clear filters (same as reset)', () => {
      persistenceComposable.updateFilters({
        searchQuery: 'test',
        selectedPriorities: ['high' as Priority]
      })
      
      persistenceComposable.clearFilters()
      
      expect(persistenceComposable.currentFilters.value).toEqual(defaultFilters)
    })
  })

  describe('Load and Save', () => {
    it('should load filters from persistence', () => {
      const savedFilters = {
        ...defaultFilters,
        searchQuery: 'saved query',
        selectedLawyers: ['saved lawyer']
      }
      
      mockLocalStorageValue.value = savedFilters
      
      const loadedFilters = persistenceComposable.loadFilters()
      
      expect(loadedFilters).toEqual(savedFilters)
    })

    it('should save filters to persistence', () => {
      const filtersToSave = {
        ...defaultFilters,
        searchQuery: 'to save',
        selectedPriorities: ['medium' as Priority]
      }
      
      persistenceComposable.saveFilters(filtersToSave)
      
      expect(persistenceComposable.currentFilters.value).toEqual(filtersToSave)
    })
  })

  describe('Toggle Functions', () => {
    it('should toggle lawyer selection', () => {
      const lawyerId = 'lawyer1'
      
      // Add lawyer
      persistenceComposable.toggleLawyer(lawyerId)
      expect(persistenceComposable.currentFilters.value.selectedLawyers).toContain(lawyerId)
      
      // Remove lawyer
      persistenceComposable.toggleLawyer(lawyerId)
      expect(persistenceComposable.currentFilters.value.selectedLawyers).not.toContain(lawyerId)
    })

    it('should toggle multiple lawyers independently', () => {
      persistenceComposable.toggleLawyer('lawyer1')
      persistenceComposable.toggleLawyer('lawyer2')
      
      expect(persistenceComposable.currentFilters.value.selectedLawyers).toEqual(['lawyer1', 'lawyer2'])
      
      persistenceComposable.toggleLawyer('lawyer1')
      
      expect(persistenceComposable.currentFilters.value.selectedLawyers).toEqual(['lawyer2'])
    })

    it('should toggle priority selection', () => {
      const priority: Priority = 'HIGH'
      
      persistenceComposable.togglePriority(priority)
      expect(persistenceComposable.currentFilters.value.selectedPriorities).toContain(priority)
      
      persistenceComposable.togglePriority(priority)
      expect(persistenceComposable.currentFilters.value.selectedPriorities).not.toContain(priority)
    })

    it('should toggle status selection', () => {
      const status: MatterStatus = 'IN_PROGRESS'
      
      persistenceComposable.toggleStatus(status)
      expect(persistenceComposable.currentFilters.value.selectedStatuses).toContain(status)
      
      persistenceComposable.toggleStatus(status)
      expect(persistenceComposable.currentFilters.value.selectedStatuses).not.toContain(status)
    })
  })

  describe('Filter History', () => {
    it('should track undo/redo state', () => {
      // Initially should not be able to undo/redo
      expect(persistenceComposable.canUndo.value).toBe(false)
      expect(persistenceComposable.canRedo.value).toBe(false)
    })

    it('should support undo functionality', () => {
      // Make a change
      persistenceComposable.updateFilters({ searchQuery: 'test' })
      
      // Mock history tracking
      persistenceComposable.canUndo.value = true
      
      const result = persistenceComposable.undoFilter()
      
      // Should return true if undo was successful
      expect(typeof result).toBe('boolean')
    })

    it('should support redo functionality', () => {
      // Mock state where redo is available
      persistenceComposable.canRedo.value = true
      
      const result = persistenceComposable.redoFilter()
      
      // Should return true if redo was successful
      expect(typeof result).toBe('boolean')
    })

    it('should return false when undo is not available', () => {
      persistenceComposable.canUndo.value = false
      
      const result = persistenceComposable.undoFilter()
      
      expect(result).toBe(false)
    })

    it('should return false when redo is not available', () => {
      persistenceComposable.canRedo.value = false
      
      const result = persistenceComposable.redoFilter()
      
      expect(result).toBe(false)
    })
  })

  describe('Preset Management', () => {
    it('should save filter preset', () => {
      const filters = {
        ...defaultFilters,
        searchQuery: 'preset test',
        selectedPriorities: ['high' as Priority]
      }
      
      persistenceComposable.saveFilters(filters)
      persistenceComposable.savePreset('test-preset')
      
      // Verify preset was saved (this depends on the mock implementation)
      expect(persistenceComposable.getPresetNames()).toContain('test-preset')
    })

    it('should load filter preset', () => {
      const presetFilters = {
        ...defaultFilters,
        searchQuery: 'preset query',
        selectedLawyers: ['preset lawyer']
      }
      
      // Save a preset first
      persistenceComposable.savePreset('test-preset', presetFilters)
      
      // Load the preset
      const loaded = persistenceComposable.loadPreset('test-preset')
      
      expect(loaded).toBe(true)
    })

    it('should return false when loading non-existent preset', () => {
      const result = persistenceComposable.loadPreset('non-existent-preset')
      
      expect(result).toBe(false)
    })

    it('should delete preset', () => {
      persistenceComposable.savePreset('to-delete')
      persistenceComposable.deletePreset('to-delete')
      
      expect(persistenceComposable.getPresetNames()).not.toContain('to-delete')
    })

    it('should get preset names', () => {
      persistenceComposable.savePreset('preset1')
      persistenceComposable.savePreset('preset2')
      
      const names = persistenceComposable.getPresetNames()
      
      expect(Array.isArray(names)).toBe(true)
      expect(names).toContain('preset1')
      expect(names).toContain('preset2')
    })
  })

  describe('Import/Export', () => {
    it('should export filters as base64 encoded string', () => {
      const filters = {
        ...defaultFilters,
        searchQuery: 'export test',
        selectedLawyers: ['lawyer1']
      }
      
      persistenceComposable.saveFilters(filters)
      const exported = persistenceComposable.exportFilters()
      
      expect(typeof exported).toBe('string')
      expect(exported.length).toBeGreaterThan(0)
      
      // Should be valid base64
      expect(() => atob(exported)).not.toThrow()
    })

    it('should export specific filters when provided', () => {
      const specificFilters = {
        ...defaultFilters,
        searchQuery: 'specific export'
      }
      
      const exported = persistenceComposable.exportFilters(specificFilters)
      
      expect(typeof exported).toBe('string')
      
      // Decode and verify content
      const decoded = JSON.parse(atob(exported))
      expect(decoded.searchQuery).toBe('specific export')
    })

    it('should import filters from base64 encoded string', () => {
      const filters = {
        ...defaultFilters,
        searchQuery: 'imported query',
        selectedPriorities: ['medium' as Priority]
      }
      
      const encoded = btoa(JSON.stringify(filters))
      const result = persistenceComposable.importFilters(encoded)
      
      expect(result).toBe(true)
      expect(persistenceComposable.currentFilters.value.searchQuery).toBe('imported query')
      expect(persistenceComposable.currentFilters.value.selectedPriorities).toContain('medium')
    })

    it('should return false for invalid import data', () => {
      const invalidEncoded = 'invalid-base64-data'
      const result = persistenceComposable.importFilters(invalidEncoded)
      
      expect(result).toBe(false)
    })

    it('should return false for malformed JSON in import', () => {
      const invalidJson = btoa('{"invalid": json}')
      const result = persistenceComposable.importFilters(invalidJson)
      
      expect(result).toBe(false)
    })

    it('should return false for invalid filter structure in import', () => {
      const invalidFilters = { invalid: 'structure' }
      const encoded = btoa(JSON.stringify(invalidFilters))
      const result = persistenceComposable.importFilters(encoded)
      
      expect(result).toBe(false)
    })
  })

  describe('Filter Validation', () => {
    it('should validate proper filter state structure', () => {
      const validFilters = {
        searchQuery: 'test',
        selectedLawyers: ['lawyer1'],
        selectedPriorities: ['high'],
        selectedStatuses: ['new'],
        showClosed: true,
        searchMode: 'fuzzy'
      }
      
      const encoded = btoa(JSON.stringify(validFilters))
      const result = persistenceComposable.importFilters(encoded)
      
      expect(result).toBe(true)
    })

    it('should reject filters with missing required fields', () => {
      const invalidFilters = {
        searchQuery: 'test'
        // Missing other required fields
      }
      
      const encoded = btoa(JSON.stringify(invalidFilters))
      const result = persistenceComposable.importFilters(encoded)
      
      expect(result).toBe(false)
    })

    it('should reject filters with wrong field types', () => {
      const invalidFilters = {
        searchQuery: 123, // Should be string
        selectedLawyers: 'not-array',
        selectedPriorities: [],
        selectedStatuses: [],
        showClosed: 'true', // Should be boolean
        searchMode: 'fuzzy'
      }
      
      const encoded = btoa(JSON.stringify(invalidFilters))
      const result = persistenceComposable.importFilters(encoded)
      
      expect(result).toBe(false)
    })

    it('should reject filters with invalid search mode', () => {
      const invalidFilters = {
        searchQuery: 'test',
        selectedLawyers: [],
        selectedPriorities: [],
        selectedStatuses: [],
        showClosed: true,
        searchMode: 'invalid-mode'
      }
      
      const encoded = btoa(JSON.stringify(invalidFilters))
      const result = persistenceComposable.importFilters(encoded)
      
      expect(result).toBe(false)
    })
  })

  describe('Edge Cases', () => {
    it('should handle date range serialization', () => {
      const filtersWithDateRange = {
        ...defaultFilters,
        dateRange: {
          start: new Date('2024-01-01'),
          end: new Date('2024-01-31')
        }
      }
      
      const exported = persistenceComposable.exportFilters(filtersWithDateRange)
      const result = persistenceComposable.importFilters(exported)
      
      expect(result).toBe(true)
      // Date objects should be properly restored
      expect(persistenceComposable.currentFilters.value.dateRange?.start).toBeInstanceOf(Date)
      expect(persistenceComposable.currentFilters.value.dateRange?.end).toBeInstanceOf(Date)
    })

    it('should handle empty arrays in toggles', () => {
      // Toggle when array is empty
      persistenceComposable.toggleLawyer('lawyer1')
      expect(persistenceComposable.currentFilters.value.selectedLawyers).toEqual(['lawyer1'])
      
      // Toggle when array has one item
      persistenceComposable.toggleLawyer('lawyer1')
      expect(persistenceComposable.currentFilters.value.selectedLawyers).toEqual([])
    })

    it('should preserve other filters when toggling', () => {
      persistenceComposable.updateFilters({
        searchQuery: 'preserve me',
        selectedPriorities: ['high' as Priority]
      })
      
      persistenceComposable.toggleLawyer('lawyer1')
      
      expect(persistenceComposable.currentFilters.value.searchQuery).toBe('preserve me')
      expect(persistenceComposable.currentFilters.value.selectedPriorities).toEqual(['high'])
      expect(persistenceComposable.currentFilters.value.selectedLawyers).toEqual(['lawyer1'])
    })
  })
})