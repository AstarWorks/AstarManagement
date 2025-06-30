---
task_id: T04B_S06
sprint_sequence_id: S06
status: open
complexity: Medium
priority: High
estimated_hours: 10-14
dependencies: [T04A_S06, T02_S06]
last_updated: 2025-06-30T20:45:00Z
---

# T04B_S06: Permission Evaluation and Method Security

## Description
Implement the permission evaluation logic and method-level security for the Discord-style RBAC system. This task focuses on creating the PermissionEvaluator, integrating with Spring Security's @PreAuthorize annotations, and building role management endpoints with proper authorization.

## Goals
- Implement custom PermissionEvaluator for Spring Security integration
- Enable method-level security with @PreAuthorize annotations
- Create role management REST endpoints for administrators
- Implement permission evaluation logic with role hierarchy support
- Build role assignment and permission checking services
- Add comprehensive integration tests for RBAC scenarios

## Acceptance Criteria
- [ ] Custom PermissionEvaluator integrated with Spring Security
- [ ] Method-level security working with @PreAuthorize annotations across all controllers
- [ ] Role hierarchy properly evaluated (Lawyer inherits Clerk permissions)
- [ ] Role management REST endpoints with proper authorization
- [ ] Permission checking service for programmatic access control
- [ ] Role assignment service for user management
- [ ] Integration tests for role-based access scenarios
- [ ] Performance optimization for permission checks
- [ ] Documentation for RBAC system usage and configuration

## Subtasks
- [ ] Implement custom PermissionEvaluator for Spring Security (4h)
- [ ] Create permission checking service for business logic (3h)
- [ ] Build role management REST endpoints (admin operations) (3h)
- [ ] Add @PreAuthorize annotations to existing controllers (3h)
- [ ] Implement role assignment service for user management (2h)
- [ ] Create RBAC configuration for Spring Security (2h)
- [ ] Write comprehensive integration tests for RBAC scenarios (4h)
- [ ] Add performance monitoring and optimization for permission checks (1h)

## Technical Guidance

### Key Interfaces and Integration Points
- **Spring Security**: PermissionEvaluator, @PreAuthorize, MethodSecurityConfigurer
- **Integration Points**: 
  - `/backend/src/main/kotlin/com/astromanagement/security/rbac/service/`
  - `/backend/src/main/kotlin/com/astromanagement/security/rbac/controller/`
- **Existing Patterns**: Follow service patterns from `MatterService` and controller patterns from `MatterController`
- **Error Handling**: Use `AccessDeniedException` for authorization failures
- **Performance**: Cache permission evaluations for frequently accessed resources

### Implementation Notes

#### Custom PermissionEvaluator Implementation
```kotlin
@Component
class CustomPermissionEvaluator(
    private val userService: UserService,
    private val roleService: RoleService
) : PermissionEvaluator {
    
    override fun hasPermission(
        authentication: Authentication,
        targetDomainObject: Any?,
        permission: Any?
    ): Boolean {
        val user = authentication.principal as UserPrincipal
        val permissionFlag = Permission.valueOf(permission.toString())
        
        return hasPermission(user, permissionFlag, targetDomainObject)
    }
    
    override fun hasPermission(
        authentication: Authentication,
        targetId: Serializable?,
        targetType: String?,
        permission: Any?
    ): Boolean {
        val user = authentication.principal as UserPrincipal
        val permissionFlag = Permission.valueOf(permission.toString())
        
        return hasPermission(user, permissionFlag)
    }
    
    private fun hasPermission(
        user: UserPrincipal,
        permission: Permission,
        resource: Any? = null
    ): Boolean {
        // Check user's roles and permissions
        val userRoles = userService.getUserRoles(user.id)
        
        // Check direct permission
        if (userRoles.any { role -> 
            PermissionUtils.hasPermission(role.permissions, permission) 
        }) {
            return true
        }
        
        // Check inherited permissions from role hierarchy
        return userRoles.any { role ->
            val higherRoles = roleService.getHigherRoles(role.hierarchy)
            higherRoles.any { higherRole ->
                PermissionUtils.hasPermission(higherRole.permissions, permission)
            }
        }
    }
}
```

#### Method-Level Security Annotations
```kotlin
@RestController
@RequestMapping("/api/matters")
class MatterController {
    
    @PreAuthorize("hasPermission(null, 'MATTER_CREATE')")
    @PostMapping
    fun createMatter(@RequestBody request: CreateMatterRequest): ResponseEntity<Matter> {
        // Implementation
    }
    
    @PreAuthorize("hasPermission(#id, 'Matter', 'MATTER_READ')")
    @GetMapping("/{id}")
    fun getMatter(@PathVariable id: UUID): ResponseEntity<Matter> {
        // Implementation
    }
    
    @PreAuthorize("hasPermission(#id, 'Matter', 'MATTER_UPDATE')")
    @PutMapping("/{id}")
    fun updateMatter(
        @PathVariable id: UUID,
        @RequestBody request: UpdateMatterRequest
    ): ResponseEntity<Matter> {
        // Implementation
    }
    
    @PreAuthorize("hasPermission(#id, 'Matter', 'MATTER_DELETE')")
    @DeleteMapping("/{id}")
    fun deleteMatter(@PathVariable id: UUID): ResponseEntity<Void> {
        // Implementation
    }
}
```

#### Role Management REST Endpoints
```kotlin
@RestController
@RequestMapping("/api/admin/roles")
@PreAuthorize("hasPermission(null, 'ROLE_MANAGE')")
class RoleManagementController(
    private val roleService: RoleService,
    private val permissionService: PermissionService
) {
    
    @GetMapping
    fun getAllRoles(): ResponseEntity<List<RoleResponse>> {
        return ResponseEntity.ok(roleService.getAllRoles())
    }
    
    @PostMapping
    fun createRole(@Valid @RequestBody request: CreateRoleRequest): ResponseEntity<Role> {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(roleService.createRole(request))
    }
    
    @PutMapping("/{roleId}")
    fun updateRole(
        @PathVariable roleId: UUID,
        @Valid @RequestBody request: UpdateRoleRequest
    ): ResponseEntity<Role> {
        return ResponseEntity.ok(roleService.updateRole(roleId, request))
    }
    
    @PostMapping("/{roleId}/permissions")
    fun grantPermission(
        @PathVariable roleId: UUID,
        @RequestBody request: GrantPermissionRequest
    ): ResponseEntity<Void> {
        permissionService.grantPermission(roleId, request.permission)
        return ResponseEntity.ok().build()
    }
    
    @DeleteMapping("/{roleId}/permissions/{permission}")
    fun revokePermission(
        @PathVariable roleId: UUID,
        @PathVariable permission: String
    ): ResponseEntity<Void> {
        permissionService.revokePermission(roleId, Permission.valueOf(permission))
        return ResponseEntity.ok().build()
    }
}
```

#### Permission Checking Service
```kotlin
@Service
class PermissionService(
    private val roleRepository: RoleRepository,
    private val userRepository: UserRepository
) {
    
    fun hasPermission(userId: UUID, permission: Permission, resourceId: UUID? = null): Boolean {
        val user = userRepository.findById(userId) ?: return false
        val userRoles = user.roles
        
        // Check direct permissions
        if (userRoles.any { PermissionUtils.hasPermission(it.permissions, permission) }) {
            return true
        }
        
        // Check resource-specific permissions (e.g., matter ownership)
        resourceId?.let { id ->
            return checkResourceSpecificPermission(user, permission, id)
        }
        
        return false
    }
    
    private fun checkResourceSpecificPermission(
        user: User,
        permission: Permission,
        resourceId: UUID
    ): Boolean {
        // Example: Client can only read their own matters
        if (permission == Permission.MATTER_READ && user.hasRole("CLIENT")) {
            return matterRepository.findByIdAndClientId(resourceId, user.id) != null
        }
        
        return false
    }
    
    fun grantPermission(roleId: UUID, permission: Permission) {
        val role = roleRepository.findById(roleId) 
            ?: throw RoleNotFoundException("Role not found: $roleId")
        
        val updatedPermissions = PermissionUtils.grantPermission(role.permissions, permission)
        roleRepository.save(role.copy(permissions = updatedPermissions))
    }
    
    fun revokePermission(roleId: UUID, permission: Permission) {
        val role = roleRepository.findById(roleId)
            ?: throw RoleNotFoundException("Role not found: $roleId")
        
        val updatedPermissions = PermissionUtils.revokePermission(role.permissions, permission)
        roleRepository.save(role.copy(permissions = updatedPermissions))
    }
}
```

#### Method Security Configuration
```kotlin
@Configuration
@EnableMethodSecurity(prePostEnabled = true)
class MethodSecurityConfig {
    
    @Bean
    fun methodSecurityExpressionHandler(
        permissionEvaluator: CustomPermissionEvaluator
    ): DefaultMethodSecurityExpressionHandler {
        val handler = DefaultMethodSecurityExpressionHandler()
        handler.setPermissionEvaluator(permissionEvaluator)
        return handler
    }
}
```

## Testing Strategy
- Integration tests for @PreAuthorize annotations on all controllers
- Role hierarchy inheritance tests
- Permission evaluation performance tests
- Resource-specific permission tests (e.g., client-matter ownership)
- Role management endpoint security tests
- Edge cases: invalid permissions, role changes, user deactivation

## Performance Considerations
- Cache frequently accessed permissions in Redis
- Optimize database queries for permission checking
- Implement batch permission checks for list operations
- Consider materialized views for complex permission hierarchies

## Success Metrics
- Permission checks execute in <5ms on average
- All controllers properly protected with @PreAuthorize
- Role hierarchy correctly enforced across all scenarios
- Zero unauthorized access in security testing
- 100% test coverage for permission evaluation logic

## Related Tasks
- **T04A_S06**: RBAC Models and Entities (provides the data model)
- **T08_S06**: Security Testing (validates RBAC functionality)
- **T03_S06**: Authentication API Endpoints (uses permission checks)

## Future Considerations
- Consider implementing permission caching strategies
- Plan for role-based UI component rendering
- Design audit trail for permission changes
- Consider adding temporary permission grants with expiration