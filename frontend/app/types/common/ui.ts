/**
 * Generic validation error for form fields
 */
export interface ValidationError {
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
export interface FormState<T> {
  /** Current form data */
  data: T
  /** Array of validation errors */
  errors: ValidationError[]
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
export interface LoadingState {
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
export interface ProgressLoadingState extends LoadingState {
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
export interface TableColumn<T> {
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
  render?: (value: any, item: T, index: number) => string
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
export interface TableSort {
  /** Field to sort by */
  field: string
  /** Sort direction */
  direction: 'ASC' | 'DESC'
}

/**
 * Generic filter option for dropdowns and multi-select
 */
export interface FilterOption {
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
export interface PaginationState {
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
export interface DateRange {
  /** Start date (ISO string) */
  startDate?: string
  /** End date (ISO string) */
  endDate?: string
}

/**
 * Modal dialog state
 */
export interface ModalState {
  /** Whether the modal is open */
  isOpen: boolean
  /** Modal title */
  title?: string
  /** Modal content data */
  data?: any
  /** Modal size */
  size?: 'small' | 'medium' | 'large' | 'fullscreen'
  /** Whether the modal can be closed by clicking outside */
  closable?: boolean
}

/**
 * Toast notification configuration
 */
export interface ToastNotification {
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
export interface SearchState {
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
export interface FileUploadState {
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
export interface SelectState<T> {
  /** Available options */
  options: FilterOption[]
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
export interface DataTableState<T> {
  /** Table data */
  data: T[]
  /** Column definitions */
  columns: TableColumn<T>[]
  /** Current sort configuration */
  sort: TableSort
  /** Pagination state */
  pagination: PaginationState
  /** Loading state */
  loading: LoadingState
  /** Selected row IDs */
  selectedIds: string[]
  /** Whether all rows are selected */
  isAllSelected: boolean
}

/**
 * Theme configuration
 */
export interface ThemeConfig {
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
export interface Breakpoints {
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
export interface AsyncResult<T, E = string> {
  /** Whether the operation was successful */
  success: boolean
  /** Result data if successful */
  data?: T
  /** Error information if failed */
  error?: E
  /** Operation timestamp */
  timestamp: string
}