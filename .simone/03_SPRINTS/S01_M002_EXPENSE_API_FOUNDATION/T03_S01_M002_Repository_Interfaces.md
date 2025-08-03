---
task_id: T03_S01_M002
title: Repository Interfaces Definition
status: pending
estimated_hours: 4
actual_hours: null
assigned_to: null
dependencies: ["T02_S01_M002"]
---

# T03_S01_M002: Repository Interfaces Definition

## Description
Define repository interfaces following Domain-Driven Design (DDD) patterns for the expense management system. Create both domain repository interfaces and their Spring Data JPA specifications.

## Acceptance Criteria
- [ ] Create domain repository interfaces in `domain/repository/`
- [ ] Define custom query methods for complex searches
- [ ] Add pagination and sorting support
- [ ] Include tenant isolation in all queries
- [ ] Create Spring Data JPA interfaces in `infrastructure/persistence/`
- [ ] Define custom query specifications
- [ ] Document all repository methods with KDoc
- [ ] Follow DDD repository patterns

## Technical Details

### Domain Repository Interfaces

#### ExpenseRepository
```kotlin
interface ExpenseRepository {
    fun save(expense: Expense): Expense
    fun findById(id: UUID): Expense?
    fun findByIdAndTenantId(id: UUID, tenantId: UUID): Expense?
    fun findByTenantId(
        tenantId: UUID,
        pageable: Pageable
    ): Page<Expense>
    fun findByFilters(
        tenantId: UUID,
        startDate: LocalDate?,
        endDate: LocalDate?,
        caseId: UUID?,
        category: String?,
        tagIds: List<UUID>?,
        pageable: Pageable
    ): Page<Expense>
    fun delete(expense: Expense)
    fun findPreviousBalance(
        tenantId: UUID,
        date: LocalDate,
        excludeId: UUID
    ): BigDecimal?
}
```

#### TagRepository
```kotlin
interface TagRepository {
    fun save(tag: Tag): Tag
    fun findById(id: UUID): Tag?
    fun findByIdAndTenantId(id: UUID, tenantId: UUID): Tag?
    fun findByTenantId(tenantId: UUID): List<Tag>
    fun findByTenantIdAndScope(
        tenantId: UUID,
        scope: TagScope
    ): List<Tag>
    fun findByNameNormalized(
        tenantId: UUID,
        nameNormalized: String
    ): Tag?
    fun findMostUsed(
        tenantId: UUID,
        limit: Int
    ): List<Tag>
    fun delete(tag: Tag)
}
```

#### AttachmentRepository
```kotlin
interface AttachmentRepository {
    fun save(attachment: Attachment): Attachment
    fun findById(id: UUID): Attachment?
    fun findByIdAndTenantId(id: UUID, tenantId: UUID): Attachment?
    fun findByExpenseId(expenseId: UUID): List<Attachment>
    fun findExpiredTemporary(expiryDate: Instant): List<Attachment>
    fun delete(attachment: Attachment)
}
```

### Spring Data JPA Interfaces

#### JpaExpenseRepository
```kotlin
@Repository
interface JpaExpenseRepository : JpaRepository<Expense, UUID> {
    
    @Query("""
        SELECT e FROM Expense e 
        WHERE e.tenantId = :tenantId 
        AND e.deletedAt IS NULL
    """)
    fun findByTenantId(
        tenantId: UUID,
        pageable: Pageable
    ): Page<Expense>
    
    @Query("""
        SELECT e FROM Expense e
        WHERE e.tenantId = :tenantId
        AND (:startDate IS NULL OR e.date >= :startDate)
        AND (:endDate IS NULL OR e.date <= :endDate)
        AND (:caseId IS NULL OR e.caseId = :caseId)
        AND (:category IS NULL OR e.category = :category)
        AND e.deletedAt IS NULL
    """)
    fun findByFilters(
        @Param("tenantId") tenantId: UUID,
        @Param("startDate") startDate: LocalDate?,
        @Param("endDate") endDate: LocalDate?,
        @Param("caseId") caseId: UUID?,
        @Param("category") category: String?,
        pageable: Pageable
    ): Page<Expense>
}
```

## Subtasks
- [ ] Create ExpenseRepository interface
- [ ] Create TagRepository interface
- [ ] Create AttachmentRepository interface
- [ ] Create Spring Data JPA implementations
- [ ] Add custom query methods
- [ ] Define query specifications for complex searches
- [ ] Add repository documentation

## Testing Requirements
- [ ] Repository interfaces compile without errors
- [ ] Query methods have proper parameter validation
- [ ] Tenant isolation is enforced in all methods
- [ ] Pagination parameters work correctly

## Notes
- All queries must include tenant isolation
- Use method naming conventions for Spring Data JPA
- Consider performance implications of complex queries
- Soft delete support through deletedAt field