---
task_id: T07A_S07
sprint_sequence_id: S07
status: open
complexity: Medium
last_updated: 2025-07-01T12:00:00Z
---

# Task: Backend Version Control Core

## Description

Implement the core backend infrastructure for document version control in the Aster Management legal case management platform. This task focuses on building the foundational data model, repository layer, and core API endpoints for version operations. The implementation will provide automatic version creation, storage mechanisms, and basic version management capabilities while integrating seamlessly with the existing audit framework and permission system.

This task establishes the backend foundation that will support advanced features like branching, merging, and conflict resolution in subsequent tasks. The focus is on creating a robust, performant, and scalable backend system that can handle large legal documents while maintaining full audit compliance.

## Goal / Objectives

- **Core Infrastructure**: Build DocumentVersion entity with comprehensive audit integration and compliance features
- **Storage Optimization**: Implement efficient diff storage using JSONB with delta compression for large documents
- **Repository Layer**: Create optimized repository interfaces with proper indexing for version queries
- **API Foundation**: Build REST API endpoints for core version operations (create, read, compare, rollback)
- **Database Migration**: Design and implement database schema with performance-optimized indexes
- **Service Integration**: Integrate with existing audit system, permission framework, and event-driven architecture
- **Performance**: Optimize for handling documents up to 100MB with efficient storage and retrieval

## Acceptance Criteria

### Core Data Model
- [ ] DocumentVersion entity implemented following BaseEntity pattern with comprehensive audit fields
- [ ] Immutable version storage with legal compliance features (retention policies, legal hold)
- [ ] JSONB diff storage with proper PostgreSQL optimization and indexing
- [ ] Version numbering system with semantic versioning (major.minor.patch) support
- [ ] Content hash verification using SHA-256 for data integrity
- [ ] Parent-child relationship tracking for version lineage
- [ ] Proper foreign key constraints and referential integrity

### Repository Layer
- [ ] DocumentVersionRepository with custom query methods for version operations
- [ ] Optimized queries for version history with pagination support
- [ ] Performance indexes for common query patterns (document_id, created_at, parent_version)
- [ ] Bulk operations support for version maintenance and cleanup
- [ ] Transactional safety for all repository operations

### Service Layer
- [ ] DocumentVersionService following existing service patterns with proper transaction management
- [ ] Automatic version creation with configurable triggers and policies
- [ ] Version comparison service with multiple diff algorithms (text, binary, metadata)
- [ ] Rollback functionality with transaction safety and audit compliance
- [ ] Integration with AuditEventPublisher for comprehensive audit trails
- [ ] Permission checks using existing RBAC system for all operations

### API Endpoints
- [ ] GET /api/v1/documents/{id}/versions - Version history with pagination
- [ ] POST /api/v1/documents/{id}/versions - Create new version
- [ ] GET /api/v1/documents/{id}/versions/{versionId} - Get specific version
- [ ] GET /api/v1/documents/{id}/versions/compare - Compare versions with diff data
- [ ] POST /api/v1/documents/{id}/versions/{versionId}/rollback - Rollback to version
- [ ] All endpoints follow existing controller patterns with proper error handling
- [ ] OpenAPI documentation with comprehensive examples

### Database Schema
- [ ] Migration script V012__Create_document_versions_table.sql implemented
- [ ] Performance-optimized indexes for version queries
- [ ] Proper constraints for data integrity and consistency
- [ ] JSONB storage configuration optimized for diff data
- [ ] Rollback capability for migration if needed

### Integration
- [ ] Seamless integration with existing audit system and event publishing
- [ ] Permission system integration using existing RBAC patterns
- [ ] Event-driven architecture publishing version events for downstream processing
- [ ] Transaction management consistent with existing service patterns

## Subtasks

### Phase 1: Data Model and Schema Design
- [ ] **T07A.01**: Design DocumentVersion entity following BaseEntity pattern
  - Extend BaseEntity with version-specific audit fields (createdAt, createdBy, etc.)
  - Add immutability constraints following AuditLog.kt pattern
  - Implement version numbering with semantic versioning support
  - Add content hash field for integrity verification
  - Include retention and legal hold fields for compliance

- [ ] **T07A.02**: Create database migration script for version control tables
  - Design document_versions table with optimized schema
  - Add proper foreign key constraints to existing documents table
  - Create performance indexes for common query patterns
  - Include JSONB configuration for diff data storage
  - Add database constraints for data integrity

- [ ] **T07A.03**: Implement DocumentVersionRepository with optimized queries
  - Create repository interface extending JpaRepository
  - Add custom query methods for version history operations
  - Implement pagination support for large version histories
  - Add bulk operations for maintenance and cleanup
  - Include query optimization with proper fetch strategies

### Phase 2: Core Service Layer
- [ ] **T07A.04**: Implement DocumentVersionService following service patterns
  - Create service interface with comprehensive version operations
  - Implement transaction management following existing patterns
  - Add proper error handling with custom exceptions
  - Include logging and metrics collection
  - Follow existing service patterns from MatterServiceImpl.kt

- [ ] **T07A.05**: Create automatic version creation triggers
  - Implement event listeners for document modification events
  - Add configurable version creation policies (auto, manual, time-based)
  - Include version metadata extraction and storage
  - Add version compression and optimization
  - Follow AuditEventPublisher.kt pattern for event handling

- [ ] **T07A.06**: Implement diff calculation service for content changes
  - Create DiffCalculationService with multiple algorithms
  - Implement text diff using Myers algorithm for document content
  - Add binary diff using delta compression for non-text files
  - Include metadata diff for document properties
  - Optimize for large documents with streaming and chunking

### Phase 3: API Layer Implementation
- [ ] **T07A.07**: Create DocumentVersionController following REST patterns
  - Implement version CRUD endpoints with proper HTTP status codes
  - Add request/response DTOs with validation
  - Include proper error handling and response formatting
  - Follow existing controller patterns from MatterController.kt
  - Add comprehensive logging and metrics

- [ ] **T07A.08**: Implement version comparison and visualization endpoints
  - Create version comparison API with configurable diff formats
  - Add version statistics and metadata endpoints
  - Implement bulk version operations for performance
  - Include proper caching headers for static version data
  - Add rate limiting for expensive operations

- [ ] **T07A.09**: Add rollback functionality with transaction safety
  - Implement rollback endpoint with proper validation
  - Add rollback permission checks and audit logging
  - Include rollback impact assessment and warnings
  - Add transaction rollback on failure
  - Implement rollback history tracking

### Phase 4: Integration and Security
- [ ] **T07A.10**: Integrate with existing audit and permission systems
  - Add version operations to existing permission model
  - Implement audit event publishing for all version operations
  - Include security annotations for method-level access control
  - Add permission inheritance from parent document
  - Follow existing security patterns from SecurityConfig.kt

- [ ] **T07A.11**: Implement version lifecycle management
  - Add version retention policies for legal compliance
  - Implement automatic version cleanup and archival
  - Add version statistics and reporting capabilities
  - Include version metadata management (tags, comments)
  - Add version validation and integrity checks

### Phase 5: Testing and Validation
- [ ] **T07A.12**: Write comprehensive unit tests for entities and repositories
  - Test entity validation, constraints, and business logic
  - Cover edge cases for version numbering and relationships
  - Test repository queries and performance
  - Validate audit trail and compliance features
  - Include negative test cases and error scenarios

- [ ] **T07A.13**: Create integration tests for service layer
  - Test complete version creation workflows
  - Validate service integration with audit and permission systems
  - Test transaction management and rollback scenarios
  - Include concurrent operation testing
  - Test performance with large documents

- [ ] **T07A.14**: Add API endpoint testing with comprehensive coverage
  - Test all API endpoints with various scenarios
  - Include authentication and authorization testing
  - Test error handling and edge cases
  - Validate API response formats and status codes
  - Add performance testing for API operations

- [ ] **T07A.15**: Performance testing and optimization
  - Test version operations with large documents (up to 100MB)
  - Validate database query performance with indexes
  - Test memory usage during diff operations
  - Optimize slow queries and operations
  - Add performance monitoring and alerting

## Technical Architecture & Guidance

### Entity Design Pattern (Following BaseEntity.kt and AuditLog.kt)

```kotlin
@Entity
@Table(
    name = "document_versions",
    indexes = [
        Index(name = "idx_doc_versions_document_id", columnList = "document_id"),
        Index(name = "idx_doc_versions_created_at", columnList = "created_at"),
        Index(name = "idx_doc_versions_hash", columnList = "content_hash"),
        Index(name = "idx_doc_versions_parent", columnList = "parent_version_id")
    ]
)
class DocumentVersion(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    @Column(name = "id", updatable = false, nullable = false)
    val id: UUID = UUID.randomUUID(),
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "document_id", nullable = false)
    val document: Document,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "parent_version_id")
    val parentVersion: DocumentVersion? = null,
    
    @Column(name = "version_number", nullable = false)
    val versionNumber: Int,
    
    @Column(name = "major_version", nullable = false)
    val majorVersion: Int,
    
    @Column(name = "minor_version", nullable = false)
    val minorVersion: Int,
    
    @Column(name = "patch_version", nullable = false)
    val patchVersion: Int,
    
    @Enumerated(EnumType.STRING)
    @Column(name = "change_type", nullable = false)
    val changeType: VersionChangeType,
    
    @Column(name = "content_hash", length = 256, nullable = false)
    val contentHash: String,
    
    @Column(name = "content_size", nullable = false)
    val contentSize: Long,
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(name = "diff_data", columnDefinition = "jsonb")
    val diffData: Map<String, Any> = emptyMap(),
    
    @Column(name = "change_comment", columnDefinition = "text")
    val changeComment: String? = null,
    
    // Audit fields following BaseEntity pattern
    @CreatedDate
    @Column(name = "created_at", nullable = false, updatable = false)
    val createdAt: LocalDateTime = LocalDateTime.now(),
    
    @CreatedBy
    @Column(name = "created_by", nullable = false, updatable = false)
    val createdBy: UUID,
    
    // Legal compliance fields following AuditLog pattern
    @Column(name = "immutable", nullable = false)
    val immutable: Boolean = true,
    
    @Column(name = "retention_until")
    val retentionUntil: LocalDate? = null,
    
    @Column(name = "legal_hold", nullable = false)
    val legalHold: Boolean = false
) : BaseEntity() {
    
    @PreUpdate
    fun preventUpdate() {
        if (immutable) {
            throw IllegalStateException("Document versions are immutable")
        }
    }
    
    @PreRemove
    fun preventDeletion() {
        throw IllegalStateException("Document versions cannot be deleted")
    }
    
    val versionString: String
        get() = "$majorVersion.$minorVersion.$patchVersion"
}

enum class VersionChangeType {
    MAJOR, MINOR, PATCH, AUTOMATIC, MANUAL
}
```

### Service Layer Pattern (Following MatterServiceImpl.kt)

```kotlin
@Service
@Transactional
class DocumentVersionServiceImpl(
    private val documentVersionRepository: DocumentVersionRepository,
    private val documentRepository: DocumentRepository,
    private val diffCalculationService: DiffCalculationService,
    private val auditEventPublisher: AuditEventPublisher
) : DocumentVersionService, BaseService() {
    
    @Transactional
    override fun createVersion(
        documentId: UUID, 
        changeType: VersionChangeType,
        comment: String?
    ): DocumentVersion {
        logger.info("Creating version for document: $documentId")
        
        // Get current document
        val document = documentRepository.findById(documentId)
            .orElseThrow { DocumentNotFoundException(documentId) }
        
        // Calculate next version number
        val nextVersionNumber = calculateNextVersionNumber(documentId, changeType)
        
        // Calculate diff from previous version
        val diffData = calculateDiffFromPrevious(document)
        
        // Create version entity
        val version = DocumentVersion(
            document = document,
            parentVersion = getLatestVersion(documentId),
            versionNumber = nextVersionNumber.versionNumber,
            majorVersion = nextVersionNumber.majorVersion,
            minorVersion = nextVersionNumber.minorVersion,
            patchVersion = nextVersionNumber.patchVersion,
            changeType = changeType,
            contentHash = calculateContentHash(document),
            contentSize = document.fileSize ?: 0L,
            diffData = diffData,
            changeComment = comment,
            createdBy = getCurrentUserId() ?: throw UnauthorizedException("User not authenticated")
        )
        
        // Save version
        val savedVersion = documentVersionRepository.save(version)
        
        // Publish audit event
        auditEventPublisher.publishCustomEvent(
            AuditEventType.DOCUMENT_VERSION_CREATED,
            "DOCUMENT_VERSION",
            savedVersion.id.toString(),
            mapOf(
                "documentId" to documentId.toString(),
                "versionNumber" to nextVersionNumber.versionNumber,
                "changeType" to changeType.name
            )
        )
        
        return savedVersion
    }
}
```

### Database Migration Pattern

```sql
-- V012__Create_document_versions_table.sql
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL REFERENCES documents(id) ON DELETE CASCADE,
    parent_version_id UUID REFERENCES document_versions(id),
    version_number INTEGER NOT NULL,
    major_version INTEGER NOT NULL DEFAULT 1,
    minor_version INTEGER NOT NULL DEFAULT 0,
    patch_version INTEGER NOT NULL DEFAULT 0,
    change_type VARCHAR(20) NOT NULL CHECK (
        change_type IN ('MAJOR', 'MINOR', 'PATCH', 'AUTOMATIC', 'MANUAL')
    ),
    content_hash VARCHAR(256) NOT NULL,
    content_size BIGINT NOT NULL DEFAULT 0,
    diff_data JSONB,
    change_comment TEXT,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL REFERENCES users(id),
    immutable BOOLEAN NOT NULL DEFAULT true,
    retention_until DATE,
    legal_hold BOOLEAN NOT NULL DEFAULT false,
    
    -- Unique constraint for version numbering per document
    CONSTRAINT uk_document_versions_number UNIQUE(document_id, version_number)
);

-- Performance indexes
CREATE INDEX idx_document_versions_document_id ON document_versions(document_id);
CREATE INDEX idx_document_versions_parent_id ON document_versions(parent_version_id);
CREATE INDEX idx_document_versions_created_at ON document_versions(created_at DESC);
CREATE INDEX idx_document_versions_content_hash ON document_versions(content_hash);
CREATE INDEX idx_document_versions_composite ON document_versions(document_id, created_at DESC);

-- JSONB index for diff data queries
CREATE INDEX idx_document_versions_diff_data ON document_versions USING GIN(diff_data);

-- Comment
COMMENT ON TABLE document_versions IS 'Document version control with immutable audit trail';
COMMENT ON COLUMN document_versions.diff_data IS 'JSONB storage for version differences and metadata';
COMMENT ON COLUMN document_versions.immutable IS 'Prevents modification of version records for compliance';
```

## Performance Targets

- Version creation: < 5 seconds for documents up to 50MB
- Version history queries: < 2 seconds for 1000+ versions with pagination
- Diff calculation: < 10 seconds for documents up to 100MB
- Storage efficiency: 70%+ reduction through delta compression
- Database query performance: < 500ms for indexed queries
- Memory usage: < 512MB during diff operations on large documents

## Integration Points

- **Existing Audit System**: Integrate with AuditEventPublisher for comprehensive audit trails
- **Permission System**: Use existing RBAC for document version permissions
- **Document Management**: Extend existing Document entity relationships
- **Event System**: Publish version events for downstream processing
- **User Management**: Leverage existing user authentication and authorization

## Output Log

*(This section is populated as work progresses on the task)*

[2025-07-01 12:00:00] Task created as core backend foundation for document version control
[2025-07-01 12:00:00] Focus areas defined: entity design, repository layer, service implementation, API endpoints
[2025-07-01 12:00:00] Technical architecture based on existing patterns: BaseEntity, AuditLog, MatterServiceImpl
[2025-07-01 12:00:00] Database schema designed with performance optimization and legal compliance
[2025-07-01 12:00:00] Integration points identified with existing audit, permission, and event systems