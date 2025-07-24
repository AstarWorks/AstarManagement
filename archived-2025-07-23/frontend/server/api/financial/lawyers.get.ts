/**
 * Financial Lawyers API Endpoint
 * 
 * Provides list of lawyers with their financial metrics for filtering and analysis.
 * Returns lawyer details including billable hours, expenses, and revenue data.
 */

interface FinancialLawyer {
  id: string
  name: string
  email: string
  department: string
  role: 'Partner' | 'Senior Associate' | 'Associate' | 'Junior Associate'
  hireDate: string
  billableHours: number
  nonBillableHours: number
  totalExpenses: number
  revenueGenerated: number
  hourlyRate: number
  utilizationRate: number
  activeMatters: number
  completedMatters: number
  averageExpensePerMatter: number
  lastActivityDate: string
  specializations: string[]
  status: 'active' | 'on-leave' | 'inactive'
}

interface LawyersResponse {
  lawyers: FinancialLawyer[]
  total: number
  summary: {
    totalBillableHours: number
    totalRevenue: number
    averageUtilization: number
    activeLawyers: number
  }
}

export default defineEventHandler(async (event): Promise<LawyersResponse> => {
  const query = getQuery(event)
  
  // Parse query parameters
  const department = query.department as string
  const role = query.role as string
  const status = query.status as string || 'active'
  const minUtilization = query.minUtilization ? parseFloat(query.minUtilization as string) : undefined
  
  // Simulate API delay
  await new Promise(resolve => setTimeout(resolve, 150 + Math.random() * 250))
  
  // Mock lawyer data
  const allLawyers: FinancialLawyer[] = [
    {
      id: 'lawyer-001',
      name: 'Tanaka, Hiroshi',
      email: 'h.tanaka@asterlaw.co.jp',
      department: 'Corporate Law',
      role: 'Partner',
      hireDate: '2018-04-01',
      billableHours: 680,
      nonBillableHours: 120,
      totalExpenses: 420000,
      revenueGenerated: 12580000,
      hourlyRate: 18500,
      utilizationRate: 85.0,
      activeMatters: 4,
      completedMatters: 8,
      averageExpensePerMatter: 52500,
      lastActivityDate: '2024-01-26',
      specializations: ['Mergers & Acquisitions', 'Corporate Governance', 'Securities Law'],
      status: 'active'
    },
    {
      id: 'lawyer-002',
      name: 'Sato, Yuki',
      email: 'y.sato@asterlaw.co.jp',
      department: 'Intellectual Property',
      role: 'Senior Associate',
      hireDate: '2020-09-15',
      billableHours: 590,
      nonBillableHours: 180,
      totalExpenses: 350000,
      revenueGenerated: 8850000,
      hourlyRate: 15000,
      utilizationRate: 76.6,
      activeMatters: 3,
      completedMatters: 12,
      averageExpensePerMatter: 23333,
      lastActivityDate: '2024-01-25',
      specializations: ['Patent Law', 'Trademark Law', 'Copyright Law'],
      status: 'active'
    },
    {
      id: 'lawyer-003',
      name: 'Yamamoto, Kenji',
      email: 'k.yamamoto@asterlaw.co.jp',
      department: 'Litigation',
      role: 'Partner',
      hireDate: '2016-01-10',
      billableHours: 720,
      nonBillableHours: 95,
      totalExpenses: 480000,
      revenueGenerated: 13320000,
      hourlyRate: 18500,
      utilizationRate: 88.3,
      activeMatters: 5,
      completedMatters: 15,
      averageExpensePerMatter: 24000,
      lastActivityDate: '2024-01-26',
      specializations: ['Commercial Litigation', 'Employment Law', 'Contract Disputes'],
      status: 'active'
    },
    {
      id: 'lawyer-004',
      name: 'Suzuki, Akiko',
      email: 'a.suzuki@asterlaw.co.jp',
      department: 'Tax Law',
      role: 'Associate',
      hireDate: '2021-06-01',
      billableHours: 520,
      nonBillableHours: 160,
      totalExpenses: 180000,
      revenueGenerated: 6240000,
      hourlyRate: 12000,
      utilizationRate: 76.5,
      activeMatters: 2,
      completedMatters: 6,
      averageExpensePerMatter: 22500,
      lastActivityDate: '2024-01-24',
      specializations: ['Corporate Tax', 'International Tax', 'Tax Planning'],
      status: 'active'
    },
    {
      id: 'lawyer-005',
      name: 'Watanabe, Taro',
      email: 't.watanabe@asterlaw.co.jp',
      department: 'Real Estate',
      role: 'Senior Associate',
      hireDate: '2019-03-20',
      billableHours: 610,
      nonBillableHours: 140,
      totalExpenses: 290000,
      revenueGenerated: 9150000,
      hourlyRate: 15000,
      utilizationRate: 81.3,
      activeMatters: 3,
      completedMatters: 9,
      averageExpensePerMatter: 24167,
      lastActivityDate: '2024-01-25',
      specializations: ['Commercial Real Estate', 'Real Estate Finance', 'Land Use'],
      status: 'active'
    },
    {
      id: 'lawyer-006',
      name: 'Nakamura, Yuki',
      email: 'y.nakamura@asterlaw.co.jp',
      department: 'Corporate Law',
      role: 'Junior Associate',
      hireDate: '2023-04-01',
      billableHours: 480,
      nonBillableHours: 200,
      totalExpenses: 120000,
      revenueGenerated: 4800000,
      hourlyRate: 10000,
      utilizationRate: 70.6,
      activeMatters: 2,
      completedMatters: 3,
      averageExpensePerMatter: 24000,
      lastActivityDate: '2024-01-23',
      specializations: ['Corporate Compliance', 'Contract Law'],
      status: 'active'
    },
    {
      id: 'lawyer-007',
      name: 'Kobayashi, Ryo',
      email: 'r.kobayashi@asterlaw.co.jp',
      department: 'Employment Law',
      role: 'Associate',
      hireDate: '2020-11-01',
      billableHours: 550,
      nonBillableHours: 170,
      totalExpenses: 220000,
      revenueGenerated: 6600000,
      hourlyRate: 12000,
      utilizationRate: 76.4,
      activeMatters: 3,
      completedMatters: 7,
      averageExpensePerMatter: 22000,
      lastActivityDate: '2024-01-22',
      specializations: ['Labor Relations', 'Workplace Safety', 'Employment Contracts'],
      status: 'active'
    },
    {
      id: 'lawyer-008',
      name: 'Takahashi, Mai',
      email: 'm.takahashi@asterlaw.co.jp',
      department: 'Intellectual Property',
      role: 'Associate',
      hireDate: '2022-02-15',
      billableHours: 500,
      nonBillableHours: 180,
      totalExpenses: 160000,
      revenueGenerated: 6000000,
      hourlyRate: 12000,
      utilizationRate: 73.5,
      activeMatters: 2,
      completedMatters: 5,
      averageExpensePerMatter: 22857,
      lastActivityDate: '2024-01-24',
      specializations: ['Technology Transfer', 'Trade Secrets', 'IP Licensing'],
      status: 'active'
    },
    {
      id: 'lawyer-009',
      name: 'Ito, Keisuke',
      email: 'k.ito@asterlaw.co.jp',
      department: 'Litigation',
      role: 'Senior Associate',
      hireDate: '2019-08-01',
      billableHours: 640,
      nonBillableHours: 130,
      totalExpenses: 380000,
      revenueGenerated: 9600000,
      hourlyRate: 15000,
      utilizationRate: 83.1,
      activeMatters: 4,
      completedMatters: 11,
      averageExpensePerMatter: 25333,
      lastActivityDate: '2024-01-26',
      specializations: ['Civil Litigation', 'Arbitration', 'Dispute Resolution'],
      status: 'active'
    },
    {
      id: 'lawyer-010',
      name: 'Hayashi, Emi',
      email: 'e.hayashi@asterlaw.co.jp',
      department: 'Regulatory Compliance',
      role: 'Senior Associate',
      hireDate: '2018-12-01',
      billableHours: 580,
      nonBillableHours: 150,
      totalExpenses: 270000,
      revenueGenerated: 8700000,
      hourlyRate: 15000,
      utilizationRate: 79.5,
      activeMatters: 3,
      completedMatters: 8,
      averageExpensePerMatter: 24545,
      lastActivityDate: '2024-01-25',
      specializations: ['Financial Regulation', 'Data Privacy', 'Anti-Money Laundering'],
      status: 'active'
    }
  ]
  
  // Apply filters
  let filteredLawyers = allLawyers
  
  if (department && department !== 'all') {
    filteredLawyers = filteredLawyers.filter(lawyer => lawyer.department === department)
  }
  
  if (role && role !== 'all') {
    filteredLawyers = filteredLawyers.filter(lawyer => lawyer.role === role)
  }
  
  if (status !== 'all') {
    filteredLawyers = filteredLawyers.filter(lawyer => lawyer.status === status)
  }
  
  if (minUtilization !== undefined) {
    filteredLawyers = filteredLawyers.filter(lawyer => lawyer.utilizationRate >= minUtilization)
  }
  
  // Sort by utilization rate (highest first)
  filteredLawyers.sort((a, b) => b.utilizationRate - a.utilizationRate)
  
  // Calculate summary statistics
  const summary = {
    totalBillableHours: filteredLawyers.reduce((sum, lawyer) => sum + lawyer.billableHours, 0),
    totalRevenue: filteredLawyers.reduce((sum, lawyer) => sum + lawyer.revenueGenerated, 0),
    averageUtilization: filteredLawyers.length > 0 
      ? filteredLawyers.reduce((sum, lawyer) => sum + lawyer.utilizationRate, 0) / filteredLawyers.length 
      : 0,
    activeLawyers: filteredLawyers.filter(lawyer => lawyer.status === 'active').length
  }
  
  const response: LawyersResponse = {
    lawyers: filteredLawyers,
    total: filteredLawyers.length,
    summary
  }
  
  return response
})