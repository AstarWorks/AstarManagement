---
task_id: T06_S02_M003_Delete_Confirmation
status: pending
priority: Low
dependencies: T04_S01_M002_REST_Controllers, T03_S01_M002_Repository_Interfaces
sprint: S02_M003_CORE_FEATURES
updated: 2025-08-04
---

# T06_S02_M003 - Delete Functionality with Confirmation

## Task Overview
**Duration**: 4 hours  
**Priority**: Low  
**Dependencies**: T04_S01_M002_REST_Controllers, T03_S01_M002_Repository_Interfaces  
**Sprint**: S02_M003_CORE_FEATURES  

## Objective
Implement safe expense deletion with confirmation dialog and soft delete functionality, including undo capability and proper user feedback through toast notifications.

## Background
This task focuses on implementing a robust deletion system that protects users from accidental data loss while providing clear feedback. The implementation includes confirmation dialogs, soft delete functionality, and undo capabilities with toast notifications.

Based on codebase analysis, the project already has:
- Dialog component system using reka-ui (`/frontend/app/components/ui/dialog/`)
- Basic confirmation patterns in `useCaseModal.ts` using browser `confirm()`
- Toast notification integration points in composables
- Soft delete structure defined in attachment types (`deletedAt`, `deletedBy`)

## Technical Requirements

### 1. Frontend Confirmation Dialog System

**Location**: `/frontend/app/components/expense/`

**Dialog Component Structure**:
```vue
<!-- ExpenseDeleteDialog.vue -->
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>{{ $t('expense.delete.title') }}</DialogTitle>
        <DialogDescription>
          {{ $t('expense.delete.message', { title: expense?.title }) }}
        </DialogDescription>
      </DialogHeader>
      
      <div class="flex flex-col gap-3">
        <div class="bg-destructive/10 border border-destructive/20 rounded-md p-3">
          <div class="flex items-center gap-2">
            <Icon name="lucide:alert-triangle" class="text-destructive size-4" />
            <span class="text-sm text-destructive font-medium">
              {{ $t('expense.delete.warning') }}
            </span>
          </div>
        </div>
      </div>
      
      <DialogFooter class="gap-2">
        <Button variant="outline" @click="handleCancel">
          {{ $t('common.cancel') }}
        </Button>
        <Button 
          variant="destructive" 
          @click="handleConfirm"
          :loading="isDeleting"
        >
          {{ $t('expense.delete.confirm') }}
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>
```

### 2. Expense Delete Composable

**Location**: `/frontend/app/composables/useExpenseDelete.ts`

**Core Functionality**:
```typescript
export const useExpenseDelete = () => {
  const isDeleting = ref(false)
  const deleteError = ref<string | null>(null)
  
  // Toast notification integration point
  // const toast = useToast() // When toast system is implemented
  
  const deleteExpense = async (expenseId: string) => {
    isDeleting.value = true
    deleteError.value = null
    
    try {
      await $fetch(`/api/v1/expenses/${expenseId}`, {
        method: 'DELETE'
      })
      
      // Show success toast notification
      console.log('[Success] Expense deleted successfully')
      // toast?.success(t('expense.delete.success'))
      
      return { success: true }
    } catch (error: any) {
      deleteError.value = error.message || 'Delete failed'
      console.error('[Error] Delete failed:', error)
      // toast?.error(deleteError.value)
      
      return { success: false, error: deleteError.value }
    } finally {
      isDeleting.value = false
    }
  }
  
  const undoDelete = async (expenseId: string) => {
    try {
      await $fetch(`/api/v1/expenses/${expenseId}/restore`, {
        method: 'POST'
      })
      
      console.log('[Success] Expense restored successfully')
      // toast?.success(t('expense.restore.success'))
      
      return { success: true }
    } catch (error: any) {
      console.error('[Error] Restore failed:', error)
      // toast?.error(t('expense.restore.error'))
      
      return { success: false, error: error.message }
    }
  }
  
  return {
    isDeleting: readonly(isDeleting),
    deleteError: readonly(deleteError),
    deleteExpense,
    undoDelete
  }
}
```

### 3. Backend Soft Delete Implementation

**Location**: `/backend/src/main/kotlin/com/astarworks/astarmanagement/expense/`

**Entity Modification**:
```kotlin
// domain/model/ExpenseEntity.kt
@Entity
@Table(name = "expenses")
@SQLDelete(sql = "UPDATE expenses SET deleted_at = CURRENT_TIMESTAMP WHERE id = ?")
@Where(clause = "deleted_at IS NULL")
data class ExpenseEntity(
    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    val id: UUID = UUID.randomUUID(),
    
    // ... existing fields ...
    
    @Column(name = "deleted_at")
    val deletedAt: LocalDateTime? = null,
    
    @Column(name = "deleted_by")
    val deletedBy: UUID? = null
) {
    fun isDeleted(): Boolean = deletedAt != null
}
```

**Service Layer**:
```kotlin
// application/service/ExpenseService.kt
@Service
class ExpenseService(
    private val expenseRepository: ExpenseRepository
) {
    fun softDeleteExpense(expenseId: UUID, userId: UUID): ExpenseDto {
        val expense = expenseRepository.findById(expenseId)
            .orElseThrow { EntityNotFoundException("Expense not found: $expenseId") }
        
        val deletedExpense = expense.copy(
            deletedAt = LocalDateTime.now(),
            deletedBy = userId
        )
        
        return expenseRepository.save(deletedExpense).toDto()
    }
    
    fun restoreExpense(expenseId: UUID): ExpenseDto {
        // Use native query to find soft-deleted expense
        val expense = expenseRepository.findByIdIncludingDeleted(expenseId)
            .orElseThrow { EntityNotFoundException("Expense not found: $expenseId") }
        
        if (!expense.isDeleted()) {
            throw IllegalStateException("Expense is not deleted")
        }
        
        val restoredExpense = expense.copy(
            deletedAt = null,
            deletedBy = null
        )
        
        return expenseRepository.save(restoredExpense).toDto()
    }
}
```

**Repository Extension**:
```kotlin
// infrastructure/repository/ExpenseRepository.kt
interface ExpenseRepository : JpaRepository<ExpenseEntity, UUID> {
    @Query("SELECT e FROM ExpenseEntity e WHERE e.id = :id")
    fun findByIdIncludingDeleted(id: UUID): Optional<ExpenseEntity>
    
    @Query("SELECT e FROM ExpenseEntity e WHERE e.deletedAt IS NOT NULL")
    fun findAllDeleted(): List<ExpenseEntity>
}
```

**Controller Endpoints**:
```kotlin
// presentation/controller/ExpenseController.kt
@DeleteMapping("/{id}")
fun deleteExpense(
    @PathVariable id: UUID,
    authentication: Authentication
): ResponseEntity<ExpenseDto> {
    val userId = getUserIdFromAuth(authentication)
    val deleted = expenseService.softDeleteExpense(id, userId)
    return ResponseEntity.ok(deleted)
}

@PostMapping("/{id}/restore")
fun restoreExpense(@PathVariable id: UUID): ResponseEntity<ExpenseDto> {
    val restored = expenseService.restoreExpense(id)
    return ResponseEntity.ok(restored)
}
```

### 4. Toast Notification Integration

**Future Integration Points**:
- Use existing console.log patterns for now
- Integration points marked for future toast system
- Success/error feedback through UI state updates

**Notification Messages Structure**:
```typescript
// locales/ja/expense.ts - Add to existing structure
export const expenseDeleteMessages = {
  delete: {
    title: '実費を削除',
    message: '「{{title}}」を削除してもよろしいですか？',
    warning: 'この操作は元に戻すことができます（30日間）',
    confirm: '削除する',
    success: '実費を削除しました',
    error: '削除に失敗しました'
  },
  restore: {
    success: '実費を復元しました',
    error: '復元に失敗しました'
  }
}
```

## Implementation Guidance

### Dialog Component Usage
Based on existing patterns in the codebase:

1. **Use reka-ui Dialog Components**: Follow the established pattern in `/frontend/app/components/ui/dialog/`
2. **Confirmation Flow**: Replace browser `confirm()` with proper Dialog components
3. **Loading States**: Use Button loading prop during delete operations
4. **Error Handling**: Display errors within dialog or via console/future toast

### Soft Delete Strategy
- **Soft Delete Preferred**: Use `deletedAt` timestamp approach
- **Hibernate Annotations**: Use `@SQLDelete` and `@Where` for automatic soft delete
- **Repository Queries**: Provide methods to query both active and deleted records
- **Audit Trail**: Include `deletedBy` for compliance requirements

### Undo Functionality Design
- **Time Window**: 30-day restore capability
- **User Feedback**: Clear success/error messages
- **Restore Endpoint**: Separate API endpoint for restoration
- **Permission Checks**: Ensure user can restore their own deletions

## Integration Points

### Frontend Integration
- **Dialog System**: Integrate with existing reka-ui dialog components
- **State Management**: Use composition API patterns from existing composables
- **I18n Support**: Follow established translation key structure
- **Error Handling**: Consistent with existing error handling patterns

### Backend Integration  
- **Security Context**: Use existing authentication patterns
- **Repository Layer**: Extend existing JPA repository structure
- **Service Layer**: Follow established service patterns
- **Controller Layer**: Consistent with existing REST API design

### Future Enhancements
- **Toast Notifications**: Ready for integration when toast system is implemented
- **Bulk Operations**: Foundation for bulk delete/restore operations
- **Admin Recovery**: Extended recovery options for administrators

## Implementation Steps

1. **Create Dialog Component** (1 hour)
   - Build `ExpenseDeleteDialog.vue` using existing dialog patterns
   - Implement confirmation flow with proper styling
   - Add loading states and error handling

2. **Implement Delete Composable** (1 hour)
   - Create `useExpenseDelete.ts` with delete/restore logic
   - Add integration points for future toast notifications
   - Implement error handling and loading states

3. **Backend Soft Delete Implementation** (1.5 hours)
   - Add soft delete fields to ExpenseEntity
   - Implement soft delete in service layer
   - Create restore endpoint in controller
   - Extend repository with deletion queries

4. **Integration and Testing** (0.5 hours)
   - Integrate dialog with expense list components
   - Test delete/restore flow
   - Verify soft delete behavior in database
   - Test error scenarios

## Testing Requirements

### Frontend Testing
- [ ] Dialog opens and closes correctly
- [ ] Confirmation flow works as expected
- [ ] Loading states display during operations
- [ ] Error messages display appropriately
- [ ] Cancel functionality works properly

### Backend Testing
- [ ] Soft delete marks records correctly
- [ ] Restore functionality works
- [ ] Queries exclude soft-deleted records
- [ ] Repository methods handle deleted records
- [ ] API endpoints return correct responses

### Integration Testing
- [ ] End-to-end delete confirmation flow
- [ ] Database state after soft delete

## Output Log

[2025-08-05 08:12]: Code Review - FAIL
Result: **FAIL** - Implementation deviates from specification in multiple areas.
**Scope:** T06_S02_M003_Delete_Confirmation - Delete functionality with confirmation dialog and soft delete.
**Findings:** 
1. API Parameter Inconsistency (Severity: 6/10) - Uses `{ description: expense?.description }` instead of specified `{ title: expense?.title }` in dialog message
2. Button Property Inconsistency (Severity: 4/10) - Uses `:disabled="deleting"` instead of specified `:loading="isDeleting"` prop
3. i18n Interpolation Format (Severity: 3/10) - Translation uses `{description}` instead of specified `{{title}}` format
4. Component Path Deviation (Severity: 2/10) - Located in `/components/expenses/` instead of specified `/components/expense/`
5. Mock vs Real API (Severity: 1/10) - Uses mock implementation instead of real API endpoints (acceptable for development)
**Summary:** While core functionality is implemented correctly (ExpenseDeleteDialog component, useExpenseDelete composable, i18n integration, shadcn-vue usage), there are specific parameter and property name mismatches that deviate from the exact specification requirements. The implementation demonstrates good architecture but fails to follow the precise naming conventions and property specifications.
**Recommendation:** Fix parameter naming inconsistencies: change `description` to `title` in dialog message, use `:loading` instead of `:disabled` on button, and align i18n interpolation format with specification.

[2025-08-05 03:44]: Code Review - FAIL
Result: **FAIL** - Critical deviations from specification found. Current implementation does not meet requirements.
**Scope:** T06_S02_M003_Delete_Confirmation - Delete functionality with confirmation dialog and soft delete.
**Findings:** 
1. Missing ExpenseDeleteDialog Component (Severity: 9/10) - Required custom dialog not implemented, using browser confirm() instead
2. Missing useExpenseDelete Composable (Severity: 8/10) - Required composable architecture pattern not followed
3. Missing Undo/Restore Functionality (Severity: 9/10) - Core 30-day restore capability completely absent
4. Missing i18n Integration (Severity: 7/10) - Translation keys not properly structured as specified
5. Improper Toast Integration (Severity: 5/10) - Direct usage instead of following composable pattern
6. Code Location Issue (Severity: 3/10) - Delete logic in wrong location reducing reusability
**Summary:** Current implementation uses basic browser confirm() dialog instead of the specified custom ExpenseDeleteDialog component. Missing critical features including undo/restore functionality, proper composable architecture, and i18n integration. The implementation does not follow the "Simple over Easy" design principle and violates architectural requirements.
**Recommendation:** Complete rewrite required following the full specification. Implement ExpenseDeleteDialog.vue, useExpenseDelete.ts composable, proper i18n keys, and undo/restore functionality as specified in the task requirements.
- [ ] Restore functionality via API
- [ ] Error handling across full stack

## Success Criteria

- [ ] Confirmation dialog implemented using project's dialog system
- [ ] Soft delete functionality working in backend
- [ ] Undo/restore capability functional
- [ ] Clear user feedback through existing patterns
- [ ] Integration points ready for future toast system
- [ ] Consistent with project's UI/UX patterns
- [ ] Error handling covers edge cases
- [ ] Database maintains referential integrity

## Security Considerations

### Legal Practice Requirements
- **Audit Trail**: Track who deleted and when for compliance
- **Data Retention**: 30-day soft delete period for recovery
- **Permission Checks**: Users can only delete their own expenses
- **Client Data Protection**: Ensure soft delete doesn't break attorney-client privilege

### Implementation Security
- **SQL Injection Prevention**: Use parameterized queries
- **Authorization**: Verify user permissions before delete/restore
- **Input Validation**: Validate expense IDs and user context
- **Soft Delete Integrity**: Prevent hard delete through application layer

## Performance Considerations

- **Query Performance**: Indexed `deleted_at` column for filtering
- **Database Growth**: Soft delete increases table size over time
- **Cleanup Strategy**: Future implementation of permanent deletion after retention period
- **Cache Invalidation**: Clear relevant caches after delete/restore operations

## Files to Create/Modify

### Frontend Files
- `/frontend/app/components/expense/ExpenseDeleteDialog.vue` - New confirmation dialog
- `/frontend/app/composables/useExpenseDelete.ts` - New delete/restore logic
- `/frontend/app/locales/ja/expense.ts` - Add delete/restore messages
- `/frontend/app/locales/en/expense.ts` - Add English translations

### Backend Files
- `/backend/src/main/kotlin/.../expense/domain/model/ExpenseEntity.kt` - Add soft delete fields
- `/backend/src/main/kotlin/.../expense/application/service/ExpenseService.kt` - Add delete/restore methods
- `/backend/src/main/kotlin/.../expense/infrastructure/repository/ExpenseRepository.kt` - Extend with deletion queries
- `/backend/src/main/kotlin/.../expense/presentation/controller/ExpenseController.kt` - Add delete/restore endpoints

## Related Tasks

- T04_S01_M002_REST_Controllers - Provides foundation for delete endpoints
- T03_S01_M002_Repository_Interfaces - Provides repository structure for soft delete
- Future: Toast notification system implementation
- Future: Bulk delete operations

---

**Note**: This task implements the foundation for safe deletion with confirmation. The soft delete approach ensures data integrity while providing user-friendly undo functionality. Integration points are prepared for future toast notification system.