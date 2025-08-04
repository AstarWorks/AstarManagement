package com.astarworks.astarmanagement.expense.presentation.response

import java.math.BigDecimal
import java.time.Instant
import java.time.LocalDate
import java.util.UUID

/**
 * Response DTO for expense data.
 * Includes all expense information with calculated fields.
 */
data class ExpenseResponse(
    val id: UUID,
    val tenantId: UUID,
    val date: LocalDate,
    val category: String,
    val description: String,
    val incomeAmount: BigDecimal,
    val expenseAmount: BigDecimal,
    val balance: BigDecimal,
    val netAmount: BigDecimal,
    val caseId: UUID?,
    val memo: String?,
    val tags: List<TagResponse>,
    val attachments: List<AttachmentResponse>,
    val createdAt: Instant,
    val updatedAt: Instant,
    val createdBy: UUID?,
    val updatedBy: UUID?,
    val version: Int
) {
    val isIncome: Boolean = incomeAmount > BigDecimal.ZERO
    val isExpense: Boolean = expenseAmount > BigDecimal.ZERO
}