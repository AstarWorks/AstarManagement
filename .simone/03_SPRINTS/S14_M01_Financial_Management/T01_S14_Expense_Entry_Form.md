# T01_S14: Expense Entry Form

## 📋 Task Overview

**Sprint**: S14_M01_Financial_Management  
**Type**: Feature Development  
**Complexity**: Medium  
**Status**: in_progress  
**Updated**: 2025-07-03 19:36  
**Estimated Hours**: 8-12

### Description
Implement a comprehensive expense entry form for the Aster Management system that allows users to record expenses with validation, categorization, and receipt upload functionality. The form should integrate with existing form patterns using VeeValidate and Zod schemas, follow the established component architecture, and provide seamless CRUD operations through the API.

### Business Value
- Enables efficient expense tracking for legal matters and general firm expenses
- Provides accurate financial data for billing and reporting
- Streamlines approval workflow with proper validation and categorization
- Improves financial transparency and accountability

### Requirements
- ✅ Create expense entry form with all required fields from database schema
- ✅ Implement Zod validation schema for expense data
- ✅ Support expense categories with proper type validation
- ✅ Enable receipt file upload with image preview
- ✅ Implement matter association (optional field)
- ✅ Add billable/non-billable toggle
- ✅ Create responsive form layout using shadcn-vue components
- ✅ Implement CRUD operations (Create, Read, Update, Delete)
- ✅ Add expense listing view with filtering capabilities
- ✅ Integrate with audit event system for tracking changes

## 🗄️ Database Schema Reference

Based on the `expenses` table from `/backend/src/main/resources/db/migration/V005__Create_supporting_tables.sql`:

```sql
CREATE TABLE expenses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    matter_id UUID REFERENCES matters(id) ON DELETE SET NULL,
    description VARCHAR(500) NOT NULL,
    amount DECIMAL(10,2) NOT NULL CHECK (amount >= 0),
    currency VARCHAR(3) DEFAULT 'JPY' NOT NULL,
    expense_date DATE NOT NULL,
    expense_type VARCHAR(50) NOT NULL CHECK (
        expense_type IN (
            'TRAVEL', 'MEALS', 'ACCOMMODATION', 'COURT_FEES', 
            'FILING_FEES', 'COPYING', 'POSTAGE', 'TELEPHONE',
            'RESEARCH', 'EXPERT_WITNESS', 'OTHER'
        )
    ),
    receipt_filename VARCHAR(500),
    receipt_required BOOLEAN DEFAULT true,
    approval_status VARCHAR(20) DEFAULT 'PENDING' CHECK (
        approval_status IN ('PENDING', 'APPROVED', 'REJECTED', 'REIMBURSED')
    ),
    approved_by UUID REFERENCES users(id),
    approved_at TIMESTAMP WITH TIME ZONE,
    billable BOOLEAN DEFAULT true,
    billed BOOLEAN DEFAULT false,
    billing_rate DECIMAL(10,2),
    notes TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP NOT NULL,
    created_by UUID NOT NULL REFERENCES users(id),
    updated_by UUID NOT NULL REFERENCES users(id)
);
```

## 💻 Technical Guidance

### Form Component Architecture

1. **Main Expense Form Component** (`/src/components/expenses/ExpenseForm.vue`)
   - Use the existing `Form.vue` component pattern from `/src/components/forms/Form.vue`
   - Implement with TypeScript and Vue 3 Composition API
   - Leverage VeeValidate integration for form handling

2. **Zod Validation Schema** (`/src/schemas/expense.ts`)
   - Create comprehensive validation schema following patterns in `/src/schemas/common.ts`
   - Include all required fields with proper validation rules
   - Support Japanese currency formatting

3. **Form Fields to Implement**:
   - `FormInput` for description and amount
   - `FormDatePicker` for expense date
   - `FormSelect` for expense type and currency
   - `FormSelect` for matter association (optional)
   - `FormSwitch` for billable status
   - `FormTextarea` for notes
   - File upload component for receipt

### Pinia Store Pattern

Create expense store following the pattern in `/src/stores/matter.ts`:

```typescript
// /src/stores/expense.ts
export const useExpenseStore = defineStore('expense', () => {
  const expenses = ref<Expense[]>([])
  const selectedExpense = ref<Expense | null>(null)
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // Actions for CRUD operations
  const createExpense = async (data: ExpenseCreateInput) => { /* ... */ }
  const updateExpense = async (id: string, data: ExpenseUpdateInput) => { /* ... */ }
  const deleteExpense = async (id: string) => { /* ... */ }
  // ... other actions
})
```

### API Integration Pattern

Following the structure in `/src/server/api/matters.get.ts`:

1. **Create API endpoints**:
   - `POST /api/expenses` - Create new expense
   - `GET /api/expenses` - List expenses with filtering
   - `GET /api/expenses/[id]` - Get expense details
   - `PATCH /api/expenses/[id]` - Update expense
   - `DELETE /api/expenses/[id]` - Delete expense

2. **Composable for API calls** (`/src/composables/useExpenses.ts`)
   - Implement using TanStack Query patterns
   - Handle loading states and error handling
   - Support optimistic updates

### Component Usage Example

```vue
<template>
  <ExpenseForm
    :initial-values="initialExpenseData"
    :matter-id="matterId"
    @submit:success="handleExpenseCreated"
    @submit:error="handleError"
  />
</template>

<script setup lang="ts">
import { ExpenseForm } from '~/components/expenses'
import type { Expense } from '~/types/expense'

const handleExpenseCreated = (expense: Expense) => {
  // Handle successful creation
  await navigateTo(`/expenses/${expense.id}`)
}

const handleError = (errors: Record<string, string>) => {
  // Handle validation errors
}
</script>
```

## 📝 Implementation Notes

### Key Considerations

1. **Expense Categories**:
   - Map database enum values to user-friendly labels
   - Consider i18n for Japanese/English support
   - Group related categories in the select dropdown

2. **Receipt Upload**:
   - Support image formats (JPEG, PNG) and PDF
   - Implement file size validation (max 10MB)
   - Show preview for uploaded receipts
   - Store in MinIO/GCS based on deployment

3. **Currency Handling**:
   - Default to JPY as per schema
   - Format amounts with proper decimal places
   - Consider adding currency conversion in future

4. **Audit Integration**:
   - Integrate with `AuditEvent.ExpenseCreated/Updated/Deleted` events
   - Track all changes for compliance

5. **Validation Rules**:
   - Amount must be positive number
   - Expense date cannot be future date
   - Receipt required based on expense type/amount
   - Description is mandatory

### Testing Requirements

1. **Unit Tests**:
   - Validation schema tests
   - Store action tests
   - Component rendering tests

2. **Integration Tests**:
   - Form submission flow
   - API endpoint tests
   - File upload functionality

3. **E2E Tests**:
   - Complete expense creation flow
   - Edit and delete operations
   - Filter and search functionality

## 🔗 Dependencies

- **Frontend Components**:
  - shadcn-vue form components
  - VeeValidate for form handling
  - Zod for validation
  - TanStack Query for API state

- **Backend Integration**:
  - Spring Boot REST API
  - PostgreSQL database
  - Audit event system

- **Related Tasks**:
  - T02_S14: Expense Approval Workflow
  - T03_S14: Financial Reports Generation
  - T04_S14: Per-diem Recording

## ✅ Acceptance Criteria

1. **Form Functionality**:
   - [ ] All required fields are present and validated
   - [ ] Receipt upload works with preview
   - [ ] Form saves successfully to database
   - [ ] Validation errors display clearly

2. **CRUD Operations**:
   - [ ] Can create new expenses
   - [ ] Can view expense details
   - [ ] Can edit existing expenses
   - [ ] Can delete expenses (with confirmation)

3. **UI/UX Requirements**:
   - [ ] Responsive design for mobile/desktop
   - [ ] Loading states during operations
   - [ ] Success/error notifications
   - [ ] Intuitive form layout

4. **Integration**:
   - [ ] Audit events are triggered
   - [ ] Matter association works correctly
   - [ ] Receipt storage is functional
   - [ ] API errors handled gracefully

## 📌 Resources

- [VeeValidate Documentation](https://vee-validate.logaretm.com/v4/)
- [Zod Schema Validation](https://zod.dev/)
- [shadcn-vue Components](https://www.shadcn-vue.com/)
- [TanStack Query Vue](https://tanstack.com/query/latest/docs/vue/overview)
- [Pinia State Management](https://pinia.vuejs.org/)

## Output Log

[2025-07-03 19:36]: Started T01_S14 implementation as foundation for T07_S14 approval workflow  
[2025-07-03 19:45]: Created comprehensive expense types and validation schemas with business rules  
[2025-07-03 19:52]: Implemented ExpenseForm.vue with full validation, receipt upload, and matter association  
[2025-07-03 19:58]: Created ExpenseCard.vue for list display with approval status indicators  
[2025-07-03 20:05]: Built expense store with Pinia and TanStack Query composables for API integration  
[2025-07-03 20:12]: Implemented ExpenseList.vue with filtering, pagination, and bulk operations support