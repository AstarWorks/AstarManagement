/**
 * Tag scope enumeration defining tag visibility and ownership
 * Maps to backend TagScope enum from M002 API specifications
 */
export enum TagScope {
  /** Tag is visible to all users in the tenant */
  TENANT = 'TENANT',
  /** Tag is private to the individual user */
  PERSONAL = 'PERSONAL'
}

/**
 * Tag entity for categorizing and organizing expenses
 * Maps to backend Tag entity from M002 API specifications
 */
export interface Tag {
  /** Unique identifier for the tag */
  id: string
  /** Tenant ID for multi-tenancy isolation */
  tenantId: string
  /** Display name of the tag */
  name: string
  /** Color code for visual representation (hex format: #RRGGBB) */
  color: string
  /** Scope determining tag visibility */
  scope: TagScope
  /** Owner user ID (required for PERSONAL scope tags) */
  ownerId?: string
  /** Number of times this tag has been used */
  usageCount: number
  /** Timestamp when the tag was last used */
  lastUsedAt?: string
  /** Timestamp when the tag was created */
  createdAt: string
  /** User ID who created the tag */
  createdBy: string
}

/**
 * Request DTO for creating a new tag
 * Maps to backend CreateTagRequest from M002 API specifications
 */
export interface CreateTagRequest {
  /** Name of the tag to create */
  name: string
  /** Color code in hex format (e.g., #FF5733) */
  color: string
  /** Optional scope (defaults to TENANT) */
  scope?: TagScope
}

/**
 * Request DTO for updating an existing tag
 * Maps to backend UpdateTagRequest from M002 API specifications
 */
export interface UpdateTagRequest {
  /** Optional new name for the tag */
  name?: string
  /** Optional new color for the tag */
  color?: string
}

/**
 * Tag with usage statistics for UI display
 */
export interface TagWithStats extends Tag {
  /** Recent usage trend (positive for increasing, negative for decreasing) */
  usageTrend: number
  /** Total expense amount associated with this tag */
  totalAmount: number
  /** Average expense amount per transaction */
  averageAmount: number
}

/**
 * Tag filter criteria for search and filtering
 */
export interface TagFilter {
  /** Filter by tag scope */
  scope?: TagScope
  /** Search query for tag names */
  search?: string
  /** Filter by owner ID (for PERSONAL tags) */
  ownerId?: string
  /** Sort by field */
  sortBy?: 'name' | 'usageCount' | 'lastUsedAt' | 'createdAt'
  /** Sort order */
  sortOrder?: 'ASC' | 'DESC'
}

/**
 * Predefined color palette for tag creation
 */
export const TAG_COLORS = [
  '#FF5733', // Red-Orange
  '#33FF57', // Green
  '#3357FF', // Blue
  '#FF33F1', // Magenta
  '#F1FF33', // Yellow
  '#33FFF1', // Cyan
  '#FF8C33', // Orange
  '#8C33FF', // Purple
  '#33FF8C', // Light Green
  '#FF338C', // Pink
  '#8CFF33', // Lime
  '#338CFF'  // Light Blue
] as const

/**
 * Type for predefined tag colors
 */
export type TagColor = typeof TAG_COLORS[number]