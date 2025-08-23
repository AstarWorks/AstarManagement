---
task_id: T01_S03
title: "Define Business Roles and Permissions"
sprint: S03
status: pending
complexity: low
priority: high
category: backend
domains: ["security", "authorization", "architecture"]
estimate_hours: 4
created: 2025-01-23
---

# T01_S03: Define Business Roles and Permissions

## 📋 Overview

Define and implement the core business roles (OWNER, MEMBER, VIEWER) and establish the permission matrix that will govern access control across the application.

## 🎯 Objectives

- Define BusinessRole enum with clear responsibilities
- Map Auth0 roles to business roles
- Create comprehensive permission matrix
- Document role hierarchy and inheritance
- Establish authorization patterns

## 📝 Acceptance Criteria

- [ ] BusinessRole enum created with OWNER, MEMBER, VIEWER
- [ ] Role descriptions and permissions documented
- [ ] Permission matrix defined for all resource types
- [ ] Auth0 role mapping configured
- [ ] Role constants available for use in @PreAuthorize
- [ ] Documentation complete and reviewed

## 🔧 Technical Implementation

### BusinessRole Enum

```kotlin
package com.astarworks.astarmanagement.core.infrastructure.security

enum class BusinessRole(
    val displayName: String,
    val description: String,
    val level: Int  // For hierarchy comparison
) {
    OWNER(
        displayName = "オーナー",
        description = "Full administrative access to all tenant resources",
        level = 100
    ),
    MEMBER(
        displayName = "メンバー",
        description = "Standard access to create and edit resources",
        level = 50
    ),
    VIEWER(
        displayName = "閲覧者",
        description = "Read-only access to tenant resources",
        level = 10
    );
    
    fun hasMinimumRole(required: BusinessRole): Boolean {
        return this.level >= required.level
    }
    
    companion object {
        fun fromAuth0Role(auth0Role: String): BusinessRole? {
            return when (auth0Role.uppercase()) {
                "OWNER", "ADMIN" -> OWNER
                "MEMBER", "USER" -> MEMBER
                "VIEWER", "READONLY" -> VIEWER
                else -> null
            }
        }
    }
}
```

### Permission Matrix

| Resource | Action | OWNER | MEMBER | VIEWER | Notes |
|----------|--------|-------|--------|--------|-------|
| **Expenses** |
| | View All | ✅ | ✅ | ✅ | All roles can view |
| | Create | ✅ | ✅ | ❌ | |
| | Edit Own | ✅ | ✅ | ❌ | MEMBER can edit own items |
| | Edit Any | ✅ | ❌ | ❌ | Only OWNER can edit others' |
| | Delete Own | ✅ | ✅ | ❌ | |
| | Delete Any | ✅ | ❌ | ❌ | |
| | Export | ✅ | ✅ | ✅ | All can export visible data |
| **Projects** |
| | View All | ✅ | ✅ | ✅ | |
| | Create | ✅ | ✅ | ❌ | |
| | Edit | ✅ | ✅ | ❌ | MEMBER if assigned |
| | Delete | ✅ | ❌ | ❌ | |
| | Assign Members | ✅ | ❌ | ❌ | |
| **Users** |
| | View List | ✅ | ✅ | ✅ | |
| | View Details | ✅ | ✅ | ❌ | |
| | Invite | ✅ | ❌ | ❌ | |
| | Edit Roles | ✅ | ❌ | ❌ | |
| | Remove | ✅ | ❌ | ❌ | |
| **Settings** |
| | View | ✅ | ✅ | ✅ | |
| | Edit Tenant | ✅ | ❌ | ❌ | |
| | Edit Billing | ✅ | ❌ | ❌ | |
| | View Audit Logs | ✅ | ❌ | ❌ | |

## 📋 Subtasks

### Implementation
- [ ] Create BusinessRole enum
- [ ] Add role utility methods
- [ ] Create Auth0 role mapping
- [ ] Define permission constants

### Documentation
- [ ] Document role definitions
- [ ] Create permission matrix
- [ ] Write authorization guidelines
- [ ] Create role assignment flow

### Testing
- [ ] Unit tests for role mapping
- [ ] Unit tests for hierarchy comparison
- [ ] Integration tests with JWT

## 🧪 Testing Strategy

### Unit Tests
- Role mapping from Auth0 claims
- Role hierarchy comparisons
- Permission matrix validation

### Integration Tests
- JWT token with roles extraction
- Role-based authorization checks

## 🔗 Dependencies

- JWT Claims Extraction (S01 completed)
- Auth0 tenant configuration

## 📚 Technical References

- [Spring Security Method Security](https://docs.spring.io/spring-security/reference/servlet/authorization/method-security.html)
- [Auth0 Role-Based Access Control](https://auth0.com/docs/manage-users/access-control/rbac)

## ✅ Definition of Done

- [ ] BusinessRole enum implemented
- [ ] Permission matrix defined and documented
- [ ] Auth0 role mapping working
- [ ] Unit tests passing
- [ ] Integration tests passing
- [ ] Documentation reviewed
- [ ] Team briefed on role definitions