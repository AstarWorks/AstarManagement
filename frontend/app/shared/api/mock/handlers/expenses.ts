/**
 * Expenses Mock Handler
 * Handles mock API requests for expense endpoints
 */

import type { IRequestOptions } from '../../types'
import { ApiError } from '../../core/ApiError'

// Mock expense data
const mockExpenses = [
  {
    id: '1',
    title: 'Office Supplies',
    description: 'Monthly office supplies purchase',
    amount: 15000,
    date: '2024-01-15',
    category: 'supplies',
    status: 'approved',
    tags: ['office', 'monthly'],
    createdAt: '2024-01-10T10:00:00Z',
    updatedAt: '2024-01-15T14:30:00Z'
  },
  {
    id: '2',
    title: 'Business Travel - Tokyo',
    description: 'Client meeting travel expenses',
    amount: 45000,
    date: '2024-01-20',
    category: 'travel',
    status: 'pending',
    tags: ['travel', 'client'],
    createdAt: '2024-01-18T09:00:00Z',
    updatedAt: '2024-01-18T09:00:00Z'
  },
  {
    id: '3',
    title: 'Software License',
    description: 'Annual software license renewal',
    amount: 120000,
    date: '2024-01-05',
    category: 'services',
    status: 'paid',
    tags: ['software', 'annual'],
    createdAt: '2024-01-03T11:00:00Z',
    updatedAt: '2024-01-06T16:00:00Z'
  }
]

function mockExpenseList(params?: Record<string, unknown>) {
  let filtered = [...mockExpenses]
  
  // Apply basic filtering
  if (params?.category) {
    filtered = filtered.filter(e => e.category === params.category)
  }
  
  if (params?.status) {
    filtered = filtered.filter(e => e.status === params.status)
  }
  
  // Pagination
  const page = Number(params?.page) || 1
  const pageSize = Number(params?.pageSize) || 20
  const start = (page - 1) * pageSize
  const end = start + pageSize
  
  return {
    data: filtered.slice(start, end),
    total: filtered.length,
    page,
    pageSize,
    hasNext: end < filtered.length,
    hasPrev: page > 1
  }
}

function mockExpenseDetail(id: string) {
  const expense = mockExpenses.find(e => e.id === id)
  if (!expense) {
    throw new ApiError({
      message: 'Expense not found',
      statusCode: 404,
      code: 'NOT_FOUND',
      path: `/expenses/${id}`
    })
  }
  return expense
}

function mockCreateExpense(data: Record<string, unknown>) {
  const newExpense = {
    id: Math.random().toString(36).substring(7),
    title: String(data.title || ''),
    description: data.description ? String(data.description) : '',
    amount: Number(data.amount || 0),
    date: String(data.date || new Date().toISOString()),
    category: String(data.category || 'other'),
    status: 'draft',
    tags: Array.isArray(data.tags) ? data.tags.map(String) : [],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  }
  mockExpenses.push(newExpense)
  return newExpense
}

function mockUpdateExpense(id: string, data: Record<string, unknown>) {
  const index = mockExpenses.findIndex(e => e.id === id)
  if (index === -1) {
    throw new ApiError({
      message: 'Expense not found',
      statusCode: 404,
      code: 'NOT_FOUND',
      path: `/expenses/${id}`
    })
  }
  
  const current = mockExpenses[index]!
  mockExpenses[index] = {
    id: current.id,
    title: data.title !== undefined ? String(data.title) : current.title,
    description: data.description !== undefined ? String(data.description) : current.description,
    amount: data.amount !== undefined ? Number(data.amount) : current.amount,
    date: data.date !== undefined ? String(data.date) : current.date,
    category: data.category !== undefined ? String(data.category) : current.category,
    status: data.status !== undefined ? String(data.status) : current.status,
    tags: data.tags !== undefined ? (Array.isArray(data.tags) ? data.tags.map(String) : []) : current.tags,
    createdAt: current.createdAt,
    updatedAt: new Date().toISOString()
  }
  
  return mockExpenses[index]
}

function mockDeleteExpense(id: string) {
  const index = mockExpenses.findIndex(e => e.id === id)
  if (index === -1) {
    throw new ApiError({
      message: 'Expense not found',
      statusCode: 404,
      code: 'NOT_FOUND',
      path: `/expenses/${id}`
    })
  }
  
  mockExpenses.splice(index, 1)
  return { success: true, message: 'Expense deleted successfully' }
}

export default function expensesHandler(options: IRequestOptions) {
  const { method, endpoint, params, body } = options
  
  // Extract ID from endpoint if present
  const idMatch = endpoint.match(/\/expenses\/([^/]+)/)
  const id = idMatch ? idMatch[1] : null
  
  // Handle different endpoints
  if (endpoint.includes('/statistics')) {
    // Mock statistics endpoint
    const total = mockExpenses.reduce((sum, e) => sum + e.amount, 0)
    const average = mockExpenses.length > 0 ? total / mockExpenses.length : 0
    
    const byCategory: Record<string, number> = {}
    const byStatus: Record<string, number> = {}
    
    for (const expense of mockExpenses) {
      byCategory[expense.category] = (byCategory[expense.category] || 0) + expense.amount
      byStatus[expense.status] = (byStatus[expense.status] || 0) + 1
    }
    
    return {
      total,
      average,
      byCategory,
      byStatus
    }
  }
  
  if (endpoint.includes('/approve')) {
    const expense = mockExpenses.find(e => e.id === id)
    if (!expense) {
      throw new ApiError({
        message: 'Expense not found',
        statusCode: 404,
        code: 'NOT_FOUND',
        path: endpoint
      })
    }
    expense.status = 'approved'
    expense.updatedAt = new Date().toISOString()
    return expense
  }
  
  if (endpoint.includes('/reject')) {
    const expense = mockExpenses.find(e => e.id === id)
    if (!expense) {
      throw new ApiError({
        message: 'Expense not found',
        statusCode: 404,
        code: 'NOT_FOUND',
        path: endpoint
      })
    }
    expense.status = 'rejected'
    expense.updatedAt = new Date().toISOString()
    return expense
  }
  
  // Standard CRUD operations
  switch (method) {
    case 'GET':
      if (id) {
        return mockExpenseDetail(id)
      }
      return mockExpenseList(params)
      
    case 'POST':
      return mockCreateExpense(body as Record<string, unknown>)
      
    case 'PUT':
    case 'PATCH':
      if (!id) {
        throw new ApiError({
          message: 'ID required for update',
          statusCode: 400,
          code: 'BAD_REQUEST',
          path: endpoint
        })
      }
      return mockUpdateExpense(id, body as Record<string, unknown>)
      
    case 'DELETE':
      if (!id) {
        throw new ApiError({
          message: 'ID required for delete',
          statusCode: 400,
          code: 'BAD_REQUEST',
          path: endpoint
        })
      }
      return mockDeleteExpense(id)
      
    default:
      throw new ApiError({
        message: 'Method not allowed',
        statusCode: 405,
        code: 'METHOD_NOT_ALLOWED',
        path: endpoint
      })
  }
}