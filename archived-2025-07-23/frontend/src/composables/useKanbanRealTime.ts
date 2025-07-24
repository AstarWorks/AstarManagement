import { useKanbanStore } from '~/stores/kanban'
import { useRealTimeUpdates } from './useRealTimeUpdates'
import type { Matter } from '~/types/matter'

export interface KanbanUpdate {
  type: 'card_moved' | 'card_created' | 'card_updated' | 'card_deleted'
  cardId: string
  data: any
  timestamp: Date
  userId: string
}

/**
 * Composable for Kanban-specific real-time updates
 * Integrates with the Kanban store to handle card updates
 * 
 * @returns Object containing real-time update state and methods
 */
export function useKanbanRealTime() {
  const kanbanStore = useKanbanStore() as any // TypeScript issue with custom store composable
  const { $toast } = useNuxtApp()
  
  /**
   * Handles individual Kanban updates
   * Updates the store and shows notifications
   */
  const handleUpdate = (update: KanbanUpdate) => {
    switch (update.type) {
      case 'card_moved':
        kanbanStore.actions.moveMatter(update.cardId, update.data.toColumn)
        $toast?.info(`Card moved by ${update.data.userName}`)
        break
        
      case 'card_created':
        kanbanStore.actions.createMatter(update.data.card)
        $toast?.success(`New card created by ${update.data.userName}`)
        break
        
      case 'card_updated':
        kanbanStore.actions.updateMatter(update.cardId, update.data.changes)
        break
        
      case 'card_deleted':
        // Handle card deletion - not implemented in store yet
        $toast?.warning(`Card deleted by ${update.data.userName}`)
        break
    }
  }
  
  const { data, loading, error, lastUpdated, start, stop, refresh } = useRealTimeUpdates({
    endpoint: `/api/kanban/boards/default/updates`,
    interval: 5000, // Poll every 5 seconds
    onUpdate: (updates: KanbanUpdate[]) => {
      if (Array.isArray(updates)) {
        updates.forEach(handleUpdate)
      }
    },
    onError: (error) => {
      console.error('Real-time update error:', error)
      $toast?.error('Failed to fetch updates')
    }
  })
  
  return {
    updates: data,
    loading,
    error,
    lastUpdated,
    start,
    stop,
    refresh
  }
}