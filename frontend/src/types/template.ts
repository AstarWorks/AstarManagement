/**
 * Template system types for document generation
 */

export interface Template {
  id: string
  name: string
  description: string
  category: TemplateCategory
  subcategory?: string
  thumbnailUrl: string
  previewUrl: string
  content: string
  variables: TemplateVariable[]
  metadata: TemplateMetadata
  statistics: TemplateStatistics
  isFavorite: boolean
  tags: string[]
  version: string
  createdAt: string
  updatedAt: string
  createdBy: User
}

export interface TemplateCategory {
  id: string
  name: string
  icon: string
  color: string
  count: number
  subcategories?: TemplateCategory[]
}

export interface TemplateVariable {
  key: string
  label: string
  type: 'text' | 'date' | 'number' | 'select' | 'boolean'
  required: boolean
  defaultValue?: any
  options?: string[] // for select type
  description?: string
  placeholder?: string
}

export interface TemplateMetadata {
  language: 'en' | 'ja'
  fileType: 'docx' | 'pdf' | 'html'
  pageCount: number
  estimatedTime: number // minutes
  requiredFields: string[]
  relatedTemplates: string[]
  lastModifiedBy?: string
  approvalStatus?: 'draft' | 'approved' | 'deprecated'
}

export interface TemplateStatistics {
  usageCount: number
  lastUsedAt?: string
  averageCompletionTime?: number
  userRating?: number
  favoriteCount: number
  successRate?: number // completion rate
}

export interface User {
  id: string
  name: string
  email: string
  avatar?: string
  role: string
}

// Search and filter types
export interface TemplateFilters {
  categories: string[]
  fileTypes: string[]
  languages: string[]
  estimatedTimeRange?: [number, number]
  favoritesOnly: boolean
  recentlyUsed: boolean
}

export interface TemplateSortOptions {
  field: 'name' | 'date' | 'usage' | 'rating' | 'estimatedTime'
  direction: 'asc' | 'desc'
}

export interface TemplateSearchQuery {
  query: string
  filters: TemplateFilters
  sort: TemplateSortOptions
}

// Preview and selection types
export interface TemplatePreview {
  template: Template
  renderedContent?: string
  variableValues?: Record<string, any>
}

export interface TemplateSelection {
  template: Template
  selectedVariables: Record<string, any>
  customizations?: Record<string, any>
}

// API response types
export interface TemplateApiResponse {
  templates: Template[]
  categories: TemplateCategory[]
  total: number
  page: number
  pageSize: number
}

export interface TemplateUsageResponse {
  success: boolean
  usageId: string
  updatedStatistics: TemplateStatistics
}

// UI state types
export interface TemplateBrowserState {
  viewMode: 'grid' | 'list'
  selectedTemplate: Template | null
  previewMode: boolean
  searchQuery: string
  filters: TemplateFilters
  sort: TemplateSortOptions
  favorites: Set<string>
  recentlyUsed: string[]
  expandedCategories: Set<string>
}

// Template creation and editing (for future use)
export interface TemplateCreateInput {
  name: string
  description: string
  categoryId: string
  content: string
  variables: Omit<TemplateVariable, 'key'>[]
  metadata: Omit<TemplateMetadata, 'lastModifiedBy' | 'approvalStatus'>
  tags: string[]
}

export interface TemplateUpdateInput extends Partial<TemplateCreateInput> {
  id: string
  version?: string
}