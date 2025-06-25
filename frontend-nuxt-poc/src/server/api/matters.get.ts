// Mock API endpoint for Kanban matters data
// In production, this would connect to the Spring Boot backend

export default defineEventHandler(async (event: any) => {
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
  
  // Add query parameter filtering for optimization
  const query = getQuery(event)
  let filteredMatters = mockMatters
  
  if (query.status) {
    filteredMatters = mockMatters.filter(matter => matter.status === query.status)
  }
  
  if (query.priority) {
    filteredMatters = filteredMatters.filter(matter => matter.priority === query.priority)
  }
  
  if (query.limit) {
    const limit = parseInt(query.limit as string)
    filteredMatters = filteredMatters.slice(0, limit)
  }
  
  // Add proper caching headers for SSR optimization
  setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=300')
  setHeader(event, 'ETag', `"matters-${Date.now()}"`)
  
  return filteredMatters
})