import type { CompressionOptions } from '~/schemas/receipt'

/**
 * Image Compression Utilities
 * 
 * Provides client-side image compression and optimization for receipt photos.
 * Optimizes file size while maintaining quality suitable for OCR processing.
 */

export interface CompressionResult {
  blob: Blob
  originalSize: number
  compressedSize: number
  compressionRatio: number
  dimensions: {
    width: number
    height: number
  }
  format: string
}

export interface ImageMetadata {
  width: number
  height: number
  aspectRatio: number
  fileSize: number
  format: string
  quality?: number
}

/**
 * Compress an image file or blob with specified options
 */
export async function compressImage(
  file: File | Blob, 
  options: Partial<CompressionOptions> = {}
): Promise<CompressionResult> {
  const {
    maxWidth = 1920,
    maxHeight = 1080,
    quality = 0.8,
    format = 'jpeg',
    maxFileSize = 2 * 1024 * 1024 // 2MB default
  } = options

  return new Promise((resolve, reject) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()

    if (!ctx) {
      reject(new Error('Canvas not supported'))
      return
    }

    img.onload = () => {
      try {
        // Calculate optimal dimensions while preserving aspect ratio
        const { width: newWidth, height: newHeight } = calculateOptimalDimensions(
          img.width, 
          img.height, 
          maxWidth, 
          maxHeight
        )

        canvas.width = newWidth
        canvas.height = newHeight

        // Apply image enhancement for better OCR results
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'
        
        // Draw image with white background (helpful for transparent images)
        ctx.fillStyle = '#FFFFFF'
        ctx.fillRect(0, 0, newWidth, newHeight)
        
        // Draw the image
        ctx.drawImage(img, 0, 0, newWidth, newHeight)

        // Apply post-processing for receipt optimization
        optimizeForOCR(ctx, newWidth, newHeight)

        // Convert to blob with compression
        const mimeType = `image/${format}`
        
        canvas.toBlob((blob) => {
          if (!blob) {
            reject(new Error('Compression failed'))
            return
          }

          const originalSize = file.size
          const compressedSize = blob.size
          const compressionRatio = originalSize / compressedSize

          // Check if we need to compress further to meet size limit
          if (blob.size > maxFileSize && quality > 0.1) {
            // Recursively compress with lower quality
            const newQuality = Math.max(0.1, quality - 0.1)
            compressImage(file, { ...options, quality: newQuality })
              .then(resolve)
              .catch(reject)
            return
          }

          const result: CompressionResult = {
            blob,
            originalSize,
            compressedSize,
            compressionRatio,
            dimensions: {
              width: newWidth,
              height: newHeight
            },
            format: mimeType
          }

          console.log('Image compression completed:', {
            originalSize: formatFileSize(originalSize),
            compressedSize: formatFileSize(compressedSize),
            compressionRatio: `${compressionRatio.toFixed(2)}x`,
            dimensions: `${newWidth}x${newHeight}`,
            quality
          })

          resolve(result)

        }, mimeType, quality)

      } catch (err) {
        reject(new Error(`Image processing failed: ${err}`))
      }
    }

    img.onerror = () => {
      reject(new Error('Failed to load image'))
    }

    // Create object URL for the image
    img.src = URL.createObjectURL(file)
  })
}

/**
 * Calculate optimal dimensions while preserving aspect ratio
 */
function calculateOptimalDimensions(
  originalWidth: number, 
  originalHeight: number, 
  maxWidth: number, 
  maxHeight: number
): { width: number; height: number } {
  let width = originalWidth
  let height = originalHeight

  // Scale down if too large
  if (width > maxWidth) {
    height = (height * maxWidth) / width
    width = maxWidth
  }
  
  if (height > maxHeight) {
    width = (width * maxHeight) / height
    height = maxHeight
  }

  // Ensure minimum dimensions for OCR
  const minWidth = 800
  const minHeight = 600

  if (width < minWidth && height < minHeight) {
    const scaleUp = Math.min(minWidth / width, minHeight / height)
    width *= scaleUp
    height *= scaleUp
  }

  return {
    width: Math.round(width),
    height: Math.round(height)
  }
}

/**
 * Apply image optimizations for better OCR results
 */
function optimizeForOCR(
  ctx: CanvasRenderingContext2D, 
  width: number, 
  height: number
): void {
  // Get image data for processing
  const imageData = ctx.getImageData(0, 0, width, height)
  const data = imageData.data

  // Apply contrast enhancement and noise reduction
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i]
    const g = data[i + 1]
    const b = data[i + 2]

    // Convert to grayscale for better OCR (optional)
    // const gray = 0.299 * r + 0.587 * g + 0.114 * b
    // data[i] = data[i + 1] = data[i + 2] = gray

    // Enhance contrast
    const contrast = 1.2
    const enhancedR = Math.min(255, Math.max(0, (r - 128) * contrast + 128))
    const enhancedG = Math.min(255, Math.max(0, (g - 128) * contrast + 128))
    const enhancedB = Math.min(255, Math.max(0, (b - 128) * contrast + 128))

    data[i] = enhancedR
    data[i + 1] = enhancedG
    data[i + 2] = enhancedB
    // Alpha channel remains unchanged
  }

  // Put processed image data back
  ctx.putImageData(imageData, 0, 0)
}

/**
 * Get image metadata without compression
 */
export async function getImageMetadata(file: File | Blob): Promise<ImageMetadata> {
  return new Promise((resolve, reject) => {
    const img = new Image()

    img.onload = () => {
      const metadata: ImageMetadata = {
        width: img.width,
        height: img.height,
        aspectRatio: img.width / img.height,
        fileSize: file.size,
        format: file.type || 'unknown'
      }

      URL.revokeObjectURL(img.src)
      resolve(metadata)
    }

    img.onerror = () => {
      reject(new Error('Failed to load image for metadata extraction'))
    }

    img.src = URL.createObjectURL(file)
  })
}

/**
 * Validate image before compression
 */
export function validateImageFile(file: File): string | null {
  // File size check (max 50MB for very large images)
  if (file.size > 50 * 1024 * 1024) {
    return 'Image file too large (max 50MB)'
  }

  // File type check
  const allowedTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/webp',
    'image/heic',
    'image/heif'
  ]

  if (!allowedTypes.includes(file.type)) {
    return 'Unsupported image format. Please use JPEG, PNG, WebP, or HEIC.'
  }

  return null
}

/**
 * Create optimized thumbnail
 */
export async function createThumbnail(
  file: File | Blob,
  size: number = 200
): Promise<Blob> {
  const options: Partial<CompressionOptions> = {
    maxWidth: size,
    maxHeight: size,
    quality: 0.7,
    format: 'jpeg',
    maxFileSize: 100 * 1024 // 100KB for thumbnails
  }

  const result = await compressImage(file, options)
  return result.blob
}

/**
 * Batch compress multiple images
 */
export async function compressBatch(
  files: (File | Blob)[],
  options: Partial<CompressionOptions> = {},
  onProgress?: (current: number, total: number) => void
): Promise<CompressionResult[]> {
  const results: CompressionResult[] = []

  for (let i = 0; i < files.length; i++) {
    try {
      const result = await compressImage(files[i], options)
      results.push(result)
      
      if (onProgress) {
        onProgress(i + 1, files.length)
      }
    } catch (error) {
      console.error(`Failed to compress image ${i + 1}:`, error)
      throw error
    }
  }

  return results
}

/**
 * Calculate compression savings
 */
export function calculateSavings(results: CompressionResult[]): {
  totalOriginalSize: number
  totalCompressedSize: number
  totalSavings: number
  averageCompressionRatio: number
} {
  const totalOriginalSize = results.reduce((sum, r) => sum + r.originalSize, 0)
  const totalCompressedSize = results.reduce((sum, r) => sum + r.compressedSize, 0)
  const totalSavings = totalOriginalSize - totalCompressedSize
  const averageCompressionRatio = results.reduce((sum, r) => sum + r.compressionRatio, 0) / results.length

  return {
    totalOriginalSize,
    totalCompressedSize,
    totalSavings,
    averageCompressionRatio
  }
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
}

/**
 * Check if image dimensions are suitable for OCR
 */
export function isOptimalForOCR(metadata: ImageMetadata): {
  isOptimal: boolean
  recommendations: string[]
} {
  const recommendations: string[] = []
  let isOptimal = true

  // Check minimum resolution
  if (metadata.width < 800 || metadata.height < 600) {
    isOptimal = false
    recommendations.push('Image resolution is too low for optimal OCR. Consider using higher resolution.')
  }

  // Check aspect ratio for receipts
  const aspectRatio = metadata.aspectRatio
  if (aspectRatio < 0.5 || aspectRatio > 2) {
    recommendations.push('Unusual aspect ratio detected. Ensure the entire receipt is captured.')
  }

  // Check file size
  if (metadata.fileSize > 10 * 1024 * 1024) {
    recommendations.push('Large file size detected. Compression recommended for faster processing.')
  }

  if (recommendations.length === 0) {
    recommendations.push('Image appears optimal for OCR processing.')
  }

  return { isOptimal, recommendations }
}