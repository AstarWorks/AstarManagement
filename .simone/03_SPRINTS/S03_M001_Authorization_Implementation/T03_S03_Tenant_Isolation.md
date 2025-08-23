---
task_id: T03_S03
title: "Implement Tenant-Scoped Authorization"
sprint: S03
status: pending
complexity: high
priority: critical
category: backend
domains: ["security", "multi-tenancy", "authorization"]
estimate_hours: 6
created: 2025-01-23
---

# T03_S03: Implement Tenant-Scoped Authorization

## 📋 Overview

Ensure complete tenant isolation by implementing tenant-aware authorization checks that prevent any cross-tenant data access, even for users with high privileges.

## 🎯 Objectives

- Implement tenant validation in all data operations
- Create tenant-aware security rules
- Prevent cross-tenant data leakage
- Add tenant context to all queries
- Ensure tenant isolation at multiple layers

## 📝 Acceptance Criteria

- [ ] No cross-tenant data access possible
- [ ] Tenant context validated on every request
- [ ] Repository queries include tenant filtering
- [ ] Service layer enforces tenant boundaries
- [ ] Controller layer validates tenant context
- [ ] Audit logs capture tenant violations

## 🔧 Technical Implementation

### Tenant Context Service Enhancement

```kotlin
@Service
class TenantContextService {
    
    fun getCurrentTenantId(): String {
        val authentication = SecurityContextHolder.getContext().authentication
        val businessContext = authentication?.principal as? BusinessContext
            ?: throw UnauthorizedException("No tenant context available")
        
        return businessContext.tenantId 
            ?: throw UnauthorizedException("User not associated with any tenant")
    }
    
    fun validateTenantAccess(resourceTenantId: String) {
        val currentTenantId = getCurrentTenantId()
        if (resourceTenantId != currentTenantId) {
            throw ForbiddenException("Cross-tenant access denied")
        }
    }
    
    fun <T> withTenantContext(operation: (String) -> T): T {
        val tenantId = getCurrentTenantId()
        return operation(tenantId)
    }
}
```

### Repository Layer - Tenant Filtering

```kotlin
@Repository
interface ExpenseRepository : JpaRepository<Expense, Long> {
    
    @Query("SELECT e FROM Expense e WHERE e.tenantId = :tenantId")
    fun findAllByTenantId(@Param("tenantId") tenantId: String): List<Expense>
    
    @Query("SELECT e FROM Expense e WHERE e.id = :id AND e.tenantId = :tenantId")
    fun findByIdAndTenantId(
        @Param("id") id: Long, 
        @Param("tenantId") tenantId: String
    ): Optional<Expense>
    
    @Modifying
    @Query("DELETE FROM Expense e WHERE e.id = :id AND e.tenantId = :tenantId")
    fun deleteByIdAndTenantId(
        @Param("id") id: Long, 
        @Param("tenantId") tenantId: String
    ): Int
}
```

### Service Layer - Tenant Enforcement

```kotlin
@Service
@Transactional
class ExpenseService(
    private val expenseRepository: ExpenseRepository,
    private val tenantContextService: TenantContextService
) {
    
    fun findAll(): List<ExpenseDto> {
        return tenantContextService.withTenantContext { tenantId ->
            expenseRepository.findAllByTenantId(tenantId)
                .map { it.toDto() }
        }
    }
    
    fun findById(id: Long): ExpenseDto {
        return tenantContextService.withTenantContext { tenantId ->
            expenseRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow { 
                    NotFoundException("Expense not found or access denied")
                }
                .toDto()
        }
    }
    
    fun create(request: CreateExpenseRequest): ExpenseDto {
        return tenantContextService.withTenantContext { tenantId ->
            val expense = Expense(
                tenantId = tenantId,  // Always set from context
                amount = request.amount,
                description = request.description,
                // ... other fields
            )
            expenseRepository.save(expense).toDto()
        }
    }
    
    fun update(id: Long, request: UpdateExpenseRequest): ExpenseDto {
        return tenantContextService.withTenantContext { tenantId ->
            val expense = expenseRepository.findByIdAndTenantId(id, tenantId)
                .orElseThrow { 
                    NotFoundException("Expense not found or access denied")
                }
            
            expense.apply {
                amount = request.amount
                description = request.description
                // ... other updates
            }
            
            expenseRepository.save(expense).toDto()
        }
    }
    
    fun delete(id: Long) {
        tenantContextService.withTenantContext { tenantId ->
            val deletedCount = expenseRepository.deleteByIdAndTenantId(id, tenantId)
            if (deletedCount == 0) {
                throw NotFoundException("Expense not found or access denied")
            }
        }
    }
}
```

### Entity Base Class with Tenant

```kotlin
@MappedSuperclass
@EntityListeners(TenantEntityListener::class)
abstract class TenantAwareEntity {
    
    @Column(name = "tenant_id", nullable = false, updatable = false)
    lateinit var tenantId: String
    
    @PrePersist
    fun prePersist() {
        if (!::tenantId.isInitialized) {
            // This should never happen if service layer is correct
            throw IllegalStateException("Tenant ID must be set before persisting")
        }
    }
}

@Entity
@Table(name = "expenses")
class Expense : TenantAwareEntity() {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    var id: Long? = null
    
    var amount: BigDecimal = BigDecimal.ZERO
    var description: String = ""
    // ... other fields
}
```

### Tenant Security Aspect

```kotlin
@Aspect
@Component
class TenantSecurityAspect(
    private val tenantContextService: TenantContextService
) {
    
    @Around("@annotation(TenantSecured)")
    fun checkTenantAccess(joinPoint: ProceedingJoinPoint): Any? {
        val args = joinPoint.args
        
        // Find tenant-aware entities in method arguments
        args.filterIsInstance<TenantAwareEntity>().forEach { entity ->
            tenantContextService.validateTenantAccess(entity.tenantId)
        }
        
        // Proceed with method execution
        val result = joinPoint.proceed()
        
        // Validate result if it's tenant-aware
        if (result is TenantAwareEntity) {
            tenantContextService.validateTenantAccess(result.tenantId)
        }
        
        return result
    }
}

@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class TenantSecured
```

### Controller with Tenant Validation

```kotlin
@RestController
@RequestMapping("/api/v1/expenses")
class ExpenseController(
    private val expenseService: ExpenseService,
    private val tenantContextService: TenantContextService
) {
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MEMBER', 'VIEWER')")
    @TenantSecured
    fun getExpense(@PathVariable id: Long): ResponseEntity<ExpenseDto> {
        // Service layer handles tenant filtering
        return ResponseEntity.ok(expenseService.findById(id))
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MEMBER')")
    fun createExpense(
        @Valid @RequestBody request: CreateExpenseRequest
    ): ResponseEntity<ExpenseDto> {
        // Tenant ID is set from context, not from request
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(expenseService.create(request))
    }
}
```

### Audit Log for Tenant Violations

```kotlin
@Component
class TenantViolationLogger {
    private val logger = LoggerFactory.getLogger("TENANT_SECURITY")
    
    @EventListener
    fun handleTenantViolation(event: TenantViolationEvent) {
        logger.error(
            "TENANT_VIOLATION: User {} attempted to access tenant {} data while belonging to tenant {}",
            event.userId,
            event.attemptedTenantId,
            event.userTenantId
        )
    }
}
```

## 📋 Subtasks

### Implementation
- [ ] Enhance TenantContextService
- [ ] Add tenant filtering to repositories
- [ ] Update service layer with tenant checks
- [ ] Create TenantAwareEntity base class
- [ ] Implement TenantSecurityAspect
- [ ] Add tenant violation logging

### Testing
- [ ] Test cross-tenant access prevention
- [ ] Test tenant context propagation
- [ ] Test edge cases (null tenant, etc.)
- [ ] Performance impact testing

### Documentation
- [ ] Document tenant isolation strategy
- [ ] Create security guidelines
- [ ] Update API documentation

## 🧪 Testing Strategy

### Security Tests
```kotlin
@Test
fun `user from tenant A cannot access tenant B data`() {
    // Setup: Create expense in tenant B
    val tenantBExpense = createExpenseForTenant("tenant-b")
    
    // Act: Try to access with tenant A user
    mockSecurityContext(userId = "user1", tenantId = "tenant-a", role = "OWNER")
    
    // Assert: Should throw exception or return 404
    assertThrows<NotFoundException> {
        expenseService.findById(tenantBExpense.id)
    }
}

@Test
fun `even OWNER cannot access other tenant data`() {
    // Test that role doesn't override tenant boundaries
}
```

## 🔗 Dependencies

- BusinessContext extraction (S01)
- TenantContextService implementation
- Spring Security configuration

## ✅ Definition of Done

- [ ] Tenant isolation implemented at all layers
- [ ] No cross-tenant access possible
- [ ] All queries include tenant filtering
- [ ] Tenant violations are logged
- [ ] Performance impact <2ms
- [ ] Security tests passing
- [ ] Documentation complete