/**
 * Form Validation Composable Tests
 */

import { describe, it, expect } from 'vitest'
import { z } from 'zod'
import { 
  generateValidationSchema, 
  validateField,
  getFieldValidationSchema,
  createPartialValidationSchema
} from '../useFormValidation'
import type { ParsedTemplateVariable } from '../types'

describe('useFormValidation', () => {
  const createTestVariable = (overrides: Partial<ParsedTemplateVariable> = {}): ParsedTemplateVariable => ({
    name: 'test-field',
    path: ['test'],
    type: { base: 'text' },
    label: 'Test Field',
    placeholder: 'Enter test value',
    required: false,
    ...overrides
  })

  describe('generateValidationSchema', () => {
    it('creates schema for multiple fields', () => {
      const variables = [
        createTestVariable({ name: 'firstName', required: true }),
        createTestVariable({ name: 'lastName', required: true }),
        createTestVariable({ name: 'email', type: { base: 'text', variant: 'email' } })
      ]

      const schema = generateValidationSchema(variables)

      expect(schema).toBeInstanceOf(z.ZodObject)
      expect(Object.keys(schema.shape)).toEqual(['firstName', 'lastName', 'email'])
    })

    it('handles empty variable list', () => {
      const schema = generateValidationSchema([])

      expect(schema).toBeInstanceOf(z.ZodObject)
      expect(Object.keys(schema.shape)).toHaveLength(0)
    })
  })

  describe('text field validation', () => {
    it('creates basic string schema for text fields', () => {
      const variable = createTestVariable({ 
        type: { base: 'text' },
        required: true 
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(schema).toBeInstanceOf(z.ZodString)
      expect(() => schema.parse('valid text')).not.toThrow()
      expect(() => schema.parse('')).toThrow()
    })

    it('validates email fields correctly', () => {
      const variable = createTestVariable({ 
        type: { base: 'text', variant: 'email' },
        required: true 
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse('test@example.com')).not.toThrow()
      expect(() => schema.parse('invalid-email')).toThrow()
    })

    it('validates phone fields with regex', () => {
      const variable = createTestVariable({ 
        type: { base: 'text', variant: 'phone' },
        required: true 
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse('03-1234-5678')).not.toThrow()
      expect(() => schema.parse('090 1234 5678')).not.toThrow()
      expect(() => schema.parse('invalid-phone')).toThrow()
    })

    it('validates URL fields', () => {
      const variable = createTestVariable({ 
        type: { base: 'text', variant: 'url' },
        required: true 
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse('https://example.com')).not.toThrow()
      expect(() => schema.parse('not-a-url')).toThrow()
    })

    it('applies length constraints from metadata', () => {
      const variable = createTestVariable({ 
        type: { base: 'text' },
        required: true,
        metadata: { minLength: 3, maxLength: 10 }
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse('abc')).not.toThrow()
      expect(() => schema.parse('abcdefghij')).not.toThrow()
      expect(() => schema.parse('ab')).toThrow()
      expect(() => schema.parse('abcdefghijk')).toThrow()
    })
  })

  describe('number field validation', () => {
    it('creates number schema for number fields', () => {
      const variable = createTestVariable({ 
        type: { base: 'number' },
        required: true 
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse(123)).not.toThrow()
      expect(() => schema.parse(123.45)).not.toThrow()
      expect(() => schema.parse('not-a-number')).toThrow()
    })

    it('validates currency fields with min constraint', () => {
      const variable = createTestVariable({ 
        type: { base: 'number', variant: 'currency' },
        required: true 
      })

      const schema = getFieldValidationSchema(variable)
      
      // Currency fields expect string input
      expect(() => schema.parse('100')).not.toThrow()
      expect(() => schema.parse('0')).not.toThrow()
      expect(() => schema.parse('100.50')).not.toThrow()
      expect(() => schema.parse('-10')).toThrow()
      expect(() => schema.parse('abc')).toThrow()
    })

    it('validates percentage fields with range', () => {
      const variable = createTestVariable({ 
        type: { base: 'number', variant: 'percentage' },
        required: true 
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse(50)).not.toThrow()
      expect(() => schema.parse(0)).not.toThrow()
      expect(() => schema.parse(100)).not.toThrow()
      expect(() => schema.parse(-1)).toThrow()
      expect(() => schema.parse(101)).toThrow()
    })

    it('validates integer fields', () => {
      const variable = createTestVariable({ 
        type: { base: 'number', variant: 'integer' },
        required: true 
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse(123)).not.toThrow()
      expect(() => schema.parse(123.45)).toThrow()
    })

    it('applies min/max constraints from metadata', () => {
      const variable = createTestVariable({ 
        type: { base: 'number' },
        required: true,
        metadata: { min: 1, max: 100 }
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse(50)).not.toThrow()
      expect(() => schema.parse(1)).not.toThrow()
      expect(() => schema.parse(100)).not.toThrow()
      expect(() => schema.parse(0)).toThrow()
      expect(() => schema.parse(101)).toThrow()
    })
  })

  describe('date field validation', () => {
    it('creates date schema for date fields', () => {
      const variable = createTestVariable({ 
        type: { base: 'date' },
        required: true 
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse(new Date())).not.toThrow()
      expect(() => schema.parse('not-a-date')).toThrow()
    })

    it('applies date range constraints', () => {
      const minDate = new Date('2024-01-01')
      const maxDate = new Date('2024-12-31')
      
      const variable = createTestVariable({ 
        type: { base: 'date' },
        required: true,
        metadata: { 
          minDate: minDate.toISOString(), 
          maxDate: maxDate.toISOString() 
        }
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse(new Date('2024-06-15'))).not.toThrow()
      expect(() => schema.parse(new Date('2023-12-31'))).toThrow()
      expect(() => schema.parse(new Date('2025-01-01'))).toThrow()
    })
  })

  describe('select field validation', () => {
    it('validates enum values for select fields', () => {
      const variable = createTestVariable({ 
        type: { base: 'select' },
        required: true,
        metadata: {
          options: [
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' }
          ]
        }
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse('option1')).not.toThrow()
      expect(() => schema.parse('option2')).not.toThrow()
      expect(() => schema.parse('invalid-option')).toThrow()
    })

    it('validates multi-select fields as arrays', () => {
      const variable = createTestVariable({ 
        type: { base: 'select', variant: 'multi-select' },
        required: true,
        metadata: {
          options: [
            { value: 'option1', label: 'Option 1' },
            { value: 'option2', label: 'Option 2' }
          ]
        }
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse(['option1'])).not.toThrow()
      expect(() => schema.parse(['option1', 'option2'])).not.toThrow()
      expect(() => schema.parse([])).toThrow() // Requires at least one
      expect(() => schema.parse(['invalid'])).toThrow()
    })
  })

  describe('custom field validation', () => {
    it('validates case number format', () => {
      const variable = createTestVariable({ 
        type: { base: 'custom', variant: 'case-number' },
        required: true 
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse('2024-CV-12345')).not.toThrow()
      expect(() => schema.parse('invalid-case-number')).toThrow()
    })

    it('validates attorney name with length constraints', () => {
      const variable = createTestVariable({ 
        type: { base: 'custom', variant: 'attorney-name' },
        required: true 
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse('John Doe')).not.toThrow()
      expect(() => schema.parse('A')).toThrow() // Too short
      expect(() => schema.parse('A'.repeat(101))).toThrow() // Too long
    })
  })

  describe('optional fields', () => {
    it('makes non-required fields optional', () => {
      const variable = createTestVariable({ 
        type: { base: 'text' },
        required: false 
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse('value')).not.toThrow()
      expect(() => schema.parse(undefined)).not.toThrow()
    })
  })

  describe('validateField function', () => {
    it('returns validation result for valid values', () => {
      const variable = createTestVariable({ 
        type: { base: 'text', variant: 'email' },
        required: true 
      })

      const result = validateField(variable, 'test@example.com')
      
      expect(result.isValid).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('returns validation errors for invalid values', () => {
      const variable = createTestVariable({ 
        type: { base: 'text', variant: 'email' },
        required: true 
      })

      const result = validateField(variable, 'invalid-email')
      
      expect(result.isValid).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })
  })

  describe('createPartialValidationSchema', () => {
    it('creates schema for subset of fields', () => {
      const variables = [
        createTestVariable({ name: 'firstName' }),
        createTestVariable({ name: 'lastName' }),
        createTestVariable({ name: 'email' })
      ]

      const schema = createPartialValidationSchema(variables, ['firstName', 'email'])

      expect(Object.keys(schema.shape)).toEqual(['firstName', 'email'])
      expect(Object.keys(schema.shape)).not.toContain('lastName')
    })
  })

  describe('custom validation rules', () => {
    it('applies pattern validation rules', () => {
      const variable = createTestVariable({ 
        type: { base: 'text' },
        required: true,
        validation: [
          {
            type: 'pattern',
            value: /^[A-Z]+$/,
            message: 'Must be uppercase letters only'
          }
        ]
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse('HELLO')).not.toThrow()
      expect(() => schema.parse('hello')).toThrow()
    })

    it('applies min/max validation rules', () => {
      const variable = createTestVariable({ 
        type: { base: 'text' },
        required: true,
        validation: [
          {
            type: 'min',
            value: 5,
            message: 'Must be at least 5 characters'
          },
          {
            type: 'max',
            value: 10,
            message: 'Must be no more than 10 characters'
          }
        ]
      })

      const schema = getFieldValidationSchema(variable)
      
      expect(() => schema.parse('hello')).not.toThrow()
      expect(() => schema.parse('hi')).toThrow()
      expect(() => schema.parse('this is too long')).toThrow()
    })
  })
})