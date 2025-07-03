import { defineEventHandler, getQuery } from 'h3'

/**
 * GET /api/receipts
 * 
 * Fetch receipts with optional filtering and pagination.
 * Returns mock data for development purposes.
 */

export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // Extract query parameters
  const {
    expenseId,
    search,
    ocrStatus,
    dateFrom,
    dateTo,
    hasOcrData,
    mimeType,
    sortBy = 'createdAt',
    sortOrder = 'desc',
    page = 1,
    limit = 20
  } = query

  // Mock receipt data
  const mockReceipts = [
    {
      id: '550e8400-e29b-41d4-a716-446655440001',
      expenseId: '550e8400-e29b-41d4-a716-446655440010',
      originalFilename: 'lunch-receipt-2024-01-15.jpg',
      storedFilename: '2024/01/15/550e8400-e29b-41d4-a716-446655440001.jpg',
      fileSize: 1024567,
      mimeType: 'image/jpeg',
      imageWidth: 1920,
      imageHeight: 1440,
      ocrStatus: 'COMPLETED',
      ocrText: 'レストラン山田\n東京都渋谷区\nランチセット\n¥1,200\n2024/01/15 12:30',
      ocrConfidence: 0.95,
      extractedAmount: 1200,
      extractedDate: '2024-01-15',
      extractedVendor: 'レストラン山田',
      thumbnailUrl: '/api/receipts/550e8400-e29b-41d4-a716-446655440001/thumbnail',
      fullSizeUrl: '/api/receipts/550e8400-e29b-41d4-a716-446655440001/image',
      createdAt: '2024-01-15T12:35:00Z',
      updatedAt: '2024-01-15T12:40:00Z',
      createdBy: '550e8400-e29b-41d4-a716-446655440100',
      updatedBy: '550e8400-e29b-41d4-a716-446655440100'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440002',
      expenseId: '550e8400-e29b-41d4-a716-446655440011',
      originalFilename: 'taxi-receipt-2024-01-14.jpg',
      storedFilename: '2024/01/14/550e8400-e29b-41d4-a716-446655440002.jpg',
      fileSize: 856432,
      mimeType: 'image/jpeg',
      imageWidth: 1600,
      imageHeight: 1200,
      ocrStatus: 'PROCESSING',
      ocrText: null,
      ocrConfidence: null,
      extractedAmount: null,
      extractedDate: null,
      extractedVendor: null,
      thumbnailUrl: '/api/receipts/550e8400-e29b-41d4-a716-446655440002/thumbnail',
      fullSizeUrl: '/api/receipts/550e8400-e29b-41d4-a716-446655440002/image',
      createdAt: '2024-01-14T18:20:00Z',
      updatedAt: '2024-01-14T18:25:00Z',
      createdBy: '550e8400-e29b-41d4-a716-446655440100',
      updatedBy: '550e8400-e29b-41d4-a716-446655440100'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440003',
      expenseId: '550e8400-e29b-41d4-a716-446655440012',
      originalFilename: 'hotel-receipt-2024-01-13.jpg',
      storedFilename: '2024/01/13/550e8400-e29b-41d4-a716-446655440003.jpg',
      fileSize: 1456789,
      mimeType: 'image/jpeg',
      imageWidth: 2048,
      imageHeight: 1536,
      ocrStatus: 'COMPLETED',
      ocrText: 'ホテル東京\n宿泊料金\n¥8,500\n2024/01/13',
      ocrConfidence: 0.88,
      extractedAmount: 8500,
      extractedDate: '2024-01-13',
      extractedVendor: 'ホテル東京',
      thumbnailUrl: '/api/receipts/550e8400-e29b-41d4-a716-446655440003/thumbnail',
      fullSizeUrl: '/api/receipts/550e8400-e29b-41d4-a716-446655440003/image',
      createdAt: '2024-01-13T08:15:00Z',
      updatedAt: '2024-01-13T08:20:00Z',
      createdBy: '550e8400-e29b-41d4-a716-446655440100',
      updatedBy: '550e8400-e29b-41d4-a716-446655440100'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440004',
      originalFilename: 'stationery-receipt-2024-01-12.jpg',
      storedFilename: '2024/01/12/550e8400-e29b-41d4-a716-446655440004.jpg',
      fileSize: 924681,
      mimeType: 'image/jpeg',
      imageWidth: 1440,
      imageHeight: 1080,
      ocrStatus: 'FAILED',
      ocrText: null,
      ocrConfidence: null,
      extractedAmount: null,
      extractedDate: null,
      extractedVendor: null,
      thumbnailUrl: '/api/receipts/550e8400-e29b-41d4-a716-446655440004/thumbnail',
      fullSizeUrl: '/api/receipts/550e8400-e29b-41d4-a716-446655440004/image',
      createdAt: '2024-01-12T14:30:00Z',
      updatedAt: '2024-01-12T14:35:00Z',
      createdBy: '550e8400-e29b-41d4-a716-446655440100',
      updatedBy: '550e8400-e29b-41d4-a716-446655440100'
    },
    {
      id: '550e8400-e29b-41d4-a716-446655440005',
      expenseId: '550e8400-e29b-41d4-a716-446655440013',
      originalFilename: 'coffee-receipt-2024-01-11.jpg',
      storedFilename: '2024/01/11/550e8400-e29b-41d4-a716-446655440005.jpg',
      fileSize: 567234,
      mimeType: 'image/jpeg',
      imageWidth: 1200,
      imageHeight: 900,
      ocrStatus: 'PENDING',
      ocrText: null,
      ocrConfidence: null,
      extractedAmount: null,
      extractedDate: null,
      extractedVendor: null,
      thumbnailUrl: '/api/receipts/550e8400-e29b-41d4-a716-446655440005/thumbnail',
      fullSizeUrl: '/api/receipts/550e8400-e29b-41d4-a716-446655440005/image',
      createdAt: '2024-01-11T09:45:00Z',
      updatedAt: '2024-01-11T09:45:00Z',
      createdBy: '550e8400-e29b-41d4-a716-446655440100',
      updatedBy: '550e8400-e29b-41d4-a716-446655440100'
    }
  ]

  // Apply filters
  let filteredReceipts = mockReceipts

  if (expenseId) {
    filteredReceipts = filteredReceipts.filter(r => r.expenseId === expenseId)
  }

  if (search) {
    const searchLower = search.toString().toLowerCase()
    filteredReceipts = filteredReceipts.filter(r =>
      r.originalFilename.toLowerCase().includes(searchLower) ||
      r.extractedVendor?.toLowerCase().includes(searchLower) ||
      r.ocrText?.toLowerCase().includes(searchLower)
    )
  }

  if (ocrStatus) {
    filteredReceipts = filteredReceipts.filter(r => r.ocrStatus === ocrStatus)
  }

  if (dateFrom) {
    const fromDate = new Date(dateFrom.toString())
    filteredReceipts = filteredReceipts.filter(r => new Date(r.createdAt) >= fromDate)
  }

  if (dateTo) {
    const toDate = new Date(dateTo.toString())
    filteredReceipts = filteredReceipts.filter(r => new Date(r.createdAt) <= toDate)
  }

  if (hasOcrData !== undefined) {
    if (hasOcrData === 'true' || hasOcrData === true) {
      filteredReceipts = filteredReceipts.filter(r => 
        r.extractedAmount || r.extractedVendor || r.extractedDate
      )
    } else {
      filteredReceipts = filteredReceipts.filter(r => 
        !r.extractedAmount && !r.extractedVendor && !r.extractedDate
      )
    }
  }

  if (mimeType) {
    filteredReceipts = filteredReceipts.filter(r => r.mimeType === mimeType)
  }

  // Apply sorting
  filteredReceipts.sort((a, b) => {
    let aValue: any
    let bValue: any

    switch (sortBy) {
      case 'filename':
        aValue = a.originalFilename.toLowerCase()
        bValue = b.originalFilename.toLowerCase()
        break
      case 'extractedAmount':
        aValue = a.extractedAmount || 0
        bValue = b.extractedAmount || 0
        break
      case 'ocrStatus':
        aValue = a.ocrStatus
        bValue = b.ocrStatus
        break
      default:
        aValue = new Date(a.createdAt).getTime()
        bValue = new Date(b.createdAt).getTime()
    }

    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    }
  })

  // Apply pagination
  const pageNum = parseInt(page?.toString() || '1') || 1
  const limitNum = parseInt(limit?.toString() || '20') || 20
  const offset = (pageNum - 1) * limitNum
  const paginatedReceipts = filteredReceipts.slice(offset, offset + limitNum)

  // Calculate statistics
  const stats = {
    total: mockReceipts.length,
    pending: mockReceipts.filter(r => r.ocrStatus === 'PENDING').length,
    processing: mockReceipts.filter(r => r.ocrStatus === 'PROCESSING').length,
    completed: mockReceipts.filter(r => r.ocrStatus === 'COMPLETED').length,
    failed: mockReceipts.filter(r => r.ocrStatus === 'FAILED').length,
    totalFileSize: mockReceipts.reduce((sum, r) => sum + r.fileSize, 0),
    avgProcessingTime: 2500 // milliseconds
  }

  return {
    receipts: paginatedReceipts,
    total: filteredReceipts.length,
    page: pageNum,
    limit: limitNum,
    hasNext: offset + limitNum < filteredReceipts.length,
    hasPrev: pageNum > 1,
    stats
  }
})