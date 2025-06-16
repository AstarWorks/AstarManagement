# Status Transition Matrix and Business Rules

## Overview

This document defines the comprehensive status transition matrix for the Aster Management legal case management system, including role-based permissions, business rules, and validation logic.

## Matter Status Workflow

The system implements a sequential workflow that guides legal matters through their lifecycle:

```
INTAKE → INITIAL_REVIEW → INVESTIGATION → RESEARCH → DRAFT_PLEADINGS → FILED → DISCOVERY → MEDIATION → TRIAL_PREP → TRIAL → SETTLEMENT → CLOSED
```

### Status Definitions

| Status | Description | Purpose |
|--------|-------------|---------|
| **INTAKE** | Initial case reception | Matter received, basic information collected |
| **INITIAL_REVIEW** | Preliminary assessment | Initial evaluation of case merit and complexity |
| **INVESTIGATION** | Fact gathering phase | Collection of evidence and documentation |
| **RESEARCH** | Legal research phase | Case law research and legal analysis |
| **DRAFT_PLEADINGS** | Document preparation | Drafting of legal documents and pleadings |
| **FILED** | Court filing completed | Documents submitted to court system |
| **DISCOVERY** | Evidence exchange | Pre-trial discovery and evidence gathering |
| **MEDIATION** | Alternative dispute resolution | Mediation or settlement negotiations |
| **TRIAL_PREP** | Trial preparation | Final preparation for court proceedings |
| **TRIAL** | Active litigation | Matter is in trial |
| **SETTLEMENT** | Matter resolved via settlement | Case resolved through settlement |
| **CLOSED** | Matter completed | Final status, case concluded |

## Status Transition Matrix

### Valid Transitions by Current Status

| From Status | Valid To Status | Description |
|-------------|-----------------|-------------|
| **INTAKE** | INITIAL_REVIEW, CLOSED | Begin review or close if invalid |
| **INITIAL_REVIEW** | INVESTIGATION, RESEARCH, CLOSED | Move to fact-finding or close |
| **INVESTIGATION** | RESEARCH, DRAFT_PLEADINGS, CLOSED | Proceed to research/drafting or close |
| **RESEARCH** | DRAFT_PLEADINGS, FILED, CLOSED | Move to document prep or direct filing |
| **DRAFT_PLEADINGS** | FILED, RESEARCH, CLOSED | File documents or return to research |
| **FILED** | DISCOVERY, SETTLEMENT, CLOSED | Begin discovery, settle, or close |
| **DISCOVERY** | MEDIATION, TRIAL_PREP, SETTLEMENT, CLOSED | Move to resolution or trial prep |
| **MEDIATION** | SETTLEMENT, TRIAL_PREP, CLOSED | Settle, proceed to trial, or close |
| **TRIAL_PREP** | TRIAL, SETTLEMENT, CLOSED | Go to trial, settle, or close |
| **TRIAL** | SETTLEMENT, CLOSED | Settle during trial or close |
| **SETTLEMENT** | CLOSED | Complete the matter |
| **CLOSED** | *(terminal status)* | No further transitions allowed |

## Role-Based Permissions

### Lawyer Permissions (Full Access)
Lawyers have full access to all status transitions and can move matters through the complete workflow.

**Allowed Transitions:** All transitions listed in the matrix above

**Special Authorities:**
- Can close matters from any status
- Can approve high-priority direct transitions (e.g., INVESTIGATION → FILED)
- Can perform critical transitions (TRIAL, SETTLEMENT, CLOSED)

### Clerk Permissions (Limited Access)
Clerks have restricted access focused on administrative and preparatory work.

**Allowed Transitions:**
- INTAKE → INITIAL_REVIEW
- INITIAL_REVIEW → INVESTIGATION, RESEARCH
- INVESTIGATION → RESEARCH, DRAFT_PLEADINGS
- RESEARCH → DRAFT_PLEADINGS, FILED
- DRAFT_PLEADINGS → FILED, RESEARCH
- FILED → DISCOVERY
- DISCOVERY → MEDIATION, TRIAL_PREP
- MEDIATION → TRIAL_PREP

**Restrictions:**
- Cannot perform trial-related transitions (TRIAL_PREP → TRIAL)
- Cannot close matters or handle settlements
- Cannot make critical legal determinations

### Client Permissions (No Direct Access)
Clients cannot directly modify matter status but can provide information that may trigger status updates.

**Allowed Transitions:** None (read-only access)

**Information Provision:** Clients can provide information that may lead to status updates performed by lawyers or clerks.

## Business Rules and Validation

### 1. Priority-Based Rules

#### High Priority Matters
- Can skip intermediate steps (e.g., INVESTIGATION → FILED)
- Can be closed by lawyers from any status
- Require minimal additional validation

#### Medium Priority Matters
- Must follow standard workflow sequence
- Require proper preparation phases before trial

#### Low Priority Matters
- Must attempt mediation before trial
- Require comprehensive documentation
- Additional approval may be required for closure

### 2. Time-Based Rules

#### Premature Closure Protection
- Matters cannot be closed within 24 hours of creation
- Exception: High-priority matters closed by lawyers

#### Filing Deadlines
- Warning issued if filing occurs >90 days after draft completion
- No blocking rule, but flagged for review

### 3. Assignment-Based Rules

#### Lawyer Assignment
- Only assigned lawyers can modify matter status
- Exception: Administrative users with special permissions

#### Clerk Assignment
- Clerks can only modify matters they are assigned to
- Or matters where they support the assigned lawyer

### 4. Completion Requirements

#### Closure Validation
- Reason required for all closures
- Additional validation for trial/settlement closures
- Only lawyers can close from critical statuses

#### Settlement Documentation
- Settlement status requires detailed reasoning
- Terms must be documented for audit trail

## Validation Error Codes

| Error Code | Description | Resolution |
|------------|-------------|------------|
| `INVALID_TRANSITION` | State machine violation | Use valid transition path |
| `INSUFFICIENT_PERMISSION` | Role lacks authority | Contact authorized user |
| `NOT_ASSIGNED_LAWYER` | User not assigned to matter | Verify assignment |
| `NOT_ASSIGNED_CLERK` | Clerk not assigned to matter | Verify assignment |
| `REASON_REQUIRED` | Missing required reason | Provide transition reason |
| `BUSINESS_RULE_VIOLATION` | Violates business logic | Review business rules |
| `PREMATURE_CLOSURE` | Closing too soon | Wait or use override |
| `HIGH_PRIORITY_HOLD_RESTRICTED` | Clerk cannot hold high priority | Contact lawyer |
| `CRITICAL_STATUS_REQUIRES_LAWYER` | Lawyer required for transition | Assign lawyer |

## Performance Characteristics

### Validation Performance
- Single validation: <50ms
- Bulk validation (100 items): <2 seconds
- Cached transitions: <10ms per check

### Caching Strategy
- Role-permission matrix cached
- Transition rules cached per status
- Cache warm-up on application start
- Automatic cache invalidation on rule changes

## Audit Trail Requirements

### R03 Compliance
All status transitions generate comprehensive audit records including:

- **Transaction Details:** Old status, new status, reason
- **User Context:** User ID, role, username
- **Request Context:** IP address, user agent, session ID
- **Timing:** Precise timestamp (ISO 8601 format)
- **Additional Metadata:** Matter ID, audit ID, transaction ID

### Audit Record Format
```json
{
  "auditId": "uuid",
  "matterId": "uuid", 
  "action": "STATUS_CHANGE",
  "fieldName": "status",
  "oldValue": "INTAKE",
  "newValue": "INITIAL_REVIEW",
  "performedAt": "2025-06-16T07:10:00Z",
  "performedBy": "uuid",
  "performedByName": "John Lawyer",
  "ipAddress": "192.168.1.100",
  "userAgent": "Mozilla/5.0...",
  "sessionId": "session-uuid",
  "reason": "Starting initial review process"
}
```

## Integration Points

### Spring Security Integration
- Method-level security annotations
- Role-based access control
- Authentication context propagation

### Event Publishing
- Domain events published for all status changes
- Enables notifications and workflow automation
- Supports async processing and integration

### Internationalization
- Error messages in Japanese and English
- Status display names localized
- Business rule descriptions localized

## Extension Points

### Custom Business Rules
The system supports custom business rule implementation through:
- Pluggable business rule services
- Configurable validation chains
- Custom exception types

### Workflow Customization
Future enhancements may include:
- Configurable status workflows
- Matter-type specific transitions
- Client-specific business rules

## Testing Strategy

### Unit Tests
- State machine validation logic
- Role permission matrix
- Business rule enforcement
- Exception handling

### Integration Tests
- Spring Security context
- Database persistence
- Audit trail generation
- End-to-end workflows

### Performance Tests
- High-volume scenarios
- Concurrent access patterns
- Cache effectiveness
- Linear scaling validation

---

*This document is maintained as part of the Aster Management system documentation. Updates should reflect changes to business requirements and implementation.*