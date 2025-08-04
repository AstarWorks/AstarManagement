package com.astarworks.astarmanagement.expense.domain.model

import com.astarworks.astarmanagement.expense.fixtures.ExpenseFixtures
import com.astarworks.astarmanagement.expense.fixtures.TagFixtures
import org.assertj.core.api.Assertions.assertThat
import org.assertj.core.api.Assertions.assertThatThrownBy
import org.junit.jupiter.api.Test
import java.math.BigDecimal

/**
 * Unit tests for Expense domain model
 */
class ExpenseTest {
    
    @Test
    fun `should calculate net amount correctly for expense`() {
        // Given
        val expense = ExpenseFixtures.expense(
            incomeAmount = BigDecimal.ZERO,
            expenseAmount = BigDecimal("1000")
        )
        
        // When
        val netAmount = expense.calculateNetAmount()
        
        // Then
        assertThat(netAmount).isEqualByComparingTo(BigDecimal("-1000"))
    }
    
    @Test
    fun `should calculate net amount correctly for income`() {
        // Given
        val expense = ExpenseFixtures.expense(
            incomeAmount = BigDecimal("5000"),
            expenseAmount = BigDecimal.ZERO
        )
        
        // When
        val netAmount = expense.calculateNetAmount()
        
        // Then
        assertThat(netAmount).isEqualByComparingTo(BigDecimal("5000"))
    }
    
    @Test
    fun `should identify expense type correctly`() {
        // Given
        val expense = ExpenseFixtures.expense(
            expenseAmount = BigDecimal("1000")
        )
        
        // Then
        assertThat(expense.isExpense()).isTrue()
        assertThat(expense.isIncome()).isFalse()
    }
    
    @Test
    fun `should identify income type correctly`() {
        // Given
        val income = ExpenseFixtures.expense(
            incomeAmount = BigDecimal("5000"),
            expenseAmount = BigDecimal.ZERO
        )
        
        // Then
        assertThat(income.isIncome()).isTrue()
        assertThat(income.isExpense()).isFalse()
    }
    
    @Test
    fun `should add tag and increment usage count`() {
        // Given
        val expense = ExpenseFixtures.expense()
        val tag = TagFixtures.tag(usageCount = 5)
        
        // When
        expense.addTag(tag)
        
        // Then
        assertThat(expense.tags).contains(tag)
        assertThat(tag.usageCount).isEqualTo(6)
    }
    
    @Test
    fun `should remove tag from expense`() {
        // Given
        val tag = TagFixtures.tag()
        val expense = ExpenseFixtures.expense(tags = setOf(tag))
        
        // When
        expense.removeTag(tag)
        
        // Then
        assertThat(expense.tags).doesNotContain(tag)
    }
    
    @Test
    fun `should not allow negative income amount`() {
        // When/Then
        assertThatThrownBy {
            ExpenseFixtures.expense(incomeAmount = BigDecimal("-100"))
        }.isInstanceOf(IllegalArgumentException::class.java)
         .hasMessage("Income amount cannot be negative")
    }
    
    @Test
    fun `should not allow negative expense amount`() {
        // When/Then
        assertThatThrownBy {
            ExpenseFixtures.expense(expenseAmount = BigDecimal("-100"))
        }.isInstanceOf(IllegalArgumentException::class.java)
         .hasMessage("Expense amount cannot be negative")
    }
    
    @Test
    fun `should not allow both income and expense amounts`() {
        // When/Then
        assertThatThrownBy {
            ExpenseFixtures.expense(
                incomeAmount = BigDecimal("1000"),
                expenseAmount = BigDecimal("500")
            )
        }.isInstanceOf(IllegalArgumentException::class.java)
         .hasMessage("Cannot have both income and expense amounts")
    }
    
    @Test
    fun `should not allow blank category`() {
        // When/Then
        assertThatThrownBy {
            ExpenseFixtures.expense(category = "")
        }.isInstanceOf(IllegalArgumentException::class.java)
         .hasMessage("Category cannot be blank")
    }
    
    @Test
    fun `should not allow blank description`() {
        // When/Then
        assertThatThrownBy {
            ExpenseFixtures.expense(description = "")
        }.isInstanceOf(IllegalArgumentException::class.java)
         .hasMessage("Description cannot be blank")
    }
}