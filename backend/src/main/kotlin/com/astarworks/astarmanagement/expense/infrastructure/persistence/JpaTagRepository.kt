package com.astarworks.astarmanagement.expense.infrastructure.persistence

import com.astarworks.astarmanagement.expense.domain.model.Tag
import com.astarworks.astarmanagement.expense.domain.model.TagScope
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.UUID

/**
 * Spring Data JPA repository for Tag entities.
 * 
 * This interface extends JpaRepository and provides custom query methods
 * for tag-specific operations with tenant isolation.
 */
@Repository
interface JpaTagRepository : JpaRepository<Tag, UUID> {
    
    /**
     * Finds a tag by ID with tenant isolation.
     */
    @Query("""
        SELECT t FROM Tag t 
        WHERE t.id = :id 
        AND t.tenantId = :tenantId 
        AND t.auditInfo.deletedAt IS NULL
    """)
    fun findByIdAndTenantId(
        @Param("id") id: UUID,
        @Param("tenantId") tenantId: UUID
    ): Tag?
    
    /**
     * Finds all tags for a tenant.
     */
    @Query("""
        SELECT t FROM Tag t 
        WHERE t.tenantId = :tenantId 
        AND t.auditInfo.deletedAt IS NULL
        ORDER BY t.name
    """)
    fun findByTenantId(
        @Param("tenantId") tenantId: UUID
    ): List<Tag>
    
    /**
     * Finds tags by tenant and scope.
     */
    @Query("""
        SELECT t FROM Tag t 
        WHERE t.tenantId = :tenantId 
        AND t.scope = :scope
        AND t.auditInfo.deletedAt IS NULL
        ORDER BY t.name
    """)
    fun findByTenantIdAndScope(
        @Param("tenantId") tenantId: UUID,
        @Param("scope") scope: TagScope
    ): List<Tag>
    
    /**
     * Finds a tag by its normalized name for duplicate checking.
     */
    @Query("""
        SELECT t FROM Tag t 
        WHERE t.tenantId = :tenantId 
        AND t.nameNormalized = :nameNormalized
        AND t.auditInfo.deletedAt IS NULL
    """)
    fun findByTenantIdAndNameNormalized(
        @Param("tenantId") tenantId: UUID,
        @Param("nameNormalized") nameNormalized: String
    ): Tag?
    
    /**
     * Finds the most frequently used tags for a tenant.
     * This query counts tag usage in expenses.
     */
    @Query("""
        SELECT t FROM Tag t
        WHERE t.tenantId = :tenantId
        AND t.auditInfo.deletedAt IS NULL
        ORDER BY t.usageCount DESC
    """)
    fun findMostUsedTags(
        @Param("tenantId") tenantId: UUID,
        pageable: org.springframework.data.domain.Pageable
    ): List<Tag>
    
    /**
     * Checks if a tag exists with the given name (case-insensitive).
     */
    @Query("""
        SELECT CASE WHEN COUNT(t) > 0 THEN true ELSE false END
        FROM Tag t
        WHERE t.tenantId = :tenantId
        AND LOWER(t.name) = LOWER(:name)
        AND t.auditInfo.deletedAt IS NULL
    """)
    fun existsByTenantIdAndNameIgnoreCase(
        @Param("tenantId") tenantId: UUID,
        @Param("name") name: String
    ): Boolean
    
    /**
     * Finds tags by name pattern (for autocomplete).
     */
    @Query("""
        SELECT t FROM Tag t
        WHERE t.tenantId = :tenantId
        AND LOWER(t.name) LIKE LOWER(CONCAT('%', :pattern, '%'))
        AND t.auditInfo.deletedAt IS NULL
        ORDER BY t.name
    """)
    fun findByNamePattern(
        @Param("tenantId") tenantId: UUID,
        @Param("pattern") pattern: String
    ): List<Tag>
}