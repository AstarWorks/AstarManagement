---
task_id: T02_S01
sprint_sequence_id: S01
status: open
complexity: Medium
last_updated: 2025-06-15T09:15:00Z
---

# Task: Matter Entity and JPA Configuration

## Description

Implement the core Matter entity with complete JPA configuration, validation, and repository layer for the AsterManagement legal case management system. This task focuses on creating a robust, well-structured Matter entity that serves as the foundation for case management functionality, including proper Kotlin data class design, JPA relationships, validation annotations, and custom repository methods.

The Matter entity represents individual legal cases and must support:
- Full CRUD operations through JPA repositories
- Status and priority tracking with proper enum handling  
- Audit trail integration with Spring Data JPA Auditing
- Full-text search capabilities preparation
- Integration with the existing Spring Boot 3.5 + Kotlin architecture

## Goal / Objectives

- Create a properly configured Matter JPA entity following Kotlin best practices
- Implement comprehensive validation using Spring Boot Validation framework
- Design efficient JPA repository layer with custom query methods
- Establish audit trail patterns for matter status changes
- Ensure seamless integration with existing Spring Boot project structure
- Prepare foundation for Kanban board functionality and status transitions

## Acceptance Criteria

- [ ] Matter entity class created with all required fields (FR-010)
- [ ] JPA annotations properly configured for PostgreSQL compatibility
- [ ] Validation annotations implemented for all business rules
- [ ] Status enum with proper JPA enum handling (PENDING, IN_PROGRESS, COMPLETED, etc.)
- [ ] Priority enum with JPA integration (LOW, MEDIUM, HIGH, URGENT)
- [ ] Audit fields integrated using Spring Data JPA Auditing
- [ ] MatterRepository interface with standard CRUD and custom methods
- [ ] Unit tests for entity validation and repository operations
- [ ] Integration tests using existing Testcontainers PostgreSQL setup
- [ ] Documentation comments following KDoc standards

## Subtasks

- [ ] Analyze existing Kotlin and Spring Boot patterns in the project
- [ ] Create matter status and priority enums with proper JPA handling
- [ ] Implement Matter entity class with Kotlin data class patterns
- [ ] Configure JPA annotations for entity mapping and relationships
- [ ] Add comprehensive validation annotations for business rules
- [ ] Integrate Spring Data JPA Auditing for created/updated fields
- [ ] Create MatterRepository interface with custom query methods
- [ ] Implement repository method signatures for common operations
- [ ] Write unit tests for entity validation logic
- [ ] Create integration tests for repository operations
- [ ] Add KDoc documentation for all public methods and classes

## Technical Guidance

### Existing Project Analysis

The project is configured with:
- **Spring Boot 3.5.0** with Kotlin 1.9.25
- **Spring Data JPA** with Hibernate ORM 6.6.15 and enhancements enabled
- **Spring Boot Validation** starter already included
- **PostgreSQL** runtime dependency configured
- **Kotlin JPA plugin** with allOpen configuration for JPA entities
- **Testcontainers** for PostgreSQL integration testing
- **Spring Modulith** for modular architecture support

### JPA Entity Configuration Patterns

**Kotlin Data Class with JPA:**
```kotlin
@Entity
@Table(name = "matters")
@EntityListeners(AuditingEntityListener::class)
data class Matter(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,
    
    @Column(nullable = false, length = 255)
    @NotBlank(message = "Matter title cannot be blank")
    @Size(max = 255, message = "Matter title cannot exceed 255 characters")
    val title: String,
    
    @Column(columnDefinition = "TEXT")
    val description: String? = null,
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val status: MatterStatus = MatterStatus.PENDING,
    
    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    val priority: MatterPriority = MatterPriority.MEDIUM
) : AuditableEntity()
```

**Base Auditable Entity Pattern:**
```kotlin
@MappedSuperclass
@EntityListeners(AuditingEntityListener::class)
abstract class AuditableEntity {
    @CreatedDate
    @Column(nullable = false, updatable = false)
    lateinit var createdAt: LocalDateTime
    
    @LastModifiedDate
    @Column(nullable = false)
    lateinit var updatedAt: LocalDateTime
    
    @CreatedBy
    @Column(updatable = false)
    var createdBy: String? = null
    
    @LastModifiedBy
    var lastModifiedBy: String? = null
}
```

### Enum Configuration for JPA

**Status Enum with Business Logic:**
```kotlin
enum class MatterStatus {
    PENDING,
    IN_PROGRESS, 
    ON_HOLD,
    COMPLETED,
    CANCELLED;
    
    fun canTransitionTo(newStatus: MatterStatus): Boolean {
        return when (this) {
            PENDING -> newStatus in setOf(IN_PROGRESS, CANCELLED)
            IN_PROGRESS -> newStatus in setOf(ON_HOLD, COMPLETED, CANCELLED)
            ON_HOLD -> newStatus in setOf(IN_PROGRESS, CANCELLED)
            COMPLETED -> false
            CANCELLED -> false
        }
    }
}

enum class MatterPriority(val level: Int) {
    LOW(1),
    MEDIUM(2), 
    HIGH(3),
    URGENT(4);
    
    companion object {
        fun fromLevel(level: Int) = values().find { it.level == level }
    }
}
```

### Validation Framework Integration

**Comprehensive Validation Annotations:**
```kotlin
@Entity
@Table(name = "matters")
class Matter(
    @field:NotBlank(message = "Title is required")
    @field:Size(min = 3, max = 255, message = "Title must be between 3 and 255 characters")
    @Column(nullable = false)
    val title: String,
    
    @field:Size(max = 2000, message = "Description cannot exceed 2000 characters")
    @Column(columnDefinition = "TEXT")
    val description: String? = null,
    
    @field:Valid
    @field:NotNull(message = "Status is required")
    @Enumerated(EnumType.STRING)
    val status: MatterStatus,
    
    @field:Email(message = "Invalid client email format")
    @Column(name = "client_email")
    val clientEmail: String? = null,
    
    @field:Pattern(
        regexp = "^\\+?[1-9]\\d{1,14}$", 
        message = "Invalid phone number format"
    )
    @Column(name = "client_phone")
    val clientPhone: String? = null
)
```

### Repository Layer Design

**Custom Repository Interface:**
```kotlin
@Repository
interface MatterRepository : JpaRepository<Matter, UUID>, JpaSpecificationExecutor<Matter> {
    
    // Query by status
    fun findByStatus(status: MatterStatus): List<Matter>
    fun findByStatusIn(statuses: Collection<MatterStatus>): List<Matter>
    
    // Query by priority
    fun findByPriority(priority: MatterPriority): List<Matter>
    fun findByPriorityGreaterThanEqual(priority: MatterPriority): List<Matter>
    
    // Query by client information
    fun findByClientEmailIgnoreCase(email: String): List<Matter>
    
    // Query by creation date
    fun findByCreatedAtBetween(start: LocalDateTime, end: LocalDateTime): List<Matter>
    
    // Complex queries with @Query annotation
    @Query("SELECT m FROM Matter m WHERE m.status = :status AND m.priority IN :priorities")
    fun findByStatusAndPriorityIn(
        @Param("status") status: MatterStatus,
        @Param("priorities") priorities: Collection<MatterPriority>
    ): List<Matter>
    
    // Native query for performance-critical operations
    @Query(
        value = "SELECT * FROM matters WHERE status = ?1 ORDER BY priority DESC, created_at ASC",
        nativeQuery = true
    )
    fun findByStatusOrderByPriorityAndCreation(status: String): List<Matter>
    
    // Count queries for dashboard
    fun countByStatus(status: MatterStatus): Long
    fun countByPriority(priority: MatterPriority): Long
}
```

## Implementation Notes

### Step-by-Step Implementation Approach

1. **Create Base Infrastructure** (Priority: High)
   - Create `AuditableEntity` base class for audit fields
   - Configure Spring Data JPA Auditing in main application class
   - Set up package structure: `domain.entity`, `domain.repository`, `domain.enums`

2. **Implement Enums** (Priority: High)
   ```kotlin
   // Place in: dev.ryuzu.astermanagement.domain.enums
   enum class MatterStatus { /* implementation */ }
   enum class MatterPriority { /* implementation */ }
   ```

3. **Create Matter Entity** (Priority: High)
   ```kotlin
   // Place in: dev.ryuzu.astermanagement.domain.entity
   @Entity
   @Table(name = "matters", indexes = [
       Index(name = "idx_matters_status", columnList = "status"),
       Index(name = "idx_matters_priority", columnList = "priority"),
       Index(name = "idx_matters_client_email", columnList = "client_email")
   ])
   class Matter : AuditableEntity() { /* implementation */ }
   ```

4. **Repository Interface** (Priority: Medium)
   ```kotlin
   // Place in: dev.ryuzu.astermanagement.domain.repository
   interface MatterRepository : JpaRepository<Matter, UUID> { /* methods */ }
   ```

### Kotlin-Specific JPA Considerations

**Data Class Limitations with JPA:**
- Avoid `data class` for JPA entities due to `equals()`/`hashCode()` issues with lazy loading
- Use regular classes with proper `toString()`, `equals()`, and `hashCode()` implementations
- Initialize all non-null properties with default values or constructor parameters

**Nullable Handling:**
```kotlin
@Entity
class Matter(
    @Column(nullable = false)
    val title: String,           // Non-null in DB and Kotlin
    
    @Column(nullable = true)
    val description: String? = null,  // Nullable in both
    
    @Id
    @GeneratedValue
    val id: UUID? = null         // Null before persistence, non-null after
)
```

### Database Integration Points

**Table Naming and Column Configuration:**
```kotlin
@Entity
@Table(
    name = "matters",
    indexes = [
        Index(name = "idx_matters_status_priority", columnList = "status,priority"),
        Index(name = "idx_matters_created_at", columnList = "created_at")
    ]
)
class Matter {
    @Column(name = "client_email", length = 255)
    val clientEmail: String? = null
    
    @Column(name = "due_date")
    val dueDate: LocalDate? = null
}
```

**PostgreSQL-Specific Optimizations:**
- Use `@GeneratedValue(strategy = GenerationType.UUID)` for UUID primary keys
- Configure proper column types for PostgreSQL: `TEXT` for large strings, `TIMESTAMP WITH TIME ZONE` for dates
- Prepare for full-text search with `@Column(columnDefinition = "tsvector")` fields

### Testing Strategy

**Unit Tests for Entity Validation:**
```kotlin
@Test
fun `should validate matter title constraints`() {
    val matter = Matter(title = "")  // Invalid: blank title
    
    val violations = validator.validate(matter)
    
    assertThat(violations).hasSize(1)
    assertThat(violations.first().message).contains("Title is required")
}
```

**Integration Tests with Testcontainers:**
```kotlin
@DataJpaTest
@Testcontainers
class MatterRepositoryTest {
    @Test
    fun `should find matters by status`() {
        // Given
        val matter = Matter(title = "Test Case", status = MatterStatus.PENDING)
        repository.save(matter)
        
        // When
        val results = repository.findByStatus(MatterStatus.PENDING)
        
        // Then
        assertThat(results).hasSize(1)
        assertThat(results.first().title).isEqualTo("Test Case")
    }
}
```

### Integration with Existing Architecture

**Spring Modulith Integration:**
- Place entities in appropriate module packages to leverage Spring Modulith boundaries
- Consider matter management as a separate module: `matter` package with `entity`, `repository`, `service` subpackages

**Security Integration:**
- Ensure audit fields integrate with Spring Security's authentication context
- Configure `AuditorAware<String>` bean to populate `createdBy`/`lastModifiedBy` fields

**Performance Considerations:**
- Use `@BatchSize` annotations for collection relationships
- Configure proper fetch strategies: `LAZY` for collections, `EAGER` only when necessary
- Consider implementing Hibernate's `@Cache` annotations for frequently accessed entities

## Output Log

*(This section is populated as work progresses on the task)*

[2025-06-15 09:15:00] Task created with comprehensive JPA entity implementation plan