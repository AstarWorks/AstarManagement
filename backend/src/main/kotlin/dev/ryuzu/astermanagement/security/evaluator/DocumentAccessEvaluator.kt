package dev.ryuzu.astermanagement.security.evaluator

import dev.ryuzu.astermanagement.domain.document.security.DocumentPermissionType
import dev.ryuzu.astermanagement.security.audit.impl.SecurityAuditLogger
import dev.ryuzu.astermanagement.service.security.DocumentPermissionService
import dev.ryuzu.astermanagement.domain.user.UserRepository
import dev.ryuzu.astermanagement.util.ClientInfoExtractor
import org.slf4j.LoggerFactory
import org.springframework.security.core.Authentication
import org.springframework.stereotype.Component
import jakarta.servlet.http.HttpServletRequest
import java.util.*

/**
 * Evaluator for document access permissions in Spring Security expressions
 * Integrates with @PreAuthorize annotations for method-level security
 */
@Component("documentAccessEvaluator")
class DocumentAccessEvaluator(
    private val documentPermissionService: DocumentPermissionService,
    private val userRepository: UserRepository,
    private val securityAuditLogger: SecurityAuditLogger,
    private val clientInfoExtractor: ClientInfoExtractor,
    private val request: HttpServletRequest?
) {
    
    private val logger = LoggerFactory.getLogger(DocumentAccessEvaluator::class.java)
    
    /**
     * Main method for evaluating document access in @PreAuthorize expressions
     * Used in annotation: @PreAuthorize("@documentAccessEvaluator.hasAccess(#documentId, authentication, #permission)")
     */
    fun hasAccess(documentId: String?, authentication: Authentication?, permission: DocumentPermissionType): Boolean {
        if (documentId.isNullOrBlank() || authentication == null) {
            logger.debug("Document access denied: missing documentId or authentication")
            return false
        }
        
        return try {
            val username = authentication.name
            val user = userRepository.findByUsername(username)
            
            if (user == null) {
                logger.warn("Document access denied: user not found for username: $username")
                return false
            }
            
            val documentUuid = UUID.fromString(documentId)
            val hasAccess = documentPermissionService.canAccess(documentUuid, user.id!!, permission)
            
            // Audit the access attempt
            auditDocumentAccess(documentId, user.id!!.toString(), permission, hasAccess, "Method security check")
            
            if (!hasAccess) {
                logger.debug("Document access denied for user {} on document {} with permission {}", 
                    username, documentId, permission.name)
            }
            
            hasAccess
            
        } catch (e: Exception) {
            logger.error("Error evaluating document access for documentId: $documentId", e)
            false
        }
    }
    
    /**
     * Convenience method for view access (most common operation)
     */
    fun canView(documentId: String?, authentication: Authentication?): Boolean {
        return hasAccess(documentId, authentication, DocumentPermissionType.VIEW)
    }
    
    /**
     * Convenience method for download access
     */
    fun canDownload(documentId: String?, authentication: Authentication?): Boolean {
        return hasAccess(documentId, authentication, DocumentPermissionType.DOWNLOAD)
    }
    
    /**
     * Convenience method for export access
     */
    fun canExport(documentId: String?, authentication: Authentication?): Boolean {
        return hasAccess(documentId, authentication, DocumentPermissionType.EXPORT)
    }
    
    /**
     * Convenience method for edit access
     */
    fun canEdit(documentId: String?, authentication: Authentication?): Boolean {
        return hasAccess(documentId, authentication, DocumentPermissionType.EDIT_METADATA)
    }
    
    /**
     * Convenience method for delete access
     */
    fun canDelete(documentId: String?, authentication: Authentication?): Boolean {
        return hasAccess(documentId, authentication, DocumentPermissionType.DELETE)
    }
    
    /**
     * Convenience method for permission management access
     */
    fun canManagePermissions(documentId: String?, authentication: Authentication?): Boolean {
        return hasAccess(documentId, authentication, DocumentPermissionType.MANAGE_PERMISSIONS)
    }
    
    /**
     * Check if user can access sensitive document content
     */
    fun canViewSensitive(documentId: String?, authentication: Authentication?): Boolean {
        return hasAccess(documentId, authentication, DocumentPermissionType.VIEW_SENSITIVE)
    }
    
    /**
     * Check if user can share document externally
     */
    fun canShareExternal(documentId: String?, authentication: Authentication?): Boolean {
        return hasAccess(documentId, authentication, DocumentPermissionType.SHARE_EXTERNAL)
    }
    
    /**
     * Check if user owns the document (uploaded by them)
     */
    fun isDocumentOwner(documentId: String?, authentication: Authentication?): Boolean {
        if (documentId.isNullOrBlank() || authentication == null) {
            return false
        }
        
        return try {
            val username = authentication.name
            val user = userRepository.findByUsername(username) ?: return false
            
            val documentUuid = UUID.fromString(documentId)
            documentPermissionService.isDocumentOwner(documentUuid, user.id!!)
            
        } catch (e: Exception) {
            logger.error("Error checking document ownership for documentId: $documentId", e)
            false
        }
    }
    
    /**
     * Check if user has any access to the document (for basic visibility checks)
     */
    fun hasAnyAccess(documentId: String?, authentication: Authentication?): Boolean {
        if (documentId.isNullOrBlank() || authentication == null) {
            return false
        }
        
        // Check the most basic permission - VIEW
        return hasAccess(documentId, authentication, DocumentPermissionType.VIEW)
    }
    
    /**
     * Bulk access check for multiple documents
     */
    fun hasAccessToAll(documentIds: List<String>?, authentication: Authentication?, permission: DocumentPermissionType): Boolean {
        if (documentIds.isNullOrEmpty() || authentication == null) {
            return false
        }
        
        return try {
            val username = authentication.name
            val user = userRepository.findByUsername(username) ?: return false
            
            val documentUuids = documentIds.map { UUID.fromString(it) }
            val accessResults = documentPermissionService.bulkCanAccess(documentUuids, user.id!!, permission)
            val hasAccessToAll = accessResults.values.all { it }
            
            // Audit bulk access attempt
            auditBulkDocumentAccess(documentIds, user.id!!.toString(), permission, hasAccessToAll)
            
            hasAccessToAll
            
        } catch (e: Exception) {
            logger.error("Error evaluating bulk document access", e)
            false
        }
    }
    
    /**
     * Check if user has access to any of the specified documents
     */
    fun hasAccessToAny(documentIds: List<String>?, authentication: Authentication?, permission: DocumentPermissionType): Boolean {
        if (documentIds.isNullOrEmpty() || authentication == null) {
            return false
        }
        
        return try {
            val username = authentication.name
            val user = userRepository.findByUsername(username) ?: return false
            
            val documentUuids = documentIds.map { UUID.fromString(it) }
            val accessResults = documentPermissionService.bulkCanAccess(documentUuids, user.id!!, permission)
            accessResults.values.any { it }
            
        } catch (e: Exception) {
            logger.error("Error evaluating bulk document access", e)
            false
        }
    }
    
    /**
     * Check access with additional custom conditions
     */
    fun hasAccessWithCondition(
        documentId: String?, 
        authentication: Authentication?, 
        permission: DocumentPermissionType,
        condition: (String, String) -> Boolean
    ): Boolean {
        if (!hasAccess(documentId, authentication, permission)) {
            return false
        }
        
        val username = authentication?.name ?: return false
        return condition(documentId!!, username)
    }
    
    /**
     * Get user's effective permissions for a document
     */
    fun getEffectivePermissions(documentId: String?, authentication: Authentication?): Map<DocumentPermissionType, Boolean> {
        if (documentId.isNullOrBlank() || authentication == null) {
            return DocumentPermissionType.values().associateWith { false }
        }
        
        return try {
            val username = authentication.name
            val user = userRepository.findByUsername(username) ?: return DocumentPermissionType.values().associateWith { false }
            
            val documentUuid = UUID.fromString(documentId)
            documentPermissionService.getPermissionSummary(documentUuid, user.id!!)
            
        } catch (e: Exception) {
            logger.error("Error getting effective permissions for documentId: $documentId", e)
            DocumentPermissionType.values().associateWith { false }
        }
    }
    
    // Private helper methods
    
    private fun auditDocumentAccess(
        documentId: String,
        userId: String,
        permission: DocumentPermissionType,
        success: Boolean,
        context: String
    ) {
        try {
            val ipAddress = getCurrentUserIpAddress()
            val userAgent = getCurrentUserAgent()
            
            securityAuditLogger.logDataAccess(
                userId = userId,
                resourceType = "DOCUMENT",
                resourceId = documentId,
                action = permission.name,
                ipAddress = ipAddress,
                userAgent = userAgent,
                additionalDetails = mapOf(
                    "success" to success,
                    "context" to context,
                    "permissionType" to permission.name,
                    "evaluationSource" to "DocumentAccessEvaluator"
                )
            )
        } catch (e: Exception) {
            logger.warn("Failed to audit document access attempt", e)
        }
    }
    
    private fun auditBulkDocumentAccess(
        documentIds: List<String>,
        userId: String,
        permission: DocumentPermissionType,
        success: Boolean
    ) {
        try {
            val ipAddress = getCurrentUserIpAddress()
            val userAgent = getCurrentUserAgent()
            
            securityAuditLogger.logDataAccess(
                userId = userId,
                resourceType = "DOCUMENT_BULK",
                resourceId = documentIds.joinToString(","),
                action = "BULK_${permission.name}",
                ipAddress = ipAddress,
                userAgent = userAgent,
                additionalDetails = mapOf(
                    "success" to success,
                    "documentCount" to documentIds.size,
                    "permissionType" to permission.name,
                    "evaluationSource" to "DocumentAccessEvaluator"
                )
            )
        } catch (e: Exception) {
            logger.warn("Failed to audit bulk document access attempt", e)
        }
    }
    
    private fun getCurrentUserIpAddress(): String {
        return try {
            clientInfoExtractor.getClientIpAddress(request)
        } catch (e: Exception) {
            "unknown"
        }
    }
    
    private fun getCurrentUserAgent(): String? {
        return try {
            clientInfoExtractor.getUserAgent(request)
        } catch (e: Exception) {
            null
        }
    }
}