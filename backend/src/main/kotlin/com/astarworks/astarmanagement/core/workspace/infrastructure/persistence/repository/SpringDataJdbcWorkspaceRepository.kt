package com.astarworks.astarmanagement.core.workspace.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.workspace.infrastructure.persistence.entity.SpringDataJdbcWorkspaceTable
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TeamId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import org.springframework.data.jdbc.repository.query.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

/**
 * Spring Data JDBC repository interface for workspace operations.
 * Provides automatic CRUD operations with custom query methods.
 */
@Repository
interface SpringDataJdbcWorkspaceRepository : CrudRepository<SpringDataJdbcWorkspaceTable, WorkspaceId> {
    
    /**
     * Finds all workspaces ordered by creation date.
     */
    @Query("SELECT * FROM workspaces ORDER BY created_at")
    override fun findAll(): List<SpringDataJdbcWorkspaceTable>
    
    /**
     * Finds a workspace by ID and tenant ID for tenant isolation.
     */
    @Query("SELECT * FROM workspaces WHERE id = :id AND tenant_id = :tenantId")
    fun findByIdAndTenantId(
        @Param("id") id: WorkspaceId,
        @Param("tenantId") tenantId: TenantId
    ): SpringDataJdbcWorkspaceTable?
    
    /**
     * Finds workspaces by tenant ID ordered by creation date.
     */
    @Query("SELECT * FROM workspaces WHERE tenant_id = :tenantId ORDER BY created_at")
    fun findByTenantId(@Param("tenantId") tenantId: TenantId): List<SpringDataJdbcWorkspaceTable>
    
    /**
     * Finds workspaces by tenant ID and creator user ID.
     */
    @Query("SELECT * FROM workspaces WHERE tenant_id = :tenantId AND created_by = :createdBy ORDER BY created_at")
    fun findByTenantIdAndCreatedBy(
        @Param("tenantId") tenantId: TenantId,
        @Param("createdBy") createdBy: UserId
    ): List<SpringDataJdbcWorkspaceTable>
    
    /**
     * Finds workspaces by creator user ID.
     */
    @Query("SELECT * FROM workspaces WHERE created_by = :createdBy ORDER BY created_at")
    fun findByCreatedBy(@Param("createdBy") createdBy: UserId): List<SpringDataJdbcWorkspaceTable>
    
    /**
     * Finds workspaces by team ID.
     */
    @Query("SELECT * FROM workspaces WHERE team_id = :teamId ORDER BY created_at")
    fun findByTeamId(@Param("teamId") teamId: TeamId): List<SpringDataJdbcWorkspaceTable>
    
    /**
     * Finds workspaces by name pattern (case-insensitive).
     */
    @Query("SELECT * FROM workspaces WHERE LOWER(name) LIKE LOWER(CONCAT('%', :namePattern, '%')) ORDER BY created_at")
    fun findByNameContainingIgnoreCase(@Param("namePattern") namePattern: String): List<SpringDataJdbcWorkspaceTable>
    
    /**
     * Finds workspaces by tenant and name pattern (case-insensitive).
     */
    @Query("SELECT * FROM workspaces WHERE tenant_id = :tenantId AND LOWER(name) LIKE LOWER(CONCAT('%', :namePattern, '%')) ORDER BY created_at")
    fun findByTenantIdAndNameContainingIgnoreCase(
        @Param("tenantId") tenantId: TenantId,
        @Param("namePattern") namePattern: String
    ): List<SpringDataJdbcWorkspaceTable>
    
    /**
     * Finds workspaces without tenant (non-multi-tenant workspaces).
     */
    @Query("SELECT * FROM workspaces WHERE tenant_id IS NULL ORDER BY created_at")
    fun findByTenantIdIsNull(): List<SpringDataJdbcWorkspaceTable>
    
    /**
     * Finds workspaces with tenant (multi-tenant workspaces).
     */
    @Query("SELECT * FROM workspaces WHERE tenant_id IS NOT NULL ORDER BY created_at")
    fun findByTenantIdIsNotNull(): List<SpringDataJdbcWorkspaceTable>
    
    /**
     * Counts workspaces by tenant ID.
     */
    @Query("SELECT COUNT(*) FROM workspaces WHERE tenant_id = :tenantId")
    fun countByTenantId(@Param("tenantId") tenantId: TenantId): Long
    
    /**
     * Counts workspaces by creator user ID.
     */
    @Query("SELECT COUNT(*) FROM workspaces WHERE created_by = :createdBy")
    fun countByCreatedBy(@Param("createdBy") createdBy: UserId): Long
    
    /**
     * Deletes workspaces by tenant ID.
     */
    @Query("DELETE FROM workspaces WHERE tenant_id = :tenantId")
    fun deleteByTenantId(@Param("tenantId") tenantId: TenantId)
    
    /**
     * Checks if a workspace with given name exists within a tenant.
     */
    @Query("SELECT COUNT(*) > 0 FROM workspaces WHERE tenant_id = :tenantId AND LOWER(name) = LOWER(:name)")
    fun existsByTenantIdAndNameIgnoreCase(
        @Param("tenantId") tenantId: TenantId,
        @Param("name") name: String
    ): Boolean
}