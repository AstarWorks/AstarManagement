/**
 * Case Data Management Composable
 * Handles CRUD operations, mock data, and API interactions for cases
 */

import { ref, computed } from 'vue'
import type { ICase, CaseStatus } from '~/types/case'

// Mock cases data - In real implementation, this would come from an API
const mockCases: ICase[] = [
  {
    id: '1',
    caseNumber: 'CASE-2024-001',
    title: '不動産売買契約トラブル',
    client: {
      id: '1',
      name: '田中太郎',
      type: 'individual'
    },
    status: 'new',
    priority: 'high',
    assignedLawyer: '佐藤弁護士',
    dueDate: '2024-08-15',
    tags: ['不動産', '契約'],
    createdAt: '2024-07-01',
    updatedAt: '2024-07-24'
  },
  {
    id: '2',
    caseNumber: 'CASE-2024-002',
    title: '企業買収案件',
    client: {
      id: '2', 
      name: 'ABC株式会社',
      type: 'corporate'
    },
    status: 'accepted',
    priority: 'medium',
    assignedLawyer: '山田弁護士',
    dueDate: '2024-09-30',
    tags: ['M&A', '企業法務'],
    createdAt: '2024-07-05',
    updatedAt: '2024-07-20'
  },
  {
    id: '3',
    caseNumber: 'CASE-2024-003',
    title: '労働争議調停',
    client: {
      id: '3',
      name: '鈴木花子',
      type: 'individual'
    },
    status: 'investigation',
    priority: 'high',
    assignedLawyer: '佐藤弁護士',
    dueDate: '2024-08-01',
    tags: ['労働法', '調停'],
    createdAt: '2024-06-15',
    updatedAt: '2024-07-22'
  }
]

export function useCaseData() {
  const { t } = useI18n()
  
  // Reactive state
  const cases = ref<ICase[]>([...mockCases])
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Computed getters
  const totalCasesCount = computed(() => cases.value.length)
  
  const getCasesByStatus = (status: CaseStatus) => {
    return cases.value.filter(case_ => case_.status === status)
  }

  const getCaseById = (id: string) => {
    return cases.value.find(case_ => case_.id === id)
  }

  // CRUD operations
  const loadCases = async () => {
    isLoading.value = true
    error.value = null
    
    try {
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 800))
      
      // In real implementation:
      // const response = await $fetch('/api/cases')
      // cases.value = response.data
      
      console.log(t('cases.data.loadSuccess', { count: cases.value.length }))
    } catch (err) {
      error.value = t('cases.data.loadError')
      console.error('Failed to load cases:', err)
    } finally {
      isLoading.value = false
    }
  }

  const updateCaseStatus = async (caseId: string, newStatus: CaseStatus, oldStatus: CaseStatus): Promise<boolean> => {
    // Don't update if status is the same
    if (oldStatus === newStatus) return false
    
    const caseIndex = cases.value.findIndex(c => c.id === caseId)
    if (caseIndex === -1) {
      throw new Error(`Case with ID ${caseId} not found`)
    }

    const targetCase = cases.value[caseIndex]
    if (!targetCase) {
      throw new Error(`Case with ID ${caseId} not found`)
    }
    
    const originalCase = { ...targetCase }
    
    try {
      // Optimistic update
      targetCase.status = newStatus
      targetCase.updatedAt = new Date().toISOString().split('T')[0] as string
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 500))
      
      // In real implementation:
      // await $fetch(`/api/cases/${caseId}/status`, {
      //   method: 'PATCH',
      //   body: { status: newStatus, reason: 'Kanban drag and drop' }
      // })
      
      console.log(t('cases.data.statusUpdateSuccess', { 
        caseId, 
        oldStatus: t(`cases.status.${oldStatus}`), 
        newStatus: t(`cases.status.${newStatus}`) 
      }))
      
      return true
    } catch (err) {
      // Rollback on failure
      cases.value[caseIndex] = originalCase
      error.value = t('cases.data.statusUpdateError')
      console.error('Failed to update case status:', err)
      throw err
    }
  }

  const updateCase = (updatedCase: ICase) => {
    const index = cases.value.findIndex(c => c.id === updatedCase.id)
    if (index !== -1) {
      cases.value[index] = { ...updatedCase }
    }
  }

  const createCase = async (newCase: Omit<ICase, 'id' | 'createdAt' | 'updatedAt'>) => {
    isLoading.value = true
    
    try {
      // Generate new case
      const case_: ICase = {
        id: `case-${Date.now()}`,
        caseNumber: newCase.caseNumber,
        title: newCase.title,
        description: newCase.description,
        client: newCase.client,
        status: newCase.status,
        priority: newCase.priority,
        assignedLawyer: newCase.assignedLawyer,
        dueDate: newCase.dueDate,
        tags: newCase.tags,
        createdAt: new Date().toISOString().split('T')[0] as string,
        updatedAt: new Date().toISOString().split('T')[0] as string,
        notes: newCase.notes
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      cases.value.unshift(case_)
      console.log(t('cases.data.createSuccess', { title: case_.title }))
      
      return case_
    } catch (err) {
      error.value = t('cases.data.createError')
      console.error('Failed to create case:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  const deleteCase = async (caseId: string) => {
    isLoading.value = true
    
    try {
      const index = cases.value.findIndex(c => c.id === caseId)
      if (index === -1) {
        throw new Error(`Case with ID ${caseId} not found`)
      }
      
      const targetCase = cases.value[index]
      if (!targetCase) {
        throw new Error(`Case with ID ${caseId} not found`)
      }
      
      // Simulate API call
      await new Promise(resolve => setTimeout(resolve, 300))
      
      cases.value.splice(index, 1)
      console.log(t('cases.data.deleteSuccess', { title: targetCase.title }))
      
      return true
    } catch (err) {
      error.value = t('cases.data.deleteError')
      console.error('Failed to delete case:', err)
      throw err
    } finally {
      isLoading.value = false
    }
  }

  return {
    // State
    cases,
    isLoading: readonly(isLoading),
    error: readonly(error),
    
    // Getters
    totalCasesCount,
    getCasesByStatus,
    getCaseById,
    
    // Actions
    loadCases,
    updateCaseStatus,
    updateCase,
    createCase,
    deleteCase
  }
}