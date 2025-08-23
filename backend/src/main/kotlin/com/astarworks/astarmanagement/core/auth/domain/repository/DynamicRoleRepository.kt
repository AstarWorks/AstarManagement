package com.astarworks.astarmanagement.core.auth.domain.repository

import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import java.util.UUID

/**
 * Dynamic role repository interface for domain layer.
 * Handles Discord-style dynamic role system persistence operations.
 * Supports both tenant-specific and system-wide roles.
 */
interface DynamicRoleRepository {
    
    /**
     * Saves a dynamic role to the repository.
     * @param role The dynamic role to save
     * @return The saved dynamic role with any generated values
     */
    fun save(role: DynamicRole): DynamicRole
    
    /**
     * Finds a dynamic role by its ID.
     * @param id The role ID
     * @return The dynamic role if found, null otherwise
     */
    fun findById(id: UUID): DynamicRole?
    
    /**
     * Finds all dynamic roles.
     * @return List of all dynamic roles
     */
    fun findAll(): List<DynamicRole>
    
    /**
     * Finds all roles for a specific tenant.
     * @param tenantId The tenant ID
     * @return List of roles for the tenant
     */
    fun findByTenantId(tenantId: UUID): List<DynamicRole>
    
    /**
     * Finds all system-wide roles (roles not tied to any specific tenant).
     * @return List of system-wide roles
     */
    fun findSystemRoles(): List<DynamicRole>
    
    /**
     * Finds a role by tenant and name combination.
     * @param tenantId The tenant ID (null for system roles)
     * @param name The role name
     * @return The dynamic role if found, null otherwise
     */
    fun findByTenantIdAndName(tenantId: UUID?, name: String): DynamicRole?
    
    /**
     * Checks if a role with the given tenant and name combination exists.
     * @param tenantId The tenant ID (null for system roles)
     * @param name The role name
     * @return true if exists, false otherwise
     */
    fun existsByTenantIdAndName(tenantId: UUID?, name: String): Boolean
    
    /**
     * Finds all roles for a tenant ordered by position (Discord-style hierarchy).
     * @param tenantId The tenant ID
     * @return List of roles ordered by position (highest first)
     */
    fun findByTenantIdOrderByPositionDesc(tenantId: UUID): List<DynamicRole>
    
    /**
     * Finds system roles ordered by position.
     * @return List of system roles ordered by position (highest first)
     */
    fun findSystemRolesOrderByPositionDesc(): List<DynamicRole>
    
    /**
     * Deletes a dynamic role by its ID.
     * @param id The role ID
     */
    fun deleteById(id: UUID)
    
    /**
     * Deletes all roles for a specific tenant.
     * @param tenantId The tenant ID
     */
    fun deleteByTenantId(tenantId: UUID)
    
    /**
     * Counts the total number of dynamic roles.
     * @return The total count
     */
    fun count(): Long
    
    /**
     * Counts the number of roles for a specific tenant.
     * @param tenantId The tenant ID
     * @return The count of roles for the tenant
     */
    fun countByTenantId(tenantId: UUID): Long
    
    /**
     * Counts the number of system roles.
     * @return The count of system roles
     */
    fun countSystemRoles(): Long
}