/**
 * Generic validation error for form fields
 */
export interface IValidationError {
  /** Field name that has the error */
  field: string
  /** Human-readable error message */
  message: string
  /** Error code for programmatic handling */
  code: string
}

/**
 * Generic form state wrapper for any form data type
 */
export interface IFormState<T> {
  /** Current form data */
  data: T
  /** Array of validation errors */
  errors: IValidationError[]
  /** Whether the form is valid (no errors) */
  isValid: boolean
  /** Whether the form has been modified from initial state */
  isDirty: boolean
  /** Whether the form is currently being submitted */
  isSubmitting: boolean
  /** Whether the form has been touched by the user */
  isTouched: boolean
}

/**
 * Generic loading state for async operations
 */
export interface ILoadingState {
  /** Whether the operation is currently loading */
  isLoading: boolean
  /** Error message if the operation failed */
  error?: string
  /** Whether the operation was successful */
  isSuccess?: boolean
}

/**
 * Extended loading state with progress information
 */
export interface IProgressLoadingState extends ILoadingState {
  /** Progress percentage (0-100) */
  progress?: number
  /** Current status message */
  statusMessage?: string
  /** Estimated time remaining in seconds */
  estimatedTimeRemaining?: number
}

/**
 * Generic table column definition
 */
export interface ITableColumn<T> {
  /** Property key to display from the data object */
  key: keyof T
  /** Display label for the column header */
  label: string
  /** Whether this column is sortable */
  sortable?: boolean
  /** Column width (CSS value) */
  width?: string
  /** Minimum column width (CSS value) */
  minWidth?: string
  /** Maximum column width (CSS value) */
  maxWidth?: string
  /** Custom render function for cell content */
  render?: (value: unknown, item: T, index: number) => string
  /** CSS class for the column */
  className?: string
  /** Whether the column is visible */
  visible?: boolean
  /** Column alignment */
  align?: 'left' | 'center' | 'right'
}

/**
 * Table sort configuration
 */
export interface ITableSort {
  /** Field to sort by */
  field: string
  /** Sort direction */
  direction: 'ASC' | 'DESC'
}

/**
 * Generic filter option for dropdowns and multi-select
 */
export interface IFilterOption {
  /** Option value */
  value: string
  /** Display label */
  label: string
  /** Optional count or badge number */
  count?: number
  /** Whether the option is disabled */
  disabled?: boolean
  /** Optional description */
  description?: string
  /** Optional icon */
  icon?: string
  /** Optional color */
  color?: string
}

/**
 * Pagination configuration
 */
export interface IPaginationState {
  /** Current page number (1-based) */
  currentPage: number
  /** Items per page */
  pageSize: number
  /** Total number of items */
  totalItems: number
  /** Total number of pages */
  totalPages: number
  /** Whether there is a previous page */
  hasPrevious: boolean
  /** Whether there is a next page */
  hasNext: boolean
}

/**
 * Date range picker state
 */
export interface IDateRange {
  /** Start date (ISO string) */
  startDate?: string
  /** End date (ISO string) */
  endDate?: string
}

/**
 * Modal dialog state
 */
export interface IModalState {
  /** Whether the modal is open */
  isOpen: boolean
  /** Modal title */
  title?: string
  /** Modal content data */
  data?: Record<string, unknown>
  /** Modal size */
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  /** Whether the modal can be closed by clicking outside */
  closable?: boolean
}

/**
 * Toast notification configuration
 */
export interface IToastNotification {
  /** Unique identifier */
  id: string
  /** Notification type */
  type: 'success' | 'error' | 'warning' | 'info'
  /** Notification title */
  title: string
  /** Notification message */
  message?: string
  /** Auto-dismiss timeout in milliseconds */
  timeout?: number
  /** Whether the notification can be manually dismissed */
  dismissible?: boolean
  /** Optional action button */
  action?: {
    label: string
    handler: () => void
  }
}

/**
 * Generic search state
 */
export interface ISearchState {
  /** Current search query */
  query: string
  /** Whether search is active */
  isActive: boolean
  /** Search results count */
  resultCount?: number
  /** Whether search is loading */
  isLoading: boolean
}

/**
 * File upload state
 */
export interface IFileUploadState {
  /** Array of files being uploaded */
  files: File[]
  /** Upload progress percentage (0-100) */
  progress: number
  /** Upload status */
  status: 'idle' | 'uploading' | 'completed' | 'error'
  /** Error message if upload failed */
  error?: string
  /** Uploaded file IDs */
  uploadedIds: string[]
}

/**
 * Generic dropdown/select state
 */
export interface ISelectState<T> {
  /** Available options */
  options: IFilterOption[]
  /** Selected value(s) */
  selected: T | T[]
  /** Whether the dropdown is open */
  isOpen: boolean
  /** Whether the dropdown is loading options */
  isLoading: boolean
  /** Search query for filtering options */
  searchQuery?: string
}

/**
 * Data table state with filtering, sorting, and pagination
 */
export interface IDataTableState<T> {
  /** Table data */
  data: T[]
  /** Column definitions */
  columns: ITableColumn<T>[]
  /** Current sort configuration */
  sort: ITableSort
  /** Pagination state */
  pagination: IPaginationState
  /** Loading state */
  loading: ILoadingState
  /** Selected row IDs */
  selectedIds: string[]
  /** Whether all rows are selected */
  isAllSelected: boolean
}

/**
 * Theme configuration
 */
export interface IThemeConfig {
  /** Theme mode */
  mode: 'light' | 'dark' | 'auto'
  /** Primary color */
  primaryColor: string
  /** Secondary color */
  secondaryColor: string
  /** Font size scale */
  fontSize: 'small' | 'medium' | 'large'
  /** Reduced motion preference */
  reducedMotion: boolean
}

/**
 * Responsive breakpoint configuration
 */
export interface IBreakpoints {
  /** Mobile breakpoint */
  mobile: number
  /** Tablet breakpoint */
  tablet: number
  /** Desktop breakpoint */
  desktop: number
  /** Large desktop breakpoint */
  desktop_lg: number
}

/**
 * Generic async operation result
 */
export interface IAsyncResult<T, E = string> {
  /** Whether the operation was successful */
  success: boolean
  /** Result data if successful */
  data?: T
  /** Error information if failed */
  error?: E
  /** Operation timestamp */
  timestamp: string
}

// State Component Types

/**
 * Loading spinner component props
 */
export interface ILoadingSpinnerProps {
  /** Size variant */
  size?: 'sm' | 'md' | 'lg'
  /** Color variant */
  variant?: 'primary' | 'secondary' | 'muted'
  /** Loading label text */
  label?: string
  /** Whether to display inline */
  inline?: boolean
}

/**
 * Skeleton component props
 */
export interface ISkeletonProps {
  /** Visual variant */
  variant?: 'text' | 'circular' | 'rectangular' | 'rounded'
  /** Width (CSS value or pixels) */
  width?: string | number
  /** Height (CSS value or pixels) */
  height?: string | number
  /** Animation type */
  animation?: 'pulse' | 'wave' | false
  /** Number of skeleton items */
  count?: number
}

/**
 * Empty state action button configuration
 */
export interface IEmptyStateAction {
  /** Button label */
  label: string
  /** Click handler */
  onClick: () => void
  /** Button variant */
  variant?: 'default' | 'secondary' | 'ghost' | 'outline'
  /** Loading state */
  loading?: boolean
}

/**
 * Empty state component props
 */
export interface IEmptyStateProps {
  /** Title text */
  title: string
  /** Description text */
  description?: string
  /** Icon (string emoji or Vue component) */
  icon?: string | Component
  /** Primary action button */
  primaryAction?: IEmptyStateAction
  /** Secondary action buttons */
  secondaryActions?: IEmptyStateAction[]
  /** Compact layout */
  compact?: boolean
}

/**
 * Error display component props
 */
export interface IErrorDisplayProps {
  /** Error object or message */
  error: Error | string
  /** Error title */
  title?: string
  /** Show retry button */
  showRetry?: boolean
  /** Show support contact */
  showSupport?: boolean
  /** Custom retry label */
  retryLabel?: string
  /** Retry handler */
  onRetry?: () => void | Promise<void>
  /** Support email */
  supportEmail?: string
}

/**
 * Validation error object
 */
export interface IValidationErrorItem {
  /** Field name (optional) */
  field?: string
  /** Error message */
  message: string
  /** Error code (optional) */
  code?: string
}

/**
 * Filter configuration for empty states
 */
export interface IFilterConfig {
  /** Filter label */
  label: string
  /** Filter value */
  value: string | string[]
  /** Filter type */
  type: 'single' | 'multiple'
}