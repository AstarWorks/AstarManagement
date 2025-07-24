/**
 * Template Browser Store - Pinia store for template management and browsing
 */
import { defineStore } from 'pinia'
import { ref, computed, readonly } from 'vue'
import type {
  Template,
  TemplateCategory,
  TemplateFilters,
  TemplateSortOptions,
  TemplateApiResponse,
  TemplateBrowserState
} from '~/types/template'

export const useTemplateBrowserStore = defineStore('template-browser', () => {
  // State
  const templates = ref<Template[]>([])
  const categories = ref<TemplateCategory[]>([])
  const favorites = ref<Set<string>>(new Set())
  const recentlyUsed = ref<string[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  
  // UI State
  const searchQuery = ref('')
  const selectedCategories = ref<string[]>([])
  const selectedFileTypes = ref<string[]>([])
  const selectedLanguages = ref<string[]>([])
  const favoritesOnly = ref(false)
  const recentlyUsedOnly = ref(false)
  const sortBy = ref<TemplateSortOptions>({ field: 'name', direction: 'asc' })
  const viewMode = ref<'grid' | 'list'>('grid')
  const expandedCategories = ref<Set<string>>(new Set())
  
  // Preview state
  const selectedTemplate = ref<Template | null>(null)
  const showPreview = ref(false)
  
  // Computed - Current filters object
  const currentFilters = computed((): TemplateFilters => ({
    categories: selectedCategories.value,
    fileTypes: selectedFileTypes.value,
    languages: selectedLanguages.value,
    favoritesOnly: favoritesOnly.value,
    recentlyUsed: recentlyUsedOnly.value
  }))
  
  // Computed - Filtered templates
  const filteredTemplates = computed(() => {
    let result = [...templates.value]
    
    // Text search
    if (searchQuery.value.trim()) {
      const query = searchQuery.value.toLowerCase()
      result = result.filter(template => 
        template.name.toLowerCase().includes(query) ||
        template.description.toLowerCase().includes(query) ||
        template.tags.some(tag => tag.toLowerCase().includes(query)) ||
        template.category.name.toLowerCase().includes(query)
      )
    }
    
    // Category filter
    if (selectedCategories.value.length > 0) {
      result = result.filter(template => 
        selectedCategories.value.includes(template.category.id)
      )
    }
    
    // File type filter
    if (selectedFileTypes.value.length > 0) {
      result = result.filter(template => 
        selectedFileTypes.value.includes(template.metadata.fileType)
      )
    }
    
    // Language filter
    if (selectedLanguages.value.length > 0) {
      result = result.filter(template => 
        selectedLanguages.value.includes(template.metadata.language)
      )
    }
    
    // Favorites filter
    if (favoritesOnly.value) {
      result = result.filter(template => favorites.value.has(template.id))
    }
    
    // Recently used filter
    if (recentlyUsedOnly.value) {
      result = result.filter(template => recentlyUsed.value.includes(template.id))
    }
    
    // Sort results
    result.sort((a, b) => {
      const direction = sortBy.value.direction === 'asc' ? 1 : -1
      
      switch (sortBy.value.field) {
        case 'name':
          return a.name.localeCompare(b.name) * direction
        case 'date':
          return (new Date(a.updatedAt).getTime() - new Date(b.updatedAt).getTime()) * direction
        case 'usage':
          return (a.statistics.usageCount - b.statistics.usageCount) * direction
        case 'rating':
          return ((a.statistics.userRating || 0) - (b.statistics.userRating || 0)) * direction
        case 'estimatedTime':
          return (a.metadata.estimatedTime - b.metadata.estimatedTime) * direction
        default:
          return 0
      }
    })
    
    return result
  })
  
  // Computed - Favorite templates
  const favoriteTemplates = computed(() => 
    templates.value.filter(template => favorites.value.has(template.id))
  )
  
  // Computed - Popular templates (most used)
  const popularTemplates = computed(() =>
    [...templates.value]
      .sort((a, b) => b.statistics.usageCount - a.statistics.usageCount)
      .slice(0, 6)
  )
  
  // Computed - Recently used templates
  const recentTemplates = computed(() =>
    recentlyUsed.value
      .map(id => templates.value.find(t => t.id === id))
      .filter((template): template is Template => !!template)
      .slice(0, 6)
  )
  
  // Computed - Statistics
  const templateStats = computed(() => ({
    total: templates.value.length,
    filtered: filteredTemplates.value.length,
    favorites: favoriteTemplates.value.length,
    categories: categories.value.length,
    avgRating: templates.value.reduce((sum, t) => sum + (t.statistics.userRating || 0), 0) / templates.value.length || 0
  }))
  
  // Actions - Data loading
  const loadTemplates = async (force = false) => {
    if (loading.value && !force) return
    
    loading.value = true
    error.value = null
    
    try {
      // Use mock data for now - replace with API call
      const mockData = generateMockTemplateData()
      templates.value = mockData.templates
      categories.value = mockData.categories
      
      // Load user preferences
      loadUserPreferences()
    } catch (err) {
      error.value = err instanceof Error ? err.message : 'Failed to load templates'
      console.error('Failed to load templates:', err)
    } finally {
      loading.value = false
    }
  }
  
  // Actions - Favorites management
  const toggleFavorite = async (templateId: string) => {
    const template = templates.value.find(t => t.id === templateId)
    if (!template) return
    
    const wasFavorite = favorites.value.has(templateId)
    
    // Optimistic update
    if (wasFavorite) {
      favorites.value.delete(templateId)
      template.statistics.favoriteCount = Math.max(0, template.statistics.favoriteCount - 1)
    } else {
      favorites.value.add(templateId)
      template.statistics.favoriteCount += 1
    }
    
    template.isFavorite = !wasFavorite
    
    try {
      // API call would go here
      await fetch(`/api/templates/${templateId}/favorite`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ isFavorite: !wasFavorite })
      })
      
      // Save to localStorage
      saveUserPreferences()
    } catch (err) {
      // Revert optimistic update on error
      if (wasFavorite) {
        favorites.value.add(templateId)
        template.statistics.favoriteCount += 1
      } else {
        favorites.value.delete(templateId)
        template.statistics.favoriteCount = Math.max(0, template.statistics.favoriteCount - 1)
      }
      template.isFavorite = wasFavorite
      
      console.error('Failed to toggle favorite:', err)
      throw new Error('Failed to update favorite status')
    }
  }
  
  // Actions - Usage tracking
  const recordUsage = async (templateId: string) => {
    const template = templates.value.find(t => t.id === templateId)
    if (!template) return
    
    // Update statistics
    template.statistics.usageCount += 1
    template.statistics.lastUsedAt = new Date().toISOString()
    
    // Update recently used
    recentlyUsed.value = [
      templateId,
      ...recentlyUsed.value.filter(id => id !== templateId)
    ].slice(0, 10) // Keep only last 10
    
    try {
      // API call would go here
      await fetch(`/api/templates/${templateId}/usage`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      })
      
      saveUserPreferences()
    } catch (err) {
      console.error('Failed to record usage:', err)
    }
  }
  
  // Actions - Filter management
  const clearFilters = () => {
    searchQuery.value = ''
    selectedCategories.value = []
    selectedFileTypes.value = []
    selectedLanguages.value = []
    favoritesOnly.value = false
    recentlyUsedOnly.value = false
  }
  
  const setSort = (field: TemplateSortOptions['field'], direction?: TemplateSortOptions['direction']) => {
    sortBy.value = {
      field,
      direction: direction || (sortBy.value.field === field && sortBy.value.direction === 'asc' ? 'desc' : 'asc')
    }
    saveUserPreferences()
  }
  
  // Actions - Preview management
  const openPreview = (template: Template) => {
    selectedTemplate.value = template
    showPreview.value = true
  }
  
  const closePreview = () => {
    selectedTemplate.value = null
    showPreview.value = false
  }
  
  // Actions - User preferences
  const loadUserPreferences = () => {
    if (typeof window === 'undefined') return
    
    try {
      const stored = localStorage.getItem('template-browser-preferences')
      if (stored) {
        const prefs = JSON.parse(stored)
        favorites.value = new Set(prefs.favorites || [])
        recentlyUsed.value = prefs.recentlyUsed || []
        viewMode.value = prefs.viewMode || 'grid'
        sortBy.value = prefs.sortBy || { field: 'name', direction: 'asc' }
        expandedCategories.value = new Set(prefs.expandedCategories || [])
        
        // Update template favorite status
        templates.value.forEach(template => {
          template.isFavorite = favorites.value.has(template.id)
        })
      }
    } catch (err) {
      console.warn('Failed to load user preferences:', err)
    }
  }
  
  const saveUserPreferences = () => {
    if (typeof window === 'undefined') return
    
    try {
      const prefs = {
        favorites: Array.from(favorites.value),
        recentlyUsed: recentlyUsed.value,
        viewMode: viewMode.value,
        sortBy: sortBy.value,
        expandedCategories: Array.from(expandedCategories.value)
      }
      localStorage.setItem('template-browser-preferences', JSON.stringify(prefs))
    } catch (err) {
      console.warn('Failed to save user preferences:', err)
    }
  }
  
  return {
    // State (readonly)
    templates: readonly(templates),
    categories: readonly(categories),
    favorites: readonly(favorites),
    recentlyUsed: readonly(recentlyUsed),
    loading: readonly(loading),
    error: readonly(error),
    
    // UI State
    searchQuery,
    selectedCategories,
    selectedFileTypes,
    selectedLanguages,
    favoritesOnly,
    recentlyUsedOnly,
    sortBy,
    viewMode,
    expandedCategories,
    
    // Preview state
    selectedTemplate: readonly(selectedTemplate),
    showPreview,
    
    // Computed
    currentFilters,
    filteredTemplates,
    favoriteTemplates,
    popularTemplates,
    recentTemplates,
    templateStats,
    
    // Actions
    loadTemplates,
    toggleFavorite,
    recordUsage,
    clearFilters,
    setSort,
    openPreview,
    closePreview,
    saveUserPreferences
  }
})

// Mock data generator for development
function generateMockTemplateData(): TemplateApiResponse {
  const mockCategories: TemplateCategory[] = [
    {
      id: 'legal-contracts',
      name: 'Legal Contracts',
      icon: 'FileText',
      color: 'blue',
      count: 8
    },
    {
      id: 'legal-forms',
      name: 'Legal Forms',
      icon: 'Form',
      color: 'green',
      count: 6
    },
    {
      id: 'correspondence',
      name: 'Correspondence',
      icon: 'Mail',
      color: 'purple',
      count: 5
    },
    {
      id: 'business-docs',
      name: 'Business Documents',
      icon: 'Building',
      color: 'orange',
      count: 4
    }
  ]
  
  const mockTemplates: Template[] = [
    {
      id: 'template-1',
      name: 'Service Agreement',
      description: 'Comprehensive service agreement template for professional services',
      category: mockCategories[0],
      thumbnailUrl: '/api/templates/template-1/thumbnail',
      previewUrl: '/api/templates/template-1/preview',
      content: '',
      variables: [
        {
          key: 'clientName',
          label: 'Client Name',
          type: 'text',
          required: true,
          placeholder: 'Enter client name'
        },
        {
          key: 'serviceDescription',
          label: 'Service Description',
          type: 'text',
          required: true,
          placeholder: 'Describe the services to be provided'
        },
        {
          key: 'contractValue',
          label: 'Contract Value',
          type: 'number',
          required: true,
          placeholder: 'Enter contract amount'
        },
        {
          key: 'startDate',
          label: 'Start Date',
          type: 'date',
          required: true
        }
      ],
      metadata: {
        language: 'en',
        fileType: 'docx',
        pageCount: 3,
        estimatedTime: 15,
        requiredFields: ['clientName', 'serviceDescription', 'contractValue', 'startDate'],
        relatedTemplates: ['template-2', 'template-3']
      },
      statistics: {
        usageCount: 45,
        lastUsedAt: '2025-06-28T10:30:00Z',
        averageCompletionTime: 12,
        userRating: 4.5,
        favoriteCount: 8,
        successRate: 95
      },
      isFavorite: false,
      tags: ['contract', 'service', 'professional'],
      version: '1.2',
      createdAt: '2025-01-15T09:00:00Z',
      updatedAt: '2025-06-01T14:20:00Z',
      createdBy: {
        id: 'user-1',
        name: 'Legal Team',
        email: 'legal@example.com',
        role: 'admin'
      }
    },
    {
      id: 'template-2',
      name: 'Non-Disclosure Agreement',
      description: 'Standard NDA template for confidentiality agreements',
      category: mockCategories[0],
      thumbnailUrl: '/api/templates/template-2/thumbnail',
      previewUrl: '/api/templates/template-2/preview',
      content: '',
      variables: [
        {
          key: 'disclosingParty',
          label: 'Disclosing Party',
          type: 'text',
          required: true
        },
        {
          key: 'receivingParty',
          label: 'Receiving Party',
          type: 'text',
          required: true
        },
        {
          key: 'effectiveDate',
          label: 'Effective Date',
          type: 'date',
          required: true
        },
        {
          key: 'duration',
          label: 'Duration (years)',
          type: 'select',
          required: true,
          options: ['1', '2', '3', '5', '10']
        }
      ],
      metadata: {
        language: 'en',
        fileType: 'pdf',
        pageCount: 2,
        estimatedTime: 10,
        requiredFields: ['disclosingParty', 'receivingParty', 'effectiveDate', 'duration'],
        relatedTemplates: ['template-1']
      },
      statistics: {
        usageCount: 62,
        lastUsedAt: '2025-06-29T08:15:00Z',
        averageCompletionTime: 8,
        userRating: 4.8,
        favoriteCount: 12,
        successRate: 98
      },
      isFavorite: true,
      tags: ['nda', 'confidentiality', 'agreement'],
      version: '2.1',
      createdAt: '2025-02-01T11:00:00Z',
      updatedAt: '2025-06-15T16:45:00Z',
      createdBy: {
        id: 'user-1',
        name: 'Legal Team',
        email: 'legal@example.com',
        role: 'admin'
      }
    },
    {
      id: 'template-3',
      name: 'Employment Contract',
      description: 'Standard employment contract for new hires',
      category: mockCategories[0],
      thumbnailUrl: '/api/templates/template-3/thumbnail',
      previewUrl: '/api/templates/template-3/preview',
      content: '',
      variables: [
        {
          key: 'employeeName',
          label: 'Employee Name',
          type: 'text',
          required: true
        },
        {
          key: 'position',
          label: 'Position',
          type: 'text',
          required: true
        },
        {
          key: 'salary',
          label: 'Annual Salary',
          type: 'number',
          required: true
        },
        {
          key: 'startDate',
          label: 'Start Date',
          type: 'date',
          required: true
        },
        {
          key: 'probationPeriod',
          label: 'Probation Period (months)',
          type: 'select',
          required: false,
          options: ['1', '3', '6', '12'],
          defaultValue: '3'
        }
      ],
      metadata: {
        language: 'en',
        fileType: 'docx',
        pageCount: 4,
        estimatedTime: 20,
        requiredFields: ['employeeName', 'position', 'salary', 'startDate'],
        relatedTemplates: []
      },
      statistics: {
        usageCount: 28,
        lastUsedAt: '2025-06-25T14:20:00Z',
        averageCompletionTime: 18,
        userRating: 4.2,
        favoriteCount: 5,
        successRate: 92
      },
      isFavorite: false,
      tags: ['employment', 'contract', 'hr'],
      version: '1.5',
      createdAt: '2025-03-10T13:30:00Z',
      updatedAt: '2025-06-20T10:15:00Z',
      createdBy: {
        id: 'user-2',
        name: 'HR Department',
        email: 'hr@example.com',
        role: 'editor'
      }
    }
  ]
  
  return {
    templates: mockTemplates,
    categories: mockCategories,
    total: mockTemplates.length,
    page: 1,
    pageSize: 50
  }
}