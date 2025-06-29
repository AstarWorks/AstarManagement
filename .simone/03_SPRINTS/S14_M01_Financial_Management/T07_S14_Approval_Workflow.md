# T07_S14: Expense Approval Workflow System

## 📋 Task Overview

**Sprint**: S14_M01_Financial_Management  
**Type**: Feature Development  
**Complexity**: Medium  
**Status**: Todo  
**Estimated Hours**: 12-16

### Description
Implement a comprehensive expense approval workflow system that manages the approval process for submitted expenses. The system should include approval queues, role-based notifications, status tracking, and automated workflow transitions. Integration with existing permission systems, audit trails, and notification infrastructure is required.

### Business Value
- Enforces financial control and compliance through structured approval processes
- Provides transparency and accountability in expense management
- Automates approval workflows to reduce manual overhead
- Enables audit trails for financial compliance and reporting
- Improves efficiency with role-based approval routing

### Requirements
- ✅ Create approval queue system with role-based assignment
- ✅ Implement approval workflow state machine
- ✅ Build approval notification system (email/in-app)
- ✅ Add approval history and audit trail
- ✅ Create approval dashboard for approvers
- ✅ Implement bulk approval capabilities
- ✅ Add approval delegation system
- ✅ Support conditional approval rules based on amount/type
- ✅ Integrate with existing RBAC permission system
- ✅ Create approval API endpoints and services

## 🗄️ Database Schema Analysis

Based on existing `expenses` table approval fields:
```sql
-- Existing approval fields in expenses table
approval_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
    approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED')
),
approved_by UUID REFERENCES users(id),
approved_at TIMESTAMP WITH TIME ZONE,
```

## 🔍 Codebase Analysis

### Existing Approval Patterns
Based on research, the following patterns exist in the codebase:

1. **Role-Based Permissions**: `StatusPermissionService.kt` implements comprehensive role-based permission checking
2. **Workflow State Management**: `StatusTransitionRules.kt` provides state transition validation
3. **Audit Events**: `AuditEventPublisher.kt` supports comprehensive audit trail publishing
4. **Notification Infrastructure**: Event-driven architecture supports notifications

### Permission System Integration
The existing `StatusPermissionService` provides:
- Role-based transition permissions (LAWYER, CLERK, CLIENT)
- Ownership-based validation
- Fine-grained permission checking
- Validation result patterns

### Workflow State Patterns
From `StatusTransitionRules.kt`:
- Critical transitions requiring confirmation
- Transitions requiring reason documentation
- Role-based transition permissions
- Terminal state handling

## 💻 Technical Guidance

### 1. Approval Queue System

Create approval queue management following existing patterns:

```kotlin
// Backend: ApprovalQueueService.kt
@Service
class ApprovalQueueService : BaseService() {
    
    fun getApprovalQueue(
        userId: UUID,
        userRole: UserRole,
        filters: ApprovalQueueFilters
    ): List<ApprovalQueueItem> {
        // Return expenses pending approval for user/role
    }
    
    fun assignApprover(
        expenseId: UUID,
        approverId: UUID,
        reason: String?
    ): ApprovalAssignmentResult
    
    fun bulkApprove(
        expenseIds: List<UUID>,
        approverId: UUID,
        decision: ApprovalDecision
    ): BulkApprovalResult
}
```

### 2. Approval Workflow State Machine

Implement workflow state management:

```kotlin
// Backend: ExpenseApprovalWorkflow.kt
object ExpenseApprovalWorkflow {
    
    data class ApprovalTransition(
        val from: ApprovalStatus,
        val to: ApprovalStatus,
        val requiredRole: UserRole? = null,
        val amountThreshold: BigDecimal? = null
    )
    
    private val workflowRules = mapOf(
        ApprovalStatus.PENDING to setOf(
            ApprovalTransition(ApprovalStatus.PENDING, ApprovalStatus.APPROVED, UserRole.LAWYER),
            ApprovalTransition(ApprovalStatus.PENDING, ApprovalStatus.REJECTED, UserRole.LAWYER),
            ApprovalTransition(ApprovalStatus.PENDING, ApprovalStatus.APPROVED, UserRole.CLERK, BigDecimal("10000"))
        ),
        ApprovalStatus.APPROVED to setOf(
            ApprovalTransition(ApprovalStatus.APPROVED, ApprovalStatus.REIMBURSED, UserRole.LAWYER)
        ),
        ApprovalStatus.REJECTED to setOf(
            ApprovalTransition(ApprovalStatus.REJECTED, ApprovalStatus.PENDING, null) // Resubmission
        )
    )
    
    fun canApprove(
        currentStatus: ApprovalStatus,
        newStatus: ApprovalStatus,
        userRole: UserRole,
        expenseAmount: BigDecimal
    ): Boolean
}
```

### 3. Notification System Integration

Leverage existing audit system for notifications:

```kotlin
// Backend: ApprovalNotificationService.kt
@Service
class ApprovalNotificationService(
    private val auditEventPublisher: AuditEventPublisher
) : BaseService() {
    
    fun publishApprovalRequest(
        expenseId: UUID,
        submiterId: UUID,
        approverId: UUID,
        expenseAmount: BigDecimal,
        expenseDescription: String
    ) {
        auditEventPublisher.publishCustomEvent(
            eventType = AuditEventType.APPROVAL_REQUESTED,
            entityType = "expense",
            entityId = expenseId.toString(),
            details = mapOf(
                "submiterId" to submiterId,
                "approverId" to approverId,
                "amount" to expenseAmount,
                "description" to expenseDescription
            )
        )
    }
    
    fun publishApprovalDecision(
        expenseId: UUID,
        approverId: UUID,
        decision: ApprovalDecision,
        reason: String?
    ) {
        auditEventPublisher.publishCustomEvent(
            eventType = AuditEventType.APPROVAL_DECISION,
            entityType = "expense",
            entityId = expenseId.toString(),
            details = mapOf(
                "approverId" to approverId,
                "decision" to decision.name,
                "reason" to reason
            )
        )
    }
}
```

### 4. Frontend Approval Dashboard

Create approval dashboard using existing patterns:

```vue
<!-- /src/components/approvals/ApprovalDashboard.vue -->
<template>
  <div class="approval-dashboard">
    <div class="dashboard-header">
      <h1>Approval Queue</h1>
      <div class="header-actions">
        <Button 
          v-if="selectedItems.length > 0"
          @click="showBulkApprovalModal = true"
        >
          Bulk Approve ({{ selectedItems.length }})
        </Button>
      </div>
    </div>
    
    <div class="approval-filters">
      <ApprovalFilters 
        v-model="filters"
        @filter-change="handleFilterChange"
      />
    </div>
    
    <div class="approval-queue">
      <ApprovalQueueTable
        :items="approvalQueue"
        :loading="loading"
        v-model:selected="selectedItems"
        @approve="handleApprove"
        @reject="handleReject"
        @view-details="handleViewDetails"
      />
    </div>
    
    <!-- Bulk Approval Modal -->
    <BulkApprovalModal
      v-if="showBulkApprovalModal"
      :expenses="selectedExpenses"
      @confirm="handleBulkApproval"
      @cancel="showBulkApprovalModal = false"
    />
  </div>
</template>

<script setup lang="ts">
import { useApprovals } from '~/composables/useApprovals'
import type { ApprovalQueueItem, ApprovalDecision } from '~/types/approval'

const { 
  approvalQueue, 
  loading, 
  approveExpense, 
  rejectExpense,
  bulkApproveExpenses 
} = useApprovals()

const selectedItems = ref<string[]>([])
const showBulkApprovalModal = ref(false)
const filters = ref({
  status: 'PENDING',
  dateRange: null,
  amountRange: null
})

const handleApprove = async (expenseId: string, reason?: string) => {
  await approveExpense(expenseId, reason)
  // Refresh queue
}

const handleBulkApproval = async (decision: ApprovalDecision, reason?: string) => {
  await bulkApproveExpenses(selectedItems.value, decision, reason)
  selectedItems.value = []
  showBulkApprovalModal.value = false
}
</script>
```

### 5. Approval Composable

Create composable for approval operations:

```typescript
// /src/composables/useApprovals.ts
export function useApprovals() {
  const approvalQueue = ref<ApprovalQueueItem[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  const { $fetch } = useNuxtApp()
  
  const fetchApprovalQueue = async (filters?: ApprovalQueueFilters) => {
    loading.value = true
    try {
      const response = await $fetch('/api/approvals/queue', {
        params: filters
      })
      approvalQueue.value = response.data
    } catch (err) {
      error.value = err.message
    } finally {
      loading.value = false
    }
  }
  
  const approveExpense = async (expenseId: string, reason?: string) => {
    await $fetch(`/api/expenses/${expenseId}/approve`, {
      method: 'POST',
      body: { reason }
    })
    // Refresh approval queue
    await fetchApprovalQueue()
  }
  
  const rejectExpense = async (expenseId: string, reason: string) => {
    await $fetch(`/api/expenses/${expenseId}/reject`, {
      method: 'POST',
      body: { reason }
    })
    await fetchApprovalQueue()
  }
  
  const bulkApproveExpenses = async (
    expenseIds: string[], 
    decision: ApprovalDecision,
    reason?: string
  ) => {
    await $fetch('/api/expenses/bulk-approve', {
      method: 'POST',
      body: { expenseIds, decision, reason }
    })
    await fetchApprovalQueue()
  }
  
  return {
    approvalQueue: readonly(approvalQueue),
    loading: readonly(loading),
    error: readonly(error),
    fetchApprovalQueue,
    approveExpense,
    rejectExpense,
    bulkApproveExpenses
  }
}
```

## 📝 Implementation Notes

### Approval Rules Configuration

1. **Amount-Based Rules**:
   - Clerks can approve expenses up to ¥10,000
   - Lawyers can approve any amount
   - Expenses over ¥50,000 require senior lawyer approval

2. **Type-Based Rules**:
   - Court fees require automatic approval
   - Travel expenses over ¥20,000 require receipt
   - Expert witness fees require prior approval

3. **Escalation Rules**:
   - Auto-escalate after 48 hours without action
   - Delegate approval during absence
   - Emergency approval process for urgent expenses

### Notification Delivery System

Integrate with existing audit event system:

```kotlin
// Listen to approval events and send notifications
@EventListener
fun handleApprovalRequested(event: ApprovalRequestedEvent) {
    // Send email notification to approver
    // Create in-app notification
    // Schedule reminder notifications
}

@EventListener  
fun handleApprovalDecision(event: ApprovalDecisionEvent) {
    // Notify submitter of decision
    // Update approval status
    // Trigger reimbursement process if approved
}
```

### Role-Based Approval Queues

1. **Lawyer Queue**:
   - All expense approvals
   - High-value approvals (>¥50,000)
   - Appeal/escalation requests

2. **Senior Lawyer Queue**:
   - Expenses >¥100,000
   - Policy exception requests
   - Rejected expense appeals

3. **Clerk Queue**:
   - Small expenses (<¥10,000)
   - Routine administrative costs
   - Pre-approved categories

### Workflow State Transitions

```
PENDING → APPROVED → REIMBURSED
   ↓
REJECTED → PENDING (resubmission)
```

## 🧪 Testing Requirements

### Unit Tests
- Approval workflow state machine tests
- Permission validation tests
- Notification service tests
- Bulk approval logic tests

### Integration Tests
- End-to-end approval flow
- Notification delivery tests
- Audit trail verification
- Role-based access tests

### E2E Tests
- Complete approval workflow
- Bulk approval operations
- Notification interactions
- Dashboard functionality

## 🔗 Dependencies

**Backend Services**:
- StatusPermissionService (role validation)
- AuditEventPublisher (audit trails)
- Existing user management system

**Frontend Components**:
- shadcn-vue table components
- Form components for approval actions
- Modal components for bulk operations
- Notification system

**Related Tasks**:
- T01_S14: Expense Entry Form (foundation)
- T04_S14: Financial Dashboard (integration)
- T05_S14: Reporting Export (approval data)

## ✅ Acceptance Criteria

### Core Functionality
- [ ] Approval queue displays pending expenses correctly
- [ ] Role-based approval permissions enforced
- [ ] Approval/rejection actions work with reason tracking
- [ ] Bulk approval operations function correctly
- [ ] Approval history is maintained and auditable

### Notification System
- [ ] Approval request notifications sent to appropriate approvers
- [ ] Decision notifications sent to expense submitters
- [ ] Escalation notifications for overdue approvals
- [ ] In-app notification badges and counters work

### Workflow Management
- [ ] State transitions follow business rules
- [ ] Amount-based approval routing works
- [ ] Delegation system functions for absent approvers
- [ ] Emergency approval process available

### Integration
- [ ] Audit events generated for all approval actions
- [ ] Permission system integration working
- [ ] Dashboard displays real-time approval queue
- [ ] API endpoints return correct data and handle errors

## 📌 Resources

- [Spring State Machine Documentation](https://spring.io/projects/spring-statemachine)
- [TanStack Query Optimistic Updates](https://tanstack.com/query/latest/docs/vue/guides/optimistic-updates)
- [Vue 3 Composition API Guide](https://vuejs.org/guide/extras/composition-api-faq.html)
- [Pinia State Management](https://pinia.vuejs.org/)