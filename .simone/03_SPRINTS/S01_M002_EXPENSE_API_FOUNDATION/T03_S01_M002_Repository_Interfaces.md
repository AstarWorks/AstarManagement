---
task_id: T03_S01_M002
title: Repository Interfaces Definition
status: completed
estimated_hours: 4
actual_hours: null
assigned_to: null
dependencies: ["T02_S01_M002"]
---

# T03_S01_M002: Repository Interfaces Definition

## Description
Define repository interfaces following Domain-Driven Design (DDD) patterns for the expense management system. Create both domain repository interfaces and their Spring Data JPA specifications.

## Acceptance Criteria
- [x] Create domain repository interfaces in `domain/repository/`
- [x] Define custom query methods for complex searches
- [x] Add pagination and sorting support
- [x] Include tenant isolation in all queries
- [x] Create Spring Data JPA interfaces in `infrastructure/persistence/`
- [x] Define custom query specifications
- [x] Document all repository methods with KDoc
- [x] Follow DDD repository patterns

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
- [x] Create ExpenseRepository interface
- [x] Create TagRepository interface
- [x] Create AttachmentRepository interface
- [x] Create Spring Data JPA implementations
- [x] Add custom query methods
- [x] Define query specifications for complex searches
- [x] Add repository documentation

## Testing Requirements
- [x] Repository interfaces compile without errors
- [x] Query methods have proper parameter validation
- [x] Tenant isolation is enforced in all methods
- [x] Pagination parameters work correctly

## Notes
- All queries must include tenant isolation
- Use method naming conventions for Spring Data JPA
- Consider performance implications of complex queries
- Soft delete support through deletedAt field

## Output Log

[2025-08-04 04:02]: Code Review - FAIL
Result: **FAIL** - Significant deviations from specifications found
**Scope:** T03_S01_M002 - Repository Interfaces Definition
**Findings:** 
1. Delete method signatures deviation (Severity: 8/10) - All repository interfaces added `userId: UUID` parameter to delete methods not specified in requirements
2. JPA query path deviation (Severity: 6/10) - Queries use `e.auditInfo.deletedAt` instead of specified `e.deletedAt`
3. Missing excludeId parameter (Severity: 7/10) - `findPreviousBalance` method missing `excludeId` parameter in specification (line 53)
**Summary:** Implementation deviates from specifications in method signatures and query implementations. While functionally sound, the code does not match the documented interface contracts.
**Recommendation:** Update repository interfaces to match specifications exactly - remove userId from delete methods and align query paths with spec

[2025-08-04 04:08]: Code Review - PASS
Result: **PASS** - All issues have been resolved
**Scope:** T03_S01_M002 - Repository Interfaces Definition (after fixes)
**Findings:** 
1. Delete method signatures - Fixed, now match specification without userId parameter
2. JPA query paths - Fixed, now use `e.deletedAt` as specified
3. findPreviousBalance parameter - Fixed, excludeId is non-nullable as specified
**Summary:** After corrections, the implementation now matches the specifications exactly. All repository interfaces and JPA implementations conform to the documented requirements.
**Recommendation:** Implementation is ready for next sprint task