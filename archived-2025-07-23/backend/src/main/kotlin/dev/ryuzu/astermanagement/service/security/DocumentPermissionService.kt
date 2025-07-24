package dev.ryuzu.astermanagement.service.security

import dev.ryuzu.astermanagement.modules.document.domain.Document
import dev.ryuzu.astermanagement.modules.document.domain.DocumentRepository
import dev.ryuzu.astermanagement.modules.document.domain.security.*
import dev.ryuzu.astermanagement.domain.user.User
import dev.ryuzu.astermanagement.security.audit.impl.SecurityAuditLogger
import dev.ryuzu.astermanagement.security.rbac.entity.Permission
import dev.ryuzu.astermanagement.security.rbac.service.PermissionUtils
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.util.ClientInfoExtractor
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.CacheEvict
import org.springframework.cache.annotation.Cacheable
import org.springframework.data.repository.findByIdOrNull
import org.springframework.security.core.context.SecurityContextHolder
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.OffsetDateTime
import java.util.*

/**
 * Service for managing document-level permissions and access control
 * Integrates with existing RBAC system and provides granular document security
 */
@Service
@Transactional(readOnly = true)
class DocumentPermissionService(
    private val documentPermissionRepository: DocumentPermissionRuleRepository,
    private val documentRepository: DocumentRepository,
    private val userRepository: UserRepository,
    private val permissionUtils: PermissionUtils,
    private val securityAuditLogger: SecurityAuditLogger,
    private val clientInfoExtractor: ClientInfoExtractor
) {
    
    private val logger = LoggerFactory.getLogger(DocumentPermissionService::class.java)
    
    /**
     * Check if a user can access a document with a specific permission type
     * Combines system-level RBAC with document-specific permissions
     */
    @Cacheable(value = ["documentPermissions"], key = "#documentId + ':' + #userId + ':' + #permissionType")
    fun canAccess(documentId: UUID, userId: UUID, permissionType: DocumentPermissionType): Boolean {
        try {
            val document = documentRepository.findByIdOrNull(documentId)
                ?: return false
            
            val user = userRepository.findByIdOrNull(userId)
                ?: return false
            
            // Check if document is soft-deleted or not available
            if (!isDocumentAccessible(document)) {
                return false
            }
            
            // System administrators always have access
            if (hasSystemPermission(user, Permission.DOCUMENT_ADMIN)) {
                return true
            }
            
            // Check for explicit deny rules first (deny overrides grant)
            if (hasExplicitDeny(documentId, userId, user.getRoleNames(), permissionType)) {
                logAccessAttempt(documentId, userId, permissionType.name, false, "Explicitly denied")
                return false
            }
            
            // Check document-specific permissions
            val hasDocumentPermission = hasDocumentSpecificPermission(documentId, userId, user.getRoleNames(), permissionType)
            
            // Check system-level permissions as fallback
            val hasSystemPermission = hasRequiredSystemPermission(user, document, permissionType)
            
            // Check access level restrictions
            val hasAccessLevelPermission = checkAccessLevelPermission(user, document, permissionType)
            
            val hasAccess = hasDocumentPermission || (hasSystemPermission && hasAccessLevelPermission)
            
            if (hasAccess) {
                logAccessAttempt(documentId, userId, permissionType.name, true, "Access granted")
            } else {
                logAccessAttempt(documentId, userId, permissionType.name, false, "Insufficient permissions")
            }
            
            return hasAccess
            
        } catch (e: Exception) {
            logger.error("Error checking document access for user $userId, document $documentId", e)
            return false
        }
    }
    
    /**
     * Check if a user can perform a specific action on a document (convenience method)
     */
    fun canAccess(documentId: UUID, username: String, action: String): Boolean {
        val user = userRepository.findByUsername(username) ?: return false
        val permissionType = mapActionToPermissionType(action)
        return canAccess(documentId, user.id!!, permissionType)
    }
    
    /**
     * Get all documents a user can access with a specific permission
     */
    @Cacheable(value = ["userDocuments"], key = "#userId + ':' + #permissionType")
    fun getAccessibleDocuments(userId: UUID, permissionType: DocumentPermissionType): List<UUID> {
        val user = userRepository.findByIdOrNull(userId) ?: return emptyList()
        val roleNames = user.getRoleNames()
        
        // Get documents from explicit permissions
        val explicitDocuments = documentPermissionRepository.findDocumentsWithPermission(
            userId, roleNames, permissionType
        )
        
        // For system permissions, get all documents the user can access
        val systemDocuments = if (hasSystemPermissionForType(user, permissionType)) {
            documentRepository.findAllAccessibleDocumentIds(userId, roleNames)
        } else {
            emptyList()
        }
        
        return (explicitDocuments + systemDocuments).distinct()
    }
    
    /**
     * Grant a specific permission to a user for a document
     */
    @Transactional
    @CacheEvict(value = ["documentPermissions", "userDocuments"], allEntries = true)
    fun grantPermission(
        documentId: UUID,
        userId: UUID,
        permissionType: DocumentPermissionType,
        grantedBy: UUID,
        reason: String? = null,
        expiresAt: OffsetDateTime? = null
    ): DocumentPermissionRule {
        
        val document = documentRepository.findByIdOrNull(documentId)
            ?: throw IllegalArgumentException("Document not found: $documentId")
        
        val user = userRepository.findByIdOrNull(userId)
            ?: throw IllegalArgumentException("User not found: $userId")
        
        val grantor = userRepository.findByIdOrNull(grantedBy)
            ?: throw IllegalArgumentException("Grantor not found: $grantedBy")
        
        // Check if grantor has permission to grant this permission
        if (!canManagePermissions(documentId, grantedBy)) {
            throw SecurityException("User $grantedBy cannot grant permissions for document $documentId")
        }
        
        // Deactivate existing permission rule if it exists
        deactivateExistingPermission(documentId, userId, permissionType)
        
        val permissionRule = DocumentPermissionRule().apply {
            this.document = document
            this.user = user
            this.permissionType = permissionType
            this.accessLevel = determineAccessLevel(document)
            this.isGrant = true
            this.isActive = true
            this.expiresAt = expiresAt
            this.reason = reason
            this.grantedBy = grantor
            this.grantedFromIp = getCurrentUserIpAddress()
            this.priority = calculatePriority(permissionType)
        }
        
        val savedRule = documentPermissionRepository.save(permissionRule)
        
        // Log the permission change
        logPermissionChange(documentId, userId, permissionType, "GRANTED", grantedBy, reason)
        
        logger.info("Granted permission ${permissionType.name} for document $documentId to user $userId by $grantedBy")
        
        return savedRule
    }
    
    /**
     * Revoke a specific permission from a user for a document
     */
    @Transactional
    @CacheEvict(value = ["documentPermissions", "userDocuments"], allEntries = true)
    fun revokePermission(
        documentId: UUID,
        userId: UUID? = null,
        roleId: UUID? = null,
        permissionType: DocumentPermissionType,
        revokedBy: UUID,
        reason: String? = null
    ) {
        if (!canManagePermissions(documentId, revokedBy)) {
            throw SecurityException("User $revokedBy cannot revoke permissions for document $documentId")
        }
        
        if (userId != null) {
            deactivateExistingPermission(documentId, userId, permissionType)
        }
        
        // Log the permission change
        if (userId != null) {
            logPermissionChange(documentId, userId, permissionType, "REVOKED", revokedBy, reason)
        }
        
        logger.info("Revoked permission ${permissionType.name} for document $documentId from user $userId by $revokedBy")
    }
    
    /**
     * Get all permission rules for a document
     */
    fun getDocumentPermissions(documentId: UUID): List<DocumentPermissionRule> {
        return documentPermissionRepository.findDocumentPermissions(documentId)
    }
    
    /**
     * Get permission summary for a user and document
     */
    fun getPermissionSummary(documentId: UUID, userId: UUID): Map<DocumentPermissionType, Boolean> {
        val permissions = mutableMapOf<DocumentPermissionType, Boolean>()
        
        DocumentPermissionType.values().forEach { type ->
            permissions[type] = canAccess(documentId, userId, type)
        }
        
        return permissions
    }
    
    /**
     * Check if user can manage permissions for a document
     */
    fun canManagePermissions(documentId: UUID, userId: UUID): Boolean {
        val user = userRepository.findByIdOrNull(userId) ?: return false
        
        return hasSystemPermission(user, Permission.DOCUMENT_ADMIN) ||
               canAccess(documentId, userId, DocumentPermissionType.MANAGE_PERMISSIONS)
    }
    
    /**
     * Bulk permission check for multiple documents
     */
    fun bulkCanAccess(
        documentIds: List<UUID>,
        userId: UUID,
        permissionType: DocumentPermissionType
    ): Map<UUID, Boolean> {
        val user = userRepository.findByIdOrNull(userId) ?: return documentIds.associateWith { false }
        val roleNames = user.getRoleNames()
        
        // Get all permission rules for these documents
        val permissionRules = documentPermissionRepository.findUserPermissionsForDocuments(
            documentIds, userId, roleNames
        )
        
        // Group by document ID
        val rulesByDocument = permissionRules.groupBy { it.document?.id }
        
        return documentIds.associateWith { documentId ->
            evaluatePermission(documentId, userId, permissionType, rulesByDocument[documentId] ?: emptyList())
        }
    }
    
    /**
     * Check if user owns the document (uploaded by them)
     */
    fun isDocumentOwner(documentId: UUID, userId: UUID): Boolean {
        val document = documentRepository.findByIdOrNull(documentId) ?: return false
        return document.uploadedBy?.id == userId
    }
    
    /**
     * Clean up expired permissions
     */
    @Transactional
    @CacheEvict(value = ["documentPermissions", "userDocuments"], allEntries = true)
    fun cleanupExpiredPermissions(): Int {
        val deactivatedCount = documentPermissionRepository.deactivateExpiredPermissions(OffsetDateTime.now())
        
        if (deactivatedCount > 0) {
            logger.info("Deactivated $deactivatedCount expired permission rules")
        }
        
        return deactivatedCount
    }
    
    // Private helper methods
    
    private fun isDocumentAccessible(document: Document): Boolean {
        return document.status == dev.ryuzu.astermanagement.modules.document.domain.DocumentStatus.AVAILABLE
    }
    
    private fun hasExplicitDeny(
        documentId: UUID,
        userId: UUID,
        roleNames: Set<String>,
        permissionType: DocumentPermissionType
    ): Boolean {
        // Check user-specific deny rules
        val userDenyRules = documentPermissionRepository.findActiveUserPermissions(documentId, userId)
            .filter { !it.isGrant && it.permissionType == permissionType }
        
        if (userDenyRules.isNotEmpty()) return true
        
        // Check role-based deny rules
        val roleDenyRules = documentPermissionRepository.findActiveRolePermissions(documentId, roleNames)
            .filter { !it.isGrant && it.permissionType == permissionType }
        
        return roleDenyRules.isNotEmpty()
    }
    
    private fun hasDocumentSpecificPermission(
        documentId: UUID,
        userId: UUID,
        roleNames: Set<String>,
        permissionType: DocumentPermissionType
    ): Boolean {
        // Check user-specific grant rules
        val userGrantRules = documentPermissionRepository.findActiveUserPermissions(documentId, userId)
            .filter { it.isGrant && it.permissionType == permissionType }
        
        if (userGrantRules.isNotEmpty()) return true
        
        // Check role-based grant rules
        val roleGrantRules = documentPermissionRepository.findActiveRolePermissions(documentId, roleNames)
            .filter { it.isGrant && it.permissionType == permissionType }
        
        return roleGrantRules.isNotEmpty()
    }
    
    private fun hasRequiredSystemPermission(user: User, document: Document, permissionType: DocumentPermissionType): Boolean {
        val requiredPermissions = permissionType.getImpliedSystemPermissions()
        
        return requiredPermissions.any { permissionName ->
            val permission = Permission.values().find { it.name == permissionName }
            permission?.let { hasSystemPermission(user, it) } ?: false
        }
    }
    
    private fun checkAccessLevelPermission(user: User, document: Document, permissionType: DocumentPermissionType): Boolean {
        val documentAccessLevel = determineAccessLevel(document)
        
        return when (documentAccessLevel) {
            DocumentAccessLevel.PUBLIC -> true
            DocumentAccessLevel.INTERNAL -> hasSystemPermission(user, Permission.DOCUMENT_READ)
            DocumentAccessLevel.CONFIDENTIAL, DocumentAccessLevel.RESTRICTED -> {
                hasSystemPermission(user, Permission.DOCUMENT_VIEW_SENSITIVE)
            }
        }
    }
    
    private fun hasSystemPermission(user: User, permission: Permission): Boolean {
        // Check based on user's simple role
        return permissionUtils.userRoleHasPermission(user.role, permission)
    }
    
    private fun hasSystemPermissionForType(user: User, permissionType: DocumentPermissionType): Boolean {
        val requiredPermissions = permissionType.getImpliedSystemPermissions()
        
        return requiredPermissions.any { permissionName ->
            val permission = Permission.values().find { it.name == permissionName }
            permission?.let { hasSystemPermission(user, it) } ?: false
        }
    }
    
    private fun determineAccessLevel(document: Document): DocumentAccessLevel {
        return DocumentAccessLevel.determineAccessLevel(
            isConfidential = document.isConfidential,
            hasPrivilegedTags = document.hasTag("privileged") || document.hasTag("attorney-client"),
            isClientDocument = document.matter != null
        )
    }
    
    private fun mapActionToPermissionType(action: String): DocumentPermissionType {
        return when (action.uppercase()) {
            "READ", "VIEW" -> DocumentPermissionType.VIEW
            "DOWNLOAD" -> DocumentPermissionType.DOWNLOAD
            "PRINT" -> DocumentPermissionType.PRINT
            "EXPORT" -> DocumentPermissionType.EXPORT
            "EDIT", "UPDATE" -> DocumentPermissionType.EDIT_METADATA
            "DELETE" -> DocumentPermissionType.DELETE
            "MANAGE_PERMISSIONS" -> DocumentPermissionType.MANAGE_PERMISSIONS
            "SHARE" -> DocumentPermissionType.SHARE_EXTERNAL
            else -> DocumentPermissionType.VIEW
        }
    }
    
    private fun deactivateExistingPermission(
        documentId: UUID,
        userId: UUID,
        permissionType: DocumentPermissionType
    ) {
        val existingRules = documentPermissionRepository.findUserPermissionByType(documentId, userId, permissionType)
        existingRules.forEach { rule ->
            rule.isActive = false
            documentPermissionRepository.save(rule)
        }
    }
    
    private fun calculatePriority(permissionType: DocumentPermissionType): Int {
        return when (permissionType) {
            DocumentPermissionType.MANAGE_PERMISSIONS -> 100
            DocumentPermissionType.DELETE -> 90
            DocumentPermissionType.SHARE_EXTERNAL -> 80
            DocumentPermissionType.EXPORT -> 70
            DocumentPermissionType.REPLACE_CONTENT -> 60
            DocumentPermissionType.EDIT_METADATA -> 50
            DocumentPermissionType.DOWNLOAD -> 40
            DocumentPermissionType.PRINT -> 30
            DocumentPermissionType.VIEW_SENSITIVE -> 20
            DocumentPermissionType.VIEW -> 10
            DocumentPermissionType.VIEW_UNWATERMARKED -> 5
        }
    }
    
    private fun evaluatePermission(
        documentId: UUID,
        userId: UUID,
        permissionType: DocumentPermissionType,
        rules: List<DocumentPermissionRule>
    ): Boolean {
        // Sort by priority (highest first)
        val sortedRules = rules.sortedByDescending { it.priority }
        
        // Check for explicit deny first
        val denyRule = sortedRules.find { !it.isGrant && it.permissionType == permissionType }
        if (denyRule != null) return false
        
        // Check for explicit grant
        val grantRule = sortedRules.find { it.isGrant && it.permissionType == permissionType }
        if (grantRule != null) return true
        
        // Fall back to system permissions
        val user = userRepository.findByIdOrNull(userId) ?: return false
        val document = documentRepository.findByIdOrNull(documentId) ?: return false
        
        return hasRequiredSystemPermission(user, document, permissionType) &&
               checkAccessLevelPermission(user, document, permissionType)
    }
    
    private fun getCurrentUserIpAddress(): String {
        return try {
            clientInfoExtractor.getClientIpAddress(null) // This will need to be handled properly
        } catch (e: Exception) {
            "unknown"
        }
    }
    
    private fun logAccessAttempt(
        documentId: UUID,
        userId: UUID,
        action: String,
        success: Boolean,
        reason: String
    ) {
        try {
            securityAuditLogger.logDataAccess(
                userId = userId.toString(),
                resourceType = "DOCUMENT",
                resourceId = documentId.toString(),
                action = action,
                ipAddress = getCurrentUserIpAddress(),
                userAgent = null, // This would need to be passed from controller
                additionalDetails = mapOf(
                    "success" to success,
                    "reason" to reason,
                    "documentAccessAttempt" to true
                )
            )
        } catch (e: Exception) {
            logger.warn("Failed to log document access attempt", e)
        }
    }
    
    private fun logPermissionChange(
        documentId: UUID,
        userId: UUID,
        permissionType: DocumentPermissionType,
        action: String,
        changedBy: UUID,
        reason: String?
    ) {
        try {
            securityAuditLogger.logDataAccess(
                userId = changedBy.toString(),
                resourceType = "DOCUMENT_PERMISSION",
                resourceId = documentId.toString(),
                action = action,
                ipAddress = getCurrentUserIpAddress(),
                userAgent = null,
                additionalDetails = mapOf(
                    "targetUserId" to userId.toString(),
                    "permissionType" to permissionType.name,
                    "reason" to (reason ?: "No reason provided"),
                    "permissionChange" to true
                )
            )
        } catch (e: Exception) {
            logger.warn("Failed to log permission change", e)
        }
    }
}

// Extension function to get role names from User
private fun User.getRoleNames(): Set<String> {
    // Return the user's role name as a set
    return setOf(this.role.name)
}