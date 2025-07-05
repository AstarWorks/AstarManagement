package dev.ryuzu.astermanagement.security.annotation

import dev.ryuzu.astermanagement.modules.document.domain.security.DocumentPermissionType
import org.springframework.security.access.prepost.PreAuthorize

/**
 * Annotation for document-level access control
 * Provides fine-grained permissions for document operations following Spring Security patterns
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@documentAccessEvaluator.hasAccess(#documentId, authentication, #permission)")
annotation class DocumentAccess(
    /**
     * The required permission type for this operation
     */
    val permission: DocumentPermissionType,
    
    /**
     * Optional Spring Expression Language (SpEL) expression for additional conditions
     * Can reference method parameters and authentication context
     * Example: "#userId == authentication.name"
     */
    val condition: String = "",
    
    /**
     * Whether to allow access if document is not found (default: false)
     */
    val allowIfNotFound: Boolean = false,
    
    /**
     * Custom error message for access denied
     */
    val accessDeniedMessage: String = "Access denied to document",
    
    /**
     * Whether to audit this access attempt (default: true)
     */
    val auditAccess: Boolean = true
)

/**
 * Convenience annotation for document viewing operations
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@documentAccessEvaluator.canView(#documentId, authentication)")
annotation class RequireDocumentView

/**
 * Convenience annotation for document download operations
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@documentAccessEvaluator.canDownload(#documentId, authentication)")
annotation class RequireDocumentDownload

/**
 * Convenience annotation for document export operations
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@documentAccessEvaluator.canExport(#documentId, authentication)")
annotation class RequireDocumentExport

/**
 * Convenience annotation for document editing operations
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@documentAccessEvaluator.canEdit(#documentId, authentication)")
annotation class RequireDocumentEdit

/**
 * Convenience annotation for document deletion operations
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@documentAccessEvaluator.canDelete(#documentId, authentication)")
annotation class RequireDocumentDelete

/**
 * Convenience annotation for document permission management operations
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@documentAccessEvaluator.canManagePermissions(#documentId, authentication)")
annotation class RequireDocumentManage

/**
 * Annotation for operations requiring sensitive document access
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@documentAccessEvaluator.canViewSensitive(#documentId, authentication)")
annotation class RequireSensitiveDocumentAccess

/**
 * Annotation for operations requiring external sharing permissions
 */
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
@PreAuthorize("@documentAccessEvaluator.canShareExternal(#documentId, authentication)")
annotation class RequireDocumentShare