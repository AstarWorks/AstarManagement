package com.astarworks.astarmanagement.modules.financial.expense.application.mapper

import com.astarworks.astarmanagement.modules.financial.expense.domain.model.Expense
import com.astarworks.astarmanagement.modules.financial.expense.presentation.response.ExpenseResponse
import org.springframework.stereotype.Component

/**
 * Mapper for converting between Expense domain models and DTOs.
 */
@Component
class ExpenseMapper(
    private val tagMapper: TagMapper,
    private val attachmentMapper: AttachmentMapper
) {
    /**
     * Converts an Expense domain model to ExpenseResponse DTO.
     * @param expense The domain model to convert
     * @return The response DTO
     */
    fun toResponse(expense: Expense): ExpenseResponse {
        return ExpenseResponse(
            id = expense.id,
            tenantId = expense.tenantId,
            date = expense.date,
            category = expense.category,
            description = expense.description,
            incomeAmount = expense.incomeAmount,
            expenseAmount = expense.expenseAmount,
            balance = expense.balance,
            netAmount = expense.calculateNetAmount(),
            caseId = expense.caseId,
            memo = expense.memo,
            tags = expense.tags.map { tagMapper.toResponse(it) },
            attachments = expense.attachments.map { attachmentMapper.toResponse(it.attachment) },
            createdAt = expense.auditInfo.createdAt,
            updatedAt = expense.auditInfo.updatedAt,
            createdBy = expense.auditInfo.createdBy,
            updatedBy = expense.auditInfo.updatedBy,
            version = expense.version
        )
    }
    
    /**
     * Converts a list of Expense domain models to response DTOs.
     * @param expenses The list of domain models
     * @return The list of response DTOs
     */
    fun toResponseList(expenses: List<Expense>): List<ExpenseResponse> {
        return expenses.map { toResponse(it) }
    }
}