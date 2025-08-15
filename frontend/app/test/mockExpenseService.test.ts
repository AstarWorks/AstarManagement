import { describe, it, expect, beforeEach } from 'vitest'
import { mockExpenseDataService } from '~/services/mockExpenseDataService'
import type { ICreateExpenseRequest, IUpdateExpenseRequest, IExpense, IExpenseList  } from '@expense/types/expense'

describe('MockExpenseDataService', () => {
  beforeEach(async () => {
    // Reset the service before each test
    await mockExpenseDataService.resetDatabase()
  })

  describe('Data Generation', () => {
    it('should generate valid expense with all required fields', () => {
      const expense = mockExpenseDataService.generateExpense()
      
      expect(expense).toHaveProperty('id')
      expect(expense).toHaveProperty('tenantId', 'tenant-1')
      expect(expense).toHaveProperty('date')
      expect(expense).toHaveProperty('category')
      expect(expense).toHaveProperty('description')
      expect(expense).toHaveProperty('incomeAmount')
      expect(expense).toHaveProperty('expenseAmount')
      expect(expense).toHaveProperty('createdAt')
      expect(expense).toHaveProperty('updatedAt')
      expect(expense).toHaveProperty('createdBy')
    })

    it('should generate expense with custom overrides', () => {
      const customData = {
        category: '交通費',
        description: 'カスタムテスト経費',
        expenseAmount: 1500
      }
      
      const expense = mockExpenseDataService.generateExpense(customData)
      
      expect(expense.category).toBe(customData.category)
      expect(expense.description).toBe(customData.description)
      expect(expense.expenseAmount).toBe(customData.expenseAmount)
    })

    it('should generate expenses for each category', () => {
      const transportation = mockExpenseDataService.generateTransportationExpense()
      const stampFee = mockExpenseDataService.generateStampFeeExpense()
      const copyFee = mockExpenseDataService.generateCopyFeeExpense()
      const postage = mockExpenseDataService.generatePostageExpense()
      const other = mockExpenseDataService.generateOtherExpense()

      expect(transportation.category).toBe('交通費')
      expect(stampFee.category).toBe('印紙代')
      expect(copyFee.category).toBe('コピー代')
      expect(postage.category).toBe('郵送料')
      expect(other.category).toBe('その他')
    })
  })

  describe('CRUD Operations', () => {
    it('should create expense successfully', () => {
      const createRequest: ICreateExpenseRequest = {
        date: '2025-08-04',
        category: '交通費',
        description: 'テスト交通費',
        incomeAmount: 0,
        expenseAmount: 1000,
        tagIds: [],
        attachmentIds: []
      }

      const expense = mockExpenseDataService.createExpense(createRequest)

      expect(expense.date).toBe(createRequest.date)
      expect(expense.category).toBe(createRequest.category)
      expect(expense.description).toBe(createRequest.description)
      expect(expense.expenseAmount).toBe(createRequest.expenseAmount)
      expect(expense.incomeAmount).toBe(0) // default value
    })

    it('should retrieve expense by id', () => {
      const expense = mockExpenseDataService.generateExpense()
      const retrieved = mockExpenseDataService.getExpense(expense.id)

      expect(retrieved).toEqual(expense)
    })

    it('should return null for non-existent expense', () => {
      const retrieved = mockExpenseDataService.getExpense('non-existent-id')
      expect(retrieved).toBeNull()
    })

    it('should update expense successfully', () => {
      const expense = mockExpenseDataService.generateExpense()
      const updateRequest: IUpdateExpenseRequest = {
        description: '更新されたテスト経費',
        expenseAmount: 2000
      }

      const updated = mockExpenseDataService.updateExpense(expense.id, updateRequest)

      expect(updated).not.toBeNull()
      if (updated) {
        expect(updated.description).toBe(updateRequest.description)
        expect(updated.expenseAmount).toBe(updateRequest.expenseAmount)
        expect(updated.updatedAt).not.toBe(expense.updatedAt)
      }
    })

    it('should delete expense successfully', () => {
      const expense = mockExpenseDataService.generateExpense()
      
      const deleteResult = mockExpenseDataService.deleteExpense(expense.id)
      expect(deleteResult).toBe(true)
      
      const retrieved = mockExpenseDataService.getExpense(expense.id)
      expect(retrieved).toBeNull()
    })

    it('should return false when deleting non-existent expense', () => {
      const deleteResult = mockExpenseDataService.deleteExpense('non-existent-id')
      expect(deleteResult).toBe(false)
    })
  })

  describe('Filtering and Search', () => {
    beforeEach(async () => {
      // Seed with some test data
      await mockExpenseDataService.seedDatabase(10)
    })

    it('should filter expenses by category', () => {
      const result = mockExpenseDataService.getExpenses({
        category: '交通費'
      })

      const expenseList = result as IExpenseList
      expect(expenseList.items.every((expense: IExpense) => expense.category === '交通費')).toBe(true)
    })

    it('should filter expenses by date range', () => {
      const startDate = '2024-01-01'
      const endDate = '2024-12-31'

      const result = mockExpenseDataService.getExpenses({
        startDate,
        endDate
      })

      const expenseList = result as IExpenseList
      expect(expenseList.items.every((expense: IExpense) => 
        expense.date >= startDate && expense.date <= endDate
      )).toBe(true)
    })

    it('should search expenses by description', () => {
      // Create a specific expense to search for
      const testExpense = mockExpenseDataService.createExpense({
        date: '2025-08-04',
        category: '交通費',
        description: 'ユニークな検索テスト経費',
        incomeAmount: 0,
        expenseAmount: 1000,
        tagIds: [],
        attachmentIds: []
      })

      const result = mockExpenseDataService.getExpenses({
        searchTerm: 'ユニークな検索'
      })

      const expenseList = result as IExpenseList
      expect(expenseList.items.some((expense: IExpense) => expense.id === testExpense.id)).toBe(true)
    })

    it('should handle pagination correctly', () => {
      const limit = 5
      const result = mockExpenseDataService.getExpenses({
        offset: 0,
        limit
      })

      const expenseList = result as IExpenseList
      expect(expenseList.items.length).toBeLessThanOrEqual(limit)
      expect(expenseList.limit).toBe(limit)
      expect(expenseList.offset).toBe(0)
      expect(expenseList.hasMore).toBe(result.total > limit)
    })

    it('should sort expenses correctly', () => {
      const result = mockExpenseDataService.getExpenses({
        sortBy: 'date',
        sortOrder: 'ASC'
      })

      const expenseList = result as IExpenseList
      for (let i = 1; i < expenseList.items.length; i++) {
        expect(new Date(expenseList.items[i]!.date).getTime())
          .toBeGreaterThanOrEqual(new Date(expenseList.items[i-1]!.date).getTime())
      }
    })
  })

  describe('Statistics Generation', () => {
    beforeEach(async () => {
      await mockExpenseDataService.seedDatabase(20)
    })

    it('should generate expense statistics', () => {
      const period = {
        startDate: '2024-01-01',
        endDate: '2024-12-31'
      }

      const stats = mockExpenseDataService.generateExpenseStats(period)

      expect(stats).toHaveProperty('period', period)
      expect(stats).toHaveProperty('totalIncome')
      expect(stats).toHaveProperty('totalExpenses')
      expect(stats).toHaveProperty('balance')
      expect(stats).toHaveProperty('expensesByCategory')
      expect(stats).toHaveProperty('expensesByMonth')
      expect(stats).toHaveProperty('topExpenseCategories')
      expect(Array.isArray(stats.topExpenseCategories)).toBe(true)
    })
  })

  describe('Database Management', () => {
    it('should seed database with specified number of expenses', async () => {
      const count = 50
      await mockExpenseDataService.seedDatabase(count)

      const result = mockExpenseDataService.getExpenses({ limit: 100 })
      expect(result.total).toBe(count)
    })

    it('should reset database successfully', async () => {
      // First, seed some data
      await mockExpenseDataService.seedDatabase(10)
      
      let result = mockExpenseDataService.getExpenses()
      expect(result.total).toBe(10)

      // Reset the database
      await mockExpenseDataService.resetDatabase()
      
      result = mockExpenseDataService.getExpenses()
      expect(result.total).toBe(0)
    })
  })
})