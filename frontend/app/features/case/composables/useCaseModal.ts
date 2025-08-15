/**
 * Case Modal Management Composable
 * Handles modal state and actions for case detail views
 */

import { ref } from 'vue'
import type {  ICase  } from '@case/types/case'

export function useCaseModal() {
  // Modal state
  const isOpen = ref(false)
  const selectedCase = ref<ICase | null>(null)
  const isLoading = ref(false)

  // VueUse for better state management
  const [isEditMode, toggleEditMode] = useToggle(false)

  // Open modal with case data
  const openModal = (case_: ICase) => {
    selectedCase.value = case_
    isOpen.value = true
    isEditMode.value = false
  }

  // Close modal and reset state
  const closeModal = () => {
    isOpen.value = false
    selectedCase.value = null
    isEditMode.value = false
    isLoading.value = false
  }

  // Navigate to case edit page
  const editCase = (caseId?: string) => {
    const id = caseId || selectedCase.value?.id
    if (id) {
      navigateTo(`/cases/${id}/edit`)
    }
  }

  // Open case creation modal/page
  const createNewCase = () => {
    navigateTo('/cases/create')
  }

  // Handle case updates from modal
  const handleCaseUpdate = (updatedCase: ICase) => {
    if (selectedCase.value && selectedCase.value.id === updatedCase.id) {
      selectedCase.value = { ...updatedCase }
    }
  }

  // Keyboard shortcuts for modal
  const { escape } = useMagicKeys()
  
  // Close modal on Escape key (with proper type handling)
  if (escape) {
    whenever(escape, () => {
      if (isOpen.value) {
        closeModal()
      }
    })
  }

  // Prevent body scroll when modal is open
  if (import.meta.client) {
    watch(isOpen, (open) => {
      if (open) {
        document.body.style.overflow = 'hidden'
      } else {
        document.body.style.overflow = ''
      }
    })
  }

  // Cleanup on unmount
  if (import.meta.client) {
    onUnmounted(() => {
      document.body.style.overflow = ''
    })
  }

  return {
    // State
    isOpen: readonly(isOpen),
    selectedCase: readonly(selectedCase),
    isLoading: readonly(isLoading),
    isEditMode: readonly(isEditMode),
    
    // Actions
    openModal,
    closeModal,
    editCase,
    createNewCase,
    handleCaseUpdate,
    toggleEditMode
  }
}

// Composable for case actions (can be used in modal and other components)
export function useCaseActions(emit?: (event: string, ...args: unknown[]) => void) {
  const router = useRouter()

  const handleClose = () => {
    if (emit) {
      emit('close')
    }
  }

  const handleEdit = (caseId: string) => {
    router.push(`/cases/${caseId}/edit`)
  }

  const handleStatusChange = (caseId: string) => {
    if (emit) {
      emit('statusChanged', caseId)
    }
  }

  const handleDelete = async (caseId: string) => {
    // Show confirmation dialog
    const confirmed = confirm('この案件を削除してもよろしいですか？')
    
    if (confirmed) {
      try {
        // In real implementation, call delete API
        console.log(`Deleting case ${caseId}`)
        
        if (emit) {
          emit('deleted', caseId)
        }
      } catch (error) {
        console.error('Failed to delete case:', error)
      }
    }
  }

  return {
    handleClose,
    handleEdit,
    handleStatusChange,
    handleDelete
  }
}