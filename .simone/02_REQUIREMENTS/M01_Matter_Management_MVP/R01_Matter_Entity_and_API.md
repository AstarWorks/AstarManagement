# Requirement: R01 - Matter Entity and REST API

## Overview
Design and implement the core Matter entity with comprehensive REST API endpoints for CRUD operations, including proper validation, error handling, and audit logging.

## Detailed Requirements

### 1. Matter Entity Model

```kotlin
data class Matter(
    val id: UUID = UUID.randomUUID(),
    val caseNumber: String, // Unique, format: "2025-CV-0001"
    val title: String,
    val description: String?,
    val clientName: String,
    val clientContact: String?,
    val opposingParty: String?,
    val courtName: String?,
    val filingDate: LocalDate?,
    val status: MatterStatus,
    val priority: Priority = Priority.MEDIUM,
    val assignedLawyerId: UUID?,
    val assignedClerkId: UUID?,
    val estimatedCompletionDate: LocalDate?,
    val actualCompletionDate: LocalDate?,
    val notes: String?,
    val tags: Set<String> = emptySet(),
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now(),
    val createdBy: UUID,
    val updatedBy: UUID
)

enum class MatterStatus {
    INITIAL_CONSULTATION,    // 初回相談
    DOCUMENT_PREPARATION,    // 書類作成中
    FILED,                  // 提出済み
    IN_PROGRESS,            // 進行中
    WAITING_COURT_DATE,     // 期日待ち
    IN_COURT,               // 法廷
    SETTLEMENT_DISCUSSION,   // 和解協議中
    CLOSED_WON,             // 終了（勝訴）
    CLOSED_LOST,            // 終了（敗訴）
    CLOSED_SETTLED,         // 終了（和解）
    CLOSED_WITHDRAWN,       // 終了（取下げ）
    ON_HOLD                 // 保留中
}

enum class Priority {
    URGENT,    // 緊急
    HIGH,      // 高
    MEDIUM,    // 中
    LOW        // 低
}
```

### 2. REST API Endpoints

#### 2.1 Create Matter
```
POST /api/v1/matters
Authorization: Bearer {JWT}
Content-Type: application/json

Request:
{
  "caseNumber": "2025-CV-0001",
  "title": "山田太郎 vs 株式会社ABC",
  "clientName": "山田太郎",
  "status": "INITIAL_CONSULTATION",
  "priority": "HIGH"
}

Response: 201 Created
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  "caseNumber": "2025-CV-0001",
  ...
}
```

#### 2.2 Get Matter by ID
```
GET /api/v1/matters/{id}
Authorization: Bearer {JWT}

Response: 200 OK
{
  "id": "550e8400-e29b-41d4-a716-446655440000",
  ...
}
```

#### 2.3 List Matters with Pagination
```
GET /api/v1/matters?page=0&size=20&sort=createdAt,desc&status=IN_PROGRESS
Authorization: Bearer {JWT}

Response: 200 OK
{
  "content": [...],
  "totalElements": 150,
  "totalPages": 8,
  "number": 0,
  "size": 20
}
```

#### 2.4 Update Matter
```
PUT /api/v1/matters/{id}
Authorization: Bearer {JWT}
Content-Type: application/json

Request:
{
  "title": "Updated title",
  "status": "IN_PROGRESS"
}

Response: 200 OK
```

#### 2.5 Update Matter Status (with history)
```
PATCH /api/v1/matters/{id}/status
Authorization: Bearer {JWT}
Content-Type: application/json

Request:
{
  "status": "IN_COURT",
  "notes": "First hearing scheduled"
}

Response: 200 OK
```

#### 2.6 Delete Matter (Soft Delete)
```
DELETE /api/v1/matters/{id}
Authorization: Bearer {JWT}

Response: 204 No Content
```

### 3. Validation Rules

- `caseNumber`: Required, unique, format: YYYY-TT-NNNN (TT = type code)
- `title`: Required, max 200 characters
- `clientName`: Required, max 100 characters
- `status`: Required, must be valid enum value
- `assignedLawyerId`: If provided, must exist in users table with lawyer role
- Status transitions must follow business rules (e.g., can't go from CLOSED to IN_PROGRESS)

### 4. Authorization Rules

- **Lawyers**: Full CRUD access to all matters
- **Clerks**: Read all, Create new, Update only assigned matters, No delete
- **Clients**: Read only their own matters

### 5. Audit Requirements

All changes must be logged in `matter_audit_log` table:
- User who made the change
- Timestamp of change
- Old values vs new values
- IP address of request

### 6. Error Responses

```json
{
  "timestamp": "2025-01-15T10:30:00Z",
  "status": 400,
  "error": "Bad Request",
  "message": "Validation failed",
  "path": "/api/v1/matters",
  "details": [
    {
      "field": "caseNumber",
      "message": "Case number already exists"
    }
  ]
}
```

### 7. Performance Requirements

- GET single matter: < 100ms
- GET matter list (20 items): < 200ms
- CREATE/UPDATE matter: < 300ms
- Status update: < 150ms

## Implementation Notes

1. Use Spring Data JPA with optimistic locking
2. Implement custom repository methods for complex queries
3. Use DTOs for request/response to avoid exposing entity internals
4. Add @Transactional for status updates to ensure consistency
5. Use Spring Cache for frequently accessed matters
6. Implement global exception handler for consistent error responses

## Testing Requirements

- Unit tests for all service methods
- Integration tests for all API endpoints
- Test authorization rules for each role
- Test validation edge cases
- Performance tests with 10,000+ matters