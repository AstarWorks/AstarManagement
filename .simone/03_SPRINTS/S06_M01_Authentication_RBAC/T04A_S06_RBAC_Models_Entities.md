---
task_id: T04A_S06
sprint_sequence_id: S06
status: open
complexity: Medium
priority: High
estimated_hours: 8-12
dependencies: [T02_S06]
last_updated: 2025-06-30T20:45:00Z
---

# T04A_S06: RBAC Models and Entities

## Description
Create the data model foundation for Discord-style Role-Based Access Control system. This task focuses on building the Role, Permission, and UserRole entities with Discord-style permission flags, supporting hierarchical role structures and bitwise permission operations.

## Goals
- Create Role entity with Discord-style permission flags using bitwise operations
- Implement Permission entity with granular resource-action mapping
- Build UserRole join entity for flexible many-to-many relationships
- Support role hierarchy (Lawyer > Clerk > Client)
- Define permission constants for all system operations
- Ensure database schema supports efficient permission queries

## Acceptance Criteria
- [ ] Role entity created with bitwise permission flags (64-bit long)
- [ ] Permission entity with resource-action combinations
- [ ] UserRole join entity with additional metadata (granted_at, granted_by)
- [ ] Role hierarchy properly modeled in database
- [ ] Permission constants defined for all resources (MATTER_*, DOCUMENT_*, etc.)
- [ ] Database migrations created for RBAC tables
- [ ] Repository interfaces for RBAC entities
- [ ] Unit tests for entity relationships and constraints
- [ ] Permission flag utility methods (hasPermission, grantPermission, etc.)

## Subtasks
- [ ] Create Role entity with permission flags and hierarchy support (3h)
- [ ] Create Permission entity with resource and action mapping (2h)
- [ ] Implement UserRole join entity for many-to-many relationships (2h)
- [ ] Define permission constants (Permission enum with 22+ permissions) (2h)
- [ ] Create database migration scripts for RBAC schema (2h)
- [ ] Build repository interfaces (RoleRepository, PermissionRepository) (1h)
- [ ] Implement permission utility methods for bitwise operations (2h)
- [ ] Write comprehensive unit tests for entities and relationships (3h)

## Technical Guidance

### Key Interfaces and Integration Points
- **Entity Framework**: Leverage JPA annotations and Hibernate patterns
- **Integration Points**: 
  - `/backend/src/main/kotlin/com/astromanagement/security/rbac/entity/`
  - `/backend/src/main/kotlin/com/astromanagement/security/rbac/repository/`
- **Existing Patterns**: Follow entity patterns from `Matter` and `User` entities
- **Database Models**: Create Role, Permission, UserRole entities
- **Error Handling**: Use custom exceptions for invalid permission operations

### Implementation Notes

#### Discord-Style Permission System
```kotlin
@Entity
@Table(name = "roles")
data class Role(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),
    
    @Column(unique = true, nullable = false)
    val name: String,
    
    @Column(nullable = false)
    val displayName: String,
    
    // Discord-style permission flags (bitwise operations)
    @Column(nullable = false)
    val permissions: Long = 0L,
    
    // Role hierarchy
    @Column(nullable = false)
    val hierarchy: Int,
    
    @CreationTimestamp
    val createdAt: Instant = Instant.now(),
    
    @UpdateTimestamp
    val updatedAt: Instant = Instant.now()
)
```

#### Permission Constants (22 permissions using bit values)
```kotlin
enum class Permission(val bit: Long, val description: String) {
    // Matter permissions
    MATTER_CREATE(1L shl 0, "Create new matters"),
    MATTER_READ(1L shl 1, "View matter details"),
    MATTER_UPDATE(1L shl 2, "Edit matter information"),
    MATTER_DELETE(1L shl 3, "Delete matters"),
    
    // Document permissions  
    DOCUMENT_CREATE(1L shl 4, "Upload documents"),
    DOCUMENT_READ(1L shl 5, "View documents"),
    DOCUMENT_UPDATE(1L shl 6, "Edit documents"),
    DOCUMENT_DELETE(1L shl 7, "Delete documents"),
    
    // Client permissions
    CLIENT_CREATE(1L shl 8, "Create clients"),
    CLIENT_READ(1L shl 9, "View client details"),
    CLIENT_UPDATE(1L shl 10, "Edit client information"),
    CLIENT_DELETE(1L shl 11, "Delete clients"),
    
    // Financial permissions
    EXPENSE_CREATE(1L shl 12, "Create expenses"),
    EXPENSE_READ(1L shl 13, "View expenses"),
    EXPENSE_UPDATE(1L shl 14, "Edit expenses"),
    EXPENSE_DELETE(1L shl 15, "Delete expenses"),
    EXPENSE_APPROVE(1L shl 16, "Approve expenses"),
    
    // Administrative permissions
    USER_MANAGE(1L shl 17, "Manage users"),
    ROLE_MANAGE(1L shl 18, "Manage roles"),
    EXPORT_DATA(1L shl 19, "Export system data"),
    SYSTEM_SETTINGS(1L shl 20, "Access system settings"),
    AUDIT_READ(1L shl 21, "View audit logs")
}
```

#### Permission Utility Methods
```kotlin
object PermissionUtils {
    fun hasPermission(rolePermissions: Long, permission: Permission): Boolean {
        return (rolePermissions and permission.bit) != 0L
    }
    
    fun grantPermission(rolePermissions: Long, permission: Permission): Long {
        return rolePermissions or permission.bit
    }
    
    fun revokePermission(rolePermissions: Long, permission: Permission): Long {
        return rolePermissions and permission.bit.inv()
    }
    
    fun getPermissionsList(rolePermissions: Long): List<Permission> {
        return Permission.values().filter { hasPermission(rolePermissions, it) }
    }
}
```

#### Role Hierarchy Definition
```kotlin
object RoleHierarchy {
    const val LAWYER = 100      // Highest privilege level
    const val CLERK = 50        // Medium privilege level  
    const val CLIENT = 10       // Lowest privilege level
    
    fun inheritsFrom(userRole: Int, requiredRole: Int): Boolean {
        return userRole >= requiredRole
    }
}
```

## Testing Strategy
- Unit tests for entity validation and constraints
- Tests for permission utility methods (bitwise operations)
- Repository integration tests with test database
- Role hierarchy evaluation tests
- Permission flag manipulation tests

## Success Metrics
- All RBAC entities properly created and mapped
- Permission system supports 22+ distinct permissions
- Role hierarchy correctly modeled
- Database queries for permission checks are efficient (<10ms)
- 100% test coverage for permission utility methods

## Related Tasks
- **T04B_S06**: Permission Evaluation and Method Security (implements the logic)
- **T02_S06**: Authentication Service (provides user context)
- **T08_S06**: Security Testing (validates RBAC functionality)

## Future Considerations
- Consider adding permission groups for easier management
- Plan for role templates and permission presets
- Design for dynamic permission addition without code changes