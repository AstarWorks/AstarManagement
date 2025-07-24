/**
 * Kanban Components Index
 * 
 * Export all kanban-related components for easy importing
 */

// Core components
export { default as KanbanBoard } from './KanbanBoard.vue'
export { default as KanbanColumn } from './KanbanColumn.vue'
export { default as MatterCard } from './MatterCard.vue'

// Enhanced components with animations
export { default as KanbanColumnAnimated } from './KanbanColumnAnimated.vue'
export { default as MatterCardEnhanced } from './MatterCardEnhanced.vue'
export { default as MatterCardSkeleton } from './MatterCardSkeleton.vue'

// Additional components
export { default as KanbanColumnEnhanced } from './KanbanColumnEnhanced.vue'
export { default as StatusChangeModal } from './StatusChangeModal.vue'
export { default as QuickActionsPanel } from './QuickActionsPanel.vue'

// Types
export type * from '~/types/kanban'