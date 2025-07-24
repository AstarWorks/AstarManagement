// PDF.js types and interfaces
export interface PdfViewerOptions {
  /** Initial zoom scale */
  scale?: number
  /** Initial page number */
  page?: number
  /** Enable text layer for selection */
  enableTextLayer?: boolean
  /** Enable keyboard shortcuts */
  keyboardShortcuts?: boolean
  /** View mode */
  viewMode?: 'single' | 'continuous'
  /** Show page numbers overlay */
  showPageNumbers?: boolean
}

export interface PdfPage {
  pageNumber: number
  canvas?: HTMLCanvasElement
  rendered: boolean
  width: number
  height: number
  rotation: number
}

export interface PdfViewerState {
  totalPages: number
  currentPage: number
  scale: number
  rotation: number
  loading: boolean
  error: string | null
}

export interface PdfRenderOptions {
  scale?: number
  rotation?: number
  enableTextLayer?: boolean
}

export interface PdfLoadingTask {
  promise: Promise<any>
  destroy(): void
}

export interface PdfDocumentInfo {
  numPages: number
  fingerprint: string
  info?: {
    Title?: string
    Author?: string
    Subject?: string
    Creator?: string
    Producer?: string
    CreationDate?: string
    ModDate?: string
    Keywords?: string
  }
}

export interface PdfPageInfo {
  pageNumber: number
  width: number
  height: number
  rotation: number
  scale: number
}

export interface PdfTextContent {
  items: PdfTextItem[]
  styles: Record<string, any>
}

export interface PdfTextItem {
  str: string
  dir: string
  width: number
  height: number
  transform: number[]
  fontName: string
  hasEOL: boolean
}

export interface PdfViewport {
  width: number
  height: number
  scale: number
  rotation: number
  offsetX: number
  offsetY: number
  transform: number[]
  viewBox: number[]
}

export interface PdfRenderContext {
  canvasContext: CanvasRenderingContext2D
  viewport: PdfViewport
  enableWebGL?: boolean
  renderInteractiveForms?: boolean
  optionalContentConfigPromise?: Promise<any>
}

// Event types
export interface PdfViewerEvents {
  load: (document: any) => void
  error: (error: string) => void
  pageChange: (page: number) => void
  scaleChange: (scale: number) => void
  pageRender: (pageNumber: number) => void
  textLayerRender: (pageNumber: number) => void
}

// Keyboard shortcuts
export interface PdfKeyboardShortcut {
  key: string
  ctrlKey?: boolean
  shiftKey?: boolean
  altKey?: boolean
  description: string
  action: () => void
}

// Zoom presets
export type PdfZoomPreset = 
  | 'auto'
  | 'page-fit'
  | 'page-width'
  | 'page-height'
  | number

// PDF viewer error types
export type PdfViewerError = 
  | 'load-failed'
  | 'render-failed'
  | 'invalid-page'
  | 'memory-limit'
  | 'network-error'
  | 'permission-denied'

export interface PdfViewerErrorInfo {
  type: PdfViewerError
  message: string
  details?: any
  pageNumber?: number
}

// Performance monitoring
export interface PdfPerformanceMetrics {
  loadTime: number
  renderTime: number
  memoryUsage: number
  pagesRendered: number
  cacheHits: number
  cacheMisses: number
}

// Configuration for PDF.js
export interface PdfJsGlobalConfig {
  workerSrc: string
  cMapUrl?: string
  cMapPacked?: boolean
  enableXfa?: boolean
  verbosity?: number
  isEvalSupported?: boolean
  maxImageSize?: number
  disableFontFace?: boolean
  disableRange?: boolean
  disableStream?: boolean
  disableAutoFetch?: boolean
  pdfBug?: boolean
}

export default {}