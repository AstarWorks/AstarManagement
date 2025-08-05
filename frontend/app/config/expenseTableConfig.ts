import type { TableColumn } from '~/composables/useTableColumns'

/**
 * Default column configuration for expense table
 * Centralized configuration following Simple over Easy principle
 */
export const DEFAULT_EXPENSE_COLUMNS: TableColumn[] = [
  {
    key: 'date',
    label: '日付',
    sortable: true,
    visible: true,
    resizable: true,
    align: 'left',
    width: 120,
    minWidth: 100
  },
  {
    key: 'category', 
    label: 'カテゴリ',
    sortable: true,
    visible: true,
    resizable: true,
    align: 'left',
    width: 130,
    minWidth: 100
  },
  {
    key: 'description',
    label: '説明',
    sortable: true,
    visible: true,
    resizable: true,
    align: 'left',
    minWidth: 200
  },
  {
    key: 'amount',
    label: '金額',
    sortable: true,
    visible: true,
    resizable: true,
    align: 'right',
    width: 140,
    minWidth: 120
  },
  {
    key: 'balance',
    label: '残高',
    sortable: true,
    visible: true,
    resizable: true,
    align: 'right',
    width: 140,
    minWidth: 120
  },
  {
    key: 'case',
    label: '案件',
    sortable: false,
    visible: false,
    resizable: true,
    align: 'left',
    width: 120,
    minWidth: 100
  },
  {
    key: 'tags',
    label: 'タグ',
    sortable: false,
    visible: false,
    resizable: true,
    align: 'left',
    width: 160,
    minWidth: 120
  },
  {
    key: 'memo',
    label: 'メモ',
    sortable: false,
    visible: false,
    resizable: true,
    align: 'left',
    minWidth: 150
  },
  {
    key: 'attachments',
    label: '添付',
    sortable: false,
    visible: false,
    resizable: true,
    align: 'center',
    width: 80,
    minWidth: 80
  }
]

/**
 * Default table settings
 */
export const DEFAULT_TABLE_SETTINGS = {
  pageSize: 20,
  pageSizeOptions: [10, 20, 50, 100],
  defaultSortBy: 'date',
  defaultSortOrder: 'DESC' as const,
  enableSelection: true,
  enableSorting: true,
  enableColumnResize: false, // Future feature
  enableColumnReorder: false, // Future feature
  showRowNumbers: false,
  stickyHeader: true,
  virtualScrolling: false // For large datasets
}

/**
 * Bulk action configuration
 */
export const BULK_ACTIONS = [
  {
    key: 'edit',
    label: '一括編集',
    icon: 'lucide:edit',
    variant: 'outline' as const,
    confirmRequired: false
  },
  {
    key: 'delete',
    label: '一括削除',
    icon: 'lucide:trash',
    variant: 'destructive' as const,
    confirmRequired: true
  },
  {
    key: 'export',
    label: 'エクスポート',
    icon: 'lucide:download',
    variant: 'outline' as const,
    confirmRequired: false
  },
  {
    key: 'tag',
    label: 'タグ付け',
    icon: 'lucide:tag',
    variant: 'outline' as const,
    confirmRequired: false
  }
] as const

/**
 * Row action configuration
 */
export const ROW_ACTIONS = [
  {
    key: 'view',
    label: '表示',
    icon: 'lucide:eye',
    shortcut: 'Enter'
  },
  {
    key: 'edit',
    label: '編集',
    icon: 'lucide:edit',
    shortcut: 'e'
  },
  {
    key: 'duplicate',
    label: '複製',
    icon: 'lucide:copy',
    shortcut: 'd'
  },
  {
    key: 'delete',
    label: '削除',
    icon: 'lucide:trash',
    variant: 'destructive' as const,
    shortcut: 'Delete',
    confirmRequired: true
  }
] as const

/**
 * Category badge styling configuration
 * Centralized to avoid duplication with ExpenseFormatters
 */
export const CATEGORY_STYLES: Record<string, string> = {
  '交通費': 'border-blue-200 text-blue-700 bg-blue-50',
  '印紙代': 'border-red-200 text-red-700 bg-red-50', 
  'コピー代': 'border-green-200 text-green-700 bg-green-50',
  '郵送料': 'border-yellow-200 text-yellow-700 bg-yellow-50',
  'その他': 'border-purple-200 text-purple-700 bg-purple-50'
}

/**
 * Empty state configuration
 */
export const EMPTY_STATE_CONFIG = {
  icon: 'lucide:receipt',
  title: 'expense.list.empty.title',
  description: 'expense.list.empty.description',
  actionLabel: 'expense.actions.create',
  actionIcon: 'lucide:plus'
}

/**
 * Mobile view configuration
 */
export const MOBILE_CONFIG = {
  cardPadding: 'p-4',
  showCategories: true,
  showTags: true,
  maxTagsDisplay: 2,
  showMemo: true,
  truncateMemo: true,
  showAttachmentIndicator: true
}

/**
 * Responsive breakpoints for table display
 */
export const TABLE_BREAKPOINTS = {
  mobile: 0,
  tablet: 768,
  desktop: 1024,
  wide: 1280
}

/**
 * Accessibility configuration
 */
export const A11Y_CONFIG = {
  tableRole: 'table',
  selectionAriaLabel: '行を選択',
  sortAriaLabel: '並び替え',
  bulkActionsAriaLabel: '一括操作',
  rowActionsAriaLabel: '行操作',
  announceSelectionChanges: true,
  announceSortChanges: true
}

/**
 * Get expense table configuration
 */
export function getExpenseTableConfig() {
  return {
    columns: DEFAULT_EXPENSE_COLUMNS,
    settings: DEFAULT_TABLE_SETTINGS,
    bulkActions: BULK_ACTIONS,
    rowActions: ROW_ACTIONS,
    categoryStyles: CATEGORY_STYLES,
    emptyState: EMPTY_STATE_CONFIG,
    mobile: MOBILE_CONFIG,
    breakpoints: TABLE_BREAKPOINTS,
    a11y: A11Y_CONFIG
  }
}

/**
 * Configuration validation helpers
 */
export function validateTableConfig(config: unknown): boolean {
  // Basic validation - can be extended with Zod schemas
  if (!config || typeof config !== 'object') return false
  
  const c = config as Record<string, unknown>
  return (
    Array.isArray(c.columns) &&
    c.columns.length > 0 &&
    typeof c.settings === 'object'
  )
}

/**
 * Export for use in composables
 */
export { DEFAULT_EXPENSE_COLUMNS as defaultExpenseColumns }