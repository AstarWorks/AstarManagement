package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.RolePermissionId
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.SpringDataJdbcRolePermissionTable
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import org.springframework.data.jdbc.repository.query.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

/**
 * Spring Data JDBC repository interface for role permission operations.
 * Manages permission rules assigned to roles.
 * Uses multiple @Id annotations on entity for composite primary key (role_id, permission_rule).
 * CrudRepository's save method works correctly with @Version field for new/existing detection.
 */
@Repository
interface SpringDataJdbcRolePermissionRepository : CrudRepository<SpringDataJdbcRolePermissionTable, RolePermissionId> {
    
    /**
     * Finds all permissions for a role.
     */
    @Query("SELECT * FROM role_permissions WHERE role_id = :roleId ORDER BY created_at")
    fun findByRoleId(@Param("roleId") roleId: RoleId): List<SpringDataJdbcRolePermissionTable>
    
    /**
     * Finds a specific permission by role and rule.
     */
    @Query("SELECT * FROM role_permissions WHERE role_id = :roleId AND permission_rule = :permissionRule")
    fun findByRoleIdAndPermissionRule(
        @Param("roleId") roleId: RoleId,
        @Param("permissionRule") permissionRule: String
    ): SpringDataJdbcRolePermissionTable?
    
    /**
     * Finds permissions by rule pattern (for analysis).
     */
    @Query("SELECT * FROM role_permissions WHERE permission_rule LIKE :pattern ORDER BY created_at")
    fun findByPermissionRuleLike(@Param("pattern") pattern: String): List<SpringDataJdbcRolePermissionTable>
    
    /**
     * Finds permissions for a specific resource type.
     */
    @Query("SELECT * FROM role_permissions WHERE permission_rule LIKE :resourcePattern ORDER BY created_at")
    fun findByResourceType(@Param("resourcePattern") resourcePattern: String): List<SpringDataJdbcRolePermissionTable>
    
    /**
     * Checks if a role has a specific permission.
     */
    @Query("SELECT COUNT(*) > 0 FROM role_permissions WHERE role_id = :roleId AND permission_rule = :permissionRule")
    fun existsByRoleIdAndPermissionRule(
        @Param("roleId") roleId: RoleId,
        @Param("permissionRule") permissionRule: String
    ): Boolean
    
    /**
     * Deletes all permissions for a role.
     */
    @Query("DELETE FROM role_permissions WHERE role_id = :roleId")
    fun deleteByRoleId(@Param("roleId") roleId: RoleId)
    
    /**
     * Deletes a specific permission from a role.
     */
    @Query("DELETE FROM role_permissions WHERE role_id = :roleId AND permission_rule = :permissionRule")
    fun deleteByRoleIdAndPermissionRule(
        @Param("roleId") roleId: RoleId,
        @Param("permissionRule") permissionRule: String
    )
    
    /**
     * Counts permissions for a role.
     */
    @Query("SELECT COUNT(*) FROM role_permissions WHERE role_id = :roleId")
    fun countByRoleId(@Param("roleId") roleId: RoleId): Long
    
    /**
     * Finds all unique permission rules across all roles.
     */
    @Query("SELECT DISTINCT permission_rule FROM role_permissions ORDER BY permission_rule")
    fun findDistinctPermissionRules(): List<String>
    
    /**
     * Finds permissions by action.
     */
    @Query("SELECT * FROM role_permissions WHERE permission_rule LIKE '%.' || :action || '.%' ORDER BY created_at")
    fun findByAction(@Param("action") action: String): List<SpringDataJdbcRolePermissionTable>
    
    /**
     * Finds permissions by scope.
     */
    @Query("SELECT * FROM role_permissions WHERE permission_rule LIKE '%.' || :scope ORDER BY created_at")
    fun findByScope(@Param("scope") scope: String): List<SpringDataJdbcRolePermissionTable>
    
    /**
     * Finds permissions by resource type and action.
     */
    @Query("SELECT * FROM role_permissions WHERE permission_rule LIKE :resourceType || '.' || :action || '.%' ORDER BY created_at")
    fun findByResourceTypeAndAction(
        @Param("resourceType") resourceType: String,
        @Param("action") action: String
    ): List<SpringDataJdbcRolePermissionTable>
    
    /**
     * Finds permissions starting with a pattern.
     */
    @Query("SELECT * FROM role_permissions WHERE permission_rule LIKE :pattern || '%' ORDER BY created_at")
    fun findByPermissionRuleStartingWith(@Param("pattern") pattern: String): List<SpringDataJdbcRolePermissionTable>
    
    /**
     * Finds permissions created after a specific date.
     */
    @Query("SELECT * FROM role_permissions WHERE created_at > :timestamp ORDER BY created_at")
    fun findByCreatedAtAfter(@Param("timestamp") timestamp: java.time.Instant): List<SpringDataJdbcRolePermissionTable>
    
    /**
     * Checks if a role exists.
     */
    @Query("SELECT COUNT(*) > 0 FROM role_permissions WHERE role_id = :roleId")
    fun existsByRoleId(@Param("roleId") roleId: RoleId): Boolean
    
    /**
     * Counts permissions by resource type.
     */
    @Query("SELECT COUNT(*) FROM role_permissions WHERE permission_rule LIKE :resourceType || '.%'")
    fun countByResourceType(@Param("resourceType") resourceType: String): Long
    
    /**
     * Counts permissions by scope.
     */
    @Query("SELECT COUNT(*) FROM role_permissions WHERE permission_rule LIKE '%.' || :scope")
    fun countByScope(@Param("scope") scope: String): Long
    
    /**
     * Deletes permissions by resource type.
     */
    @Query("DELETE FROM role_permissions WHERE permission_rule LIKE :resourceType || '.%'")
    fun deleteByResourceType(@Param("resourceType") resourceType: String)
}