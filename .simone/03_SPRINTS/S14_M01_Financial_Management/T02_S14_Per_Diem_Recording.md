# T02_S14: Per-Diem Recording Interface

## 📋 Task Overview

**Sprint**: S14_M01_Financial_Management  
**Type**: Feature Development  
**Complexity**: Low  
**Status**: Todo  
**Estimated Hours**: 6-8

### Description
Implement a specialized per-diem recording interface for the Aster Management system that allows users to efficiently record daily allowances for travel, court visits, and other business activities. The interface should provide calendar-based entry, bulk recording capabilities, and integration with the existing expense tracking system. This component focuses specifically on the unique aspects of per-diem recording as a specialized subset of expense tracking.

### Business Value
- Streamlines recording of daily allowances for lawyers and staff
- Provides accurate tracking of travel and court visit expenses
- Simplifies bulk entry for multi-day business trips
- Integrates seamlessly with existing expense and billing systems
- Improves compliance with Japanese tax regulations for per-diem expenses

### Requirements
- ✅ Create per-diem specific recording form with calendar integration
- ✅ Implement date range selection for multi-day trips
- ✅ Support bulk entry for consecutive days with same allowance
- ✅ Enable location/purpose tracking for business activities
- ✅ Auto-calculate total amounts for selected date ranges
- ✅ Integrate with existing expense system (expense_type: 'TRAVEL')
- ✅ Add per-diem specific validation rules and business logic
- ✅ Create responsive interface optimized for mobile recording
- ✅ Implement quick entry templates for common scenarios
- ✅ Support Japanese per-diem standards and tax compliance

## 🗄️ Database Schema Reference

Per-diems are stored as specialized expense records using the existing `expenses` table:

```sql
-- Per-diems use existing expenses table with specific configuration:
-- expense_type: 'TRAVEL'
-- Special fields for per-diem tracking:
-- - description: Contains location and purpose information
-- - amount: Daily allowance amount
-- - expense_date: Each day of the per-diem period
-- - notes: Additional travel details, purpose, participants
-- - receipt_required: false (per-diems typically don't require receipts)
```

### Per-Diem Specific Data Structure
```typescript
interface PerDiemEntry {
  startDate: string
  endDate: string
  location: string
  purpose: string
  dailyAmount: number
  currency: 'JPY'
  matterId?: string
  participants?: string[]
  transportationMode?: 'TRAIN' | 'CAR' | 'PLANE' | 'BUS' | 'OTHER'
  accommodationRequired?: boolean
  notes?: string
}
```

## 💻 Technical Guidance

### Per-Diem Form Component Architecture

1. **Main Per-Diem Form Component** (`/src/components/expenses/PerDiemForm.vue`)
   - Extends the existing expense form patterns
   - Uses `FormDatePicker` with range mode for multi-day selection
   - Implements Vue 3 Composition API with TypeScript
   - Integrates with VeeValidate for form validation

2. **Zod Validation Schema** (`/src/schemas/per-diem.ts`)
   - Create specific validation for per-diem entries
   - Include date range validation (start date ≤ end date)
   - Validate Japanese per-diem amount limits
   - Location and purpose field validation

3. **Form Fields Implementation**:
   - `FormDatePicker` with range mode for start/end dates
   - `FormInput` for location and daily amount
   - `FormSelect` for transportation mode
   - `FormTextarea` for purpose and notes
   - `FormSelect` for matter association (optional)
   - `FormSwitch` for accommodation requirement

### Calendar Integration Patterns

```vue
<template>
  <div class="per-diem-form">
    <!-- Date Range Selection -->
    <FormDatePicker
      name="dateRange"
      label="Travel Period"
      mode="range"
      :presets="travelPresets"
      required
      @update:value="calculateTotalDays"
    />
    
    <!-- Quick Entry Grid -->
    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
      <FormInput
        name="dailyAmount"
        label="Daily Allowance (¥)"
        type="number"
        prefix="¥"
        :min="0"
        :max="50000"
        required
      />
      
      <!-- Location with common suggestions -->
      <FormInput
        name="location"
        label="Location/Destination"
        :suggestions="commonLocations"
        required
      />
    </div>
    
    <!-- Auto-calculated summary -->
    <div class="summary-card">
      <p>Total Days: {{ totalDays }}</p>
      <p>Total Amount: ¥{{ totalAmount.toLocaleString() }}</p>
    </div>
  </div>
</template>
```

### Bulk Entry Functionality

1. **Date Range Processing**:
   - Split date range into individual daily entries
   - Generate separate expense records for each day
   - Maintain consistent metadata across all entries

2. **Batch Creation Logic**:
```typescript
const createPerDiemEntries = async (perDiemData: PerDiemEntry) => {
  const entries = generateDailyEntries(perDiemData)
  
  // Create all entries in a single transaction
  return await Promise.all(
    entries.map(entry => expenseStore.createExpense({
      ...entry,
      expense_type: 'TRAVEL',
      receipt_required: false
    }))
  )
}
```

### Integration with Expense System

1. **Composable for Per-Diem Operations** (`/src/composables/usePerDiem.ts`)
   - Extend existing `useExpenses` composable
   - Add per-diem specific business logic
   - Handle bulk creation and date range operations

2. **Store Integration** - Extend `useExpenseStore`:
```typescript
// Add to existing expense store
const createPerDiemBatch = async (perDiemData: PerDiemEntry) => {
  const dailyEntries = splitIntoDaily(perDiemData)
  const results = []
  
  for (const entry of dailyEntries) {
    const expenseEntry = transformToExpense(entry)
    results.push(await createExpense(expenseEntry))
  }
  
  return results
}
```

## 📝 Implementation Notes

### Key Considerations

1. **Japanese Per-Diem Standards**:
   - Standard domestic per-diem amounts (¥5,000-¥15,000)
   - Different rates for metropolitan vs. rural areas
   - Tax compliance requirements for per-diem documentation

2. **Mobile-First Design**:
   - Quick entry for on-the-go recording
   - Large touch targets for date selection
   - Minimize form steps for efficient entry

3. **Common Location Suggestions**:
   - Tokyo District Court, Osaka High Court, etc.
   - Major cities and business districts
   - Client offices and common destinations

4. **Validation Rules**:
   - Date range cannot exceed 90 days
   - Daily amount within reasonable limits (¥1,000-¥50,000)
   - Start date cannot be in the future
   - Location and purpose are mandatory

5. **Auto-calculation Features**:
   - Real-time total calculation as dates change
   - Weekend/holiday awareness for business days
   - Integration with Japanese calendar system

### Quick Entry Templates

```typescript
const perDiemTemplates = [
  {
    name: 'Tokyo Court Visit',
    location: 'Tokyo District Court',
    purpose: 'Court hearing attendance',
    dailyAmount: 8000,
    transportationMode: 'TRAIN'
  },
  {
    name: 'Client Meeting (Osaka)',
    location: 'Osaka Business District',
    purpose: 'Client consultation',
    dailyAmount: 10000,
    transportationMode: 'TRAIN'
  },
  {
    name: 'Multi-day Conference',
    location: 'Conference Center',
    purpose: 'Legal conference attendance',
    dailyAmount: 15000,
    accommodationRequired: true
  }
]
```

### Testing Requirements

1. **Unit Tests**:
   - Date range validation logic
   - Bulk entry generation
   - Amount calculation functions
   - Template application

2. **Integration Tests**:
   - Per-diem to expense conversion
   - Batch creation workflow
   - Calendar integration

3. **E2E Tests**:
   - Complete per-diem entry flow
   - Multi-day trip recording
   - Template usage and customization

## 🔗 Dependencies

- **Frontend Components**:
  - `FormDatePicker` with range mode support
  - Existing shadcn-vue form components
  - VeeValidate and Zod validation
  - Calendar component for date selection

- **Backend Integration**:
  - Existing expense API endpoints
  - Batch creation support
  - Audit event system integration

- **Related Tasks**:
  - T01_S14: Expense Entry Form (foundational)
  - T03_S14: Expense Approval Workflow
  - T04_S14: Financial Reports Generation

## ✅ Acceptance Criteria

1. **Per-Diem Form Functionality**:
   - [ ] Date range selection works correctly
   - [ ] Daily amount calculation is accurate
   - [ ] Location and purpose fields are validated
   - [ ] Bulk creation generates correct number of entries

2. **Calendar Integration**:
   - [ ] Range selection is intuitive and responsive
   - [ ] Date validation prevents invalid ranges
   - [ ] Quick preset options are available
   - [ ] Mobile calendar interaction works smoothly

3. **Bulk Entry Processing**:
   - [ ] Multi-day entries split correctly into daily records
   - [ ] All metadata is consistently applied
   - [ ] Transaction integrity is maintained
   - [ ] Progress indication during bulk creation

4. **Integration with Expense System**:
   - [ ] Per-diem entries appear in expense lists
   - [ ] Filtering and search include per-diem records
   - [ ] Approval workflow applies to per-diem entries
   - [ ] Audit trail is maintained for all entries

5. **Mobile Optimization**:
   - [ ] Form is fully functional on mobile devices
   - [ ] Touch interactions are responsive
   - [ ] Input fields are appropriately sized
   - [ ] Navigation is thumb-friendly

## 📌 Resources

- [Japanese Per-Diem Tax Regulations](https://www.nta.go.jp/)
- [FormDatePicker Range Mode Documentation](https://vee-validate.logaretm.com/v4/)
- [Vue 3 Composition API Patterns](https://vuejs.org/guide/extras/composition-api-faq.html)
- [shadcn-vue Calendar Component](https://www.shadcn-vue.com/docs/components/calendar)
- [Zod Date Validation](https://zod.dev/?id=dates)