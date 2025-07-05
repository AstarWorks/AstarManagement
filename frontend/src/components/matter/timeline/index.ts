/**
 * Matter Timeline Components Index
 * 
 * Exports all timeline-related components for matter activity tracking
 */

export { default as MatterActivityTimeline } from './MatterActivityTimeline.vue'
export { default as MatterActivityTimelineItem } from './ActivityTimelineItem.vue'
export { default as MatterActivityFiltersComponent } from './ActivityFilters.vue'
export { default as MatterActivityExportDialog } from './ActivityExportDialog.vue'

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