---
task_id: T02_S03
title: "Implement API Endpoint Authorization"
sprint: S03
status: pending
complexity: medium
priority: high
category: backend
domains: ["security", "api", "authorization"]
estimate_hours: 8
created: 2025-01-23
---

# T02_S03: Implement API Endpoint Authorization

## 📋 Overview

Apply @PreAuthorize annotations to all API endpoints based on the defined permission matrix, ensuring proper role-based access control across the application.

## 🎯 Objectives

- Add @PreAuthorize to all controller methods
- Implement custom security expressions
- Create reusable authorization patterns
- Ensure consistent authorization across APIs
- Handle edge cases and complex permissions

## 📝 Acceptance Criteria

- [ ] All API endpoints have appropriate @PreAuthorize
- [ ] Custom security expressions created for complex rules
- [ ] Authorization follows permission matrix exactly
- [ ] No unprotected endpoints remain
- [ ] 403 responses are consistent
- [ ] Performance impact <5ms per request

## 🔧 Technical Implementation

### Base Controller Pattern

```kotlin
@RestController
@RequestMapping("/api/v1")
@PreAuthorize("isAuthenticated()")  // Base requirement for all APIs
abstract class BaseApiController {
    // Common authorization utilities
}
```

### Expense Controller

```kotlin
@RestController
@RequestMapping("/api/v1/expenses")
class ExpenseController(
    private val expenseService: ExpenseService
) : BaseApiController() {
    
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MEMBER', 'VIEWER')")
    fun listExpenses(
        @RequestParam(required = false) projectId: Long?
    ): ResponseEntity<List<ExpenseDto>> {
        return ResponseEntity.ok(expenseService.findAll(projectId))
    }
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MEMBER', 'VIEWER')")
    fun getExpense(@PathVariable id: Long): ResponseEntity<ExpenseDto> {
        return ResponseEntity.ok(expenseService.findById(id))
    }
    
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MEMBER')")
    fun createExpense(
        @Valid @RequestBody request: CreateExpenseRequest
    ): ResponseEntity<ExpenseDto> {
        return ResponseEntity.status(HttpStatus.CREATED)
            .body(expenseService.create(request))
    }
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER') or " +
                  "(hasRole('MEMBER') and @expenseService.isCreator(#id, authentication.principal.userId))")
    fun updateExpense(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateExpenseRequest
    ): ResponseEntity<ExpenseDto> {
        return ResponseEntity.ok(expenseService.update(id, request))
    }
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER') or " +
                  "(hasRole('MEMBER') and @expenseService.isCreator(#id, authentication.principal.userId))")
    fun deleteExpense(@PathVariable id: Long): ResponseEntity<Void> {
        expenseService.delete(id)
        return ResponseEntity.noContent().build()
    }
    
    @PostMapping("/{id}/approve")
    @PreAuthorize("hasRole('OWNER')")
    fun approveExpense(@PathVariable id: Long): ResponseEntity<ExpenseDto> {
        return ResponseEntity.ok(expenseService.approve(id))
    }
}
```

### Project Controller

```kotlin
@RestController
@RequestMapping("/api/v1/projects")
class ProjectController(
    private val projectService: ProjectService
) : BaseApiController() {
    
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MEMBER', 'VIEWER')")
    fun listProjects(): ResponseEntity<List<ProjectDto>>
    
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MEMBER')")
    fun createProject(@Valid @RequestBody request: CreateProjectRequest): ResponseEntity<ProjectDto>
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER') or " +
                  "(hasRole('MEMBER') and @projectService.isMember(#id, authentication.principal.userId))")
    fun updateProject(
        @PathVariable id: Long,
        @Valid @RequestBody request: UpdateProjectRequest
    ): ResponseEntity<ProjectDto>
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    fun deleteProject(@PathVariable id: Long): ResponseEntity<Void>
    
    @PostMapping("/{id}/members")
    @PreAuthorize("hasRole('OWNER')")
    fun assignMembers(
        @PathVariable id: Long,
        @RequestBody memberIds: List<String>
    ): ResponseEntity<ProjectDto>
}
```

### User Management Controller

```kotlin
@RestController
@RequestMapping("/api/v1/users")
class UserController(
    private val userService: UserService
) : BaseApiController() {
    
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MEMBER', 'VIEWER')")
    fun listUsers(): ResponseEntity<List<UserSummaryDto>>
    
    @GetMapping("/{id}")
    @PreAuthorize("hasAnyRole('OWNER', 'MEMBER') or " +
                  "(hasRole('VIEWER') and #id == authentication.principal.userId)")
    fun getUser(@PathVariable id: String): ResponseEntity<UserDto>
    
    @PostMapping("/invite")
    @PreAuthorize("hasRole('OWNER')")
    fun inviteUser(@Valid @RequestBody request: InviteUserRequest): ResponseEntity<Void>
    
    @PutMapping("/{id}/role")
    @PreAuthorize("hasRole('OWNER')")
    fun updateUserRole(
        @PathVariable id: String,
        @RequestBody role: BusinessRole
    ): ResponseEntity<UserDto>
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER') and #id != authentication.principal.userId")
    fun removeUser(@PathVariable id: String): ResponseEntity<Void>
}
```

### Custom Security Service

```kotlin
@Service
class AuthorizationService {
    
    fun canEditResource(resourceId: Long, userId: String): Boolean {
        // Complex authorization logic
        return checkResourceOwnership(resourceId, userId)
    }
    
    fun belongsToUserTenant(resourceId: Long, authentication: Authentication): Boolean {
        val businessContext = authentication.principal as BusinessContext
        return checkTenantMembership(resourceId, businessContext.tenantId)
    }
    
    fun hasPermission(permission: String, authentication: Authentication): Boolean {
        // Check specific permission string
        return authentication.authorities.any { 
            it.authority == "PERMISSION_$permission" 
        }
    }
}
```

### Settings Controller

```kotlin
@RestController
@RequestMapping("/api/v1/settings")
class SettingsController : BaseApiController() {
    
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MEMBER', 'VIEWER')")
    fun getSettings(): ResponseEntity<SettingsDto>
    
    @PutMapping("/tenant")
    @PreAuthorize("hasRole('OWNER')")
    fun updateTenantSettings(@Valid @RequestBody request: TenantSettingsRequest): ResponseEntity<SettingsDto>
    
    @GetMapping("/audit-logs")
    @PreAuthorize("hasRole('OWNER')")
    fun getAuditLogs(
        @RequestParam from: LocalDateTime,
        @RequestParam to: LocalDateTime
    ): ResponseEntity<List<AuditLogDto>>
}
```

## 📋 Subtasks

### Implementation
- [ ] Annotate expense endpoints
- [ ] Annotate project endpoints
- [ ] Annotate user management endpoints
- [ ] Annotate settings endpoints
- [ ] Create custom security expressions
- [ ] Implement AuthorizationService

### Testing
- [ ] Test each endpoint with each role
- [ ] Test complex authorization rules
- [ ] Test invalid access attempts
- [ ] Performance testing

### Documentation
- [ ] Document authorization patterns
- [ ] Create endpoint security matrix
- [ ] Update API documentation

## 🧪 Testing Strategy

### Unit Tests
- Mock security context for each role
- Test authorization decisions
- Test custom expressions

### Integration Tests
- End-to-end authorization flows
- Cross-role access attempts
- Token-based authentication

## 🔗 Dependencies

- T01_S03 (Business Roles defined)
- Spring Security configuration
- JWT authentication working

## ✅ Definition of Done

- [ ] All endpoints have @PreAuthorize
- [ ] Authorization matches permission matrix
- [ ] Custom expressions implemented
- [ ] All tests passing
- [ ] No performance regression
- [ ] Documentation complete