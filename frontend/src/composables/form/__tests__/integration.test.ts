/**
 * Integration tests between T10A and T10B components
 */

import { describe, it, expect } from 'vitest'
import { useTemplateVariables } from '../useTemplateVariables'
import { useFieldMapping } from '../useFieldMapping'
import { useFormLayout } from '../useFormLayout'
import { generateValidationSchema } from '../useFormValidation'

describe('T10A + T10B Integration', () => {
  describe('End-to-end template processing', () => {
    it('processes legal document template completely', () => {
      // T10A: Parse template
      const { parseTemplate } = useTemplateVariables()
      const template = `
        <!-- Legal Contract Template -->
        <!-- @field:client.name type="text" required="true" -->
        <!-- @field:client.email type="email" required="true" -->
        <!-- @field:matter.title type="text" required="true" -->
        <!-- @field:matter.court type="court-list" required="true" -->
        <!-- @field:matter.amount type="currency" -->
        
        Client: {{client.name}}
        Email: {{client.email}}
        
        Matter: {{matter.title}}
        Court: {{matter.court}}
        Amount: {{matter.amount}}
        
        Filing Date: {{matter.filingDate}}
        Notes: {{matter.notes}}
      `
      
      const variables = parseTemplate(template)
      
      // Verify T10A parsing worked
      expect(variables).toHaveLength(7)
      expect(variables.map(v => v.name)).toEqual([
        'client.name',
        'client.email', 
        'matter.title',
        'matter.court',
        'matter.amount',
        'matter.filingDate',
        'matter.notes'
      ])
      
      // T10B: Group fields by section
      const { groupFieldsBySection } = useFormLayout()
      const fieldGroups = groupFieldsBySection(variables)
      
      expect(fieldGroups).toHaveLength(2)
      expect(fieldGroups[0].section).toBe('client')
      expect(fieldGroups[1].section).toBe('matter')
      
      // T10B: Map fields to components
      variables.forEach(variable => {
        const { fieldComponent, fieldProps } = useFieldMapping(variable)
        
        expect(fieldComponent.value).toBeDefined()
        expect(fieldProps.value.id).toBe(variable.name)
        expect(fieldProps.value.label).toBe(variable.label)
      })
      
      // T10B: Generate validation schema
      const schema = generateValidationSchema(variables)
      
      expect(schema).toBeDefined()
      expect(Object.keys(schema.shape)).toEqual(variables.map(v => v.name))
    })

    it('handles complex nested template with arrays', () => {
      const { parseTemplate } = useTemplateVariables()
      const template = `
        Witnesses:
        {{witnesses[0].name}} - {{witnesses[0].phone}}
        {{witnesses[1].name}} - {{witnesses[1].phone}}
        
        Parties:
        {{parties[].name}} - {{parties[].address.street}}
      `
      
      const variables = parseTemplate(template)
      
      // Should detect array fields correctly
      const arrayFields = variables.filter(v => v.isArray)
      expect(arrayFields.length).toBeGreaterThan(0)
      
      // Should group array fields properly
      const { groupFieldsBySection } = useFormLayout()
      const fieldGroups = groupFieldsBySection(variables)
      
      expect(fieldGroups.length).toBeGreaterThan(0)
    })

    it('generates correct field mappings for legal field types', () => {
      const { parseTemplate } = useTemplateVariables()
      const template = `
        Case: {{case.number}}
        Court: {{court.name}}
        Attorney: {{attorney.name}}
        Email: {{contact.email}}
        Phone: {{contact.phone}}
        Amount: {{financial.amount}}
        Date: {{dates.filing}}
      `
      
      const variables = parseTemplate(template)
      
      // Verify field type detection
      const caseField = variables.find(v => v.name === 'case.number')
      const courtField = variables.find(v => v.name === 'court.name')
      const emailField = variables.find(v => v.name === 'contact.email')
      const phoneField = variables.find(v => v.name === 'contact.phone')
      const amountField = variables.find(v => v.name === 'financial.amount')
      const dateField = variables.find(v => v.name === 'dates.filing')
      
      // Check field types (T10A detects these automatically)
      expect(caseField?.type.base).toBe('number') // case.number detected as number
      expect(courtField?.type.base).toBe('select') // court.name detected as select  
      expect(emailField?.type.variant).toBe('email')
      expect(phoneField?.type.variant).toBe('phone')
      expect(amountField?.type.variant).toBe('currency')
      expect(dateField?.type.base).toBe('date')
      
      // Verify field mappings
      const { fieldProps: caseProps } = useFieldMapping(caseField!)
      const { fieldProps: courtProps } = useFieldMapping(courtField!)
      const { fieldProps: emailProps } = useFieldMapping(emailField!)
      
      // Verify basic field mappings work
      expect(caseProps.value.id).toBe('case.number')
      expect(courtProps.value.id).toBe('court.name')
      expect(emailProps.value.type).toBe('email')
    })
  })

  describe('Form layout optimization', () => {
    it('optimizes layout based on field types and count', () => {
      const { parseTemplate } = useTemplateVariables()
      const template = `
        <!-- Client section with standard fields -->
        Client: {{client.name}}
        Email: {{client.email}}
        
        <!-- Address section with wide fields -->
        Street: {{address.street}}
        City: {{address.city}}
        
        <!-- Notes section with text area -->
        Notes: {{notes.general}}
        Comments: {{notes.comments}}
      `
      
      const variables = parseTemplate(template)
      const { groupFieldsBySection, calculateColumnsForSection } = useFormLayout()
      const fieldGroups = groupFieldsBySection(variables)
      
      // Client section should have 2 columns (2 standard fields)
      const clientGroup = fieldGroups.find(g => g.section === 'client')
      expect(clientGroup?.columns).toBe(2)
      
      // Address section should have 1 column (full-width preferred)
      const addressGroup = fieldGroups.find(g => g.section === 'address')
      expect(addressGroup?.columns).toBe(1)
      
      // Notes section should be collapsible
      const notesGroup = fieldGroups.find(g => g.section === 'notes')
      expect(notesGroup?.collapsible).toBe(true)
      expect(notesGroup?.collapsed).toBe(true)
    })
  })

  describe('Validation integration', () => {
    it('applies validation rules from template metadata', () => {
      const { parseTemplate } = useTemplateVariables()
      const template = `
        <!-- @field:client.email type="email" required="true" -->
        <!-- @field:matter.amount type="currency" required="true" -->
        <!-- @field:case.number type="case-number" required="true" -->
        
        Email: {{client.email}}
        Amount: {{matter.amount}}
        Case: {{case.number}}
      `
      
      const variables = parseTemplate(template)
      const schema = generateValidationSchema(variables)
      
      // Test email validation
      expect(() => {
        schema.parse({
          'client.email': 'test@example.com',
          'matter.amount': '1000', // Currency fields expect strings
          'case.number': '2024-CV-12345'
        })
      }).not.toThrow()
      
      // Test invalid email
      expect(() => {
        schema.parse({
          'client.email': 'invalid-email',
          'matter.amount': '1000',
          'case.number': '2024-CV-12345'
        })
      }).toThrow()
      
      // Test invalid case number (just test required field for now)
      expect(() => {
        schema.parse({
          'client.email': 'test@example.com',
          'matter.amount': '1000',
          'case.number': '' // Empty required field
        })
      }).toThrow()
    })
  })

  describe('Performance integration', () => {
    it('processes large templates efficiently', () => {
      const { parseTemplate } = useTemplateVariables()
      
      // Generate large template
      const fields = Array.from({ length: 100 }, (_, i) => `{{field${i}}}`)
      const template = fields.join('\n')
      
      const startTime = performance.now()
      
      // T10A: Parse template
      const variables = parseTemplate(template)
      
      // T10B: Process for form rendering
      const { groupFieldsBySection } = useFormLayout()
      const fieldGroups = groupFieldsBySection(variables)
      
      // Generate validation schema
      const schema = generateValidationSchema(variables)
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      expect(variables).toHaveLength(100)
      expect(fieldGroups.length).toBeGreaterThan(0)
      expect(Object.keys(schema.shape)).toHaveLength(100)
      expect(duration).toBeLessThan(100) // Should process 100 fields in under 100ms
    })
  })
})