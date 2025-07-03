/**
 * Matter Timeline Components Index
 * 
 * Exports all timeline-related components for matter activity tracking
 */

export { default as MatterActivityTimeline } from './MatterActivityTimeline.vue'
export { default as ActivityTimelineItem } from './ActivityTimelineItem.vue'
export { default as ActivityFiltersComponent } from './ActivityFilters.vue'
export { default as ActivityExportDialog } from './ActivityExportDialog.vue'

// Re-export types for convenience
export type { 
  Activity, 
  ActivityType, 
  ActivityViewMode,
  ActivityGroup,
  ActivityResponse,
  ActivityExportOptions,
  ActivityFilters
} from '~/types/activity'

// Re-export composables
export { 
  useActivityTimeline, 
  useActivityRealTime, 
  useActivityUtils 
} from '~/composables/useActivityTimeline'