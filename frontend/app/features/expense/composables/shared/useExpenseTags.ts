import { ref, computed } from 'vue'
import { useI18n } from 'vue-i18n'

/**
 * Expense tag interface with explicit state modeling
 */
interface IExpenseTag {
  id: string
  name: string
  color: string
  scope: 'global' | 'personal' | 'office'
  createdAt?: string
  updatedAt?: string
}

/**
 * Tag loading state interface
 */
interface ITagState {
  data: IExpenseTag[]
  isLoading: boolean
  error: string | null
}

/**
 * Composable for expense tag management
 * Extracts tag logic from UI components following Clean Architecture
 */
export function useExpenseTags() {
  const { t: _t } = useI18n()

  // State with explicit modeling instead of union types
  const tagState = ref<ITagState>({
    data: [],
    isLoading: false,
    error: null
  })

  // Computed properties
  const tags = computed(() => tagState.value.data)
  const isLoading = computed(() => tagState.value.isLoading)
  const error = computed(() => tagState.value.error)

  const tagOptions = computed(() =>
    tags.value.map(tag => ({
      id: tag.id,
      name: tag.name,
      color: tag.color
    }))
  )

  // Methods
  const getTagById = (tagId: string): IExpenseTag | undefined => {
    return tags.value.find(tag => tag.id === tagId)
  }

  const getTagName = (tagId: string): string => {
    const tag = getTagById(tagId)
    return tag?.name || `Tag ${tagId}`
  }

  const getTagsByIds = (tagIds: string[]): IExpenseTag[] => {
    return tagIds.map(id => getTagById(id)).filter(Boolean) as IExpenseTag[]
  }

  const removeTagFromList = (
    tagId: string, 
    currentTagIds: string[], 
    onChange: (newTagIds: string[]) => void
  ): string[] => {
    const newTagIds = currentTagIds.filter(id => id !== tagId)
    onChange(newTagIds)
    return newTagIds
  }

  const addTagToList = (
    tagId: string,
    currentTagIds: string[],
    onChange: (newTagIds: string[]) => void
  ): string[] => {
    if (currentTagIds.includes(tagId)) {
      return currentTagIds // Already exists
    }
    const newTagIds = [...currentTagIds, tagId]
    onChange(newTagIds)
    return newTagIds
  }

  const validateTagIds = (tagIds: string[]): boolean => {
    return tagIds.every(id => getTagById(id) !== undefined)
  }

  const getTagColor = (tagId: string): string => {
    const tag = getTagById(tagId)
    return tag?.color || '#gray'
  }

  // API methods
  const loadTags = async (): Promise<void> => {
    try {
      tagState.value.isLoading = true
      tagState.value.error = null

      // TODO: Replace with actual API call when backend is ready
      // const response = await $fetch('/api/expenses/tags')
      // tagState.value.data = response.data

      // Mock data for now
      await new Promise(resolve => setTimeout(resolve, 300)) // Simulate API delay
      
      tagState.value.data = [
        {
          id: 'tag1',
          name: '交通費',
          color: '#3b82f6',
          scope: 'global'
        },
        {
          id: 'tag2', 
          name: '東京',
          color: '#10b981',
          scope: 'office'
        },
        {
          id: 'tag3',
          name: '大阪',
          color: '#10b981',
          scope: 'office'
        },
        {
          id: 'tag4',
          name: '出張',
          color: '#f59e0b',
          scope: 'global'
        },
        {
          id: 'tag5',
          name: '裁判所',
          color: '#8b5cf6',
          scope: 'global'
        },
        {
          id: 'tag6',
          name: 'クライアント面談',
          color: '#ec4899',
          scope: 'global'
        },
        {
          id: 'tag7',
          name: '緊急',
          color: '#ef4444',
          scope: 'global'
        },
        {
          id: 'tag8',
          name: '事務用品',
          color: '#6b7280',
          scope: 'office'
        }
      ]

    } catch (err) {
      tagState.value.error = err instanceof Error ? err.message : 'Failed to load tags'
      console.error('Failed to load expense tags:', err)
    } finally {
      tagState.value.isLoading = false
    }
  }

  const createTag = async (tagData: Omit<IExpenseTag, 'id' | 'createdAt' | 'updatedAt'>): Promise<IExpenseTag | null> => {
    try {
      tagState.value.isLoading = true
      tagState.value.error = null

      // TODO: Replace with actual API call
      // const response = await $fetch('/api/expenses/tags', {
      //   method: 'POST',
      //   body: tagData
      // })
      
      // Mock implementation
      const newTag: IExpenseTag = {
        ...tagData,
        id: Date.now().toString(),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }

      tagState.value.data.push(newTag)
      return newTag

    } catch (err) {
      tagState.value.error = err instanceof Error ? err.message : 'Failed to create tag'
      console.error('Failed to create expense tag:', err)
      return null
    } finally {
      tagState.value.isLoading = false
    }
  }

  const deleteTag = async (tagId: string): Promise<boolean> => {
    try {
      tagState.value.isLoading = true
      tagState.value.error = null

      // TODO: Replace with actual API call
      // await $fetch(`/api/expenses/tags/${tagId}`, { method: 'DELETE' })

      // Mock implementation
      tagState.value.data = tagState.value.data.filter(tag => tag.id !== tagId)
      return true

    } catch (err) {
      tagState.value.error = err instanceof Error ? err.message : 'Failed to delete tag'
      console.error('Failed to delete expense tag:', err)
      return false
    } finally {
      tagState.value.isLoading = false
    }
  }

  return {
    // State (readonly to prevent direct mutation)
    tags,
    isLoading,
    error,
    
    // Computed
    tagOptions,
    
    // Methods
    getTagById,
    getTagName,
    getTagsByIds,
    removeTagFromList,
    addTagToList,
    validateTagIds,
    getTagColor,
    
    // API methods
    loadTags,
    createTag,
    deleteTag
  }
}

// Export types for better type safety
export type { IExpenseTag, ITagState }