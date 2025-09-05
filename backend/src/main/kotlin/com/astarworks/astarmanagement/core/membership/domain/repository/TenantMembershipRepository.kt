package com.astarworks.astarmanagement.core.membership.domain.repository

import com.astarworks.astarmanagement.core.membership.domain.model.TenantMembership
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import com.astarworks.astarmanagement.shared.domain.value.TenantId

/**
 * Repository interface for TenantMembership domain entity.
 * 
 * Handles persistence operations for user-tenant membership relationships.
 * Supports multi-tenant scenarios where users can belong to multiple tenants.
 * 
 * This repository provides a unified interface for membership management,
 * replacing the previously duplicated TenantUserRepository interfaces.
 */
interface TenantMembershipRepository {
    
    // === Basic CRUD Operations ===
    
    /**
     * Saves a tenant membership to the repository.
     * @param membership The membership to save
     * @return The saved membership with any generated values
     */
    fun save(membership: TenantMembership): TenantMembership
    
    /**
     * Finds a membership by its ID.
     * @param id The membership ID
     * @return The membership if found, null otherwise
     */
    fun findById(id: TenantMembershipId): TenantMembership?
    
    /**
     * Finds all memberships.
     * @return List of all memberships
     */
    fun findAll(): List<TenantMembership>
    
    // === User-Tenant Lookup Operations ===
    
    /**
     * Finds a membership by user ID and tenant ID combination.
     * This is the primary lookup method for finding a specific user's membership in a tenant.
     * 
     * @param userId The user ID
     * @param tenantId The tenant ID
     * @return The membership if found, null otherwise
     */
    fun findByUserIdAndTenantId(userId: UserId, tenantId: TenantId): TenantMembership?
    
    // === User-based Queries ===
    
    /**
     * Finds all memberships for a specific user.
     * @param userId The user ID
     * @return List of memberships for the user
     */
    fun findByUserId(userId: UserId): List<TenantMembership>
    
    /**
     * Finds all active memberships for a specific user.
     * @param userId The user ID
     * @return List of active memberships for the user
     */
    fun findActiveByUserId(userId: UserId): List<TenantMembership>
    
    // === Tenant-based Queries ===
    
    /**
     * Finds all memberships for a specific tenant.
     * @param tenantId The tenant ID
     * @return List of memberships for the tenant
     */
    fun findByTenantId(tenantId: TenantId): List<TenantMembership>
    
    /**
     * Finds all active memberships for a specific tenant.
     * @param tenantId The tenant ID
     * @return List of active memberships for the tenant
     */
    fun findActiveByTenantId(tenantId: TenantId): List<TenantMembership>
    
    // === Existence Checks ===
    
    /**
     * Checks if a user is a member of a specific tenant.
     * @param userId The user ID
     * @param tenantId The tenant ID
     * @return true if membership exists, false otherwise
     */
    fun existsByUserIdAndTenantId(userId: UserId, tenantId: TenantId): Boolean
    
    /**
     * Checks if a user is an active member of a specific tenant.
     * @param userId The user ID
     * @param tenantId The tenant ID
     * @return true if active membership exists, false otherwise
     */
    fun existsActiveByUserIdAndTenantId(userId: UserId, tenantId: TenantId): Boolean
    
    // === Update Operations ===
    
    /**
     * Updates the last accessed timestamp for a membership.
     * @param id The membership ID
     */
    fun updateLastAccessedAt(id: TenantMembershipId)
    
    // === Delete Operations ===
    
    /**
     * Deletes a membership by its ID.
     * @param id The membership ID
     */
    fun deleteById(id: TenantMembershipId)
    
    /**
     * Deletes all memberships for a specific tenant.
     * @param tenantId The tenant ID
     */
    fun deleteByTenantId(tenantId: TenantId)
    
    /**
     * Deletes all memberships for a specific user.
     * @param userId The user ID
     */
    fun deleteByUserId(userId: UserId)
    
    // === Count Operations ===
    
    /**
     * Counts the total number of memberships.
     * @return The total count
     */
    fun count(): Long
    
    /**
     * Counts the number of members for a specific tenant.
     * @param tenantId The tenant ID
     * @return The count of members for the tenant
     */
    fun countByTenantId(tenantId: TenantId): Long
    
    /**
     * Counts the number of active members for a specific tenant.
     * @param tenantId The tenant ID
     * @return The count of active members for the tenant
     */
    fun countActiveByTenantId(tenantId: TenantId): Long
    
    /**
     * Counts the number of tenants for a specific user.
     * @param userId The user ID
     * @return The count of tenants for the user
     */
    fun countByUserId(userId: UserId): Long
    
    /**
     * Counts the number of active tenants for a specific user.
     * @param userId The user ID
     * @return The count of active tenants for the user
     */
    fun countActiveByUserId(userId: UserId): Long
}