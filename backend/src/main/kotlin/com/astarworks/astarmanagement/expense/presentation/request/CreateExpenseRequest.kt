package com.astarworks.astarmanagement.expense.presentation.request

import io.swagger.v3.oas.annotations.media.Schema
import jakarta.validation.constraints.*
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Request DTO for creating a new expense entry.
 * Includes validation for all required fields and business rules.
 */
@Schema(description = "Request to create a new expense entry")
data class CreateExpenseRequest(
    @Schema(
        description = "Date of the expense (must be within the past year)",
        example = "2024-01-15",
        required = true
    )
    @field:NotNull(message = "Date is required")
    @field:PastOrPresent(message = "Date cannot be in the future")
    val date: LocalDate,
    
    @Schema(
        description = "Expense category for classification",
        example = "Transportation",
        required = true,
        maxLength = 50
    )
    @field:NotBlank(message = "Category is required")
    @field:Size(max = 50, message = "Category cannot exceed 50 characters")
    val category: String,
    
    @Schema(
        description = "Detailed description of the expense",
        example = "Taxi fare to district court for client meeting",
        required = true,
        maxLength = 200
    )
    @field:NotBlank(message = "Description is required")
    @field:Size(max = 200, message = "Description cannot exceed 200 characters")
    val description: String,
    
    @Schema(
        description = "Income amount (for deposits/refunds). Use 0 if this is an expense.",
        example = "0.00",
        minimum = "0",
        format = "decimal"
    )
    @field:DecimalMin(value = "0.00", message = "Income amount cannot be negative")
    @field:Digits(integer = 10, fraction = 2, message = "Income amount must have at most 10 integer digits and 2 decimal places")
    val incomeAmount: BigDecimal? = BigDecimal.ZERO,
    
    @Schema(
        description = "Expense amount (for expenditures). Use 0 if this is an income.",
        example = "3000.00",
        minimum = "0",
        format = "decimal"
    )
    @field:DecimalMin(value = "0.00", message = "Expense amount cannot be negative")
    @field:Digits(integer = 10, fraction = 2, message = "Expense amount must have at most 10 integer digits and 2 decimal places")
    val expenseAmount: BigDecimal? = BigDecimal.ZERO,
    
    @Schema(
        description = "Optional case ID to associate this expense with a specific legal case",
        example = "case-456",
        format = "uuid"
    )
    val caseId: UUID? = null,
    
    @Schema(
        description = "Optional memo or additional notes about the expense",
        example = "Client meeting transportation - reimbursable",
        maxLength = 500
    )
    @field:Size(max = 500, message = "Memo cannot exceed 500 characters")
    val memo: String? = null,
    
    @Schema(
        description = "List of tag IDs to categorize this expense",
        example = "[\"456e7890-e89b-12d3-a456-426614174000\"]"
    )
    val tagIds: List<UUID> = emptyList(),
    
    @Schema(
        description = "List of attachment IDs for receipts or supporting documents",
        example = "[\"attachment-uuid-here\"]"
    )
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