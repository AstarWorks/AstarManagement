package com.astarworks.astarmanagement.modules.financial.expense.application.service

import com.astarworks.astarmanagement.modules.financial.expense.presentation.request.CreateExpenseRequest
import com.astarworks.astarmanagement.modules.financial.expense.presentation.request.UpdateExpenseRequest
import com.astarworks.astarmanagement.modules.financial.expense.presentation.response.ExpenseResponse
import com.astarworks.astarmanagement.modules.financial.expense.presentation.response.PagedResponse
import org.springframework.data.domain.Pageable
import org.springframework.transaction.annotation.Transactional
import java.time.LocalDate
import java.util.UUID

/**
 * Service interface for expense management operations.
 * 
 * This service layer coordinates between presentation and domain layers,
 * implementing business rules and transaction boundaries for expense operations.
 * 
 * Key responsibilities:
 * - Business logic orchestration
 * - Transaction management
 * - Security enforcement
 * - Data validation
 */
interface ExpenseService {
    
    /**
     * Retrieves an expense by its ID.
     * 
     * @param id The expense ID
     * @return The expense response or null if not found
     */
    @Transactional(readOnly = true)
    fun findById(id: UUID): ExpenseResponse?
    
    /**
     * Creates a new expense entry.
     * 
     * Validates input data, applies business rules, manages tag associations,
     * and ensures proper audit trail creation.
     * 
     * @param request The expense creation request
     * @return The created expense response
     */
    @Transactional
    fun create(request: CreateExpenseRequest): ExpenseResponse
    
    /**
     * Updates an existing expense.
     * 
     * Validates permissions, applies business rules, updates tag associations,
     * and maintains audit trail.
     * 
     * @param id The expense ID to update
     * @param request The update request
     * @return The updated expense response
     */
    @Transactional
    fun update(id: UUID, request: UpdateExpenseRequest): ExpenseResponse
    
    /**
     * Soft deletes an expense.
     * 
     * Performs security checks, handles cascade deletion rules,
     * and maintains referential integrity.
     * 
     * @param id The expense ID to delete
     */
    @Transactional
    fun delete(id: UUID)
    
    /**
     * Restores a soft-deleted expense.
     * 
     * Validates permissions, checks if expense exists and is deleted,
     * and restores the expense for the current user's tenant.
     * 
     * @param id The expense ID to restore
     * @return The restored expense response
     */
    @Transactional
    fun restore(id: UUID): ExpenseResponse
    
    /**
     * Finds expenses with optional filters and pagination.
     * 
     * Applies tenant isolation, security filters, and business rules
     * for data access control.
     * 
     * @param startDate Optional start date filter
     * @param endDate Optional end date filter
     * @param caseId Optional case ID filter
     * @param category Optional category filter
     * @param tagIds Optional tag IDs filter
     * @param pageable Pagination parameters
     * @return Paged response of expenses
     */
    @Transactional(readOnly = true)
    fun findByFilters(
        startDate: LocalDate?,
        endDate: LocalDate?,
        caseId: UUID?,
        category: String?,
        tagIds: List<UUID>?,
        pageable: Pageable
    ): PagedResponse<ExpenseResponse>
    
    /**
     * Creates multiple expenses in a single transaction.
     * 
     * Ensures atomicity, validates all entries, and applies
     * business rules consistently across all items.
     * 
     * @param requests List of expense creation requests
     * @return List of created expense responses
     */
    @Transactional
    fun createBulk(requests: List<CreateExpenseRequest>): List<ExpenseResponse>
    
    /**
     * Gets expense summary with aggregations.
     * 
     * Calculates financial summaries based on specified period
     * and grouping criteria with proper security filtering.
     * 
     * @param period Summary period (e.g., "monthly", "yearly")
     * @param groupBy Optional grouping parameter
     * @return Expense summary data
     */
    @Transactional(readOnly = true)
    fun getSummary(period: String, groupBy: String?): ExpenseSummaryResponse
}

/**
 * Data transfer object for expense summary aggregations.
 */
data class ExpenseSummaryResponse(
    val period: String,
    val totalIncome: String,
    val totalExpense: String,
    val netAmount: String,
    val groupedData: Map<String, Any>
)