/**
 * Memo Templates Store
 * Manages template selection, insertion, and variable replacement
 */

import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'

export interface MemoTemplate {
  id: string
  name: string
  category: 'formal' | 'informal' | 'notice' | 'legal' | 'custom'
  description: string
  content: string
  variables: string[]
  createdAt: Date
  updatedAt: Date
  isSystem: boolean
  isPublic: boolean
  authorId?: string
  usage: number
}

export interface TemplateVariable {
  key: string
  label: string
  type: 'text' | 'date' | 'number' | 'select'
  required: boolean
  defaultValue?: string
  options?: string[] // For select type
  placeholder?: string
  description?: string
}

export interface TemplateCategory {
  id: string
  name: string
  description: string
  icon: string
  templates: MemoTemplate[]
}

export interface CreateTemplateInput {
  name: string
  category: MemoTemplate['category']
  description: string
  content: string
  isPublic?: boolean
}

export interface TemplateSearchFilters {
  category?: string
  query?: string
  isSystem?: boolean
  authorId?: string
}

export const useMemoTemplateStore = defineStore('memoTemplates', () => {
  // State
  const templates = ref<MemoTemplate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const searchFilters = ref<TemplateSearchFilters>({})

  // Computed
  const templateCategories = computed((): TemplateCategory[] => {
    const categories = templates.value.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = []
      }
      acc[template.category].push(template)
      return acc
    }, {} as Record<string, MemoTemplate[]>)

    return Object.entries(categories).map(([categoryId, categoryTemplates]) => ({
      id: categoryId,
      name: getCategoryName(categoryId as MemoTemplate['category']),
      description: getCategoryDescription(categoryId as MemoTemplate['category']),
      icon: getCategoryIcon(categoryId as MemoTemplate['category']),
      templates: categoryTemplates.sort((a, b) => b.usage - a.usage)
    }))
  })

  const filteredTemplates = computed(() => {
    let filtered = templates.value

    if (searchFilters.value.category) {
      filtered = filtered.filter(t => t.category === searchFilters.value.category)
    }

    if (searchFilters.value.query) {
      const query = searchFilters.value.query.toLowerCase()
      filtered = filtered.filter(t => 
        t.name.toLowerCase().includes(query) ||
        t.description.toLowerCase().includes(query) ||
        t.content.toLowerCase().includes(query)
      )
    }

    if (searchFilters.value.isSystem !== undefined) {
      filtered = filtered.filter(t => t.isSystem === searchFilters.value.isSystem)
    }

    if (searchFilters.value.authorId) {
      filtered = filtered.filter(t => t.authorId === searchFilters.value.authorId)
    }

    return filtered.sort((a, b) => {
      // Sort by usage, then by name
      if (a.usage !== b.usage) {
        return b.usage - a.usage
      }
      return a.name.localeCompare(b.name)
    })
  })

  const popularTemplates = computed(() => 
    templates.value
      .filter(t => t.usage > 0)
      .sort((a, b) => b.usage - a.usage)
      .slice(0, 5)
  )

  const recentTemplates = computed(() =>
    templates.value
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, 5)
  )

  // Helper functions
  function getCategoryName(category: MemoTemplate['category']): string {
    const names = {
      formal: 'Formal Communications',
      informal: 'Informal Communications',
      notice: 'Legal Notices',
      legal: 'Legal Documents',
      custom: 'Custom Templates'
    }
    return names[category] || category
  }

  function getCategoryDescription(category: MemoTemplate['category']): string {
    const descriptions = {
      formal: 'Professional and formal communication templates',
      informal: 'Casual and informal communication templates',
      notice: 'Legal notice and notification templates',
      legal: 'Legal document and contract templates',
      custom: 'User-created custom templates'
    }
    return descriptions[category] || ''
  }

  function getCategoryIcon(category: MemoTemplate['category']): string {
    const icons = {
      formal: 'lucide-briefcase',
      informal: 'lucide-message-circle',
      notice: 'lucide-bell',
      legal: 'lucide-scale',
      custom: 'lucide-user'
    }
    return icons[category] || 'lucide-file-text'
  }

  // Template variable extraction and processing
  const extractVariables = (content: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g
    const variables = new Set<string>()
    let match

    while ((match = regex.exec(content)) !== null) {
      // Validate variable format (alphanumeric and underscore only)
      if (/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(match[1])) {
        variables.add(match[1])
      }
    }

    return Array.from(variables)
  }
  
  // Validate template variable format
  const validateTemplateVariables = (content: string): { isValid: boolean; errors: string[] } => {
    const regex = /\{\{(\w+)\}\}/g
    const errors: string[] = []
    let match
    
    while ((match = regex.exec(content)) !== null) {
      if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(match[1])) {
        errors.push(`Invalid variable format: {{${match[1]}}}. Variables must start with a letter or underscore.`)
      }
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }

  const replaceVariables = (content: string, variables: Record<string, string>): string => {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match
    })
  }

  const getVariableDefinitions = (variableKeys: string[]): TemplateVariable[] => {
    // Default variable definitions
    const defaultVariables: Record<string, TemplateVariable> = {
      clientName: {
        key: 'clientName',
        label: 'Client Name',
        type: 'text',
        required: true,
        placeholder: 'Enter client name'
      },
      clientEmail: {
        key: 'clientEmail',
        label: 'Client Email',
        type: 'text',
        required: false,
        placeholder: 'client@example.com'
      },
      matterNumber: {
        key: 'matterNumber',
        label: 'Matter Number',
        type: 'text',
        required: true,
        placeholder: 'e.g., MAT-2024-001'
      },
      matterTitle: {
        key: 'matterTitle',
        label: 'Matter Title',
        type: 'text',
        required: true,
        placeholder: 'Enter matter title'
      },
      lawyerName: {
        key: 'lawyerName',
        label: 'Lawyer Name',
        type: 'text',
        required: true,
        placeholder: 'Enter lawyer name'
      },
      firmName: {
        key: 'firmName',
        label: 'Firm Name',
        type: 'text',
        required: true,
        placeholder: 'Enter firm name'
      },
      date: {
        key: 'date',
        label: 'Date',
        type: 'date',
        required: true,
        defaultValue: new Date().toISOString().split('T')[0]
      },
      dueDate: {
        key: 'dueDate',
        label: 'Due Date',
        type: 'date',
        required: false
      },
      priority: {
        key: 'priority',
        label: 'Priority',
        type: 'select',
        required: false,
        options: ['Low', 'Medium', 'High'],
        defaultValue: 'Medium'
      }
    }

    return variableKeys.map(key => 
      defaultVariables[key] || {
        key,
        label: key.charAt(0).toUpperCase() + key.slice(1),
        type: 'text',
        required: false,
        placeholder: `Enter ${key}`
      }
    )
  }

  // Actions
  const fetchTemplates = async () => {
    loading.value = true
    error.value = null

    try {
      // For now, use mock data
      // In production, replace with actual API call
      const mockTemplates = await getMockTemplates()
      templates.value = mockTemplates
    } catch (err) {
      error.value = 'Failed to load templates'
      console.error('Template fetch error:', err)
    } finally {
      loading.value = false
    }
  }

  const getTemplate = (id: string): MemoTemplate | undefined => {
    return templates.value.find(t => t.id === id)
  }

  const insertTemplate = (templateId: string, variables: Record<string, string>): string => {
    const template = getTemplate(templateId)
    if (!template) return ''

    // Increment usage counter
    template.usage += 1

    return replaceVariables(template.content, variables)
  }

  const createTemplate = async (templateData: CreateTemplateInput): Promise<MemoTemplate> => {
    try {
      const newTemplate: MemoTemplate = {
        id: crypto.randomUUID(),
        ...templateData,
        variables: extractVariables(templateData.content),
        createdAt: new Date(),
        updatedAt: new Date(),
        isSystem: false,
        isPublic: templateData.isPublic || false,
        usage: 0
      }

      // In production, make API call
      // const response = await $fetch<MemoTemplate>('/api/memo-templates', {
      //   method: 'POST',
      //   body: newTemplate
      // })
      
      templates.value.push(newTemplate)
      return newTemplate
    } catch (err) {
      error.value = 'Failed to create template'
      throw err
    }
  }

  const updateTemplate = async (id: string, updates: Partial<MemoTemplate>): Promise<MemoTemplate> => {
    try {
      const index = templates.value.findIndex(t => t.id === id)
      if (index === -1) {
        throw new Error('Template not found')
      }

      const updatedTemplate = {
        ...templates.value[index],
        ...updates,
        variables: updates.content ? extractVariables(updates.content) : templates.value[index].variables,
        updatedAt: new Date()
      }

      // In production, make API call
      // const response = await $fetch<MemoTemplate>(`/api/memo-templates/${id}`, {
      //   method: 'PATCH',
      //   body: updates
      // })
      
      templates.value[index] = updatedTemplate
      return updatedTemplate
    } catch (err) {
      error.value = 'Failed to update template'
      throw err
    }
  }

  const deleteTemplate = async (id: string): Promise<void> => {
    try {
      // In production, make API call
      // await $fetch(`/api/memo-templates/${id}`, { method: 'DELETE' })
      
      templates.value = templates.value.filter(t => t.id !== id)
    } catch (err) {
      error.value = 'Failed to delete template'
      throw err
    }
  }

  const searchTemplates = (filters: TemplateSearchFilters) => {
    searchFilters.value = { ...filters }
  }

  const clearSearch = () => {
    searchFilters.value = {}
  }

  // Mock data for development
  const getMockTemplates = async (): Promise<MemoTemplate[]> => {
    return [
      {
        id: '1',
        name: 'Client Welcome Letter',
        category: 'formal',
        description: 'Professional welcome letter for new clients',
        content: `Dear {{clientName}},

Welcome to {{firmName}}! We are pleased to represent you in connection with {{matterTitle}} (Matter No. {{matterNumber}}).

This letter confirms our engagement and outlines the scope of our representation. Please review the attached retainer agreement carefully.

Your assigned attorney is {{lawyerName}}, who will be your primary contact throughout this matter.

If you have any questions, please don't hesitate to contact us.

Sincerely,
{{lawyerName}}
{{firmName}}`,
        variables: ['clientName', 'firmName', 'matterTitle', 'matterNumber', 'lawyerName'],
        createdAt: new Date('2024-01-15'),
        updatedAt: new Date('2024-01-15'),
        isSystem: true,
        isPublic: true,
        usage: 45
      },
      {
        id: '2',
        name: 'Case Status Update',
        category: 'informal',
        description: 'Brief case status update for clients',
        content: `Hi {{clientName}},

I wanted to give you a quick update on {{matterTitle}}.

[Update details here]

The next steps are:
- [Step 1]
- [Step 2]

Please let me know if you have any questions.

Best regards,
{{lawyerName}}`,
        variables: ['clientName', 'matterTitle', 'lawyerName'],
        createdAt: new Date('2024-01-20'),
        updatedAt: new Date('2024-01-20'),
        isSystem: true,
        isPublic: true,
        usage: 38
      },
      {
        id: '3',
        name: 'Document Request',
        category: 'formal',
        description: 'Request for documents from clients',
        content: `Dear {{clientName}},

Re: {{matterTitle}} - Document Request

To proceed with your matter, we require the following documents:

1. [Document 1]
2. [Document 2]
3. [Document 3]

Please provide these documents by {{dueDate}}. You may send them via email or upload them to our client portal.

Thank you for your cooperation.

Sincerely,
{{lawyerName}}
{{firmName}}`,
        variables: ['clientName', 'matterTitle', 'dueDate', 'lawyerName', 'firmName'],
        createdAt: new Date('2024-01-25'),
        updatedAt: new Date('2024-01-25'),
        isSystem: true,
        isPublic: true,
        usage: 29
      },
      {
        id: '4',
        name: 'Court Date Notification',
        category: 'notice',
        description: 'Notification of upcoming court date',
        content: `IMPORTANT NOTICE - COURT DATE SCHEDULED

Dear {{clientName}},

This is to notify you that a court hearing has been scheduled for {{matterTitle}}.

Date: {{date}}
Time: [Time]
Location: [Court Address]

Please confirm your attendance. If you cannot attend, please contact us immediately.

Priority: {{priority}}

{{lawyerName}}
{{firmName}}`,
        variables: ['clientName', 'matterTitle', 'date', 'priority', 'lawyerName', 'firmName'],
        createdAt: new Date('2024-02-01'),
        updatedAt: new Date('2024-02-01'),
        isSystem: true,
        isPublic: true,
        usage: 22
      }
    ]
  }

  return {
    // State
    templates: readonly(templates),
    loading: readonly(loading),
    error: readonly(error),
    searchFilters: readonly(searchFilters),
    
    // Computed
    templateCategories,
    filteredTemplates,
    popularTemplates,
    recentTemplates,
    
    // Actions
    fetchTemplates,
    getTemplate,
    insertTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    searchTemplates,
    clearSearch,
    
    // Utilities
    extractVariables,
    replaceVariables,
    getVariableDefinitions,
  }
})

export type { 
  MemoTemplate, 
  TemplateVariable, 
  TemplateCategory, 
  CreateTemplateInput,
  TemplateSearchFilters 
}