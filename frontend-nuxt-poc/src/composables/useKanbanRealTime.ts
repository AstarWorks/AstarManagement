import { storeToRefs } from 'pinia'
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
  const kanbanStore = useKanbanStore()
  const { currentBoardId } = storeToRefs(kanbanStore)
  const { $toast } = useNuxtApp()
  
  /**
   * Handles individual Kanban updates
   * Updates the store and shows notifications
   */
  const handleUpdate = (update: KanbanUpdate) => {
    switch (update.type) {
      case 'card_moved':
        kanbanStore.moveCard(update.cardId, update.data.fromColumn, update.data.toColumn)
        $toast?.info(`Card moved by ${update.data.userName}`)
        break
        
      case 'card_created':
        kanbanStore.addCard(update.data.card)
        $toast?.success(`New card created by ${update.data.userName}`)
        break
        
      case 'card_updated':
        kanbanStore.updateCard(update.cardId, update.data.changes)
        break
        
      case 'card_deleted':
        kanbanStore.removeCard(update.cardId)
        $toast?.warning(`Card deleted by ${update.data.userName}`)
        break
    }
  }
  
  const { data, loading, error, lastUpdated, start, stop, refresh } = useRealTimeUpdates({
    endpoint: `/api/kanban/boards/${currentBoardId.value}/updates`,
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