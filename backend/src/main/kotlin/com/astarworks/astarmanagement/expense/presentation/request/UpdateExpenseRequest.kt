package com.astarworks.astarmanagement.expense.presentation.request

import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Request DTO for updating an existing expense entry.
 * All fields are optional to support partial updates.
 */
data class UpdateExpenseRequest(
    @field:PastOrPresent(message = "Date cannot be in the future")
    val date: LocalDate? = null,
    
    @field:Size(max = 50, message = "Category cannot exceed 50 characters")
    val category: String? = null,
    
    @field:Size(max = 200, message = "Description cannot exceed 200 characters")
    val description: String? = null,
    
    @field:DecimalMin(value = "0.00", message = "Income amount cannot be negative")
    @field:Digits(integer = 10, fraction = 2, message = "Income amount must have at most 10 integer digits and 2 decimal places")
    val incomeAmount: BigDecimal? = null,
    
    @field:DecimalMin(value = "0.00", message = "Expense amount cannot be negative")
    @field:Digits(integer = 10, fraction = 2, message = "Expense amount must have at most 10 integer digits and 2 decimal places")
    val expenseAmount: BigDecimal? = null,
    
    val caseId: UUID? = null,
    
    @field:Size(max = 500, message = "Memo cannot exceed 500 characters")
    val memo: String? = null,
    
    val tagIds: List<UUID>? = null,
    
    val attachmentIds: List<UUID>? = null,
    
    @field:NotNull(message = "Version is required for optimistic locking")
    @field:Min(value = 0, message = "Version cannot be negative")
    val version: Int
) {
    /**
     * Custom validation to ensure either income or expense amount is provided, but not both.
     */
    @AssertTrue(message = "Cannot have both income and expense amounts")
    fun isAmountValid(): Boolean {
        if (incomeAmount == null && expenseAmount == null) return true
        
        val hasIncome = incomeAmount != null && incomeAmount > BigDecimal.ZERO
        val hasExpense = expenseAmount != null && expenseAmount > BigDecimal.ZERO
        
        return !(hasIncome && hasExpense)
    }
}