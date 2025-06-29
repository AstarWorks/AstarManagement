/**
 * Single Matter Retrieval API Endpoint
 * 
 * @description Retrieves a single matter by ID with detailed information
 * @author Claude
 * @created 2025-06-26
 * @task T11_S08 - Advanced Queries Search
 */

export default defineEventHandler(async (event) => {
  // Simulate realistic API response time
  await new Promise(resolve => setTimeout(resolve, 30))
  
  const matterId = getRouterParam(event, 'id')
  
  if (!matterId) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Matter ID is required'
    })
  }
  
  // Mock matter data (would typically fetch from database)
  const mockMatters = {
    'matter-001': {
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
      tags: ['contract', 'commercial', 'urgent'],
      description: 'サプライヤーとの契約における品質条項違反に関する訴訟案件。契約書の解釈と損害賠償請求について検討中。',
      timeline: [
        {
          date: '2025-06-20T09:00:00Z',
          action: 'Matter created',
          description: 'Initial client consultation completed',
          user: '田中太郎'
        },
        {
          date: '2025-06-21T14:30:00Z',
          action: 'Status updated',
          description: 'Moved to intake phase for initial review',
          user: '佐藤花子'
        },
        {
          date: '2025-06-23T10:30:00Z',
          action: 'Document added',
          description: 'Contract documents received from client',
          user: '田中太郎'
        }
      ],
      estimatedValue: 5000000, // in yen
      riskLevel: 'medium',
      courtJurisdiction: '東京地方裁判所'
    },
    'matter-003': {
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
      tags: ['ip', 'patent', 'litigation'],
      description: '特許技術の侵害に関する事件。調査段階で侵害の事実認定と損害計算を進行中。',
      timeline: [
        {
          date: '2025-06-15T11:20:00Z',
          action: 'Matter created',
          description: 'Patent infringement case initiated',
          user: '田中太郎'
        },
        {
          date: '2025-06-16T09:00:00Z',
          action: 'Status updated',
          description: 'Moved to investigation phase',
          user: '鈴木一郎'
        },
        {
          date: '2025-06-23T11:00:00Z',
          action: 'Priority updated',
          description: 'Escalated to urgent due to court deadline',
          user: '田中太郎'
        }
      ],
      estimatedValue: 50000000,
      riskLevel: 'high',
      courtJurisdiction: '知的財産高等裁判所'
    }
  }
  
  const matter = mockMatters[matterId as keyof typeof mockMatters]
  
  if (!matter) {
    throw createError({
      statusCode: 404,
      statusMessage: 'Matter not found'
    })
  }
  
  // Add proper caching headers
  setHeader(event, 'Cache-Control', 'public, max-age=300, stale-while-revalidate=600')
  setHeader(event, 'ETag', `"matter-${matterId}-${matter.updatedAt}"`)
  
  return matter
})