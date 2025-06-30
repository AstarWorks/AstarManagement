# T04_S06: RBAC System Implementation

## Description
Implement Discord-style Role-Based Access Control system with granular permissions for the AsterManagement legal case management system. This task focuses on creating a flexible RBAC system that supports role hierarchies, permission flags, and custom permission evaluators integrated with Spring Security's method-level security annotations.

## Goals
- Create role/permission models with Discord-style permission flags
- Implement permission evaluation logic with bitwise operations
- Enable method-level security with @PreAuthorize annotations
- Support hierarchical roles (Lawyer > Clerk > Client)
- Create permission constants for all system operations
- Build role management endpoints for administrators

## Acceptance Criteria
- [ ] Role entity created with Discord-style permission flags (bitwise operations)
- [ ] Permission entity with granular CRUD operations per resource
- [ ] Custom PermissionEvaluator integrated with Spring Security
- [ ] Method-level security working with @PreAuthorize annotations
- [ ] Role hierarchy properly evaluated (Lawyer inherits Clerk permissions)
- [ ] Permission constants defined for all resources (MATTER_*, DOCUMENT_*, etc.)
- [ ] Role management REST endpoints with proper authorization
- [ ] Unit tests for permission evaluation logic
- [ ] Integration tests for role-based access scenarios
- [ ] Documentation for RBAC system usage and configuration

## Subtasks
- [ ] Create Role entity with permission flags and hierarchy support
- [ ] Create Permission entity with resource and action mapping
- [ ] Implement UserRole join entity for many-to-many relationships
- [ ] Build custom PermissionEvaluator for Spring Security integration
- [ ] Define permission constants enum with bitwise values
- [ ] Create RoleRepository with custom query methods
- [ ] Implement RoleService with permission calculation logic
- [ ] Add @PreAuthorize annotations to existing controllers/services
- [ ] Create RoleController for role management endpoints
- [ ] Write comprehensive unit tests for permission logic
- [ ] Create integration tests with different user roles
- [ ] Document RBAC patterns and usage guidelines

## Technical Guidance

### Key Interfaces
- `GrantedAuthority`: Spring Security authority interface
- `@PreAuthorize`: Method-level security annotation
- `PermissionEvaluator`: Custom permission evaluation interface
- `AccessDecisionManager`: Authorization decision interface
- `RoleHierarchy`: Spring Security role hierarchy support

### Integration Points
- `/backend/src/main/kotlin/com/astromanagement/security/rbac/`: Main RBAC package
- `/security/rbac/entity/`: Role and Permission entities
- `/security/rbac/service/`: RBAC business logic
- `/security/rbac/repository/`: Data access layer
- `/security/rbac/evaluator/`: Custom permission evaluators

### Existing Patterns
- Use entity patterns from Matter entity for JPA configuration
- Follow repository patterns from MatterRepository
- Apply validation patterns from existing entities
- Use service layer patterns for business logic
- Integrate with existing SecurityConfig

### Database Models
- Create Role entity with Discord-style permission flags
- Create Permission entity for granular permissions
- Create UserRole join table for user-role assignments
- Add role relationships to existing User entity
- Support role inheritance and permission aggregation

### Error Handling
- `AccessDeniedException` for unauthorized access attempts
- `InsufficientPermissionException` for granular permission failures
- ProblemDetail responses for RBAC-related errors
- Audit logging for permission denial events

## Implementation Notes

### Discord-Style Permission System
```kotlin
@Entity
@Table(name = "roles")
class Role(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID? = null,
    
    @Column(nullable = false, unique = true)
    val name: String,
    
    @Column(nullable = false)
    val displayName: String,
    
    @Column(nullable = false)
    val permissions: Long = 0L,  // Bitwise permission flags
    
    @Column(nullable = false)
    val position: Int = 0,  // Hierarchy position (higher = more authority)
    
    @Column(nullable = false)
    val color: String = "#808080",  // Role display color
    
    @ManyToOne
    @JoinColumn(name = "parent_role_id")
    val parentRole: Role? = null,  // For role inheritance
    
    @OneToMany(mappedBy = "role", cascade = [CascadeType.ALL])
    val userRoles: Set<UserRole> = HashSet()
) : AuditableEntity()
```

### Permission Constants with Bitwise Values
```kotlin
enum class Permission(val bit: Int) {
    // Matter permissions
    MATTER_VIEW(0),           // 1 << 0 = 1
    MATTER_CREATE(1),         // 1 << 1 = 2
    MATTER_UPDATE(2),         // 1 << 2 = 4
    MATTER_DELETE(3),         // 1 << 3 = 8
    MATTER_EXPORT(4),         // 1 << 4 = 16
    
    // Document permissions
    DOCUMENT_VIEW(5),         // 1 << 5 = 32
    DOCUMENT_CREATE(6),       // 1 << 6 = 64
    DOCUMENT_UPDATE(7),       // 1 << 7 = 128
    DOCUMENT_DELETE(8),       // 1 << 8 = 256
    DOCUMENT_EXPORT(9),       // 1 << 9 = 512
    
    // Communication permissions
    COMM_VIEW(10),            // 1 << 10 = 1024
    COMM_CREATE(11),          // 1 << 11 = 2048
    COMM_UPDATE(12),          // 1 << 12 = 4096
    COMM_DELETE(13),          // 1 << 13 = 8192
    
    // Financial permissions
    FINANCE_VIEW(14),         // 1 << 14 = 16384
    FINANCE_CREATE(15),       // 1 << 15 = 32768
    FINANCE_UPDATE(16),       // 1 << 16 = 65536
    FINANCE_DELETE(17),       // 1 << 17 = 131072
    FINANCE_EXPORT(18),       // 1 << 18 = 262144
    
    // Admin permissions
    ADMIN_USERS(19),          // 1 << 19 = 524288
    ADMIN_ROLES(20),          // 1 << 20 = 1048576
    ADMIN_SETTINGS(21);       // 1 << 21 = 2097152
    
    val value: Long = 1L shl bit
    
    companion object {
        fun hasPermission(permissions: Long, permission: Permission): Boolean {
            return (permissions and permission.value) == permission.value
        }
        
        fun addPermission(permissions: Long, permission: Permission): Long {
            return permissions or permission.value
        }
        
        fun removePermission(permissions: Long, permission: Permission): Long {
            return permissions and permission.value.inv()
        }
    }
}
```

### Custom PermissionEvaluator Implementation
```kotlin
@Component
class CustomPermissionEvaluator : PermissionEvaluator {
    
    @Autowired
    private lateinit var roleService: RoleService
    
    override fun hasPermission(
        authentication: Authentication,
        targetDomainObject: Any?,
        permission: Any
    ): Boolean {
        if (authentication !is JwtAuthenticationToken) return false
        
        val userId = authentication.name
        val requiredPermission = Permission.valueOf(permission.toString())
        
        return roleService.userHasPermission(userId, requiredPermission)
    }
    
    override fun hasPermission(
        authentication: Authentication,
        targetId: Serializable,
        targetType: String,
        permission: Any
    ): Boolean {
        // Resource-specific permission checking
        val userId = authentication.name
        val requiredPermission = Permission.valueOf(permission.toString())
        
        return when (targetType) {
            "Matter" -> roleService.userCanAccessMatter(userId, targetId as UUID, requiredPermission)
            "Document" -> roleService.userCanAccessDocument(userId, targetId as UUID, requiredPermission)
            else -> false
        }
    }
}
```

### Method-Level Security Usage
```kotlin
@RestController
@RequestMapping("/api/matters")
class MatterController {
    
    @GetMapping
    @PreAuthorize("hasPermission(null, 'MATTER_VIEW')")
    fun getAllMatters(): List<MatterDto> {
        // Implementation
    }
    
    @PostMapping
    @PreAuthorize("hasPermission(null, 'MATTER_CREATE')")
    fun createMatter(@RequestBody matter: CreateMatterDto): MatterDto {
        // Implementation
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(#id, 'Matter', 'MATTER_UPDATE')")
    fun updateMatter(@PathVariable id: UUID, @RequestBody matter: UpdateMatterDto): MatterDto {
        // Implementation
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(#id, 'Matter', 'MATTER_DELETE')")
    fun deleteMatter(@PathVariable id: UUID) {
        // Implementation
    }
}
```

### Role Hierarchy Implementation
```kotlin
@Service
class RoleService {
    
    fun calculateEffectivePermissions(role: Role): Long {
        var permissions = role.permissions
        
        // Inherit permissions from parent role
        var currentRole = role.parentRole
        while (currentRole != null) {
            permissions = permissions or currentRole.permissions
            currentRole = currentRole.parentRole
        }
        
        return permissions
    }
    
    fun createDefaultRoles() {
        // Client role (basic permissions)
        val clientRole = Role(
            name = "CLIENT",
            displayName = "Client",
            permissions = Permission.MATTER_VIEW.value or 
                         Permission.DOCUMENT_VIEW.value or
                         Permission.COMM_VIEW.value,
            position = 1
        )
        
        // Clerk role (inherits client + additional)
        val clerkRole = Role(
            name = "CLERK",
            displayName = "Clerk",
            permissions = Permission.MATTER_CREATE.value or
                         Permission.MATTER_UPDATE.value or
                         Permission.DOCUMENT_CREATE.value or
                         Permission.DOCUMENT_UPDATE.value or
                         Permission.COMM_CREATE.value,
            position = 2,
            parentRole = clientRole
        )
        
        // Lawyer role (inherits clerk + full permissions)
        val lawyerRole = Role(
            name = "LAWYER",
            displayName = "Lawyer",
            permissions = Permission.values().fold(0L) { acc, perm -> 
                acc or perm.value 
            },
            position = 3,
            parentRole = clerkRole
        )
    }
}
```

### Role Management Endpoints
```kotlin
@RestController
@RequestMapping("/api/admin/roles")
@PreAuthorize("hasPermission(null, 'ADMIN_ROLES')")
class RoleController {
    
    @GetMapping
    fun getAllRoles(): List<RoleDto> {
        // Return all roles with permission details
    }
    
    @PostMapping
    fun createRole(@Valid @RequestBody createRoleDto: CreateRoleDto): RoleDto {
        // Create new role with specified permissions
    }
    
    @PutMapping("/{id}")
    fun updateRole(@PathVariable id: UUID, @RequestBody updateRoleDto: UpdateRoleDto): RoleDto {
        // Update role permissions and properties
    }
    
    @PostMapping("/{roleId}/users/{userId}")
    fun assignRoleToUser(@PathVariable roleId: UUID, @PathVariable userId: UUID) {
        // Assign role to user
    }
    
    @DeleteMapping("/{roleId}/users/{userId}")
    fun removeRoleFromUser(@PathVariable roleId: UUID, @PathVariable userId: UUID) {
        // Remove role from user
    }
}
```

### Security Configuration Update
```kotlin
@Configuration
@EnableGlobalMethodSecurity(prePostEnabled = true)
class MethodSecurityConfig {
    
    @Bean
    fun methodSecurityExpressionHandler(
        permissionEvaluator: PermissionEvaluator
    ): MethodSecurityExpressionHandler {
        val expressionHandler = DefaultMethodSecurityExpressionHandler()
        expressionHandler.setPermissionEvaluator(permissionEvaluator)
        return expressionHandler
    }
}
```

## Related Tasks
- T01_S06: Spring Security Configuration
- T02_S06: Authentication Service Implementation
- T03_S06: Authentication API Endpoints
- T05_S06: Audit Logging for RBAC Events

## Complexity
High (will need to split into subtasks)

## Priority
High

## Estimated Hours
16-24

## Dependencies
- Spring Security 6.x with method security
- Existing User entity and authentication system
- JPA/Hibernate for entity persistence
- JWT token integration for user identification

## Notes
- Consider caching permission calculations for performance
- Plan for permission migration when roles change
- Monitor permission flag storage limits (64 permissions max with Long)
- Consider implementing permission groups for better organization
- Add comprehensive audit logging for all permission changes
- Plan for role delegation features in future iterations