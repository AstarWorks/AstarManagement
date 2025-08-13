package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.base.DatabaseIntegrationTestBase
import com.astarworks.astarmanagement.expense.domain.model.AuditInfo
import com.astarworks.astarmanagement.expense.domain.model.Expense
import com.astarworks.astarmanagement.expense.domain.repository.ExpenseRepository
import org.assertj.core.api.Assertions.*
import org.junit.jupiter.api.Test
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.data.domain.PageRequest
import org.springframework.test.context.ActiveProfiles
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.*

/**
 * Minimal database integration test to validate core T08 requirements:
 * - Testcontainers setup with real PostgreSQL
 * - RLS (Row Level Security) validation
 * - Basic CRUD operations with tenant isolation
 * 
 * This is a simplified version focusing on the essential test cases.
 */
@ActiveProfiles("test")
@Transactional
class DatabaseIntegrationTest : DatabaseIntegrationTestBase() {

    @Autowired
    private lateinit var expenseRepository: ExpenseRepository

    @Test
    fun `should connect to PostgreSQL via Testcontainers`() {
        // This test validates that Testcontainers is working
        assertThat(postgres.isRunning).isTrue()
        
        // Verify we can execute a simple query
        val result = queryRawSql<Array<Any>>("SELECT version()")
        assertThat(result).isNotEmpty()
        
        val version = (result[0] as Array<*>)[0] as String
        assertThat(version).contains("PostgreSQL 15")
    }

    @Test
    fun `should enforce RLS for tenant isolation`() {
        // Given - Two different tenants
        val tenant1Id = UUID.randomUUID()
        val tenant1UserId = UUID.randomUUID()
        val tenant1User = createTestUser(tenant1Id)
        
        val tenant2Id = UUID.randomUUID()
        val tenant2UserId = UUID.randomUUID()
        val tenant2User = createTestUser(tenant2Id)
        
        // Create expense for tenant1
        val expense1 = withTenantContext(tenant1Id, tenant1UserId, tenant1User) {
            val expense = Expense(
                tenantId = tenant1Id,
                date = LocalDate.now(),
                category = "Test",
                description = "Tenant1 Expense",
                incomeAmount = BigDecimal.ZERO,
                expenseAmount = BigDecimal("100.00"),
                caseId = null,
                memo = "Test",
                auditInfo = AuditInfo(
                    createdBy = tenant1UserId,
                    updatedBy = tenant1UserId
                )
            )
            expenseRepository.save(expense)
        }
        
        // Create expense for tenant2
        withTenantContext(tenant2Id, tenant2UserId, tenant2User) {
            val expense = Expense(
                tenantId = tenant2Id,
                date = LocalDate.now(),
                category = "Test",
                description = "Tenant2 Expense",
                incomeAmount = BigDecimal.ZERO,
                expenseAmount = BigDecimal("200.00"),
                caseId = null,
                memo = "Test",
                auditInfo = AuditInfo(
                    createdBy = tenant2UserId,
                    updatedBy = tenant2UserId
                )
            )
            expenseRepository.save(expense)
        }
        
        // When & Then - Tenant1 should only see their expense
        withTenantContext(tenant1Id, tenant1UserId, tenant1User) {
            val expenses = expenseRepository.findByTenantId(tenant1Id, PageRequest.of(0, 10))
            assertThat(expenses.content).hasSize(1)
            assertThat(expenses.content[0].description).isEqualTo("Tenant1 Expense")
            
            // Direct SQL should also be filtered by RLS
            val count = queryRawSql<Array<Any>>(
                "SELECT COUNT(*) FROM expenses WHERE deleted_at IS NULL"
            )
            assertThat((count[0] as Array<*>)[0] as Long).isEqualTo(1)
        }
        
        // Tenant2 should only see their expense
        withTenantContext(tenant2Id, tenant2UserId, tenant2User) {
            val expenses = expenseRepository.findByTenantId(tenant2Id, PageRequest.of(0, 10))
            assertThat(expenses.content).hasSize(1)
            assertThat(expenses.content[0].description).isEqualTo("Tenant2 Expense")
        }
    }

    @Test
    fun `should handle basic CRUD operations with tenant context`() {
        // Create
        val expense = Expense(
            tenantId = defaultTenantId,
            date = LocalDate.now(),
            category = "Office Supplies",
            description = "Test CRUD operations",
            incomeAmount = BigDecimal.ZERO,
            expenseAmount = BigDecimal("50.00"),
            caseId = null,
            memo = "CRUD test",
            auditInfo = AuditInfo(
                createdBy = defaultUserId,
                updatedBy = defaultUserId
            )
        )
        
        val savedExpense = expenseRepository.save(expense)
        assertThat(savedExpense.id).isNotNull()
        
        // Read
        val foundExpense = expenseRepository.findById(savedExpense.id!!)
        assertThat(foundExpense).isNotNull()
        assertThat(foundExpense?.description).isEqualTo("Test CRUD operations")
        
        // Update
        val updatedExpense = Expense(
            id = savedExpense.id,
            tenantId = savedExpense.tenantId,
            date = savedExpense.date,
            category = savedExpense.category,
            description = "Updated description",
            incomeAmount = savedExpense.incomeAmount,
            expenseAmount = savedExpense.expenseAmount,
            caseId = savedExpense.caseId,
            memo = savedExpense.memo,
            auditInfo = savedExpense.auditInfo
        )
        
        val saved = expenseRepository.save(updatedExpense)
        assertThat(saved.description).isEqualTo("Updated description")
        
        // Delete (soft delete)
        expenseRepository.delete(saved)
        
        // Verify soft delete
        val afterDelete = expenseRepository.findById(saved.id!!)
        assertThat(afterDelete).isNull()
    }

    @Test
    fun `should validate Flyway migrations include RLS policies`() {
        // Verify RLS functions exist
        val rlsFunctions = queryRawSql<Array<Any>>(
            "SELECT routine_name FROM information_schema.routines WHERE routine_name = 'current_tenant_id'"
        )
        assertThat(rlsFunctions).isNotEmpty()
        
        // Verify RLS policies exist on expenses table
        val policies = queryRawSql<Array<Any>>(
            "SELECT policyname FROM pg_policies WHERE tablename = 'expenses'"
        )
        assertThat(policies).isNotEmpty()
    }

    @Test
    fun `should measure query performance`() {
        // Create test data
        val expenses = (1..50).map { i ->
            Expense(
                tenantId = defaultTenantId,
                date = LocalDate.now().minusDays(i.toLong()),
                category = if (i % 2 == 0) "Category A" else "Category B",
                description = "Performance test expense $i",
                incomeAmount = BigDecimal.ZERO,
                expenseAmount = BigDecimal(i * 10),
                caseId = null,
                memo = "Performance test",
                auditInfo = AuditInfo(
                    createdBy = defaultUserId,
                    updatedBy = defaultUserId
                )
            )
        }.map { expenseRepository.save(it) }
        
        // Measure query performance
        val startTime = System.currentTimeMillis()
        val results = expenseRepository.findByFilters(
            tenantId = defaultTenantId,
            startDate = LocalDate.now().minusDays(30),
            endDate = LocalDate.now(),
            caseId = null,
            category = "Category A",
            tagIds = null,
            pageable = PageRequest.of(0, 20)
        )
        val queryTime = System.currentTimeMillis() - startTime
        
        // Verify performance
        assertThat(queryTime).isLessThan(100) // Should complete within 100ms
        assertThat(results.content).hasSize(15) // Half of 30 days
        
        println("Query performance: ${queryTime}ms for filtered query")
    }
}