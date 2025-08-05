package com.astarworks.astarmanagement.expense.domain.repository

import com.astarworks.astarmanagement.expense.domain.model.Expense
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Repository interface for managing Expense entities following DDD patterns.
 * 
 * All methods include tenant isolation to ensure data segregation.
 * This is a domain interface that should be implemented by infrastructure layer.
 */
interface ExpenseRepository {
    
    /**
     * Saves an expense entity.
     * 
     * @param expense The expense to save
     * @return The saved expense
     */
    fun save(expense: Expense): Expense
    
    /**
     * Finds an expense by its ID.
     * 
     * @param id The expense ID
     * @return The expense if found, null otherwise
     */
    fun findById(id: UUID): Expense?
    
    /**
     * Finds an expense by ID with tenant isolation.
     * 
     * @param id The expense ID
     * @param tenantId The tenant ID for isolation
     * @return The expense if found and belongs to tenant, null otherwise
     */
    fun findByIdAndTenantId(id: UUID, tenantId: UUID): Expense?
    
    /**
     * Finds all expenses for a tenant with pagination.
     * 
     * @param tenantId The tenant ID
     * @param pageable Pagination parameters
     * @return Page of expenses
     */
    fun findByTenantId(
        tenantId: UUID,
        pageable: Pageable
    ): Page<Expense>
    
    /**
     * Finds expenses by multiple filter criteria.
     * 
     * @param tenantId The tenant ID for isolation
     * @param startDate Optional start date filter
     * @param endDate Optional end date filter
     * @param caseId Optional case ID filter
     * @param category Optional category filter
     * @param tagIds Optional list of tag IDs filter
     * @param pageable Pagination parameters
     * @return Page of filtered expenses
     */
    fun findByFilters(
        tenantId: UUID,
        startDate: LocalDate?,
        endDate: LocalDate?,
        caseId: UUID?,
        category: String?,
        tagIds: List<UUID>?,
        pageable: Pageable
    ): Page<Expense>
    
    /**
     * Deletes an expense (soft delete).
     * 
     * @param expense The expense to delete
     */
    fun delete(expense: Expense)
    
    /**
     * Finds the previous balance before a given date for a tenant.
     * Used for calculating running balances.
     * 
     * @param tenantId The tenant ID
     * @param date The date to find balance before
     * @param excludeId Optional expense ID to exclude from calculation
     * @return The balance amount or null if no previous expenses
     */
    fun findPreviousBalance(
        tenantId: UUID,
        date: LocalDate,
        excludeId: UUID
    ): BigDecimal?
    
    /**
     * Finds an expense by ID including soft-deleted records.
     * Used for restore operations.
     * 
     * @param id The expense ID
     * @param tenantId The tenant ID for isolation
     * @return The expense if found, null otherwise
     */
    fun findByIdIncludingDeleted(id: UUID, tenantId: UUID): Expense?
    
    /**
     * Finds all soft-deleted expenses for a tenant.
     * 
     * @param tenantId The tenant ID
     * @param pageable Pagination parameters
     * @return Page of deleted expenses
     */
    fun findDeletedByTenantId(
        tenantId: UUID,
        pageable: Pageable
    ): Page<Expense>
}