import { ref, computed } from 'vue'
import type { ICase } from '~/modules/case/types/case'

/**
 * Case state interface with explicit state modeling
 */
interface ICaseState {
  data: ICase[]
  isLoading: boolean
  error: string | null
}

/**
 * Simplified case interface for expense forms
 */
export interface IExpenseCase {
  id: string
  name: string
  caseNumber: string
  clientName: string
}

/**
 * Composable for expense case management
 * Extracts case logic from UI components following Clean Architecture
 */
export function useExpenseCases() {
  const { t: _t } = useI18n()

  // State with explicit modeling instead of union types
  const caseState = ref<ICaseState>({
    data: [],
    isLoading: false,
    error: null
  })

  // Computed properties
  const cases = computed(() => caseState.value.data)
  const isLoading = computed(() => caseState.value.isLoading)
  const error = computed(() => caseState.value.error)

  const caseOptions = computed((): IExpenseCase[] =>
    cases.value.map(case_ => ({
      id: case_.id,
      name: case_.title,
      caseNumber: case_.caseNumber,
      clientName: case_.client.name
    }))
  )

  // Methods
  const getCaseById = (caseId: string): ICase | undefined => {
    return cases.value.find(case_ => case_.id === caseId)
  }

  const getCaseName = (caseId: string): string => {
    const case_ = getCaseById(caseId)
    return case_?.title || ''
  }

  const getCaseDisplayName = (caseId: string): string => {
    const case_ = getCaseById(caseId)
    if (!case_) return ''
    return `${case_.client.name} - ${case_.title}`
  }

  const validateCaseId = (caseId: string | null | undefined): boolean => {
    if (!caseId) return true // Empty is valid
    return getCaseById(caseId) !== undefined
  }

  // API methods
  const loadCases = async (): Promise<void> => {
    try {
      caseState.value.isLoading = true
      caseState.value.error = null

      // TODO: Replace with actual API call when backend is ready
      // const response = await $fetch('/api/cases')
      // caseState.value.data = response.data

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 300)) // Simulate API delay
      
      caseState.value.data = [
        {
          id: '1',
          caseNumber: 'CASE-2024-001',
          title: '労働契約紛争',
          client: {
            id: 'client1',
            name: '山田太郎',
            type: 'individual',
            email: 'yamada@example.com'
          },
          status: 'investigation',
          priority: 'high',
          assignedLawyer: 'lawyer1',
          dueDate: '2024-12-31',
          tags: ['労働法', '契約'],
          createdAt: '2024-01-01T00:00:00Z',
          updatedAt: '2024-01-01T00:00:00Z'
        },
        {
          id: '2',
          caseNumber: 'CASE-2024-002',
          title: '債権回収案件',
          client: {
            id: 'client2',
            name: '鈴木商店',
            type: 'corporate',
            email: 'suzuki@example.com'
          },
          status: 'negotiation',
          priority: 'medium',
          assignedLawyer: 'lawyer1',
          dueDate: '2024-11-30',
          tags: ['債権', '商事'],
          createdAt: '2024-01-02T00:00:00Z',
          updatedAt: '2024-01-02T00:00:00Z'
        },
        {
          id: '3',
          caseNumber: 'CASE-2024-003',
          title: '離婚調停',
          client: {
            id: 'client3',
            name: '田中夫妻',
            type: 'individual',
            email: 'tanaka@example.com'
          },
          status: 'investigation',
          priority: 'medium',
          assignedLawyer: 'lawyer2',
          dueDate: '2024-10-31',
          tags: ['家事', '調停'],
          createdAt: '2024-01-03T00:00:00Z',
          updatedAt: '2024-01-03T00:00:00Z'
        },
        {
          id: '4',
          caseNumber: 'CASE-2024-004',
          title: '企業法務顧問',
          client: {
            id: 'client4',
            name: 'XYZ株式会社',
            type: 'corporate',
            email: 'xyz@example.com'
          },
          status: 'accepted',
          priority: 'low',
          assignedLawyer: 'lawyer1',
          dueDate: '2025-12-31',
          tags: ['企業法務', '顧問'],
          createdAt: '2024-01-04T00:00:00Z',
          updatedAt: '2024-01-04T00:00:00Z'
        }
      ]

    } catch (err) {
      caseState.value.error = err instanceof Error ? err.message : 'Failed to load cases'
      console.error('Failed to load expense cases:', err)
    } finally {
      caseState.value.isLoading = false
    }
  }

  const searchCases = async (query: string): Promise<ICase[]> => {
    if (!query || query.length < 2) {
      return cases.value
    }

    const lowerQuery = query.toLowerCase()
    return cases.value.filter(case_ => 
      case_.title.toLowerCase().includes(lowerQuery) ||
      case_.caseNumber.toLowerCase().includes(lowerQuery) ||
      case_.client.name.toLowerCase().includes(lowerQuery)
    )
  }

  return {
    // State (readonly to prevent direct mutation)
    cases,
    isLoading,
    error,
    
    // Computed
    caseOptions,
    
    // Methods
    getCaseById,
    getCaseName,
    getCaseDisplayName,
    validateCaseId,
    
    // API methods
    loadCases,
    searchCases
  }
}

// Export types for better type safety
export type { ICaseState }