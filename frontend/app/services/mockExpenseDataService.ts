import type { 
  IExpense, 
  IExpenseList, 
  IExpenseFilter,
  ICreateExpenseRequest,
  IUpdateExpenseRequest,
  IExpenseStatsResponse,
  ITag,
  IAttachment
} from '~/types/expense'

/**
 * Mock Data Generation Service for Expense Management
 * Provides realistic Japanese legal practice expense data for development and testing
 */
export class MockExpenseDataService {
  private static instance: MockExpenseDataService
  private expenses: Map<string, IExpense> = new Map()
  private nextId = 1

  // Japanese legal practice expense categories with realistic data
  private readonly categories = {
    '交通費': {
      label: 'Transportation',
      descriptions: [
        '○○地裁への移動',
        '依頼者事務所への訪問',
        '証人尋問のための移動', 
        '相手方弁護士との打合せ',
        '裁判所書類提出',
        '法律相談のための移動'
      ],
      amountRanges: [500, 2000]
    },
    '印紙代': {
      label: 'Stamp Fees',
      descriptions: [
        '訴訟印紙代',
        '登記印紙代',
        '契約書印紙代',
        '公正証書印紙代',
        '調停申立印紙代',
        '強制執行印紙代'
      ],
      amountRanges: [1000, 50000]
    },
    'コピー代': {
      label: 'Copy Fees', 
      descriptions: [
        '証拠書類コピー代',
        '判例集コピー代',
        '契約書面コピー代',
        '登記簿謄本取得費',
        '資料印刷代',
        '書面作成費'
      ],
      amountRanges: [100, 1500]
    },
    '郵送料': {
      label: 'Postage',
      descriptions: [
        '内容証明郵便代',
        '書類送付郵送費',
        '裁判所提出書面郵送',
        '依頼者への書類送付',
        '配達証明郵便代',
        '相手方への通知郵送'
      ],
      amountRanges: [300, 2000]
    },
    'その他': {
      label: 'Other',
      descriptions: [
        '調査費用',
        '資料購入費',
        '鑑定費用',
        '翻訳費用',
        '事務用品代',
        'データベース利用料'
      ],
      amountRanges: [500, 10000]
    }
  }

  // Japanese legal case types for realistic case association
  private readonly caseTypes = [
    '民事訴訟',
    '債権回収',
    '労働問題',
    '不動産取引',
    '契約紛争',
    '損害賠償',
    '相続問題',
    '企業法務'
  ]

  // Sample Japanese business addresses
  private readonly locations = [
    '東京地方裁判所',
    '大阪地方裁判所',
    '名古屋地方裁判所',
    '福岡地方裁判所',
    '仙台地方裁判所',
    '広島地方裁判所',
    '札幌地方裁判所'
  ]

  private constructor() {
    this.seedDatabase()
  }

  public static getInstance(): MockExpenseDataService {
    if (!MockExpenseDataService.instance) {
      MockExpenseDataService.instance = new MockExpenseDataService()
    }
    return MockExpenseDataService.instance
  }

  /**
   * Generate a single realistic expense record
   */
  public generateExpense(overrides: Partial<IExpense> = {}): IExpense {
    const categories = Object.keys(this.categories)
    const category = overrides.category || this.randomChoice(categories)
    const categoryData = this.categories[category as keyof typeof this.categories]
    
    const expenseAmount = overrides.expenseAmount ?? this.randomAmount(
      categoryData.amountRanges[0]!, 
      categoryData.amountRanges[1]!
    )
    
    const incomeAmount = overrides.incomeAmount || 0
    const balance = incomeAmount - expenseAmount

    const id = overrides.id || `expense-${this.nextId++}`
    const now = new Date().toISOString()
    
    const expense: IExpense = {
      id,
      tenantId: 'tenant-1',
      date: overrides.date ?? this.randomDate(),
      category,
      description: overrides.description ?? this.randomChoice(categoryData.descriptions),
      incomeAmount,
      expenseAmount,
      balance,
      caseId: overrides.caseId ?? (Math.random() > 0.7 ? `case-${Math.floor(Math.random() * 20) + 1}` : undefined),
      memo: overrides.memo ?? (Math.random() > 0.8 ? this.generateMemo() : undefined),
      tags: overrides.tags ?? this.generateTags(),
      attachments: overrides.attachments ?? this.generateAttachments(),
      createdAt: overrides.createdAt ?? now,
      updatedAt: overrides.updatedAt ?? now,
      createdBy: overrides.createdBy ?? 'user-1',
      updatedBy: overrides.updatedBy ?? 'user-1',
      version: overrides.version ?? 1,
      ...overrides
    }

    return expense
  }

  /**
   * Generate multiple expenses with optional filtering
   */
  public generateExpenseList(count: number, filters?: IExpenseFilter): IExpense[] {
    const expenses: IExpense[] = []
    
    for (let i = 0; i < count; i++) {
      const expense = this.generateExpense()
      expenses.push(expense)
    }

    return this.filterExpenses(expenses, filters || {})
  }

  /**
   * Generate expense statistics for a given period
   */
  public generateExpenseStats(period: { startDate: string; endDate: string }): IExpenseStatsResponse {
    const expenses = Array.from(this.expenses.values()).filter(expense => 
      expense.date >= period.startDate && expense.date <= period.endDate
    )

    const totalIncome = expenses.reduce((sum, exp) => sum + exp.incomeAmount, 0)
    const totalExpense = expenses.reduce((sum, exp) => sum + exp.expenseAmount, 0)
    const netBalance = totalIncome - totalExpense

    // Generate category breakdown
    const categoryMap = new Map<string, { amount: number; count: number }>()
    expenses.forEach(expense => {
      const existing = categoryMap.get(expense.category) || { amount: 0, count: 0 }
      categoryMap.set(expense.category, {
        amount: existing.amount + expense.expenseAmount,
        count: existing.count + 1
      })
    })

    const categoryBreakdown = Array.from(categoryMap.entries()).map(([category, data]) => ({
      category,
      totalAmount: data.amount,
      transactionCount: data.count,
      percentage: totalExpense > 0 ? Math.round((data.amount / totalExpense) * 100) : 0
    }))

    return {
      period,
      summary: {
        totalIncome,
        totalExpense,
        netBalance,
        transactionCount: expenses.length
      },
      categoryBreakdown,
      tagBreakdown: [], // Simplified for now
      monthlyTrend: []   // Simplified for now
    }
  }

  /**
   * Generate category-specific expenses
   */
  public generateTransportationExpense(): IExpense {
    return this.generateExpense({ category: '交通費' })
  }

  public generateStampFeeExpense(): IExpense {
    return this.generateExpense({ category: '印紙代' })
  }

  public generateCopyFeeExpense(): IExpense {
    return this.generateExpense({ category: 'コピー代' })
  }

  public generatePostageExpense(): IExpense {
    return this.generateExpense({ category: '郵送料' })
  }

  public generateOtherExpense(): IExpense {
    return this.generateExpense({ category: 'その他' })
  }

  /**
   * Seed the database with initial data
   */
  public async seedDatabase(expenseCount: number = 100): Promise<void> {
    this.expenses.clear()
    this.nextId = 1

    for (let i = 0; i < expenseCount; i++) {
      const expense = this.generateExpense()
      this.expenses.set(expense.id, expense)
    }

    console.log(`[MockExpenseDataService] Seeded database with ${expenseCount} expenses`)
  }

  /**
   * Reset the database
   */
  public async resetDatabase(): Promise<void> {
    this.expenses.clear()
    this.nextId = 1
    console.log('[MockExpenseDataService] Database reset')
  }

  /**
   * Get all expenses with filtering
   */
  public getExpenses(filter: IExpenseFilter = {}): IExpenseList {
    const allExpenses = Array.from(this.expenses.values())
    const filteredExpenses = this.filterExpenses(allExpenses, filter)
    const sortedExpenses = this.sortExpenses(filteredExpenses, filter.sortBy, filter.sortOrder)
    
    const offset = filter.offset || 0
    const limit = filter.limit || 20
    const paginatedExpenses = sortedExpenses.slice(offset, offset + limit)

    return {
      items: paginatedExpenses,
      total: sortedExpenses.length,
      offset,
      limit,
      hasMore: offset + limit < sortedExpenses.length
    }
  }

  /**
   * Get a single expense by ID
   */
  public getExpense(id: string): IExpense | null {
    return this.expenses.get(id) || null
  }

  /**
   * Create a new expense
   */
  public createExpense(data: ICreateExpenseRequest): IExpense {
    const expense = this.generateExpense({
      date: data.date,
      category: data.category,
      description: data.description,
      incomeAmount: data.incomeAmount || 0,
      expenseAmount: data.expenseAmount || 0,
      caseId: data.caseId,
      memo: data.memo
    })

    this.expenses.set(expense.id, expense)
    return expense
  }

  /**
   * Update an existing expense
   */
  public updateExpense(id: string, data: IUpdateExpenseRequest): IExpense | null {
    const existing = this.expenses.get(id)
    if (!existing) return null

    const updated: IExpense = {
      ...existing,
      ...data,
      balance: (data.incomeAmount ?? existing.incomeAmount) - (data.expenseAmount ?? existing.expenseAmount),
      updatedAt: new Date().toISOString(),
      version: existing.version + 1
    }

    this.expenses.set(id, updated)
    return updated
  }

  /**
   * Delete an expense
   */
  public deleteExpense(id: string): boolean {
    return this.expenses.delete(id)
  }

  // Private helper methods
  private randomChoice<T>(items: T[]): T {
    return items[Math.floor(Math.random() * items.length)]!
  }

  private randomAmount(min: number, max: number): number {
    return Math.floor(Math.random() * (max - min + 1)) + min
  }

  private randomDate(): string {
    const start = new Date(2024, 0, 1)
    const end = new Date()
    const randomTime = start.getTime() + Math.random() * (end.getTime() - start.getTime())
    return new Date(randomTime).toISOString().split('T')[0]!
  }

  private generateMemo(): string {
    const memos = [
      '電車代（往復）',
      '書類準備費用',
      '緊急対応のため',
      '依頼者同行',
      'タクシー利用（雨天のため）',
      '資料収集費用'
    ]
    return this.randomChoice(memos)
  }

  private generateTags(): ITag[] {
    // Simplified tag generation for now
    return []
  }

  private generateAttachments(): IAttachment[] {
    // Simplified attachment generation for now
    return []
  }

  private filterExpenses(expenses: IExpense[], filter: IExpenseFilter): IExpense[] {
    return expenses.filter(expense => {
      if (filter.startDate && expense.date < filter.startDate) return false
      if (filter.endDate && expense.date > filter.endDate) return false
      if (filter.category && expense.category !== filter.category) return false
      if (filter.caseId && expense.caseId !== filter.caseId) return false
      if (filter.searchQuery) {
        const query = filter.searchQuery.toLowerCase()
        const matchesDescription = expense.description.toLowerCase().includes(query)
        const matchesMemo = expense.memo?.toLowerCase().includes(query)
        if (!matchesDescription && !matchesMemo) return false
      }
      return true
    })
  }

  private sortExpenses(expenses: IExpense[], sortBy?: string, sortOrder?: string): IExpense[] {
    const sorted = [...expenses]
    const order = sortOrder === 'ASC' ? 1 : -1

    sorted.sort((a, b) => {
      switch (sortBy) {
        case 'category':
          return a.category.localeCompare(b.category) * order
        case 'description':
          return a.description.localeCompare(b.description) * order
        case 'balance':
          return (a.balance - b.balance) * order
        case 'amount':
          return (a.expenseAmount - b.expenseAmount) * order
        case 'date':
        default:
          return (new Date(a.date).getTime() - new Date(b.date).getTime()) * order
      }
    })

    return sorted
  }
}

// Export singleton instance
export const mockExpenseDataService = MockExpenseDataService.getInstance()