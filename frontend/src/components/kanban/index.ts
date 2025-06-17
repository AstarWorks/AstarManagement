/**
 * Kanban Board Components Export Index
 * 
 * Centralized exports for all Kanban board components and types.
 * This provides a clean API surface for importing Kanban functionality.
 */

// ===== FOUNDATIONAL COMPONENTS (T01_S02 SCOPE) =====
export { KanbanBoardFoundation } from './KanbanBoardFoundation'

// Main components (includes advanced features from T03-T05)
export { KanbanBoard } from './KanbanBoard'
export { KanbanBoardContainer } from './KanbanBoardContainer'
export { KanbanColumn } from './KanbanColumn'
export { MatterCard } from './MatterCard'
export { KanbanEmptyState } from './KanbanEmptyState'
export { FilterBar } from './FilterBar'

// Types and interfaces
export type {
  // Foundational types (T01_S02 scope)
  KanbanBoardFoundationProps,
  KanbanColumnFoundationProps,
  FoundationConfig,
  LanguagePreference,
  
  // Full feature types (T03-T05 scope)
  MatterStatus,
  MatterPriority,
  UserRole,
  KanbanColumn as KanbanColumnType,
  MatterCard as MatterCardType,
  KanbanBoard as KanbanBoardType,
  FilterOptions,
  SortOptions,
  ViewPreferences,
  DragContext,
  BoardActions,
  KanbanBoardProps,
  KanbanColumnProps,
  MatterCardProps,
  KanbanEmptyStateProps,
  AnimationConfig,
  VirtualScrollConfig,
  BoardError,
  BoardMetrics
} from './types'

// Constants and configuration
export {
  DEFAULT_COLUMNS,
  PRIORITY_COLORS,
  STATUS_COLORS,
  ANIMATION_CONFIG,
  VIRTUAL_SCROLL_CONFIG,
  DEFAULT_VIEW_PREFERENCES,
  BOARD_CONFIG,
  BREAKPOINTS,
  DEFAULT_FILTERS,
  DEFAULT_SORTING,
  DND_CONFIG,
  ERROR_MESSAGES,
  SUCCESS_MESSAGES,
  KEYBOARD_SHORTCUTS,
  A11Y_LABELS,
  COLUMN_ICONS,
  PRIORITY_ICONS,
  PERFORMANCE_THRESHOLDS
} from './constants'

// Zod schemas for runtime validation
export { MatterStatus as MatterStatusSchema, MatterPriority as PrioritySchema, UserRole as UserRoleSchema } from './types'