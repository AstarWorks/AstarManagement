/**
 * Field Mapping Composable Tests
 */

import { describe, it, expect } from 'vitest'
import { useFieldMapping } from '../useFieldMapping'
import type { ParsedTemplateVariable } from '../types'

describe('useFieldMapping', () => {
  const createTestVariable = (overrides: Partial<ParsedTemplateVariable> = {}): ParsedTemplateVariable => ({
    name: 'test-field',
    path: ['test'],
    type: { base: 'text' },
    label: 'Test Field',
    placeholder: 'Enter test value',
    required: false,
    ...overrides
  })

  describe('field component mapping', () => {
    it('maps text fields correctly', () => {
      const variable = createTestVariable({ type: { base: 'text' } })
      const { fieldComponent } = useFieldMapping(variable)
      
      expect(fieldComponent.value).toBeDefined()
    })

    it('maps email fields to text input with email type', () => {
      const variable = createTestVariable({ 
        type: { base: 'text', variant: 'email' } 
      })
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.type).toBe('email')
      expect(fieldProps.value.autocomplete).toBe('email')
      expect(fieldProps.value.inputmode).toBe('email')
    })

    it('maps phone fields correctly', () => {
      const variable = createTestVariable({ 
        type: { base: 'text', variant: 'phone' } 
      })
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.type).toBe('tel')
      expect(fieldProps.value.autocomplete).toBe('tel')
      expect(fieldProps.value.inputmode).toBe('tel')
    })

    it('maps number fields correctly', () => {
      const variable = createTestVariable({ 
        type: { base: 'number' } 
      })
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.type).toBe('number')
      expect(fieldProps.value.inputmode).toBe('numeric')
      expect(fieldProps.value.step).toBe('0.01')
    })

    it('maps currency fields with proper formatting', () => {
      const variable = createTestVariable({ 
        type: { base: 'number', variant: 'currency' } 
      })
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.step).toBe('0.01')
      expect(fieldProps.value.min).toBe('0')
      expect(fieldProps.value.prefix).toBe('¥')
    })

    it('maps percentage fields correctly', () => {
      const variable = createTestVariable({ 
        type: { base: 'number', variant: 'percentage' } 
      })
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.step).toBe('0.1')
      expect(fieldProps.value.min).toBe('0')
      expect(fieldProps.value.max).toBe('100')
      expect(fieldProps.value.suffix).toBe('%')
    })

    it('maps select fields with options', () => {
      const variable = createTestVariable({ 
        type: { base: 'select' },
        metadata: {
          options: [
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' }
          ]
        }
      })
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.options).toHaveLength(2)
      expect(fieldProps.value.options[0].value).toBe('option1')
    })

    it('maps court list fields with Japanese courts', () => {
      const variable = createTestVariable({ 
        type: { base: 'select', variant: 'court-list' } 
      })
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.options.length).toBeGreaterThan(0)
      expect(fieldProps.value.searchable).toBe(true)
      expect(fieldProps.value.options[0].label).toContain('東京地方裁判所')
    })
  })

  describe('field props generation', () => {
    it('generates base props correctly', () => {
      const variable = createTestVariable({
        name: 'client-name',
        label: 'Client Name',
        placeholder: 'Enter client name',
        required: true
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.id).toBe('client-name')
      expect(fieldProps.value.name).toBe('client-name')
      expect(fieldProps.value.label).toBe('Client Name')
      expect(fieldProps.value.placeholder).toBe('Enter client name')
      expect(fieldProps.value.required).toBe(true)
    })

    it('applies disabled and readonly options', () => {
      const variable = createTestVariable()
      const { fieldProps } = useFieldMapping(variable, {
        disabled: true,
        readonly: true,
        size: 'lg'
      })
      
      expect(fieldProps.value.disabled).toBe(true)
      expect(fieldProps.value.readonly).toBe(true)
      expect(fieldProps.value.size).toBe('lg')
    })

    it('includes metadata description and help text', () => {
      const variable = createTestVariable({
        metadata: {
          description: 'Field description',
          helpText: 'Help text for field'
        }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.description).toBe('Field description')
      expect(fieldProps.value.helpText).toBe('Help text for field')
    })
  })

  describe('text field specifics', () => {
    it('applies maxlength from metadata', () => {
      const variable = createTestVariable({
        type: { base: 'text' },
        metadata: { maxLength: 100 }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.maxlength).toBe(100)
    })

    it('configures textarea fields', () => {
      const variable = createTestVariable({
        type: { base: 'text', variant: 'textarea' },
        metadata: { rows: 6 }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.rows).toBe(6)
    })

    it('handles URL fields', () => {
      const variable = createTestVariable({
        type: { base: 'text', variant: 'url' }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.type).toBe('url')
      expect(fieldProps.value.autocomplete).toBe('url')
    })
  })

  describe('number field specifics', () => {
    it('applies min/max constraints from metadata', () => {
      const variable = createTestVariable({
        type: { base: 'number' },
        metadata: { min: 0, max: 100 }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.min).toBe(0)
      expect(fieldProps.value.max).toBe(100)
    })

    it('handles integer fields', () => {
      const variable = createTestVariable({
        type: { base: 'number', variant: 'integer' }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.step).toBe('1')
    })
  })

  describe('date field specifics', () => {
    it('configures date format', () => {
      const variable = createTestVariable({
        type: { base: 'date', format: 'dd/MM/yyyy' }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.format).toBe('dd/MM/yyyy')
    })

    it('handles datetime fields', () => {
      const variable = createTestVariable({
        type: { base: 'date', variant: 'datetime' }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.showTime).toBe(true)
    })

    it('applies date constraints', () => {
      const variable = createTestVariable({
        type: { base: 'date' },
        metadata: {
          minDate: '2024-01-01',
          maxDate: '2024-12-31'
        }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.minDate).toBe('2024-01-01')
      expect(fieldProps.value.maxDate).toBe('2024-12-31')
    })
  })

  describe('custom field types', () => {
    it('handles case number fields', () => {
      const variable = createTestVariable({
        type: { base: 'custom', variant: 'case-number' }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.pattern).toBe('[0-9]{4}-[A-Z]{2}-[0-9]{5}')
      expect(fieldProps.value.placeholder).toBe('2024-CV-12345')
    })

    it('handles attorney name fields', () => {
      const variable = createTestVariable({
        type: { base: 'custom', variant: 'attorney-name' }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.autocomplete).toBe('name')
      expect(fieldProps.value.capitalize).toBe(true)
    })
  })

  describe('select field options', () => {
    it('enables search for large option lists', () => {
      const variable = createTestVariable({
        type: { base: 'select' },
        metadata: {
          options: Array.from({ length: 15 }, (_, i) => ({
            value: `option${i}`,
            label: `Option ${i}`
          }))
        }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.searchable).toBe(true)
    })

    it('handles multi-select fields', () => {
      const variable = createTestVariable({
        type: { base: 'select', variant: 'multi-select' }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.multiple).toBe(true)
    })

    it('provides legal status options', () => {
      const variable = createTestVariable({
        type: { base: 'select', variant: 'legal-status' }
      })
      
      const { fieldProps } = useFieldMapping(variable)
      
      expect(fieldProps.value.options.length).toBeGreaterThan(0)
      expect(fieldProps.value.options.some((opt: any) => opt.value === 'active')).toBe(true)
    })
  })
})