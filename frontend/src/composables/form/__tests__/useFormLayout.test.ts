/**
 * Form Layout Composable Tests
 */

import { describe, it, expect } from 'vitest'
import { useFormLayout } from '../useFormLayout'
import type { ParsedTemplateVariable } from '../types'
import type { FormLayout } from '~/components/dynamic-form/types'

describe('useFormLayout', () => {
  const { groupFieldsBySection, calculateColumnsForSection } = useFormLayout()

  const createTestVariable = (
    name: string, 
    path: string[] = [name],
    overrides: Partial<ParsedTemplateVariable> = {}
  ): ParsedTemplateVariable => ({
    name,
    path,
    type: { base: 'text' },
    label: `${name} Label`,
    placeholder: `Enter ${name}`,
    required: false,
    ...overrides
  })

  describe('groupFieldsBySection', () => {
    it('groups fields by first path segment', () => {
      const variables = [
        createTestVariable('firstName', ['client', 'firstName']),
        createTestVariable('lastName', ['client', 'lastName']),
        createTestVariable('title', ['matter', 'title']),
        createTestVariable('description', ['matter', 'description'])
      ]

      const groups = groupFieldsBySection(variables)

      expect(groups).toHaveLength(2)
      expect(groups[0].section).toBe('client')
      expect(groups[0].fields).toHaveLength(2)
      expect(groups[1].section).toBe('matter')
      expect(groups[1].fields).toHaveLength(2)
    })

    it('creates general group for fields without path', () => {
      const variables = [
        createTestVariable('generalField', []),
        createTestVariable('anotherField', [''])
      ]

      const groups = groupFieldsBySection(variables)

      expect(groups).toHaveLength(1)
      expect(groups[0].section).toBe('general')
      expect(groups[0].fields).toHaveLength(2)
    })

    it('generates appropriate group titles', () => {
      const variables = [
        createTestVariable('name', ['client']),
        createTestVariable('title', ['matter']),
        createTestVariable('street', ['address'])
      ]

      const groups = groupFieldsBySection(variables)

      expect(groups.find(g => g.section === 'client')?.title).toBe('Client Information')
      expect(groups.find(g => g.section === 'matter')?.title).toBe('Matter Details')
      expect(groups.find(g => g.section === 'address')?.title).toBe('Address Information')
    })

    it('sets collapsible based on section and field count', () => {
      const variables = [
        // Client section with few fields (should not be collapsible)
        createTestVariable('name', ['client']),
        createTestVariable('email', ['client']),
        
        // Notes section (should be collapsible)
        createTestVariable('note1', ['notes']),
        createTestVariable('note2', ['notes']),
        
        // Large section (should be collapsible)
        ...Array.from({ length: 8 }, (_, i) => 
          createTestVariable(`field${i}`, ['large'])
        )
      ]

      const groups = groupFieldsBySection(variables)

      const clientGroup = groups.find(g => g.section === 'client')
      const notesGroup = groups.find(g => g.section === 'notes')
      const largeGroup = groups.find(g => g.section === 'large')

      expect(clientGroup?.collapsible).toBe(false)
      expect(notesGroup?.collapsible).toBe(true)
      expect(largeGroup?.collapsible).toBe(true)
    })

    it('sorts fields within sections correctly', () => {
      const variables = [
        createTestVariable('optional', ['client'], { required: false, label: 'Optional Field' }),
        createTestVariable('required', ['client'], { required: true, label: 'Required Field' }),
        createTestVariable('another', ['client'], { required: true, label: 'Another Required' })
      ]

      const groups = groupFieldsBySection(variables)
      const clientGroup = groups.find(g => g.section === 'client')

      // Required fields should come first
      expect(clientGroup?.fields[0].required).toBe(true)
      expect(clientGroup?.fields[1].required).toBe(true)
      expect(clientGroup?.fields[2].required).toBe(false)
    })

    it('sorts groups by priority', () => {
      const variables = [
        createTestVariable('note', ['notes']),
        createTestVariable('name', ['client']),
        createTestVariable('title', ['matter']),
        createTestVariable('street', ['address'])
      ]

      const groups = groupFieldsBySection(variables)

      // Should be ordered: client, matter, address, notes
      expect(groups[0].section).toBe('client')
      expect(groups[1].section).toBe('matter')
      expect(groups[2].section).toBe('address')
      expect(groups[3].section).toBe('notes')
    })
  })

  describe('calculateColumnsForSection', () => {
    it('respects manual layout override', () => {
      const layout: FormLayout = { type: 'manual', columns: 3 }
      const fields = [createTestVariable('field1')]

      const columns = calculateColumnsForSection('client', fields, layout)

      expect(columns).toBe(3)
    })

    it('returns 1 for single-column layout', () => {
      const layout: FormLayout = { type: 'single-column' }
      const fields = [createTestVariable('field1')]

      const columns = calculateColumnsForSection('client', fields, layout)

      expect(columns).toBe(1)
    })

    it('respects grid layout with max columns', () => {
      const layout: FormLayout = { 
        type: 'grid', 
        columns: 5, 
        maxColumns: 3 
      }
      const fields = [createTestVariable('field1')]

      const columns = calculateColumnsForSection('client', fields, layout)

      expect(columns).toBe(3)
    })

    it('adjusts columns based on section type', () => {
      // Single field always gets 1 column
      const singleField = [createTestVariable('field1')]
      expect(calculateColumnsForSection('address', singleField)).toBe(1)
      expect(calculateColumnsForSection('client', singleField)).toBe(1)
      
      // Multiple fields respect section preferences
      const multipleFields = [createTestVariable('field1'), createTestVariable('field2')]
      expect(calculateColumnsForSection('address', multipleFields)).toBe(1) // Address prefers 1
      expect(calculateColumnsForSection('client', multipleFields)).toBe(2)   // Client prefers 2
      expect(calculateColumnsForSection('contact', multipleFields)).toBe(2)  // Contact prefers 2
    })

    it('uses single column for sections with large fields', () => {
      const fields = [
        createTestVariable('description', [], { 
          type: { base: 'text', variant: 'textarea' } 
        })
      ]

      const columns = calculateColumnsForSection('client', fields)

      expect(columns).toBe(1)
    })

    it('adjusts columns based on field count', () => {
      const singleField = [createTestVariable('field1')]
      const twoFields = [createTestVariable('field1'), createTestVariable('field2')]
      const manyFields = Array.from({ length: 10 }, (_, i) => 
        createTestVariable(`field${i}`)
      )

      expect(calculateColumnsForSection('client', singleField)).toBe(1)
      expect(calculateColumnsForSection('client', twoFields)).toBe(2)
      expect(calculateColumnsForSection('client', manyFields)).toBe(2) // Max for client section
    })
  })

  describe('section descriptions', () => {
    it('provides descriptions for known sections', () => {
      const variables = [
        createTestVariable('name', ['client']),
        createTestVariable('title', ['matter'])
      ]

      const groups = groupFieldsBySection(variables)

      const clientGroup = groups.find(g => g.section === 'client')
      const matterGroup = groups.find(g => g.section === 'matter')

      expect(clientGroup?.description).toBe('Basic client contact and identification information')
      expect(matterGroup?.description).toBe('Case matter details and classification')
    })

    it('handles unknown sections gracefully', () => {
      const variables = [createTestVariable('field', ['unknown'])]

      const groups = groupFieldsBySection(variables)

      expect(groups[0].description).toBeUndefined()
      expect(groups[0].title).toBe('Unknown')
    })
  })

  describe('collapsible behavior', () => {
    it('marks notes sections as collapsible', () => {
      const variables = [createTestVariable('note', ['notes'])]

      const groups = groupFieldsBySection(variables)

      expect(groups[0].collapsible).toBe(true)
    })

    it('starts optional sections as collapsed', () => {
      const variables = [createTestVariable('note', ['notes'])]

      const groups = groupFieldsBySection(variables)

      expect(groups[0].collapsed).toBe(true)
    })

    it('keeps core sections expanded by default', () => {
      const variables = [createTestVariable('name', ['client'])]

      const groups = groupFieldsBySection(variables)

      expect(groups[0].collapsed).toBe(false)
    })
  })
})