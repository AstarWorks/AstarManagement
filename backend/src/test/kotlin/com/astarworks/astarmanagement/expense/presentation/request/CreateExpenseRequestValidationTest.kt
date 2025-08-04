package com.astarworks.astarmanagement.expense.presentation.request

import com.astarworks.astarmanagement.expense.fixtures.ExpenseFixtures
import jakarta.validation.Validation
import jakarta.validation.Validator
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.Test
import java.math.BigDecimal
import java.time.LocalDate

/**
 * Validation tests for CreateExpenseRequest
 */
class CreateExpenseRequestValidationTest {
    
    private lateinit var validator: Validator
    
    @BeforeEach
    fun setup() {
        validator = Validation.buildDefaultValidatorFactory().validator
    }
    
    @Test
    fun `should pass validation with valid data`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest()
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).isEmpty()
    }
    
    @Test
    fun `should fail validation with future date`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            date = LocalDate.now().plusDays(1)
        )
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).hasSize(1)
        assertThat(violations.first().propertyPath.toString()).isEqualTo("date")
        assertThat(violations.first().message).isEqualTo("Date cannot be in the future")
    }
    
    @Test
    fun `should fail validation with negative amounts`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            expenseAmount = BigDecimal("-100")
        )
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).isNotEmpty()
        assertThat(violations).anyMatch { it.propertyPath.toString() == "expenseAmount" }
    }
    
    @Test
    fun `should fail validation with blank category`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            category = ""
        )
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).isNotEmpty()
        assertThat(violations).anyMatch { 
            it.propertyPath.toString() == "category" && 
            it.message == "Category is required"
        }
    }
    
    @Test
    fun `should fail validation with blank description`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            description = ""
        )
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).isNotEmpty()
        assertThat(violations).anyMatch { 
            it.propertyPath.toString() == "description" && 
            it.message == "Description is required"
        }
    }
    
    @Test
    fun `should fail validation with both income and expense amounts`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            incomeAmount = BigDecimal("1000"),
            expenseAmount = BigDecimal("500")
        )
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).isNotEmpty()
        assertThat(violations).anyMatch { 
            it.message == "Must provide either income or expense amount, but not both"
        }
    }
    
    @Test
    fun `should fail validation with no amounts`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            incomeAmount = BigDecimal.ZERO,
            expenseAmount = BigDecimal.ZERO
        )
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).isNotEmpty()
        assertThat(violations).anyMatch { 
            it.message == "Must provide either income or expense amount"
        }
    }
    
    @Test
    fun `should fail validation with date older than one year`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            date = LocalDate.now().minusYears(1).minusDays(1)
        )
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).isNotEmpty()
        assertThat(violations).anyMatch { 
            it.message == "Date must be within the past 1 year"
        }
    }
    
    @Test
    fun `should fail validation with too long category`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            category = "A".repeat(51)
        )
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).isNotEmpty()
        assertThat(violations).anyMatch { 
            it.propertyPath.toString() == "category" && 
            it.message == "Category cannot exceed 50 characters"
        }
    }
    
    @Test
    fun `should fail validation with too long description`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            description = "A".repeat(201)
        )
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).isNotEmpty()
        assertThat(violations).anyMatch { 
            it.propertyPath.toString() == "description" && 
            it.message == "Description cannot exceed 200 characters"
        }
    }
    
    @Test
    fun `should fail validation with too long memo`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            memo = "A".repeat(501)
        )
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).isNotEmpty()
        assertThat(violations).anyMatch { 
            it.propertyPath.toString() == "memo" && 
            it.message == "Memo cannot exceed 500 characters"
        }
    }
    
    @Test
    fun `should fail validation with too many decimal places`() {
        // Given
        val request = ExpenseFixtures.createExpenseRequest(
            expenseAmount = BigDecimal("100.999")
        )
        
        // When
        val violations = validator.validate(request)
        
        // Then
        assertThat(violations).isNotEmpty()
        assertThat(violations).anyMatch { 
            it.propertyPath.toString() == "expenseAmount" && 
            it.message.contains("2 decimal places")
        }
    }
}