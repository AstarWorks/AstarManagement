package com.astarworks.astarmanagement.core.auth.domain.service

import com.astarworks.astarmanagement.core.auth.domain.model.AuthenticatedUserContext
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.core.auth.domain.model.PermissionRule
import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.core.membership.domain.repository.TenantMembershipRepository
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.repository.UserRepository
import com.astarworks.astarmanagement.shared.domain.value.EntityId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.TenantUserId
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import org.slf4j.LoggerFactory
import org.springframework.beans.factory.annotation.Value
import org.springframework.security.core.AuthenticationException
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * Service for resolving user information from JWT claims.
 * 
 * This service handles the resolution of user context from Auth0 JWT tokens
 * with support for JIT (Just-In-Time) provisioning.
 * 
 * Key responsibilities:
 * - Resolve existing User entities from auth0_sub or create via JIT provisioning
 * - Resolve existing TenantUser relationships or create via JIT provisioning
 * - Fetch user roles and permissions
 * - Build complete AuthenticatedUserContext
 * 
 * JIT Provisioning Features:
 * - Creates users automatically when they don't exist
 * - Creates tenant memberships when users access new tenants
 * - Supports unified tenant model for seamless multi-tenant access
 */
@Service
@Transactional
class UserResolverService(
    private val userRepository: UserRepository,
    private val tenantMembershipRepository: TenantMembershipRepository,
    private val userRoleService: UserRoleService,
    private val rolePermissionService: RolePermissionService,
    private val userService: com.astarworks.astarmanagement.core.user.domain.service.UserService,
    private val tenantService: com.astarworks.astarmanagement.core.tenant.domain.service.TenantService,
) {
    private val logger = LoggerFactory.getLogger(UserResolverService::class.java)
    
    /**
     * Finds a user by auth0 subject identifier.
     * Returns null if user doesn't exist (for checking existence).
     * 
     * @param auth0Sub The Auth0 subject identifier
     * @return The User if exists, null otherwise
     */
    fun findUserByAuth0Sub(auth0Sub: String): User? {
        return userRepository.findByAuth0Sub(auth0Sub)
    }
    
    /**
     * Resolves complete authenticated user context from JWT claims.
     * Supports JIT provisioning for users and tenant memberships.
     * 
     * @param auth0Sub The Auth0 subject identifier from JWT
     * @param tenantId The tenant ID (resolved from Auth0 org_id)
     * @param email Optional email from JWT claims
     * @return Complete authenticated user context
     * @throws UserNotFoundException if user creation fails
     * @throws TenantMembershipNotFoundException if membership creation fails
     */
    fun resolveAuthenticatedContext(
        auth0Sub: String,
        tenantId: UUID,
        email: String? = null
    ): AuthenticatedUserContext {
        logger.debug("Resolving user context for auth0_sub: $auth0Sub, tenant: $tenantId")
        
        // Step 1: Resolve or create User via JIT provisioning
        val user = resolveOrCreateUser(auth0Sub, email)
        
        // Step 2: Resolve or create TenantUser relationship via JIT provisioning
        val tenantUser = resolveOrCreateTenantMembership(user.id, TenantId(tenantId))
        
        // Step 3: Update last access timestamp
        updateLastAccess(tenantUser.id)
        
        // Step 4: Fetch user roles
        val roles = resolveUserRoles(TenantUserId(tenantUser.id.value))
        
        // Step 5: Optionally compute permissions (for caching)
        val permissions = computeUserPermissions(tenantUser.id.value, roles)
        
        // Step 6: Build and return complete context
        val context = AuthenticatedUserContext(
            auth0Sub = auth0Sub,
            userId = user.id.value,
            tenantUserId = tenantUser.id.value,
            tenantId = tenantId,
            roles = roles,
            permissions = permissions,
            email = user.email,
            isActive = tenantUser.isActive,
            lastAccessedAt = tenantUser.lastAccessedAt
        )
        
        logger.debug("Resolved user context: userId=${user.id}, tenantUserId=${tenantUser.id}")
        return context
    }
    
    /**
     * Creates a user and their default tenant via JIT provisioning.
     * Used for first-time users in the unified tenant model.
     * 
     * @param auth0Sub The Auth0 subject identifier
     * @param email The user's email address
     * @param tenantName The name for the default tenant
     * @param auth0OrgId Optional Auth0 Organization ID for the tenant
     * @return Complete authenticated user context with default tenant
     */
    fun createUserWithDefaultTenant(
        auth0Sub: String,
        email: String,
        tenantName: String = "Default Workspace",
        auth0OrgId: String? = null
    ): AuthenticatedUserContext {
        logger.info("Creating user with default tenant for auth0_sub: $auth0Sub")
        
        // Step 1: Create user via JIT provisioning
        val user = resolveOrCreateUser(auth0Sub, email)
        
        // Step 2: Create or find default tenant for the user
        val tenantSlug = "user-${user.id.value.toString().take(8)}"
        val tenant = if (auth0OrgId != null) {
            tenantService.findOrCreateByAuth0OrgId(auth0OrgId, tenantSlug, tenantName)
        } else {
            try {
                tenantService.createTenant(tenantSlug, tenantName, null)
            } catch (e: IllegalArgumentException) {
                // If tenant already exists, find and use it
                tenantService.findBySlug(tenantSlug) 
                    ?: throw IllegalStateException("Failed to create or find tenant: $tenantSlug")
            }
        }
        
        // Step 3: Create tenant membership
        val tenantUser = resolveOrCreateTenantMembership(user.id, tenant.id)
        
        // Step 4: Build authenticated context
        val roles = resolveUserRoles(TenantUserId(tenantUser.id.value))
        val permissions = computeUserPermissions(tenantUser.id.value, roles)
        
        val context = AuthenticatedUserContext(
            auth0Sub = auth0Sub,
            userId = user.id.value,
            tenantUserId = tenantUser.id.value,
            tenantId = tenant.id.value,
            roles = roles,
            permissions = permissions,
            email = user.email,
            isActive = tenantUser.isActive,
            lastAccessedAt = tenantUser.lastAccessedAt
        )
        
        logger.info("Created user with default tenant: userId=${user.id}, tenantId=${tenant.id}")
        return context
    }
    
    /**
     * Resolves or creates user by auth0_sub with JIT provisioning.
     * 
     * @param auth0Sub The Auth0 subject identifier
     * @param email The user's email from JWT (optional)
     * @return The resolved or newly created User
     */
    private fun resolveOrCreateUser(auth0Sub: String, email: String?): User {
        logger.debug("Looking for user with auth0_sub: $auth0Sub")
        val existingUser = userRepository.findByAuth0Sub(auth0Sub)
        if (existingUser != null) {
            logger.debug("Found existing user for auth0_sub: $auth0Sub, userId: ${existingUser.id}")
            return existingUser
        }
        
        // JIT provisioning: create user if they don't exist
        logger.info("User not found for auth0_sub: $auth0Sub. Creating via JIT provisioning.")
        
        if (email.isNullOrBlank()) {
            throw UserNotFoundException("Cannot create user without email. Auth0 JWT must contain email claim.")
        }
        
        try {
            val newUser = userService.findOrCreateFromAuth0(
                auth0Sub = auth0Sub,
                email = email
                // displayName and avatarUrl could be extracted from JWT in the future
            )
            logger.info("Created new user via JIT provisioning: ${newUser.id}")
            return newUser
        } catch (e: Exception) {
            logger.error("Failed to create user via JIT provisioning for auth0_sub: $auth0Sub", e)
            throw UserNotFoundException("Failed to create user for auth0_sub: $auth0Sub. Error: ${e.message}")
        }
    }
    
    
    /**
     * Resolves or creates tenant membership with JIT provisioning.
     * 
     * @param userId The user ID
     * @param tenantId The tenant ID
     * @return The resolved or newly created TenantMembership
     */
    private fun resolveOrCreateTenantMembership(userId: UserId, tenantId: TenantId): TenantMembership {
        val existingTenantUser = tenantMembershipRepository.findByUserIdAndTenantId(userId, tenantId)
        if (existingTenantUser != null) {
            logger.debug("Found existing tenant user: ${existingTenantUser.id}")
            
            // Check if inactive and reactivate if needed
            if (!existingTenantUser.isActive) {
                logger.info("Reactivating inactive tenant user: ${existingTenantUser.id}")
                val reactivated = existingTenantUser.copy(
                    isActive = true,
                    lastAccessedAt = Instant.now()
                )
                return tenantMembershipRepository.save(reactivated)
            }
            
            return existingTenantUser
        }
        
        // JIT provisioning: create tenant membership if it doesn't exist
        logger.info("No tenant membership found for user: $userId, tenant: $tenantId. Creating via JIT provisioning.")
        
        // Verify that the tenant exists
        val tenant = tenantService.findById(tenantId)
            ?: throw TenantMembershipNotFoundException("Cannot create membership: tenant not found: $tenantId")
        
        try {
            // Create new tenant membership
            val newMembership = com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership(
                userId = userId,
                tenantId = tenantId,
                isActive = true,
                joinedAt = Instant.now(),
                lastAccessedAt = Instant.now()
            )
            
            val savedMembership = tenantMembershipRepository.save(newMembership)
            logger.info("Created tenant membership via JIT provisioning: ${savedMembership.id}")
            return savedMembership
        } catch (e: Exception) {
            logger.error("Failed to create tenant membership via JIT provisioning for user: $userId, tenant: $tenantId", e)
            throw TenantMembershipNotFoundException("Failed to create tenant membership for user: $userId, tenant: $tenantId. Error: ${e.message}")
        }
    }
    
    
    
    /**
     * Resolves all roles assigned to a user.
     * 
     * @param tenantUserId The tenant user ID
     * @return Set of DynamicRole objects
     */
    private fun resolveUserRoles(tenantUserId: TenantUserId): Set<DynamicRole> {
        val roles = userRoleService.getUserDynamicRoles(tenantUserId.value)
        logger.debug("Resolved ${roles.size} roles for tenant user: $tenantUserId")
        return roles.toSet()
    }
    
    /**
     * Computes all permissions for a user based on their roles.
     * This is optional and used for caching permissions in the context.
     * 
     * @param tenantUserId The tenant user ID
     * @param roles The user's roles
     * @return Set of PermissionRule objects
     */
    private fun computeUserPermissions(
        tenantUserId: UUID,
        roles: Set<DynamicRole>
    ): Set<PermissionRule> {
        if (roles.isEmpty()) {
            return emptySet()
        }
        
        val permissions = mutableSetOf<PermissionRule>()
        
        roles.forEach { role ->
            val rolePermissions = rolePermissionService.getRolePermissions(role.id)
            rolePermissions.forEach { rolePermission ->
                // RolePermission already contains a typed PermissionRule
                permissions.add(rolePermission.permissionRule)
            }
        }
        
        logger.debug("Computed ${permissions.size} permissions for tenant user: $tenantUserId")
        return permissions
    }
    
    /**
     * Updates the last accessed timestamp for a tenant user.
     * 
     * @param tenantUserId The tenant user ID
     */
    private fun updateLastAccess(tenantUserId: TenantMembershipId) {
        try {
            tenantMembershipRepository.updateLastAccessedAt(tenantUserId)
            logger.debug("Updated last access for tenant user: $tenantUserId")
        } catch (e: Exception) {
            // Log but don't fail authentication if update fails
            logger.warn("Failed to update last access for tenant user: $tenantUserId", e)
        }
    }
    
    /**
     * Validates that a user can access a specific tenant.
     * 
     * @param userId The user ID
     * @param tenantId The tenant ID
     * @return true if the user can access the tenant
     */
    @Transactional(readOnly = true)
    fun canAccessTenant(userId: UUID, tenantId: UUID): Boolean {
        val tenantUser = tenantMembershipRepository.findByUserIdAndTenantId(UserId(userId), TenantId(tenantId))
        return tenantUser?.isActive == true
    }
    
    /**
     * Gets all tenants a user has access to.
     * 
     * @param userId The user ID
     * @return List of active TenantMembership relationships
     */
    @Transactional(readOnly = true)
    fun getUserTenants(userId: UUID): List<TenantMembership> {
        return tenantMembershipRepository.findActiveByUserId(UserId(userId))
    }
    
    /**
     * Deactivates a user's access to a tenant.
     * Does not delete the relationship, just marks it as inactive.
     * 
     * @param userId The user ID
     * @param tenantId The tenant ID
     * @throws IllegalArgumentException if relationship doesn't exist
     */
    fun deactivateTenantAccess(userId: UUID, tenantId: UUID) {
        val tenantUser = tenantMembershipRepository.findByUserIdAndTenantId(UserId(userId), TenantId(tenantId))
            ?: throw IllegalArgumentException("User $userId is not a member of tenant $tenantId")
        
        if (!tenantUser.isActive) {
            logger.debug("Tenant user ${tenantUser.id} is already inactive")
            return
        }
        
        val deactivated = tenantUser.copy(isActive = false)
        tenantMembershipRepository.save(deactivated)
        
        logger.info("Deactivated tenant access for user: $userId, tenant: $tenantId")
    }
    
    /**
     * Reactivates a user's access to a tenant.
     * 
     * @param userId The user ID
     * @param tenantId The tenant ID
     * @throws IllegalArgumentException if relationship doesn't exist
     */
    fun reactivateTenantAccess(userId: UUID, tenantId: UUID) {
        val tenantUser = tenantMembershipRepository.findByUserIdAndTenantId(UserId(userId), TenantId(tenantId))
            ?: throw IllegalArgumentException("User $userId is not a member of tenant $tenantId")
        
        if (tenantUser.isActive) {
            logger.debug("Tenant user ${tenantUser.id} is already active")
            return
        }
        
        val reactivated = tenantUser.copy(
            isActive = true,
            lastAccessedAt = Instant.now()
        )
        tenantMembershipRepository.save(reactivated)
        
        logger.info("Reactivated tenant access for user: $userId, tenant: $tenantId")
    }
}

/**
 * Exception thrown when a user is not found for the given auth0_sub.
 * Extends AuthenticationException to trigger proper 401 handling.
 */
class UserNotFoundException(message: String) : AuthenticationException(message)

/**
 * Exception thrown when a tenant membership is not found.
 * Extends AuthenticationException to trigger proper 401 handling.
 */
class TenantMembershipNotFoundException(message: String) : AuthenticationException(message)