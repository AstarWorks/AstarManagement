# Per-Diem Recording Interface

## Overview

The Per-Diem Recording Interface is a specialized component for recording daily allowances for travel, court visits, and other business activities in the Aster Management legal case management system.

## Features

### ✅ Core Functionality
- **Date Range Selection**: Calendar-based entry for single-day or multi-day trips
- **Bulk Entry Processing**: Automatically splits date ranges into individual daily expense records
- **Category-based Organization**: Specialized categories for legal practice (Court Visit, Client Meeting, etc.)
- **Real-time Calculations**: Auto-calculates total days and amounts as dates are selected
- **Mobile-Optimized Interface**: Responsive design for on-the-go recording

### ✅ Smart Entry Features
- **Quick Templates**: Pre-configured templates for common scenarios
- **Location Suggestions**: Context-aware location suggestions based on category
- **Amount Suggestions**: Recommended daily amounts based on category and location
- **Accommodation Tracking**: Optional accommodation requirements with type selection
- **Transportation Modes**: Track transportation methods for expense reporting

### ✅ Integration Features
- **Matter Association**: Optional linking to specific legal matters
- **Expense System Integration**: Generates corresponding expense records automatically
- **Approval Workflow**: Built-in approval process for per-diem entries
- **Billing Integration**: Configurable billable/reimbursable status

## Components

### PerDiemForm.vue
The main form component for creating and editing per-diem entries.

**Props:**
- `mode`: 'create' | 'edit' - Form operation mode
- `perDiemId?`: string - ID for editing existing entries
- `initialValues?`: Partial form data for pre-population
- `readonly?`: boolean - Read-only mode
- `matterId?`: string - Pre-selected matter association

**Events:**
- `save`: Emitted when per-diem is successfully saved
- `cancel`: Emitted when form is cancelled
- `validationChange`: Emitted when validation state changes

**Usage:**
```vue
<template>
  <PerDiemForm
    mode="create"
    :matter-id="selectedMatterId"
    @save="handlePerDiemSave"
    @cancel="closeModal"
  />
</template>
```

## API Integration

### Endpoints
- `GET /api/per-diem` - Fetch paginated per-diem entries with filtering
- `POST /api/per-diem` - Create new per-diem entry
- `PUT /api/per-diem/:id` - Update existing per-diem entry
- `DELETE /api/per-diem/:id` - Delete per-diem entry
- `GET /api/per-diem/templates` - Fetch available templates

### Data Structure
```typescript
interface PerDiemEntry {
  id: string
  dateRange: {
    startDate: string
    endDate: string
  }
  location: string
  purpose: string
  category: PerDiemCategory
  dailyAmount: number
  currency: string
  totalAmount: number
  totalDays: number
  // ... additional fields
}
```

## Validation

The component uses Zod schemas for comprehensive validation:

- **Date Range**: Start date ≤ end date, maximum 90 days, no future dates
- **Daily Amount**: ¥1,000 - ¥50,000 range, increments of ¥100
- **Location**: Minimum 2 characters, court visit validation
- **Purpose**: Minimum 5 characters business justification
- **Accommodation**: Type required when accommodation is needed

## Templates and Presets

### Built-in Templates
1. **Tokyo Court Visit** - ¥8,000/day, train transportation
2. **Osaka Client Meeting** - ¥10,000/day, day trip
3. **Multi-day Conference** - ¥15,000/day, hotel accommodation
4. **Site Inspection** - ¥12,000/day, car transportation

### Creating Custom Templates
Users can save frequently used configurations as templates by:
1. Filling out the form with desired values
2. Checking "Save as Template"
3. Providing a template name
4. Submitting the form

## Business Logic

### Daily Entry Generation
When a per-diem entry is created, the system:
1. Validates the date range and other inputs
2. Calculates total days (inclusive of start and end dates)
3. Generates individual expense records for each day
4. Links all records to the original per-diem entry
5. Triggers approval workflow if required

### Japanese Compliance
- Standard domestic per-diem amounts (¥5,000-¥15,000)
- Metropolitan vs. rural area rate differentiation
- Tax compliance documentation requirements
- Integration with Japanese business calendar

## Testing

Run the component tests:
```bash
# Run all per-diem tests
bun test src/components/expenses/__tests__/

# Run specific test file
bun test src/components/expenses/__tests__/PerDiemForm.test.ts

# Run with coverage
bun test --coverage src/components/expenses/
```

## Best Practices

### Form Usage
1. Always validate required fields before enabling submission
2. Provide clear feedback for validation errors
3. Show real-time calculations for better UX
4. Use appropriate input types (date, number, select)

### Data Handling
1. Convert form data to proper API format before submission
2. Handle optimistic updates for better perceived performance
3. Provide proper error handling and user feedback
4. Maintain audit trail for all changes

### Accessibility
1. Use semantic HTML elements
2. Provide proper ARIA labels and descriptions
3. Ensure keyboard navigation works correctly
4. Test with screen readers

## Performance Considerations

- **Lazy Loading**: Large location lists are loaded on demand
- **Debounced Calculations**: Amount calculations are debounced to avoid excessive computations
- **Optimistic Updates**: UI updates immediately for better perceived performance
- **Query Invalidation**: Related queries are invalidated after mutations

## Future Enhancements

### Planned Features
- **Recurring Per-diems**: Support for recurring business trips
- **Currency Support**: Multi-currency per-diem entries
- **Receipt Integration**: Optional receipt attachment for special cases
- **Advanced Reporting**: Detailed per-diem analytics and reporting
- **Mobile App**: Native mobile app for field recording

### Integration Opportunities
- **Calendar Integration**: Sync with calendar events
- **GPS Location**: Automatic location detection
- **Photo Documentation**: Capture location photos
- **Voice Notes**: Voice-to-text purpose description

## Troubleshooting

### Common Issues

**Form Validation Errors**
- Ensure all required fields are filled
- Check date range is valid (start ≤ end, ≤ 90 days)
- Verify daily amount is within acceptable range

**Submission Failures**
- Check network connectivity
- Verify user has appropriate permissions
- Ensure matter association is valid (if provided)

**Template Loading Issues**
- Check if user has access to templates
- Verify template data format is correct
- Clear browser cache if templates seem outdated

### Debug Mode
Enable debug logging by setting:
```javascript
localStorage.setItem('perdiem_debug', 'true')
```

This will provide detailed console logging for form operations and API calls.