package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.expense.domain.model.Expense
import com.astarworks.astarmanagement.expense.domain.repository.ExpenseRepository
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Component
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Implementation of ExpenseRepository using Spring Data JPA.
 * 
 * This class bridges the domain repository interface with the JPA repository,
 * handling the translation between domain operations and persistence operations.
 */
@Component
class ExpenseRepositoryImpl(
    private val jpaExpenseRepository: JpaExpenseRepository
) : ExpenseRepository {
    
    override fun save(expense: Expense): Expense {
        return jpaExpenseRepository.save(expense)
    }
    
    override fun findById(id: UUID): Expense? {
        return jpaExpenseRepository.findById(id)
            .filter { it.auditInfo.deletedAt == null }
            .orElse(null)
    }
    
    override fun findByIdAndTenantId(id: UUID, tenantId: UUID): Expense? {
        return jpaExpenseRepository.findByIdAndTenantId(id, tenantId)
    }
    
    override fun findByTenantId(tenantId: UUID, pageable: Pageable): Page<Expense> {
        return jpaExpenseRepository.findByTenantId(tenantId, pageable)
    }
    
    override fun findByFilters(
        tenantId: UUID,
        startDate: LocalDate?,
        endDate: LocalDate?,
        caseId: UUID?,
        category: String?,
        tagIds: List<UUID>?,
        pageable: Pageable
    ): Page<Expense> {
        // If tagIds are provided, we need to combine results
        return if (!tagIds.isNullOrEmpty()) {
            // First get expenses by tags
            val taggedExpenses = jpaExpenseRepository.findByTagIds(tenantId, tagIds, pageable)
            
            // Then apply other filters if needed
            if (startDate != null || endDate != null || caseId != null || category != null) {
                val filteredContent = taggedExpenses.content.filter { expense ->
                    (startDate == null || expense.date >= startDate) &&
                    (endDate == null || expense.date <= endDate) &&
                    (caseId == null || expense.caseId == caseId) &&
                    (category == null || expense.category == category)
                }
                PageImpl(filteredContent, pageable, filteredContent.size.toLong())
            } else {
                taggedExpenses
            }
        } else {
            // No tag filter, use regular filter query
            jpaExpenseRepository.findByFilters(
                tenantId = tenantId,
                startDate = startDate,
                endDate = endDate,
                caseId = caseId,
                category = category,
                pageable = pageable
            )
        }
    }
    
    override fun delete(expense: Expense) {
        // Soft delete is handled by marking deleted in the audit info
        // Note: In a real implementation, userId would come from security context
        val userId = UUID.randomUUID() // TODO: Get from security context
        expense.auditInfo.markDeleted(userId)
        jpaExpenseRepository.save(expense)
    }
    
    override fun findPreviousBalance(
        tenantId: UUID,
        date: LocalDate,
        excludeId: UUID
    ): BigDecimal? {
        return jpaExpenseRepository.calculatePreviousBalance(tenantId, date, excludeId)
    }
}