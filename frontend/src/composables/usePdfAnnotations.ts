import { ref, computed, readonly } from 'vue'
import type { 
  PdfAnnotation, 
  CreateAnnotationInput, 
  UpdateAnnotationInput,
  AnnotationType 
} from '~/types/pdf-annotations'

export function usePdfAnnotations(documentId: string) {
  const annotations = ref<PdfAnnotation[]>([])
  const selectedAnnotation = ref<PdfAnnotation | null>(null)
  const annotationMode = ref<AnnotationType | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Get annotations for a specific page
  const getPageAnnotations = (page: number) => 
    computed(() => annotations.value.filter(a => a.page === page))
  
  // Generate unique ID for annotations
  const generateId = () => {
    return `annotation_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
  }
  
  // Get current user (mock implementation)
  const getCurrentUser = () => ({
    id: 'current-user-id',
    name: 'Current User'
  })
  
  // Add new annotation
  const addAnnotation = async (input: CreateAnnotationInput): Promise<PdfAnnotation> => {
    const user = getCurrentUser()
    
    const newAnnotation: PdfAnnotation = {
      ...input,
      id: generateId(),
      createdAt: new Date(),
      createdBy: user.id
    }
    
    annotations.value.push(newAnnotation)
    
    try {
      await saveAnnotation(newAnnotation)
      return newAnnotation
    } catch (err) {
      // Remove from local state if save failed
      const index = annotations.value.findIndex(a => a.id === newAnnotation.id)
      if (index !== -1) {
        annotations.value.splice(index, 1)
      }
      throw err
    }
  }
  
  // Update existing annotation
  const updateAnnotation = async (
    annotationId: string, 
    updates: UpdateAnnotationInput
  ): Promise<PdfAnnotation> => {
    const index = annotations.value.findIndex(a => a.id === annotationId)
    if (index === -1) {
      throw new Error('Annotation not found')
    }
    
    const user = getCurrentUser()
    const updatedAnnotation: PdfAnnotation = {
      ...annotations.value[index],
      ...updates,
      updatedAt: new Date(),
      updatedBy: user.id
    }
    
    annotations.value[index] = updatedAnnotation
    
    try {
      await saveAnnotation(updatedAnnotation)
      return updatedAnnotation
    } catch (err) {
      // Revert local change if save failed
      annotations.value[index] = { ...annotations.value[index] }
      throw err
    }
  }
  
  // Delete annotation
  const deleteAnnotation = async (annotationId: string): Promise<void> => {
    const index = annotations.value.findIndex(a => a.id === annotationId)
    if (index === -1) {
      throw new Error('Annotation not found')
    }
    
    const removedAnnotation = annotations.value[index]
    annotations.value.splice(index, 1)
    
    // Clear selection if deleted annotation was selected
    if (selectedAnnotation.value?.id === annotationId) {
      selectedAnnotation.value = null
    }
    
    try {
      await removeAnnotation(annotationId)
    } catch (err) {
      // Restore annotation if delete failed
      annotations.value.splice(index, 0, removedAnnotation)
      throw err
    }
  }
  
  // Select annotation
  const selectAnnotation = (annotation: PdfAnnotation | null) => {
    selectedAnnotation.value = annotation
  }
  
  // Set annotation mode
  const setAnnotationMode = (mode: AnnotationType | null) => {
    annotationMode.value = mode
    // Clear selection when changing modes
    if (mode !== null) {
      selectedAnnotation.value = null
    }
  }
  
  // API calls
  const saveAnnotation = async (annotation: PdfAnnotation): Promise<void> => {
    try {
      await $fetch(`/api/documents/${documentId}/annotations`, {
        method: 'POST',
        body: annotation
      })
    } catch (err) {
      console.error('Failed to save annotation:', err)
      throw new Error('Failed to save annotation')
    }
  }
  
  const removeAnnotation = async (annotationId: string): Promise<void> => {
    try {
      await $fetch(`/api/documents/${documentId}/annotations/${annotationId}`, {
        method: 'DELETE'
      })
    } catch (err) {
      console.error('Failed to remove annotation:', err)
      throw new Error('Failed to remove annotation')
    }
  }
  
  // Load annotations from server
  const loadAnnotations = async (): Promise<void> => {
    loading.value = true
    error.value = null
    
    try {
      const data = await $fetch<PdfAnnotation[]>(`/api/documents/${documentId}/annotations`)
      annotations.value = data.map(annotation => ({
        ...annotation,
        createdAt: new Date(annotation.createdAt),
        updatedAt: annotation.updatedAt ? new Date(annotation.updatedAt) : undefined
      }))
    } catch (err) {
      error.value = 'Failed to load annotations'
      console.error('Failed to load annotations:', err)
      // Don't throw here, let component handle error state
    } finally {
      loading.value = false
    }
  }
  
  // Clear all annotations (local only)
  const clearAnnotations = () => {
    annotations.value = []
    selectedAnnotation.value = null
    annotationMode.value = null
  }
  
  // Get annotation statistics
  const annotationStats = computed(() => {
    const stats = {
      total: annotations.value.length,
      highlights: 0,
      notes: 0,
      drawings: 0,
      byPage: {} as Record<number, number>
    }
    
    annotations.value.forEach(annotation => {
      // Count by type
      switch (annotation.type) {
        case 'highlight':
          stats.highlights++
          break
        case 'note':
          stats.notes++
          break
        case 'drawing':
          stats.drawings++
          break
      }
      
      // Count by page
      stats.byPage[annotation.page] = (stats.byPage[annotation.page] || 0) + 1
    })
    
    return stats
  })
  
  return {
    // State
    annotations: readonly(annotations),
    selectedAnnotation: readonly(selectedAnnotation),
    annotationMode: readonly(annotationMode),
    loading: readonly(loading),
    error: readonly(error),
    
    // Computed
    getPageAnnotations,
    annotationStats,
    
    // Actions
    addAnnotation,
    updateAnnotation,
    deleteAnnotation,
    selectAnnotation,
    setAnnotationMode,
    loadAnnotations,
    clearAnnotations
  }
}