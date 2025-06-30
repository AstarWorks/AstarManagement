import { describe, it, expect, beforeEach } from 'vitest'
import { computed, ref } from 'vue'
import { z } from 'zod'
import { useSchemaGeneration } from '../useSchemaGeneration'
import { useConditionalLogic } from '../useConditionalLogic'
import type { ParsedTemplateVariable } from '../types'

describe('useSchemaGeneration', () => {
  let variables: any
  let conditionalLogic: any

  beforeEach(() => {
    const variablesRef = ref<ParsedTemplateVariable[]>([
      {
        name: 'clientName',
        path: ['client', 'name'],
        type: { base: 'text' },
        label: 'Client Name',
        required: true,
        validation: [
          { type: 'minLength', value: 2, message: 'Name must be at least 2 characters' },
          { type: 'maxLength', value: 100, message: 'Name must be less than 100 characters' }
        ]
      },
      {
        name: 'clientEmail',
        path: ['client', 'email'],
        type: { base: 'email' },
        label: 'Client Email',
        required: true
      },
      {
        name: 'companyName',
        path: ['company', 'name'],
        type: { base: 'text' },
        label: 'Company Name',
        required: false,
        conditions: [{
          type: 'show',
          when: {
            field: 'clientType',
            operator: 'equals',
            value: 'corporate'
          }
        }]
      },
      {
        name: 'age',
        path: ['personal', 'age'],
        type: { base: 'number', variant: 'integer' },
        label: 'Age',
        required: false,
        validation: [
          { type: 'min', value: 18, message: 'Must be at least 18 years old' },
          { type: 'max', value: 120, message: 'Must be less than 120 years old' }
        ]
      },
      {
        name: 'amount',
        path: ['financial', 'amount'],
        type: { base: 'number', variant: 'currency' },
        label: 'Amount',
        required: true
      },
      {
        name: 'clientType',
        path: ['client', 'type'],
        type: { base: 'select' },
        label: 'Client Type',
        required: true,
        options: [
          { value: 'individual', label: 'Individual' },
          { value: 'corporate', label: 'Corporate' }
        ]
      },
      {
        name: 'agreedToTerms',
        path: ['agreement', 'terms'],
        type: { base: 'checkbox' },
        label: 'Agreed to Terms',
        required: true
      },
      {
        name: 'birthDate',
        path: ['personal', 'birthDate'],
        type: { base: 'date' },
        label: 'Birth Date',
        required: false
      }
    ])

    variables = computed(() => variablesRef.value)

    const formData = ref({})
    conditionalLogic = useConditionalLogic(variablesRef, formData)
  })

  describe('base schema generation', () => {
    it('generates correct schema for text fields', () => {
      const { getBaseSchema } = useSchemaGeneration(variables, conditionalLogic)
      
      const textSchema = getBaseSchema({ base: 'text' })
      expect(textSchema).toBeInstanceOf(z.ZodString)
      
      // Test validation
      expect(() => textSchema.parse('valid text')).not.toThrow()
      expect(() => textSchema.parse(123)).toThrow()
    })

    it('generates correct schema for email fields', () => {
      const { getBaseSchema } = useSchemaGeneration(variables, conditionalLogic)
      
      const emailSchema = getBaseSchema({ base: 'text', variant: 'email' })
      expect(emailSchema).toBeInstanceOf(z.ZodString)
      
      expect(() => emailSchema.parse('user@example.com')).not.toThrow()
      expect(() => emailSchema.parse('invalid-email')).toThrow()
    })

    it('generates correct schema for number fields', () => {
      const { getBaseSchema } = useSchemaGeneration(variables, conditionalLogic)
      
      const numberSchema = getBaseSchema({ base: 'number' })
      expect(numberSchema).toBeInstanceOf(z.ZodNumber)
      
      expect(() => numberSchema.parse(123)).not.toThrow()
      expect(() => numberSchema.parse('123')).toThrow()
    })

    it('generates correct schema for currency fields', () => {
      const { getBaseSchema } = useSchemaGeneration(variables, conditionalLogic)
      
      const currencySchema = getBaseSchema({ base: 'number', variant: 'currency' })
      
      // Currency should accept string input and transform to number
      expect(() => currencySchema.parse('123.45')).not.toThrow()
      expect(() => currencySchema.parse('invalid')).toThrow()
      
      // Test transformation
      const result = currencySchema.parse('123.45')
      expect(result).toBe(123.45)
    })

    it('generates correct schema for date fields', () => {
      const { getBaseSchema } = useSchemaGeneration(variables, conditionalLogic)
      
      const dateSchema = getBaseSchema({ base: 'date' })
      expect(dateSchema).toBeInstanceOf(z.ZodString)
      
      expect(() => dateSchema.parse('2024-01-15')).not.toThrow()
      expect(() => dateSchema.parse('invalid-date')).toThrow()
    })

    it('generates correct schema for checkbox fields', () => {
      const { getBaseSchema } = useSchemaGeneration(variables, conditionalLogic)
      
      const checkboxSchema = getBaseSchema({ base: 'checkbox' })
      expect(checkboxSchema).toBeInstanceOf(z.ZodBoolean)
      
      expect(() => checkboxSchema.parse(true)).not.toThrow()
      expect(() => checkboxSchema.parse(false)).not.toThrow()
      expect(() => checkboxSchema.parse('true')).toThrow()
    })

    it('generates correct schema for select fields', () => {
      const { getBaseSchema } = useSchemaGeneration(variables, conditionalLogic)
      
      const selectSchema = getBaseSchema({ base: 'select' })
      expect(selectSchema).toBeInstanceOf(z.ZodString)
      
      expect(() => selectSchema.parse('option1')).not.toThrow()
      expect(() => selectSchema.parse(123)).toThrow()
    })
  })

  describe('validation rules application', () => {
    it('applies minLength validation rule', () => {
      const { applyValidationRule } = useSchemaGeneration(variables, conditionalLogic)
      
      const baseSchema = z.string()
      const rule = { type: 'minLength' as const, value: 3, message: 'Too short' }
      const schema = applyValidationRule(baseSchema, rule)
      
      expect(() => schema.parse('ab')).toThrow('Too short')
      expect(() => schema.parse('abc')).not.toThrow()
    })

    it('applies maxLength validation rule', () => {
      const { applyValidationRule } = useSchemaGeneration(variables, conditionalLogic)
      
      const baseSchema = z.string()
      const rule = { type: 'maxLength' as const, value: 5, message: 'Too long' }
      const schema = applyValidationRule(baseSchema, rule)
      
      expect(() => schema.parse('toolong')).toThrow('Too long')
      expect(() => schema.parse('ok')).not.toThrow()
    })

    it('applies pattern validation rule', () => {
      const { applyValidationRule } = useSchemaGeneration(variables, conditionalLogic)
      
      const baseSchema = z.string()
      const rule = { type: 'pattern' as const, value: '^[A-Z]+$', message: 'Must be uppercase' }
      const schema = applyValidationRule(baseSchema, rule)
      
      expect(() => schema.parse('lowercase')).toThrow('Must be uppercase')
      expect(() => schema.parse('UPPERCASE')).not.toThrow()
    })

    it('applies min validation rule for numbers', () => {
      const { applyValidationRule } = useSchemaGeneration(variables, conditionalLogic)
      
      const baseSchema = z.number()
      const rule = { type: 'min' as const, value: 10, message: 'Too small' }
      const schema = applyValidationRule(baseSchema, rule)
      
      expect(() => schema.parse(5)).toThrow('Too small')
      expect(() => schema.parse(15)).not.toThrow()
    })

    it('applies max validation rule for numbers', () => {
      const { applyValidationRule } = useSchemaGeneration(variables, conditionalLogic)
      
      const baseSchema = z.number()
      const rule = { type: 'max' as const, value: 100, message: 'Too large' }
      const schema = applyValidationRule(baseSchema, rule)
      
      expect(() => schema.parse(150)).toThrow('Too large')
      expect(() => schema.parse(50)).not.toThrow()
    })
  })

  describe('complete schema generation', () => {
    it('generates complete form schema with all fields', () => {
      const { schema } = useSchemaGeneration(variables, conditionalLogic)
      
      const formSchema = schema.value
      expect(formSchema).toBeInstanceOf(z.ZodObject)
      
      // Check that all fields are included
      const shape = formSchema.shape
      expect(shape.clientName).toBeDefined()
      expect(shape.clientEmail).toBeDefined()
      expect(shape.age).toBeDefined()
      expect(shape.amount).toBeDefined()
      expect(shape.clientType).toBeDefined()
      expect(shape.agreedToTerms).toBeDefined()
      expect(shape.birthDate).toBeDefined()
    })

    it('applies field options to select fields', () => {
      const { schema } = useSchemaGeneration(variables, conditionalLogic)
      
      const formSchema = schema.value
      const clientTypeSchema = formSchema.shape.clientType
      
      // Should only accept the predefined options
      expect(() => clientTypeSchema.parse('individual')).not.toThrow()
      expect(() => clientTypeSchema.parse('corporate')).not.toThrow()
      expect(() => clientTypeSchema.parse('invalid')).toThrow()
    })

    it('makes fields optional when not required', () => {
      const { schema } = useSchemaGeneration(variables, conditionalLogic)
      
      const formSchema = schema.value
      
      // Test with missing optional fields
      const validData = {
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        amount: '1000.00',
        clientType: 'individual',
        agreedToTerms: true
        // age and birthDate are optional and missing
      }
      
      expect(() => formSchema.parse(validData)).not.toThrow()
    })

    it('validates required fields', () => {
      const { schema } = useSchemaGeneration(variables, conditionalLogic)
      
      const formSchema = schema.value
      
      // Test with missing required fields
      const invalidData = {
        // Missing clientName, clientEmail, amount, clientType, agreedToTerms
        age: 25
      }
      
      expect(() => formSchema.parse(invalidData)).toThrow()
    })
  })

  describe('field validation methods', () => {
    it('validates individual fields correctly', async () => {
      const { validateField } = useSchemaGeneration(variables, conditionalLogic)
      
      // Valid field
      const validResult = await validateField('clientName', 'John Doe')
      expect(validResult.success).toBe(true)
      
      // Invalid field (too short)
      const invalidResult = await validateField('clientName', 'A')
      expect(invalidResult.success).toBe(false)
      expect(invalidResult.error).toContain('at least 2 characters')
    })

    it('validates all fields correctly', async () => {
      const { validateAll } = useSchemaGeneration(variables, conditionalLogic)
      
      const validData = {
        clientName: 'John Doe',
        clientEmail: 'john@example.com',
        amount: '1000.00',
        clientType: 'individual',
        agreedToTerms: true,
        age: 30,
        birthDate: '1994-01-01'
      }
      
      const validResult = await validateAll(validData)
      expect(validResult.success).toBe(true)
      
      const invalidData = {
        clientName: 'A', // Too short
        clientEmail: 'invalid-email',
        amount: 'invalid',
        clientType: 'invalid-type',
        agreedToTerms: false,
        age: 15, // Too young
        birthDate: 'invalid-date'
      }
      
      const invalidResult = await validateAll(invalidData)
      expect(invalidResult.success).toBe(false)
      expect(invalidResult.errors).toBeDefined()
      expect(Object.keys(invalidResult.errors!)).toHaveLength.greaterThan(0)
    })
  })

  describe('conditional schema generation', () => {
    it('excludes hidden fields from schema', () => {
      // Mock conditional logic to hide companyName
      conditionalLogic.fieldVisibility.value = { companyName: false }
      
      const { schema } = useSchemaGeneration(variables, conditionalLogic, { includeHidden: false })
      
      const formSchema = schema.value
      expect(formSchema.shape.companyName).toBeUndefined()
    })

    it('includes hidden fields when option is set', () => {
      // Mock conditional logic to hide companyName
      conditionalLogic.fieldVisibility.value = { companyName: false }
      
      const { schema } = useSchemaGeneration(variables, conditionalLogic, { includeHidden: true })
      
      const formSchema = schema.value
      expect(formSchema.shape.companyName).toBeDefined()
    })

    it('respects conditional required state', () => {
      // Mock conditional logic to make companyName required
      conditionalLogic.fieldRequired.value = { companyName: true }
      
      const { schema } = useSchemaGeneration(variables, conditionalLogic)
      
      const formSchema = schema.value
      const companyNameSchema = formSchema.shape.companyName
      
      // Should be required now
      expect(companyNameSchema.isOptional()).toBe(false)
    })
  })

  describe('custom validators', () => {
    it('applies custom validators when provided', () => {
      const customValidators = {
        clientName: (schema: any) => schema.refine(
          (val: string) => !val.includes('test'),
          'Name cannot contain "test"'
        )
      }
      
      const { schema } = useSchemaGeneration(variables, conditionalLogic, { customValidators })
      
      const formSchema = schema.value
      
      expect(() => formSchema.parse({
        clientName: 'test user',
        clientEmail: 'test@example.com',
        amount: '100.00',
        clientType: 'individual',
        agreedToTerms: true
      })).toThrow('Name cannot contain "test"')
    })
  })

  describe('performance', () => {
    it('generates schema efficiently for large forms', () => {
      // Create many variables
      const manyVariables = computed(() => Array.from({ length: 100 }, (_, i) => ({
        name: `field${i}`,
        path: [`field${i}`],
        type: { base: 'text' as const },
        label: `Field ${i}`,
        required: i % 2 === 0,
        validation: [
          { type: 'minLength' as const, value: 1, message: 'Required' }
        ]
      })))
      
      const startTime = performance.now()
      const { schema } = useSchemaGeneration(manyVariables, conditionalLogic)
      
      // Access the computed schema
      const formSchema = schema.value
      expect(Object.keys(formSchema.shape)).toHaveLength(100)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should generate quickly
      expect(duration).toBeLessThan(50) // 50ms threshold
    })
  })
})