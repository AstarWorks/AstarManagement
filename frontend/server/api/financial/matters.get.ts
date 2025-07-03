/**
 * Financial Matters API Endpoint
 * 
 * Provides list of available matters for financial filtering.
 * Returns matter details including ID, title, and basic financial metrics.
 */

interface FinancialMatter {
  id: string
  title: string
  clientName: string
  status: 'active' | 'completed' | 'on-hold' | 'draft'
  startDate: string
  assignedLawyer: string
  totalExpenses: number
  budgetAllocated: number
  budgetUtilized: number
  lastExpenseDate: string
  expenseCount: number
  estimatedCompletion?: string
}

interface MattersResponse {
  matters: FinancialMatter[]
  total: number
  page: number
  pageSize: number
  hasMore: boolean
}

export default defineEventHandler(async (event): Promise<MattersResponse> => {
  const query = getQuery(event)
  
  // Parse pagination parameters
  const page = Math.max(1, parseInt(query.page as string) || 1)
  const pageSize = Math.min(50, Math.max(1, parseInt(query.pageSize as string) || 20))
  const status = query.status as string
  const search = query.search as string
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 200 + Math.random() * 300))
  
  // Mock matter data
  const allMatters: FinancialMatter[] = [
    {
      id: 'matter-001',
      title: 'Corporate Merger - ABC Corp',
      clientName: 'ABC Corporation',
      status: 'active',
      startDate: '2024-01-15',
      assignedLawyer: 'Tanaka, Hiroshi',
      totalExpenses: 380000,
      budgetAllocated: 500000,
      budgetUtilized: 76.0,
      lastExpenseDate: '2024-01-24',
      expenseCount: 15,
      estimatedCompletion: '2024-03-15'
    },
    {
      id: 'matter-002',
      title: 'Patent Dispute - XYZ Inc',
      clientName: 'XYZ Technologies Inc',
      status: 'active',
      startDate: '2023-11-20',
      assignedLawyer: 'Sato, Yuki',
      totalExpenses: 295000,
      budgetAllocated: 350000,
      budgetUtilized: 84.3,
      lastExpenseDate: '2024-01-23',
      expenseCount: 22,
      estimatedCompletion: '2024-02-28'
    },
    {
      id: 'matter-003',
      title: 'Contract Review - DEF Ltd',
      clientName: 'DEF Limited',
      status: 'completed',
      startDate: '2023-12-01',
      assignedLawyer: 'Yamamoto, Kenji',
      totalExpenses: 145000,
      budgetAllocated: 200000,
      budgetUtilized: 72.5,
      lastExpenseDate: '2024-01-10',
      expenseCount: 8
    },
    {
      id: 'matter-004',
      title: 'Litigation - GHI Corp',
      clientName: 'GHI Corporation',
      status: 'active',
      startDate: '2023-10-05',
      assignedLawyer: 'Tanaka, Hiroshi',
      totalExpenses: 430000,
      budgetAllocated: 600000,
      budgetUtilized: 71.7,
      lastExpenseDate: '2024-01-25',
      expenseCount: 28,
      estimatedCompletion: '2024-04-30'
    },
    {
      id: 'matter-005',
      title: 'Employment Law - JKL Inc',
      clientName: 'JKL Industries',
      status: 'on-hold',
      startDate: '2024-01-08',
      assignedLawyer: 'Sato, Yuki',
      totalExpenses: 85000,
      budgetAllocated: 250000,
      budgetUtilized: 34.0,
      lastExpenseDate: '2024-01-20',
      expenseCount: 5,
      estimatedCompletion: '2024-05-15'
    },
    {
      id: 'matter-006',
      title: 'Intellectual Property - MNO Tech',
      clientName: 'MNO Technologies',
      status: 'active',
      startDate: '2023-09-15',
      assignedLawyer: 'Yamamoto, Kenji',
      totalExpenses: 320000,
      budgetAllocated: 400000,
      budgetUtilized: 80.0,
      lastExpenseDate: '2024-01-22',
      expenseCount: 18,
      estimatedCompletion: '2024-03-01'
    },
    {
      id: 'matter-007',
      title: 'Regulatory Compliance - PQR Bank',
      clientName: 'PQR Banking Group',
      status: 'active',
      startDate: '2023-12-10',
      assignedLawyer: 'Tanaka, Hiroshi',
      totalExpenses: 225000,
      budgetAllocated: 300000,
      budgetUtilized: 75.0,
      lastExpenseDate: '2024-01-24',
      expenseCount: 12,
      estimatedCompletion: '2024-06-30'
    },
    {
      id: 'matter-008',
      title: 'Real Estate Transaction - STU Properties',
      clientName: 'STU Real Estate',
      status: 'completed',
      startDate: '2023-11-01',
      assignedLawyer: 'Sato, Yuki',
      totalExpenses: 125000,
      budgetAllocated: 180000,
      budgetUtilized: 69.4,
      lastExpenseDate: '2024-01-05',
      expenseCount: 9
    },
    {
      id: 'matter-009',
      title: 'Tax Advisory - VWX Group',
      clientName: 'VWX Business Group',
      status: 'draft',
      startDate: '2024-01-20',
      assignedLawyer: 'Yamamoto, Kenji',
      totalExpenses: 25000,
      budgetAllocated: 150000,
      budgetUtilized: 16.7,
      lastExpenseDate: '2024-01-25',
      expenseCount: 2,
      estimatedCompletion: '2024-04-15'
    },
    {
      id: 'matter-010',
      title: 'Data Privacy Audit - YZA Corp',
      clientName: 'YZA Corporation',
      status: 'active',
      startDate: '2024-01-12',
      assignedLawyer: 'Tanaka, Hiroshi',
      totalExpenses: 95000,
      budgetAllocated: 200000,
      budgetUtilized: 47.5,
      lastExpenseDate: '2024-01-26',
      expenseCount: 7,
      estimatedCompletion: '2024-03-30'
    }
  ]
  
  // Apply filters
  let filteredMatters = allMatters
  
  if (status && status !== 'all') {
    filteredMatters = filteredMatters.filter(matter => matter.status === status)
  }
  
  if (search) {
    const searchLower = search.toLowerCase()
    filteredMatters = filteredMatters.filter(matter => 
      matter.title.toLowerCase().includes(searchLower) ||
      matter.clientName.toLowerCase().includes(searchLower) ||
      matter.assignedLawyer.toLowerCase().includes(searchLower)
    )
  }
  
  // Sort by last expense date (most recent first)
  filteredMatters.sort((a, b) => 
    new Date(b.lastExpenseDate).getTime() - new Date(a.lastExpenseDate).getTime()
  )
  
  // Apply pagination
  const startIndex = (page - 1) * pageSize
  const endIndex = startIndex + pageSize
  const paginatedMatters = filteredMatters.slice(startIndex, endIndex)
  
  const response: MattersResponse = {
    matters: paginatedMatters,
    total: filteredMatters.length,
    page,
    pageSize,
    hasMore: endIndex < filteredMatters.length
  }
  
  return response
})