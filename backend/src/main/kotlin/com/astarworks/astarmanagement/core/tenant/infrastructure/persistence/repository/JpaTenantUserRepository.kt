package com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.TenantUserTable
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.TenantTable
import com.astarworks.astarmanagement.core.user.infrastructure.persistence.entity.UserTable
import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.util.*

/**
 * Spring Data JPA repository for TenantUserTable (TenantUser persistence).
 * Handles multi-tenant user membership operations.
 */
@Repository
interface JpaTenantUserRepository : JpaRepository<TenantUserTable, UUID> {
    
    /**
     * Find a tenant user by tenant and user combination.
     * @param tenant The tenant entity
     * @param user The user entity
     * @return The tenant user table if found, null otherwise
     */
    fun findByTenantAndUser(tenant: TenantTable, user: UserTable): TenantUserTable?
    
    /**
     * Find all tenant users for a specific tenant.
     * @param tenant The tenant entity
     * @return List of tenant user tables for the tenant
     */
    fun findByTenant(tenant: TenantTable): List<TenantUserTable>
    
    /**
     * Find all tenant users for a specific user.
     * @param user The user entity
     * @return List of tenant user tables for the user
     */
    fun findByUser(user: UserTable): List<TenantUserTable>
    
    /**
     * Find all active tenant users for a specific tenant.
     * @param tenant The tenant entity
     * @param isActive The active status
     * @return List of active tenant user tables for the tenant
     */
    fun findByTenantAndIsActive(tenant: TenantTable, isActive: Boolean): List<TenantUserTable>
    
    /**
     * Find all active tenant users for a specific user.
     * @param user The user entity
     * @param isActive The active status
     * @return List of active tenant user tables for the user
     */
    fun findByUserAndIsActive(user: UserTable, isActive: Boolean): List<TenantUserTable>
    
    /**
     * Check if a tenant user exists by tenant and user combination.
     * @param tenant The tenant entity
     * @param user The user entity
     * @return true if exists, false otherwise
     */
    fun existsByTenantAndUser(tenant: TenantTable, user: UserTable): Boolean
    
    /**
     * Check if an active tenant user exists by tenant and user combination.
     * @param tenant The tenant entity
     * @param user The user entity
     * @param isActive The active status
     * @return true if active tenant user exists, false otherwise
     */
    fun existsByTenantAndUserAndIsActive(tenant: TenantTable, user: UserTable, isActive: Boolean): Boolean
    
    /**
     * Delete all tenant users for a specific tenant.
     * @param tenant The tenant entity
     */
    fun deleteByTenant(tenant: TenantTable)
    
    /**
     * Delete all tenant users for a specific user.
     * @param user The user entity
     */
    fun deleteByUser(user: UserTable)
    
    /**
     * Count the number of tenant users for a specific tenant.
     * @param tenant The tenant entity
     * @return The count of tenant users for the tenant
     */
    fun countByTenant(tenant: TenantTable): Long
    
    /**
     * Count the number of active tenant users for a specific tenant.
     * @param tenant The tenant entity
     * @param isActive The active status
     * @return The count of active tenant users for the tenant
     */
    fun countByTenantAndIsActive(tenant: TenantTable, isActive: Boolean): Long
    
    /**
     * Count the number of tenant users for a specific user.
     * @param user The user entity
     * @return The count of tenant users for the user
     */
    fun countByUser(user: UserTable): Long
    
    /**
     * Count the number of active tenant users for a specific user.
     * @param user The user entity
     * @param isActive The active status
     * @return The count of active tenant users for the user
     */
    fun countByUserAndIsActive(user: UserTable, isActive: Boolean): Long
    
    /**
     * Find tenant users by tenant ID using JPQL query for better performance with RLS.
     * @param tenantId The tenant ID
     * @return List of tenant user tables
     */
    @Query("SELECT tu FROM TenantUserTable tu WHERE tu.tenant.id = :tenantId")
    fun findByTenantId(@Param("tenantId") tenantId: UUID): List<TenantUserTable>
    
    /**
     * Find tenant users by user ID using JPQL query for better performance with RLS.
     * @param userId The user ID
     * @return List of tenant user tables
     */
    @Query("SELECT tu FROM TenantUserTable tu WHERE tu.user.id = :userId")
    fun findByUserId(@Param("userId") userId: UUID): List<TenantUserTable>
    
    /**
     * Find active tenant users by tenant ID using JPQL query.
     * @param tenantId The tenant ID
     * @param isActive The active status
     * @return List of active tenant user tables
     */
    @Query("SELECT tu FROM TenantUserTable tu WHERE tu.tenant.id = :tenantId AND tu.isActive = :isActive")
    fun findByTenantIdAndIsActive(@Param("tenantId") tenantId: UUID, @Param("isActive") isActive: Boolean): List<TenantUserTable>
    
    /**
     * Find active tenant users by user ID using JPQL query.
     * @param userId The user ID
     * @param isActive The active status
     * @return List of active tenant user tables
     */
    @Query("SELECT tu FROM TenantUserTable tu WHERE tu.user.id = :userId AND tu.isActive = :isActive")
    fun findByUserIdAndIsActive(@Param("userId") userId: UUID, @Param("isActive") isActive: Boolean): List<TenantUserTable>
    
    /**
     * Find tenant user by tenant ID and user ID combination using JPQL query.
     * @param tenantId The tenant ID
     * @param userId The user ID
     * @return The tenant user table if found, null otherwise
     */
    @Query("SELECT tu FROM TenantUserTable tu WHERE tu.tenant.id = :tenantId AND tu.user.id = :userId")
    fun findByTenantIdAndUserId(@Param("tenantId") tenantId: UUID, @Param("userId") userId: UUID): TenantUserTable?
    
    /**
     * Check if tenant user exists by tenant ID and user ID using JPQL query.
     * @param tenantId The tenant ID
     * @param userId The user ID
     * @return true if exists, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(tu) > 0 THEN true ELSE false END FROM TenantUserTable tu WHERE tu.tenant.id = :tenantId AND tu.user.id = :userId")
    fun existsByTenantIdAndUserId(@Param("tenantId") tenantId: UUID, @Param("userId") userId: UUID): Boolean
    
    /**
     * Check if active tenant user exists by tenant ID and user ID using JPQL query.
     * @param tenantId The tenant ID
     * @param userId The user ID
     * @param isActive The active status
     * @return true if active tenant user exists, false otherwise
     */
    @Query("SELECT CASE WHEN COUNT(tu) > 0 THEN true ELSE false END FROM TenantUserTable tu WHERE tu.tenant.id = :tenantId AND tu.user.id = :userId AND tu.isActive = :isActive")
    fun existsByTenantIdAndUserIdAndIsActive(@Param("tenantId") tenantId: UUID, @Param("userId") userId: UUID, @Param("isActive") isActive: Boolean): Boolean
    
    /**
     * Count tenant users by tenant ID using JPQL query.
     * @param tenantId The tenant ID
     * @return The count of tenant users for the tenant
     */
    @Query("SELECT COUNT(tu) FROM TenantUserTable tu WHERE tu.tenant.id = :tenantId")
    fun countByTenantId(@Param("tenantId") tenantId: UUID): Long
    
    /**
     * Count active tenant users by tenant ID using JPQL query.
     * @param tenantId The tenant ID
     * @param isActive The active status
     * @return The count of active tenant users for the tenant
     */
    @Query("SELECT COUNT(tu) FROM TenantUserTable tu WHERE tu.tenant.id = :tenantId AND tu.isActive = :isActive")
    fun countByTenantIdAndIsActive(@Param("tenantId") tenantId: UUID, @Param("isActive") isActive: Boolean): Long
    
    /**
     * Count tenant users by user ID using JPQL query.
     * @param userId The user ID
     * @return The count of tenant users for the user
     */
    @Query("SELECT COUNT(tu) FROM TenantUserTable tu WHERE tu.user.id = :userId")
    fun countByUserId(@Param("userId") userId: UUID): Long
    
    /**
     * Count active tenant users by user ID using JPQL query.
     * @param userId The user ID
     * @param isActive The active status
     * @return The count of active tenant users for the user
     */
    @Query("SELECT COUNT(tu) FROM TenantUserTable tu WHERE tu.user.id = :userId AND tu.isActive = :isActive")
    fun countByUserIdAndIsActive(@Param("userId") userId: UUID, @Param("isActive") isActive: Boolean): Long
}