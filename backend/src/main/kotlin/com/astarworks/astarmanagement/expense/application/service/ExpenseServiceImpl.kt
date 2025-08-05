package com.astarworks.astarmanagement.expense.application.service

import com.astarworks.astarmanagement.expense.application.mapper.ExpenseMapper
import com.astarworks.astarmanagement.expense.domain.model.AuditInfo
import com.astarworks.astarmanagement.expense.domain.model.Expense
import com.astarworks.astarmanagement.expense.domain.model.ExpenseNotFoundException
import com.astarworks.astarmanagement.expense.domain.repository.ExpenseRepository
import com.astarworks.astarmanagement.expense.domain.repository.TagRepository
import com.astarworks.astarmanagement.expense.presentation.request.CreateExpenseRequest
import com.astarworks.astarmanagement.expense.presentation.request.UpdateExpenseRequest
import com.astarworks.astarmanagement.expense.presentation.response.ExpenseResponse
import com.astarworks.astarmanagement.expense.presentation.response.PagedResponse
import com.astarworks.astarmanagement.infrastructure.security.SecurityContextService
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Implementation of ExpenseService with business logic and transaction management.
 * 
 * This service handles all expense-related business operations including:
 * - CRUD operations with proper security
 * - Business rule validation
 * - Transaction boundary management
 * - Audit trail maintenance
 */
@Service
class ExpenseServiceImpl(
    private val expenseRepository: ExpenseRepository,
    private val tagRepository: TagRepository,
    private val expenseMapper: ExpenseMapper,
    private val securityContextService: SecurityContextService
) : ExpenseService {
    
    @Transactional(readOnly = true)
    override fun findById(id: UUID): ExpenseResponse? {
        val tenantId = securityContextService.requireCurrentTenantId()
        val expense = expenseRepository.findByIdAndTenantId(id, tenantId)
        return expense?.let { expenseMapper.toResponse(it) }
    }
    
    @Transactional
    override fun create(request: CreateExpenseRequest): ExpenseResponse {
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        // Validate and load tags if provided
        val tags = if (request.tagIds.isNotEmpty()) {
            request.tagIds.mapNotNull { tagId ->
                tagRepository.findByIdAndTenantId(tagId, tenantId)
            }.toMutableSet()
        } else {
            mutableSetOf()
        }
        
        // Create expense entity with business logic
        val expense = Expense(
            tenantId = tenantId,
            date = request.date,
            category = request.category,
            description = request.description,
            incomeAmount = request.incomeAmount ?: BigDecimal.ZERO,
            expenseAmount = request.expenseAmount ?: BigDecimal.ZERO,
            caseId = request.caseId,
            memo = request.memo,
            auditInfo = AuditInfo(
                createdBy = userId,
                updatedBy = userId
            )
        )
        
        // Apply tags and calculate derived fields
        expense.tags.addAll(tags)
        
        // Update tag usage statistics
        tags.forEach { tag ->
            tag.incrementUsage()
            tagRepository.save(tag)
        }
        
        // Save expense
        val savedExpense = expenseRepository.save(expense)
        
        return expenseMapper.toResponse(savedExpense)
    }
    
    @Transactional
    override fun update(id: UUID, request: UpdateExpenseRequest): ExpenseResponse {
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        // Find existing expense with security check
        val existingExpense = expenseRepository.findByIdAndTenantId(id, tenantId)
            ?: throw ExpenseNotFoundException(id)
        
        // Load new tags if provided
        val newTags = if (!request.tagIds.isNullOrEmpty()) {
            request.tagIds.mapNotNull { tagId ->
                tagRepository.findByIdAndTenantId(tagId, tenantId)
            }.toMutableSet()
        } else {
            mutableSetOf()
        }
        
        // Create updated expense (immutable approach)
        val updatedExpense = Expense(
            id = existingExpense.id,
            tenantId = tenantId,
            date = request.date ?: existingExpense.date,
            category = request.category ?: existingExpense.category,
            description = request.description ?: existingExpense.description,
            incomeAmount = request.incomeAmount ?: existingExpense.incomeAmount,
            expenseAmount = request.expenseAmount ?: existingExpense.expenseAmount,
            balance = existingExpense.balance, // Will be recalculated
            caseId = request.caseId ?: existingExpense.caseId,
            memo = request.memo ?: existingExpense.memo,
            version = existingExpense.version,
            auditInfo = existingExpense.auditInfo.copy(
                updatedBy = userId
            )
        )
        
        // Update tags and usage statistics
        updatedExpense.tags.clear()
        updatedExpense.tags.addAll(newTags)
        
        newTags.forEach { tag ->
            tag.incrementUsage()
            tagRepository.save(tag)
        }
        
        // Save updated expense
        val savedExpense = expenseRepository.save(updatedExpense)
        
        return expenseMapper.toResponse(savedExpense)
    }
    
    @Transactional
    override fun delete(id: UUID) {
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        // Find expense with security check
        val expense = expenseRepository.findByIdAndTenantId(id, tenantId)
            ?: throw ExpenseNotFoundException(id)
        
        // Perform soft delete with business logic
        expense.auditInfo.markDeleted(userId)
        
        // Save the soft-deleted expense
        expenseRepository.save(expense)
    }
    
    @Transactional(readOnly = true)
    override fun findByFilters(
        startDate: LocalDate?,
        endDate: LocalDate?,
        caseId: UUID?,
        category: String?,
        tagIds: List<UUID>?,
        pageable: Pageable
    ): PagedResponse<ExpenseResponse> {
        val tenantId = securityContextService.requireCurrentTenantId()
        
        val expensePage = expenseRepository.findByFilters(
            tenantId = tenantId,
            startDate = startDate,
            endDate = endDate,
            caseId = caseId,
            category = category,
            tagIds = tagIds,
            pageable = pageable
        )
        
        val expenseResponses = expenseMapper.toResponseList(expensePage.content)
        
        return PagedResponse(
            data = expenseResponses,
            offset = expensePage.number * expensePage.size,
            limit = expensePage.size,
            total = expensePage.totalElements,
            hasNext = expensePage.hasNext(),
            hasPrevious = expensePage.hasPrevious()
        )
    }
    
    @Transactional
    override fun createBulk(requests: List<CreateExpenseRequest>): List<ExpenseResponse> {
        if (requests.isEmpty()) {
            return emptyList()
        }
        
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        // Process all requests in a single transaction
        val createdExpenses = requests.map { request ->
            // Validate and load tags
            val tags = if (request.tagIds.isNotEmpty()) {
                request.tagIds.mapNotNull { tagId ->
                    tagRepository.findByIdAndTenantId(tagId, tenantId)
                }.toMutableSet()
            } else {
                mutableSetOf()
            }
            
            // Create expense
            val expense = Expense(
                tenantId = tenantId,
                date = request.date,
                category = request.category,
                description = request.description,
                incomeAmount = request.incomeAmount ?: BigDecimal.ZERO,
                expenseAmount = request.expenseAmount ?: BigDecimal.ZERO,
                caseId = request.caseId,
                memo = request.memo,
                auditInfo = AuditInfo(
                    createdBy = userId,
                    updatedBy = userId
                )
            )
            
            expense.tags.addAll(tags)
            
            // Update tag usage
            tags.forEach { tag ->
                tag.incrementUsage()
                tagRepository.save(tag)
            }
            
            expenseRepository.save(expense)
        }
        
        return expenseMapper.toResponseList(createdExpenses)
    }
    
    @Transactional
    override fun restore(id: UUID): ExpenseResponse {
        val tenantId = securityContextService.requireCurrentTenantId()
        val userId = securityContextService.requireCurrentUserId()
        
        // Find soft-deleted expense
        val expense = expenseRepository.findByIdIncludingDeleted(id, tenantId)
            ?: throw ExpenseNotFoundException(id)
        
        // Check if expense is actually deleted
        if (!expense.auditInfo.isDeleted()) {
            throw IllegalStateException("Expense is not deleted and cannot be restored")
        }
        
        // Restore the expense
        expense.auditInfo.restore(userId)
        
        // Save restored expense
        val restoredExpense = expenseRepository.save(expense)
        
        return expenseMapper.toResponse(restoredExpense)
    }
    
    @Transactional(readOnly = true)
    override fun getSummary(period: String, groupBy: String?): ExpenseSummaryResponse {
        val tenantId = securityContextService.requireCurrentTenantId()
        
        // This is a stub implementation - would need actual aggregation logic
        // based on the period and groupBy parameters
        return ExpenseSummaryResponse(
            period = period,
            totalIncome = "0.00",
            totalExpense = "0.00", 
            netAmount = "0.00",
            groupedData = emptyMap()
        )
    }
}