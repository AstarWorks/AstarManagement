package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.SpringDataJdbcRoleTable
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import org.springframework.data.jdbc.repository.query.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

/**
 * Spring Data JDBC repository interface for role operations.
 * Manages Discord-style roles with tenant isolation.
 */
@Repository
interface SpringDataJdbcRoleRepository : CrudRepository<SpringDataJdbcRoleTable, RoleId> {
    
    /**
     * Finds all roles ordered by position.
     */
    @Query("SELECT * FROM roles ORDER BY position DESC, created_at")
    override fun findAll(): List<SpringDataJdbcRoleTable>
    
    /**
     * Finds roles by tenant ID ordered by position.
     */
    @Query("SELECT * FROM roles WHERE tenant_id = :tenantId ORDER BY position DESC, created_at")
    fun findByTenantId(@Param("tenantId") tenantId: TenantId): List<SpringDataJdbcRoleTable>
    
    /**
     * Finds system-wide roles (no tenant).
     */
    @Query("SELECT * FROM roles WHERE tenant_id IS NULL ORDER BY position DESC, created_at")
    fun findByTenantIdIsNull(): List<SpringDataJdbcRoleTable>
    
    /**
     * Alias for findByTenantIdIsNull for clearer naming.
     */
    @Query("SELECT * FROM roles WHERE tenant_id IS NULL ORDER BY position DESC, created_at")
    fun findSystemRoles(): List<SpringDataJdbcRoleTable>
    
    /**
     * Finds a role by tenant and name.
     */
    @Query("SELECT * FROM roles WHERE tenant_id = :tenantId AND name = :name")
    fun findByTenantIdAndName(
        @Param("tenantId") tenantId: TenantId,
        @Param("name") name: String
    ): SpringDataJdbcRoleTable?
    
    /**
     * Finds system roles only.
     */
    @Query("SELECT * FROM roles WHERE is_system = true ORDER BY position DESC, created_at")
    fun findByIsSystemTrue(): List<SpringDataJdbcRoleTable>
    
    /**
     * Finds non-system roles in a tenant.
     */
    @Query("SELECT * FROM roles WHERE tenant_id = :tenantId AND is_system = false ORDER BY position DESC, created_at")
    fun findByTenantIdAndIsSystemFalse(@Param("tenantId") tenantId: TenantId): List<SpringDataJdbcRoleTable>
    
    /**
     * Checks if a role with the given name exists in a tenant.
     */
    @Query("SELECT COUNT(*) > 0 FROM roles WHERE tenant_id = :tenantId AND name = :name")
    fun existsByTenantIdAndName(
        @Param("tenantId") tenantId: TenantId,
        @Param("name") name: String
    ): Boolean
    
    /**
     * Counts roles in a tenant.
     */
    @Query("SELECT COUNT(*) FROM roles WHERE tenant_id = :tenantId")
    fun countByTenantId(@Param("tenantId") tenantId: TenantId): Long
    
    /**
     * Deletes all roles for a tenant.
     */
    @Query("DELETE FROM roles WHERE tenant_id = :tenantId")
    fun deleteByTenantId(@Param("tenantId") tenantId: TenantId)
    
    /**
     * Finds the highest position value in a tenant.
     */
    @Query("SELECT COALESCE(MAX(position), 0) FROM roles WHERE tenant_id = :tenantId")
    fun findMaxPositionByTenantId(@Param("tenantId") tenantId: TenantId): Int
    
    /**
     * Finds a system role by name.
     */
    @Query("SELECT * FROM roles WHERE tenant_id IS NULL AND name = :name")
    fun findSystemRoleByName(@Param("name") name: String): SpringDataJdbcRoleTable?
    
    /**
     * Checks if a system role with the given name exists.
     */
    @Query("SELECT COUNT(*) > 0 FROM roles WHERE tenant_id IS NULL AND name = :name")
    fun existsSystemRoleByName(@Param("name") name: String): Boolean
    
    /**
     * Finds roles by tenant ID ordered by position descending.
     */
    @Query("SELECT * FROM roles WHERE tenant_id = :tenantId ORDER BY position DESC, created_at")
    fun findByTenantIdOrderByPositionDesc(@Param("tenantId") tenantId: TenantId): List<SpringDataJdbcRoleTable>
    
    /**
     * Finds system roles ordered by position descending.
     */
    @Query("SELECT * FROM roles WHERE tenant_id IS NULL ORDER BY position DESC, created_at")
    fun findSystemRolesOrderByPositionDesc(): List<SpringDataJdbcRoleTable>
    
    /**
     * Counts system roles.
     */
    @Query("SELECT COUNT(*) FROM roles WHERE tenant_id IS NULL")
    fun countSystemRoles(): Long
}