import { defineEventHandler, readMultipartFormData } from 'h3'

/**
 * POST /api/receipts/upload
 * 
 * Upload a new receipt file with metadata.
 * Handles file validation and returns receipt information.
 */

export default defineEventHandler(async (event) => {
  try {
    // Parse multipart form data
    const formData = await readMultipartFormData(event)
    
    if (!formData || formData.length === 0) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file uploaded'
      })
    }

    // Find the file in form data
    const fileItem = formData.find(item => item.name === 'file')
    if (!fileItem || !fileItem.data) {
      throw createError({
        statusCode: 400,
        statusMessage: 'No file found in upload'
      })
    }

    // Extract metadata from form data
    const originalFilename = formData.find(item => item.name === 'originalFilename')?.data?.toString() 
      || fileItem.filename || 'receipt.jpg'
    
    const expenseId = formData.find(item => item.name === 'expenseId')?.data?.toString()
    
    const metadataString = formData.find(item => item.name === 'metadata')?.data?.toString()
    let metadata: any = {}
    if (metadataString) {
      try {
        metadata = JSON.parse(metadataString)
      } catch (e) {
        console.warn('Invalid metadata JSON:', e)
      }
    }

    // Validate file type
    const allowedTypes = [
      'image/jpeg',
      'image/jpg',
      'image/png', 
      'image/webp',
      'image/heic',
      'image/heif'
    ]

    const mimeType = fileItem.type || 'image/jpeg'
    if (!allowedTypes.includes(mimeType)) {
      throw createError({
        statusCode: 415,
        statusMessage: 'Unsupported file type. Please use JPEG, PNG, WebP, or HEIC.'
      })
    }

    // Validate file size (max 10MB)
    const maxFileSize = 10 * 1024 * 1024 // 10MB
    if (fileItem.data.length > maxFileSize) {
      throw createError({
        statusCode: 413,
        statusMessage: 'File too large. Maximum size is 10MB.'
      })
    }

    // Generate receipt ID and storage filename
    const receiptId = '550e8400-e29b-41d4-a716-' + Date.now().toString().padStart(12, '0')
    const now = new Date()
    const year = now.getFullYear()
    const month = (now.getMonth() + 1).toString().padStart(2, '0')
    const day = now.getDate().toString().padStart(2, '0')
    const storedFilename = `${year}/${month}/${day}/${receiptId}.jpg`

    // Mock image dimensions (in real implementation, would extract from image)
    const imageWidth = 1920
    const imageHeight = 1440

    // Create receipt record
    const receipt = {
      id: receiptId,
      expenseId: expenseId || undefined,
      originalFilename,
      storedFilename,
      fileSize: fileItem.data.length,
      mimeType,
      imageWidth,
      imageHeight,
      ocrStatus: 'PENDING',
      ocrText: null,
      ocrConfidence: null,
      extractedAmount: null,
      extractedDate: null,
      extractedVendor: null,
      thumbnailUrl: `/api/receipts/${receiptId}/thumbnail`,
      fullSizeUrl: `/api/receipts/${receiptId}/image`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: '550e8400-e29b-41d4-a716-446655440100', // Mock user ID
      updatedBy: '550e8400-e29b-41d4-a716-446655440100'
    }

    console.log('Receipt uploaded successfully:', {
      id: receiptId,
      filename: originalFilename,
      size: fileItem.data.length,
      type: mimeType,
      expenseId
    })

    // In real implementation, would:
    // 1. Save file to object storage (MinIO/GCS)
    // 2. Generate thumbnail
    // 3. Save receipt record to database
    // 4. Queue for OCR processing

    return {
      receipt,
      warnings: [],
      errors: []
    }

  } catch (error: any) {
    console.error('Receipt upload failed:', error)
    
    if (error.statusCode) {
      throw error
    }
    
    throw createError({
      statusCode: 500,
      statusMessage: 'Failed to upload receipt'
    })
  }
})