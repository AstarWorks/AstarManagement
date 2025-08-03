---
task_id: T02_S01_M002
title: Domain Models and DTOs Creation
status: pending
estimated_hours: 6
actual_hours: null
assigned_to: null
dependencies: ["T01_S01_M002"]
---

# T02_S01_M002: Domain Models and DTOs Creation

## Description
Define the core domain models, entities, and data transfer objects (DTOs) for the expense management system. This includes creating the Expense, Tag, and Attachment domain models along with their corresponding request/response DTOs.

## Acceptance Criteria
- [ ] Create domain entities with proper annotations
- [ ] Define value objects for complex types (Money, ExpenseCategory)
- [ ] Create request DTOs with validation annotations
- [ ] Create response DTOs with proper serialization
- [ ] Implement domain model mappers
- [ ] Add audit fields (created_at, updated_at, created_by, updated_by)
- [ ] Include version field for optimistic locking
- [ ] Document all models with KDoc

## Technical Details

### Domain Models

#### Expense Entity
```kotlin
@Entity
@Table(name = "expenses")
data class Expense(
    @Id
    val id: UUID = UUID.randomUUID(),
    val tenantId: UUID,
    val date: LocalDate,
    val category: String,
    val description: String,
    val incomeAmount: BigDecimal = BigDecimal.ZERO,
    val expenseAmount: BigDecimal = BigDecimal.ZERO,
    var balance: BigDecimal = BigDecimal.ZERO,
    val caseId: UUID? = null,
    val memo: String? = null,
    @Embedded
    val auditInfo: AuditInfo = AuditInfo(),
    @Version
    val version: Int = 0
)
```

#### Tag Entity
```kotlin
@Entity
@Table(name = "tags")
data class Tag(
    @Id
    val id: UUID = UUID.randomUUID(),
    val tenantId: UUID,
    val name: String,
    val nameNormalized: String,
    val color: String,
    val scope: TagScope = TagScope.TENANT,
    val ownerId: UUID? = null,
    var usageCount: Int = 0,
    var lastUsedAt: Instant? = null,
    @Embedded
    val auditInfo: AuditInfo = AuditInfo()
)
```

### Request/Response DTOs

#### CreateExpenseRequest
```kotlin
data class CreateExpenseRequest(
    @field:NotNull
    @field:PastOrPresent
    val date: LocalDate,
    
    @field:NotBlank
    @field:Size(max = 50)
    val category: String,
    
    @field:NotBlank
    @field:Size(max = 500)
    val description: String,
    
    @field:DecimalMin("0.00")
    @field:Digits(integer = 10, fraction = 2)
    val incomeAmount: BigDecimal? = BigDecimal.ZERO,
    
    @field:DecimalMin("0.00")
    @field:Digits(integer = 10, fraction = 2)
    val expenseAmount: BigDecimal? = BigDecimal.ZERO,
    
    val caseId: UUID? = null,
    val memo: String? = null,
    val tagIds: List<UUID> = emptyList(),
    val attachmentIds: List<UUID> = emptyList()
)
```

## Subtasks
- [ ] Create Expense domain model
- [ ] Create Tag domain model
- [ ] Create Attachment domain model
- [ ] Create AuditInfo embeddable
- [ ] Create request DTOs with validation
- [ ] Create response DTOs
- [ ] Implement model mappers
- [ ] Add unit tests for validation

## Testing Requirements
- [ ] Validation annotations work correctly
- [ ] Mappers convert between domain and DTOs properly
- [ ] Audit fields populate automatically
- [ ] Version field increments on updates

## Notes
- Use BigDecimal for all monetary values
- Ensure proper null safety with Kotlin
- Follow existing naming conventions from the project
- Consider using @Embeddable for common fields