package dev.ryuzu.astermanagement.domain.document.security

import org.springframework.data.jpa.repository.JpaRepository
import org.springframework.data.jpa.repository.Modifying
import org.springframework.data.jpa.repository.Query
import org.springframework.data.repository.query.Param
import org.springframework.stereotype.Repository
import java.time.OffsetDateTime
import java.util.*

/**
 * Repository for DocumentPermissionRule entity with optimized queries for permission checking
 */
@Repository
interface DocumentPermissionRuleRepository : JpaRepository<DocumentPermissionRule, UUID> {
    
    /**
     * Find all active permission rules for a specific document and user
     * Used for direct permission evaluation
     */
    @Query("""
        SELECT dpr FROM DocumentPermissionRule dpr
        WHERE dpr.document.id = :documentId 
        AND dpr.user.id = :userId
        AND dpr.isActive = true
        AND (dpr.expiresAt IS NULL OR dpr.expiresAt > :currentTime)
        ORDER BY dpr.priority DESC, dpr.createdAt DESC
    """)
    fun findActiveUserPermissions(
        @Param("documentId") documentId: UUID,
        @Param("userId") userId: UUID,
        @Param("currentTime") currentTime: OffsetDateTime = OffsetDateTime.now()
    ): List<DocumentPermissionRule>
    
    /**
     * Find all active role-based permission rules for a document and roles
     * Used for role-based permission evaluation
     */
    @Query("""
        SELECT dpr FROM DocumentPermissionRule dpr
        WHERE dpr.document.id = :documentId 
        AND dpr.role.name IN :roleNames
        AND dpr.isActive = true
        AND (dpr.expiresAt IS NULL OR dpr.expiresAt > :currentTime)
        ORDER BY dpr.priority DESC, dpr.createdAt DESC
    """)
    fun findActiveRolePermissions(
        @Param("documentId") documentId: UUID,
        @Param("roleNames") roleNames: Set<String>,
        @Param("currentTime") currentTime: OffsetDateTime = OffsetDateTime.now()
    ): List<DocumentPermissionRule>
    
    /**
     * Find all permission rules for a user across multiple documents
     * Used for bulk permission evaluation
     */
    @Query("""
        SELECT dpr FROM DocumentPermissionRule dpr
        WHERE dpr.document.id IN :documentIds
        AND (dpr.user.id = :userId OR dpr.role.name IN :roleNames)
        AND dpr.isActive = true
        AND (dpr.expiresAt IS NULL OR dpr.expiresAt > :currentTime)
        ORDER BY dpr.document.id, dpr.priority DESC
    """)
    fun findUserPermissionsForDocuments(
        @Param("documentIds") documentIds: List<UUID>,
        @Param("userId") userId: UUID,
        @Param("roleNames") roleNames: Set<String>,
        @Param("currentTime") currentTime: OffsetDateTime = OffsetDateTime.now()
    ): List<DocumentPermissionRule>
    
    /**
     * Find specific permission type for a document and user
     */
    @Query("""
        SELECT dpr FROM DocumentPermissionRule dpr
        WHERE dpr.document.id = :documentId
        AND dpr.user.id = :userId
        AND dpr.permissionType = :permissionType
        AND dpr.isActive = true
        AND (dpr.expiresAt IS NULL OR dpr.expiresAt > :currentTime)
        ORDER BY dpr.priority DESC
    """)
    fun findUserPermissionByType(
        @Param("documentId") documentId: UUID,
        @Param("userId") userId: UUID,
        @Param("permissionType") permissionType: DocumentPermissionType,
        @Param("currentTime") currentTime: OffsetDateTime = OffsetDateTime.now()
    ): List<DocumentPermissionRule>
    
    /**
     * Find all permission rules for a document (for permission management)
     */
    @Query("""
        SELECT dpr FROM DocumentPermissionRule dpr
        WHERE dpr.document.id = :documentId
        AND dpr.isActive = true
        ORDER BY dpr.priority DESC, dpr.createdAt DESC
    """)
    fun findDocumentPermissions(@Param("documentId") documentId: UUID): List<DocumentPermissionRule>
    
    /**
     * Check if a specific permission exists for a user
     */
    @Query("""
        SELECT COUNT(dpr) > 0 FROM DocumentPermissionRule dpr
        WHERE dpr.document.id = :documentId
        AND dpr.user.id = :userId
        AND dpr.permissionType = :permissionType
        AND dpr.isGrant = true
        AND dpr.isActive = true
        AND (dpr.expiresAt IS NULL OR dpr.expiresAt > :currentTime)
    """)
    fun hasUserPermission(
        @Param("documentId") documentId: UUID,
        @Param("userId") userId: UUID,
        @Param("permissionType") permissionType: DocumentPermissionType,
        @Param("currentTime") currentTime: OffsetDateTime = OffsetDateTime.now()
    ): Boolean
    
    /**
     * Check if a permission is explicitly denied for a user
     */
    @Query("""
        SELECT COUNT(dpr) > 0 FROM DocumentPermissionRule dpr
        WHERE dpr.document.id = :documentId
        AND dpr.user.id = :userId
        AND dpr.permissionType = :permissionType
        AND dpr.isGrant = false
        AND dpr.isActive = true
        AND (dpr.expiresAt IS NULL OR dpr.expiresAt > :currentTime)
    """)
    fun isUserPermissionDenied(
        @Param("documentId") documentId: UUID,
        @Param("userId") userId: UUID,
        @Param("permissionType") permissionType: DocumentPermissionType,
        @Param("currentTime") currentTime: OffsetDateTime = OffsetDateTime.now()
    ): Boolean
    
    /**
     * Find expired permission rules for cleanup
     */
    @Query("""
        SELECT dpr FROM DocumentPermissionRule dpr
        WHERE dpr.expiresAt IS NOT NULL
        AND dpr.expiresAt <= :cutoffTime
        AND dpr.isActive = true
    """)
    fun findExpiredPermissions(@Param("cutoffTime") cutoffTime: OffsetDateTime): List<DocumentPermissionRule>
    
    /**
     * Deactivate expired permission rules
     */
    @Modifying
    @Query("""
        UPDATE DocumentPermissionRule dpr 
        SET dpr.isActive = false
        WHERE dpr.expiresAt IS NOT NULL
        AND dpr.expiresAt <= :cutoffTime
        AND dpr.isActive = true
    """)
    fun deactivateExpiredPermissions(@Param("cutoffTime") cutoffTime: OffsetDateTime): Int
    
    /**
     * Find all documents a user has specific permission for
     */
    @Query("""
        SELECT DISTINCT dpr.document.id FROM DocumentPermissionRule dpr
        WHERE (dpr.user.id = :userId OR dpr.role.name IN :roleNames)
        AND dpr.permissionType = :permissionType
        AND dpr.isGrant = true
        AND dpr.isActive = true
        AND (dpr.expiresAt IS NULL OR dpr.expiresAt > :currentTime)
    """)
    fun findDocumentsWithPermission(
        @Param("userId") userId: UUID,
        @Param("roleNames") roleNames: Set<String>,
        @Param("permissionType") permissionType: DocumentPermissionType,
        @Param("currentTime") currentTime: OffsetDateTime = OffsetDateTime.now()
    ): List<UUID>
    
    /**
     * Count permission rules by type for analytics
     */
    @Query("""
        SELECT dpr.permissionType, COUNT(dpr) 
        FROM DocumentPermissionRule dpr
        WHERE dpr.isActive = true
        GROUP BY dpr.permissionType
    """)
    fun countPermissionsByType(): List<Array<Any>>
    
    /**
     * Find permission rules granted by a specific user
     */
    @Query("""
        SELECT dpr FROM DocumentPermissionRule dpr
        WHERE dpr.grantedBy.id = :grantedById
        AND dpr.isActive = true
        ORDER BY dpr.createdAt DESC
    """)
    fun findPermissionsGrantedBy(@Param("grantedById") grantedById: UUID): List<DocumentPermissionRule>
    
    /**
     * Find permission rules with inheritance from parent
     */
    @Query("""
        SELECT dpr FROM DocumentPermissionRule dpr
        WHERE dpr.inheritsFromParent = true
        AND dpr.isActive = true
        ORDER BY dpr.document.id, dpr.priority DESC
    """)
    fun findInheritedPermissions(): List<DocumentPermissionRule>
}