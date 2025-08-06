---
task_id: T04_S02_M003
title: Expense Detail View
status: completed
estimated_hours: 8
actual_hours: 8
assigned_to: Claude
dependencies: ["T01_S02_M003", "T02_S02_M003", "T03_S02_M003"]
complexity: low
completed: 2025-08-05 02:16
updated: 2025-08-05 04:19
---

# T04_S02_M003: Expense Detail View

## Description
Create a comprehensive expense detail view that displays all expense information in a well-organized, readable format with action buttons for editing and deleting. The view should provide complete expense details including attachments preview, tags, audit information, and support both desktop and mobile layouts.

## Goal
Provide users with a complete overview of expense details, making it easy to review all information and take actions such as editing or deleting the expense entry.

## Focus Areas
- Display all expense fields in organized sections
- Show attachments with preview functionality
- Display tags with visual indicators
- Show audit information (created/updated timestamps)
- Provide action buttons for edit and delete operations
- Implement responsive design for mobile devices
- Add breadcrumb navigation
- Handle loading and error states gracefully

## Acceptance Criteria

### Core Functionality
- [x] Display expense detail view at route `/expenses/[id]`
- [x] Show all expense fields: date, category, description, amounts, balance
- [x] Display associated case information (if linked)
- [x] Show memo/notes section
- [x] Display tags with color-coded badges
- [x] Show attachments with preview thumbnails
- [x] Display audit information (created/updated dates and users)
- [x] Provide action buttons: Edit, Delete, Back to List
- [x] Implement breadcrumb navigation
- [x] Handle loading states during data fetch
- [x] Handle error states for not found or network errors

### Layout & Design
- [x] Use card-based layout with logical sections
- [x] Responsive design for mobile, tablet, and desktop
- [x] Consistent spacing and typography
- [x] Visual hierarchy with proper headings
- [x] Color-coded indicators for income vs expense
- [x] Empty states for optional fields
- [x] Loading skeleton components

### Navigation & Actions
- [x] Back button/breadcrumb to return to expense list
- [x] Edit button that navigates to edit form
- [x] Delete button with confirmation dialog
- [x] Print-friendly view option
- [x] Copy expense details to clipboard

### Data Display
- [x] Format currency amounts with proper locale
- [x] Format dates in user-friendly format
- [x] Show running balance calculation
- [x] Display case link as clickable if available
- [x] Show attachment file types and sizes
- [x] Display tag hierarchy if nested

## Technical Implementation

### Route Structure
```typescript
// pages/expenses/[id].vue
export default definePageMeta({
  title: 'expense.form.title.view',
  requiresAuth: true,
  breadcrumbs: [
    { label: 'navigation.dashboard', path: '/dashboard' },
    { label: 'expense.navigation.list', path: '/expenses' },
    { label: 'expense.form.title.view' }
  ]
})
```

### Component Architecture
```typescript
// Main page component structure
<template>
  <ExpenseDetailView
    :expense="expense"
    :loading="loading"
    :error="error"
    @edit="handleEdit"
    @delete="handleDelete"
    @back="handleBack"
  />
</template>

// ExpenseDetailView component sections:
// - ExpenseDetailHeader (title, actions, breadcrumbs)
// - ExpenseBasicInfo (date, category, description, amounts)
// - ExpenseCaseInfo (linked case details)
// - ExpenseMemo (notes section)
// - ExpenseTagsList (tag badges)
// - ExpenseAttachmentsList (file previews)
// - ExpenseAuditInfo (timestamps, version)
```

### Layout Sections

#### 1. Header Section
- Page title with expense ID/description
- Action buttons (Edit, Delete, Print)
- Breadcrumb navigation
- Back button for mobile

#### 2. Basic Information Card
```typescript
interface BasicInfoSection {
  date: string
  category: string
  description: string
  incomeAmount: number
  expenseAmount: number
  balance: number
  netAmount: number // calculated field
}
```

#### 3. Case Information Card
```typescript
interface CaseInfoSection {
  caseId?: string
  caseTitle?: string
  caseNumber?: string
  caseStatus?: string
  // Link to case detail if available
}
```

#### 4. Memo Section
```typescript
interface MemoSection {
  memo?: string
  isEmpty: boolean
  placeholder: string
}
```

#### 5. Tags Section
```typescript
interface TagsSection {
  tags: ITag[]
  isEmpty: boolean
  maxDisplay: number // show first N tags, rest in "more" dropdown
}
```

#### 6. Attachments Section
```typescript
interface AttachmentsSection {
  attachments: IAttachment[]
  isEmpty: boolean
  previewSupported: string[] // file types that support preview
  downloadEnabled: boolean
}
```

#### 7. Audit Information Card
```typescript
interface AuditInfoSection {
  createdAt: string
  createdBy?: string
  updatedAt: string
  updatedBy?: string
  version: number
}
```

### Action Button Patterns

#### Primary Actions
```vue
<template>
  <div class="flex gap-2">
    <Button 
      variant="outline" 
      @click="handleEdit"
      :disabled="loading"
    >
      <Edit class="w-4 h-4 mr-2" />
      {{ $t('common.edit') }}
    </Button>
    
    <Button 
      variant="destructive" 
      @click="handleDelete"
      :disabled="loading"
    >
      <Trash class="w-4 h-4 mr-2" />
      {{ $t('common.delete') }}
    </Button>
  </div>
</template>
```

#### Secondary Actions
```vue
<template>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="ghost" size="sm">
        <MoreHorizontal class="w-4 h-4" />
      </Button>
    </DropdownMenuTrigger>
    <DropdownMenuContent>
      <DropdownMenuItem @click="handlePrint">
        <Printer class="w-4 h-4 mr-2" />
        {{ $t('common.print') }}
      </DropdownMenuItem>
      <DropdownMenuItem @click="handleCopy">
        <Copy class="w-4 h-4 mr-2" />
        {{ $t('common.copy') }}
      </DropdownMenuItem>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
```

### Breadcrumb Navigation Implementation

```typescript
// composables/useExpenseBreadcrumbs.ts
export function useExpenseBreadcrumbs(expense: Ref<IExpenseResponse | null>) {
  const { t } = useI18n()
  
  const breadcrumbs = computed(() => [
    { label: t('navigation.dashboard'), path: '/dashboard' },
    { label: t('expense.navigation.list'), path: '/expenses' },
    { 
      label: expense.value 
        ? `${expense.value.description} (${formatCurrency(expense.value.expenseAmount || expense.value.incomeAmount)})`
        : t('expense.form.title.view')
    }
  ])
  
  return { breadcrumbs }
}
```

### Data Loading Patterns

```typescript
// pages/expenses/[id].vue
<script setup lang="ts">
import { useExpenseDetail } from '~/composables/useExpenseDetail'

const route = useRoute()
const expenseId = route.params.id as string

const {
  expense,
  loading,
  error,
  refresh,
  deleteExpense
} = useExpenseDetail(expenseId)

// Handle edit navigation
const handleEdit = () => {
  navigateTo(`/expenses/${expenseId}/edit`)
}

// Handle delete with confirmation
const handleDelete = async () => {
  const confirmed = await showConfirmDialog({
    title: t('expense.delete.title'),
    message: t('expense.delete.confirmation'),
    confirmText: t('common.delete'),
    variant: 'destructive'
  })
  
  if (confirmed) {
    await deleteExpense()
    navigateTo('/expenses')
  }
}

// Handle back navigation
const handleBack = () => {
  navigateTo('/expenses')
}
</script>
```

### Loading State Handling

```vue
<template>
  <div class="container mx-auto py-6">
    <!-- Loading skeleton -->
    <div v-if="loading" class="space-y-6">
      <ExpenseDetailSkeleton />
    </div>
    
    <!-- Error state -->
    <div v-else-if="error" class="text-center py-12">
      <AlertCircle class="w-12 h-12 mx-auto text-red-500 mb-4" />
      <h3 class="text-lg font-semibold mb-2">
        {{ $t('expense.detail.error.title') }}
      </h3>
      <p class="text-muted-foreground mb-4">
        {{ error.message }}
      </p>
      <Button @click="refresh">
        {{ $t('common.retry') }}
      </Button>
    </div>
    
    <!-- Content -->
    <ExpenseDetailView 
      v-else-if="expense"
      :expense="expense"
      @edit="handleEdit"
      @delete="handleDelete"
      @back="handleBack"
    />
    
    <!-- Not found state -->
    <div v-else class="text-center py-12">
      <FileX class="w-12 h-12 mx-auto text-muted-foreground mb-4" />
      <h3 class="text-lg font-semibold mb-2">
        {{ $t('expense.detail.notFound.title') }}
      </h3>
      <p class="text-muted-foreground mb-4">
        {{ $t('expense.detail.notFound.message') }}
      </p>
      <Button @click="handleBack">
        {{ $t('expense.detail.actions.backToList') }}
      </Button>
    </div>
  </div>
</template>
```

### Mobile Responsive Design

```vue
<template>
  <div class="container mx-auto py-6">
    <!-- Mobile header -->
    <div class="md:hidden mb-6">
      <Button variant="ghost" @click="handleBack" class="mb-4">
        <ArrowLeft class="w-4 h-4 mr-2" />
        {{ $t('common.back') }}
      </Button>
      <h1 class="text-2xl font-bold">
        {{ expense.description }}
      </h1>
    </div>
    
    <!-- Desktop header with breadcrumbs -->
    <div class="hidden md:block mb-6">
      <Breadcrumb :items="breadcrumbs" />
      <div class="flex justify-between items-center mt-4">
        <h1 class="text-3xl font-bold">
          {{ expense.description }}
        </h1>
        <div class="flex gap-2">
          <!-- Action buttons -->
        </div>
      </div>
    </div>
    
    <!-- Content grid - responsive -->
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- Main content -->
      <div class="lg:col-span-2 space-y-6">
        <ExpenseBasicInfoCard :expense="expense" />
        <ExpenseCaseInfoCard :expense="expense" />
        <ExpenseMemoCard :expense="expense" />
      </div>
      
      <!-- Sidebar -->
      <div class="space-y-6">
        <ExpenseTagsCard :expense="expense" />
        <ExpenseAttachmentsCard :expense="expense" />
        <ExpenseAuditInfoCard :expense="expense" />
      </div>
    </div>
    
    <!-- Mobile action buttons -->
    <div class="md:hidden fixed bottom-4 right-4 flex flex-col gap-2">
      <Button @click="handleEdit" size="lg" class="rounded-full">
        <Edit class="w-5 h-5" />
      </Button>
      <Button 
        @click="handleDelete" 
        variant="destructive" 
        size="lg" 
        class="rounded-full"
      >
        <Trash class="w-5 h-5" />
      </Button>
    </div>
  </div>
</template>
```

### Research Notes

Based on codebase analysis, the following patterns were identified:

#### Existing Detail View Patterns
- Case detail view uses tabbed interface (`matter.detail.tabs`)
- Card-based layout with sections (`matter.detail.basicInfo`, `matter.detail.progress`)
- Action buttons in header with primary/secondary actions
- Breadcrumb navigation implemented in multiple components

#### Card Component Usage
- UI library uses Card, CardHeader, CardTitle, CardContent components
- Consistent card styling across the application
- Test mocks available for all card components

#### Action Button Patterns
- Edit/Delete actions commonly grouped together
- Destructive actions use specific variant styling
- Loading states disable buttons during operations

#### Breadcrumb Navigation
- Implemented in `useNavigation` composable
- Uses `setBreadcrumbs` in UI store
- Hierarchical structure with optional paths

#### Loading State Patterns
- Loading states use `isLoading` boolean flags
- Skeleton components for better UX
- Error states with retry functionality
- Form submission uses `useFormSubmission` composable

## Testing Strategy

### Unit Tests
- Component rendering with mock data
- Action button click handlers
- Loading and error state displays
- Responsive layout breakpoints

### Integration Tests
- Data fetching and display
- Navigation between pages
- Delete confirmation workflow
- Mobile responsiveness

### Accessibility Tests
- Screen reader compatibility
- Keyboard navigation
- Focus management
- Color contrast compliance

## Files to Create/Modify

### New Files
- `pages/expenses/[id].vue` - Main detail page
- `components/expense/ExpenseDetailView.vue` - Main detail component
- `components/expense/detail/ExpenseBasicInfoCard.vue` - Basic info section
- `components/expense/detail/ExpenseCaseInfoCard.vue` - Case information section
- `components/expense/detail/ExpenseMemoCard.vue` - Memo section
- `components/expense/detail/ExpenseTagsCard.vue` - Tags display section
- `components/expense/detail/ExpenseAttachmentsCard.vue` - Attachments section
- `components/expense/detail/ExpenseAuditInfoCard.vue` - Audit information
- `components/expense/detail/ExpenseDetailSkeleton.vue` - Loading skeleton
- `composables/useExpenseDetail.ts` - Detail page composable
- `composables/useExpenseBreadcrumbs.ts` - Breadcrumb helper

### Modified Files
- `app/locales/ja/business.ts` - Add detail view translations
- `app/locales/en/business.ts` - Add English translations
- `app/types/expense/ui.ts` - Add detail view types

## Notes
- Follow existing pattern from case detail view for consistency
- Ensure all text uses i18n with proper translation keys
- Use existing card components from UI library
- Implement proper TypeScript types throughout
- Consider print stylesheet for print functionality
- Add proper error boundaries for graceful error handling
- Use debounced actions for delete confirmation to prevent double-clicks
- Consider implementing keyboard shortcuts for common actions (Edit: E, Delete: Del, Back: Esc)

## Output Log

[2025-08-05 01:49]: Code Review - FAIL
Result: **FAIL** - Implementation does not fully meet specification requirements
**Scope:** T04_S02_M003 - Expense Detail View implementation at `/frontend/app/pages/expenses/[id]/index.vue`
**Findings:** 
1. Missing Print Functionality (Severity: 5/10) - Required by acceptance criteria line 58
2. Missing Copy to Clipboard (Severity: 5/10) - Required by acceptance criteria line 59
3. No Component Modularization (Severity: 7/10) - Spec requires ExpenseDetailView, ExpenseBasicInfoCard, etc. components
4. No Loading Skeleton (Severity: 3/10) - Uses spinner instead of skeleton components
5. No Attachment Preview (Severity: 6/10) - Only download button, no preview functionality
6. Missing Back to List Button (Severity: 4/10) - Not in main actions section
7. Component Too Large (Severity: 6/10) - 383 lines violates component size best practices
**Summary:** While the implementation covers most core functionality and passes all quality checks (TypeScript, ESLint), it deviates from the specification in several areas. The component architecture is not followed, and several specified features are missing.
**Recommendation:** Refactor the implementation to match the specification: 1) Break down into smaller components as specified, 2) Add print and clipboard functionality, 3) Implement attachment preview, 4) Add skeleton loading states, 5) Include explicit Back to List button in actions.

[2025-08-05 02:16]: Implementation Completed
Result: **SUCCESS** - All required components and features have been implemented
**Components Created:**
1. ExpenseBasicInfoCard.vue - Basic expense information display
2. ExpenseCaseInfoCard.vue - Case-related information 
3. ExpenseMemoCard.vue - Memo/notes display
4. ExpenseTagsCard.vue - Tags with color badges
5. ExpenseAttachmentsCard.vue - File attachments with preview support
6. ExpenseAuditInfoCard.vue - Audit trail information
7. ExpenseDetailSkeleton.vue - Skeleton loading states
8. ExpenseDetailHeader.vue - Header with actions and breadcrumb
9. ExpenseDetailView.vue - Main container component
**Features Implemented:**
1. Print functionality - Integrated with print CSS media queries
2. Clipboard copy - Using VueUse useClipboard composable
3. Component modularization - Reduced main page from 383 to 177 lines
4. Skeleton loading - Proper skeleton components for all sections
5. Back to List button - Added to main action buttons
6. Mobile responsive - Floating action buttons for mobile
**Quality Checks:**
- TypeScript: ✅ No errors
- ESLint: ✅ All errors fixed
- i18n: ✅ All strings use translation keys
- Accessibility: ✅ Proper ARIA labels and keyboard navigation
**Summary:** Successfully refactored the expense detail view into modular components following the specification. All missing features have been implemented including print, copy, and skeleton loading. The implementation now follows best practices with proper separation of concerns.