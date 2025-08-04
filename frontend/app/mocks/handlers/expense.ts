import { http, HttpResponse } from 'msw'
import type { ICreateExpenseRequest, IUpdateExpenseRequest } from '~/types/expense'

export const expenseHandlers = [
  // Get expenses with filtering and pagination
  http.get('/api/v1/expenses', async ({ request }) => {
    const url = new URL(request.url)
    const offset = parseInt(url.searchParams.get('offset') || '0')
    const limit = parseInt(url.searchParams.get('limit') || '20')
    
    // Mock response
    const response = {
      items: [],
      total: 0,
      offset,
      limit,
      hasMore: false
    }
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100))
    
    return HttpResponse.json(response, { 
      status: 200
    })
  }),

  // Get single expense
  http.get('/api/v1/expenses/:id', async ({ params }) => {
    const expense = {
      id: params.id as string,
      tenantId: 'tenant-1',
      date: '2025-08-04',
      category: '交通費',
      description: 'サンプル経費',
      incomeAmount: 0,
      expenseAmount: 5000,
      balance: -5000,
      tags: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      version: 1
    }
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50))
    
    return HttpResponse.json(expense, { 
      status: 200
    })
  }),

  // Create expense
  http.post('/api/v1/expenses', async ({ request }) => {
    const body = await request.json() as ICreateExpenseRequest
    
    const expense = {
      id: `expense-${Date.now()}`,
      tenantId: 'tenant-1',
      ...body,
      balance: (body.incomeAmount || 0) - (body.expenseAmount || 0),
      tags: [],
      attachments: [],
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      version: 1
    }
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200))
    
    return HttpResponse.json(expense, { 
      status: 201
    })
  }),

  // Update expense
  http.put('/api/v1/expenses/:id', async ({ params, request }) => {
    const body = await request.json() as IUpdateExpenseRequest
    
    const expense = {
      id: params.id as string,
      tenantId: 'tenant-1',
      ...body,
      balance: (body.incomeAmount || 0) - (body.expenseAmount || 0),
      tags: [],
      attachments: [],
      createdAt: '2025-08-04T00:00:00Z',
      updatedAt: new Date().toISOString(),
      createdBy: 'user-1',
      updatedBy: 'user-1',
      version: 2
    }
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 400 + 150))
    
    return HttpResponse.json(expense, { 
      status: 200
    })
  }),

  // Delete expense
  http.delete('/api/v1/expenses/:id', async () => {
    await new Promise(resolve => setTimeout(resolve, Math.random() * 300 + 100))
    
    return new HttpResponse(null, { 
      status: 204
    })
  }),

  // Get expense summary
  http.get('/api/v1/expenses/summary', async () => {
    const summary = {
      totalIncome: 0,
      totalExpense: 0,
      balance: 0,
      count: 0,
      categories: []
    }
    
    await new Promise(resolve => setTimeout(resolve, Math.random() * 200 + 50))
    
    return HttpResponse.json(summary, { 
      status: 200
    })
  })
]