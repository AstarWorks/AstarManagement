# Requirement: R03 - Status History and Audit Trail

## Overview
Implement comprehensive audit logging for all matter changes with special focus on status transitions, including timestamp recording, user tracking, and compliance with legal record-keeping requirements.

## Detailed Requirements

### 1. Status History Tracking

#### 1.1 Data Model

```kotlin
data class MatterStatusHistory(
    val id: UUID = UUID.randomUUID(),
    val matterId: UUID,
    val oldStatus: MatterStatus?,
    val newStatus: MatterStatus,
    val changedAt: Instant = Instant.now(),
    val changedBy: UUID,
    val changedByName: String, // Denormalized for history
    val reason: String?, // Optional reason for change
    val notes: String?, // Additional notes
    val metadata: Map<String, Any> = emptyMap() // For additional context
)

data class MatterAuditLog(
    val id: UUID = UUID.randomUUID(),
    val matterId: UUID,
    val action: AuditAction,
    val fieldName: String?,
    val oldValue: String?,
    val newValue: String?,
    val performedAt: Instant = Instant.now(),
    val performedBy: UUID,
    val performedByName: String,
    val ipAddress: String,
    val userAgent: String,
    val sessionId: String
)

enum class AuditAction {
    CREATE,
    UPDATE,
    DELETE,
    STATUS_CHANGE,
    ASSIGN,
    UNASSIGN,
    VIEW,
    EXPORT,
    PRINT
}
```

### 2. Status Transition Rules

#### 2.1 Valid Transitions Matrix

| From Status | Valid To Status |
|------------|-----------------|
| INITIAL_CONSULTATION | DOCUMENT_PREPARATION, CLOSED_WITHDRAWN |
| DOCUMENT_PREPARATION | FILED, ON_HOLD, CLOSED_WITHDRAWN |
| FILED | IN_PROGRESS, WAITING_COURT_DATE, CLOSED_WITHDRAWN |
| IN_PROGRESS | WAITING_COURT_DATE, IN_COURT, SETTLEMENT_DISCUSSION, ON_HOLD |
| WAITING_COURT_DATE | IN_COURT, SETTLEMENT_DISCUSSION, CLOSED_WITHDRAWN |
| IN_COURT | WAITING_COURT_DATE, SETTLEMENT_DISCUSSION, CLOSED_* |
| SETTLEMENT_DISCUSSION | IN_COURT, CLOSED_SETTLED, CLOSED_WITHDRAWN |
| ON_HOLD | (Any status except CLOSED_*) |
| CLOSED_* | (No transitions allowed) |

#### 2.2 Transition Validation Service

```kotlin
@Service
class MatterStatusTransitionService {
    fun validateTransition(
        currentStatus: MatterStatus,
        newStatus: MatterStatus,
        userRole: Role
    ): ValidationResult {
        // Check if transition is valid
        // Check if user has permission
        // Return validation result with reason if invalid
    }
    
    fun requiresApproval(
        currentStatus: MatterStatus,
        newStatus: MatterStatus
    ): Boolean {
        // Closing a matter requires supervisor approval
        return newStatus.name.startsWith("CLOSED_")
    }
}
```

### 3. Audit Trail Requirements

#### 3.1 What to Track

**Always Track:**
- All CRUD operations on matters
- All status changes
- Assignment changes
- Document associations
- User access (view, export, print)

**Track with Details:**
- WHO: User ID, name, role
- WHAT: Action performed, fields changed
- WHEN: Timestamp with timezone
- WHERE: IP address, location (if available)
- HOW: Application version, API endpoint

#### 3.2 Audit API Endpoints

```
GET /api/v1/matters/{id}/history
Response:
{
  "statusHistory": [
    {
      "id": "...",
      "oldStatus": "INITIAL_CONSULTATION",
      "newStatus": "DOCUMENT_PREPARATION",
      "changedAt": "2025-01-15T10:30:00Z",
      "changedBy": "山田太郎",
      "reason": "Client provided all necessary documents"
    }
  ],
  "auditLog": [
    {
      "action": "UPDATE",
      "fieldName": "assignedLawyerId",
      "oldValue": "null",
      "newValue": "550e8400-e29b-41d4-a716-446655440000",
      "performedAt": "2025-01-15T09:15:00Z",
      "performedBy": "管理者"
    }
  ]
}
```

### 4. UI Components for History

#### 4.1 Timeline View

```
Status History Timeline
━━━━━━━━━━━━━━━━━━━━━

● 2025-01-15 14:30 - Current Status: In Court
  Changed by: 山田弁護士
  Note: First hearing completed

│ 2 days

● 2025-01-13 10:15 - Filed
  Changed by: 鈴木事務員
  Note: Documents submitted to court

│ 5 days

● 2025-01-08 09:00 - Document Preparation
  Changed by: 山田弁護士
  
│ 1 day

● 2025-01-07 15:45 - Initial Consultation
  Created by: 田中弁護士
  Note: New client intake
```

#### 4.2 Detailed Audit View

Tabbed interface showing:
- Status changes only
- All field changes
- Access log
- Export/Print history

### 5. Compliance Features

#### 5.1 Legal Requirements
- Audit logs must be immutable (no updates/deletes)
- Retain for minimum 10 years
- Support legal discovery exports
- Timestamp with legal time (JST)

#### 5.2 Data Retention

```sql
-- Partition by year for efficient archival
CREATE TABLE matter_audit_log_2025 PARTITION OF matter_audit_log
FOR VALUES FROM ('2025-01-01') TO ('2026-01-01');

-- Create index for efficient queries
CREATE INDEX idx_audit_matter_date 
ON matter_audit_log(matter_id, performed_at DESC);
```

### 6. Reporting Features

#### 6.1 Status Duration Report
- Average time in each status
- Bottleneck identification
- SLA compliance tracking

#### 6.2 User Activity Report
- Actions per user per day
- Most active times
- Unusual activity alerts

### 7. Implementation Considerations

#### 7.1 Performance
- Asynchronous audit logging
- Batch inserts for high-volume operations
- Separate read replica for audit queries

#### 7.2 Security
- Encrypt sensitive audit data
- Sign audit records for tamper detection
- Separate audit database with restricted access

#### 7.3 Integration
```kotlin
@Component
class AuditInterceptor {
    @EventListener
    fun handleMatterChange(event: MatterChangedEvent) {
        // Automatically capture all changes
        // Queue for async processing
    }
}
```

### 8. Testing Requirements

- Unit tests for transition validation logic
- Integration tests for audit capture
- Performance tests with high-volume changes
- Compliance tests for data retention
- Security tests for audit tampering

## Additional Notes

1. Consider using Event Sourcing for complete audit trail
2. Implement audit log viewers with appropriate access controls
3. Set up alerts for suspicious patterns
4. Regular audit log backups to separate storage
5. Consider blockchain for critical audit records