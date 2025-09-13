/**
 * Property Management Composable
 * プロパティ管理機能のための共通ロジック
 */

import type { PropertyDefinitionDto } from '../types'

export const usePropertyManagement = () => {
  const { t } = useI18n()
  
  // Property type definitions with metadata
  const propertyTypeMap = {
    TEXT: { 
      icon: 'lucide:type', 
      label: 'テキスト',
      category: 'basic',
      defaultConfig: {}
    },
    LONG_TEXT: { 
      icon: 'lucide:align-left', 
      label: 'テキストエリア',
      category: 'advanced',
      defaultConfig: { rows: 3 }
    },
    NUMBER: { 
      icon: 'lucide:hash', 
      label: '数値',
      category: 'basic',
      defaultConfig: {}
    },
    DATE: { 
      icon: 'lucide:calendar', 
      label: '日付',
      category: 'basic',
      defaultConfig: {}
    },
    DATETIME: { 
      icon: 'lucide:calendar-clock', 
      label: '日時',
      category: 'advanced',
      defaultConfig: {}
    },
    CHECKBOX: { 
      icon: 'lucide:check-square', 
      label: 'チェックボックス',
      category: 'basic',
      defaultConfig: {}
    },
    SELECT: { 
      icon: 'lucide:chevron-down-circle', 
      label: '選択',
      category: 'basic',
      defaultConfig: { options: [] }
    },
    MULTI_SELECT: { 
      icon: 'lucide:list-checks', 
      label: '複数選択',
      category: 'advanced',
      defaultConfig: { options: [] }
    },
    EMAIL: { 
      icon: 'lucide:mail', 
      label: 'メール',
      category: 'advanced',
      defaultConfig: {}
    },
    URL: { 
      icon: 'lucide:link', 
      label: 'URL',
      category: 'advanced',
      defaultConfig: {}
    },
    FILE: { 
      icon: 'lucide:paperclip', 
      label: 'ファイル',
      category: 'advanced',
      defaultConfig: { maxSize: 10485760 } // 10MB
    }
  }

  /**
   * Get property type metadata
   */
  const getPropertyType = (type: string) => {
    return propertyTypeMap[type as keyof typeof propertyTypeMap] || {
      icon: 'lucide:help-circle',
      label: type,
      category: 'unknown',
      defaultConfig: {}
    }
  }

  /**
   * Get icon for property type
   */
  const getPropertyIcon = (type?: string) => {
    if (!type) return 'lucide:help-circle'
    return getPropertyType(type).icon
  }

  /**
   * Get label for property type
   */
  const getPropertyLabel = (type?: string) => {
    if (!type) return t('modules.table.property.types.unknown')
    return getPropertyType(type).label
  }

  /**
   * Validate property key format
   */
  const validatePropertyKey = (key: string): string | null => {
    if (!key) {
      return t('modules.table.property.errors.keyRequired')
    }
    if (!/^[a-z][a-z0-9_]*$/.test(key)) {
      return t('modules.table.property.errors.keyInvalid')
    }
    return null
  }

  /**
   * Generate unique property key
   */
  const generatePropertyKey = (displayName: string, existingKeys: string[]): string => {
    // Convert to snake_case
    const key = displayName
      .toLowerCase()
      .replace(/[^\w\s]/g, '') // Remove special chars
      .replace(/\s+/g, '_')     // Replace spaces with underscores
      .replace(/^[^a-z]/, 'p_') // Ensure starts with letter
    
    // Ensure uniqueness
    let finalKey = key
    let counter = 1
    while (existingKeys.includes(finalKey)) {
      finalKey = `${key}_${counter}`
      counter++
    }
    
    return finalKey
  }

  /**
   * Sort properties by display order
   */
  const sortProperties = (
    properties: Record<string, PropertyDefinitionDto>,
    orderedKeys?: string[]
  ): string[] => {
    const allKeys = Object.keys(properties)
    
    if (!orderedKeys || orderedKeys.length === 0) {
      // Default sort: required first, then alphabetical
      return allKeys.sort((a, b) => {
        const propA = properties[a]
        const propB = properties[b]
        
        // Required properties first
        if (propA?.required && !propB?.required) return -1
        if (!propA?.required && propB?.required) return 1
        
        // Then alphabetical by display name
        return (propA?.displayName || a).localeCompare(propB?.displayName || b)
      })
    }
    
    // Use provided order, adding any missing keys at the end
    const result = [...orderedKeys]
    for (const key of allKeys) {
      if (!result.includes(key)) {
        result.push(key)
      }
    }
    
    return result
  }

  /**
   * Get default value for property type
   */
  const getDefaultValue = (type: string): unknown => {
    switch (type) {
      case 'text':
      case 'long_text':
      case 'email':
      case 'url':
        return ''
      case 'number':
        return 0
      case 'checkbox':
        return false
      case 'date':
      case 'datetime':
        return null
      case 'SELECT':
        return null
      case 'MULTI_SELECT':
        return []
      case 'FILE':
        return null
      default:
        return null
    }
  }

  /**
   * Validate property value against its definition
   */
  const validatePropertyValue = (
    value: unknown,
    property: PropertyDefinitionDto
  ): string | null => {
    // Check required
    if (property.required) {
      if (value === null || value === undefined || value === '') {
        return t('modules.table.property.errors.valueRequired')
      }
      if (Array.isArray(value) && value.length === 0) {
        return t('modules.table.property.errors.valueRequired')
      }
    }

    // Type-specific validation
    switch (property.type) {
      case 'email':
        if (value && typeof value === 'string' && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
          return t('modules.table.property.errors.invalidEmail')
        }
        break
      
      case 'url':
        if (value && typeof value === 'string') {
          try {
            new URL(value)
          } catch {
            return t('modules.table.property.errors.invalidUrl')
          }
        }
        break
      
      case 'number':
        if (value !== null && value !== undefined) {
          const num = Number(value)
          if (isNaN(num)) {
            return t('modules.table.property.errors.invalidNumber')
          }
          const min = property.config?.min as number | undefined
          const max = property.config?.max as number | undefined
          if (min !== undefined && num < min) {
            return t('modules.table.property.errors.numberTooSmall', { min })
          }
          if (max !== undefined && num > max) {
            return t('modules.table.property.errors.numberTooLarge', { max })
          }
        }
        break
      
      case 'text':
        if (value) {
          try {
            if (typeof value === 'string') {
              JSON.parse(value)
            }
          } catch {
            return t('modules.table.property.errors.invalidJson')
          }
        }
        break
      
      default:
        // No specific validation for other types
        break
    }

    return null
  }

  return {
    propertyTypeMap,
    getPropertyType,
    getPropertyIcon,
    getPropertyLabel,
    validatePropertyKey,
    generatePropertyKey,
    sortProperties,
    getDefaultValue,
    validatePropertyValue
  }
}