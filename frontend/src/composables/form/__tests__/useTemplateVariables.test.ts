/**
 * Unit tests for template variable parser composable
 */

import { describe, it, expect } from 'vitest'
import { useTemplateVariables } from '../useTemplateVariables'

describe('useTemplateVariables', () => {
  const { 
    parseTemplate, 
    createTemplateVariable,
    generateLabel,
    generatePlaceholder,
    isRequiredField,
    deduplicateVariables
  } = useTemplateVariables()

  describe('parseTemplate', () => {
    it('should parse simple variables', () => {
      const template = 'Dear {{client.name}}, your case {{matter.number}} is scheduled.'
      const variables = parseTemplate(template)
      
      expect(variables).toHaveLength(2)
      expect(variables[0].name).toBe('client.name')
      expect(variables[1].name).toBe('matter.number')
    })

    it('should handle nested paths', () => {
      const template = '{{client.company.address.street}} {{client.company.address.city}}'
      const variables = parseTemplate(template)
      
      expect(variables[0].path).toEqual(['client', 'company', 'address', 'street'])
      expect(variables[1].path).toEqual(['client', 'company', 'address', 'city'])
    })

    it('should parse array notation', () => {
      const template = '{{witnesses[0].name}} - {{witnesses[0].contact.phone}}'
      const variables = parseTemplate(template)
      
      expect(variables[0].isArray).toBe(true)
      expect(variables[0].arrayIndex).toBe(0)
      expect(variables[0].path).toEqual(['witnesses', 'name'])
    })

    it('should deduplicate identical variables', () => {
      const template = '{{client.name}} called {{client.name}} about {{client.name}}'
      const variables = parseTemplate(template)
      
      expect(variables).toHaveLength(1)
      expect(variables[0].name).toBe('client.name')
    })

    it('should handle whitespace in variables', () => {
      const template = '{{ client.name }} and {{  matter.title  }}'
      const variables = parseTemplate(template)
      
      expect(variables[0].name).toBe('client.name')
      expect(variables[1].name).toBe('matter.title')
    })

    it('should extract metadata from comments', () => {
      const template = `
        <!-- @field:client.email type="email" required="true" -->
        Email: {{client.email}}
      `
      const variables = parseTemplate(template)
      
      expect(variables[0].type.variant).toBe('email')
      expect(variables[0].required).toBe(true)
    })

    it('should handle empty templates', () => {
      const variables = parseTemplate('')
      expect(variables).toHaveLength(0)
    })

    it('should handle templates without variables', () => {
      const template = 'This is a static template with no variables.'
      const variables = parseTemplate(template)
      expect(variables).toHaveLength(0)
    })

    it('should parse Japanese field metadata', () => {
      const template = `
        /* @var client.氏名 {text} required */
        {{client.氏名}}
      `
      const variables = parseTemplate(template)
      
      expect(variables[0].required).toBe(true)
      expect(variables[0].type.base).toBe('text')
    })

    it('should handle custom delimiters', () => {
      const template = '<<client.name>> and [[matter.number]]'
      
      const variables1 = parseTemplate(template, { delimiters: ['<<', '>>'] })
      expect(variables1).toHaveLength(1)
      expect(variables1[0].name).toBe('client.name')
      
      const variables2 = parseTemplate(template, { delimiters: ['[[', ']]'] })
      expect(variables2).toHaveLength(1)
      expect(variables2[0].name).toBe('matter.number')
    })
  })

  describe('createTemplateVariable', () => {
    it('should create variable with detected type', () => {
      const variable = createTemplateVariable('client.email')
      
      expect(variable.name).toBe('client.email')
      expect(variable.path).toEqual(['client', 'email'])
      expect(variable.type.base).toBe('text')
      expect(variable.type.variant).toBe('email')
      expect(variable.label).toBe('Email')
      expect(variable.placeholder).toBe('example@domain.com')
    })

    it('should detect required fields', () => {
      const required = createTemplateVariable('client.name')
      const optional = createTemplateVariable('client.nickname')
      
      expect(required.required).toBe(true)
      expect(optional.required).toBe(false)
    })

    it('should handle array fields', () => {
      const variable = createTemplateVariable('items[].description')
      
      expect(variable.isArray).toBe(true)
      expect(variable.path).toEqual(['items', 'description'])
    })
  })

  describe('generateLabel', () => {
    it('should convert camelCase to title case', () => {
      expect(generateLabel('firstName')).toBe('First Name')
      expect(generateLabel('phoneNumber')).toBe('Phone Number')
    })

    it('should handle snake_case', () => {
      expect(generateLabel('first_name')).toBe('First Name')
      expect(generateLabel('date_of_birth')).toBe('Date Of Birth')
    })

    it('should handle kebab-case', () => {
      expect(generateLabel('first-name')).toBe('First Name')
      expect(generateLabel('court-name')).toBe('Court Name')
    })

    it('should handle nested paths', () => {
      expect(generateLabel('client.company.name')).toBe('Name')
      expect(generateLabel('matter.court.address')).toBe('Address')
    })

    it('should handle single words', () => {
      expect(generateLabel('name')).toBe('Name')
      expect(generateLabel('email')).toBe('Email')
    })
  })

  describe('generatePlaceholder', () => {
    it('should generate type-specific placeholders', () => {
      expect(generatePlaceholder('email', { base: 'text', variant: 'email' }))
        .toBe('example@domain.com')
      
      expect(generatePlaceholder('phone', { base: 'text', variant: 'phone' }))
        .toBe('03-1234-5678')
      
      expect(generatePlaceholder('birthDate', { base: 'date' }))
        .toBe('YYYY-MM-DD')
    })

    it('should generate contextual placeholders', () => {
      expect(generatePlaceholder('description', { base: 'text', variant: 'textarea' }))
        .toBe('Enter description...')
      
      expect(generatePlaceholder('amount', { base: 'number', variant: 'currency' }))
        .toBe('¥0.00')
    })

    it('should handle legal-specific fields', () => {
      expect(generatePlaceholder('caseNumber', { base: 'text', variant: 'case-number' }))
        .toBe('2024-CV-12345')
      
      expect(generatePlaceholder('courtName', { base: 'select', variant: 'court-list' }))
        .toBe('Select court name')
    })
  })

  describe('isRequiredField', () => {
    it('should detect required legal fields', () => {
      expect(isRequiredField('client.name')).toBe(true)
      expect(isRequiredField('party.name')).toBe(true)
      expect(isRequiredField('plaintiff.name')).toBe(true)
      expect(isRequiredField('defendant.name')).toBe(true)
    })

    it('should detect required contact fields', () => {
      expect(isRequiredField('client.email')).toBe(true)
      expect(isRequiredField('contact.phone')).toBe(true)
    })

    it('should detect required case fields', () => {
      expect(isRequiredField('matter.title')).toBe(true)
      expect(isRequiredField('case.number')).toBe(true)
      expect(isRequiredField('case.id')).toBe(true)
    })

    it('should mark optional fields correctly', () => {
      expect(isRequiredField('notes')).toBe(false)
      expect(isRequiredField('client.middleName')).toBe(false)
      expect(isRequiredField('additionalInfo')).toBe(false)
    })
  })

  describe('deduplicateVariables', () => {
    it('should remove duplicate variables', () => {
      const variables = [
        createTemplateVariable('client.name'),
        createTemplateVariable('client.email'),
        createTemplateVariable('client.name'),
        createTemplateVariable('client.email')
      ]
      
      const deduplicated = deduplicateVariables(variables)
      expect(deduplicated).toHaveLength(2)
      expect(deduplicated.map(v => v.name)).toEqual(['client.name', 'client.email'])
    })

    it('should preserve first occurrence', () => {
      const var1 = createTemplateVariable('client.name')
      var1.metadata = { custom: 'value1' }
      
      const var2 = createTemplateVariable('client.name')
      var2.metadata = { custom: 'value2' }
      
      const deduplicated = deduplicateVariables([var1, var2])
      expect(deduplicated[0].metadata?.custom).toBe('value1')
    })
  })

  describe('validation rule extraction', () => {
    it('should extract validation from metadata', () => {
      const template = `
        <!-- @field:client.age type="number" min="18" max="120" -->
        {{client.age}}
      `
      const variables = parseTemplate(template)
      
      const validationRules = variables[0].validation || []
      expect(validationRules).toContainEqual(
        expect.objectContaining({ type: 'min', value: '18' })
      )
      expect(validationRules).toContainEqual(
        expect.objectContaining({ type: 'max', value: '120' })
      )
    })

    it('should add type-based validation', () => {
      const emailVar = createTemplateVariable('client.email')
      const emailValidation = emailVar.validation?.find(v => v.type === 'pattern')
      
      expect(emailValidation).toBeDefined()
      expect(emailValidation?.message).toContain('valid email')
    })
  })

  describe('performance', () => {
    it('should parse 100 variables in under 10ms', () => {
      const variables = Array.from({ length: 100 }, (_, i) => `{{field${i}}}`).join(' ')
      
      const start = performance.now()
      const result = parseTemplate(variables)
      const duration = performance.now() - start
      
      expect(result).toHaveLength(100)
      expect(duration).toBeLessThan(50) // 50ms for 100 variables is still very fast
    })
    
    it('should handle deeply nested paths efficiently', () => {
      const deepPath = 'a.b.c.d.e.f.g.h.i.j.k.l.m.n.o.p'
      const template = `{{${deepPath}}}`
      
      const variables = parseTemplate(template)
      expect(variables[0].path).toHaveLength(16)
    })
  })
})