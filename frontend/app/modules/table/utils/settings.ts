import type { TableSettings, DefaultViewSettings, ViewPreferences } from '../ui-types/settings'
import {
  TableSettingsSchema,
  DefaultViewSettingsSchema,
  ViewPreferencesSchema,
  VersionedTableSettingsSchema,
  DEFAULT_TABLE_SETTINGS,
  DEFAULT_VIEW_SETTINGS,
  DEFAULT_VIEW_PREFERENCES
} from '../ui-types/settings'
import { parseJsonbField, parseVersionedJsonbField } from '~/modules/shared/schemas/jsonb'
import { mergeWithDefaults } from '~/modules/shared/schemas/base'

export function parseTableSettings(data: unknown): TableSettings {
  // undefined の場合は警告なしでデフォルト値を返す
  if (data === undefined || data === null) {
    return DEFAULT_TABLE_SETTINGS
  }
  return parseJsonbField(data, TableSettingsSchema, DEFAULT_TABLE_SETTINGS)
}

export function parseVersionedTableSettings(data: unknown, version?: number): TableSettings {
  const result = parseVersionedJsonbField(data, VersionedTableSettingsSchema, version)
  return result ?? DEFAULT_TABLE_SETTINGS
}

export function parseDefaultViewSettings(data: unknown): DefaultViewSettings {
  return parseJsonbField(data, DefaultViewSettingsSchema, DEFAULT_VIEW_SETTINGS)
}

export function parseViewPreferences(data: unknown): ViewPreferences {
  return parseJsonbField(data, ViewPreferencesSchema, DEFAULT_VIEW_PREFERENCES)
}

export function mergeViewSettings(
  base: DefaultViewSettings,
  override: Partial<DefaultViewSettings>
): DefaultViewSettings {
  return mergeWithDefaults(override, base)
}

export function getActiveViewSettings(
  tableSettings: TableSettings | undefined,
  userPreferences: ViewPreferences | undefined,
  availableColumns?: string[]
): DefaultViewSettings {
  const defaultView = tableSettings?.defaultView ?? DEFAULT_VIEW_SETTINGS
  
  let settings: DefaultViewSettings
  if (!userPreferences || userPreferences.useDefault || !userPreferences.customSettings) {
    settings = defaultView
  } else {
    settings = userPreferences.customSettings
  }
  
  // sortBy が有効なカラムかチェック
  if (availableColumns && settings.sortBy) {
    const validColumns = [
      ...availableColumns,
      ...(settings.showSystemColumns ? ['_createdAt', '_updatedAt'] : [])
    ]
    
    if (!validColumns.includes(settings.sortBy)) {
      // 無効な sortBy の場合は最初の利用可能カラムまたは null に設定
      settings = {
        ...settings,
        sortBy: availableColumns.length > 0 ? availableColumns[0]! : null
      }
    }
  }
  
  return settings
}

export function shouldShowSystemColumns(settings: DefaultViewSettings): boolean {
  return settings.showSystemColumns ?? false
}

export function getVisibleColumns(
  settings: DefaultViewSettings,
  allColumns: string[]
): string[] {
  if (!settings.visibleColumns || settings.visibleColumns.length === 0) {
    return allColumns
  }
  
  return settings.visibleColumns.filter(col => allColumns.includes(col))
}

export function getColumnOrder(
  settings: DefaultViewSettings,
  allColumns: string[]
): string[] {
  if (!settings.columnOrder || settings.columnOrder.length === 0) {
    return allColumns
  }
  
  const orderedColumns = settings.columnOrder.filter(col => allColumns.includes(col))
  const remainingColumns = allColumns.filter(col => !orderedColumns.includes(col))
  
  return [...orderedColumns, ...remainingColumns]
}

export function createDefaultTableSettings(overrides?: Partial<TableSettings>): TableSettings {
  return mergeWithDefaults(overrides ?? {}, DEFAULT_TABLE_SETTINGS)
}

export function createDefaultViewSettings(overrides?: Partial<DefaultViewSettings>): DefaultViewSettings {
  return mergeWithDefaults(overrides ?? {}, DEFAULT_VIEW_SETTINGS)
}

export function resetToDefaultView(): ViewPreferences {
  return {
    useDefault: true,
    customSettings: null
  }
}

export function createCustomViewPreferences(settings: DefaultViewSettings): ViewPreferences {
  return {
    useDefault: false,
    customSettings: settings
  }
}