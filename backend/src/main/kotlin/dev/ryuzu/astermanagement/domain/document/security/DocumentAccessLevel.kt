package dev.ryuzu.astermanagement.domain.document.security

/**
 * Document access level classification following legal document security standards
 */
enum class DocumentAccessLevel(
    val level: Int,
    val description: String,
    val requiresWatermark: Boolean,
    val requiresAuditLog: Boolean,
    val requiresApprovalForExport: Boolean
) {
    /**
     * Public documents - no restrictions
     */
    PUBLIC(
        level = 0, 
        description = "Public documents accessible to all authorized users",
        requiresWatermark = false,
        requiresAuditLog = true,
        requiresApprovalForExport = false
    ),
    
    /**
     * Internal documents - standard business documents
     */
    INTERNAL(
        level = 1,
        description = "Internal business documents for organization use",
        requiresWatermark = true,
        requiresAuditLog = true,
        requiresApprovalForExport = false
    ),
    
    /**
     * Confidential documents - sensitive business information
     */
    CONFIDENTIAL(
        level = 2,
        description = "Confidential documents requiring elevated permissions",
        requiresWatermark = true,
        requiresAuditLog = true,
        requiresApprovalForExport = true
    ),
    
    /**
     * Restricted documents - highly sensitive legal or privileged information
     */
    RESTRICTED(
        level = 3,
        description = "Restricted documents with maximum security requirements",
        requiresWatermark = true,
        requiresAuditLog = true,
        requiresApprovalForExport = true
    );
    
    /**
     * Check if this access level allows access to documents of another level
     * Higher levels can access lower level documents, but not vice versa
     */
    fun canAccess(documentLevel: DocumentAccessLevel): Boolean {
        return this.level >= documentLevel.level
    }
    
    /**
     * Get the minimum permission required to view documents of this access level
     */
    fun getRequiredViewPermission(): String {
        return when (this) {
            PUBLIC -> "DOCUMENT_READ"
            INTERNAL -> "DOCUMENT_READ"
            CONFIDENTIAL -> "DOCUMENT_VIEW_SENSITIVE"
            RESTRICTED -> "DOCUMENT_VIEW_SENSITIVE"
        }
    }
    
    /**
     * Check if export requires approval for this access level
     */
    fun requiresExportApproval(): Boolean = requiresApprovalForExport
    
    /**
     * Get watermark text for documents of this access level
     */
    fun getWatermarkText(): String? {
        return when (this) {
            PUBLIC -> null
            INTERNAL -> "INTERNAL USE ONLY"
            CONFIDENTIAL -> "CONFIDENTIAL"
            RESTRICTED -> "RESTRICTED - ATTORNEY-CLIENT PRIVILEGE"
        }
    }
    
    companion object {
        /**
         * Get the appropriate access level based on document metadata
         */
        fun determineAccessLevel(
            isConfidential: Boolean,
            hasPrivilegedTags: Boolean,
            isClientDocument: Boolean
        ): DocumentAccessLevel {
            return when {
                hasPrivilegedTags -> RESTRICTED
                isConfidential -> CONFIDENTIAL
                isClientDocument -> INTERNAL
                else -> PUBLIC
            }
        }
        
        /**
         * Get all access levels that can be accessed by a given level
         */
        fun getAccessibleLevels(userLevel: DocumentAccessLevel): List<DocumentAccessLevel> {
            return values().filter { userLevel.canAccess(it) }
        }
    }
}