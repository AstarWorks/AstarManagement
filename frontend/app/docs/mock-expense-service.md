# Mock Expense Service Documentation

## Overview

The Mock Expense Service provides comprehensive mock data for expense management development. It generates realistic Japanese legal practice expense data and integrates seamlessly with MSW (Mock Service Worker) for API simulation.

## Quick Start

### Basic API Usage

```typescript
import { useMockExpenseApi } from '~/composables/useMockExpenseApi'

const expenseApi = useMockExpenseApi()

// Fetch expenses with filtering
const expenses = await expenseApi.fetchExpenses({
  category: '交通費',
  startDate: '2024-01-01',
  endDate: '2024-12-31',
  limit: 20
})

// Create new expense
const newExpense = await expenseApi.createExpense({
  date: '2025-08-04',
  category: '交通費',
  description: '○○地裁への移動',
  expenseAmount: 1500
})
```

### Development Utilities (Development Mode Only)

```typescript
const expenseApi = useMockExpenseApi()

// Reset mock data
await expenseApi.devUtils?.resetMockData()

// Seed with specific count
await expenseApi.devUtils?.seedMockData(100)

// Generate test expenses for each category
const testExpenses = expenseApi.devUtils?.generateTestExpenses()

// Log current statistics
expenseApi.devUtils?.logMockStats()
```

### Mock Data Manager Component

```typescript
import { useMockDataManager } from '~/composables/useMockExpenseApi'

const mockManager = useMockDataManager()

// Toggle debug panel visibility
mockManager?.toggleVisibility()

// Reset data programmatically
await mockManager?.resetData()

// Get current statistics
const stats = mockManager?.getStats()
```

## Features

### Realistic Data Generation

The service generates authentic Japanese legal practice expense data:

- **交通費 (Transportation)**: Court visits, client meetings, document submissions
- **印紙代 (Stamp Fees)**: Legal document stamps, court filing fees
- **コピー代 (Copy Fees)**: Document copying, evidence preparation
- **郵送料 (Postage)**: Certified mail, document delivery
- **その他 (Other)**: Investigation costs, translation fees, database usage

### Data Characteristics

- **Japanese Context**: Realistic business addresses, court names, station names
- **Legal Practice Focus**: Case-specific clustering, court schedule patterns
- **Realistic Amounts**: Category-appropriate expense ranges
- **Temporal Patterns**: Working day distributions, seasonal variations

### Filtering and Search

- **Date Range**: Filter by start/end dates
- **Category**: Filter by expense categories
- **Case Association**: Filter by case ID
- **Full-text Search**: Search descriptions and memos
- **Tag Filtering**: Filter by associated tags
- **Sorting**: Sort by date, category, amount, description
- **Pagination**: Offset-based pagination with configurable limits

### Error Simulation

Configurable error simulation for testing:

- **Network Failures**: 2% default rate
- **Server Errors**: 1% default rate  
- **Validation Errors**: 5% default rate
- **Timeout Scenarios**: 1% default rate

Customize error rates:

```typescript
// In expense handlers file
const errorConfig = {
  networkFailureRate: 0.05,  // 5% network failures
  serverErrorRate: 0.02,     // 2% server errors
  validationErrorRate: 0.1,  // 10% validation errors
  timeoutRate: 0.02          // 2% timeout errors
}
```

## API Endpoints

All standard expense management endpoints are supported:

### Core CRUD
- `GET /api/v1/expenses` - List expenses with filtering
- `GET /api/v1/expenses/:id` - Get single expense
- `POST /api/v1/expenses` - Create expense
- `PUT /api/v1/expenses/:id` - Update expense
- `DELETE /api/v1/expenses/:id` - Delete expense

### Statistics and Reports
- `GET /api/v1/expenses/summary` - Get expense summary
- `GET /api/v1/expenses/stats` - Get detailed statistics
- `GET /api/v1/expenses/categories` - Get available categories

### Bulk Operations
- `POST /api/v1/expenses/bulk-delete` - Bulk delete expenses

## Query Parameters

### List Expenses (`GET /api/v1/expenses`)

| Parameter | Type | Description |
|-----------|------|-------------|
| `offset` | number | Pagination offset (default: 0) |
| `limit` | number | Items per page (default: 20) |
| `startDate` | string | Start date (YYYY-MM-DD) |
| `endDate` | string | End date (YYYY-MM-DD) |
| `category` | string | Filter by category |
| `caseId` | string | Filter by case ID |
| `searchQuery` | string | Full-text search |
| `tagIds` | string | Comma-separated tag IDs |
| `sortBy` | string | Sort field (date, category, description, balance) |
| `sortOrder` | string | Sort order (ASC, DESC) |

### Summary and Statistics

| Parameter | Type | Description |
|-----------|------|-------------|
| `startDate` | string | Period start date |
| `endDate` | string | Period end date |

## Response Formats

### Expense Object
```typescript
interface IExpense {
  id: string
  tenantId: string
  date: string
  category: string
  description: string
  incomeAmount: number
  expenseAmount: number
  balance: number
  caseId?: string
  memo?: string
  tags: ITag[]
  attachments: IAttachment[]
  createdAt: string
  updatedAt: string
  createdBy: string
  updatedBy: string
  version: number
}
```

### List Response
```typescript
interface IExpenseList {
  items: IExpense[]
  total: number
  offset: number
  limit: number
  hasMore: boolean
}
```

### Error Response
```typescript
interface IApiErrorResponse {
  code: string
  message: string
  timestamp: string
  fieldErrors?: Array<{
    field: string
    message: string
    code: string
  }>
}
```

## Development Tips

### Console Logging

All mock API operations are logged to the console with `[Mock]` prefix:

```
[Mock] GET /api/v1/expenses
[Mock] POST /api/v1/expenses
[Mock] Creating expense: { date: "2025-08-04", ... }
```

### Data Persistence

Mock data persists during the development session but resets on browser refresh. Use the development utilities to restore consistent test data.

### Performance

The mock service is optimized for development use:
- Response times: 50-300ms (configurable)
- Supports up to 1000+ expenses efficiently
- Virtual scrolling support for large datasets

### Integration Testing

Run tests to verify mock service functionality:

```bash
npm run test frontend/app/test/mockExpenseService.test.ts
```

## Troubleshooting

### Common Issues

1. **No data appearing**: Check if MSW is properly initialized
2. **TypeScript errors**: Ensure all expense types are imported correctly
3. **Slow responses**: Adjust delay configuration in handlers
4. **Filtering not working**: Verify query parameter formats

### Debug Mode

Enable development utilities in development mode:

```typescript
const expenseApi = useMockExpenseApi()
if (expenseApi.devUtils) {
  // Development utilities are available
  expenseApi.devUtils.logMockStats()
}
```

## Migration to Real API

When transitioning to real backend APIs:

1. Keep the same composable interface (`useMockExpenseApi`)
2. Update implementation to use real API endpoints
3. Remove mock-specific development utilities
4. Update error handling for production scenarios

The TypeScript interfaces ensure smooth migration as they match the backend API specifications exactly.