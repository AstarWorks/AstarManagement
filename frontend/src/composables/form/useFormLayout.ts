/**
 * Form Layout Composable
 * Handles form layout calculations and field grouping
 */

import { computed } from 'vue'
import type { ParsedTemplateVariable } from './types'
import type { FieldGroup, FormLayout } from '~/components/dynamic-form/types'

export function useFormLayout() {
  /**
   * Group fields by section for better organization
   */
  const groupFieldsBySection = (
    variables: ParsedTemplateVariable[],
    layout?: FormLayout
  ): FieldGroup[] => {
    const groups = new Map<string, ParsedTemplateVariable[]>()
    
    // Group variables by their first path segment
    variables.forEach(variable => {
      const section = variable.path[0] || 'general'
      
      if (!groups.has(section)) {
        groups.set(section, [])
      }
      
      groups.get(section)!.push(variable)
    })
    
    // Convert to FieldGroup objects
    return Array.from(groups.entries()).map(([section, fields]) => {
      const columns = calculateColumnsForSection(section, fields, layout)
      
      return {
        id: `group-${section}`,
        section,
        title: formatSectionTitle(section),
        description: getSectionDescription(section),
        fields: sortFieldsInSection(fields),
        columns,
        collapsible: shouldSectionBeCollapsible(section, fields.length),
        collapsed: shouldSectionStartCollapsed(section)
      }
    }).sort(compareSectionPriority)
  }
  
  /**
   * Calculate optimal column count for a section
   */
  const calculateColumnsForSection = (
    section: string,
    fields: ParsedTemplateVariable[],
    layout?: FormLayout
  ): number => {
    // Manual layout override
    if (layout?.type === 'manual' && layout.columns) {
      return layout.columns
    }
    
    // Single column layout
    if (layout?.type === 'single-column') {
      return 1
    }
    
    // Grid layout with specific columns
    if (layout?.type === 'grid' && layout.columns) {
      return Math.min(layout.columns, layout.maxColumns || 4)
    }
    
    // Auto layout based on section type and field count
    return calculateAutoColumns(section, fields)
  }
  
  /**
   * Auto-calculate columns based on heuristics
   */
  const calculateAutoColumns = (
    section: string,
    fields: ParsedTemplateVariable[]
  ): number => {
    const fieldCount = fields.length
    
    // Section-based column preferences
    const sectionColumnPrefs: Record<string, number> = {
      client: 2,
      matter: 2,
      case: 2,
      address: 1, // Address fields often need full width
      description: 1, // Text areas need full width
      notes: 1,
      comments: 1,
      contact: 2,
      financial: 2,
      dates: 2,
      general: 2
    }
    
    let preferredColumns = sectionColumnPrefs[section] || 2
    
    // Adjust based on field types
    const hasLargeFields = fields.some(field => 
      field.type.variant === 'textarea' ||
      field.type.base === 'custom' ||
      field.name.includes('description') ||
      field.name.includes('notes')
    )
    
    if (hasLargeFields) {
      preferredColumns = 1
    }
    
    // Adjust based on field count
    if (fieldCount === 1) {
      return 1
    } else if (fieldCount === 2) {
      return Math.min(2, preferredColumns)
    } else if (fieldCount <= 4) {
      return Math.min(2, preferredColumns)
    } else if (fieldCount <= 8) {
      return Math.min(3, preferredColumns)
    } else {
      return Math.min(4, preferredColumns)
    }
  }
  
  /**
   * Sort fields within a section for optimal layout
   */
  const sortFieldsInSection = (fields: ParsedTemplateVariable[]): ParsedTemplateVariable[] => {
    return fields.sort((a, b) => {
      // Required fields first
      if (a.required && !b.required) return -1
      if (!a.required && b.required) return 1
      
      // Then by field type priority
      const typePriority = getFieldTypePriority(a.type) - getFieldTypePriority(b.type)
      if (typePriority !== 0) return typePriority
      
      // Finally alphabetical by label
      return a.label.localeCompare(b.label)
    })
  }
  
  /**
   * Get priority for field type ordering
   */
  const getFieldTypePriority = (fieldType: any): number => {
    const priorities: Record<string, number> = {
      text: 1,
      email: 2,
      phone: 3,
      number: 4,
      date: 5,
      select: 6,
      checkbox: 7,
      textarea: 8,
      custom: 9
    }
    
    return priorities[fieldType.base] || 10
  }
  
  /**
   * Format section title for display
   */
  const formatSectionTitle = (section: string): string => {
    const titleMappings: Record<string, string> = {
      client: 'Client Information',
      matter: 'Matter Details',
      case: 'Case Information',
      address: 'Address Information',
      contact: 'Contact Details',
      financial: 'Financial Information',
      dates: 'Important Dates',
      notes: 'Notes & Comments',
      general: 'General Information'
    }
    
    return titleMappings[section] || 
           section.charAt(0).toUpperCase() + 
           section.slice(1).replace(/([A-Z])/g, ' $1').trim()
  }
  
  /**
   * Get description for section
   */
  const getSectionDescription = (section: string): string | undefined => {
    const descriptions: Record<string, string> = {
      client: 'Basic client contact and identification information',
      matter: 'Case matter details and classification',
      case: 'Legal case specifics and court information',
      address: 'Physical addresses and location details',
      contact: 'Phone numbers, emails, and communication preferences',
      financial: 'Fees, costs, and billing information',
      dates: 'Deadlines, filing dates, and important milestones',
      notes: 'Additional comments and special instructions'
    }
    
    return descriptions[section]
  }
  
  /**
   * Determine if section should be collapsible
   */
  const shouldSectionBeCollapsible = (section: string, fieldCount: number): boolean => {
    // Always collapsible if more than 6 fields
    if (fieldCount > 6) return true
    
    // Certain sections are always collapsible
    const alwaysCollapsible = ['notes', 'financial', 'advanced']
    if (alwaysCollapsible.includes(section)) return true
    
    // Core sections are not collapsible if small
    const coreTypes = ['client', 'matter', 'case']
    if (coreTypes.includes(section) && fieldCount <= 4) return false
    
    return fieldCount > 3
  }
  
  /**
   * Determine if section should start collapsed
   */
  const shouldSectionStartCollapsed = (section: string): boolean => {
    // Optional sections start collapsed
    const startCollapsed = ['notes', 'comments', 'advanced', 'optional']
    return startCollapsed.includes(section)
  }
  
  /**
   * Compare section priority for ordering
   */
  const compareSectionPriority = (a: FieldGroup, b: FieldGroup): number => {
    const priorities: Record<string, number> = {
      client: 1,
      matter: 2,
      case: 3,
      contact: 4,
      address: 5,
      dates: 6,
      financial: 7,
      notes: 8,
      general: 9
    }
    
    const aPriority = priorities[a.section] || 100
    const bPriority = priorities[b.section] || 100
    
    return aPriority - bPriority
  }
  
  /**
   * Get responsive breakpoints for layout
   */
  const getResponsiveBreakpoints = (layout?: FormLayout) => {
    return layout?.breakpoints || {
      sm: 1,
      md: 2,
      lg: 3
    }
  }
  
  return {
    groupFieldsBySection,
    calculateColumnsForSection,
    sortFieldsInSection,
    formatSectionTitle,
    getSectionDescription,
    getResponsiveBreakpoints
  }
}