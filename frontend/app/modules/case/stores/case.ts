/**
 * Case Store - 案件データ管理
 * Handles all case-related data operations and API interactions
 */

import { defineStore } from 'pinia'
import type { ICase, CaseStatus } from '~/modules/case/types/case'
import { mockCases } from '~/modules/case/__mocks__/caseMockData'

export const useCaseStore = defineStore('case', () => {
  const { t } = useI18n()
  
  // State
  const cases = ref<ICase[]>([...mockCases]) // In production, initialize as empty array
  const isLoading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const totalCasesCount = computed(() => cases.value.length)
  
  const getCasesByStatus = (status: CaseStatus) => {
    return cases.value.filter(case_ => case_.status === status)
  }

  const getCaseById = (id: string) => {
    return cases.value.find(case_ => case_.id === id)
  }

  // Actions
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
    cases: readonly(cases),
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
})