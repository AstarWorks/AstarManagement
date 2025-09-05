package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.SpringDataJdbcUserRoleTable
import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.UserRoleId
import com.astarworks.astarmanagement.shared.domain.value.RoleId
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.springframework.data.jdbc.repository.query.Modifying
import org.springframework.data.jdbc.repository.query.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

/**
 * Spring Data JDBC repository interface for user role assignments.
 * Manages the many-to-many relationship between users and roles within tenants.
 * Uses multiple @Id annotations on entity for composite primary key (tenant_user_id, role_id).
 * CrudRepository's save method works correctly with @Version field for new/existing detection.
 */
@Repository
interface SpringDataJdbcUserRoleRepository : CrudRepository<SpringDataJdbcUserRoleTable, UserRoleId> {
    
    /**
     * Finds all role assignments for a tenant user.
     */
    @Query("SELECT * FROM user_roles WHERE tenant_user_id = :tenantUserId ORDER BY assigned_at")
    fun findByTenantUserId(@Param("tenantUserId") tenantUserId: TenantMembershipId): List<SpringDataJdbcUserRoleTable>
    
    /**
     * Finds all users assigned to a specific role.
     */
    @Query("SELECT * FROM user_roles WHERE role_id = :roleId ORDER BY assigned_at")
    fun findByRoleId(@Param("roleId") roleId: RoleId): List<SpringDataJdbcUserRoleTable>
    
    /**
     * Finds a specific user-role assignment.
     */
    @Query("SELECT * FROM user_roles WHERE tenant_user_id = :tenantUserId AND role_id = :roleId")
    fun findByTenantUserIdAndRoleId(
        @Param("tenantUserId") tenantUserId: TenantMembershipId,
        @Param("roleId") roleId: RoleId
    ): SpringDataJdbcUserRoleTable?
    
    /**
     * Finds all role assignments made by a specific user.
     */
    @Query("SELECT * FROM user_roles WHERE assigned_by = :assignedBy ORDER BY assigned_at DESC")
    fun findByAssignedBy(@Param("assignedBy") assignedBy: UserId): List<SpringDataJdbcUserRoleTable>
    
    /**
     * Checks if a user has a specific role.
     */
    @Query("SELECT COUNT(*) > 0 FROM user_roles WHERE tenant_user_id = :tenantUserId AND role_id = :roleId")
    fun existsByTenantUserIdAndRoleId(
        @Param("tenantUserId") tenantUserId: TenantMembershipId,
        @Param("roleId") roleId: RoleId
    ): Boolean
    
    /**
     * Deletes all role assignments for a tenant user.
     */
    @Modifying
    @Query("DELETE FROM user_roles WHERE tenant_user_id = :tenantUserId")
    fun deleteByTenantUserId(@Param("tenantUserId") tenantUserId: TenantMembershipId): Int
    
    /**
     * Deletes all assignments of a specific role.
     */
    @Modifying
    @Query("DELETE FROM user_roles WHERE role_id = :roleId")
    fun deleteByRoleId(@Param("roleId") roleId: RoleId): Int
    
    /**
     * Deletes a specific user-role assignment.
     */
    @Modifying
    @Query("DELETE FROM user_roles WHERE tenant_user_id = :tenantUserId AND role_id = :roleId")
    fun deleteByTenantUserIdAndRoleId(
        @Param("tenantUserId") tenantUserId: TenantMembershipId,
        @Param("roleId") roleId: RoleId
    ): Int
    
    /**
     * Counts users assigned to a role.
     */
    @Query("SELECT COUNT(*) FROM user_roles WHERE role_id = :roleId")
    fun countByRoleId(@Param("roleId") roleId: RoleId): Long
    
    /**
     * Counts roles assigned to a tenant user.
     */
    @Query("SELECT COUNT(*) FROM user_roles WHERE tenant_user_id = :tenantUserId")
    fun countByTenantUserId(@Param("tenantUserId") tenantUserId: TenantMembershipId): Long
}