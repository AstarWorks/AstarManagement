/**
 * Unit tests for field type detection composable
 */

import { describe, it, expect } from 'vitest'
import { useFieldTypeDetection } from '../useFieldTypeDetection'

describe('useFieldTypeDetection', () => {
  const { 
    detectFieldType,
    detectFieldTypeWithConfidence,
    addDetectionRule,
    removeDetectionRule,
    getDetectionRules,
    suggestFieldTypeFromValues
  } = useFieldTypeDetection()

  describe('detectFieldType', () => {
    describe('common field patterns', () => {
      it('should detect email fields', () => {
        expect(detectFieldType('email').variant).toBe('email')
        expect(detectFieldType('user_email').variant).toBe('email')
        expect(detectFieldType('contact.email').variant).toBe('email')
        expect(detectFieldType('primaryEmail').variant).toBe('email')
      })

      it('should detect phone fields', () => {
        expect(detectFieldType('phone').variant).toBe('phone')
        expect(detectFieldType('telephone').variant).toBe('phone')
        expect(detectFieldType('mobile').variant).toBe('phone')
        expect(detectFieldType('fax').variant).toBe('phone')
        expect(detectFieldType('contact_number').variant).toBe('phone')
      })

      it('should detect date fields', () => {
        expect(detectFieldType('date').base).toBe('date')
        expect(detectFieldType('birthDate').base).toBe('date')
        expect(detectFieldType('created_at').base).toBe('date')
        expect(detectFieldType('updatedAt').base).toBe('date')
        expect(detectFieldType('deadline').base).toBe('date')
        expect(detectFieldType('dueDate').base).toBe('date')
        expect(detectFieldType('expiresOn').base).toBe('date')
      })

      it('should detect number fields', () => {
        expect(detectFieldType('amount').base).toBe('number')
        expect(detectFieldType('price').base).toBe('number')
        expect(detectFieldType('quantity').base).toBe('number')
        expect(detectFieldType('age').base).toBe('number')
        expect(detectFieldType('totalCount').base).toBe('number')
      })

      it('should detect currency fields', () => {
        const currency = detectFieldType('payment_amount')
        expect(currency.base).toBe('number')
        expect(currency.variant).toBe('currency')
        expect(currency.format).toBe('jpy')
      })

      it('should detect textarea fields', () => {
        expect(detectFieldType('description').variant).toBe('textarea')
        expect(detectFieldType('comments').variant).toBe('textarea')
        expect(detectFieldType('notes').variant).toBe('textarea')
        expect(detectFieldType('detailedMessage').variant).toBe('textarea')
      })

      it('should detect select fields', () => {
        expect(detectFieldType('status').base).toBe('select')
        expect(detectFieldType('type').base).toBe('select')
        expect(detectFieldType('category').base).toBe('select')
        expect(detectFieldType('priority').base).toBe('select')
      })

      it('should detect checkbox fields', () => {
        expect(detectFieldType('agree').base).toBe('checkbox')
        expect(detectFieldType('acceptTerms').base).toBe('checkbox')
        expect(detectFieldType('isConfirmed').base).toBe('checkbox')
      })

      it('should detect URL fields', () => {
        expect(detectFieldType('website').variant).toBe('url')
        expect(detectFieldType('link').variant).toBe('url')
        expect(detectFieldType('homepage_url').variant).toBe('url')
      })
    })

    describe('legal field patterns', () => {
      it('should detect case number fields', () => {
        const caseNumber = detectFieldType('caseNumber')
        expect(caseNumber.base).toBe('text')
        expect(caseNumber.variant).toBe('case-number')
        
        expect(detectFieldType('matter_number').variant).toBe('case-number')
        expect(detectFieldType('docket').variant).toBe('case-number')
      })

      it('should detect court fields', () => {
        const court = detectFieldType('courtName')
        expect(court.base).toBe('select')
        expect(court.variant).toBe('court-list')
        
        expect(detectFieldType('tribunal').variant).toBe('court-list')
      })

      it('should detect judge fields', () => {
        const judge = detectFieldType('judgeName')
        expect(judge.base).toBe('text')
        expect(judge.variant).toBe('person-name')
        
        expect(detectFieldType('magistrate').variant).toBe('person-name')
      })

      it('should detect attorney fields', () => {
        expect(detectFieldType('attorneyName').variant).toBe('person-name')
        expect(detectFieldType('lawyer').variant).toBe('person-name')
        expect(detectFieldType('counsel').variant).toBe('person-name')
      })

      it('should detect party fields', () => {
        expect(detectFieldType('plaintiff').variant).toBe('person-name')
        expect(detectFieldType('defendant').variant).toBe('person-name')
        expect(detectFieldType('petitioner').variant).toBe('person-name')
      })

      it('should detect filing dates', () => {
        const filingDate = detectFieldType('filingDate')
        expect(filingDate.base).toBe('date')
        expect(filingDate.format).toBe('yyyy-mm-dd')
      })

      it('should detect legal amounts', () => {
        const amount = detectFieldType('damages')
        expect(amount.base).toBe('number')
        expect(amount.variant).toBe('currency')
        expect(amount.format).toBe('jpy')
      })
    })

    describe('Japanese field patterns', () => {
      it('should detect Japanese postal code', () => {
        const postalCode = detectFieldType('郵便番号')
        expect(postalCode.base).toBe('text')
        expect(postalCode.variant).toBe('postal-code')
        expect(postalCode.format).toBe('jp')
      })

      it('should detect prefecture fields', () => {
        const prefecture = detectFieldType('都道府県')
        expect(prefecture.base).toBe('select')
        expect(prefecture.variant).toBe('prefecture')
      })

      it('should detect Japanese name fields', () => {
        const name = detectFieldType('氏名')
        expect(name.base).toBe('text')
        expect(name.variant).toBe('person-name')
        expect(name.format).toBe('jp')
      })

      it('should detect Japanese phone fields', () => {
        const phone = detectFieldType('電話番号')
        expect(phone.base).toBe('text')
        expect(phone.variant).toBe('phone')
        expect(phone.format).toBe('jp')
      })

      it('should detect Japanese address fields', () => {
        const address = detectFieldType('住所')
        expect(address.base).toBe('text')
        expect(address.variant).toBe('address')
        expect(address.format).toBe('jp')
      })
    })

    describe('field modifiers', () => {
      it('should detect array fields', () => {
        const type = detectFieldType('emailList')
        expect(type.options?.multiple).toBe(true)
        
        const items = detectFieldType('items')
        expect(items.options?.multiple).toBe(true)
      })

      it('should detect optional fields', () => {
        const optional = detectFieldType('optionalNotes')
        expect(optional.options?.optional).toBe(true)
      })

      it('should detect size modifiers', () => {
        const short = detectFieldType('shortDescription')
        expect(short.variant).toBe('textarea')
        expect(short.options?.rows).toBe(3)
        
        const long = detectFieldType('fullDescription')
        expect(long.variant).toBe('textarea')
        expect(long.options?.rows).toBe(8)
      })

      it('should detect international formats', () => {
        const intlPhone = detectFieldType('internationalPhone')
        expect(intlPhone.format).toBe('international')
      })
    })

    describe('default behavior', () => {
      it('should default to text field for unknown patterns', () => {
        expect(detectFieldType('randomField').base).toBe('text')
        expect(detectFieldType('xyz123').base).toBe('text')
        expect(detectFieldType('customData').base).toBe('text')
      })
    })
  })

  describe('detectFieldTypeWithConfidence', () => {
    it('should return confidence scores', () => {
      const emailResult = detectFieldTypeWithConfidence('email')
      expect(emailResult.confidence).toBeGreaterThan(0.9)
      expect(emailResult.reason).toContain('Email')
      
      const unknownResult = detectFieldTypeWithConfidence('xyz')
      expect(unknownResult.confidence).toBe(0.5)
      expect(unknownResult.reason).toContain('Default')
    })

    it('should boost confidence for exact matches', () => {
      const exact = detectFieldTypeWithConfidence('email')
      const partial = detectFieldTypeWithConfidence('user_email_address')
      
      // Both should detect email, but exact should have higher confidence
      expect(exact.type.variant).toBe('email')
      expect(partial.type.variant).toBe('email')
      expect(exact.confidence).toBeGreaterThanOrEqual(0.95)
      expect(partial.confidence).toBeGreaterThanOrEqual(0.9)
    })

    it('should reduce confidence for long field names', () => {
      const short = detectFieldTypeWithConfidence('email')
      const long = detectFieldTypeWithConfidence('this_is_a_very_long_field_name_that_contains_email_somewhere')
      
      expect(long.confidence).toBeLessThan(short.confidence)
    })

    it('should handle custom rules with perfect confidence', () => {
      const result = detectFieldTypeWithConfidence('customField', {
        'custom': /^custom/
      })
      
      expect(result.confidence).toBe(1.0)
      expect(result.reason).toBe('Custom rule match')
    })
  })

  describe('custom detection rules', () => {
    it('should add and apply custom rules', () => {
      const customRule = {
        pattern: /^sku/i,
        type: { base: 'text' as const, variant: 'sku' },
        priority: 100,
        confidence: 0.95,
        description: 'Product SKU'
      }
      
      addDetectionRule(customRule)
      
      const result = detectFieldType('skuNumber')
      expect(result.variant).toBe('sku')
      
      // Cleanup
      removeDetectionRule(customRule.pattern)
    })

    it('should prioritize higher priority rules', () => {
      const lowPriority = {
        pattern: /test/,
        type: { base: 'text' as const, variant: 'low' },
        priority: 10,
        confidence: 0.9
      }
      
      const highPriority = {
        pattern: /test/,
        type: { base: 'text' as const, variant: 'high' },
        priority: 100,
        confidence: 0.9
      }
      
      addDetectionRule(lowPriority)
      addDetectionRule(highPriority)
      
      const result = detectFieldType('test')
      expect(result.variant).toBe('high')
      
      // Cleanup
      removeDetectionRule(lowPriority.pattern)
      removeDetectionRule(highPriority.pattern)
    })
  })

  describe('suggestFieldTypeFromValues', () => {
    it('should detect email from values', () => {
      const values = ['test@example.com', 'user@domain.org', 'admin@company.jp']
      const result = suggestFieldTypeFromValues(values)
      
      expect(result.type.variant).toBe('email')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should detect phone numbers from values', () => {
      const values = ['03-1234-5678', '090-9999-8888', '+81-3-1234-5678']
      const result = suggestFieldTypeFromValues(values)
      
      expect(result.type.variant).toBe('phone')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should detect dates from values', () => {
      const values = ['2024-01-01', '2024-12-31', '2023-06-15']
      const result = suggestFieldTypeFromValues(values)
      
      // Check that all values match date pattern
      const allDates = values.every(v => /^\d{4}-\d{2}-\d{2}$/.test(v))
      expect(allDates).toBe(true)
      
      expect(result.type.base).toBe('date')
      expect(result.type.format).toBe('yyyy-mm-dd')
      expect(result.confidence).toBeGreaterThan(0.9)
    })

    it('should detect URLs from values', () => {
      const values = ['https://example.com', 'http://test.org', 'https://google.jp']
      const result = suggestFieldTypeFromValues(values)
      
      expect(result.type.variant).toBe('url')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should detect numbers from values', () => {
      const values = ['100', '250.50', '1000']
      const result = suggestFieldTypeFromValues(values)
      
      expect(result.type.base).toBe('number')
      expect(result.confidence).toBeGreaterThan(0.8)
    })

    it('should detect long text from values', () => {
      const values = [
        'This is a very long text that goes on and on and contains many words and sentences that would typically be found in a textarea field.',
        'Another long piece of text with multiple sentences. It contains detailed information that wouldn\'t fit in a regular input field.'
      ]
      const result = suggestFieldTypeFromValues(values)
      
      expect(result.type.variant).toBe('textarea')
      expect(result.confidence).toBeGreaterThan(0.7)
    })

    it('should default to text for mixed values', () => {
      const values = ['text', '123', 'test@email', '2024']
      const result = suggestFieldTypeFromValues(values)
      
      expect(result.type.base).toBe('text')
      expect(result.confidence).toBeLessThan(0.7)
    })
  })

  describe('getDetectionRules', () => {
    it('should return all detection rules', () => {
      const rules = getDetectionRules()
      
      expect(rules.length).toBeGreaterThan(20)
      expect(rules.some(r => r.description?.toLowerCase().includes('email'))).toBe(true)
      expect(rules.some(r => r.description?.toLowerCase().includes('legal'))).toBe(true)
      expect(rules.some(r => r.description?.toLowerCase().includes('japanese'))).toBe(true)
    })

    it('should be sorted by priority', () => {
      const rules = getDetectionRules()
      
      // Check that high priority legal rules come first
      const legalRuleIndex = rules.findIndex(r => r.priority === 100)
      const commonRuleIndex = rules.findIndex(r => r.priority === 70)
      
      expect(legalRuleIndex).toBeLessThan(commonRuleIndex)
    })
  })

  describe('performance', () => {
    it('should detect field types quickly', () => {
      const fields = Array.from({ length: 1000 }, (_, i) => `field_${i}_email`)
      
      const start = performance.now()
      fields.forEach(field => detectFieldType(field))
      const duration = performance.now() - start
      
      expect(duration).toBeLessThan(50) // 50ms for 1000 fields
    })

    it('should handle complex patterns efficiently', () => {
      const complexField = 'very.deeply.nested.field.with.many.parts.that.contains.email.somewhere'
      
      const start = performance.now()
      const result = detectFieldType(complexField)
      const duration = performance.now() - start
      
      expect(duration).toBeLessThan(1) // Less than 1ms per field
      expect(result.variant).toBe('email')
    })
  })
})