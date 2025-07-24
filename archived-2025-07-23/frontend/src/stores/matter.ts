/**
 * Matter Store
 * 
 * @description Pinia store for managing legal matters state
 */

import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { Matter } from '~/types/matter'

export const useMatterStore = defineStore('matter', () => {
  // State
  const matters = ref<Matter[]>([])
  const selectedMatter = ref<Matter | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)

  // Getters
  const matterCount = computed(() => matters.value.length)
  const hasMatter = computed(() => matters.value.length > 0)

  // Actions
  const setMatters = (newMatters: Matter[]) => {
    matters.value = newMatters
  }

  const addMatter = (matter: Matter) => {
    matters.value.push(matter)
  }

  const updateMatter = (id: string, updates: Partial<Matter>) => {
    const index = matters.value.findIndex(m => m.id === id)
    if (index !== -1) {
      matters.value[index] = { ...matters.value[index], ...updates }
    }
  }

  const removeMatter = (id: string) => {
    matters.value = matters.value.filter(m => m.id !== id)
  }

  const selectMatter = (matter: Matter | null) => {
    selectedMatter.value = matter
  }

  const setLoading = (isLoading: boolean) => {
    loading.value = isLoading
  }

  const setError = (errorMsg: string | null) => {
    error.value = errorMsg
  }

  const clearError = () => {
    error.value = null
  }

  const $reset = () => {
    matters.value = []
    selectedMatter.value = null
    loading.value = false
    error.value = null
  }

  return {
    // State
    matters,
    selectedMatter,
    loading,
    error,

    // Getters
    matterCount,
    hasMatter,

    // Actions
    setMatters,
    addMatter,
    updateMatter,
    removeMatter,
    selectMatter,
    setLoading,
    setError,
    clearError,
    $reset
  }
})