// Mock API endpoint for Kanban matters data
// In production, this would connect to the Spring Boot backend

export default defineEventHandler(async (event) => {
  // Simulate realistic API response time for SSR optimization testing
  await new Promise(resolve => setTimeout(resolve, 50))
  
  // Mock matter data representing the 7 Kanban statuses
  const mockMatters = [
    // Intake matters
    {
      id: 'matter-001',
      caseNumber: 'AST-2025-001',
      title: '契約違反訴訟案件',
      status: 'intake',
      priority: 'HIGH',
      clientName: '株式会社テクノロジー',
      opponentName: 'サプライヤー株式会社',
      assignedLawyer: {
        id: 'lawyer-1',
        name: '田中太郎',
        initials: 'TT',
        avatar: null
      },
      assignedClerk: {
        id: 'clerk-1', 
        name: '佐藤花子',
        initials: 'SH',
        avatar: null
      },
      dueDate: '2025-07-15',
      createdAt: '2025-06-20T09:00:00Z',
      updatedAt: '2025-06-23T10:30:00Z',
      statusDuration: 3,
      relatedDocuments: 12,
      tags: ['contract', 'commercial', 'urgent']
    },
    {
      id: 'matter-002',
      caseNumber: 'AST-2025-002', 
      title: '労働問題相談',
      status: 'intake',
      priority: 'MEDIUM',
      clientName: '個人依頼者A',
      assignedLawyer: {
        id: 'lawyer-2',
        name: '山田次郎',
        initials: 'YJ',
        avatar: null
      },
      dueDate: '2025-07-01',
      createdAt: '2025-06-22T14:15:00Z',
      updatedAt: '2025-06-23T09:45:00Z',
      statusDuration: 1,
      relatedDocuments: 5,
      tags: ['labor', 'employment']
    },
    
    // Investigation matters
    {
      id: 'matter-003',
      caseNumber: 'AST-2025-003',
      title: '知的財産権侵害事件',
      status: 'investigation',
      priority: 'URGENT',
      clientName: 'イノベーション株式会社',
      opponentName: '競合他社',
      assignedLawyer: {
        id: 'lawyer-1',
        name: '田中太郎',
        initials: 'TT',
        avatar: null
      },
      assignedClerk: {
        id: 'clerk-2',
        name: '鈴木一郎',
        initials: 'SI',
        avatar: null
      },
      dueDate: '2025-06-30',
      createdAt: '2025-06-15T11:20:00Z',
      updatedAt: '2025-06-23T11:00:00Z',
      statusDuration: 8,
      relatedDocuments: 28,
      tags: ['ip', 'patent', 'litigation']
    },
    {
      id: 'matter-004',
      caseNumber: 'AST-2025-004',
      title: '不動産取引紛争',
      status: 'investigation',
      priority: 'HIGH',
      clientName: '不動産デベロッパー',
      assignedLawyer: {
        id: 'lawyer-3',
        name: '高橋美咲',
        initials: 'TM',
        avatar: null
      },
      dueDate: '2025-07-20',
      createdAt: '2025-06-10T08:30:00Z',
      updatedAt: '2025-06-23T08:15:00Z',
      statusDuration: 13,
      relatedDocuments: 15,
      tags: ['real-estate', 'contract']
    },
    
    // Negotiation matters  
    {
      id: 'matter-005',
      caseNumber: 'AST-2025-005',
      title: '企業買収案件',
      status: 'negotiation',
      priority: 'HIGH',
      clientName: '買収企業グループ',
      opponentName: '被買収会社',
      assignedLawyer: {
        id: 'lawyer-4',
        name: '伊藤慎一',
        initials: 'IS',
        avatar: null
      },
      assignedClerk: {
        id: 'clerk-1',
        name: '佐藤花子', 
        initials: 'SH',
        avatar: null
      },
      dueDate: '2025-08-15',
      createdAt: '2025-05-20T10:00:00Z',
      updatedAt: '2025-06-23T16:30:00Z',
      statusDuration: 34,
      relatedDocuments: 45,
      tags: ['ma', 'corporate', 'due-diligence']
    },
    {
      id: 'matter-006',
      caseNumber: 'AST-2025-006',
      title: '債権回収交渉',
      status: 'negotiation',
      priority: 'MEDIUM',
      clientName: '製造業者B',
      opponentName: '債務者企業',
      assignedLawyer: {
        id: 'lawyer-2',
        name: '山田次郎',
        initials: 'YJ',
        avatar: null
      },
      dueDate: '2025-07-10',
      createdAt: '2025-06-05T13:45:00Z',
      updatedAt: '2025-06-23T12:20:00Z',
      statusDuration: 18,
      relatedDocuments: 8,
      tags: ['debt', 'collection']
    },
    
    // Litigation matters
    {
      id: 'matter-007',
      caseNumber: 'AST-2025-007',
      title: '製造物責任訴訟',
      status: 'litigation',
      priority: 'URGENT',
      clientName: '自動車メーカー',
      opponentName: '被害者グループ',
      assignedLawyer: {
        id: 'lawyer-1',
        name: '田中太郎',
        initials: 'TT',
        avatar: null
      },
      assignedClerk: {
        id: 'clerk-3',
        name: '渡辺裕子',
        initials: 'WY',
        avatar: null
      },
      dueDate: '2025-09-01',
      createdAt: '2025-04-15T09:30:00Z',
      updatedAt: '2025-06-23T14:45:00Z',
      statusDuration: 69,
      relatedDocuments: 67,
      tags: ['product-liability', 'class-action', 'automotive']
    },
    
    // Settlement matters
    {
      id: 'matter-008',
      caseNumber: 'AST-2025-008',
      title: '離婚調停案件',
      status: 'settlement',
      priority: 'LOW',
      clientName: '個人依頼者C',
      assignedLawyer: {
        id: 'lawyer-5',
        name: '小林恵美',
        initials: 'KE',
        avatar: null
      },
      dueDate: '2025-07-25',
      createdAt: '2025-05-10T15:20:00Z',
      updatedAt: '2025-06-23T10:10:00Z',
      statusDuration: 44,
      relatedDocuments: 22,
      tags: ['family', 'divorce', 'mediation']
    },
    {
      id: 'matter-009',
      caseNumber: 'AST-2025-009',
      title: '商事仲裁手続き',
      status: 'settlement',
      priority: 'MEDIUM',
      clientName: '国際商社',
      opponentName: '海外パートナー',
      assignedLawyer: {
        id: 'lawyer-4',
        name: '伊藤慎一',
        initials: 'IS',
        avatar: null
      },
      dueDate: '2025-08-30',
      createdAt: '2025-05-01T11:00:00Z',
      updatedAt: '2025-06-23T15:30:00Z',
      statusDuration: 53,
      relatedDocuments: 31,
      tags: ['arbitration', 'international', 'commercial']
    },
    
    // Collection matters
    {
      id: 'matter-010',
      caseNumber: 'AST-2025-010',
      title: '強制執行手続き',
      status: 'collection',
      priority: 'HIGH',
      clientName: '金融機関D',
      opponentName: '債務者個人',
      assignedLawyer: {
        id: 'lawyer-2',
        name: '山田次郎',
        initials: 'YJ',
        avatar: null
      },
      assignedClerk: {
        id: 'clerk-2',
        name: '鈴木一郎',
        initials: 'SI',
        avatar: null
      },
      dueDate: '2025-07-05',
      createdAt: '2025-04-20T12:15:00Z',
      updatedAt: '2025-06-23T13:25:00Z',
      statusDuration: 64,
      relatedDocuments: 19,
      tags: ['enforcement', 'collection', 'secured']
    },
    
    // Closed matters
    {
      id: 'matter-011',
      caseNumber: 'AST-2025-011',
      title: '特許出願支援業務',
      status: 'closed',
      priority: 'LOW',
      clientName: 'スタートアップE',
      assignedLawyer: {
        id: 'lawyer-3',
        name: '高橋美咲',
        initials: 'TM',
        avatar: null
      },
      dueDate: '2025-06-15',
      createdAt: '2025-03-01T10:30:00Z',
      updatedAt: '2025-06-20T17:00:00Z',
      statusDuration: 90,
      relatedDocuments: 35,
      tags: ['patent', 'filing', 'completed']
    },
    {
      id: 'matter-012',
      caseNumber: 'AST-2025-012',
      title: '雇用契約書作成',
      status: 'closed',
      priority: 'LOW',
      clientName: 'HR企業F',
      assignedLawyer: {
        id: 'lawyer-5',
        name: '小林恵美',
        initials: 'KE',
        avatar: null
      },
      assignedClerk: {
        id: 'clerk-1',
        name: '佐藤花子',
        initials: 'SH',
        avatar: null
      },
      dueDate: '2025-06-10',
      createdAt: '2025-05-15T09:45:00Z',
      updatedAt: '2025-06-18T16:30:00Z',
      statusDuration: 25,
      relatedDocuments: 7,
      tags: ['employment', 'contract', 'template']
    }
  ]
  
  // Enhanced query parameter handling for advanced features
  const query = getQuery(event)
  let filteredMatters = mockMatters
  
  // Basic filtering
  if (query.status) {
    filteredMatters = filteredMatters.filter(matter => matter.status === query.status)
  }
  
  if (query.priority) {
    filteredMatters = filteredMatters.filter(matter => matter.priority === query.priority)
  }
  
  if (query.assignee) {
    filteredMatters = filteredMatters.filter(matter => 
      matter.assignedLawyer?.id === query.assignee || 
      matter.assignedClerk?.id === query.assignee
    )
  }
  
  // Date range filtering
  if (query.dateFrom || query.dateTo) {
    const fromDate = query.dateFrom ? new Date(query.dateFrom as string) : null
    const toDate = query.dateTo ? new Date(query.dateTo as string) : null
    
    filteredMatters = filteredMatters.filter(matter => {
      const matterDate = new Date(matter.createdAt)
      if (fromDate && matterDate < fromDate) return false
      if (toDate && matterDate > toDate) return false
      return true
    })
  }
  
  // Tag filtering
  if (query.tags) {
    const requestedTags = Array.isArray(query.tags) ? query.tags : [query.tags]
    filteredMatters = filteredMatters.filter(matter => 
      requestedTags.some((tag: string) => matter.tags.includes(tag))
    )
  }
  
  // Sorting
  const sortBy = query.sortBy as string || 'updatedAt'
  const sortOrder = query.sortOrder as string || 'desc'
  
  filteredMatters.sort((a, b) => {
    let aValue: any, bValue: any
    
    switch (sortBy) {
      case 'title':
        aValue = a.title
        bValue = b.title
        break
      case 'priority':
        const priorityOrder = { 'URGENT': 4, 'HIGH': 3, 'MEDIUM': 2, 'LOW': 1 }
        aValue = priorityOrder[a.priority as keyof typeof priorityOrder]
        bValue = priorityOrder[b.priority as keyof typeof priorityOrder]
        break
      case 'dueDate':
        aValue = new Date(a.dueDate || '9999-12-31')
        bValue = new Date(b.dueDate || '9999-12-31')
        break
      case 'createdAt':
        aValue = new Date(a.createdAt)
        bValue = new Date(b.createdAt)
        break
      case 'updatedAt':
      default:
        aValue = new Date(a.updatedAt)
        bValue = new Date(b.updatedAt)
        break
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1
    } else {
      return aValue < bValue ? 1 : -1
    }
  })
  
  // Pagination with proper PaginatedResponse structure
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 20
  const offset = (page - 1) * limit
  
  const totalItems = filteredMatters.length
  const paginatedMatters = filteredMatters.slice(offset, offset + limit)
  const hasNext = offset + limit < totalItems
  const hasPrev = page > 1
  const totalPages = Math.ceil(totalItems / limit)
  
  // Add proper caching headers for SSR optimization
  setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  setHeader(event, 'ETag', `"matters-${totalItems}-${Date.now()}"`)
  setHeader(event, 'X-Total-Count', totalItems.toString())
  
  // Return paginated response structure consistent with T11_S08 requirements
  return {
    data: paginatedMatters, // Using 'data' field as per T11_S08 specs
    pagination: {
      page,
      limit,
      total: totalItems,
      hasNext,
      hasPrev,
      totalPages
    },
    filters: {
      status: query.status,
      priority: query.priority,
      assignee: query.assignee,
      dateFrom: query.dateFrom,
      dateTo: query.dateTo,
      tags: query.tags,
      sortBy,
      sortOrder
    },
    meta: {
      requestTime: new Date().toISOString(),
      resultCount: paginatedMatters.length
    }
  }
})