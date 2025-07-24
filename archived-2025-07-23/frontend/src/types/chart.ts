/**
 * Chart.js Type Definitions for Financial Dashboard
 * 
 * Simplified types for Chart.js integration to avoid complex type conflicts
 */

// Use built-in Chart.js types
export type TooltipContext = any
export type LegendContext = any

// Scale options interface
export interface ScaleOptions {
  stacked?: boolean
  display: boolean
  title?: {
    display: boolean
    text: string
    font: {
      size: number
      weight: 'normal' | 'bold'
    }
  }
  grid?: {
    display: boolean
    color?: string
  }
  beginAtZero?: boolean
  ticks?: {
    callback?: (value: string | number) => string
  }
}

// Export queue item type
export interface ExportQueueItem {
  id: string
  filename: string
  format: 'csv' | 'json' | 'pdf'
  status: 'pending' | 'processing' | 'completed' | 'failed'
  size?: number
  downloadUrl?: string
  createdAt: Date
  progress?: number
}

// Current export type
export interface CurrentExport {
  id: string
  filename: string
  format: 'csv' | 'json' | 'pdf'
  status: 'processing'
  progress: number
}