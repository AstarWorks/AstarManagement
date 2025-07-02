import { describe, it, expect, beforeEach, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import { ref, nextTick } from 'vue'
import { useFilterPresets } from '~/composables/useFilterPresets'
import { useFilterHistory } from '~/composables/useFilterHistory'
import { useAdvancedSearch } from '~/composables/useAdvancedSearch'
import type { FilterState, FilterValue } from '../FilterConfig'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
})

// Mock process.client
Object.defineProperty(process, 'client', {
  value: true,
  writable: true
})

describe('Filter Advanced Features', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    localStorageMock.getItem.mockReturnValue(null)
  })

  describe('useFilterPresets', () => {
    it('should initialize with system presets', () => {
      const { systemPresets, allPresets } = useFilterPresets()
      
      expect(systemPresets.length).toBeGreaterThan(0)
      expect(allPresets.value).toContain(systemPresets[0])
      expect(systemPresets[0].isSystem).toBe(true)
    })

    it('should create user presets', async () => {
      const { createPreset, userPresets } = useFilterPresets()
      
      const filters: FilterValue[] = [
        { field: 'status', operator: 'in', value: ['IN_PROGRESS'] }
      ]
      
      const preset = await createPreset('Test Preset', filters, {
        description: 'Test description'
      })
      
      expect(preset).toBeTruthy()
      expect(preset?.name).toBe('Test Preset')
      expect(preset?.description).toBe('Test description')
      expect(preset?.isSystem).toBe(false)
      expect(userPresets.value).toContain(preset)
    })

    it('should validate preset data', async () => {
      const { createPreset, error } = useFilterPresets()
      
      // Test empty name
      const preset1 = await createPreset('', [])
      expect(preset1).toBeNull()
      expect(error.value).toContain('name is required')
      
      // Test empty filters
      const preset2 = await createPreset('Valid Name', [])
      expect(preset2).toBeNull()
      expect(error.value).toContain('at least one filter')
    })

    it('should prevent duplicate preset names', async () => {
      const { createPreset, error } = useFilterPresets()
      
      const filters: FilterValue[] = [
        { field: 'status', operator: 'in', value: ['IN_PROGRESS'] }
      ]
      
      await createPreset('Duplicate Test', filters)
      const duplicate = await createPreset('Duplicate Test', filters)
      
      expect(duplicate).toBeNull()
      expect(error.value).toContain('already exists')
    })

    it('should export and import presets', async () => {
      const { createPreset, exportPresets, importPresets } = useFilterPresets()
      
      const filters: FilterValue[] = [
        { field: 'priority', operator: 'in', value: ['HIGH'] }
      ]
      
      await createPreset('Export Test', filters)
      
      const exported = exportPresets(false)
      const exportData = JSON.parse(exported)
      
      expect(exportData.presets).toHaveLength(1)
      expect(exportData.presets[0].name).toBe('Export Test')
      
      // Clear and reimport
      const result = await importPresets(exported)
      expect(result.imported).toBe(1)
      expect(result.errors).toHaveLength(0)
    })

    it('should apply presets correctly', async () => {
      const { createPreset, applyPreset } = useFilterPresets()
      
      const filters: FilterValue[] = [
        { field: 'status', operator: 'in', value: ['REVIEW'] },
        { field: 'priority', operator: 'in', value: ['HIGH'] }
      ]
      
      const preset = await createPreset('Apply Test', filters)
      const result = await applyPreset(preset!.id)
      
      expect(result).toBeTruthy()
      expect(result?.filters).toHaveLength(2)
      expect(result?.activePreset).toBe(preset!.id)
    })
  })

  describe('useFilterHistory', () => {
    it('should track filter state changes', () => {
      const { updateState, canUndo, currentState } = useFilterHistory()
      
      const initialState: FilterState = {
        filters: [],
        quickSearch: '',
        sortBy: 'createdAt',
        sortDirection: 'desc'
      }
      
      const newState: FilterState = {
        filters: [{ field: 'status', operator: 'in', value: ['IN_PROGRESS'] }],
        quickSearch: 'test',
        sortBy: 'createdAt',
        sortDirection: 'desc'
      }
      
      updateState(newState, 'Add status filter', true)
      
      expect(canUndo.value).toBe(true)
      expect(currentState.value.filters).toHaveLength(1)
      expect(currentState.value.quickSearch).toBe('test')
    })

    it('should support undo operations', () => {
      const { updateState, undo, canUndo, currentState } = useFilterHistory()
      
      const state1: FilterState = {
        filters: [{ field: 'status', operator: 'in', value: ['IN_PROGRESS'] }],
        quickSearch: '',
        sortBy: 'createdAt',
        sortDirection: 'desc'
      }
      
      const state2: FilterState = {
        filters: [
          { field: 'status', operator: 'in', value: ['IN_PROGRESS'] },
          { field: 'priority', operator: 'in', value: ['HIGH'] }
        ],
        quickSearch: '',
        sortBy: 'createdAt',
        sortDirection: 'desc'
      }
      
      updateState(state1, 'Add status', true)
      updateState(state2, 'Add priority', true)
      
      expect(currentState.value.filters).toHaveLength(2)
      
      const undoResult = undo()
      expect(undoResult).toBeTruthy()
      expect(currentState.value.filters).toHaveLength(1)
      expect(currentState.value.filters[0].field).toBe('status')
    })

    it('should support redo operations', () => {
      const { updateState, undo, redo, canRedo, currentState } = useFilterHistory()
      
      const state1: FilterState = {
        filters: [{ field: 'status', operator: 'in', value: ['IN_PROGRESS'] }],
        quickSearch: '',
        sortBy: 'createdAt',
        sortDirection: 'desc'
      }
      
      updateState(state1, 'Add status', true)
      undo()
      
      expect(canRedo.value).toBe(true)
      
      const redoResult = redo()
      expect(redoResult).toBeTruthy()
      expect(currentState.value.filters).toHaveLength(1)
    })

    it('should execute commands with automatic history tracking', () => {
      const { executeCommand, commands, canUndo, currentState } = useFilterHistory()
      
      const addFilterCommand = commands.addFilter({
        field: 'priority',
        operator: 'in',
        value: ['HIGH']
      })
      
      executeCommand(addFilterCommand)
      
      expect(canUndo.value).toBe(true)
      expect(currentState.value.filters).toHaveLength(1)
      expect(currentState.value.filters[0].field).toBe('priority')
    })

    it('should limit history size', () => {
      const { updateState, getHistorySummary } = useFilterHistory()
      
      // Add more than MAX_HISTORY_SIZE entries
      for (let i = 0; i < 25; i++) {
        const state: FilterState = {
          filters: [{ field: 'status', operator: 'in', value: [`STATUS_${i}`] }],
          quickSearch: `search_${i}`,
          sortBy: 'createdAt',
          sortDirection: 'desc'
        }
        updateState(state, `Update ${i}`, true)
      }
      
      const summary = getHistorySummary()
      expect(summary.undoCount).toBeLessThanOrEqual(20) // MAX_HISTORY_SIZE
    })
  })

  describe('useAdvancedSearch', () => {
    it('should initialize with default state', () => {
      const { 
        query, 
        searchMode, 
        suggestions, 
        searchHistory 
      } = useAdvancedSearch()
      
      expect(query.value).toBe('')
      expect(searchMode.value).toBe('fuzzy')
      expect(suggestions.value).toHaveLength(0)
      expect(searchHistory.value).toHaveLength(0)
    })

    it('should generate suggestions based on search mode', async () => {
      const { getSuggestions, searchMode } = useAdvancedSearch()
      
      // Test fuzzy search
      searchMode.value = 'fuzzy'
      const fuzzySuggestions = await getSuggestions('corp')
      expect(fuzzySuggestions.length).toBeGreaterThan(0)
      
      // Test exact search
      searchMode.value = 'exact'
      const exactSuggestions = await getSuggestions('Corporate')
      expect(exactSuggestions.length).toBeGreaterThan(0)
      
      // Test field search
      searchMode.value = 'field'
      const fieldSuggestions = await getSuggestions('case:')
      expect(fieldSuggestions.length).toBeGreaterThan(0)
    })

    it('should parse field search patterns', () => {
      const { query, isFieldSearch, parsedFieldSearch } = useAdvancedSearch()
      
      query.value = 'case:CC-2024-001'
      expect(isFieldSearch.value).toBe(true)
      expect(parsedFieldSearch.value).toEqual({
        field: 'case',
        value: 'CC-2024-001'
      })
      
      query.value = 'lawyer:Yamamoto'
      expect(parsedFieldSearch.value).toEqual({
        field: 'lawyer',
        value: 'Yamamoto'
      })
    })

    it('should maintain search history', () => {
      const { addToHistory, searchHistory, clearHistory } = useAdvancedSearch()
      
      addToHistory('test search 1', 5)
      addToHistory('test search 2', 10)
      
      expect(searchHistory.value).toHaveLength(2)
      expect(searchHistory.value[0].query).toBe('test search 2') // Most recent first
      expect(searchHistory.value[0].resultCount).toBe(10)
      
      clearHistory()
      expect(searchHistory.value).toHaveLength(0)
    })

    it('should toggle search modes correctly', () => {
      const { searchMode, toggleSearchMode } = useAdvancedSearch()
      
      expect(searchMode.value).toBe('fuzzy')
      
      toggleSearchMode()
      expect(searchMode.value).toBe('exact')
      
      toggleSearchMode()
      expect(searchMode.value).toBe('field')
      
      toggleSearchMode()
      expect(searchMode.value).toBe('fuzzy') // Cycles back
    })

    it('should handle keyboard navigation', () => {
      const { 
        suggestions, 
        selectedSuggestionIndex, 
        showSuggestions,
        handleKeydown 
      } = useAdvancedSearch()
      
      // Setup suggestions
      suggestions.value = [
        { id: '1', value: 'suggestion1', type: 'case', label: 'Suggestion 1' },
        { id: '2', value: 'suggestion2', type: 'case', label: 'Suggestion 2' }
      ]
      showSuggestions.value = true
      
      // Test arrow down
      const downEvent = new KeyboardEvent('keydown', { key: 'ArrowDown' })
      const handled1 = handleKeydown(downEvent)
      expect(handled1).toBe(true)
      expect(selectedSuggestionIndex.value).toBe(0)
      
      // Test arrow up
      const upEvent = new KeyboardEvent('keydown', { key: 'ArrowUp' })
      const handled2 = handleKeydown(upEvent)
      expect(handled2).toBe(true)
      expect(selectedSuggestionIndex.value).toBe(-1)
      
      // Test escape
      const escapeEvent = new KeyboardEvent('keydown', { key: 'Escape' })
      const handled3 = handleKeydown(escapeEvent)
      expect(handled3).toBe(true)
      expect(showSuggestions.value).toBe(false)
    })

    it('should cache suggestions for performance', async () => {
      const { getSuggestions } = useAdvancedSearch()
      
      const startTime = performance.now()
      await getSuggestions('test')
      const firstCallTime = performance.now() - startTime
      
      const startTime2 = performance.now()
      await getSuggestions('test') // Should be cached
      const secondCallTime = performance.now() - startTime2
      
      // Second call should be faster due to caching
      expect(secondCallTime).toBeLessThan(firstCallTime)
    })
  })

  describe('Integration Tests', () => {
    it('should integrate preset application with filter history', async () => {
      const { createPreset, applyPreset } = useFilterPresets()
      const { updateState, canUndo, currentState } = useFilterHistory()
      
      const filters: FilterValue[] = [
        { field: 'status', operator: 'in', value: ['IN_PROGRESS'] }
      ]
      
      const preset = await createPreset('Integration Test', filters)
      const filterState = await applyPreset(preset!.id)
      
      updateState(filterState!, `Apply preset: ${preset!.name}`, true)
      
      expect(canUndo.value).toBe(true)
      expect(currentState.value.filters).toHaveLength(1)
      expect(currentState.value.activePreset).toBe(preset!.id)
    })

    it('should integrate search with filter state', () => {
      const { executeSearch, addToHistory } = useAdvancedSearch()
      const { updateState, currentState } = useFilterHistory()
      
      const searchResult = executeSearch('case:CC-2024-001')
      
      expect(searchResult?.query).toBe('case:CC-2024-001')
      expect(searchResult?.parsedField).toEqual({
        field: 'case',
        value: 'CC-2024-001'
      })
      
      // Convert search to filter state
      const filterState: FilterState = {
        filters: [{
          field: searchResult!.parsedField!.field,
          operator: 'contains',
          value: searchResult!.parsedField!.value
        }],
        quickSearch: '',
        sortBy: 'createdAt',
        sortDirection: 'desc'
      }
      
      updateState(filterState, 'Apply search result', true)
      expect(currentState.value.filters).toHaveLength(1)
      expect(currentState.value.filters[0].field).toBe('case')
    })
  })
})