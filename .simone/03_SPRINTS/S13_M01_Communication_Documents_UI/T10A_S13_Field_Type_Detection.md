# T10A_S13: Field Type Detection - Template Variable Parser and Type Detection

**Status**: TODO
**Priority**: High
**Complexity**: Low
**Estimated Hours**: 4-6

## Overview

Implement the core template variable parsing and field type detection system. This foundational component will analyze document templates to extract variables and automatically determine appropriate form field types based on naming patterns, metadata hints, and content analysis.

## Requirements

### Core Features

1. **Template Variable Parser**
   - Parse template placeholders from document content (e.g., `{{client.name}}`, `{{matter.date}}`)
   - Extract nested object structures (e.g., `client.company.address.street`)
   - Handle array fields for repeating sections (e.g., `witnesses[].name`)
   - Generate unique field IDs and proper naming conventions

2. **Field Type Detection**
   - Text inputs (short text, long text, rich text)
   - Date/time inputs based on field names containing 'date', 'time', 'born', etc.
   - Email inputs for fields containing 'email', 'mail'
   - Phone inputs for fields containing 'phone', 'tel', 'mobile'
   - Number inputs for fields containing 'amount', 'price', 'quantity', 'age'
   - Select dropdowns based on predefined legal field mappings
   - Custom field types for legal-specific data (case numbers, court names, etc.)

3. **Metadata Processing**
   - Parse template annotations for explicit type hints
   - Extract field labels from template comments
   - Process validation hints from template metadata
   - Generate placeholder text from field context

### Technical Architecture

#### Component Structure
```
composables/
├── form/
│   ├── useTemplateVariables.ts      # Template variable parser
│   ├── useFieldTypeDetection.ts     # Field type detection logic
│   └── types.ts                     # Core interfaces
```

## Implementation Details

### 1. Template Variable Interface

```typescript
interface TemplateVariable {
  name: string                    // Variable name (e.g., "client.name")
  path: string[]                  // Nested path array (e.g., ["client", "name"])
  type: FieldType                // Detected field type
  label: string                  // Auto-generated display label
  placeholder?: string           // Auto-generated placeholder
  required?: boolean             // Detected from template context
  metadata?: Record<string, any> // Parsed template metadata
}

interface FieldType {
  base: 'text' | 'number' | 'date' | 'select' | 'checkbox' | 'email' | 'phone' | 'custom'
  variant?: string  // e.g., 'textarea', 'currency', 'datetime'
  format?: string   // e.g., date format, number format
}
```

### 2. Template Variable Parser

```typescript
export function useTemplateVariables() {
  const parseTemplate = (templateContent: string): TemplateVariable[] => {
    const variableRegex = /\{\{([^}]+)\}\}/g
    const variables: TemplateVariable[] = []
    let match
    
    while ((match = variableRegex.exec(templateContent)) !== null) {
      const variableName = match[1].trim()
      const variable = createTemplateVariable(variableName)
      variables.push(variable)
    }
    
    return deduplicateVariables(variables)
  }
  
  const createTemplateVariable = (name: string): TemplateVariable => {
    const path = name.split('.')
    const type = detectFieldType(name)
    const label = generateLabel(name)
    const placeholder = generatePlaceholder(name, type)
    
    return {
      name,
      path,
      type,
      label,
      placeholder,
      required: isRequiredField(name)
    }
  }
  
  return {
    parseTemplate,
    createTemplateVariable
  }
}
```

### 3. Field Type Detection Logic

```typescript
export function useFieldTypeDetection() {
  const typeDetectionRules = {
    email: /email|mail/i,
    phone: /phone|tel|mobile|fax/i,
    date: /date|born|created|updated|deadline|due/i,
    number: /amount|price|quantity|age|count|number|fee/i,
    textarea: /description|comment|note|detail|summary|content/i,
    select: /status|type|category|priority|court|prefecture/i
  }
  
  const detectFieldType = (fieldName: string): FieldType => {
    const normalizedName = fieldName.toLowerCase()
    
    // Check specific patterns
    for (const [type, pattern] of Object.entries(typeDetectionRules)) {
      if (pattern.test(normalizedName)) {
        return createFieldType(type as string)
      }
    }
    
    // Legal-specific field detection
    if (/case|matter|docket/i.test(normalizedName)) {
      return { base: 'text', variant: 'case-number' }
    }
    
    if (/court|tribunal/i.test(normalizedName)) {
      return { base: 'select', variant: 'court-list' }
    }
    
    // Default to text
    return { base: 'text' }
  }
  
  const createFieldType = (baseType: string): FieldType => {
    switch (baseType) {
      case 'email':
        return { base: 'text', variant: 'email' }
      case 'phone':
        return { base: 'text', variant: 'phone' }
      case 'textarea':
        return { base: 'text', variant: 'textarea' }
      case 'number':
        return { base: 'number', format: 'decimal' }
      case 'date':
        return { base: 'date', format: 'yyyy-mm-dd' }
      case 'select':
        return { base: 'select' }
      default:
        return { base: 'text' }
    }
  }
  
  return {
    detectFieldType,
    typeDetectionRules
  }
}
```

### 4. Label and Placeholder Generation

```typescript
const generateLabel = (fieldName: string): string => {
  const lastPart = fieldName.split('.').pop() || fieldName
  return lastPart
    .replace(/([A-Z])/g, ' $1')
    .replace(/[_-]/g, ' ')
    .replace(/\b\w/g, l => l.toUpperCase())
    .trim()
}

const generatePlaceholder = (fieldName: string, type: FieldType): string => {
  const baseField = fieldName.split('.').pop() || fieldName
  
  switch (type.variant) {
    case 'email':
      return 'example@domain.com'
    case 'phone':
      return '03-1234-5678'
    case 'date':
      return 'YYYY-MM-DD'
    case 'textarea':
      return `Enter ${generateLabel(fieldName).toLowerCase()}...`
    default:
      return `Enter ${generateLabel(fieldName).toLowerCase()}`
  }
}
```

## Testing Requirements

### Unit Tests
- Template variable parsing accuracy (various template formats)
- Field type detection for common legal fields
- Label generation from different naming conventions
- Placeholder generation for all field types
- Edge cases: empty templates, malformed variables, special characters

### Integration Tests
- Performance with large templates (1000+ variables)
- Template parsing with Japanese characters
- Legal-specific field detection accuracy

## Performance Considerations

1. **Caching**
   - Cache parsed results for identical templates
   - Memoize field type detection results
   - Store detection rules in optimized data structures

2. **Optimization**
   - Use single-pass regex parsing
   - Lazy evaluation of complex detection rules
   - Batch processing for large templates

## Dependencies

- Vue 3 composition API
- TypeScript type definitions
- Existing form component types

## Acceptance Criteria

1. [ ] Parse template variables with 100% accuracy for supported formats
2. [ ] Detect field types with 90%+ accuracy for common patterns
3. [ ] Generate appropriate labels and placeholders
4. [ ] Handle nested object structures correctly
5. [ ] Support array fields for repeating sections
6. [ ] Performance: Parse 100 variables in < 10ms
7. [ ] Comprehensive unit test coverage (>95%)
8. [ ] Documentation with usage examples

## Related Tasks

- **Depends on**: None (foundational task)
- **Enables**: T10B_S13_Dynamic_Form_Rendering, T10C_S13_Conditional_Logic_Validation
- **Related**: T09_S13_Template_Browser

## Notes

This is the foundational task that must be completed first. The field type detection accuracy can be improved iteratively based on real-world template analysis. Focus on creating a robust, extensible architecture that can accommodate new field types and detection rules.