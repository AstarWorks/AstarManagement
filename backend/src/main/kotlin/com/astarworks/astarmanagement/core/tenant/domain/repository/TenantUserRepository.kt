package com.astarworks.astarmanagement.core.tenant.domain.repository

import com.astarworks.astarmanagement.core.tenant.domain.model.TenantUser
import java.util.UUID

/**
 * TenantUser repository interface for domain layer.
 * Handles multi-tenant user membership persistence operations.
 * Supports Slack-style multi-tenancy where users can belong to multiple tenants.
 */
interface TenantUserRepository {
    
    /**
     * Saves a tenant user relationship to the repository.
     * @param tenantUser The tenant user to save
     * @return The saved tenant user with any generated values
     */
    fun save(tenantUser: TenantUser): TenantUser
    
    /**
     * Finds a tenant user by its ID.
     * @param id The tenant user ID
     * @return The tenant user if found, null otherwise
     */
    fun findById(id: UUID): TenantUser?
    
    /**
     * Finds all tenant users.
     * @return List of all tenant users
     */
    fun findAll(): List<TenantUser>
    
    /**
     * Finds a tenant user by tenant ID and user ID combination.
     * @param tenantId The tenant ID
     * @param userId The user ID
     * @return The tenant user if found, null otherwise
     */
    fun findByTenantIdAndUserId(tenantId: UUID, userId: UUID): TenantUser?
    
    /**
     * Finds all users for a specific tenant.
     * @param tenantId The tenant ID
     * @return List of tenant users for the tenant
     */
    fun findByTenantId(tenantId: UUID): List<TenantUser>
    
    /**
     * Finds all tenants for a specific user.
     * @param userId The user ID
     * @return List of tenant users for the user
     */
    fun findByUserId(userId: UUID): List<TenantUser>
    
    /**
     * Finds all active users for a specific tenant.
     * @param tenantId The tenant ID
     * @return List of active tenant users for the tenant
     */
    fun findActiveByTenantId(tenantId: UUID): List<TenantUser>
    
    /**
     * Finds all active tenants for a specific user.
     * @param userId The user ID
     * @return List of active tenant users for the user
     */
    fun findActiveByUserId(userId: UUID): List<TenantUser>
    
    /**
     * Checks if a user is a member of a specific tenant.
     * @param tenantId The tenant ID
     * @param userId The user ID
     * @return true if user is member, false otherwise
     */
    fun existsByTenantIdAndUserId(tenantId: UUID, userId: UUID): Boolean
    
    /**
     * Checks if a user is an active member of a specific tenant.
     * @param tenantId The tenant ID
     * @param userId The user ID
     * @return true if user is active member, false otherwise
     */
    fun existsActiveByTenantIdAndUserId(tenantId: UUID, userId: UUID): Boolean
    
    /**
     * Deletes a tenant user by its ID.
     * @param id The tenant user ID
     */
    fun deleteById(id: UUID)
    
    /**
     * Deletes all tenant users for a specific tenant.
     * @param tenantId The tenant ID
     */
    fun deleteByTenantId(tenantId: UUID)
    
    /**
     * Deletes all tenant users for a specific user.
     * @param userId The user ID
     */
    fun deleteByUserId(userId: UUID)
    
    /**
     * Counts the total number of tenant users.
     * @return The total count
     */
    fun count(): Long
    
    /**
     * Counts the number of users for a specific tenant.
     * @param tenantId The tenant ID
     * @return The count of users for the tenant
     */
    fun countByTenantId(tenantId: UUID): Long
    
    /**
     * Counts the number of active users for a specific tenant.
     * @param tenantId The tenant ID
     * @return The count of active users for the tenant
     */
    fun countActiveByTenantId(tenantId: UUID): Long
    
    /**
     * Counts the number of tenants for a specific user.
     * @param userId The user ID
     * @return The count of tenants for the user
     */
    fun countByUserId(userId: UUID): Long
    
    /**
     * Counts the number of active tenants for a specific user.
     * @param userId The user ID
     * @return The count of active tenants for the user
     */
    fun countActiveByUserId(userId: UUID): Long
}