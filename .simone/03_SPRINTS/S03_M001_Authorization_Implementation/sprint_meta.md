# Sprint S03: Authorization Implementation

---
sprint_id: S03_M001
title: Spring Boot Authorization and RBAC Implementation
milestone: M001
status: planned
created: 2025-01-23
last_updated: 2025-01-23 14:00
estimated_duration: 5 days
---

## Sprint Goal

Implement comprehensive Role-Based Access Control (RBAC) in Spring Boot, leveraging the JWT authentication foundation to enforce authorization rules across all API endpoints.

## Scope & Deliverables

### Core Deliverables

1. **Business Role Definition**
   - Define BusinessRole enum (OWNER, MEMBER, VIEWER)
   - Map Auth0 roles to business roles
   - Create role hierarchy documentation
   - Implement role-based authorities

2. **API Endpoint Authorization**
   - Apply @PreAuthorize annotations to all controllers
   - Implement method-level security
   - Define permission matrix per endpoint
   - Create custom security expressions

3. **Tenant-Scoped Authorization**
   - Ensure tenant isolation in all operations
   - Implement cross-tenant access prevention
   - Add tenant validation to queries
   - Create tenant-aware security rules

4. **Authorization Testing Suite**
   - Unit tests for each role/permission combination
   - Integration tests for authorization flows
   - Security penetration testing
   - Performance impact assessment

5. **Error Handling & UX**
   - Standardized 403 Forbidden responses
   - Clear error messages for insufficient permissions
   - Audit logging for authorization failures
   - Frontend error handling guidelines

## Technical Implementation

### Business Roles

```kotlin
enum class BusinessRole {
    OWNER,   // Full access to all tenant resources
    MEMBER,  // Standard access to create/edit/view
    VIEWER   // Read-only access
}
```

### Authorization Matrix

| Resource | Action | OWNER | MEMBER | VIEWER |
|----------|--------|-------|--------|--------|
| Expenses | View   | ✅    | ✅     | ✅     |
| Expenses | Create | ✅    | ✅     | ❌     |
| Expenses | Edit   | ✅    | ✅*    | ❌     |
| Expenses | Delete | ✅    | ❌     | ❌     |
| Users    | View   | ✅    | ✅     | ✅     |
| Users    | Manage | ✅    | ❌     | ❌     |
| Settings | View   | ✅    | ✅     | ✅     |
| Settings | Edit   | ✅    | ❌     | ❌     |

*MEMBER can only edit their own created items

### Implementation Examples

```kotlin
@RestController
@RequestMapping("/api/v1/expenses")
class ExpenseController {
    
    @GetMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MEMBER', 'VIEWER')")
    fun listExpenses(): List<Expense>
    
    @PostMapping
    @PreAuthorize("hasAnyRole('OWNER', 'MEMBER')")
    fun createExpense(@RequestBody expense: Expense): Expense
    
    @PutMapping("/{id}")
    @PreAuthorize("hasRole('OWNER') or (hasRole('MEMBER') and @expenseService.isCreator(#id, authentication.principal.userId))")
    fun updateExpense(@PathVariable id: Long, @RequestBody expense: Expense): Expense
    
    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('OWNER')")
    fun deleteExpense(@PathVariable id: Long)
}
```

## Test Scenarios

### Critical Authorization Tests

1. **Role-Based Access**
   ```
   VIEWER attempts CREATE → 403 Forbidden
   MEMBER attempts DELETE → 403 Forbidden
   OWNER attempts DELETE → 200 OK
   ```

2. **Tenant Isolation**
   ```
   User from Tenant A accesses Tenant B data → 403 Forbidden
   User from Tenant A accesses Tenant A data → 200 OK
   ```

3. **Owner-Only Operations**
   ```
   MEMBER attempts user management → 403 Forbidden
   OWNER attempts user management → 200 OK
   ```

4. **Self-Edit Permissions**
   ```
   MEMBER edits own expense → 200 OK
   MEMBER edits other's expense → 403 Forbidden
   ```

## Frontend Integration

### API Call Examples

```typescript
// Sidebase automatically adds Bearer token
// No special authorization code needed

// Example 1: Viewing expenses (all roles)
const expenses = await $fetch('/api/v1/expenses')

// Example 2: Creating expense (OWNER/MEMBER only)
try {
  await $fetch('/api/v1/expenses', {
    method: 'POST',
    body: expenseData
  })
} catch (error) {
  if (error.statusCode === 403) {
    showError('権限不足: この操作を実行する権限がありません')
  }
}

// Example 3: Deleting expense (OWNER only)
try {
  await $fetch(`/api/v1/expenses/${id}`, {
    method: 'DELETE'
  })
} catch (error) {
  if (error.statusCode === 403) {
    showError('オーナー権限が必要です')
  }
}
```

### UI Permission Checks

```vue
<template>
  <!-- Show delete button only for OWNER -->
  <button v-if="hasRole('OWNER')" @click="deleteExpense">
    削除
  </button>
  
  <!-- Show create button for OWNER and MEMBER -->
  <button v-if="hasAnyRole(['OWNER', 'MEMBER'])" @click="createExpense">
    新規作成
  </button>
</template>

<script setup>
const { data: session } = useAuth()

const hasRole = (role: string) => {
  return session.value?.user?.roles?.some(r => r.name === role)
}

const hasAnyRole = (roles: string[]) => {
  return roles.some(role => hasRole(role))
}
</script>
```

## Definition of Done

- [ ] All API endpoints have appropriate @PreAuthorize annotations
- [ ] Business roles (OWNER, MEMBER, VIEWER) fully implemented
- [ ] Tenant isolation verified across all endpoints
- [ ] Authorization matrix documented and implemented
- [ ] Unit tests cover all role/permission combinations
- [ ] Integration tests pass for all authorization scenarios
- [ ] 403 responses are consistent and informative
- [ ] Audit logging captures authorization failures
- [ ] Frontend handles 403 errors gracefully
- [ ] Performance impact is negligible (<5ms)
- [ ] Security review completed
- [ ] Documentation updated with authorization rules

## Dependencies

### Prerequisites
- S01 completed (JWT validation and claims extraction)
- S02 completed (Integration testing framework)
- Auth0 roles configured in tenant
- BusinessContext extraction working

### Technical Dependencies
- Spring Security method security enabled
- JwtAuthenticationConverter configured
- Role prefix handling (ROLE_) implemented
- Tenant context service available

## Success Metrics

- **Authorization Accuracy**: 100% correct allow/deny decisions
- **Performance Impact**: <5ms added latency
- **Test Coverage**: >90% of authorization paths
- **Security Incidents**: Zero unauthorized access
- **Developer Experience**: Clear, predictable authorization rules

## Implementation Notes

### Key Principles

1. **Explicit Over Implicit**: Always explicitly define permissions
2. **Deny by Default**: Start with no access, grant as needed
3. **Tenant Isolation**: Never allow cross-tenant access
4. **Audit Everything**: Log all authorization decisions
5. **Fail Securely**: Return generic 403 errors to prevent information leakage

### Common Patterns

```kotlin
// Pattern 1: Role-based
@PreAuthorize("hasRole('ADMIN')")

// Pattern 2: Multiple roles
@PreAuthorize("hasAnyRole('OWNER', 'MEMBER')")

// Pattern 3: Self-edit
@PreAuthorize("hasRole('MEMBER') and #userId == authentication.principal.userId")

// Pattern 4: Tenant-scoped
@PreAuthorize("hasRole('VIEWER') and @tenantService.belongsToUserTenant(#resourceId)")

// Pattern 5: Custom expression
@PreAuthorize("@authorizationService.canEdit(#resource, authentication)")
```

## Risk Mitigation

| Risk | Mitigation |
|------|------------|
| Privilege escalation | Strict role validation, audit logging |
| Cross-tenant access | Tenant validation in every query |
| Authorization bypass | Multiple layers of checks, security testing |
| Performance degradation | Caching of authorization decisions |
| Complex permission logic | Clear documentation, simple rules |

---
*Sprint created: 2025-01-23*  
*Part of Milestone: M001 - Auth0 Integration*