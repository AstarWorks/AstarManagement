export type AnnotationType = 'highlight' | 'note' | 'drawing'

export interface PdfAnnotation {
  id: string
  type: AnnotationType
  page: number
  coordinates: {
    x: number
    y: number
    width?: number
    height?: number
  }
  content?: string
  color?: string
  createdAt: Date
  createdBy: string
  updatedAt?: Date
  updatedBy?: string
}

export interface AnnotationStore {
  annotations: PdfAnnotation[]
  selectedAnnotation: PdfAnnotation | null
  annotationMode: AnnotationType | null
}

export interface CreateAnnotationInput {
  type: AnnotationType
  page: number
  coordinates: {
    x: number
    y: number
    width?: number
    height?: number
  }
  content?: string
  color?: string
}

export interface UpdateAnnotationInput {
  coordinates?: {
    x: number
    y: number
    width?: number
    height?: number
  }
  content?: string
  color?: string
}

// Default annotation colors
export const ANNOTATION_COLORS = {
  highlight: {
    yellow: '#FBBF24',
    green: '#10B981',
    blue: '#3B82F6',
    pink: '#EC4899',
    purple: '#8B5CF6'
  },
  note: {
    orange: '#F59E0B',
    red: '#EF4444',
    blue: '#3B82F6',
    green: '#10B981'
  }
} as const

export type AnnotationColor = keyof typeof ANNOTATION_COLORS.highlight | keyof typeof ANNOTATION_COLORS.note