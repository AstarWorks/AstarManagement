import { defineEventHandler, getQuery } from 'h3'

/**
 * Get paginated list of per-diem entries
 * 
 * @route GET /api/per-diem
 * @description Fetches per-diem entries with optional filtering and pagination
 */
export default defineEventHandler(async (event) => {
  const query = getQuery(event)
  
  // Extract query parameters
  const {
    page = 1,
    limit = 20,
    category,
    matterId,
    dateFrom,
    dateTo,
    location,
    isBillable,
    isApproved,
    sortBy = 'dateRange.startDate',
    sortOrder = 'desc'
  } = query

  // Mock per-diem entries data
  const mockPerDiemEntries = [
    {
      id: 'per-diem-1',
      dateRange: {
        startDate: '2025-07-01',
        endDate: '2025-07-01'
      },
      location: 'Tokyo District Court',
      purpose: 'Court hearing attendance for Case-2024-001',
      category: 'COURT_VISIT',
      dailyAmount: 8000,
      currency: 'JPY',
      matterId: 'matter-1',
      transportationMode: 'TRAIN',
      accommodationType: 'NONE',
      accommodationRequired: false,
      totalAmount: 8000,
      totalDays: 1,
      isBillable: true,
      isReimbursable: false,
      requiresApproval: true,
      isApproved: true,
      approvedBy: 'lawyer-1',
      approvedAt: '2025-07-01T10:00:00Z',
      createdAt: '2025-07-01T09:00:00Z',
      updatedAt: '2025-07-01T10:00:00Z',
      createdBy: 'lawyer-1'
    },
    {
      id: 'per-diem-2',
      dateRange: {
        startDate: '2025-06-28',
        endDate: '2025-06-30'
      },
      location: 'Osaka Business District',
      purpose: 'Client consultation meetings and contract negotiations',
      category: 'CLIENT_MEETING',
      dailyAmount: 12000,
      currency: 'JPY',
      matterId: 'matter-2',
      transportationMode: 'TRAIN',
      accommodationType: 'HOTEL',
      accommodationRequired: true,
      totalAmount: 36000,
      totalDays: 3,
      isBillable: true,
      isReimbursable: false,
      requiresApproval: true,
      isApproved: false,
      createdAt: '2025-06-27T14:00:00Z',
      updatedAt: '2025-06-27T14:00:00Z',
      createdBy: 'lawyer-2',
      notes: 'Multi-day client meetings for contract review and negotiation'
    },
    {
      id: 'per-diem-3',
      dateRange: {
        startDate: '2025-06-25',
        endDate: '2025-06-27'
      },
      location: 'Tokyo International Forum',
      purpose: 'Legal conference attendance - Corporate Law Updates',
      category: 'CONFERENCE',
      dailyAmount: 15000,
      currency: 'JPY',
      transportationMode: 'TRAIN',
      accommodationType: 'BUSINESS_HOTEL',
      accommodationRequired: true,
      totalAmount: 45000,
      totalDays: 3,
      isBillable: false,
      isReimbursable: true,
      requiresApproval: true,
      isApproved: true,
      approvedBy: 'admin-1',
      approvedAt: '2025-06-24T16:00:00Z',
      createdAt: '2025-06-24T15:00:00Z',
      updatedAt: '2025-06-24T16:00:00Z',
      createdBy: 'lawyer-1',
      notes: 'Annual legal conference for continuing education'
    },
    {
      id: 'per-diem-4',
      dateRange: {
        startDate: '2025-06-20',
        endDate: '2025-06-20'
      },
      location: 'Property Site - Shibuya',
      purpose: 'On-site property inspection for real estate dispute',
      category: 'SITE_INSPECTION',
      dailyAmount: 10000,
      currency: 'JPY',
      matterId: 'matter-3',
      transportationMode: 'CAR',
      accommodationType: 'NONE',
      accommodationRequired: false,
      totalAmount: 10000,
      totalDays: 1,
      isBillable: true,
      isReimbursable: false,
      requiresApproval: true,
      isApproved: true,
      approvedBy: 'lawyer-1',
      approvedAt: '2025-06-21T09:00:00Z',
      createdAt: '2025-06-20T17:00:00Z',
      updatedAt: '2025-06-21T09:00:00Z',
      createdBy: 'clerk-1'
    },
    {
      id: 'per-diem-5',
      dateRange: {
        startDate: '2025-06-15',
        endDate: '2025-06-15'
      },
      location: 'Tokyo Legal Affairs Bureau',
      purpose: 'Document filing and registration procedures',
      category: 'DOCUMENT_FILING',
      dailyAmount: 6000,
      currency: 'JPY',
      matterId: 'matter-4',
      transportationMode: 'TRAIN',
      accommodationType: 'NONE',
      accommodationRequired: false,
      totalAmount: 6000,
      totalDays: 1,
      isBillable: true,
      isReimbursable: false,
      requiresApproval: true,
      isApproved: true,
      approvedBy: 'lawyer-2',
      approvedAt: '2025-06-16T10:00:00Z',
      createdAt: '2025-06-15T16:00:00Z',
      updatedAt: '2025-06-16T10:00:00Z',
      createdBy: 'clerk-2'
    }
  ]

  // Apply filters
  let filteredEntries = [...mockPerDiemEntries]

  if (category) {
    filteredEntries = filteredEntries.filter(entry => entry.category === category)
  }

  if (matterId) {
    filteredEntries = filteredEntries.filter(entry => entry.matterId === matterId)
  }

  if (location) {
    filteredEntries = filteredEntries.filter(entry => 
      entry.location.toLowerCase().includes(location.toString().toLowerCase())
    )
  }

  if (dateFrom) {
    filteredEntries = filteredEntries.filter(entry => 
      entry.dateRange.startDate >= dateFrom.toString()
    )
  }

  if (dateTo) {
    filteredEntries = filteredEntries.filter(entry => 
      entry.dateRange.endDate <= dateTo.toString()
    )
  }

  if (isBillable !== undefined) {
    filteredEntries = filteredEntries.filter(entry => 
      entry.isBillable === (isBillable === 'true')
    )
  }

  if (isApproved !== undefined) {
    filteredEntries = filteredEntries.filter(entry => 
      entry.isApproved === (isApproved === 'true')
    )
  }

  // Apply sorting
  filteredEntries.sort((a, b) => {
    let aValue: any, bValue: any

    switch (sortBy) {
      case 'dateRange.startDate':
        aValue = new Date(a.dateRange.startDate)
        bValue = new Date(b.dateRange.startDate)
        break
      case 'location':
        aValue = a.location.toLowerCase()
        bValue = b.location.toLowerCase()
        break
      case 'dailyAmount':
        aValue = a.dailyAmount
        bValue = b.dailyAmount
        break
      case 'category':
        aValue = a.category
        bValue = b.category
        break
      case 'createdAt':
        aValue = new Date(a.createdAt)
        bValue = new Date(b.createdAt)
        break
      default:
        aValue = new Date(a.dateRange.startDate)
        bValue = new Date(b.dateRange.startDate)
    }

    if (sortOrder === 'desc') {
      return aValue > bValue ? -1 : aValue < bValue ? 1 : 0
    } else {
      return aValue < bValue ? -1 : aValue > bValue ? 1 : 0
    }
  })

  // Apply pagination
  const pageNum = parseInt((page ?? 1).toString(), 10)
  const limitNum = parseInt((limit ?? 20).toString(), 10)
  const offset = (pageNum - 1) * limitNum
  const paginatedEntries = filteredEntries.slice(offset, offset + limitNum)
  
  const total = filteredEntries.length
  const hasNext = offset + limitNum < total
  const hasPrev = pageNum > 1

  return {
    data: paginatedEntries,
    total,
    page: pageNum,
    limit: limitNum,
    hasNext,
    hasPrev
  }
})