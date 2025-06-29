/**
 * Search Suggestions API Endpoint
 * 
 * @description Provides autocomplete suggestions for matter search
 * @author Claude
 * @created 2025-06-26
 * @task T11_S08 - Advanced Queries Search
 */

export default defineEventHandler(async (event) => {
  // Simulate quick suggestion response
  await new Promise(resolve => setTimeout(resolve, 20))
  
  const query = getQuery(event)
  const searchTerm = query.q as string
  const limit = parseInt(query.limit as string) || 5
  
  if (!searchTerm || searchTerm.length < 1) {
    return {
      suggestions: [],
      query: searchTerm
    }
  }
  
  // Mock suggestion data
  const suggestionData = [
    // Matter titles
    { text: '契約違反訴訟案件', type: 'title', category: 'matters' },
    { text: '労働問題相談', type: 'title', category: 'matters' },
    { text: '知的財産権侵害事件', type: 'title', category: 'matters' },
    { text: '製造物責任訴訟', type: 'title', category: 'matters' },
    { text: '企業買収案件', type: 'title', category: 'matters' },
    { text: '債権回収交渉', type: 'title', category: 'matters' },
    { text: '離婚調停案件', type: 'title', category: 'matters' },
    { text: '商事仲裁手続き', type: 'title', category: 'matters' },
    { text: '強制執行手続き', type: 'title', category: 'matters' },
    { text: '特許出願支援業務', type: 'title', category: 'matters' },
    
    // Client names
    { text: '株式会社テクノロジー', type: 'client', category: 'clients' },
    { text: 'イノベーション株式会社', type: 'client', category: 'clients' },
    { text: '自動車メーカー', type: 'client', category: 'clients' },
    { text: '買収企業グループ', type: 'client', category: 'clients' },
    { text: '製造業者B', type: 'client', category: 'clients' },
    { text: '国際商社', type: 'client', category: 'clients' },
    { text: '金融機関D', type: 'client', category: 'clients' },
    { text: 'スタートアップE', type: 'client', category: 'clients' },
    
    // Lawyer names
    { text: '田中太郎', type: 'lawyer', category: 'lawyers' },
    { text: '山田次郎', type: 'lawyer', category: 'lawyers' },
    { text: '高橋美咲', type: 'lawyer', category: 'lawyers' },
    { text: '伊藤慎一', type: 'lawyer', category: 'lawyers' },
    { text: '小林恵美', type: 'lawyer', category: 'lawyers' },
    
    // Tags
    { text: 'contract', type: 'tag', category: 'tags' },
    { text: 'commercial', type: 'tag', category: 'tags' },
    { text: 'labor', type: 'tag', category: 'tags' },
    { text: 'employment', type: 'tag', category: 'tags' },
    { text: 'ip', type: 'tag', category: 'tags' },
    { text: 'patent', type: 'tag', category: 'tags' },
    { text: 'litigation', type: 'tag', category: 'tags' },
    { text: 'product-liability', type: 'tag', category: 'tags' },
    { text: 'class-action', type: 'tag', category: 'tags' },
    { text: 'automotive', type: 'tag', category: 'tags' },
    { text: 'ma', type: 'tag', category: 'tags' },
    { text: 'corporate', type: 'tag', category: 'tags' },
    { text: 'due-diligence', type: 'tag', category: 'tags' },
    { text: 'debt', type: 'tag', category: 'tags' },
    { text: 'collection', type: 'tag', category: 'tags' },
    { text: 'family', type: 'tag', category: 'tags' },
    { text: 'divorce', type: 'tag', category: 'tags' },
    { text: 'mediation', type: 'tag', category: 'tags' },
    { text: 'arbitration', type: 'tag', category: 'tags' },
    { text: 'international', type: 'tag', category: 'tags' },
    { text: 'enforcement', type: 'tag', category: 'tags' },
    { text: 'secured', type: 'tag', category: 'tags' },
    
    // Case numbers
    { text: 'AST-2025-001', type: 'case-number', category: 'cases' },
    { text: 'AST-2025-002', type: 'case-number', category: 'cases' },
    { text: 'AST-2025-003', type: 'case-number', category: 'cases' },
    { text: 'AST-2025-007', type: 'case-number', category: 'cases' }
  ]
  
  const searchLower = searchTerm.toLowerCase()
  
  // Find matching suggestions
  const suggestions = suggestionData
    .filter(item => item.text.toLowerCase().includes(searchLower))
    .map(item => ({
      ...item,
      highlight: highlightMatch(item.text, searchTerm)
    }))
    .slice(0, limit)
  
  // Group suggestions by category for better UX
  const groupedSuggestions = suggestions.reduce((acc, suggestion) => {
    if (!acc[suggestion.category]) {
      acc[suggestion.category] = []
    }
    acc[suggestion.category].push(suggestion)
    return acc
  }, {} as Record<string, typeof suggestions>)
  
  // Add caching headers (short cache for suggestions)
  setHeader(event, 'Cache-Control', 'public, max-age=60, stale-while-revalidate=120')
  
  return {
    suggestions,
    groupedSuggestions,
    query: searchTerm,
    meta: {
      totalFound: suggestions.length,
      searchTime: 20
    }
  }
})

/**
 * Highlight matching text in suggestions
 */
function highlightMatch(text: string, searchTerm: string): string {
  if (!searchTerm) return text
  
  const regex = new RegExp(`(${searchTerm})`, 'gi')
  return text.replace(regex, '<mark>$1</mark>')
}