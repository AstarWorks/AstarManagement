package dev.ryuzu.astermanagement.modules.document.domain.security

import dev.ryuzu.astermanagement.domain.common.BaseEntity
import dev.ryuzu.astermanagement.modules.document.domain.Document
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.security.rbac.entity.Role
import jakarta.persistence.*
import java.time.OffsetDateTime
import java.util.*

/**
 * Entity representing granular document-level permission rules
 * Provides fine-grained access control beyond basic RBAC permissions
 */
@Entity
@Table(
    name = "document_permission_rules",
    indexes = [
        Index(name = "idx_doc_permission_document", columnList = "document_id"),
        Index(name = "idx_doc_permission_user", columnList = "user_id"),
        Index(name = "idx_doc_permission_role", columnList = "role_id"),
        Index(name = "idx_doc_permission_type", columnList = "permission_type"),
        Index(name = "idx_doc_permission_active", columnList = "is_active"),
        Index(name = "idx_doc_permission_expires", columnList = "expires_at"),
        // Composite indexes for common queries
        Index(name = "idx_doc_permission_lookup", columnList = "document_id,user_id,is_active"),
        Index(name = "idx_doc_permission_role_lookup", columnList = "document_id,role_id,is_active")
    ],
    uniqueConstraints = [
        UniqueConstraint(
            name = "uk_doc_permission_user",
            columnNames = ["document_id", "user_id", "permission_type"]
        ),
        UniqueConstraint(
            name = "uk_doc_permission_role", 
            columnNames = ["document_id", "role_id", "permission_type"]
        )
    ]
)
class DocumentPermissionRule : BaseEntity() {
    
    @ManyToOne(fetch = FetchType.LAZY, optional = false)
    @JoinColumn(name = "document_id", nullable = false)
    var document: Document? = null
    
    /**
     * User-specific permission (mutually exclusive with role)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "user_id")
    var user: User? = null
    
    /**
     * Role-based permission (mutually exclusive with user)
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "role_id")
    var role: Role? = null
    
    @Enumerated(EnumType.STRING)
    @Column(name = "permission_type", nullable = false, length = 50)
    var permissionType: DocumentPermissionType = DocumentPermissionType.VIEW
    
    @Enumerated(EnumType.STRING)
    @Column(name = "access_level", nullable = false, length = 20)
    var accessLevel: DocumentAccessLevel = DocumentAccessLevel.PUBLIC
    
    /**
     * Whether this rule grants or denies access
     */
    @Column(name = "is_grant", nullable = false)
    var isGrant: Boolean = true
    
    /**
     * Whether this permission rule is currently active
     */
    @Column(name = "is_active", nullable = false)
    var isActive: Boolean = true
    
    /**
     * Optional expiration date for temporary permissions
     */
    @Column(name = "expires_at")
    var expiresAt: OffsetDateTime? = null
    
    /**
     * Reason for granting/denying this permission
     */
    @Column(name = "reason", length = 500)
    var reason: String? = null
    
    /**
     * User who granted this permission
     */
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "granted_by")
    var grantedBy: User? = null
    
    /**
     * IP address from which the permission was granted
     */
    @Column(name = "granted_from_ip", length = 45)
    var grantedFromIp: String? = null
    
    /**
     * Additional conditions for permission evaluation (JSON)
     */
    @Column(name = "conditions", columnDefinition = "TEXT")
    var conditions: String? = null
    
    /**
     * Whether this permission inherits from parent folder
     */
    @Column(name = "inherits_from_parent", nullable = false)
    var inheritsFromParent: Boolean = false
    
    /**
     * Priority for conflict resolution (higher number = higher priority)
     */
    @Column(name = "priority", nullable = false)
    var priority: Int = 0
    
    /**
     * Check if this permission rule is currently valid
     */
    fun isValid(): Boolean {
        if (!isActive) return false
        if (expiresAt != null && expiresAt!!.isBefore(OffsetDateTime.now())) return false
        return true
    }
    
    /**
     * Check if this rule applies to a specific user
     */
    fun appliesTo(userId: UUID, userRoles: Set<String>): Boolean {
        if (!isValid()) return false
        
        // User-specific rule
        if (user != null) {
            return user!!.id == userId
        }
        
        // Role-based rule
        if (role != null) {
            return userRoles.contains(role!!.name)
        }
        
        return false
    }
    
    /**
     * Get the effective permission type as string
     */
    fun getEffectivePermission(): String {
        return if (isGrant) permissionType.name else "DENY_${permissionType.name}"
    }
    
    /**
     * Check if this is a user-specific rule
     */
    fun isUserSpecific(): Boolean = user != null
    
    /**
     * Check if this is a role-based rule
     */
    fun isRoleBased(): Boolean = role != null
    
    /**
     * Get the subject of this permission rule (user or role name)
     */
    fun getSubject(): String {
        return when {
            user != null -> "User: ${user!!.email}"
            role != null -> "Role: ${role!!.name}"
            else -> "Unknown"
        }
    }
    
    /**
     * Create audit trail information for this permission rule
     */
    fun toAuditDetails(): Map<String, Any> {
        return mapOf(
            "documentId" to (document?.id ?: "unknown"),
            "subject" to getSubject(),
            "permissionType" to permissionType.name,
            "accessLevel" to accessLevel.name,
            "isGrant" to isGrant,
            "priority" to priority,
            "expiresAt" to (expiresAt?.toString() ?: "never"),
            "reason" to (reason ?: "no reason provided")
        )
    }
}

/**
 * Types of document permissions that can be granted or denied
 */
enum class DocumentPermissionType(
    val description: String,
    val impliesPermissions: List<String> = emptyList()
) {
    /**
     * Permission to view document metadata and content
     */
    VIEW("View document content", listOf("DOCUMENT_READ")),
    
    /**
     * Permission to download the document file
     */
    DOWNLOAD("Download document file", listOf("DOCUMENT_READ")),
    
    /**
     * Permission to print the document
     */
    PRINT("Print document", listOf("DOCUMENT_READ")),
    
    /**
     * Permission to export document in various formats
     */
    EXPORT("Export document", listOf("DOCUMENT_EXPORT")),
    
    /**
     * Permission to edit document metadata
     */
    EDIT_METADATA("Edit document metadata", listOf("DOCUMENT_UPDATE")),
    
    /**
     * Permission to replace document content
     */
    REPLACE_CONTENT("Replace document content", listOf("DOCUMENT_UPDATE")),
    
    /**
     * Permission to delete the document
     */
    DELETE("Delete document", listOf("DOCUMENT_DELETE")),
    
    /**
     * Permission to manage document permissions
     */
    MANAGE_PERMISSIONS("Manage document permissions", listOf("DOCUMENT_ADMIN")),
    
    /**
     * Permission to view sensitive document content
     */
    VIEW_SENSITIVE("View sensitive content", listOf("DOCUMENT_VIEW_SENSITIVE")),
    
    /**
     * Permission to share document with external parties
     */
    SHARE_EXTERNAL("Share with external parties", listOf("DOCUMENT_EXPORT_UNRESTRICTED")),
    
    /**
     * Permission to view document without watermarks
     */
    VIEW_UNWATERMARKED("View without watermarks", listOf("DOCUMENT_WATERMARK_BYPASS"));
    
    /**
     * Check if this permission type requires a specific system permission
     */
    fun requiresSystemPermission(systemPermission: String): Boolean {
        return impliesPermissions.contains(systemPermission)
    }
    
    /**
     * Get all system permissions implied by this document permission
     */
    fun getImpliedSystemPermissions(): List<String> = impliesPermissions
    
    /**
     * Get the minimum access level required for this permission
     */
    fun getMinimumAccessLevel(): DocumentAccessLevel {
        return when (this) {
            VIEW, DOWNLOAD, PRINT -> DocumentAccessLevel.PUBLIC
            EDIT_METADATA -> DocumentAccessLevel.INTERNAL
            VIEW_SENSITIVE, EXPORT, SHARE_EXTERNAL -> DocumentAccessLevel.CONFIDENTIAL
            VIEW_UNWATERMARKED, REPLACE_CONTENT, DELETE, MANAGE_PERMISSIONS -> DocumentAccessLevel.RESTRICTED
        }
    }
    
    /**
     * Check if this permission requires audit logging
     */
    fun requiresAuditLog(): Boolean {
        return when (this) {
            VIEW -> false // Basic view might be too verbose to audit
            else -> true // All other operations should be audited
        }
    }
    
    /**
     * Get permission priority for conflict resolution (higher numbers = higher priority)
     */
    fun getPriority(): Int {
        return when (this) {
            MANAGE_PERMISSIONS -> 100
            DELETE -> 90
            SHARE_EXTERNAL -> 80
            EXPORT -> 70
            REPLACE_CONTENT -> 60
            EDIT_METADATA -> 50
            DOWNLOAD -> 40
            PRINT -> 30
            VIEW_SENSITIVE -> 20
            VIEW -> 10
            VIEW_UNWATERMARKED -> 5
        }
    }
}