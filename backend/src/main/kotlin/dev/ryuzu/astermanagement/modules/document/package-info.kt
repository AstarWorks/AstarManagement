/**
 * Document Module for Document Management
 * 
 * This module provides comprehensive document management capabilities including
 * file upload, storage, metadata management, version control, and content processing.
 * 
 * Public API:
 * - {@link dev.ryuzu.astermanagement.modules.document.api.DocumentService} - Core document operations
 * - {@link dev.ryuzu.astermanagement.modules.document.api.DocumentEvents} - Event definitions for inter-module communication
 * - {@link dev.ryuzu.astermanagement.modules.document.api.dto.DocumentDTO} - Data transfer objects
 * 
 * Key Features:
 * - File upload and storage with virus scanning
 * - Document categorization and tagging
 * - Version control and document history
 * - Text extraction and content indexing
 * - Integration with matter management through events
 * 
 * The module follows Spring Modulith conventions with clear separation between:
 * - api: Public interfaces and DTOs accessible to other modules
 * - domain: Internal domain entities and repositories  
 * - infrastructure: Implementation details and external interface adaptations
 * 
 * @since 1.0.0
 */
package dev.ryuzu.astermanagement.modules.document;