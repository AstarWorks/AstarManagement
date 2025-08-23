package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.RolePermissionTable
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.RolePermissionId
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.RoleTable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.LocalDateTime
import java.util.*

/**
 * Spring Data JPA repository for RolePermissionTable (RolePermission persistence).
 * Handles permission assignments to roles with composite key operations and advanced permission rule matching.
 */
@Repository
interface JpaRolePermissionRepository : JpaRepository<RolePermissionTable, RolePermissionId> {
    
    /**
     * Find a role permission by role and permission rule combination (composite key lookup).
     * @param role The role entity
     * @param permissionRule The permission rule string
     * @return The role permission table if found, null otherwise
     */
    fun findByRoleAndPermissionRule(role: RoleTable, permissionRule: String): RolePermissionTable?
    
    /**
     * Find all permission assignments for a specific role.
     * @param role The role entity
     * @return List of role permission tables for the role
     */
    fun findByRole(role: RoleTable): List<RolePermissionTable>
    
    /**
     * Find all roles with a specific permission rule.
     * @param permissionRule The permission rule string
     * @return List of role permission tables with the specified rule
     */
    fun findByPermissionRule(permissionRule: String): List<RolePermissionTable>
    
    /**
     * Find all role permissions containing a specific pattern in the permission rule.
     * @param permissionRule The pattern to search for
     * @return List of role permission tables containing the pattern
     */
    fun findByPermissionRuleContaining(permissionRule: String): List<RolePermissionTable>
    
    /**
     * Find permissions created after a specific date.
     * @param createdAfter The date to compare against
     * @return List of role permission tables created after the date
     */
    fun findByCreatedAtAfter(createdAfter: LocalDateTime): List<RolePermissionTable>
    
    /**
     * Check if a role permission exists for the given role and permission rule combination.
     * @param role The role entity
     * @param permissionRule The permission rule string
     * @return true if permission exists, false otherwise
     */
    fun existsByRoleAndPermissionRule(role: RoleTable, permissionRule: String): Boolean
    
    /**
     * Check if any permissions exist for a specific role.
     * @param role The role entity
     * @return true if permissions exist, false otherwise
     */
    fun existsByRole(role: RoleTable): Boolean
    
    /**
     * Check if any roles have a specific permission rule.
     * @param permissionRule The permission rule string
     * @return true if roles with the permission exist, false otherwise
     */
    fun existsByPermissionRule(permissionRule: String): Boolean
    
    /**
     * Delete all permissions for a specific role.
     * @param role The role entity
     */
    fun deleteByRole(role: RoleTable)
    
    /**
     * Delete all roles with a specific permission rule.
     * @param permissionRule The permission rule string
     */
    fun deleteByPermissionRule(permissionRule: String)
    
    /**
     * Count the number of permissions for a specific role.
     * @param role The role entity
     * @return The count of permissions for the role
     */
    fun countByRole(role: RoleTable): Long
    
    /**
     * Count the number of roles with a specific permission rule.
     * @param permissionRule The permission rule string
     * @return The count of roles with the permission
     */
    fun countByPermissionRule(permissionRule: String): Long
    
    /**
     * Find role permission by role ID and permission rule using JPQL query for better performance with RLS.
     * @param roleId The role ID
     * @param permissionRule The permission rule string
     * @return The role permission table if found, null otherwise
     */
    @Query("SELECT rp FROM RolePermissionTable rp WHERE rp.role.id = :roleId AND rp.permissionRule = :permissionRule")
    fun findByRoleIdAndPermissionRule(@Param("roleId") roleId: UUID, @Param("permissionRule") permissionRule: String): RolePermissionTable?
    
    /**
     * Find role permissions by role ID using JPQL query for better performance with RLS.
     * @param roleId The role ID
     * @return List of role permission tables
     */
    @Query("SELECT rp FROM RolePermissionTable rp WHERE rp.role.id = :roleId")
    fun findByRoleId(@Param("roleId") roleId: UUID): List<RolePermissionTable>
    
    /**
     * Find role permissions containing a specific pattern using JPQL query.
     * @param pattern The pattern to search for in permission rules
     * @return List of role permission tables containing the pattern
     */
    @Query("SELECT rp FROM RolePermissionTable rp WHERE rp.permissionRule LIKE %:pattern%")
    fun findByPermissionRuleContainingPattern(@Param("pattern") pattern: String): List<RolePermissionTable>
    
    /**
     * Find wildcard permissions using JPQL query.
     * @return List of role permission tables with wildcard patterns
     */
    @Query("SELECT rp FROM RolePermissionTable rp WHERE rp.permissionRule LIKE '%*%'")
    fun findWildcardPermissions(): List<RolePermissionTable>
    
    /**
     * Find full access permissions using JPQL query.
     * @return List of role permission tables granting full access
     */
    @Query("SELECT rp FROM RolePermissionTable rp WHERE rp.permissionRule = '*.*.all' OR rp.permissionRule = '*.*.*'")
    fun findFullAccessPermissions(): List<RolePermissionTable>
    
    /**
     * Find permissions by resource type using JPQL query.
     * @param resource The resource type
     * @return List of role permission tables for the resource
     */
    @Query("SELECT rp FROM RolePermissionTable rp WHERE rp.permissionRule LIKE :resource || '.%'")
    fun findByResource(@Param("resource") resource: String): List<RolePermissionTable>
    
    /**
     * Find permissions by resource and action using JPQL query.
     * @param resource The resource type
     * @param action The action type
     * @return List of role permission tables for the resource-action combination
     */
    @Query("SELECT rp FROM RolePermissionTable rp WHERE rp.permissionRule LIKE :resource || '.' || :action || '.%'")
    fun findByResourceAndAction(@Param("resource") resource: String, @Param("action") action: String): List<RolePermissionTable>
    
    /**
     * Find permissions by complete resource-action-scope combination using JPQL query.
     * @param resource The resource type
     * @param action The action type
     * @param scope The scope type
     * @return List of role permission tables matching the combination
     */
    @Query("SELECT rp FROM RolePermissionTable rp WHERE rp.permissionRule = :resource || '.' || :action || '.' || :scope")
    fun findByResourceAndActionAndScope(@Param("resource") resource: String, @Param("action") action: String, @Param("scope") scope: String): List<RolePermissionTable>
    
    /**
     * Find permissions by scope type using JPQL query.
     * @param scope The scope type
     * @return List of role permission tables with the scope
     */
    @Query("SELECT rp FROM RolePermissionTable rp WHERE rp.permissionRule LIKE '%.' || :scope")
    fun findByScope(@Param("scope") scope: String): List<RolePermissionTable>
    
    /**
     * Find permissions created within specified days using JPQL query.
     * @param cutoffDate The cutoff date to compare against
     * @return List of role permission tables created after the cutoff date
     */
    @Query("SELECT rp FROM RolePermissionTable rp WHERE rp.createdAt > :cutoffDate")
    fun findCreatedAfterDate(@Param("cutoffDate") cutoffDate: LocalDateTime): List<RolePermissionTable>
    
    /**
     * Find permissions that grant access to resource with wildcard support using JPQL query.
     * This includes both exact matches and wildcard permissions.
     * @param resource The resource type
     * @return List of role permission tables that grant access to the resource
     */
    @Query("SELECT rp FROM RolePermissionTable rp WHERE rp.permissionRule LIKE :resource || '.%' OR rp.permissionRule LIKE '*.%'")
    fun findGrantingAccessToResource(@Param("resource") resource: String): List<RolePermissionTable>
    
    /**
     * Find permissions that grant access to action with wildcard support using JPQL query.
     * @param action The action type
     * @return List of role permission tables that grant access to the action
     */
    @Query("SELECT rp FROM RolePermissionTable rp WHERE rp.permissionRule LIKE '%.' || :action || '.%' OR rp.permissionRule LIKE '%.*%'")
    fun findGrantingAccessToAction(@Param("action") action: String): List<RolePermissionTable>
    
    /**
     * Find permissions with 'all' scope or wildcard scope using JPQL query.
     * @return List of role permission tables with broad scope access
     */
    @Query("SELECT rp FROM RolePermissionTable rp WHERE rp.permissionRule LIKE '%.all' OR rp.permissionRule LIKE '%.*'")
    fun findWithBroadScope(): List<RolePermissionTable>
    
    /**
     * Check if role permission exists by role ID and permission rule using JPQL query.
     * @param roleId The role ID
     * @param permissionRule The permission rule string
     * @return true if exists, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(rp) > 0 THEN true ELSE false END FROM RolePermissionTable rp WHERE rp.role.id = :roleId AND rp.permissionRule = :permissionRule")
    fun existsByRoleIdAndPermissionRule(@Param("roleId") roleId: UUID, @Param("permissionRule") permissionRule: String): Boolean
    
    /**
     * Check if role permissions exist by role ID using JPQL query.
     * @param roleId The role ID
     * @return true if exists, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(rp) > 0 THEN true ELSE false END FROM RolePermissionTable rp WHERE rp.role.id = :roleId")
    fun existsByRoleId(@Param("roleId") roleId: UUID): Boolean
    
    /**
     * Check if wildcard permissions exist using JPQL query.
     * @return true if wildcard permissions exist, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(rp) > 0 THEN true ELSE false END FROM RolePermissionTable rp WHERE rp.permissionRule LIKE '%*%'")
    fun existsWildcardPermissions(): Boolean
    
    /**
     * Check if full access permissions exist using JPQL query.
     * @return true if full access permissions exist, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(rp) > 0 THEN true ELSE false END FROM RolePermissionTable rp WHERE rp.permissionRule = '*.*.all' OR rp.permissionRule = '*.*.*'")
    fun existsFullAccessPermissions(): Boolean
    
    /**
     * Delete role permission by role ID and permission rule using JPQL query.
     * @param roleId The role ID
     * @param permissionRule The permission rule string
     */
    @Query("DELETE FROM RolePermissionTable rp WHERE rp.role.id = :roleId AND rp.permissionRule = :permissionRule")
    fun deleteByRoleIdAndPermissionRule(@Param("roleId") roleId: UUID, @Param("permissionRule") permissionRule: String)
    
    /**
     * Delete wildcard permissions using JPQL query.
     */
    @Query("DELETE FROM RolePermissionTable rp WHERE rp.permissionRule LIKE '%*%'")
    fun deleteWildcardPermissions()
    
    /**
     * Delete full access permissions using JPQL query.
     */
    @Query("DELETE FROM RolePermissionTable rp WHERE rp.permissionRule = '*.*.all' OR rp.permissionRule = '*.*.*'")
    fun deleteFullAccessPermissions()
    
    /**
     * Delete permissions by resource type using JPQL query.
     * @param resource The resource type
     */
    @Query("DELETE FROM RolePermissionTable rp WHERE rp.permissionRule LIKE :resource || '.%'")
    fun deleteByResource(@Param("resource") resource: String)
    
    /**
     * Count role permissions by role ID using JPQL query.
     * @param roleId The role ID
     * @return The count of permissions for the role
     */
    @Query("SELECT COUNT(rp) FROM RolePermissionTable rp WHERE rp.role.id = :roleId")
    fun countByRoleId(@Param("roleId") roleId: UUID): Long
    
    /**
     * Count wildcard permissions using JPQL query.
     * @return The count of wildcard permissions
     */
    @Query("SELECT COUNT(rp) FROM RolePermissionTable rp WHERE rp.permissionRule LIKE '%*%'")
    fun countWildcardPermissions(): Long
    
    /**
     * Count full access permissions using JPQL query.
     * @return The count of full access permissions
     */
    @Query("SELECT COUNT(rp) FROM RolePermissionTable rp WHERE rp.permissionRule = '*.*.all' OR rp.permissionRule = '*.*.*'")
    fun countFullAccessPermissions(): Long
    
    /**
     * Count permissions by resource type using JPQL query.
     * @param resource The resource type
     * @return The count of permissions for the resource
     */
    @Query("SELECT COUNT(rp) FROM RolePermissionTable rp WHERE rp.permissionRule LIKE :resource || '.%'")
    fun countByResource(@Param("resource") resource: String): Long
    
    /**
     * Count permissions by scope type using JPQL query.
     * @param scope The scope type
     * @return The count of permissions with the scope
     */
    @Query("SELECT COUNT(rp) FROM RolePermissionTable rp WHERE rp.permissionRule LIKE '%.' || :scope")
    fun countByScope(@Param("scope") scope: String): Long
}