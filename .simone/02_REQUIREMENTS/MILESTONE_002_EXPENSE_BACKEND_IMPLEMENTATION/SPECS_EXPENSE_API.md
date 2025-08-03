# Technical Specifications: Expense API Implementation

## Document Information
- **Milestone**: MILESTONE_002
- **Component**: Expense Management API
- **Created**: 2025-08-03
- **Status**: Draft

## Overview

This document provides technical specifications for implementing the expense management API in Spring Boot (Kotlin). It follows clean architecture principles with clear separation of concerns.

## Architecture

### Package Structure
```
com.astarmanagement.expense/
├── application/
│   ├── dto/
│   ├── mapper/
│   └── service/
├── domain/
│   ├── model/
│   ├── repository/
│   └── service/
├── infrastructure/
│   ├── persistence/
│   ├── storage/
│   └── config/
└── presentation/
    ├── controller/
    ├── request/
    └── response/
```

### Layer Responsibilities
- **Presentation**: HTTP request/response handling, validation
- **Application**: Use cases, DTO mapping, orchestration
- **Domain**: Business logic, entities, domain services
- **Infrastructure**: Database, file storage, external services

## Database Schema

### Tables

#### expenses
```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    date DATE NOT NULL,
    category VARCHAR(50) NOT NULL,
    description TEXT NOT NULL,
    income_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    expense_amount DECIMAL(12, 2) NOT NULL DEFAULT 0,
    balance DECIMAL(12, 2) NOT NULL DEFAULT 0,
    case_id UUID REFERENCES cases(id),
    memo TEXT,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id),
    version INTEGER NOT NULL DEFAULT 0
);
```

#### tags
```sql
CREATE TABLE tags (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    name VARCHAR(50) NOT NULL,
    name_normalized VARCHAR(50) NOT NULL,
    color VARCHAR(7) NOT NULL,
    scope VARCHAR(20) NOT NULL DEFAULT 'tenant',
    owner_id UUID REFERENCES users(id),
    usage_count INTEGER NOT NULL DEFAULT 0,
    last_used_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    created_by UUID NOT NULL REFERENCES users(id),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id)
);
```

#### expense_tags
```sql
CREATE TABLE expense_tags (
    expense_id UUID NOT NULL REFERENCES expenses(id),
    tag_id UUID NOT NULL REFERENCES tags(id),
    PRIMARY KEY (expense_id, tag_id)
);
```

#### attachments
```sql
CREATE TABLE attachments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL REFERENCES tenants(id),
    file_name VARCHAR(255) NOT NULL,
    original_name VARCHAR(255) NOT NULL,
    file_size INTEGER NOT NULL,
    mime_type VARCHAR(100) NOT NULL,
    storage_path TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'temporary',
    linked_at TIMESTAMPTZ,
    expires_at TIMESTAMPTZ,
    thumbnail_path TEXT,
    thumbnail_size INTEGER,
    uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    uploaded_by UUID NOT NULL REFERENCES users(id),
    deleted_at TIMESTAMPTZ,
    deleted_by UUID REFERENCES users(id)
);
```

### Indexes
```sql
CREATE INDEX idx_expenses_tenant_date ON expenses(tenant_id, date DESC);
CREATE INDEX idx_expenses_case ON expenses(case_id);
CREATE INDEX idx_tags_tenant_scope ON tags(tenant_id, scope);
CREATE INDEX idx_attachments_status ON attachments(status, expires_at);
```

## API Specifications

### Base Configuration
- Base URL: `/api/v1`
- Authentication: JWT Bearer Token
- Content-Type: `application/json`
- Pagination: Limit/Offset based

### Expense Endpoints

#### Create Expense
```kotlin
@PostMapping("/expenses")
fun createExpense(@Valid @RequestBody request: CreateExpenseRequest): ExpenseResponse

data class CreateExpenseRequest(
    val date: LocalDate,
    val category: String,
    val description: String,
    val incomeAmount: BigDecimal? = BigDecimal.ZERO,
    val expenseAmount: BigDecimal? = BigDecimal.ZERO,
    val caseId: UUID? = null,
    val memo: String? = null,
    val tagIds: List<UUID>? = emptyList(),
    val attachmentIds: List<UUID>? = emptyList()
)
```

#### List Expenses
```kotlin
@GetMapping("/expenses")
fun listExpenses(
    @RequestParam(defaultValue = "0") offset: Int,
    @RequestParam(defaultValue = "20") limit: Int,
    @RequestParam startDate: LocalDate?,
    @RequestParam endDate: LocalDate?,
    @RequestParam caseId: UUID?,
    @RequestParam category: String?,
    @RequestParam tagIds: List<UUID>?,
    @RequestParam(defaultValue = "date") sortBy: String,
    @RequestParam(defaultValue = "DESC") sortOrder: String
): PagedResponse<ExpenseResponse>
```

#### Update Expense
```kotlin
@PutMapping("/expenses/{id}")
fun updateExpense(
    @PathVariable id: UUID,
    @Valid @RequestBody request: UpdateExpenseRequest
): ExpenseResponse
```

#### Delete Expense
```kotlin
@DeleteMapping("/expenses/{id}")
@ResponseStatus(HttpStatus.NO_CONTENT)
fun deleteExpense(@PathVariable id: UUID)
```

### Tag Endpoints

#### Create Tag
```kotlin
@PostMapping("/tags")
fun createTag(@Valid @RequestBody request: CreateTagRequest): TagResponse

data class CreateTagRequest(
    val name: String,
    val color: String,
    val scope: TagScope = TagScope.TENANT
)
```

#### List Tags
```kotlin
@GetMapping("/tags")
fun listTags(
    @RequestParam scope: TagScope?,
    @RequestParam search: String?
): List<TagResponse>
```

### Attachment Endpoints

#### Upload Attachment
```kotlin
@PostMapping("/attachments")
fun uploadAttachment(
    @RequestParam("file") file: MultipartFile
): AttachmentResponse
```

#### Link Attachment
```kotlin
@PostMapping("/expenses/{expenseId}/attachments/{attachmentId}")
@ResponseStatus(HttpStatus.NO_CONTENT)
fun linkAttachment(
    @PathVariable expenseId: UUID,
    @PathVariable attachmentId: UUID
)
```

## Domain Models

### Expense Entity
```kotlin
@Entity
@Table(name = "expenses")
class Expense(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(nullable = false)
    val tenantId: UUID,
    
    @Column(nullable = false)
    val date: LocalDate,
    
    @Column(nullable = false)
    val category: String,
    
    @Column(nullable = false)
    val description: String,
    
    @Column(nullable = false, precision = 12, scale = 2)
    val incomeAmount: BigDecimal = BigDecimal.ZERO,
    
    @Column(nullable = false, precision = 12, scale = 2)
    val expenseAmount: BigDecimal = BigDecimal.ZERO,
    
    @Column(nullable = false, precision = 12, scale = 2)
    var balance: BigDecimal = BigDecimal.ZERO,
    
    @Column
    val caseId: UUID? = null,
    
    @Column(columnDefinition = "TEXT")
    val memo: String? = null,
    
    @ManyToMany
    @JoinTable(
        name = "expense_tags",
        joinColumns = [JoinColumn(name = "expense_id")],
        inverseJoinColumns = [JoinColumn(name = "tag_id")]
    )
    val tags: MutableSet<Tag> = mutableSetOf(),
    
    @OneToMany(mappedBy = "expense")
    val attachments: MutableSet<ExpenseAttachment> = mutableSetOf(),
    
    @Embedded
    val auditInfo: AuditInfo = AuditInfo(),
    
    @Version
    val version: Int = 0
) {
    fun calculateNetAmount(): BigDecimal = incomeAmount - expenseAmount
    
    fun isIncome(): Boolean = incomeAmount > BigDecimal.ZERO
    
    fun isExpense(): Boolean = expenseAmount > BigDecimal.ZERO
}
```

### Tag Entity
```kotlin
@Entity
@Table(name = "tags")
class Tag(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(nullable = false)
    val tenantId: UUID,
    
    @Column(nullable = false, length = 50)
    val name: String,
    
    @Column(nullable = false, length = 50)
    val nameNormalized: String,
    
    @Column(nullable = false, length = 7)
    val color: String,
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false, length = 20)
    val scope: TagScope = TagScope.TENANT,
    
    @Column
    val ownerId: UUID? = null,
    
    @Column(nullable = false)
    var usageCount: Int = 0,
    
    @Column
    var lastUsedAt: Instant? = null,
    
    @Embedded
    val auditInfo: AuditInfo = AuditInfo()
)

enum class TagScope {
    TENANT,
    PERSONAL
}
```

## Service Layer

### ExpenseService
```kotlin
@Service
@Transactional
class ExpenseService(
    private val expenseRepository: ExpenseRepository,
    private val tagService: TagService,
    private val attachmentService: AttachmentService,
    private val balanceCalculator: BalanceCalculator
) {
    fun createExpense(command: CreateExpenseCommand): Expense {
        // Validate business rules
        validateExpenseData(command)
        
        // Create expense
        val expense = Expense(
            tenantId = getCurrentTenantId(),
            date = command.date,
            category = command.category,
            description = command.description,
            incomeAmount = command.incomeAmount,
            expenseAmount = command.expenseAmount,
            caseId = command.caseId,
            memo = command.memo
        )
        
        // Add tags
        command.tagIds.forEach { tagId ->
            val tag = tagService.findById(tagId)
            expense.tags.add(tag)
            tagService.incrementUsage(tag)
        }
        
        // Calculate balance
        expense.balance = balanceCalculator.calculateBalance(expense)
        
        // Save and return
        return expenseRepository.save(expense)
    }
    
    fun updateExpense(id: UUID, command: UpdateExpenseCommand): Expense {
        val expense = expenseRepository.findByIdAndTenantId(id, getCurrentTenantId())
            ?: throw ExpenseNotFoundException(id)
        
        // Update fields
        expense.apply {
            date = command.date
            category = command.category
            description = command.description
            incomeAmount = command.incomeAmount
            expenseAmount = command.expenseAmount
            memo = command.memo
        }
        
        // Update tags
        updateExpenseTags(expense, command.tagIds)
        
        // Recalculate balance
        expense.balance = balanceCalculator.calculateBalance(expense)
        
        return expenseRepository.save(expense)
    }
}
```

### BalanceCalculator
```kotlin
@Component
class BalanceCalculator(
    private val expenseRepository: ExpenseRepository
) {
    fun calculateBalance(expense: Expense): BigDecimal {
        val previousBalance = expenseRepository
            .findPreviousBalance(expense.tenantId, expense.date, expense.id)
            ?: BigDecimal.ZERO
        
        return previousBalance + expense.calculateNetAmount()
    }
    
    fun recalculateBalances(tenantId: UUID, fromDate: LocalDate) {
        val expenses = expenseRepository
            .findByTenantIdAndDateGreaterThanEqual(tenantId, fromDate)
            .sortedBy { it.date }
        
        var runningBalance = BigDecimal.ZERO
        expenses.forEach { expense ->
            runningBalance += expense.calculateNetAmount()
            expense.balance = runningBalance
        }
        
        expenseRepository.saveAll(expenses)
    }
}
```

## Error Handling

### Exception Classes
```kotlin
sealed class ExpenseException(message: String) : RuntimeException(message)

class ExpenseNotFoundException(id: UUID) : 
    ExpenseException("Expense not found: $id")

class InvalidExpenseDataException(reason: String) : 
    ExpenseException("Invalid expense data: $reason")

class TagNotFoundException(id: UUID) : 
    ExpenseException("Tag not found: $id")

class AttachmentNotFoundException(id: UUID) : 
    ExpenseException("Attachment not found: $id")

class InsufficientPermissionException(action: String) : 
    ExpenseException("Insufficient permission for: $action")
```

### Global Exception Handler
```kotlin
@RestControllerAdvice
class ExpenseExceptionHandler {
    @ExceptionHandler(ExpenseNotFoundException::class)
    fun handleNotFound(ex: ExpenseNotFoundException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.NOT_FOUND)
            .body(ErrorResponse(
                code = "EXPENSE_NOT_FOUND",
                message = ex.message ?: "Expense not found"
            ))
    }
    
    @ExceptionHandler(InvalidExpenseDataException::class)
    fun handleInvalidData(ex: InvalidExpenseDataException): ResponseEntity<ErrorResponse> {
        return ResponseEntity.status(HttpStatus.BAD_REQUEST)
            .body(ErrorResponse(
                code = "INVALID_EXPENSE_DATA",
                message = ex.message ?: "Invalid expense data"
            ))
    }
}
```

## Testing Strategy

### Unit Tests
```kotlin
@Test
fun `should create expense with tags`() {
    // Given
    val command = CreateExpenseCommand(
        date = LocalDate.now(),
        category = "Transportation",
        description = "Taxi to court",
        expenseAmount = BigDecimal("3000"),
        tagIds = listOf(tag1.id, tag2.id)
    )
    
    // When
    val expense = expenseService.createExpense(command)
    
    // Then
    assertThat(expense.tags).hasSize(2)
    assertThat(expense.balance).isEqualTo(BigDecimal("-3000"))
}
```

### Integration Tests
```kotlin
@SpringBootTest
@AutoConfigureMockMvc
class ExpenseControllerIntegrationTest {
    @Test
    fun `should create and retrieve expense`() {
        // Create expense
        val createRequest = CreateExpenseRequest(...)
        val createResponse = mockMvc.perform(
            post("/api/v1/expenses")
                .contentType(MediaType.APPLICATION_JSON)
                .content(objectMapper.writeValueAsString(createRequest))
        ).andExpect(status().isCreated)
         .andReturn()
        
        // Retrieve expense
        val expenseId = extractId(createResponse)
        mockMvc.perform(
            get("/api/v1/expenses/$expenseId")
        ).andExpect(status().isOk)
         .andExpect(jsonPath("$.id").value(expenseId.toString()))
    }
}
```

## Performance Optimization

### Query Optimization
- Use database indexes for common queries
- Implement pagination for list endpoints
- Batch operations for bulk updates
- Lazy loading for relationships

### Caching Strategy
```kotlin
@Cacheable("tags")
fun findTagsByTenant(tenantId: UUID): List<Tag>

@CacheEvict("tags", allEntries = true)
fun createTag(tag: Tag): Tag
```

### Connection Pooling
```yaml
spring:
  datasource:
    hikari:
      maximum-pool-size: 20
      minimum-idle: 5
      connection-timeout: 30000
```

## Security Considerations

### Input Validation
```kotlin
@Validated
class CreateExpenseRequest(
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
    val incomeAmount: BigDecimal? = BigDecimal.ZERO
)
```

### Tenant Isolation
```kotlin
@Component
class TenantFilter : OncePerRequestFilter() {
    override fun doFilterInternal(
        request: HttpServletRequest,
        response: HttpServletResponse,
        filterChain: FilterChain
    ) {
        val tenantId = extractTenantId(request)
        TenantContext.setCurrentTenant(tenantId)
        try {
            filterChain.doFilter(request, response)
        } finally {
            TenantContext.clear()
        }
    }
}
```

### Audit Logging
```kotlin
@Component
class AuditInterceptor : EmptyInterceptor() {
    override fun onSave(
        entity: Any?,
        id: Serializable?,
        state: Array<Any>?,
        propertyNames: Array<String>?,
        types: Array<Type>?
    ): Boolean {
        if (entity is Auditable) {
            val now = Instant.now()
            val userId = SecurityContext.getCurrentUserId()
            
            setValue(state, propertyNames, "createdAt", now)
            setValue(state, propertyNames, "createdBy", userId)
            setValue(state, propertyNames, "updatedAt", now)
            setValue(state, propertyNames, "updatedBy", userId)
            
            return true
        }
        return false
    }
}
```

## Migration Strategy

### Flyway Migrations
```sql
-- V018__create_expense_tables.sql
CREATE TABLE expenses (...);

-- V019__create_tag_tables.sql
CREATE TABLE tags (...);

-- V020__create_attachment_tables.sql
CREATE TABLE attachments (...);

-- V021__add_expense_indexes.sql
CREATE INDEX idx_expenses_tenant_date ON expenses(...);
```

### Data Seeding
```kotlin
@Component
@Profile("dev", "test")
class ExpenseDataSeeder(
    private val expenseService: ExpenseService,
    private val tagService: TagService
) {
    @EventListener(ApplicationReadyEvent::class)
    fun seedData() {
        // Create sample tags
        val tags = listOf(
            CreateTagCommand("Transportation", "#FF5733"),
            CreateTagCommand("Office Supplies", "#33FF57"),
            CreateTagCommand("Court Fees", "#3357FF")
        ).map { tagService.createTag(it) }
        
        // Create sample expenses
        repeat(50) { i ->
            expenseService.createExpense(
                CreateExpenseCommand(
                    date = LocalDate.now().minusDays(i.toLong()),
                    category = "Sample",
                    description = "Test expense $i",
                    expenseAmount = BigDecimal(1000 + i * 100),
                    tagIds = listOf(tags.random().id)
                )
            )
        }
    }
}
```

## Monitoring & Metrics

### Health Checks
```kotlin
@Component
class ExpenseHealthIndicator : HealthIndicator {
    override fun health(): Health {
        return try {
            val count = expenseRepository.count()
            Health.up()
                .withDetail("expenses", count)
                .build()
        } catch (ex: Exception) {
            Health.down()
                .withException(ex)
                .build()
        }
    }
}
```

### Metrics Collection
```kotlin
@Component
class ExpenseMetrics(
    private val meterRegistry: MeterRegistry
) {
    fun recordExpenseCreated() {
        meterRegistry.counter("expenses.created").increment()
    }
    
    fun recordApiLatency(endpoint: String, duration: Duration) {
        meterRegistry.timer("expenses.api.latency", "endpoint", endpoint)
            .record(duration)
    }
}
```