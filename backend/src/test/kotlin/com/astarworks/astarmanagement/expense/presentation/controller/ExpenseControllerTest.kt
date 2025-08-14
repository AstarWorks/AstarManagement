package com.astarworks.astarmanagement.expense.presentation.controller

import com.astarworks.astarmanagement.expense.application.service.ExpenseService
import com.astarworks.astarmanagement.expense.fixtures.ExpenseFixtures
import com.astarworks.astarmanagement.expense.presentation.response.ExpenseResponse
import io.mockk.mockk
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.math.BigDecimal

/**
 * Unit tests for ExpenseController
 * Note: Currently testing stub implementation
 */
class ExpenseControllerTest {
    
    private lateinit var expenseController: ExpenseController
    private lateinit var expenseService: ExpenseService
    
    @BeforeEach
    fun setup() {
        expenseService = mockk()
        expenseController = ExpenseController(expenseService)
    }
    
    @Test
    fun `should return stub expense response when creating expense`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest()
        
        // When
        val result = expenseController.createExpense(request)
        
        // Then
        assertThat(result).isNotNull
        assertThat(result.category).isEqualTo("stub")
        assertThat(result.description).isEqualTo("Stub expense")
        assertThat(result.expenseAmount).isEqualByComparingTo(BigDecimal("100.00"))
        assertThat(result.balance).isEqualByComparingTo(BigDecimal("-100.00"))
    }
    
    @Test
    fun `should return empty paged response when listing expenses`() {
        // When
        val result = expenseController.listExpenses(
            page = 0,
            size = 10,
            startDate = null,
            endDate = null,
            caseId = null,
            category = null,
            tagIds = null,
            sort = "date,desc"
        )
        
        // Then
        assertThat(result).isNotNull
        assertThat(result.data).isEmpty()
        assertThat(result.offset).isEqualTo(0)
        assertThat(result.limit).isEqualTo(10)
        assertThat(result.total).isEqualTo(0L)
        assertThat(result.hasNext).isFalse()
        assertThat(result.hasPrevious).isFalse()
    }
}