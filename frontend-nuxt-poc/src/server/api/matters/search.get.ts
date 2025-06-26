/**
 * Matter Search API Endpoint
 * 
 * @description Full-text search across matters with relevance scoring
 * @author Claude
 * @created 2025-06-26
 * @task T11_S08 - Advanced Queries Search
 */

export default defineEventHandler(async (event) => {
  // Simulate realistic search response time
  await new Promise(resolve => setTimeout(resolve, 80))
  
  const query = getQuery(event)
  const searchTerm = query.q as string
  const page = parseInt(query.page as string) || 1
  const limit = parseInt(query.limit as string) || 10
  const status = query.status as string
  const priority = query.priority as string
  
  if (!searchTerm || searchTerm.length < 2) {
    throw createError({
      statusCode: 400,
      statusMessage: 'Search term must be at least 2 characters'
    })
  }
  
  // Mock searchable matter data
  const searchableMatters = [
    {
      id: 'matter-001',
      caseNumber: 'AST-2025-001',
      title: '契約違反訴訟案件',
      status: 'intake',
      priority: 'HIGH',
      clientName: '株式会社テクノロジー',
      opponentName: 'サプライヤー株式会社',
      assignedLawyer: { id: 'lawyer-1', name: '田中太郎', initials: 'TT' },
      tags: ['contract', 'commercial', 'urgent'],
      searchableText: '契約違反訴訟案件 株式会社テクノロジー サプライヤー株式会社 田中太郎 contract commercial urgent 契約 訴訟 品質条項'
    },
    {
      id: 'matter-002',
      caseNumber: 'AST-2025-002', 
      title: '労働問題相談',
      status: 'intake',
      priority: 'MEDIUM',
      clientName: '個人依頼者A',
      assignedLawyer: { id: 'lawyer-2', name: '山田次郎', initials: 'YJ' },
      tags: ['labor', 'employment'],
      searchableText: '労働問題相談 個人依頼者A 山田次郎 labor employment 労働 雇用 相談'
    },
    {
      id: 'matter-003',
      caseNumber: 'AST-2025-003',
      title: '知的財産権侵害事件',
      status: 'investigation',
      priority: 'URGENT',
      clientName: 'イノベーション株式会社',
      opponentName: '競合他社',
      assignedLawyer: { id: 'lawyer-1', name: '田中太郎', initials: 'TT' },
      tags: ['ip', 'patent', 'litigation'],
      searchableText: '知的財産権侵害事件 イノベーション株式会社 競合他社 田中太郎 ip patent litigation 特許 侵害 知的財産'
    },
    {
      id: 'matter-007',
      caseNumber: 'AST-2025-007',
      title: '製造物責任訴訟',
      status: 'litigation',
      priority: 'URGENT',
      clientName: '自動車メーカー',
      opponentName: '被害者グループ',
      assignedLawyer: { id: 'lawyer-1', name: '田中太郎', initials: 'TT' },
      tags: ['product-liability', 'class-action', 'automotive'],
      searchableText: '製造物責任訴訟 自動車メーカー 被害者グループ 田中太郎 product-liability class-action automotive 製造物 責任 自動車'
    }
  ]
  
  // Simple text search with relevance scoring
  const searchResults = searchableMatters
    .map(matter => {
      const searchLower = searchTerm.toLowerCase()
      const textLower = matter.searchableText.toLowerCase()
      
      // Calculate relevance score
      let score = 0
      
      // Exact title match gets highest score
      if (matter.title.toLowerCase().includes(searchLower)) {
        score += 100
      }
      
      // Client name match
      if (matter.clientName.toLowerCase().includes(searchLower)) {
        score += 80
      }
      
      // Case number match
      if (matter.caseNumber.toLowerCase().includes(searchLower)) {
        score += 90
      }
      
      // Tag match
      if (matter.tags.some(tag => tag.toLowerCase().includes(searchLower))) {
        score += 60
      }
      
      // General text match
      if (textLower.includes(searchLower)) {
        score += 30
      }
      
      // Lawyer name match
      if (matter.assignedLawyer.name.toLowerCase().includes(searchLower)) {
        score += 50
      }
      
      return { ...matter, score }
    })
    .filter(matter => matter.score > 0) // Only include matches
    .filter(matter => !status || matter.status === status) // Filter by status if provided
    .filter(matter => !priority || matter.priority === priority) // Filter by priority if provided
    .sort((a, b) => b.score - a.score) // Sort by relevance
  
  // Pagination
  const offset = (page - 1) * limit
  const paginatedResults = searchResults.slice(offset, offset + limit)
  
  // Add caching headers
  setHeader(event, 'Cache-Control', 'public, max-age=30, stale-while-revalidate=60')
  
  return {
    items: paginatedResults.map(({ score, searchableText, ...matter }) => matter), // Remove internal fields
    pagination: {
      page,
      limit,
      total: searchResults.length,
      hasNext: offset + limit < searchResults.length,
      hasPrev: page > 1,
      totalPages: Math.ceil(searchResults.length / limit)
    },
    query: {
      searchTerm,
      status,
      priority
    },
    meta: {
      searchTime: 80, // milliseconds
      maxScore: searchResults[0]?.score || 0
    }
  }
})