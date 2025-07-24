/**
 * Receipt Components Export Index
 * 
 * Centralized exports for all receipt-related components and utilities.
 */

// Core Components
export { default as ReceiptCamera } from './ReceiptCamera.vue'
export { default as ReceiptGallery } from './ReceiptGallery.vue'
export { default as ReceiptUpload } from './ReceiptUpload.vue'

// Composables
export { useCamera } from '~/composables/useCamera'
export { useReceipts } from '~/composables/useReceipts'
export { useOcrProcessing } from '~/composables/useOcrProcessing'

// Utilities
export * from '~/utils/imageCompression'

// Types only (avoid duplicate exports)
export type { Receipt, OcrResult, OcrStatus } from '~/schemas/receipt'