package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.expense.domain.model.Expense
import org.springframework.data.domain.Page
import org.springframework.data.domain.Pageable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.math.BigDecimal
import java.time.LocalDate
import java.util.UUID

/**
 * Spring Data JPA repository for Expense entities.
 * 
 * This interface extends JpaRepository and provides custom query methods
 * for expense-specific operations with tenant isolation.
 */
@Repository
interface JpaExpenseRepository : JpaRepository<Expense, UUID> {
    
    /**
     * Finds an expense by ID with tenant isolation.
     */
    @Query("""
        SELECT e FROM Expense e 
        WHERE e.id = :id 
        AND e.tenantId = :tenantId 
        AND e.deletedAt IS NULL
    """)
    fun findByIdAndTenantId(
        @Param("id") id: UUID,
        @Param("tenantId") tenantId: UUID
    ): Expense?
    
    /**
     * Finds all expenses for a tenant with pagination.
     */
    @Query("""
        SELECT e FROM Expense e 
        WHERE e.tenantId = :tenantId 
        AND e.deletedAt IS NULL
        ORDER BY e.date DESC, e.auditInfo.createdAt DESC
    """)
    fun findByTenantId(
        @Param("tenantId") tenantId: UUID,
        pageable: Pageable
    ): Page<Expense>
    
    /**
     * Finds expenses by multiple filter criteria.
     */
    @Query("""
        SELECT e FROM Expense e
        WHERE e.tenantId = :tenantId
        AND (:startDate IS NULL OR e.date >= :startDate)
        AND (:endDate IS NULL OR e.date <= :endDate)
        AND (:caseId IS NULL OR e.caseId = :caseId)
        AND (:category IS NULL OR e.category = :category)
        AND e.deletedAt IS NULL
        ORDER BY e.date DESC, e.auditInfo.createdAt DESC
    """)
    fun findByFilters(
        @Param("tenantId") tenantId: UUID,
        @Param("startDate") startDate: LocalDate?,
        @Param("endDate") endDate: LocalDate?,
        @Param("caseId") caseId: UUID?,
        @Param("category") category: String?,
        pageable: Pageable
    ): Page<Expense>
    
    /**
     * Finds expenses by tag IDs.
     * This is a more complex query that requires joining with tags.
     */
    @Query("""
        SELECT DISTINCT e FROM Expense e
        JOIN e.tags t
        WHERE e.tenantId = :tenantId
        AND t.id IN :tagIds
        AND e.deletedAt IS NULL
        ORDER BY e.date DESC, e.auditInfo.createdAt DESC
    """)
    fun findByTagIds(
        @Param("tenantId") tenantId: UUID,
        @Param("tagIds") tagIds: List<UUID>,
        pageable: Pageable
    ): Page<Expense>
    
    /**
     * Calculates the sum of amounts before a given date.
     * Used for running balance calculations.
     */
    @Query("""
        SELECT SUM(e.amount) FROM Expense e
        WHERE e.tenantId = :tenantId
        AND e.date < :date
        AND e.id != :excludeId
        AND e.deletedAt IS NULL
    """)
    fun calculatePreviousBalance(
        @Param("tenantId") tenantId: UUID,
        @Param("date") date: LocalDate,
        @Param("excludeId") excludeId: UUID
    ): BigDecimal?
    
    /**
     * Checks if an expense exists for a tenant.
     */
    fun existsByIdAndTenantId(id: UUID, tenantId: UUID): Boolean
}