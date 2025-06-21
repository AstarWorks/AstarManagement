# Frontend Mock Mode Setup

This frontend now supports running in standalone mock mode using MSW (Mock Service Worker). This allows frontend development without requiring the backend to be running.

## Quick Start

```bash
# Install dependencies
bun install

# Run frontend with mocks enabled
bun run dev:mock

# Or run without mocks (requires backend)
bun run dev
```

## What's Been Set Up

### 1. MSW (Mock Service Worker)
- Intercepts API calls and returns mock data
- Works in the browser using Service Worker API
- Provides realistic API behavior with delays

### 2. Mock Handlers
- **Authentication**: Login, refresh token, logout
- **Matters**: Full CRUD operations with pagination
- **Search**: Matter search with suggestions

### 3. Mock Database
- Uses @mswjs/data for in-memory database
- Pre-seeded with 20 matters and related data
- Faker.js for realistic test data

### 4. Environment Configuration
- `.env.development` with `NEXT_PUBLIC_ENABLE_MOCKS=true`
- Toggle mocks on/off via environment variable

## Available Mock Users

Login with any username and password (except 'wrongpassword'):
- Username: `admin` - Gets admin role
- Username: `lawyer` - Gets lawyer role
- Any other username - Gets lawyer role

## Features in Mock Mode

✅ Authentication with JWT tokens
✅ Matter CRUD operations
✅ Paginated matter listings
✅ Search functionality
✅ Error simulation (use password: 'wrongpassword')
✅ Network delay simulation
✅ Correlation IDs for requests

## Development Tips

1. **View Network Activity**: Open browser DevTools to see intercepted requests
2. **Modify Mock Data**: Edit files in `src/mocks/` to change behavior
3. **Add New Endpoints**: Add handlers in `src/mocks/handlers/`
4. **Reset Data**: Refresh the page to reset the in-memory database

## Mock Data Structure

```typescript
// Matter
{
  id: string
  caseNumber: string // Format: 2025-CV-XXXX
  title: string
  clientName: string
  status: 'NEW' | 'IN_PROGRESS' | 'PENDING' | 'COMPLETED' | 'ARCHIVED'
  priority: 'LOW' | 'MEDIUM' | 'HIGH' | 'URGENT'
  // ... and more fields
}
```

## Extending Mocks

To add new mock endpoints:

1. Create handler in `src/mocks/handlers/[feature].ts`
2. Export handlers array
3. Import in `src/mocks/handlers/index.ts`
4. Handlers will be automatically registered

Example:
```typescript
// src/mocks/handlers/documents.ts
import { http, HttpResponse } from 'msw'

export const documentHandlers = [
  http.get('/api/v1/documents', () => {
    return HttpResponse.json({ documents: [] })
  })
]
```

💡 **Improvement Suggestion**: Add more mock endpoints as needed
**Time saved**: ~2 hours of backend setup per developer
**Implementation**: Follow the pattern above to add new endpoints
**Benefits**: Complete frontend autonomy, consistent test environment