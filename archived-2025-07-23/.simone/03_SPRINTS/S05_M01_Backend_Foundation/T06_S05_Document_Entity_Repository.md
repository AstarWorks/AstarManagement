---
task_id: T06_S05
sprint_sequence_id: S05
status: completed
complexity: Medium
last_updated: 2025-06-28T12:00:00Z
---

# Task: Document Entity and Repository Implementation

## Description
Implement the Document entity model and its repository for the Aster Management system using Spring Data JPA with Kotlin. This task focuses on creating the Document domain entity with proper JPA annotations, relationships to Matter and User entities, and implementing the repository interface with basic CRUD operations and search capabilities. The entity should leverage the BaseEntity superclass for audit fields and follow the existing patterns established in the codebase.

## Goal / Objectives
- Design and implement the Document JPA entity with proper annotations
- Establish entity relationships with Matter and User entities
- Create Spring Data JPA repository with basic query methods
- Implement entity validation using Jakarta Bean Validation
- Add support for document metadata and versioning
- Ensure consistency with existing audit and base entity patterns

## Acceptance Criteria
- [ ] Document entity is implemented with JPA annotations extending BaseEntity
- [ ] Entity relationships to Matter and User are properly mapped
- [ ] DocumentRepository extends JpaRepository with basic operations
- [ ] Bean validation constraints are applied to entity fields
- [ ] Document metadata is stored using JSONB field
- [ ] DocumentVersion entity tracks document revisions
- [ ] Repository includes methods for finding documents by matter and user
- [ ] Entity equality and hashCode methods are correctly implemented
- [ ] Soft delete functionality is implemented
- [ ] All entities follow Kotlin best practices

## Subtasks
- [ ] Review existing entity patterns (BaseEntity, Matter, User)
- [ ] Design Document entity with core fields (name, type, size, mimeType)
- [ ] Implement Document entity extending BaseEntity
- [ ] Add relationships: ManyToOne to Matter and User
- [ ] Create DocumentVersion entity for version tracking
- [ ] Implement JSONB field for flexible document metadata
- [ ] Create DocumentRepository interface extending JpaRepository
- [ ] Add repository methods: findByMatterId, findByUserId
- [ ] Implement soft delete with deletedAt field
- [ ] Add bean validation constraints (@NotBlank, @Size, etc.)
- [ ] Create projection interfaces for optimized queries
- [ ] Write unit tests for entity relationships
- [ ] Document entity design decisions

## Technical Guidance

### Entity Structure
```kotlin
@Entity
@Table(name = "documents")
data class Document(
    @Column(nullable = false)
    val name: String,
    
    @Column(nullable = false)
    val mimeType: String,
    
    @Column(nullable = false)
    val size: Long,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "matter_id")
    val matter: Matter,
    
    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "uploaded_by")
    val uploadedBy: User,
    
    @JdbcTypeCode(SqlTypes.JSON)
    @Column(columnDefinition = "jsonb")
    val metadata: Map<String, Any> = emptyMap(),
    
    @Column
    val deletedAt: Instant? = null
) : BaseEntity()
```

### Repository Pattern
```kotlin
interface DocumentRepository : JpaRepository<Document, UUID> {
    fun findByMatterIdAndDeletedAtIsNull(matterId: UUID): List<Document>
    fun findByUploadedByIdAndDeletedAtIsNull(userId: UUID): List<Document>
    
    @Query("SELECT d FROM Document d WHERE d.matter.id = :matterId AND d.name LIKE %:searchTerm%")
    fun searchByMatterIdAndName(@Param("matterId") matterId: UUID, @Param("searchTerm") searchTerm: String): List<Document>
}
```

### Validation Requirements
- Document name: @NotBlank, @Size(max = 255)
- MIME type: @NotBlank, validate against allowed types
- File size: @Min(1), @Max(configured limit)
- Relationships: @NotNull for required associations

### Version Tracking
Implement DocumentVersion entity to track document revisions:
- Link to parent Document
- Store version number, upload timestamp
- Track who uploaded each version
- Maintain version-specific metadata

## Output Log
*(This section is populated as work progresses on the task)*

[YYYY-MM-DD HH:MM:SS] Started task
[YYYY-MM-DD HH:MM:SS] Modified files: file1.kt, file2.kt
[YYYY-MM-DD HH:MM:SS] Completed subtask: Implemented feature X
[YYYY-MM-DD HH:MM:SS] Task completed