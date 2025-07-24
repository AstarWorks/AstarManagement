# Matter API Endpoints

The Matter API provides comprehensive endpoints for managing legal matters/cases in the system.

## Base URL

All matter endpoints are prefixed with: `/api/v1/matters`

## Endpoints

### List Matters

**GET** `/api/v1/matters`

Retrieves a paginated list of matters based on filters and permissions.

#### Query Parameters

```typescript
interface MatterQueryParams {
  page?: number          // Default: 0
  size?: number          // Default: 20, Max: 100
  sort?: string          // Format: "field,direction" e.g., "createdDate,desc"
  status?: MatterStatus  // Filter by status
  assignedTo?: string    // Filter by assigned user ID
  clientId?: string      // Filter by client ID
  search?: string        // Search in title, description, caseNumber
  fromDate?: string      // ISO date string
  toDate?: string        // ISO date string
}
```

#### Response

```typescript
interface PaginatedMatterResponse {
  content: Matter[]
  totalElements: number
  totalPages: number
  size: number
  number: number // Current page
  first: boolean
  last: boolean
  empty: boolean
}
```

#### Example Request

```bash
curl -X GET "http://localhost:8080/api/v1/matters?page=0&size=10&status=ACTIVE&sort=createdDate,desc" \
  -H "Authorization: Bearer <token>"
```

#### Example Response

```json
{
  "content": [
    {
      "id": "550e8400-e29b-41d4-a716-446655440001",
      "caseNumber": "2024-001234",
      "title": "Smith vs. Johnson Property Dispute",
      "description": "Property boundary dispute between neighbors",
      "status": "ACTIVE",
      "type": "CIVIL_LITIGATION",
      "priority": "HIGH",
      "assignedTo": {
        "id": "user-123",
        "name": "John Doe",
        "email": "john.doe@law.com"
      },
      "client": {
        "id": "client-456",
        "name": "Robert Smith",
        "email": "r.smith@email.com"
      },
      "createdDate": "2024-01-15T10:30:00Z",
      "updatedDate": "2024-03-20T14:45:00Z",
      "dueDate": "2024-06-30T23:59:59Z",
      "tags": ["property", "civil", "urgent"],
      "customFields": {
        "courtName": "District Court",
        "opposingCounsel": "Jane Attorney"
      }
    }
  ],
  "totalElements": 42,
  "totalPages": 5,
  "size": 10,
  "number": 0,
  "first": true,
  "last": false,
  "empty": false
}
```

### Get Matter by ID

**GET** `/api/v1/matters/{id}`

Retrieves detailed information about a specific matter.

#### Path Parameters

- `id` (required): UUID of the matter

#### Response

```typescript
interface MatterDetailResponse extends Matter {
  documents: DocumentSummary[]
  activities: Activity[]
  notes: Note[]
  relatedMatters: RelatedMatter[]
}
```

#### Example Request

```bash
curl -X GET "http://localhost:8080/api/v1/matters/550e8400-e29b-41d4-a716-446655440001" \
  -H "Authorization: Bearer <token>"
```

### Create Matter

**POST** `/api/v1/matters`

Creates a new matter in the system.

#### Request Body

```typescript
interface CreateMatterRequest {
  title: string           // Required, 3-200 characters
  description?: string    // Optional, max 2000 characters
  type: MatterType       // Required
  priority: Priority     // Required
  clientId: string       // Required, must be valid client ID
  assignedTo?: string    // Optional, defaults to current user
  dueDate?: string       // Optional, ISO date string
  tags?: string[]        // Optional
  customFields?: Record<string, any> // Optional
}
```

#### Validation Rules

- `title`: Required, 3-200 characters
- `description`: Optional, max 2000 characters
- `type`: Must be valid MatterType enum value
- `priority`: Must be valid Priority enum value
- `clientId`: Must reference existing client
- `dueDate`: If provided, must be future date
- `tags`: Max 10 tags, each max 50 characters

#### Response

```typescript
interface CreateMatterResponse {
  id: string
  caseNumber: string
  ...CreateMatterRequest
  status: "DRAFT"
  createdDate: string
  createdBy: UserSummary
}
```

#### Example Request

```bash
curl -X POST "http://localhost:8080/api/v1/matters" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "New Contract Review",
    "description": "Review and negotiate software licensing agreement",
    "type": "CONTRACT_REVIEW",
    "priority": "MEDIUM",
    "clientId": "client-789",
    "dueDate": "2024-04-30T23:59:59Z",
    "tags": ["contract", "software", "licensing"]
  }'
```

### Update Matter

**PUT** `/api/v1/matters/{id}`

Updates an existing matter. Only modified fields need to be provided.

#### Path Parameters

- `id` (required): UUID of the matter

#### Request Body

```typescript
interface UpdateMatterRequest {
  title?: string
  description?: string
  type?: MatterType
  priority?: Priority
  assignedTo?: string
  dueDate?: string
  tags?: string[]
  customFields?: Record<string, any>
}
```

#### Response

Returns the updated matter object.

### Update Matter Status

**PATCH** `/api/v1/matters/{id}/status`

Updates the status of a matter with validation for allowed transitions.

#### Path Parameters

- `id` (required): UUID of the matter

#### Request Body

```typescript
interface UpdateStatusRequest {
  status: MatterStatus
  reason?: string // Required for certain transitions
  completionNotes?: string // Required when moving to COMPLETED
}
```

#### Status Transition Rules

```typescript
const ALLOWED_TRANSITIONS = {
  DRAFT: ['ACTIVE', 'CANCELLED'],
  ACTIVE: ['ON_HOLD', 'COMPLETED', 'CANCELLED'],
  ON_HOLD: ['ACTIVE', 'CANCELLED'],
  COMPLETED: ['ARCHIVED'],
  CANCELLED: ['ARCHIVED'],
  ARCHIVED: [] // Terminal state
}
```

#### Example Request

```bash
curl -X PATCH "http://localhost:8080/api/v1/matters/550e8400-e29b-41d4-a716-446655440001/status" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "status": "COMPLETED",
    "completionNotes": "Settlement reached. All documents filed."
  }'
```

### Delete Matter (Soft Delete)

**DELETE** `/api/v1/matters/{id}`

Soft deletes a matter. The matter is marked as deleted but retained in the database.

#### Path Parameters

- `id` (required): UUID of the matter

#### Response

```typescript
interface DeleteResponse {
  success: boolean
  message: string
  deletedAt: string
}
```

### Bulk Operations

**POST** `/api/v1/matters/bulk`

Performs bulk operations on multiple matters.

#### Request Body

```typescript
interface BulkOperationRequest {
  operation: 'UPDATE_STATUS' | 'ASSIGN' | 'TAG' | 'DELETE'
  matterIds: string[]
  data: Record<string, any> // Operation-specific data
}
```

#### Example Request

```bash
curl -X POST "http://localhost:8080/api/v1/matters/bulk" \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "operation": "UPDATE_STATUS",
    "matterIds": ["id1", "id2", "id3"],
    "data": {
      "status": "ON_HOLD",
      "reason": "Awaiting client response"
    }
  }'
```

## Using Matter API in Nuxt.js

### Matter Composable

```typescript
// composables/api/useMatters.ts
export const useMatters = () => {
  const { $api } = useNuxtApp()
  
  const fetchMatters = async (params?: MatterQueryParams) => {
    return await $api<PaginatedMatterResponse>('/matters', { params })
  }
  
  const getMatter = async (id: string) => {
    return await $api<MatterDetailResponse>(`/matters/${id}`)
  }
  
  const createMatter = async (data: CreateMatterRequest) => {
    return await $api<Matter>('/matters', {
      method: 'POST',
      body: data
    })
  }
  
  const updateMatter = async (id: string, data: UpdateMatterRequest) => {
    return await $api<Matter>(`/matters/${id}`, {
      method: 'PUT',
      body: data
    })
  }
  
  const updateMatterStatus = async (id: string, data: UpdateStatusRequest) => {
    return await $api<Matter>(`/matters/${id}/status`, {
      method: 'PATCH',
      body: data
    })
  }
  
  const deleteMatter = async (id: string) => {
    return await $api<DeleteResponse>(`/matters/${id}`, {
      method: 'DELETE'
    })
  }
  
  return {
    fetchMatters,
    getMatter,
    createMatter,
    updateMatter,
    updateMatterStatus,
    deleteMatter
  }
}
```

### TanStack Query Integration

```typescript
// composables/useMattersQuery.ts
export const useMattersQuery = (params?: MaybeRef<MatterQueryParams>) => {
  const { fetchMatters } = useMatters()
  
  return useQuery({
    queryKey: ['matters', params],
    queryFn: () => fetchMatters(unref(params)),
    staleTime: 30000, // 30 seconds
    cacheTime: 5 * 60 * 1000, // 5 minutes
  })
}

export const useMatterQuery = (id: MaybeRef<string>) => {
  const { getMatter } = useMatters()
  
  return useQuery({
    queryKey: ['matter', id],
    queryFn: () => getMatter(unref(id)),
    enabled: computed(() => !!unref(id))
  })
}

export const useMatterMutations = () => {
  const queryClient = useQueryClient()
  const { createMatter, updateMatter, deleteMatter } = useMatters()
  
  const createMutation = useMutation({
    mutationFn: createMatter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    }
  })
  
  const updateMutation = useMutation({
    mutationFn: ({ id, data }: { id: string; data: UpdateMatterRequest }) => 
      updateMatter(id, data),
    onSuccess: (data, { id }) => {
      queryClient.setQueryData(['matter', id], data)
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    }
  })
  
  const deleteMutation = useMutation({
    mutationFn: deleteMatter,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['matters'] })
    }
  })
  
  return {
    createMutation,
    updateMutation,
    deleteMutation
  }
}
```

## Error Handling

### Validation Errors (400)

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "title",
        "message": "Title must be between 3 and 200 characters"
      },
      {
        "field": "dueDate",
        "message": "Due date must be in the future"
      }
    ]
  }
}
```

### Not Found (404)

```json
{
  "error": {
    "code": "NOT_FOUND",
    "message": "Matter not found with id: 550e8400-e29b-41d4-a716-446655440001"
  }
}
```

### Forbidden (403)

```json
{
  "error": {
    "code": "FORBIDDEN",
    "message": "You do not have permission to access this matter"
  }
}
```

### Business Rule Violation (422)

```json
{
  "error": {
    "code": "INVALID_STATE_TRANSITION",
    "message": "Cannot transition from COMPLETED to ACTIVE status"
  }
}
```