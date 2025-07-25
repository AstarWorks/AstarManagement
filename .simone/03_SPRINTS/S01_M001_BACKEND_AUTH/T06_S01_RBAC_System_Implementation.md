# T06_S01 - RBAC System Implementation

## Task Overview
**Duration**: 10 hours  
**Priority**: High  
**Dependencies**: T04_S01_User_Entity_Repository_Layer, T05_S01_User_Service_Business_Logic  
**Sprint**: S01_M001_BACKEND_AUTH  

## Objective
Implement a comprehensive Role-Based Access Control (RBAC) system for the legal practice management application, providing fine-grained permissions suitable for law firm hierarchy and Japanese legal practice requirements.

## Background
This task implements AUTH-004 (RBAC Permission System) from the milestone requirements. The system must support the hierarchical structure of legal practices (lawyer > clerk > client) while providing flexible permission assignments for case management, client data access, and financial operations.

## Technical Requirements

### 1. RBAC Domain Models
Create comprehensive permission and role models:

**Location**: `backend/modules/auth/domain/model/`

**Models to Create**:
- `Role.kt` - Role definition with permissions
- `Permission.kt` - Individual permission specification
- `RoleAssignment.kt` - User-role assignment with context
- `PermissionScope.kt` - Permission scope and resource definition

### 2. RBAC Entities and Repository
Implement JPA entities for RBAC persistence:

**Location**: `backend/modules/auth/infrastructure/persistence/entity/`

**Entities to Create**:
- `RoleEntity.kt` - Role storage
- `PermissionEntity.kt` - Permission storage
- `RolePermissionEntity.kt` - Role-permission mapping
- `UserRoleEntity.kt` - User-role assignment

### 3. Permission Evaluation Service
Create service for permission checking:

**Location**: `backend/modules/auth/application/service/PermissionService.kt`

**Core Functions**:
- Permission evaluation for users
- Role hierarchy enforcement
- Context-aware permission checking
- Permission caching for performance

### 4. Spring Security Integration
Integrate RBAC with Spring Security:

**Location**: `backend/modules/auth/infrastructure/security/`

**Components**:
- `CustomPermissionEvaluator.kt` - Spring Security permission evaluator
- `RoleHierarchyImpl.kt` - Role hierarchy configuration
- `MethodSecurityConfig.kt` - Method-level security configuration

## Implementation Guidance

### RBAC Domain Models
Create comprehensive domain models for permissions:

```kotlin
data class Role(
    val id: UUID? = null,
    val name: String,
    val displayName: String,
    val description: String,
    val permissions: Set<Permission> = emptySet(),
    val isSystemRole: Boolean = false,
    val hierarchy: Int = 0, // 0 = highest (LAWYER), higher = lower privilege
    val createdAt: LocalDateTime = LocalDateTime.now(),
    val updatedAt: LocalDateTime = LocalDateTime.now()
) {
    fun hasPermission(permission: Permission): Boolean = permissions.contains(permission)
    
    fun hasPermission(permissionName: String): Boolean = 
        permissions.any { it.name == permissionName }
    
    fun canManageRole(otherRole: Role): Boolean = hierarchy < otherRole.hierarchy
}

data class Permission(
    val id: UUID? = null,
    val name: String,
    val displayName: String,
    val description: String,
    val resource: String,
    val action: String,
    val scope: PermissionScope = PermissionScope.TENANT,
    val createdAt: LocalDateTime = LocalDateTime.now()
) {
    fun matches(resource: String, action: String): Boolean =
        this.resource == resource && this.action == action
    
    fun getFullName(): String = "${resource}_${action}".uppercase()
}

enum class PermissionScope {
    GLOBAL,     // System-wide permissions
    TENANT,     // Tenant-specific permissions
    RESOURCE,   // Specific resource permissions
    OWNER       // Owner-only permissions
}

// Legal practice specific permission definitions
object LegalPermissions {
    // Case management permissions
    val CASE_READ = Permission(name = "CASE_READ", displayName = "案件閲覧", description = "案件情報を閲覧できる", resource = "case", action = "read")
    val CASE_WRITE = Permission(name = "CASE_WRITE", displayName = "案件編集", description = "案件情報を編集できる", resource = "case", action = "write")
    val CASE_DELETE = Permission(name = "CASE_DELETE", displayName = "案件削除", description = "案件を削除できる", resource = "case", action = "delete")
    val CASE_ASSIGN = Permission(name = "CASE_ASSIGN", displayName = "案件担当者指定", description = "案件の担当者を指定できる", resource = "case", action = "assign")
    
    // Client management permissions
    val CLIENT_READ = Permission(name = "CLIENT_READ", displayName = "依頼者閲覧", description = "依頼者情報を閲覧できる", resource = "client", action = "read")
    val CLIENT_WRITE = Permission(name = "CLIENT_WRITE", displayName = "依頼者編集", description = "依頼者情報を編集できる", resource = "client", action = "write")
    val CLIENT_DELETE = Permission(name = "CLIENT_DELETE", displayName = "依頼者削除", description = "依頼者を削除できる", resource = "client", action = "delete")
    
    // Financial permissions
    val FINANCIAL_READ = Permission(name = "FINANCIAL_READ", displayName = "財務閲覧", description = "財務情報を閲覧できる", resource = "financial", action = "read")
    val FINANCIAL_WRITE = Permission(name = "FINANCIAL_WRITE", displayName = "財務編集", description = "財務情報を編集できる", resource = "financial", action = "write")
    val FINANCIAL_APPROVE = Permission(name = "FINANCIAL_APPROVE", displayName = "財務承認", description = "財務取引を承認できる", resource = "financial", action = "approve")
    
    // Document permissions
    val DOCUMENT_READ = Permission(name = "DOCUMENT_READ", displayName = "文書閲覧", description = "文書を閲覧できる", resource = "document", action = "read")
    val DOCUMENT_WRITE = Permission(name = "DOCUMENT_WRITE", displayName = "文書編集", description = "文書を編集できる", resource = "document", action = "write")
    val DOCUMENT_DELETE = Permission(name = "DOCUMENT_DELETE", displayName = "文書削除", description = "文書を削除できる", resource = "document", action = "delete")
    
    // User management permissions
    val USER_READ = Permission(name = "USER_READ", displayName = "ユーザー閲覧", description = "ユーザー情報を閲覧できる", resource = "user", action = "read")
    val USER_WRITE = Permission(name = "USER_WRITE", displayName = "ユーザー編集", description = "ユーザー情報を編集できる", resource = "user", action = "write")
    val USER_DELETE = Permission(name = "USER_DELETE", displayName = "ユーザー削除", description = "ユーザーを削除できる", resource = "user", action = "delete")
}
```

### Legal Practice Role Definitions
Define standard roles for Japanese legal practices:

```kotlin
object LegalRoles {
    val LAWYER = Role(
        name = "LAWYER",
        displayName = "弁護士",
        description = "法律事務所の弁護士",
        hierarchy = 0,
        permissions = setOf(
            LegalPermissions.CASE_READ,
            LegalPermissions.CASE_WRITE,
            LegalPermissions.CASE_DELETE,
            LegalPermissions.CASE_ASSIGN,
            LegalPermissions.CLIENT_READ,
            LegalPermissions.CLIENT_WRITE,
            LegalPermissions.CLIENT_DELETE,
            LegalPermissions.FINANCIAL_READ,
            LegalPermissions.FINANCIAL_WRITE,
            LegalPermissions.FINANCIAL_APPROVE,
            LegalPermissions.DOCUMENT_READ,
            LegalPermissions.DOCUMENT_WRITE,
            LegalPermissions.DOCUMENT_DELETE,
            LegalPermissions.USER_READ,
            LegalPermissions.USER_WRITE,
            LegalPermissions.USER_DELETE
        ),
        isSystemRole = true
    )
    
    val CLERK = Role(
        name = "CLERK",
        displayName = "事務員",
        description = "法律事務所の事務員",
        hierarchy = 1,
        permissions = setOf(
            LegalPermissions.CASE_READ,
            LegalPermissions.CASE_WRITE,
            LegalPermissions.CLIENT_READ,
            LegalPermissions.CLIENT_WRITE,
            LegalPermissions.FINANCIAL_READ,
            LegalPermissions.DOCUMENT_READ,
            LegalPermissions.DOCUMENT_WRITE,
            LegalPermissions.USER_READ
        ),
        isSystemRole = true
    )
    
    val CLIENT = Role(
        name = "CLIENT",
        displayName = "依頼者",
        description = "法律事務所の依頼者",
        hierarchy = 2,
        permissions = setOf(
            LegalPermissions.CASE_READ.copy(scope = PermissionScope.OWNER),
            LegalPermissions.DOCUMENT_READ.copy(scope = PermissionScope.OWNER)
        ),
        isSystemRole = true
    )
}
```

### Permission Evaluation Service
Implement comprehensive permission checking:

```kotlin
@Service
@Transactional(readOnly = true)
class PermissionService(
    private val userRepository: UserRepository,
    private val roleRepository: RoleRepository,
    private val cacheManager: CacheManager,
    private val tenantContext: TenantContext
) {

    @Cacheable("user-permissions")
    fun getUserPermissions(userId: UUID): Set<Permission> {
        val user = userRepository.findById(userId)
            ?: throw EntityNotFoundException("User not found: $userId")
        
        return user.roles.flatMap { it.permissions }.toSet()
    }

    fun hasPermission(userId: UUID, resource: String, action: String): Boolean {
        return hasPermission(userId, resource, action, null)
    }

    fun hasPermission(userId: UUID, resource: String, action: String, resourceId: UUID?): Boolean {
        val permissions = getUserPermissions(userId)
        
        // Check for exact permission match
        val hasDirectPermission = permissions.any { permission ->
            permission.matches(resource, action) && 
            checkPermissionScope(permission, userId, resourceId)
        }
        
        if (hasDirectPermission) return true
        
        // Check role hierarchy for inherited permissions
        return checkRoleHierarchy(userId, resource, action, resourceId)
    }

    fun hasAnyPermission(userId: UUID, vararg permissions: String): Boolean {
        val userPermissions = getUserPermissions(userId)
        return permissions.any { permissionName ->
            userPermissions.any { it.name == permissionName }
        }
    }

    fun hasAllPermissions(userId: UUID, vararg permissions: String): Boolean {
        val userPermissions = getUserPermissions(userId)
        return permissions.all { permissionName ->
            userPermissions.any { it.name == permissionName }
        }
    }

    private fun checkPermissionScope(
        permission: Permission,
        userId: UUID,
        resourceId: UUID?
    ): Boolean {
        return when (permission.scope) {
            PermissionScope.GLOBAL -> true
            PermissionScope.TENANT -> checkTenantScope(userId)
            PermissionScope.RESOURCE -> resourceId != null
            PermissionScope.OWNER -> checkOwnerScope(userId, resourceId)
        }
    }

    private fun checkTenantScope(userId: UUID): Boolean {
        val user = userRepository.findById(userId) ?: return false
        return user.tenantId == tenantContext.getCurrentTenantId()
    }

    private fun checkOwnerScope(userId: UUID, resourceId: UUID?): Boolean {
        if (resourceId == null) return false
        
        // Check if user owns the resource
        return when (val resource = findResourceById(resourceId)) {
            is OwnableResource -> resource.ownerId == userId
            else -> false
        }
    }

    private fun checkRoleHierarchy(
        userId: UUID,
        resource: String,
        action: String,
        resourceId: UUID?
    ): Boolean {
        val user = userRepository.findById(userId) ?: return false
        val userRoles = user.roles.sortedBy { it.hierarchy }
        
        // Check if any higher-level role has the permission
        return userRoles.any { role ->
            role.permissions.any { permission ->
                permission.matches(resource, action) &&
                checkPermissionScope(permission, userId, resourceId)
            }
        }
    }
}
```

### Spring Security Integration
Integrate RBAC with Spring Security method security:

```kotlin
@Component
class CustomPermissionEvaluator(
    private val permissionService: PermissionService
) : PermissionEvaluator {

    override fun hasPermission(
        authentication: Authentication,
        targetDomainObject: Any?,
        permission: Any?
    ): Boolean {
        if (authentication.principal !is CustomUserDetails) return false
        
        val userDetails = authentication.principal as CustomUserDetails
        val userId = userDetails.userId
        
        return when (permission) {
            is String -> parseAndCheckPermission(userId, permission, targetDomainObject)
            else -> false
        }
    }

    override fun hasPermission(
        authentication: Authentication,
        targetId: Serializable?,
        targetType: String?,
        permission: Any?
    ): Boolean {
        if (authentication.principal !is CustomUserDetails) return false
        
        val userDetails = authentication.principal as CustomUserDetails
        val userId = userDetails.userId
        val resourceId = targetId as? UUID
        
        return when {
            targetType != null && permission is String -> {
                permissionService.hasPermission(userId, targetType, permission, resourceId)
            }
            else -> false
        }
    }

    private fun parseAndCheckPermission(
        userId: UUID,
        permission: String,
        targetObject: Any?
    ): Boolean {
        val parts = permission.split(":")
        if (parts.size < 2) return false
        
        val resource = parts[0]
        val action = parts[1]
        val resourceId = extractResourceId(targetObject)
        
        return permissionService.hasPermission(userId, resource, action, resourceId)
    }

    private fun extractResourceId(targetObject: Any?): UUID? {
        return when (targetObject) {
            is HasId -> targetObject.id
            is UUID -> targetObject
            else -> null
        }
    }
}

@Configuration
@EnableMethodSecurity(prePostEnabled = true)
class MethodSecurityConfig(
    private val customPermissionEvaluator: CustomPermissionEvaluator
) {

    @Bean
    fun methodSecurityExpressionHandler(): DefaultMethodSecurityExpressionHandler {
        val expressionHandler = DefaultMethodSecurityExpressionHandler()
        expressionHandler.setPermissionEvaluator(customPermissionEvaluator)
        return expressionHandler
    }
}
```

### Permission-Based Controller Protection
Apply permissions to API endpoints:

```kotlin
@RestController
@RequestMapping("/api/cases")
@PreAuthorize("hasRole('USER')")
class CaseController(
    private val caseService: CaseService
) {

    @GetMapping
    @PreAuthorize("hasPermission('case', 'read')")
    fun getCases(): List<CaseResponse> {
        return caseService.getAllCases()
    }

    @PostMapping
    @PreAuthorize("hasPermission('case', 'write')")
    fun createCase(@RequestBody request: CreateCaseRequest): CaseResponse {
        return caseService.createCase(request)
    }

    @GetMapping("/{id}")
    @PreAuthorize("hasPermission(#id, 'case', 'read')")
    fun getCase(@PathVariable id: UUID): CaseResponse {
        return caseService.getCase(id)
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasPermission(#id, 'case', 'write')")
    fun updateCase(
        @PathVariable id: UUID,
        @RequestBody request: UpdateCaseRequest
    ): CaseResponse {
        return caseService.updateCase(id, request)
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasPermission(#id, 'case', 'delete')")
    fun deleteCase(@PathVariable id: UUID): ResponseEntity<Void> {
        caseService.deleteCase(id)
        return ResponseEntity.noContent().build()
    }
}
```

## Implementation Steps

1. **Create RBAC Domain Models** (2 hours)
   - Role, Permission, and related domain objects
   - Legal practice specific permission definitions
   - Standard role definitions for law firms

2. **Implement RBAC Entities and Repositories** (2 hours)
   - JPA entities for roles and permissions
   - Repository implementations with multi-tenant support
   - Database migrations for RBAC tables

3. **Create Permission Service** (3 hours)
   - Permission evaluation logic
   - Role hierarchy checking
   - Permission caching for performance

4. **Spring Security Integration** (2 hours)
   - Custom permission evaluator
   - Method security configuration
   - Controller protection annotations

5. **Testing and Validation** (1 hour)
   - Unit tests for permission logic
   - Integration tests with Spring Security
   - Performance testing for permission checks

## Testing Requirements

### Unit Tests
```kotlin
@ExtendWith(MockKExtension::class)
class PermissionServiceTest {
    
    @Test
    fun `should check direct permissions correctly`() {
        // Test direct permission checking
    }
    
    @Test
    fun `should respect role hierarchy`() {
        // Test role hierarchy enforcement
    }
    
    @Test
    fun `should handle owner-scoped permissions`() {
        // Test owner-only permissions
    }
    
    @Test
    fun `should enforce tenant isolation`() {
        // Test multi-tenant permission isolation
    }
}
```

### Integration Tests
```kotlin
@SpringBootTest
@Testcontainers
class RBACIntegrationTest {
    
    @Test
    fun `should protect API endpoints with permissions`() {
        // Test endpoint protection
    }
    
    @Test
    fun `should allow role-based access`() {
        // Test role-based access control
    }
}
```

## Success Criteria

- [ ] Role and permission models support legal practice hierarchy
- [ ] Permission evaluation handles all scope types correctly
- [ ] Spring Security integration protects API endpoints
- [ ] Role hierarchy enforces proper access levels
- [ ] Multi-tenant permission isolation works correctly
- [ ] Permission caching improves performance
- [ ] Unit tests achieve >95% coverage
- [ ] Integration tests verify complete RBAC functionality
- [ ] Performance targets met (<10ms per permission check)

## Security Considerations

### Legal Practice Requirements
- Attorney-client privilege: Proper permission scoping for confidential data
- Multi-tenant isolation: Permissions respect tenant boundaries
- Audit trail: All permission checks logged for compliance
- Role hierarchy: Lawyers > clerks > clients permission structure

### RBAC Security Best Practices
- Principle of least privilege enforcement
- Permission deny-by-default approach
- Regular permission review and cleanup
- Secure permission evaluation without information leakage

## Performance Considerations

- Permission caching to reduce database queries
- Efficient permission lookup with proper indexing
- Role hierarchy caching for frequent checks
- Connection pooling for permission queries
- Bulk permission loading for multiple checks

## Files to Create/Modify

- `backend/modules/auth/domain/model/Role.kt`
- `backend/modules/auth/domain/model/Permission.kt`
- `backend/modules/auth/domain/model/LegalPermissions.kt`
- `backend/modules/auth/infrastructure/persistence/entity/RoleEntity.kt`
- `backend/modules/auth/infrastructure/persistence/entity/PermissionEntity.kt`
- `backend/modules/auth/application/service/PermissionService.kt`
- `backend/modules/auth/infrastructure/security/CustomPermissionEvaluator.kt`
- `backend/modules/auth/infrastructure/security/MethodSecurityConfig.kt`
- `backend/src/main/resources/db/migration/V003__Create_rbac_tables.sql`

## Architectural References

### Clean Architecture Guidelines
- **Reference**: `.simone/01_PROJECT_DOCS/ARCHITECTURE.md`
- **Relevance**: RBAC system must follow Clean Architecture with domain models for permissions/roles separated from infrastructure security implementation
- **Key Guidance**: Create Permission and Role domain models, implement PermissionService in application layer, integrate with Spring Security through infrastructure layer adapters

### Legal Domain Security Requirements  
- **Reference**: `CLAUDE.md` - Legal Domain Implementation Checklist
- **Relevance**: RBAC must enforce Japanese legal practice hierarchy (lawyer > clerk > client) with proper attorney-client privilege protection
- **Key Guidance**: Implement hierarchical role system respecting legal practice structure, ensure client users can only access their own case data, maintain audit trail for all permission checks

### Technology Stack Standards
- **Reference**: `.simone/01_PROJECT_DOCS/ARCHITECTURE.md` - Technology Stack section
- **Relevance**: RBAC integration must use Spring Security method-level security with custom permission evaluators and proper caching
- **Key Guidance**: Implement custom PermissionEvaluator, use @PreAuthorize annotations on controllers, configure method security, implement permission caching for performance

## Related Tasks

- T04_S01_User_Entity_Repository_Layer
- T05_S01_User_Service_Business_Logic
- T03_S01_Authentication_API_Endpoints

---

**Note**: This RBAC system provides the authorization foundation for the entire application. Ensure comprehensive testing and security review to protect sensitive legal data.