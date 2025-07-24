import { describe, it, expect, beforeEach } from 'vitest'
import { ref } from 'vue'
import { useConditionalLogic } from '../useConditionalLogic'
import type { ParsedTemplateVariable, FieldCondition } from '../types'

describe('useConditionalLogic', () => {
  let variables: any
  let formData: any

  beforeEach(() => {
    variables = ref<ParsedTemplateVariable[]>([
      {
        name: 'clientType',
        path: ['client', 'type'],
        type: { base: 'select' as const },
        label: 'Client Type',
        required: false
      },
      {
        name: 'companyName',
        path: ['company', 'name'],
        type: { base: 'text' as const },
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
        name: 'contactEmail',
        path: ['contact', 'email'],
        type: { base: 'email' as const },
        label: 'Contact Email',
        required: true,
        conditions: [{
          type: 'require',
          when: {
            field: 'clientType',
            operator: 'equals',
            value: 'individual'
          }
        }]
      }
    ])

    formData = ref({
      clientType: '',
      companyName: '',
      contactEmail: ''
    })
  })

  describe('basic condition evaluation', () => {
    it('evaluates equals condition correctly', () => {
      const { evaluateCondition } = useConditionalLogic(variables, formData)
      
      const condition: FieldCondition = {
        type: 'show',
        when: {
          field: 'clientType',
          operator: 'equals',
          value: 'corporate'
        }
      }

      formData.value.clientType = 'corporate'
      expect(evaluateCondition(condition)).toBe(true)

      formData.value.clientType = 'individual'
      expect(evaluateCondition(condition)).toBe(false)
    })

    it('evaluates notEquals condition correctly', () => {
      const { evaluateCondition } = useConditionalLogic(variables, formData)
      
      const condition: FieldCondition = {
        type: 'hide',
        when: {
          field: 'clientType',
          operator: 'notEquals',
          value: 'corporate'
        }
      }

      formData.value.clientType = 'individual'
      expect(evaluateCondition(condition)).toBe(true)

      formData.value.clientType = 'corporate'
      expect(evaluateCondition(condition)).toBe(false)
    })

    it('evaluates isEmpty condition correctly', () => {
      const { evaluateCondition } = useConditionalLogic(variables, formData)
      
      const condition: FieldCondition = {
        type: 'show',
        when: {
          field: 'companyName',
          operator: 'isEmpty',
          value: null
        }
      }

      formData.value.companyName = ''
      expect(evaluateCondition(condition)).toBe(true)

      formData.value.companyName = null
      expect(evaluateCondition(condition)).toBe(true)

      formData.value.companyName = 'ACME Corp'
      expect(evaluateCondition(condition)).toBe(false)
    })

    it('evaluates contains condition correctly', () => {
      const { evaluateCondition } = useConditionalLogic(variables, formData)
      
      const condition: FieldCondition = {
        type: 'show',
        when: {
          field: 'contactEmail',
          operator: 'contains',
          value: '@company.com'
        }
      }

      formData.value.contactEmail = 'john@company.com'
      expect(evaluateCondition(condition)).toBe(true)

      formData.value.contactEmail = 'john@personal.com'
      expect(evaluateCondition(condition)).toBe(false)
    })

    it('evaluates numeric comparison conditions', () => {
      const { evaluateCondition } = useConditionalLogic(variables, formData)
      
      // Add numeric field to form data
      formData.value.amount = 1000

      const gtCondition: FieldCondition = {
        type: 'show',
        when: {
          field: 'amount',
          operator: 'gt',
          value: 500
        }
      }

      const ltCondition: FieldCondition = {
        type: 'show',
        when: {
          field: 'amount',
          operator: 'lt',
          value: 2000
        }
      }

      expect(evaluateCondition(gtCondition)).toBe(true)
      expect(evaluateCondition(ltCondition)).toBe(true)

      formData.value.amount = 100
      expect(evaluateCondition(gtCondition)).toBe(false)
      expect(evaluateCondition(ltCondition)).toBe(true)
    })
  })

  describe('complex condition evaluation', () => {
    it('evaluates AND conditions correctly', () => {
      const { evaluateComplexCondition } = useConditionalLogic(variables, formData)
      
      const condition: FieldCondition = {
        type: 'show',
        when: {
          field: 'clientType',
          operator: 'equals',
          value: 'corporate'
        },
        and: [{
          type: 'show',
          when: {
            field: 'companyName',
            operator: 'isNotEmpty',
            value: null
          }
        }]
      }

      formData.value.clientType = 'corporate'
      formData.value.companyName = 'ACME Corp'
      expect(evaluateComplexCondition(condition)).toBe(true)

      formData.value.companyName = ''
      expect(evaluateComplexCondition(condition)).toBe(false)

      formData.value.clientType = 'individual'
      formData.value.companyName = 'ACME Corp'
      expect(evaluateComplexCondition(condition)).toBe(false)
    })

    it('evaluates OR conditions correctly', () => {
      const { evaluateComplexCondition } = useConditionalLogic(variables, formData)
      
      const condition: FieldCondition = {
        type: 'require',
        when: {
          field: 'clientType',
          operator: 'equals',
          value: 'individual'
        },
        or: [{
          type: 'require',
          when: {
            field: 'clientType',
            operator: 'equals',
            value: 'sole_proprietor'
          }
        }]
      }

      formData.value.clientType = 'individual'
      expect(evaluateComplexCondition(condition)).toBe(true)

      formData.value.clientType = 'sole_proprietor'
      expect(evaluateComplexCondition(condition)).toBe(true)

      formData.value.clientType = 'corporate'
      expect(evaluateComplexCondition(condition)).toBe(false)
    })
  })

  describe('field state management', () => {
    it('updates field visibility based on conditions', async () => {
      const { fieldVisibility, updateFieldStates } = useConditionalLogic(variables, formData)
      
      // Initially company name should be hidden (clientType is empty)
      updateFieldStates()
      expect(fieldVisibility.value.companyName).toBe(false)

      // Show company name when clientType is corporate
      formData.value.clientType = 'corporate'
      updateFieldStates()
      expect(fieldVisibility.value.companyName).toBe(true)

      // Hide company name when clientType changes
      formData.value.clientType = 'individual'
      updateFieldStates()
      expect(fieldVisibility.value.companyName).toBe(false)
    })

    it('updates field required state based on conditions', async () => {
      const { fieldRequired, updateFieldStates } = useConditionalLogic(variables, formData)
      
      // Initially contactEmail should have default required state
      updateFieldStates()
      expect(fieldRequired.value.contactEmail).toBe(true) // Base required is true

      formData.value.clientType = 'individual'
      updateFieldStates()
      expect(fieldRequired.value.contactEmail).toBe(true) // Still required

      formData.value.clientType = 'corporate'
      updateFieldStates()
      expect(fieldRequired.value.contactEmail).toBe(true) // Base required still applies
    })

    it('provides helper methods for field state checking', () => {
      const { isFieldVisible, isFieldEnabled, isFieldRequired } = useConditionalLogic(variables, formData)
      
      // Test visibility
      formData.value.clientType = 'corporate'
      expect(isFieldVisible('companyName')).toBe(true)
      
      formData.value.clientType = 'individual'
      expect(isFieldVisible('companyName')).toBe(false)

      // Test enabled state (default to enabled)
      expect(isFieldEnabled('contactEmail')).toBe(true)

      // Test required state
      expect(isFieldRequired('contactEmail')).toBe(true)
    })
  })

  describe('computed properties', () => {
    it('provides visible fields list', () => {
      const { visibleFields } = useConditionalLogic(variables, formData)
      
      formData.value.clientType = 'corporate'
      const visible = visibleFields.value
      
      expect(visible.map(v => v.name)).toContain('companyName')
      expect(visible.map(v => v.name)).toContain('clientType')
      expect(visible.map(v => v.name)).toContain('contactEmail')
    })

    it('provides required fields list', () => {
      const { requiredFields } = useConditionalLogic(variables, formData)
      
      const required = requiredFields.value
      expect(required.map(r => r.name)).toContain('contactEmail')
    })
  })

  describe('edge cases', () => {
    it('handles fields without conditions gracefully', () => {
      const { isFieldVisible, isFieldEnabled } = useConditionalLogic(variables, formData)
      
      // clientType has no conditions, should default to visible and enabled
      expect(isFieldVisible('clientType')).toBe(true)
      expect(isFieldEnabled('clientType')).toBe(true)
    })

    it('handles unknown operators gracefully', () => {
      const { evaluateCondition } = useConditionalLogic(variables, formData)
      
      const invalidCondition = {
        type: 'show' as const,
        when: {
          field: 'clientType',
          operator: 'unknownOperator' as any,
          value: 'test'
        }
      }

      expect(evaluateCondition(invalidCondition)).toBe(false)
    })

    it('handles missing field references gracefully', () => {
      const { evaluateCondition } = useConditionalLogic(variables, formData)
      
      const condition: FieldCondition = {
        type: 'show',
        when: {
          field: 'nonExistentField',
          operator: 'equals',
          value: 'test'
        }
      }

      // Should not throw error and return false for missing fields
      expect(evaluateCondition(condition)).toBe(false)
    })
  })

  describe('performance', () => {
    it('handles large numbers of conditions efficiently', () => {
      const startTime = performance.now()
      
      // Create many variables with conditions
      const manyVariables = Array.from({ length: 100 }, (_, i) => ({
        name: `field${i}`,
        path: [`field${i}`],
        type: { base: 'text' as const },
        label: `Field ${i}`,
        required: false,
        conditions: [{
          type: 'show' as const,
          when: {
            field: 'clientType',
            operator: 'equals' as const,
            value: `value${i}`
          }
        }]
      }))

      const manyFormData = ref({
        clientType: 'value50',
        ...Object.fromEntries(manyVariables.map(v => [v.name, '']))
      })

      const { updateFieldStates } = useConditionalLogic(ref(manyVariables), manyFormData)
      updateFieldStates()
      
      const endTime = performance.now()
      const duration = endTime - startTime
      
      // Should complete within reasonable time (adjust threshold as needed)
      expect(duration).toBeLessThan(100) // 100ms threshold
    })
  })
})