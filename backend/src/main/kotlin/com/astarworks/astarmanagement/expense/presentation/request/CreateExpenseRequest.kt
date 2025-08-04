package com.astarworks.astarmanagement.expense.presentation.request

import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Request DTO for creating a new expense entry.
 * Includes validation for all required fields and business rules.
 */
data class CreateExpenseRequest(
    @field:NotNull(message = "Date is required")
    @field:PastOrPresent(message = "Date cannot be in the future")
    val date: LocalDate,
    
    @field:NotBlank(message = "Category is required")
    @field:Size(max = 50, message = "Category cannot exceed 50 characters")
    val category: String,
    
    @field:NotBlank(message = "Description is required")
    @field:Size(max = 200, message = "Description cannot exceed 200 characters")
    val description: String,
    
    @field:DecimalMin(value = "0.00", message = "Income amount cannot be negative")
    @field:Digits(integer = 10, fraction = 2, message = "Income amount must have at most 10 integer digits and 2 decimal places")
    val incomeAmount: BigDecimal? = BigDecimal.ZERO,
    
    @field:DecimalMin(value = "0.00", message = "Expense amount cannot be negative")
    @field:Digits(integer = 10, fraction = 2, message = "Expense amount must have at most 10 integer digits and 2 decimal places")
    val expenseAmount: BigDecimal? = BigDecimal.ZERO,
    
    val caseId: UUID? = null,
    
    @field:Size(max = 500, message = "Memo cannot exceed 500 characters")
    val memo: String? = null,
    
    val tagIds: List<UUID> = emptyList(),
    
    val attachmentIds: List<UUID> = emptyList()
) {
    /**
     * Custom validation to ensure either income or expense amount is provided, but not both.
     */
    @AssertTrue(message = "Must provide either income or expense amount, but not both")
    fun isAmountValid(): Boolean {
        val hasIncome = incomeAmount != null && incomeAmount > BigDecimal.ZERO
        val hasExpense = expenseAmount != null && expenseAmount > BigDecimal.ZERO
        
        // Either income or expense, but not both
        return (hasIncome && !hasExpense) || (!hasIncome && hasExpense) || (!hasIncome && !hasExpense)
    }
    
    /**
     * Custom validation to ensure at least one amount is provided.
     */
    @AssertTrue(message = "Must provide either income or expense amount")
    fun hasAmount(): Boolean {
        val hasIncome = incomeAmount != null && incomeAmount > BigDecimal.ZERO
        val hasExpense = expenseAmount != null && expenseAmount > BigDecimal.ZERO
        return hasIncome || hasExpense
    }
    
    /**
     * Custom validation to ensure date is within past 1 year.
     */
    @AssertTrue(message = "Date must be within the past 1 year")
    fun isDateWithinOneYear(): Boolean {
        val oneYearAgo = LocalDate.now().minusYears(1)
        return date.isAfter(oneYearAgo) || date.isEqual(oneYearAgo)
    }
}