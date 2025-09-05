package com.astarworks.astarmanagement.core.membership.infrastructure.persistence.repository

import com.astarworks.astarmanagement.core.membership.infrastructure.persistence.entity.SpringDataJdbcTenantMembershipTable
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import com.astarworks.astarmanagement.shared.domain.value.TenantMembershipId
import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.springframework.data.jdbc.repository.query.Query
import org.springframework.data.repository.CrudRepository
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository

/**
 * Spring Data JDBC repository interface for tenant membership operations.
 * Manages the many-to-many relationship between users and tenants.
 */
@Repository
interface SpringDataJdbcTenantMembershipRepository : CrudRepository<SpringDataJdbcTenantMembershipTable, TenantMembershipId> {
    
    /**
     * Finds memberships by tenant ID.
     */
    @Query("SELECT * FROM tenant_users WHERE tenant_id = :tenantId ORDER BY joined_at")
    fun findByTenantId(@Param("tenantId") tenantId: TenantId): List<SpringDataJdbcTenantMembershipTable>
    
    /**
     * Finds memberships by user ID.
     */
    @Query("SELECT * FROM tenant_users WHERE user_id = :userId ORDER BY joined_at")
    fun findByUserId(@Param("userId") userId: UserId): List<SpringDataJdbcTenantMembershipTable>
    
    /**
     * Finds a specific membership by tenant and user.
     */
    @Query("SELECT * FROM tenant_users WHERE tenant_id = :tenantId AND user_id = :userId")
    fun findByTenantIdAndUserId(
        @Param("tenantId") tenantId: TenantId,
        @Param("userId") userId: UserId
    ): SpringDataJdbcTenantMembershipTable?
    
    /**
     * Finds active memberships by tenant ID.
     */
    @Query("SELECT * FROM tenant_users WHERE tenant_id = :tenantId AND is_active = true ORDER BY joined_at")
    fun findByTenantIdAndIsActiveTrue(@Param("tenantId") tenantId: TenantId): List<SpringDataJdbcTenantMembershipTable>
    
    /**
     * Finds active memberships by user ID.
     */
    @Query("SELECT * FROM tenant_users WHERE user_id = :userId AND is_active = true ORDER BY joined_at")
    fun findByUserIdAndIsActiveTrue(@Param("userId") userId: UserId): List<SpringDataJdbcTenantMembershipTable>
    
    /**
     * Checks if a membership exists between tenant and user.
     */
    @Query("SELECT COUNT(*) > 0 FROM tenant_users WHERE tenant_id = :tenantId AND user_id = :userId")
    fun existsByTenantIdAndUserId(
        @Param("tenantId") tenantId: TenantId,
        @Param("userId") userId: UserId
    ): Boolean
    
    /**
     * Checks if an active membership exists between tenant and user.
     */
    @Query("SELECT COUNT(*) > 0 FROM tenant_users WHERE tenant_id = :tenantId AND user_id = :userId AND is_active = true")
    fun existsByTenantIdAndUserIdAndIsActiveTrue(
        @Param("tenantId") tenantId: TenantId,
        @Param("userId") userId: UserId
    ): Boolean
    
    /**
     * Counts members in a tenant.
     */
    @Query("SELECT COUNT(*) FROM tenant_users WHERE tenant_id = :tenantId")
    fun countByTenantId(@Param("tenantId") tenantId: TenantId): Long
    
    /**
     * Counts active members in a tenant.
     */
    @Query("SELECT COUNT(*) FROM tenant_users WHERE tenant_id = :tenantId AND is_active = true")
    fun countByTenantIdAndIsActiveTrue(@Param("tenantId") tenantId: TenantId): Long
    
    /**
     * Deletes all memberships for a tenant.
     */
    @Query("DELETE FROM tenant_users WHERE tenant_id = :tenantId")
    fun deleteByTenantId(@Param("tenantId") tenantId: TenantId)
    
    /**
     * Deletes all memberships for a user.
     */
    @Query("DELETE FROM tenant_users WHERE user_id = :userId")
    fun deleteByUserId(@Param("userId") userId: UserId)
    
    /**
     * Counts tenants a user belongs to.
     */
    @Query("SELECT COUNT(*) FROM tenant_users WHERE user_id = :userId")
    fun countByUserId(@Param("userId") userId: UserId): Long
    
    /**
     * Counts active tenants a user belongs to.
     */
    @Query("SELECT COUNT(*) FROM tenant_users WHERE user_id = :userId AND is_active = true")
    fun countByUserIdAndIsActiveTrue(@Param("userId") userId: UserId): Long
}