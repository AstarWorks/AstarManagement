import { http, HttpResponse } from 'msw'
import type { 
  ICreateExpenseRequest, 
  IUpdateExpenseRequest, 
  IExpenseFilter,
  IBulkExpenseRequest
} from '~/types/expense'
import { mockExpenseDataService } from '~/services/mockExpenseDataService'

// Error simulation configuration
interface IErrorSimulationConfig {
  networkFailureRate: number
  serverErrorRate: number
  validationErrorRate: number
  timeoutRate: number
}

const errorConfig: IErrorSimulationConfig = {
  networkFailureRate: 0.02,  // 2% network failures
  serverErrorRate: 0.01,     // 1% server errors
  validationErrorRate: 0.05, // 5% validation errors
  timeoutRate: 0.01          // 1% timeout errors
}

// Helper function to simulate random delays
const simulateDelay = (baseMs: number = 100, varianceMs: number = 200): Promise<void> => {
  const delay = Math.random() * varianceMs + baseMs
  return new Promise(resolve => setTimeout(resolve, delay))
}

// Helper function to simulate errors
const simulateError = (config: IErrorSimulationConfig) => {
  const rand = Math.random()
  
  if (rand < config.networkFailureRate) {
    throw new Error('Network failure')
  } else if (rand < config.networkFailureRate + config.serverErrorRate) {
    return HttpResponse.json(
      { 
        code: 'INTERNAL_SERVER_ERROR', 
        message: 'サーバーエラーが発生しました',
        timestamp: new Date().toISOString()
      }, 
      { status: 500 }
    )
  } else if (rand < config.networkFailureRate + config.serverErrorRate + config.validationErrorRate) {
    return HttpResponse.json(
      { 
        code: 'VALIDATION_ERROR', 
        message: 'バリデーションエラーが発生しました',
        fieldErrors: [
          { field: 'amount', message: '金額は0以上である必要があります', code: 'MIN_VALUE' }
        ],
        timestamp: new Date().toISOString()
      }, 
      { status: 400 }
    )
  }
  
  return null
}

export const expenseHandlers = [
  // Get expenses with filtering and pagination
  http.get('/api/v1/expenses', async ({ request }) => {
    console.log('[Mock] GET /api/v1/expenses')
    
    // Check for errors
    const errorResponse = simulateError(errorConfig)
    if (errorResponse) return errorResponse
    
    await simulateDelay(50, 250)
    
    const url = new URL(request.url)
    const filter: IExpenseFilter = {
      offset: parseInt(url.searchParams.get('offset') || '0'),
      limit: parseInt(url.searchParams.get('limit') || '20'),
      startDate: url.searchParams.get('startDate') || undefined,
      endDate: url.searchParams.get('endDate') || undefined,
      category: url.searchParams.get('category') || undefined,
      caseId: url.searchParams.get('caseId') || undefined,
      searchQuery: url.searchParams.get('searchQuery') || url.searchParams.get('q') || undefined,
      sortBy: (url.searchParams.get('sortBy') as IExpenseFilter['sortBy']) || 'date',
      sortOrder: (url.searchParams.get('sortOrder') as IExpenseFilter['sortOrder']) || 'DESC'
    }

    // Handle tag filtering
    const tagIdsParam = url.searchParams.get('tagIds')
    if (tagIdsParam) {
      filter.tagIds = tagIdsParam.split(',')
    }
    
    const response = mockExpenseDataService.getExpenses(filter)
    
    return HttpResponse.json(response, { 
      status: 200,
      headers: {
        'X-Total-Count': response.total.toString()
      }
    })
  }),

  // Get single expense
  http.get('/api/v1/expenses/:id', async ({ params }) => {
    console.log(`[Mock] GET /api/v1/expenses/${params.id}`)
    
    const errorResponse = simulateError(errorConfig)
    if (errorResponse) return errorResponse
    
    await simulateDelay(30, 150)
    
    const expense = mockExpenseDataService.getExpense(params.id as string)
    
    if (!expense) {
      return HttpResponse.json(
        { 
          code: 'EXPENSE_NOT_FOUND', 
          message: '指定された経費が見つかりません',
          timestamp: new Date().toISOString()
        }, 
        { status: 404 }
      )
    }
    
    return HttpResponse.json(expense, { 
      status: 200
    })
  }),

  // Create expense
  http.post('/api/v1/expenses', async ({ request }) => {
    console.log('[Mock] POST /api/v1/expenses')
    
    const errorResponse = simulateError(errorConfig)
    if (errorResponse) return errorResponse
    
    await simulateDelay(200, 300)
    
    const body = await request.json() as ICreateExpenseRequest
    
    // Basic validation
    if (!body.date || !body.category || !body.description) {
      return HttpResponse.json(
        { 
          code: 'VALIDATION_ERROR',
          message: 'バリデーションエラーが発生しました',
          fieldErrors: [
            ...(body.date ? [] : [{ field: 'date', message: '日付は必須です', code: 'REQUIRED' }]),
            ...(body.category ? [] : [{ field: 'category', message: 'カテゴリは必須です', code: 'REQUIRED' }]),
            ...(body.description ? [] : [{ field: 'description', message: '説明は必須です', code: 'REQUIRED' }])
          ],
          timestamp: new Date().toISOString()
        }, 
        { status: 400 }
      )
    }
    
    const expense = mockExpenseDataService.createExpense(body)
    
    return HttpResponse.json(expense, { 
      status: 201
    })
  }),

  // Update expense
  http.put('/api/v1/expenses/:id', async ({ params, request }) => {
    console.log(`[Mock] PUT /api/v1/expenses/${params.id}`)
    
    const errorResponse = simulateError(errorConfig)
    if (errorResponse) return errorResponse
    
    await simulateDelay(150, 250)
    
    const body = await request.json() as IUpdateExpenseRequest
    const expense = mockExpenseDataService.updateExpense(params.id as string, body)
    
    if (!expense) {
      return HttpResponse.json(
        { 
          code: 'EXPENSE_NOT_FOUND', 
          message: '指定された経費が見つかりません',
          timestamp: new Date().toISOString()
        }, 
        { status: 404 }
      )
    }
    
    return HttpResponse.json(expense, { 
      status: 200
    })
  }),

  // Delete expense
  http.delete('/api/v1/expenses/:id', async ({ params }) => {
    console.log(`[Mock] DELETE /api/v1/expenses/${params.id}`)
    
    const errorResponse = simulateError(errorConfig)
    if (errorResponse) return errorResponse
    
    await simulateDelay(100, 200)
    
    const success = mockExpenseDataService.deleteExpense(params.id as string)
    
    if (!success) {
      return HttpResponse.json(
        { 
          code: 'EXPENSE_NOT_FOUND', 
          message: '指定された経費が見つかりません',
          timestamp: new Date().toISOString()
        }, 
        { status: 404 }
      )
    }
    
    return new HttpResponse(null, { 
      status: 204
    })
  }),

  // Get expense summary
  http.get('/api/v1/expenses/summary', async ({ request }) => {
    console.log('[Mock] GET /api/v1/expenses/summary')
    
    const errorResponse = simulateError(errorConfig)
    if (errorResponse) return errorResponse
    
    await simulateDelay(100, 150)
    
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate') ?? '2024-01-01'
    const endDate = url.searchParams.get('endDate') ?? new Date().toISOString().split('T')[0]!
    
    const stats = mockExpenseDataService.generateExpenseStats({ startDate, endDate })
    
    const summary = {
      totalIncome: stats.summary.totalIncome,
      totalExpense: stats.summary.totalExpense,
      balance: stats.summary.netBalance,
      count: stats.summary.transactionCount,
      categories: stats.categoryBreakdown.map(cat => ({
        name: cat.category,
        count: cat.transactionCount,
        total: cat.totalAmount
      })),
      period: {
        startDate,
        endDate
      }
    }
    
    return HttpResponse.json(summary, { 
      status: 200
    })
  }),

  // Get expense statistics (new endpoint)
  http.get('/api/v1/expenses/stats', async ({ request }) => {
    console.log('[Mock] GET /api/v1/expenses/stats')
    
    const errorResponse = simulateError(errorConfig)
    if (errorResponse) return errorResponse
    
    await simulateDelay(150, 200)
    
    const url = new URL(request.url)
    const startDate = url.searchParams.get('startDate') ?? '2024-01-01'
    const endDate = url.searchParams.get('endDate') ?? new Date().toISOString().split('T')[0]!
    
    const stats = mockExpenseDataService.generateExpenseStats({ startDate, endDate })
    
    return HttpResponse.json(stats, { 
      status: 200
    })
  }),

  // Bulk delete expenses (new endpoint)
  http.post('/api/v1/expenses/bulk-delete', async ({ request }) => {
    console.log('[Mock] POST /api/v1/expenses/bulk-delete')
    
    const errorResponse = simulateError(errorConfig)
    if (errorResponse) return errorResponse
    
    await simulateDelay(300, 400)
    
    const body = await request.json() as IBulkExpenseRequest
    
    let successCount = 0
    let failureCount = 0
    const failures: { expenseId: string; error: string }[] = []
    
    for (const expenseId of body.expenseIds) {
      const success = mockExpenseDataService.deleteExpense(expenseId)
      if (success) {
        successCount++
      } else {
        failureCount++
        failures.push({
          expenseId,
          error: '経費が見つかりません'
        })
      }
    }
    
    const response = {
      successCount,
      failureCount,
      failures
    }
    
    return HttpResponse.json(response, { 
      status: 200
    })
  }),

  // Get expense categories (new endpoint)
  http.get('/api/v1/expenses/categories', async () => {
    console.log('[Mock] GET /api/v1/expenses/categories')
    
    await simulateDelay(50, 100)
    
    const categories = [
      { name: '交通費', label: 'Transportation', color: '#3B82F6' },
      { name: '印紙代', label: 'Stamp Fees', color: '#EF4444' },
      { name: 'コピー代', label: 'Copy Fees', color: '#10B981' },
      { name: '郵送料', label: 'Postage', color: '#F59E0B' },
      { name: 'その他', label: 'Other', color: '#8B5CF6' }
    ]
    
    return HttpResponse.json(categories, { 
      status: 200
    })
  })
]