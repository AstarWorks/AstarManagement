/**
 * Template Variable Parser Composable
 * Extracts and processes variables from document templates
 */

import { ref, computed } from 'vue'
import type { 
  ParsedTemplateVariable, 
  TemplateParseOptions, 
  TemplateMetadata,
  FieldMetadata,
  ValidationRule 
} from './types'
import { useFieldTypeDetection } from './useFieldTypeDetection'

/**
 * Composable for parsing template variables
 */
export function useTemplateVariables() {
  const { detectFieldType } = useFieldTypeDetection()
  
  /**
   * Parse template content to extract variables
   */
  const parseTemplate = (
    templateContent: string, 
    options: TemplateParseOptions = {}
  ): ParsedTemplateVariable[] => {
    const {
      delimiters = ['{{', '}}'],
      includeMetadata = true,
      deduplicate = true
    } = options
    
    // First, extract metadata if requested
    const metadata = includeMetadata ? extractMetadata(templateContent) : undefined
    
    // Create regex pattern for variable extraction
    const [startDelim, endDelim] = delimiters.map(d => escapeRegex(d))
    const variableRegex = new RegExp(`${startDelim}\\s*([^}]+?)\\s*${endDelim}`, 'g')
    
    const variables: ParsedTemplateVariable[] = []
    const seen = new Set<string>()
    let match: RegExpExecArray | null
    
    while ((match = variableRegex.exec(templateContent)) !== null) {
      const variableName = match[1].trim()
      
      // Skip if deduplicate is on and we've seen this variable
      if (deduplicate && seen.has(variableName)) {
        continue
      }
      seen.add(variableName)
      
      // Create template variable with metadata if available
      const variable = createTemplateVariable(variableName, metadata)
      
      // Apply any metadata overrides
      if (metadata?.fields[variableName]) {
        const fieldMeta = metadata.fields[variableName]
        if (fieldMeta.type) {
          const explicitType = parseExplicitType(fieldMeta.type)
          // Merge with existing type
          variable.type = { ...variable.type, ...explicitType }
        }
        if (fieldMeta.required !== undefined) {
          variable.required = fieldMeta.required
        }
        // Add metadata to variable
        variable.metadata = fieldMeta
      }
      
      variables.push(variable)
    }
    
    // Handle array fields
    return processArrayFields(variables)
  }
  
  /**
   * Create a template variable from a variable name
   */
  const createTemplateVariable = (
    name: string, 
    metadata?: TemplateMetadata
  ): ParsedTemplateVariable => {
    // Parse the variable path
    const { path, isArray, arrayIndex } = parseVariablePath(name)
    const fieldKey = path.join('.')
    
    // Get metadata for this field if available
    const fieldMetadata = metadata?.fields[fieldKey]
    
    // Detect field type
    const type = fieldMetadata?.type 
      ? parseExplicitType(fieldMetadata.type)
      : detectFieldType(name)
    
    // Generate label and placeholder
    const label = fieldMetadata?.label || generateLabel(name)
    const placeholder = fieldMetadata?.placeholder || generatePlaceholder(name, type)
    
    // Extract validation rules
    const validation = extractValidation(name, fieldMetadata)
    
    return {
      name,
      path,
      type,
      label,
      placeholder,
      required: fieldMetadata?.required ?? isRequiredField(name),
      defaultValue: fieldMetadata?.defaultValue,
      validation,
      metadata: fieldMetadata as any,
      isArray,
      arrayIndex
    }
  }
  
  /**
   * Parse a variable path to extract nested structure
   */
  const parseVariablePath = (name: string): {
    path: string[]
    isArray: boolean
    arrayIndex?: number
  } => {
    // Handle array notation (e.g., witnesses[0].name or items[].description)
    const arrayMatch = name.match(/^(.+?)\[(\d*)\](.*)$/)
    
    if (arrayMatch) {
      const [, prefix, index, suffix] = arrayMatch
      const basePath = prefix.split('.')
      const suffixPath = suffix ? suffix.split('.').filter(Boolean) : []
      
      // If there's a suffix after the array notation, include it in the path
      const finalPath = suffix && suffix.startsWith('.') 
        ? [...basePath, ...suffix.substring(1).split('.')]
        : basePath
      
      return {
        path: finalPath,
        isArray: true,
        arrayIndex: index ? parseInt(index, 10) : undefined
      }
    }
    
    // Regular dot notation
    return {
      path: name.split('.'),
      isArray: false
    }
  }
  
  /**
   * Extract metadata from template comments
   */
  const extractMetadata = (templateContent: string): TemplateMetadata => {
    const metadata: TemplateMetadata = { fields: {} }
    
    // Look for metadata comments in various formats
    // Format 1: <!-- @field:client.name type="email" required="true" -->
    const fieldMetaRegex = /<!--\s*@field:(\S+)\s+(.+?)\s*-->/g
    let match: RegExpExecArray | null
    
    while ((match = fieldMetaRegex.exec(templateContent)) !== null) {
      const [, fieldName, attributes] = match
      metadata.fields[fieldName] = parseAttributes(attributes)
    }
    
    // Format 2: /* @var client.email {email} required */
    const varMetaRegex = /\/\*\s*@var\s+(\S+)\s+\{(\w+)\}(\s+\w+)*\s*\*\//g
    
    while ((match = varMetaRegex.exec(templateContent)) !== null) {
      const [, fieldName, type, modifiers] = match
      metadata.fields[fieldName] = {
        type,
        required: modifiers?.includes('required')
      }
    }
    
    return metadata
  }
  
  /**
   * Parse HTML-style attributes
   */
  const parseAttributes = (attributeString: string): FieldMetadata => {
    const metadata: FieldMetadata = {}
    const attrRegex = /(\w+)(?:="([^"]*)")?/g
    let match: RegExpExecArray | null
    
    while ((match = attrRegex.exec(attributeString)) !== null) {
      const [, key, value] = match
      
      switch (key) {
        case 'type':
          metadata.type = value
          break
        case 'label':
          metadata.label = value
          break
        case 'placeholder':
          metadata.placeholder = value
          break
        case 'required':
          metadata.required = value !== 'false'
          break
        case 'default':
          metadata.defaultValue = value
          break
        case 'help':
          metadata.helpText = value
          break
        default:
          // Store other attributes as validation rules
          if (!metadata.validation) metadata.validation = []
          metadata.validation.push({
            type: key as any,
            value,
            message: `Invalid ${key}`
          })
      }
    }
    
    return metadata
  }
  
  /**
   * Generate a user-friendly label from a field name
   */
  const generateLabel = (fieldName: string): string => {
    // Extract the last part of the path
    const parts = fieldName.split('.')
    const lastPart = parts[parts.length - 1] || fieldName
    
    // Remove array notation
    const cleanName = lastPart.replace(/\[\d*\]/, '')
    
    // Convert various naming conventions to readable text
    return cleanName
      .replace(/([A-Z])/g, ' $1') // camelCase to spaces
      .replace(/[_-]/g, ' ') // underscores and hyphens to spaces
      .replace(/\b\w/g, l => l.toUpperCase()) // capitalize words
      .replace(/\s+/g, ' ') // normalize spaces
      .trim()
  }
  
  /**
   * Generate appropriate placeholder text
   */
  const generatePlaceholder = (fieldName: string, type: any): string => {
    const label = generateLabel(fieldName).toLowerCase()
    
    // Type-specific placeholders
    switch (type.variant || type.base) {
      case 'email':
        return 'example@domain.com'
      case 'phone':
        return '03-1234-5678'
      case 'date':
        return 'YYYY-MM-DD'
      case 'time':
        return 'HH:MM'
      case 'url':
        return 'https://example.com'
      case 'currency':
        return '¥0.00'
      case 'percentage':
        return '0%'
      case 'textarea':
        return `Enter ${label}...`
      case 'select':
        return label.toLowerCase().includes('court') ? `Select ${label.toLowerCase()}` : `Select ${label.toLowerCase()}`
      case 'file':
        return `Choose ${label}`
      case 'case-number':
        return '2024-CV-12345'
      case 'court-list':
        return 'Select court name'
      default:
        return `Enter ${label}`
    }
  }
  
  /**
   * Determine if a field should be required based on naming
   */
  const isRequiredField = (fieldName: string): boolean => {
    const requiredPatterns = [
      /^(client|party|plaintiff|defendant)\.name/i,
      /^matter\.(title|number|id)/i,
      /^case\.(number|id)/i,
      /email$/i,
      /phone$/i,
      /date$/i
    ]
    
    return requiredPatterns.some(pattern => pattern.test(fieldName))
  }
  
  /**
   * Extract validation rules from field name and metadata
   */
  const extractValidation = (
    fieldName: string, 
    metadata?: FieldMetadata
  ): ValidationRule[] => {
    const rules: ValidationRule[] = []
    
    // Add required rule
    if (metadata?.required || isRequiredField(fieldName)) {
      rules.push({
        type: 'required',
        message: `${generateLabel(fieldName)} is required`
      })
    }
    
    // Add metadata validation rules
    if (metadata?.validation) {
      rules.push(...metadata.validation)
    }
    
    // Add type-based validation
    const fieldType = detectFieldType(fieldName)
    
    switch (fieldType.variant || fieldType.base) {
      case 'email':
        rules.push({
          type: 'pattern',
          value: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
          message: 'Please enter a valid email address'
        })
        break
        
      case 'phone':
        rules.push({
          type: 'pattern',
          value: /^[\d\s\-\(\)\+]+$/,
          message: 'Please enter a valid phone number'
        })
        break
        
      case 'url':
        rules.push({
          type: 'pattern',
          value: /^https?:\/\/.+/,
          message: 'Please enter a valid URL'
        })
        break
    }
    
    return rules
  }
  
  /**
   * Parse explicit type from metadata
   */
  const parseExplicitType = (typeString: string): any => {
    // Handle simple type strings like 'email', 'phone', etc.
    if (!typeString.includes(':')) {
      // Map common types to their correct structure
      switch (typeString) {
        case 'email':
        case 'phone':
        case 'url':
          return { base: 'text', variant: typeString }
        case 'date':
        case 'number':
        case 'checkbox':
        case 'select':
          return { base: typeString }
        default:
          return { base: 'text', variant: typeString }
      }
    }
    
    // Handle complex type strings like 'text:email'
    const [base, variant] = typeString.split(':')
    return {
      base: base as any,
      variant
    }
  }
  
  /**
   * Process array fields to group them properly
   */
  const processArrayFields = (variables: ParsedTemplateVariable[]): ParsedTemplateVariable[] => {
    const processed: ParsedTemplateVariable[] = []
    const arrayGroups = new Map<string, ParsedTemplateVariable[]>()
    
    for (const variable of variables) {
      if (variable.isArray) {
        const groupKey = variable.path[0]
        if (!arrayGroups.has(groupKey)) {
          arrayGroups.set(groupKey, [])
        }
        arrayGroups.get(groupKey)!.push(variable)
      } else {
        processed.push(variable)
      }
    }
    
    // Add array groups
    for (const [groupKey, groupVars] of arrayGroups) {
      // Add individual array items first (to maintain original order)
      processed.push(...groupVars)
      
      // Add a parent array variable if there are multiple items
      if (groupVars.length > 1 || groupVars.some(v => v.arrayIndex === undefined)) {
        const arrayVar: ParsedTemplateVariable = {
          name: groupKey,
          path: [groupKey],
          type: { base: 'custom', variant: 'array' },
          label: generateLabel(groupKey),
          isArray: true,
          metadata: {
            childVariables: groupVars
          }
        }
        processed.push(arrayVar)
      }
    }
    
    return processed
  }
  
  /**
   * Escape regex special characters
   */
  const escapeRegex = (str: string): string => {
    return str.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  }
  
  /**
   * Deduplicate variables by name
   */
  const deduplicateVariables = (variables: ParsedTemplateVariable[]): ParsedTemplateVariable[] => {
    const seen = new Map<string, ParsedTemplateVariable>()
    
    for (const variable of variables) {
      if (!seen.has(variable.name)) {
        seen.set(variable.name, variable)
      }
    }
    
    return Array.from(seen.values())
  }
  
  return {
    parseTemplate,
    createTemplateVariable,
    generateLabel,
    generatePlaceholder,
    isRequiredField,
    deduplicateVariables
  }
}