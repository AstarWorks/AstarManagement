import { z } from 'zod'
import { createVersionedSchema } from '~/modules/shared/schemas/base'
import { createJsonbSchema } from '~/modules/shared/schemas/jsonb'

export const DensitySchema = z.enum(['compact', 'normal', 'comfortable'])
export type Density = z.infer<typeof DensitySchema>

export const SortOrderSchema = z.enum(['asc', 'desc'])
export type SortOrder = z.infer<typeof SortOrderSchema>

export const DefaultViewSettingsSchema = z.object({
  sortBy: z.string().nullable(),
  sortOrder: SortOrderSchema,
  visibleColumns: z.array(z.string()).optional(),
  columnOrder: z.array(z.string()).optional(),
  showSystemColumns: z.boolean().optional(),
  density: DensitySchema.optional()
})

export type DefaultViewSettings = z.infer<typeof DefaultViewSettingsSchema>

export const ViewPreferencesSchema = z.object({
  useDefault: z.boolean(),
  customSettings: DefaultViewSettingsSchema.nullable()
})

export type ViewPreferences = z.infer<typeof ViewPreferencesSchema>

export const ColumnWidthSchema = z.object({
  columnId: z.string(),
  width: z.number().min(50).max(1000)
})

export type ColumnWidth = z.infer<typeof ColumnWidthSchema>

export const FilterConditionSchema = z.object({
  field: z.string(),
  operator: z.enum(['equals', 'contains', 'startsWith', 'endsWith', 'gt', 'gte', 'lt', 'lte', 'between', 'in', 'notIn', 'isNull', 'isNotNull']),
  value: z.unknown().optional(),
  values: z.array(z.unknown()).optional()
})

export type FilterCondition = z.infer<typeof FilterConditionSchema>

export const FilterGroupSchema = z.object({
  operator: z.enum(['and', 'or']),
  conditions: z.array(FilterConditionSchema)
})

export type FilterGroup = z.infer<typeof FilterGroupSchema>

export const SavedViewSchema = z.object({
  id: z.string(),
  name: z.string(),
  description: z.string().optional(),
  isDefault: z.boolean().optional(),
  settings: DefaultViewSettingsSchema,
  filters: FilterGroupSchema.optional(),
  columnWidths: z.array(ColumnWidthSchema).optional(),
  createdAt: z.string().datetime(),
  updatedAt: z.string().datetime()
})

export type SavedView = z.infer<typeof SavedViewSchema>

export const TableSettingsSchema = z.object({
  defaultView: DefaultViewSettingsSchema.optional(),
  savedViews: z.array(SavedViewSchema).optional(),
  allowCustomViews: z.boolean().optional(),
  maxSavedViews: z.number().optional(),
  version: z.number().optional()
})

export type TableSettings = z.infer<typeof TableSettingsSchema>

export const TableSettingsJsonbSchema = createJsonbSchema(TableSettingsSchema)

export const VersionedTableSettingsSchema = createVersionedSchema(
  TableSettingsSchema,
  1,
  new Map([
    [1, (data: unknown) => {
      const obj = data as Record<string, unknown>
      if (!obj.version) {
        return {
          ...obj,
          version: 1,
          defaultView: obj.defaultView || {
            sortBy: '_updatedAt',
            sortOrder: 'desc',
            showSystemColumns: false,
            density: 'normal'
          }
        }
      }
      return obj
    }]
  ])
)

export const DEFAULT_TABLE_SETTINGS: TableSettings = {
  defaultView: {
    sortBy: '_updatedAt',
    sortOrder: 'desc',
    showSystemColumns: false,
    density: 'normal'
  },
  allowCustomViews: true,
  maxSavedViews: 10,
  savedViews: [],
  version: 1
}

export const DEFAULT_VIEW_SETTINGS: DefaultViewSettings = {
  sortBy: '_updatedAt',
  sortOrder: 'desc',
  showSystemColumns: false,
  density: 'normal'
}

export const DEFAULT_VIEW_PREFERENCES: ViewPreferences = {
  useDefault: true,
  customSettings: null
}