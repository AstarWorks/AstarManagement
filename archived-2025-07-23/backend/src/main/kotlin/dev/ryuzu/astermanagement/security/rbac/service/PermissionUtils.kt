package dev.ryuzu.astermanagement.security.rbac.service

import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.security.rbac.entity.Permission
import dev.ryuzu.astermanagement.security.rbac.entity.Role
import dev.ryuzu.astermanagement.security.rbac.repository.RoleRepository
import org.springframework.data.repository.findByIdOrNull
import org.springframework.stereotype.Component
import java.util.*

/**
 * Utility class for permission-related operations
 * Provides helper methods for checking permissions and retrieving roles
 */
@Component
class PermissionUtils(
    private val roleRepository: RoleRepository
) {
    
    /**
     * Check if a set of roles has a specific permission
     */
    fun userHasPermission(roles: Set<Role>, permission: Permission): Boolean {
        return roles.any { role ->
            role.hasPermission(permission)
        }
    }
    
    /**
     * Check if a user role has a specific permission
     * Maps user roles to RBAC roles and checks permissions
     */
    fun userRoleHasPermission(userRole: UserRole, permission: Permission): Boolean {
        val roleName = mapUserRoleToRbacRoleName(userRole)
        val role = roleRepository.findByName(roleName)
        return role?.hasPermission(permission) ?: false
    }
    
    /**
     * Find a role by its ID
     */
    fun findRoleById(roleId: UUID): Role? {
        return roleRepository.findByIdOrNull(roleId)
    }
    
    /**
     * Get roles by their names
     */
    fun getRolesByName(roleNames: Set<String>): List<Role> {
        return roleRepository.findByNameIn(roleNames)
    }
    
    /**
     * Map UserRole enum to RBAC role name
     */
    private fun mapUserRoleToRbacRoleName(userRole: UserRole): String {
        return when (userRole) {
            UserRole.LAWYER -> "Lawyer"
            UserRole.CLERK -> "Clerk"
            UserRole.CLIENT -> "Client"
        }
    }
    
    /**
     * Get the RBAC role for a user role
     */
    fun getRoleForUserRole(userRole: UserRole): Role? {
        val roleName = mapUserRoleToRbacRoleName(userRole)
        return roleRepository.findByName(roleName)
    }
    
    /**
     * Check if a role has any of the specified permissions
     */
    fun roleHasAnyPermission(role: Role, permissions: Set<Permission>): Boolean {
        return permissions.any { permission ->
            role.hasPermission(permission)
        }
    }
}