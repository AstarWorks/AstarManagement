# DB-023: Advanced RBAC System Implementation

## Task Overview
**Sprint**: S01_M000_DATABASE_FOUNDATION  
**Milestone**: MILESTONE_000_DATABASE_FOUNDATION  
**Type**: Core Feature  
**Priority**: High  
**Estimated Effort**: 3-4 days  
**Assignee**: Database Team  

## Task Description
Implement the advanced Role-Based Access Control (RBAC) system following the Permission+Scope+Condition model defined in the architecture documents. This builds upon the basic user authentication system in V018 to provide comprehensive legal practice permissions.

## Technical Requirements

### Database Schema Implementation
Create migration `V023__Advanced_RBAC_System.sql` with the following tables:

#### 1. Permissions Table
```sql
CREATE TABLE permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    resource_type VARCHAR(100) NOT NULL, -- 'case', 'document', 'client', 'financial'
    action VARCHAR(50) NOT NULL, -- 'read', 'write', 'delete', 'approve'
    description TEXT,
    is_system_permission BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    CONSTRAINT fk_permissions_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_permission_name_tenant UNIQUE (tenant_id, name)
);
```

#### 2. Scopes Table
```sql
CREATE TABLE permission_scopes (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL, -- 'own', 'assigned', 'department', 'tenant'
    description TEXT,
    scope_level INTEGER NOT NULL CHECK (scope_level >= 1 AND scope_level <= 4),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_permission_scopes_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id)
);
```

#### 3. Roles Table (Enhanced)
```sql
CREATE TABLE roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    name VARCHAR(100) NOT NULL,
    display_name VARCHAR(200) NOT NULL,
    description TEXT,
    role_type VARCHAR(50) DEFAULT 'custom' CHECK (role_type IN ('system', 'custom')),
    hierarchy_level INTEGER DEFAULT 0,
    parent_role_id UUID REFERENCES roles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    created_by UUID NOT NULL,
    updated_by UUID NOT NULL,
    CONSTRAINT fk_roles_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_role_name_tenant UNIQUE (tenant_id, name)
);
```

#### 4. Role Permission Assignments
```sql
CREATE TABLE role_permissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    role_id UUID NOT NULL,
    permission_id UUID NOT NULL,
    scope_id UUID NOT NULL,
    tenant_id UUID NOT NULL,
    conditions JSONB DEFAULT '{}', -- Flexible condition storage
    is_granted BOOLEAN NOT NULL DEFAULT TRUE,
    granted_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    granted_by UUID NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT fk_role_permissions_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_permission_id FOREIGN KEY (permission_id) REFERENCES permissions(id) ON DELETE CASCADE,
    CONSTRAINT fk_role_permissions_scope_id FOREIGN KEY (scope_id) REFERENCES permission_scopes(id),
    CONSTRAINT fk_role_permissions_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_role_permission_scope UNIQUE (role_id, permission_id, scope_id)
);
```

#### 5. User Role Assignments (Enhanced)
```sql
CREATE TABLE user_roles (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL,
    role_id UUID NOT NULL, 
    tenant_id UUID NOT NULL,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    assigned_by UUID NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT TRUE,
    assignment_reason VARCHAR(500),
    CONSTRAINT fk_user_roles_user_id FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_role_id FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
    CONSTRAINT fk_user_roles_tenant_id FOREIGN KEY (tenant_id) REFERENCES tenants(id),
    CONSTRAINT uk_user_role_assignment UNIQUE (user_id, role_id)
);
```

### Advanced Features Required

#### 1. Permission Evaluation Function
```sql
CREATE FUNCTION evaluate_user_permission(
    p_user_id UUID,
    p_resource_type VARCHAR(100),
    p_action VARCHAR(50),
    p_resource_id UUID DEFAULT NULL,
    p_context JSONB DEFAULT '{}'
) RETURNS BOOLEAN
```

#### 2. Dynamic Condition Evaluation
Support for conditions like:
- Time-based access (work hours only)
- IP-based restrictions  
- Case assignment requirements
- Department membership requirements

#### 3. Role Hierarchy Support
- Parent-child role inheritance
- Permission overrides and denials
- Hierarchical permission resolution

## Implementation Guidelines

### 1. Multi-Tenant Compliance
- All RBAC tables MUST include `tenant_id` with proper RLS policies
- Follow existing V017 tenant isolation patterns
- Use `set_tenant_id_on_insert()` trigger for automatic tenant assignment

### 2. Performance Requirements
- Permission evaluation MUST complete in <5ms
- Role hierarchy resolution MUST handle up to 5 levels deep
- User permission checks MUST be optimized for frequent calls

### 3. Security Requirements
- All permission changes MUST be audited using existing audit system
- Role assignments MUST integrate with user session management
- Administrative permissions MUST require additional authentication

### 4. Integration Requirements
- MUST integrate with existing JWT token structure
- MUST work with Spring Security authorization framework
- MUST support both REST API and web interface permission checks

## Architecture Decision Records (ADRs) Referenced

### ADR-010: Authentication Flow Migration
- User session integration requirements
- JWT token claims for role information
- Multi-device permission consistency

### Permission System Design Document
- Permission+Scope+Condition model implementation
- Discord-style RBAC pattern adaptation
- Legal practice specific permission patterns

## Definition of Done

### Database Schema
- [ ] All RBAC tables created with proper constraints
- [ ] Row Level Security enabled and tested on all tables  
- [ ] Tenant isolation verified through testing
- [ ] Foreign key relationships properly configured
- [ ] Indexes created for performance optimization

### Functionality  
- [ ] Permission evaluation function works correctly
- [ ] Role hierarchy inheritance implemented
- [ ] Condition-based permissions functional
- [ ] User role assignment/revocation works
- [ ] Administrative role management implemented

### Performance
- [ ] Permission evaluation completes in <5ms
- [ ] User permission checks optimized for API calls
- [ ] Complex role hierarchy queries under 10ms
- [ ] Concurrent permission checks handle 50+ users

### Security & Compliance
- [ ] All permission changes audited
- [ ] Cross-tenant access prevention verified
- [ ] Administrative controls tested and secured
- [ ] Integration with existing authentication system complete

### Integration Testing
- [ ] Spring Security integration verified
- [ ] JWT token integration tested
- [ ] Frontend permission enforcement working
- [ ] API endpoint permission checks functional

## Testing Requirements

### Unit Tests
- Permission evaluation logic
- Role hierarchy resolution
- Condition parsing and evaluation
- Tenant isolation verification

### Integration Tests  
- End-to-end permission workflows
- Multi-tenant permission separation
- Performance benchmarking
- Security penetration testing

### Test Data
- Create comprehensive test roles for legal practice
- Sample permission assignments for different user types
- Edge cases for complex permission scenarios

## Dependencies

### Upstream Dependencies
- V017: Multi-tenant foundation (Complete)
- V018: User authentication system (Complete)
- V019: Audit logging system (Complete)

### Downstream Impact
- All API endpoints will require permission check integration
- Frontend components will need permission-aware rendering
- Business logic will enforce permission-based operations

## Risk Mitigation

### Performance Risk
- **Risk**: Complex permission queries slow down API response times
- **Mitigation**: Extensive performance testing and query optimization

### Security Risk  
- **Risk**: Permission escalation vulnerabilities
- **Mitigation**: Comprehensive security review and penetration testing

### Complexity Risk
- **Risk**: RBAC system becomes too complex for end users
- **Mitigation**: Provide default role templates for common legal practice scenarios

## Deliverables

1. **Migration Script**: `V023__Advanced_RBAC_System.sql`
2. **Test Data**: Default roles and permissions for legal practice
3. **Documentation**: Permission model specification and usage guide
4. **Performance Benchmarks**: Response time measurements for permission checks
5. **Security Validation**: Test results proving tenant isolation and access control

## Success Metrics

- **Functionality**: 100% of designed permission scenarios working
- **Performance**: <5ms average permission evaluation time
- **Security**: 0 cross-tenant access incidents in testing  
- **Usability**: Default legal practice roles cover 90% of use cases
- **Integration**: Seamless integration with existing authentication system

---

**Next Task**: DB-024_Performance_Optimization  
**Related ADRs**: Permission System Design, Authentication Flow Migration  
**Sprint Goal Contribution**: Enables comprehensive security for all subsequent legal practice features