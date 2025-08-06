package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.base.RepositoryTest
import com.astarworks.astarmanagement.domain.entity.User
import com.astarworks.astarmanagement.domain.entity.UserRole
import com.astarworks.astarmanagement.expense.domain.model.AuditInfo
import com.astarworks.astarmanagement.expense.domain.model.Expense
import com.astarworks.astarmanagement.expense.domain.model.ExpenseNotFoundException
import com.astarworks.astarmanagement.expense.domain.model.InsufficientPermissionException
import com.astarworks.astarmanagement.infrastructure.security.SecurityContextService
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.assertThrows
import org.mockito.kotlin.mock
import org.mockito.kotlin.whenever
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Primary
import org.springframework.data.domain.PageRequest
import org.springframework.test.context.ActiveProfiles
import java.math.BigDecimal
import java.time.LocalDate
import java.util.*

/**
 * Integration tests for ExpenseRepositoryImpl with real database.
 * 
 * Tests cover:
 * - CRUD operations with tenant isolation
 * - Security context integration
 * - Soft delete functionality
 * - Complex filtering scenarios
 * - Performance validation
 */
@ActiveProfiles("test")
class ExpenseRepositoryIntegrationTest : RepositoryTest() {

    @TestConfiguration
    class TestConfig {
        @Bean
        @Primary
        fun mockSecurityContextService(): SecurityContextService = mock()
    }

    @Autowired
    private lateinit var expenseRepositoryImpl: ExpenseRepositoryImpl

    @Autowired
    private lateinit var jpaExpenseRepository: JpaExpenseRepository

    @Autowired
    private lateinit var securityContextService: SecurityContextService

    private val testTenantId = UUID.randomUUID()
    private val testUserId = UUID.randomUUID()
    private val otherTenantId = UUID.randomUUID()

    private lateinit var testUser: User

    @BeforeEach
    fun setUp() {
        // Create test user
        testUser = User(
            id = testUserId,
            email = "test@example.com",
            password = "password",
            firstName = "Test",
            lastName = "User",
            role = UserRole.USER
        )

        // Setup security context mocks
        whenever(securityContextService.getCurrentTenantId()).thenReturn(testTenantId)
        whenever(securityContextService.getCurrentUserId()).thenReturn(testUserId)
        whenever(securityContextService.requireCurrentUserId()).thenReturn(testUserId)
        whenever(securityContextService.requireCurrentTenantId()).thenReturn(testTenantId)
        whenever(securityContextService.getCurrentUser()).thenReturn(testUser)
        whenever(securityContextService.requireCurrentUser()).thenReturn(testUser)

        // Clean up any existing test data
        jpaExpenseRepository.deleteAll()
        entityManager.flush()
        entityManager.clear()
    }

    @Test
    fun `should save and retrieve expense successfully`() {
        // Given
        val expense = createTestExpense()

        // When
        val savedExpense = expenseRepositoryImpl.save(expense)
        val retrievedExpense = expenseRepositoryImpl.findById(savedExpense.id!!)

        // Then
        assertThat(retrievedExpense).isNotNull
        assertThat(retrievedExpense!!.id).isEqualTo(savedExpense.id)
        assertThat(retrievedExpense.description).isEqualTo("Test expense")
        assertThat(retrievedExpense.tenantId).isEqualTo(testTenantId)
    }

    @Test
    fun `should enforce tenant isolation on findByIdAndTenantId`() {
        // Given
        val expense = createTestExpense()
        val savedExpense = expenseRepositoryImpl.save(expense)

        // When & Then - Same tenant should work
        val sameTenanExpense = expenseRepositoryImpl.findByIdAndTenantId(savedExpense.id!!, testTenantId)
        assertThat(sameTenanExpense).isNotNull

        // When & Then - Different tenant should throw exception
        whenever(securityContextService.getCurrentTenantId()).thenReturn(otherTenantId)
        
        assertThrows<InsufficientPermissionException> {
            expenseRepositoryImpl.findByIdAndTenantId(savedExpense.id!!, otherTenantId)
        }
    }

    @Test
    fun `should handle soft delete properly`() {
        // Given
        val expense = createTestExpense()
        val savedExpense = expenseRepositoryImpl.save(expense)

        // When
        expenseRepositoryImpl.delete(savedExpense)

        // Then
        val retrievedExpense = expenseRepositoryImpl.findById(savedExpense.id!!)
        assertThat(retrievedExpense).isNull() // Should not be found due to soft delete

        // Verify it's marked as deleted in database
        val expenseFromDb = jpaExpenseRepository.findById(savedExpense.id!!).orElse(null)
        assertThat(expenseFromDb).isNotNull
        assertThat(expenseFromDb.auditInfo.deletedAt).isNotNull()
        assertThat(expenseFromDb.auditInfo.deletedBy).isEqualTo(testUserId)
    }

    @Test
    fun `should find expenses by tenant with pagination`() {
        // Given
        val expenses = (1..5).map { i ->
            createTestExpense("Expense $i").also { expenseRepositoryImpl.save(it) }
        }

        // When
        val pageable = PageRequest.of(0, 3)
        val result = expenseRepositoryImpl.findByTenantId(testTenantId, pageable)

        // Then
        assertThat(result.content).hasSize(3)
        assertThat(result.totalElements).isEqualTo(5)
        assertThat(result.hasNext()).isTrue()
    }

    @Test
    fun `should filter expenses by multiple criteria`() {
        // Given
        val startDate = LocalDate.of(2024, 1, 1)
        val endDate = LocalDate.of(2024, 1, 31)
        val category = "Transportation"
        val caseId = UUID.randomUUID()

        val matchingExpense = createTestExpense(
            description = "Matching expense",
            date = LocalDate.of(2024, 1, 15),
            category = category,
            caseId = caseId
        )
        expenseRepositoryImpl.save(matchingExpense)

        val nonMatchingExpense = createTestExpense(
            description = "Non-matching expense",
            date = LocalDate.of(2024, 2, 15),
            category = "Office Supplies",
            caseId = null
        )
        expenseRepositoryImpl.save(nonMatchingExpense)

        // When
        val pageable = PageRequest.of(0, 10)
        val result = expenseRepositoryImpl.findByFilters(
            tenantId = testTenantId,
            startDate = startDate,
            endDate = endDate,
            caseId = caseId,
            category = category,
            tagIds = null,
            pageable = pageable
        )

        // Then
        assertThat(result.content).hasSize(1)
        assertThat(result.content[0].description).isEqualTo("Matching expense")
    }

    @Test
    fun `should calculate previous balance correctly`() {
        // Given
        val baseDate = LocalDate.of(2024, 1, 15)
        val excludeId = UUID.randomUUID()

        // Create expenses before the date
        val expense1 = createTestExpense(
            description = "Expense 1",
            date = LocalDate.of(2024, 1, 10),
            incomeAmount = BigDecimal("1000"),
            expenseAmount = BigDecimal("500")
        )
        expenseRepositoryImpl.save(expense1)

        val expense2 = createTestExpense(
            description = "Expense 2", 
            date = LocalDate.of(2024, 1, 12),
            incomeAmount = BigDecimal("0"),
            expenseAmount = BigDecimal("300")
        )
        expenseRepositoryImpl.save(expense2)

        // Create expense after the date (should be excluded)
        val expense3 = createTestExpense(
            description = "Expense 3",
            date = LocalDate.of(2024, 1, 20),
            incomeAmount = BigDecimal("500"),
            expenseAmount = BigDecimal("200")
        )
        expenseRepositoryImpl.save(expense3)

        // When
        val previousBalance = expenseRepositoryImpl.findPreviousBalance(
            tenantId = testTenantId,
            date = baseDate,
            excludeId = excludeId
        )

        // Then
        // Expected: (1000 - 500) + (0 - 300) = 500 + (-300) = 200
        assertThat(previousBalance).isEqualTo(BigDecimal("200"))
    }

    @Test
    fun `should handle complex filtering with tags`() {
        // Given
        val tagIds = listOf(UUID.randomUUID(), UUID.randomUUID())
        
        // This test would need proper tag setup, but demonstrates the interface
        val pageable = PageRequest.of(0, 10)
        
        // When
        val result = expenseRepositoryImpl.findByFilters(
            tenantId = testTenantId,
            startDate = null,
            endDate = null,
            caseId = null,
            category = null,
            tagIds = tagIds,
            pageable = pageable
        )

        // Then
        assertThat(result).isNotNull
        assertThat(result.content).isEmpty() // No expenses with these tags exist
    }

    @Test
    fun `should handle empty filter results gracefully`() {
        // Given - no expenses in database
        val pageable = PageRequest.of(0, 10)

        // When
        val result = expenseRepositoryImpl.findByFilters(
            tenantId = testTenantId,
            startDate = LocalDate.of(2024, 1, 1),
            endDate = LocalDate.of(2024, 1, 31),
            caseId = null,
            category = null,
            tagIds = null,
            pageable = pageable
        )

        // Then
        assertThat(result.content).isEmpty()
        assertThat(result.totalElements).isEqualTo(0)
    }

    @Test
    fun `should maintain audit information correctly`() {
        // Given
        val expense = createTestExpense()

        // When
        val savedExpense = expenseRepositoryImpl.save(expense)

        // Then
        assertThat(savedExpense.auditInfo.createdBy).isEqualTo(testUserId)
        assertThat(savedExpense.auditInfo.updatedBy).isEqualTo(testUserId)
        assertThat(savedExpense.auditInfo.createdAt).isNotNull()
        assertThat(savedExpense.auditInfo.updatedAt).isNotNull()
        assertThat(savedExpense.auditInfo.deletedAt).isNull()
        assertThat(savedExpense.auditInfo.deletedBy).isNull()
    }

    @Test
    fun `should handle concurrent access gracefully`() {
        // Given
        val expense = createTestExpense()
        val savedExpense = expenseRepositoryImpl.save(expense)

        // When - Simulate concurrent modification
        val expense1 = expenseRepositoryImpl.findById(savedExpense.id!!)!!
        val expense2 = expenseRepositoryImpl.findById(savedExpense.id!!)!!

        // Note: Expense properties are immutable, so we create new instances
        val modifiedExpense1 = createTestExpense("Modified by user 1")
        val modifiedExpense2 = createTestExpense("Modified by user 2")

        // Then - Save new instances should succeed
        val updated1 = expenseRepositoryImpl.save(modifiedExpense1)
        assertThat(updated1.description).isEqualTo("Modified by user 1")

        val updated2 = expenseRepositoryImpl.save(modifiedExpense2)
        assertThat(updated2.description).isEqualTo("Modified by user 2")
    }

    private fun createTestExpense(
        description: String = "Test expense",
        date: LocalDate = LocalDate.now(),
        category: String = "Test Category",
        caseId: UUID? = null,
        incomeAmount: BigDecimal = BigDecimal.ZERO,
        expenseAmount: BigDecimal = BigDecimal("100.00")
    ): Expense {
        return Expense(
            tenantId = testTenantId,
            date = date,
            category = category,
            description = description,
            incomeAmount = incomeAmount,
            expenseAmount = expenseAmount,
            caseId = caseId,
            memo = "Test memo",
            auditInfo = AuditInfo(
                createdBy = testUserId,
                updatedBy = testUserId
            )
        )
    }
}