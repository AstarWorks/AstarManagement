package dev.ryuzu.astermanagement.security.rbac.service

import dev.ryuzu.astermanagement.auth.service.UserPrincipal
import dev.ryuzu.astermanagement.security.rbac.entity.Permission
import dev.ryuzu.astermanagement.security.rbac.repository.UserRoleRepository
import dev.ryuzu.astermanagement.domain.user.UserRole
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.Cacheable
import org.springframework.security.access.PermissionEvaluator
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component
import java.io.Serializable
import java.util.*

/**
 * Custom PermissionEvaluator implementation for Spring Security integration.
 * Provides method-level security support through @PreAuthorize annotations
 * with Discord-style RBAC permission checking.
 * 
 * This evaluator bridges the current UserPrincipal authentication system
 * with the advanced RBAC permission model, supporting both simple role-based
 * checks and granular permission verification.
 */
@Component
class CustomPermissionEvaluator(
    private val userRoleRepository: UserRoleRepository,
    private val permissionService: PermissionService
) : PermissionEvaluator {
    
    private val logger = LoggerFactory.getLogger(CustomPermissionEvaluator::class.java)

    /**
     * Evaluates permission for a specific domain object.
     * Used by @PreAuthorize("hasPermission(#object, 'PERMISSION_NAME')")
     * 
     * @param authentication Current user authentication
     * @param targetDomainObject The domain object being accessed (e.g., Matter, Document)
     * @param permission Permission name as string (e.g., "MATTER_READ", "DOCUMENT_UPDATE")
     * @return true if user has permission, false otherwise
     */
    override fun hasPermission(
        authentication: Authentication,
        targetDomainObject: Any?,
        permission: Any?
    ): Boolean {
        if (authentication.principal !is UserPrincipal) {
            logger.warn("Authentication principal is not UserPrincipal: {}", authentication.principal?.javaClass)
            return false
        }

        val userPrincipal = authentication.principal as UserPrincipal
        val permissionName = permission?.toString() ?: return false
        
        return try {
            // Parse permission enum
            val permissionEnum = Permission.valueOf(permissionName)
            
            // Check permission with resource context
            checkPermissionWithResourceContext(userPrincipal, permissionEnum, targetDomainObject)
        } catch (e: IllegalArgumentException) {
            logger.warn("Invalid permission name: {}", permissionName)
            false
        } catch (e: Exception) {
            logger.error("Error evaluating permission {} for user {}", permissionName, userPrincipal.id, e)
            false
        }
    }

    /**
     * Evaluates permission for a specific resource by ID and type.
     * Used by @PreAuthorize("hasPermission(#id, 'ResourceType', 'PERMISSION_NAME')")
     * 
     * @param authentication Current user authentication
     * @param targetId Resource ID
     * @param targetType Resource type (e.g., "Matter", "Document")
     * @param permission Permission name as string
     * @return true if user has permission, false otherwise
     */
    override fun hasPermission(
        authentication: Authentication,
        targetId: Serializable?,
        targetType: String?,
        permission: Any?
    ): Boolean {
        if (authentication.principal !is UserPrincipal) {
            logger.warn("Authentication principal is not UserPrincipal: {}", authentication.principal?.javaClass)
            return false
        }

        val userPrincipal = authentication.principal as UserPrincipal
        val permissionName = permission?.toString() ?: return false
        
        return try {
            // Parse permission enum
            val permissionEnum = Permission.valueOf(permissionName)
            
            // Check permission with resource ID and type
            checkPermissionWithResourceId(userPrincipal, permissionEnum, targetId, targetType)
        } catch (e: IllegalArgumentException) {
            logger.warn("Invalid permission name: {}", permissionName)
            false
        } catch (e: Exception) {
            logger.error("Error evaluating permission {} for user {} on resource {}:{}", 
                         permissionName, userPrincipal.id, targetType, targetId, e)
            false
        }
    }

    /**
     * Check permission with resource context (domain object).
     * Implements resource-specific access control logic.
     */
    @Cacheable("permission-evaluations", key = "#userPrincipal.id + ':' + #permission.name + ':' + #resource?.javaClass?.simpleName")
    private fun checkPermissionWithResourceContext(
        userPrincipal: UserPrincipal,
        permission: Permission,
        resource: Any?
    ): Boolean {
        // First check if user has the permission based on their role
        if (hasRoleBasedPermission(userPrincipal, permission)) {
            // For resource-specific permissions, apply additional context checks
            return when {
                // Matter-related permissions
                permission.category == "MATTER" && resource != null -> {
                    checkMatterSpecificPermission(userPrincipal, permission, resource)
                }
                // Document-related permissions
                permission.category == "DOCUMENT" && resource != null -> {
                    checkDocumentSpecificPermission(userPrincipal, permission, resource)
                }
                // Communication-related permissions
                permission.category == "COMMUNICATION" && resource != null -> {
                    checkCommunicationSpecificPermission(userPrincipal, permission, resource)
                }
                // For other permissions, role-based check is sufficient
                else -> true
            }
        }
        
        return false
    }

    /**
     * Check permission with resource ID and type.
     * Used for method-level security on controller endpoints.
     */
    @Cacheable("permission-evaluations-by-id", key = "#userPrincipal.id + ':' + #permission.name + ':' + #targetType + ':' + #targetId")
    private fun checkPermissionWithResourceId(
        userPrincipal: UserPrincipal,
        permission: Permission,
        targetId: Serializable?,
        targetType: String?
    ): Boolean {
        // First check role-based permission
        if (!hasRoleBasedPermission(userPrincipal, permission)) {
            return false
        }
        
        // If no specific resource ID/type, role-based check is sufficient
        if (targetId == null || targetType == null) {
            return true
        }
        
        // Apply resource-specific access control
        return when (targetType.uppercase()) {
            "MATTER" -> checkMatterAccessById(userPrincipal, permission, targetId)
            "DOCUMENT" -> checkDocumentAccessById(userPrincipal, permission, targetId)
            "COMMUNICATION" -> checkCommunicationAccessById(userPrincipal, permission, targetId)
            else -> {
                logger.warn("Unknown resource type for permission check: {}", targetType)
                true // Default to allowing if resource type is unknown
            }
        }
    }

    /**
     * Check if user has permission based on their role.
     * Maps current UserRole enum to Permission flags.
     */
    private fun hasRoleBasedPermission(userPrincipal: UserPrincipal, permission: Permission): Boolean {
        val rolePermissions = when (userPrincipal.role) {
            UserRole.LAWYER -> Permission.Companion.Defaults.LAWYER_PERMISSIONS
            UserRole.CLERK -> Permission.Companion.Defaults.CLERK_PERMISSIONS
            UserRole.CLIENT -> Permission.Companion.Defaults.CLIENT_PERMISSIONS
        }
        
        return Permission.hasPermission(rolePermissions, permission)
    }

    /**
     * Check matter-specific permissions.
     * Clients can only access their own matters.
     */
    private fun checkMatterSpecificPermission(
        userPrincipal: UserPrincipal,
        permission: Permission,
        resource: Any
    ): Boolean {
        // For Lawyers and Clerks, allow access to all matters
        if (userPrincipal.role == UserRole.LAWYER || userPrincipal.role == UserRole.CLERK) {
            return true
        }
        
        // For Clients, check if they own the matter
        if (userPrincipal.role == UserRole.CLIENT) {
            return permissionService.isClientMatterOwner(userPrincipal.id!!, resource)
        }
        
        return false
    }

    /**
     * Check document-specific permissions.
     * Applies matter ownership rules to documents.
     */
    private fun checkDocumentSpecificPermission(
        userPrincipal: UserPrincipal,
        permission: Permission,
        resource: Any
    ): Boolean {
        // For Lawyers and Clerks, allow access to all documents
        if (userPrincipal.role == UserRole.LAWYER || userPrincipal.role == UserRole.CLERK) {
            return true
        }
        
        // For Clients, check if they own the matter containing the document
        if (userPrincipal.role == UserRole.CLIENT) {
            return permissionService.isClientDocumentOwner(userPrincipal.id!!, resource)
        }
        
        return false
    }

    /**
     * Check communication-specific permissions.
     * Applies matter ownership rules to communications.
     */
    private fun checkCommunicationSpecificPermission(
        userPrincipal: UserPrincipal,
        permission: Permission,
        resource: Any
    ): Boolean {
        // For Lawyers and Clerks, allow access to all communications
        if (userPrincipal.role == UserRole.LAWYER || userPrincipal.role == UserRole.CLERK) {
            return true
        }
        
        // For Clients, check if they own the matter containing the communication
        if (userPrincipal.role == UserRole.CLIENT) {
            return permissionService.isClientCommunicationOwner(userPrincipal.id!!, resource)
        }
        
        return false
    }

    /**
     * Check matter access by ID.
     */
    private fun checkMatterAccessById(
        userPrincipal: UserPrincipal,
        permission: Permission,
        matterId: Serializable
    ): Boolean {
        // For Lawyers and Clerks, allow access to all matters
        if (userPrincipal.role == UserRole.LAWYER || userPrincipal.role == UserRole.CLERK) {
            return true
        }
        
        // For Clients, check if they own the matter
        if (userPrincipal.role == UserRole.CLIENT) {
            return permissionService.isClientMatterOwnerById(userPrincipal.id!!, matterId)
        }
        
        return false
    }

    /**
     * Check document access by ID.
     */
    private fun checkDocumentAccessById(
        userPrincipal: UserPrincipal,
        permission: Permission,
        documentId: Serializable
    ): Boolean {
        // For Lawyers and Clerks, allow access to all documents
        if (userPrincipal.role == UserRole.LAWYER || userPrincipal.role == UserRole.CLERK) {
            return true
        }
        
        // For Clients, check if they own the matter containing the document
        if (userPrincipal.role == UserRole.CLIENT) {
            return permissionService.isClientDocumentOwnerById(userPrincipal.id!!, documentId)
        }
        
        return false
    }

    /**
     * Check communication access by ID.
     */
    private fun checkCommunicationAccessById(
        userPrincipal: UserPrincipal,
        permission: Permission,
        communicationId: Serializable
    ): Boolean {
        // For Lawyers and Clerks, allow access to all communications
        if (userPrincipal.role == UserRole.LAWYER || userPrincipal.role == UserRole.CLERK) {
            return true
        }
        
        // For Clients, check if they own the matter containing the communication
        if (userPrincipal.role == UserRole.CLIENT) {
            return permissionService.isClientCommunicationOwnerById(userPrincipal.id!!, communicationId)
        }
        
        return false
    }
}