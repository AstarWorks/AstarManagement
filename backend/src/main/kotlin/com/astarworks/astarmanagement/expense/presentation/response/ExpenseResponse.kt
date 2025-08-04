package com.astarworks.astarmanagement.expense.presentation.response

import io.swagger.v3.oas.annotations.media.Schema
import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Response DTO for expense data.
 * Includes all expense information with calculated fields.
 */
@Schema(description = "Expense response with all details and calculated fields")
data class ExpenseResponse(
    @Schema(description = "Unique expense identifier", example = "123e4567-e89b-12d3-a456-426614174000")
    val id: UUID,
    
    @Schema(description = "Tenant identifier for multi-tenancy", example = "789e0123-e89b-12d3-a456-426614174000")
    val tenantId: UUID,
    
    @Schema(description = "Date of the expense", example = "2024-01-15")
    val date: LocalDate,
    
    @Schema(description = "Expense category", example = "Transportation")
    val category: String,
    
    @Schema(description = "Detailed description of the expense", example = "Taxi fare to district court")
    val description: String,
    
    @Schema(description = "Income amount (positive for income)", example = "0.00", format = "decimal")
    val incomeAmount: BigDecimal,
    
    @Schema(description = "Expense amount (positive for expenses)", example = "3000.00", format = "decimal")
    val expenseAmount: BigDecimal,
    
    @Schema(description = "Running balance after this transaction", example = "-3000.00", format = "decimal")
    val balance: BigDecimal,
    
    @Schema(description = "Net amount (positive for income, negative for expense)", example = "-3000.00", format = "decimal")
    val netAmount: BigDecimal,
    
    @Schema(description = "Associated case ID", example = "case-456", format = "uuid")
    val caseId: UUID?,
    
    @Schema(description = "Additional memo or notes", example = "Client meeting transportation")
    val memo: String?,
    
    @Schema(description = "Associated tags for categorization")
    val tags: List<TagResponse>,
    
    @Schema(description = "File attachments (receipts, documents)")
    val attachments: List<AttachmentResponse>,
    
    @Schema(description = "Creation timestamp", example = "2024-01-15T10:30:00Z")
    val createdAt: Instant,
    
    @Schema(description = "Last update timestamp", example = "2024-01-15T10:30:00Z")
    val updatedAt: Instant,
    
    @Schema(description = "User who created this expense", example = "user-123")
    val createdBy: UUID?,
    
    @Schema(description = "User who last updated this expense", example = "user-123")
    val updatedBy: UUID?,
    
    @Schema(description = "Version number for optimistic locking", example = "1")
    val version: Int
) {
    @Schema(description = "True if this is an income entry", example = "false")
    val isIncome: Boolean = incomeAmount > BigDecimal.ZERO
    
    @Schema(description = "True if this is an expense entry", example = "true")
    val isExpense: Boolean = expenseAmount > BigDecimal.ZERO
}