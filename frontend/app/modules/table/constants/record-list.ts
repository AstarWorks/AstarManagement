/**
 * RecordList constants and configuration
 */

export const RECORD_LIST_CONFIG = {
  DEFAULT_PAGE_SIZE: 50,
  MAX_PINNED_COLUMNS: 3,
  MAX_PINNED_ROWS: 5,
  EXPORT_FORMATS: ['csv', 'json', 'excel'] as const,
  DENSITY_OPTIONS: ['compact', 'normal', 'comfortable'] as const,
  FILTERABLE_TYPES: ['TEXT', 'LONG_TEXT', 'EMAIL', 'URL', 'NUMBER', 'SELECT', 'CHECKBOX', 'DATE', 'DATETIME'] as const
} as const

export type ExportFormat = typeof RECORD_LIST_CONFIG.EXPORT_FORMATS[number]
export type DensityOption = typeof RECORD_LIST_CONFIG.DENSITY_OPTIONS[number]
export type FilterableType = typeof RECORD_LIST_CONFIG.FILTERABLE_TYPES[number]