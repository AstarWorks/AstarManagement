package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.base.DatabaseIntegrationTestBase
import com.astarworks.astarmanagement.expense.domain.model.AuditInfo
import com.astarworks.astarmanagement.expense.domain.model.Expense
import com.astarworks.astarmanagement.expense.domain.model.Tag
import com.astarworks.astarmanagement.expense.domain.model.TagScope
import com.astarworks.astarmanagement.expense.domain.repository.ExpenseRepository
import com.astarworks.astarmanagement.expense.domain.repository.TagRepository
import com.astarworks.astarmanagement.expense.fixtures.ExpenseFixtures
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.domain.PageRequest
import org.springframework.data.domain.Sort
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.*
import kotlin.system.measureTimeMillis

/**
 * Comprehensive integration tests for ExpenseRepository.
 * 
 * Tests cover:
 * - All CRUD operations with tenant isolation
 * - Complex filtering and pagination
 * - Multi-tenant security and RLS enforcement
 * - Transaction management and data integrity
 * - Performance benchmarks
 * - Edge cases and error scenarios
 */
@ActiveProfiles("test")
@Transactional
class ExpenseRepositoryIntegrationTest : DatabaseIntegrationTestBase() {

    @Autowired
    private lateinit var expenseRepository: ExpenseRepository
    
    @Autowired
    private lateinit var tagRepository: TagRepository

    // ========== CRUD Operations Tests ==========

    @Test
    fun `should save and retrieve expense with all fields`() {
        // Given
        val expense = Expense(
            tenantId = defaultTenantId,
            date = LocalDate.now(),
            category = "Legal Research",
            description = "Westlaw subscription",
            incomeAmount = BigDecimal.ZERO,
            expenseAmount = BigDecimal("500.00"),
            balance = BigDecimal("-500.00"),
            caseId = UUID.randomUUID(),
            memo = "Monthly subscription fee",
            auditInfo = AuditInfo(
                createdBy = defaultUserId,
                updatedBy = defaultUserId
            )
        )

        // When
        val saved = expenseRepository.save(expense)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = expenseRepository.findById(saved.id)
        assertThat(found).isNotNull
        assertThat(found?.id).isEqualTo(saved.id)
        assertThat(found?.tenantId).isEqualTo(defaultTenantId)
        assertThat(found?.category).isEqualTo("Legal Research")
        assertThat(found?.description).isEqualTo("Westlaw subscription")
        assertThat(found?.expenseAmount).isEqualByComparingTo(BigDecimal("500.00"))
        assertThat(found?.memo).isEqualTo("Monthly subscription fee")
        assertThat(found?.auditInfo?.createdBy).isEqualTo(defaultUserId)
    }

    @Test
    fun `should update existing expense`() {
        // Given
        val expense = createTestExpense()
        val saved = expenseRepository.save(expense)
        entityManager.flush()
        entityManager.clear()

        // When
        val toUpdate = expenseRepository.findById(saved.id)!!
        val updated = Expense(
            id = toUpdate.id,
            tenantId = toUpdate.tenantId,
            date = toUpdate.date,
            category = "Updated Category",
            description = "Updated Description",
            incomeAmount = toUpdate.incomeAmount,
            expenseAmount = BigDecimal("750.00"),
            balance = BigDecimal("-750.00"),
            caseId = toUpdate.caseId,
            memo = "Updated memo",
            auditInfo = toUpdate.auditInfo.apply {
                markUpdated(defaultUserId)
            }
        )
        expenseRepository.save(updated)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = expenseRepository.findById(saved.id)
        assertThat(found?.category).isEqualTo("Updated Category")
        assertThat(found?.description).isEqualTo("Updated Description")
        assertThat(found?.expenseAmount).isEqualByComparingTo(BigDecimal("750.00"))
        assertThat(found?.auditInfo?.updatedAt).isAfter(found?.auditInfo?.createdAt)
    }

    @Test
    fun `should soft delete expense`() {
        // Given
        val expense = createTestExpense()
        val saved = expenseRepository.save(expense)
        entityManager.flush()

        // When
        val toDelete = expenseRepository.findById(saved.id)!!
        toDelete.markDeleted(defaultUserId)
        expenseRepository.delete(toDelete)
        entityManager.flush()
        entityManager.clear()

        // Then
        val notFound = expenseRepository.findById(saved.id)
        assertThat(notFound).isNull()

        // But should be found when including deleted
        val foundDeleted = expenseRepository.findByIdIncludingDeleted(saved.id, defaultTenantId)
        assertThat(foundDeleted).isNotNull
        assertThat(foundDeleted?.isDeleted()).isTrue()
        assertThat(foundDeleted?.auditInfo?.deletedBy).isEqualTo(defaultUserId)
    }

    @Test
    fun `should restore soft-deleted expense`() {
        // Given
        val expense = createTestExpense()
        val saved = expenseRepository.save(expense)
        saved.markDeleted(defaultUserId)
        expenseRepository.delete(saved)
        entityManager.flush()
        entityManager.clear()

        // When
        val deleted = expenseRepository.findByIdIncludingDeleted(saved.id, defaultTenantId)!!
        deleted.restore(defaultUserId)
        expenseRepository.save(deleted)
        entityManager.flush()
        entityManager.clear()

        // Then
        val restored = expenseRepository.findById(saved.id)
        assertThat(restored).isNotNull
        assertThat(restored?.isDeleted()).isFalse()
    }

    // ========== Multi-Tenant Security Tests ==========

    @Test
    fun `should prevent cross-tenant data access`() {
        // Given - Create expense for tenant1
        val tenant1Id = UUID.randomUUID()
        val tenant1UserId = UUID.randomUUID()
        val tenant1User = createTestUser(tenant1Id)
        
        val expense = withTenantContext(tenant1Id, tenant1UserId, tenant1User) {
            val exp = Expense(
                tenantId = tenant1Id,
                date = LocalDate.now(),
                category = "Tenant1 Expense",
                description = "Private data",
                expenseAmount = BigDecimal("1000.00"),
                auditInfo = AuditInfo(
                    createdBy = tenant1UserId,
                    updatedBy = tenant1UserId
                )
            )
            expenseRepository.save(exp)
        }

        // When - Try to access from tenant2
        val tenant2Id = UUID.randomUUID()
        val tenant2UserId = UUID.randomUUID()
        val tenant2User = createTestUser(tenant2Id)
        
        val crossTenantAccess = withTenantContext(tenant2Id, tenant2UserId, tenant2User) {
            expenseRepository.findByIdAndTenantId(expense.id, tenant2Id)
        }

        // Then
        assertThat(crossTenantAccess).isNull()
    }

    @Test
    fun `should enforce RLS at database level`() {
        // Given - Create expenses for two tenants
        val tenant1Id = UUID.randomUUID()
        val tenant2Id = UUID.randomUUID()
        
        // Create 3 expenses for tenant1
        repeat(3) { i ->
            executeRawSql(
                "INSERT INTO expenses (id, tenant_id, date, category, description, expense_amount, income_amount, balance, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                UUID.randomUUID(), tenant1Id, LocalDate.now(), "Category$i", "Tenant1 Expense $i", 
                BigDecimal("100.00"), BigDecimal.ZERO, BigDecimal("-100.00"), tenant1Id, tenant1Id
            )
        }
        
        // Create 2 expenses for tenant2
        repeat(2) { i ->
            executeRawSql(
                "INSERT INTO expenses (id, tenant_id, date, category, description, expense_amount, income_amount, balance, created_by, updated_by) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                UUID.randomUUID(), tenant2Id, LocalDate.now(), "Category$i", "Tenant2 Expense $i",
                BigDecimal("200.00"), BigDecimal.ZERO, BigDecimal("-200.00"), tenant2Id, tenant2Id
            )
        }

        // When - Query with tenant1 context
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', '$tenant1Id', true)")
        val tenant1Count = queryRawSql<Array<Any>>(
            "SELECT COUNT(*) FROM expenses WHERE deleted_at IS NULL"
        )
        
        // When - Query with tenant2 context  
        jdbcTemplate.execute("SELECT set_config('app.current_tenant_id', '$tenant2Id', true)")
        val tenant2Count = queryRawSql<Array<Any>>(
            "SELECT COUNT(*) FROM expenses WHERE deleted_at IS NULL"
        )

        // Then
        assertThat((tenant1Count[0] as Array<*>)[0] as Long).isEqualTo(3)
        assertThat((tenant2Count[0] as Array<*>)[0] as Long).isEqualTo(2)
    }

    @Test
    fun `should handle null tenant ID gracefully`() {
        // When & Then
        assertThrows<IllegalArgumentException> {
            Expense(
                tenantId = null!!,
                date = LocalDate.now(),
                category = "Test",
                description = "Test",
                expenseAmount = BigDecimal("100.00"),
                auditInfo = AuditInfo()
            )
        }
    }

    // ========== Complex Filtering Tests ==========

    @Test
    fun `should filter expenses by date range`() {
        // Given
        val today = LocalDate.now()
        createTestExpense(date = today.minusDays(10))
        createTestExpense(date = today.minusDays(5))
        createTestExpense(date = today)
        createTestExpense(date = today.plusDays(5))

        // When
        val results = expenseRepository.findByFilters(
            tenantId = defaultTenantId,
            startDate = today.minusDays(7),
            endDate = today.minusDays(1),
            caseId = null,
            category = null,
            tagIds = null,
            pageable = PageRequest.of(0, 10)
        )

        // Then
        assertThat(results.content).hasSize(1)
        assertThat(results.content[0].date).isEqualTo(today.minusDays(5))
    }

    @Test
    fun `should filter expenses by category`() {
        // Given
        createTestExpense(category = "Transportation")
        createTestExpense(category = "Legal Research")
        createTestExpense(category = "Transportation")
        createTestExpense(category = "Office Supplies")

        // When
        val results = expenseRepository.findByFilters(
            tenantId = defaultTenantId,
            startDate = null,
            endDate = null,
            caseId = null,
            category = "Transportation",
            tagIds = null,
            pageable = PageRequest.of(0, 10)
        )

        // Then
        assertThat(results.content).hasSize(2)
        assertThat(results.content).allMatch { it.category == "Transportation" }
    }

    @Test
    fun `should filter expenses by case ID`() {
        // Given
        val caseId = UUID.randomUUID()
        createTestExpense(caseId = caseId)
        createTestExpense(caseId = caseId)
        createTestExpense(caseId = UUID.randomUUID())
        createTestExpense(caseId = null)

        // When
        val results = expenseRepository.findByFilters(
            tenantId = defaultTenantId,
            startDate = null,
            endDate = null,
            caseId = caseId,
            category = null,
            tagIds = null,
            pageable = PageRequest.of(0, 10)
        )

        // Then
        assertThat(results.content).hasSize(2)
        assertThat(results.content).allMatch { it.caseId == caseId }
    }

    @Test
    fun `should filter expenses by tags`() {
        // Given
        val tag1 = createTestTag("Billable")
        val tag2 = createTestTag("Court")
        val tag3 = createTestTag("Travel")

        val expense1 = createTestExpense()
        expense1.addTag(tag1)
        expense1.addTag(tag2)
        expenseRepository.save(expense1)

        val expense2 = createTestExpense()
        expense2.addTag(tag2)
        expense2.addTag(tag3)
        expenseRepository.save(expense2)

        val expense3 = createTestExpense()
        expense3.addTag(tag3)
        expenseRepository.save(expense3)

        createTestExpense() // No tags

        // When - Filter by tag1 and tag2
        val results = expenseRepository.findByFilters(
            tenantId = defaultTenantId,
            startDate = null,
            endDate = null,
            caseId = null,
            category = null,
            tagIds = listOf(tag1.id, tag2.id),
            pageable = PageRequest.of(0, 10)
        )

        // Then
        assertThat(results.content).hasSize(2)
        assertThat(results.content.map { it.id }).containsExactlyInAnyOrder(expense1.id, expense2.id)
    }

    @Test
    fun `should handle complex multi-criteria filtering`() {
        // Given
        val caseId = UUID.randomUUID()
        val tag = createTestTag("Important")
        val today = LocalDate.now()

        // Create various expenses
        val matchingExpense = createTestExpense(
            date = today.minusDays(5),
            category = "Legal Research",
            caseId = caseId
        ).apply {
            addTag(tag)
        }
        expenseRepository.save(matchingExpense)

        // Non-matching expenses
        createTestExpense(date = today.minusDays(20), category = "Legal Research", caseId = caseId) // Wrong date
        createTestExpense(date = today.minusDays(5), category = "Transportation", caseId = caseId) // Wrong category
        createTestExpense(date = today.minusDays(5), category = "Legal Research", caseId = UUID.randomUUID()) // Wrong case

        // When
        val results = expenseRepository.findByFilters(
            tenantId = defaultTenantId,
            startDate = today.minusDays(10),
            endDate = today,
            caseId = caseId,
            category = "Legal Research",
            tagIds = listOf(tag.id),
            pageable = PageRequest.of(0, 10, Sort.by(Sort.Direction.DESC, "date"))
        )

        // Then
        assertThat(results.content).hasSize(1)
        assertThat(results.content[0].id).isEqualTo(matchingExpense.id)
    }

    // ========== Pagination Tests ==========

    @Test
    fun `should paginate expenses correctly`() {
        // Given - Create 25 expenses
        repeat(25) { i ->
            createTestExpense(
                date = LocalDate.now().minusDays(i.toLong()),
                description = "Expense $i"
            )
        }

        // When - Get second page
        val page2 = expenseRepository.findByTenantId(
            tenantId = defaultTenantId,
            pageable = PageRequest.of(1, 10, Sort.by(Sort.Direction.DESC, "date"))
        )

        // Then
        assertThat(page2.totalElements).isEqualTo(25)
        assertThat(page2.totalPages).isEqualTo(3)
        assertThat(page2.content).hasSize(10)
        assertThat(page2.number).isEqualTo(1)
        assertThat(page2.hasNext()).isTrue()
        assertThat(page2.hasPrevious()).isTrue()
    }

    // ========== Balance Calculation Tests ==========

    @Test
    fun `should calculate previous balance correctly`() {
        // Given
        val today = LocalDate.now()
        
        // Create expenses in chronological order
        val expense1 = createTestExpense(
            date = today.minusDays(10),
            incomeAmount = BigDecimal("1000.00"),
            expenseAmount = BigDecimal.ZERO,
            balance = BigDecimal("1000.00")
        )
        
        val expense2 = createTestExpense(
            date = today.minusDays(5),
            incomeAmount = BigDecimal.ZERO,
            expenseAmount = BigDecimal("300.00"),
            balance = BigDecimal("700.00")
        )
        
        val expense3 = createTestExpense(
            date = today,
            incomeAmount = BigDecimal.ZERO,
            expenseAmount = BigDecimal("200.00"),
            balance = BigDecimal("500.00")
        )

        // When
        val balanceBeforeToday = expenseRepository.findPreviousBalance(
            tenantId = defaultTenantId,
            date = today,
            excludeId = null
        )

        // Then
        assertThat(balanceBeforeToday).isEqualByComparingTo(BigDecimal("700.00"))
    }

    @Test
    fun `should exclude specific expense from balance calculation`() {
        // Given
        val today = LocalDate.now()
        val expense1 = createTestExpense(
            date = today.minusDays(2),
            expenseAmount = BigDecimal("100.00"),
            balance = BigDecimal("-100.00")
        )
        val expense2 = createTestExpense(
            date = today.minusDays(1),
            expenseAmount = BigDecimal("50.00"),
            balance = BigDecimal("-150.00")
        )

        // When - Exclude expense2
        val balance = expenseRepository.findPreviousBalance(
            tenantId = defaultTenantId,
            date = today,
            excludeId = expense2.id
        )

        // Then
        assertThat(balance).isEqualByComparingTo(BigDecimal("-100.00"))
    }

    // ========== Data Integrity Tests ==========

    @Test
    fun `should maintain audit trail on updates`() {
        // Given
        val expense = createTestExpense()
        val createdAt = expense.auditInfo.createdAt
        Thread.sleep(100) // Ensure time difference

        // When
        expense.auditInfo.markUpdated(defaultUserId)
        val updated = expenseRepository.save(expense)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = expenseRepository.findById(updated.id)!!
        assertThat(found.auditInfo.createdAt).isEqualTo(createdAt)
        assertThat(found.auditInfo.updatedAt).isAfter(createdAt)
        assertThat(found.auditInfo.updatedBy).isEqualTo(defaultUserId)
    }

    @Test
    fun `should handle expense-tag relationships correctly`() {
        // Given
        val tag1 = createTestTag("Tag1")
        val tag2 = createTestTag("Tag2")
        val expense = createTestExpense()

        // When
        expense.addTag(tag1)
        expense.addTag(tag2)
        val saved = expenseRepository.save(expense)
        entityManager.flush()
        entityManager.clear()

        // Then
        val found = expenseRepository.findById(saved.id)!!
        assertThat(found.tags).hasSize(2)
        assertThat(found.tags.map { it.name }).containsExactlyInAnyOrder("Tag1", "Tag2")
    }

    @Test
    fun `should validate business rules`() {
        // Test negative amounts
        assertThrows<IllegalArgumentException> {
            Expense(
                tenantId = defaultTenantId,
                date = LocalDate.now(),
                category = "Test",
                description = "Test",
                incomeAmount = BigDecimal("-100.00"),
                expenseAmount = BigDecimal.ZERO,
                auditInfo = AuditInfo()
            )
        }

        // Test both income and expense
        assertThrows<IllegalArgumentException> {
            Expense(
                tenantId = defaultTenantId,
                date = LocalDate.now(),
                category = "Test",
                description = "Test",
                incomeAmount = BigDecimal("100.00"),
                expenseAmount = BigDecimal("50.00"),
                auditInfo = AuditInfo()
            )
        }

        // Test blank category
        assertThrows<IllegalArgumentException> {
            Expense(
                tenantId = defaultTenantId,
                date = LocalDate.now(),
                category = "",
                description = "Test",
                expenseAmount = BigDecimal("100.00"),
                auditInfo = AuditInfo()
            )
        }
    }

    // ========== Performance Tests ==========

    @Test
    fun `should handle large datasets efficiently`() {
        // Given - Create 1000 expenses
        val expenses = mutableListOf<Expense>()
        repeat(1000) { i ->
            expenses.add(
                Expense(
                    tenantId = defaultTenantId,
                    date = LocalDate.now().minusDays((i % 365).toLong()),
                    category = "Category${i % 10}",
                    description = "Expense $i",
                    expenseAmount = BigDecimal(100 + (i % 1000)),
                    balance = BigDecimal(-(100 + (i % 1000))),
                    caseId = if (i % 3 == 0) UUID.randomUUID() else null,
                    auditInfo = AuditInfo(
                        createdBy = defaultUserId,
                        updatedBy = defaultUserId
                    )
                )
            )
        }
        
        // Batch save for efficiency
        expenses.chunked(100).forEach { batch ->
            batch.forEach { expenseRepository.save(it) }
            entityManager.flush()
        }
        entityManager.clear()

        // When - Execute complex query
        val executionTime = measureTimeMillis {
            val results = expenseRepository.findByFilters(
                tenantId = defaultTenantId,
                startDate = LocalDate.now().minusDays(30),
                endDate = LocalDate.now(),
                caseId = null,
                category = "Category5",
                tagIds = null,
                pageable = PageRequest.of(0, 20, Sort.by(Sort.Direction.DESC, "date"))
            )
            
            // Force query execution
            results.content.size
        }

        // Then
        assertThat(executionTime).isLessThan(100) // Should complete within 100ms
    }

    @Test
    fun `should use indexes for common queries`() {
        // Given - Ensure some data exists
        repeat(100) { createTestExpense() }

        // When - Test index usage for date range query
        val dateRangeTime = measureTimeMillis {
            expenseRepository.findByFilters(
                tenantId = defaultTenantId,
                startDate = LocalDate.now().minusDays(7),
                endDate = LocalDate.now(),
                caseId = null,
                category = null,
                tagIds = null,
                pageable = PageRequest.of(0, 10)
            ).content.size
        }

        // When - Test index usage for case query
        val caseQueryTime = measureTimeMillis {
            expenseRepository.findByFilters(
                tenantId = defaultTenantId,
                startDate = null,
                endDate = null,
                caseId = UUID.randomUUID(),
                category = null,
                tagIds = null,
                pageable = PageRequest.of(0, 10)
            ).content.size
        }

        // Then
        assertThat(dateRangeTime).isLessThan(50)
        assertThat(caseQueryTime).isLessThan(50)
    }

    // ========== Edge Cases and Error Scenarios ==========

    @Test
    fun `should handle empty result sets`() {
        // When - Query with no matching results
        val results = expenseRepository.findByFilters(
            tenantId = defaultTenantId,
            startDate = LocalDate.now().plusDays(100),
            endDate = LocalDate.now().plusDays(200),
            caseId = null,
            category = null,
            tagIds = null,
            pageable = PageRequest.of(0, 10)
        )

        // Then
        assertThat(results.content).isEmpty()
        assertThat(results.totalElements).isEqualTo(0)
        assertThat(results.hasNext()).isFalse()
    }

    @Test
    fun `should handle concurrent modifications`() {
        // Given
        val expense = createTestExpense()

        // When - Simulate concurrent update
        val version1 = expense.version
        expense.auditInfo.markUpdated(defaultUserId)
        expenseRepository.save(expense)
        entityManager.flush()

        // Then
        val updated = expenseRepository.findById(expense.id)!!
        assertThat(updated.version).isGreaterThan(version1)
    }

    @Test
    fun `should find deleted expenses`() {
        // Given
        val activeExpense = createTestExpense()
        val deletedExpense = createTestExpense()
        deletedExpense.markDeleted(defaultUserId)
        expenseRepository.delete(deletedExpense)
        entityManager.flush()

        // When
        val deletedResults = expenseRepository.findDeletedByTenantId(
            tenantId = defaultTenantId,
            pageable = PageRequest.of(0, 10)
        )

        // Then
        assertThat(deletedResults.content).hasSize(1)
        assertThat(deletedResults.content[0].id).isEqualTo(deletedExpense.id)
        assertThat(deletedResults.content[0].isDeleted()).isTrue()
    }

    // ========== Helper Methods ==========

    private fun createTestExpense(
        date: LocalDate = LocalDate.now(),
        category: String = "Test Category",
        description: String = "Test Expense ${UUID.randomUUID()}",
        incomeAmount: BigDecimal = BigDecimal.ZERO,
        expenseAmount: BigDecimal = BigDecimal("100.00"),
        balance: BigDecimal = BigDecimal("-100.00"),
        caseId: UUID? = null
    ): Expense {
        val expense = Expense(
            tenantId = defaultTenantId,
            date = date,
            category = category,
            description = description,
            incomeAmount = incomeAmount,
            expenseAmount = expenseAmount,
            balance = balance,
            caseId = caseId,
            auditInfo = AuditInfo(
                createdBy = defaultUserId,
                updatedBy = defaultUserId
            )
        )
        return expenseRepository.save(expense)
    }

    private fun createTestTag(name: String): Tag {
        val tag = Tag(
            tenantId = defaultTenantId,
            name = name,
            nameNormalized = name.lowercase(),
            color = "#FF0000",
            scope = TagScope.TENANT,
            auditInfo = AuditInfo(
                createdBy = defaultUserId,
                updatedBy = defaultUserId
            )
        )
        return tagRepository.save(tag)
    }
}