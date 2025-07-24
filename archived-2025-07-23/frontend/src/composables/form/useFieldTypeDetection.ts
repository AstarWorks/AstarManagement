/**
 * Field Type Detection Composable
 * Automatically detects appropriate form field types based on field names and patterns
 */

import { ref, computed } from 'vue'
import type { 
  FieldType, 
  FieldTypeDetectionResult,
  LegalFieldType 
} from './types'
import { 
  LEGAL_FIELD_PATTERNS, 
  COMMON_FIELD_PATTERNS 
} from './types'

/**
 * Detection rule with priority
 */
interface DetectionRule {
  pattern: RegExp
  type: FieldType
  priority: number
  confidence: number
  description?: string
}

/**
 * Composable for detecting field types from field names
 */
export function useFieldTypeDetection() {
  /**
   * Detection rules organized by priority
   */
  const detectionRules = ref<DetectionRule[]>([
    // Legal-specific rules (highest priority)
    {
      pattern: LEGAL_FIELD_PATTERNS['case-number'],
      type: { base: 'text', variant: 'case-number' },
      priority: 100,
      confidence: 0.95,
      description: 'Legal case number'
    },
    {
      pattern: LEGAL_FIELD_PATTERNS['court-name'],
      type: { base: 'select', variant: 'court-list' },
      priority: 100,
      confidence: 0.9,
      description: 'Court selection'
    },
    {
      pattern: LEGAL_FIELD_PATTERNS['judge-name'],
      type: { base: 'text', variant: 'person-name' },
      priority: 95,
      confidence: 0.9,
      description: 'Judge name'
    },
    {
      pattern: LEGAL_FIELD_PATTERNS['attorney-name'],
      type: { base: 'text', variant: 'person-name' },
      priority: 95,
      confidence: 0.9,
      description: 'Attorney name'
    },
    {
      pattern: LEGAL_FIELD_PATTERNS['party-name'],
      type: { base: 'text', variant: 'person-name' },
      priority: 95,
      confidence: 0.9,
      description: 'Party name'
    },
    {
      pattern: LEGAL_FIELD_PATTERNS['jurisdiction'],
      type: { base: 'select', variant: 'jurisdiction' },
      priority: 90,
      confidence: 0.85,
      description: 'Legal jurisdiction'
    },
    {
      pattern: LEGAL_FIELD_PATTERNS['filing-date'],
      type: { base: 'date', format: 'yyyy-mm-dd' },
      priority: 90,
      confidence: 0.95,
      description: 'Filing date'
    },
    {
      pattern: LEGAL_FIELD_PATTERNS['hearing-date'],
      type: { base: 'date', format: 'yyyy-mm-dd' },
      priority: 90,
      confidence: 0.95,
      description: 'Hearing date'
    },
    {
      pattern: LEGAL_FIELD_PATTERNS['statute-citation'],
      type: { base: 'text', variant: 'citation' },
      priority: 85,
      confidence: 0.8,
      description: 'Legal citation'
    },
    {
      pattern: LEGAL_FIELD_PATTERNS['legal-amount'],
      type: { base: 'number', variant: 'currency', format: 'jpy' },
      priority: 85,
      confidence: 0.9,
      description: 'Monetary amount'
    },
    
    // Common field patterns (medium priority)
    {
      pattern: COMMON_FIELD_PATTERNS.email,
      type: { base: 'text', variant: 'email' },
      priority: 80,
      confidence: 0.95,
      description: 'Email address'
    },
    {
      pattern: COMMON_FIELD_PATTERNS.phone,
      type: { base: 'text', variant: 'phone' },
      priority: 80,
      confidence: 0.9,
      description: 'Phone number'
    },
    {
      pattern: COMMON_FIELD_PATTERNS.url,
      type: { base: 'text', variant: 'url' },
      priority: 75,
      confidence: 0.85,
      description: 'URL/Link'
    },
    {
      pattern: COMMON_FIELD_PATTERNS.currency,
      type: { base: 'number', variant: 'currency', format: 'jpy' },
      priority: 75,
      confidence: 0.9,
      description: 'Currency amount'
    },
    {
      pattern: COMMON_FIELD_PATTERNS.percentage,
      type: { base: 'number', variant: 'percentage', format: '0.00%' },
      priority: 75,
      confidence: 0.85,
      description: 'Percentage'
    },
    {
      pattern: COMMON_FIELD_PATTERNS.date,
      type: { base: 'date', format: 'yyyy-mm-dd' },
      priority: 70,
      confidence: 0.9,
      description: 'Date field'
    },
    {
      pattern: COMMON_FIELD_PATTERNS.time,
      type: { base: 'text', variant: 'time', format: 'HH:mm' },
      priority: 70,
      confidence: 0.85,
      description: 'Time field'
    },
    {
      pattern: COMMON_FIELD_PATTERNS.number,
      type: { base: 'number', format: 'decimal' },
      priority: 65,
      confidence: 0.8,
      description: 'Numeric field'
    },
    {
      pattern: COMMON_FIELD_PATTERNS.textarea,
      type: { base: 'text', variant: 'textarea' },
      priority: 60,
      confidence: 0.85,
      description: 'Long text field'
    },
    {
      pattern: COMMON_FIELD_PATTERNS.select,
      type: { base: 'select' },
      priority: 55,
      confidence: 0.75,
      description: 'Selection field'
    },
    {
      pattern: COMMON_FIELD_PATTERNS.checkbox,
      type: { base: 'checkbox' },
      priority: 55,
      confidence: 0.8,
      description: 'Checkbox field'
    },
    {
      pattern: COMMON_FIELD_PATTERNS.file,
      type: { base: 'custom', variant: 'file' },
      priority: 60,
      confidence: 0.85,
      description: 'File upload'
    },
    {
      pattern: COMMON_FIELD_PATTERNS.address,
      type: { base: 'text', variant: 'address' },
      priority: 50,
      confidence: 0.8,
      description: 'Address field'
    },
    {
      pattern: COMMON_FIELD_PATTERNS.name,
      type: { base: 'text', variant: 'person-name' },
      priority: 50,
      confidence: 0.75,
      description: 'Person name'
    }
  ])
  
  /**
   * Japanese-specific field patterns
   */
  const japaneseFieldPatterns = ref<DetectionRule[]>([
    {
      pattern: /郵便番号|〒|ゆうびん/,
      type: { base: 'text', variant: 'postal-code', format: 'jp' },
      priority: 85,
      confidence: 0.95,
      description: 'Japanese postal code'
    },
    {
      pattern: /都道府県|とどうふけん/,
      type: { base: 'select', variant: 'prefecture' },
      priority: 85,
      confidence: 0.95,
      description: 'Japanese prefecture'
    },
    {
      pattern: /氏名|しめい|姓名|せいめい/,
      type: { base: 'text', variant: 'person-name', format: 'jp' },
      priority: 80,
      confidence: 0.9,
      description: 'Japanese name'
    },
    {
      pattern: /電話|でんわ|携帯|けいたい/,
      type: { base: 'text', variant: 'phone', format: 'jp' },
      priority: 80,
      confidence: 0.9,
      description: 'Japanese phone number'
    },
    {
      pattern: /住所|じゅうしょ|所在地/,
      type: { base: 'text', variant: 'address', format: 'jp' },
      priority: 75,
      confidence: 0.85,
      description: 'Japanese address'
    }
  ])
  
  /**
   * Detect field type from field name
   */
  const detectFieldType = (
    fieldName: string,
    customRules?: Record<string, RegExp>
  ): FieldType => {
    const result = detectFieldTypeWithConfidence(fieldName, customRules)
    return result.type
  }
  
  /**
   * Detect field type with confidence score
   */
  const detectFieldTypeWithConfidence = (
    fieldName: string,
    customRules?: Record<string, RegExp>
  ): FieldTypeDetectionResult => {
    const normalizedName = fieldName.toLowerCase()
    let bestMatch: FieldTypeDetectionResult | null = null
    
    // Check custom rules first
    if (customRules) {
      for (const [typeName, pattern] of Object.entries(customRules)) {
        if (pattern.test(normalizedName)) {
          return {
            type: parseCustomType(typeName),
            confidence: 1.0,
            reason: 'Custom rule match'
          }
        }
      }
    }
    
    // Check all detection rules
    const allRules = [...detectionRules.value, ...japaneseFieldPatterns.value]
    
    // Sort by priority to check higher priority rules first
    const sortedRules = allRules.sort((a, b) => b.priority - a.priority)
    
    for (const rule of sortedRules) {
      if (rule.pattern.test(normalizedName)) {
        const confidence = calculateConfidence(fieldName, rule)
        
        if (!bestMatch || confidence > bestMatch.confidence) {
          bestMatch = {
            type: rule.type,
            confidence,
            reason: rule.description
          }
        }
      }
    }
    
    // If no match found, return default text field
    if (!bestMatch) {
      bestMatch = {
        type: { base: 'text' },
        confidence: 0.5,
        reason: 'Default text field'
      }
    }
    
    // Apply field name modifiers
    bestMatch.type = applyFieldModifiers(fieldName, bestMatch.type)
    
    return bestMatch
  }
  
  /**
   * Calculate confidence based on match quality
   */
  const calculateConfidence = (fieldName: string, rule: DetectionRule): number => {
    const normalizedName = fieldName.toLowerCase()
    let confidence = rule.confidence
    
    // Boost confidence for exact matches
    const fieldParts = normalizedName.split(/[._\-\s]/)
    const patternString = rule.pattern.source.toLowerCase()
    
    // Check if the entire field name matches the pattern
    if (rule.pattern.test(fieldName)) {
      confidence += 0.05
    }
    
    // Additional boost for exact word matches
    if (fieldParts.length === 1 && rule.pattern.test(normalizedName)) {
      confidence += 0.05
    }
    
    // Reduce confidence for very long field names
    if (fieldName.length > 50) {
      confidence *= 0.9
    } else if (fieldName.length <= 10 && rule.pattern.test(normalizedName)) {
      // Boost confidence for short exact matches
      confidence += 0.05
    }
    
    // Reduce confidence for deeply nested fields
    const nestingLevel = (fieldName.match(/\./g) || []).length
    if (nestingLevel > 3) {
      confidence *= 0.95
    }
    
    return Math.min(confidence, 1.0)
  }
  
  /**
   * Apply field name modifiers to detected type
   */
  const applyFieldModifiers = (fieldName: string, type: FieldType): FieldType => {
    const modifiedType = { ...type }
    
    // Check for array indicators
    if (/list|array|items|entries/i.test(fieldName)) {
      modifiedType.options = { ...modifiedType.options, multiple: true }
    }
    
    // Check for optional indicators
    if (/optional|maybe|nullable/i.test(fieldName)) {
      modifiedType.options = { ...modifiedType.options, optional: true }
    }
    
    // Check for size modifiers
    if (/short|brief|small/i.test(fieldName) && modifiedType.variant === 'textarea') {
      modifiedType.options = { ...modifiedType.options, rows: 3 }
    } else if (/long|detailed|full/i.test(fieldName) && modifiedType.base === 'text') {
      modifiedType.variant = 'textarea'
      modifiedType.options = { ...modifiedType.options, rows: 8 }
    }
    
    // Check for format hints
    if (/international|intl/i.test(fieldName)) {
      if (modifiedType.variant === 'phone') {
        modifiedType.format = 'international'
      } else if (modifiedType.variant === 'currency') {
        modifiedType.options = { ...modifiedType.options, international: true }
      }
    }
    
    return modifiedType
  }
  
  /**
   * Parse custom type string
   */
  const parseCustomType = (typeString: string): FieldType => {
    const [base, ...parts] = typeString.split(':')
    const variant = parts[0]
    const format = parts[1]
    
    return {
      base: base as any,
      variant,
      format
    }
  }
  
  /**
   * Add custom detection rule
   */
  const addDetectionRule = (rule: DetectionRule): void => {
    detectionRules.value.push(rule)
    // Re-sort by priority
    detectionRules.value.sort((a, b) => b.priority - a.priority)
  }
  
  /**
   * Remove detection rule by pattern
   */
  const removeDetectionRule = (pattern: RegExp): void => {
    detectionRules.value = detectionRules.value.filter(
      rule => rule.pattern.source !== pattern.source
    )
  }
  
  /**
   * Get all detection rules
   */
  const getDetectionRules = (): DetectionRule[] => {
    return [...detectionRules.value, ...japaneseFieldPatterns.value]
  }
  
  /**
   * Suggest field type based on sample values
   */
  const suggestFieldTypeFromValues = (values: string[]): FieldTypeDetectionResult => {
    // Handle empty array
    if (!values || values.length === 0) {
      return { type: { base: 'text' }, confidence: 0.5 }
    }
    
    // Analyze sample values to suggest field type
    const analysis = {
      allEmails: values.length > 0 && values.every(v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)),
      allDates: values.length > 0 && values.every(v => /^\d{4}-\d{2}-\d{2}$/.test(v)),
      allPhones: values.length > 0 && values.every(v => /^[\d\s\-\(\)\+]+$/.test(v) && v.length >= 10 && v.length <= 20),
      allNumbers: values.length > 0 && values.every(v => /^\d+(\.\d+)?$/.test(v)),
      allUrls: values.length > 0 && values.every(v => /^https?:\/\/.+/.test(v)),
      averageLength: values.length > 0 ? values.reduce((sum, v) => sum + v.length, 0) / values.length : 0
    }
    
    if (analysis.allEmails) {
      return { type: { base: 'text', variant: 'email' }, confidence: 0.95 }
    }
    if (analysis.allDates) {
      return { type: { base: 'date', format: 'yyyy-mm-dd' }, confidence: 0.95 }
    }
    if (analysis.allUrls) {
      return { type: { base: 'text', variant: 'url' }, confidence: 0.9 }
    }
    if (analysis.allPhones) {
      return { type: { base: 'text', variant: 'phone' }, confidence: 0.9 }
    }
    if (analysis.allNumbers) {
      return { type: { base: 'number' }, confidence: 0.85 }
    }
    if (analysis.averageLength > 100) {
      return { type: { base: 'text', variant: 'textarea' }, confidence: 0.8 }
    }
    
    return { type: { base: 'text' }, confidence: 0.6 }
  }
  
  return {
    detectFieldType,
    detectFieldTypeWithConfidence,
    addDetectionRule,
    removeDetectionRule,
    getDetectionRules,
    suggestFieldTypeFromValues,
    typeDetectionRules: computed(() => detectionRules.value)
  }
}