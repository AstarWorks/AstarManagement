package com.astarworks.astarmanagement.core.auth.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.auth.infrastructure.persistence.entity.RoleTable
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.TenantTable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

/**
 * Spring Data JPA repository for RoleTable (DynamicRole persistence).
 * Handles Discord-style dynamic role system operations.
 */
@Repository
interface JpaDynamicRoleRepository : JpaRepository<RoleTable, UUID> {
    
    /**
     * Find all roles for a specific tenant.
     * @param tenant The tenant entity
     * @return List of role tables for the tenant
     */
    fun findByTenant(tenant: TenantTable?): List<RoleTable>
    
    /**
     * Find all system-wide roles (roles not tied to any tenant).
     * @return List of system role tables
     */
    fun findByTenantIsNull(): List<RoleTable>
    
    /**
     * Find a role by tenant and name combination.
     * @param tenant The tenant entity (null for system roles)
     * @param name The role name
     * @return The role table if found, null otherwise
     */
    fun findByTenantAndName(tenant: TenantTable?, name: String): RoleTable?
    
    /**
     * Check if a role with the given tenant and name combination exists.
     * @param tenant The tenant entity (null for system roles)
     * @param name The role name
     * @return true if exists, false otherwise
     */
    fun existsByTenantAndName(tenant: TenantTable?, name: String): Boolean
    
    /**
     * Find all roles for a tenant ordered by position (Discord-style hierarchy).
     * @param tenant The tenant entity
     * @return List of role tables ordered by position (highest first)
     */
    fun findByTenantOrderByPositionDesc(tenant: TenantTable?): List<RoleTable>
    
    /**
     * Find system roles ordered by position.
     * @return List of system role tables ordered by position (highest first)
     */
    fun findByTenantIsNullOrderByPositionDesc(): List<RoleTable>
    
    /**
     * Delete all roles for a specific tenant.
     * @param tenant The tenant entity
     */
    fun deleteByTenant(tenant: TenantTable?)
    
    /**
     * Count the number of roles for a specific tenant.
     * @param tenant The tenant entity
     * @return The count of roles for the tenant
     */
    fun countByTenant(tenant: TenantTable?): Long
    
    /**
     * Count the number of system roles.
     * @return The count of system roles
     */
    fun countByTenantIsNull(): Long
    
    /**
     * Find roles by tenant ID using JPQL query for better performance with RLS.
     * @param tenantId The tenant ID
     * @return List of role tables
     */
    @Query("SELECT r FROM RoleTable r WHERE r.tenant.id = :tenantId")
    fun findByTenantId(@Param("tenantId") tenantId: UUID): List<RoleTable>
    
    /**
     * Find roles by tenant ID ordered by position using JPQL query.
     * @param tenantId The tenant ID
     * @return List of role tables ordered by position (highest first)
     */
    @Query("SELECT r FROM RoleTable r WHERE r.tenant.id = :tenantId ORDER BY r.position DESC")
    fun findByTenantIdOrderByPositionDesc(@Param("tenantId") tenantId: UUID): List<RoleTable>
    
    /**
     * Count roles by tenant ID using JPQL query.
     * @param tenantId The tenant ID
     * @return The count of roles for the tenant
     */
    @Query("SELECT COUNT(r) FROM RoleTable r WHERE r.tenant.id = :tenantId")
    fun countByTenantId(@Param("tenantId") tenantId: UUID): Long
}