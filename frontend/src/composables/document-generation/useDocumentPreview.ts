import { ref, computed } from 'vue'
import type { Ref } from 'vue'

// Types
export interface PreviewRequest {
  templateId: string
  matterId: string
  format: 'html' | 'pdf' | 'structured'
}

export interface PreviewResponse {
  content: string
  format: string
  variables: Record<string, any>
  metadata: {
    pages: number
    renderTime: number
    variableCount: number
    lastModified: Date
  }
}

export interface PreviewStats {
  variables: number
  pages: number
  renderTime: number
  lastModified: Date
}

// Mock template data for realistic previews
const mockTemplateData = {
  'template-1': {
    name: 'Estate Planning Template',
    content: {
      html: `
        <div class="legal-document">
          <h1>LAST WILL AND TESTAMENT</h1>
          <h2>OF {{client_name}}</h2>
          
          <p>I, {{client_name}}, being of sound mind and disposing memory, do hereby make, publish and declare this to be my Last Will and Testament, hereby revoking all former wills and codicils made by me.</p>
          
          <h3>ARTICLE I - IDENTIFICATION</h3>
          <p>I am a resident of {{client_address}}, and my date of birth is {{client_dob}}.</p>
          
          <h3>ARTICLE II - FAMILY</h3>
          <p>I am {{marital_status}}. {{#if spouse_name}}My spouse's name is {{spouse_name}}.{{/if}}</p>
          {{#if children}}
          <p>I have the following children:</p>
          <ul>
            {{#each children}}
            <li>{{name}}, born {{birth_date}}</li>
            {{/each}}
          </ul>
          {{/if}}
          
          <h3>ARTICLE III - DISPOSITION OF PROPERTY</h3>
          <p>I give, devise and bequeath all of my property, both real and personal, of every kind and nature, and wherever situated, to {{primary_beneficiary}}.</p>
          
          <p>IN WITNESS WHEREOF, I have hereunto set my hand this {{execution_date}}.</p>
          
          <div class="signature-block">
            <p>_________________________</p>
            <p>{{client_name}}, Testator</p>
          </div>
          
          <div class="witness-block">
            <h4>WITNESSES:</h4>
            <p>We, the undersigned, certify that in our presence on the date written below, the above-named Testator signed the foregoing instrument...</p>
            
            <div class="witness-signatures">
              <div class="witness">
                <p>_________________________</p>
                <p>Witness #1</p>
                <p>Date: _______________</p>
              </div>
              <div class="witness">
                <p>_________________________</p>
                <p>Witness #2</p>
                <p>Date: _______________</p>
              </div>
            </div>
          </div>
        </div>
      `,
      structured: {
        document_type: 'will',
        title: 'Last Will and Testament',
        sections: [
          {
            title: 'Identification',
            content: 'Personal information and residence details',
            variables: ['client_name', 'client_address', 'client_dob']
          },
          {
            title: 'Family Information',
            content: 'Marital status and children details',
            variables: ['marital_status', 'spouse_name', 'children']
          },
          {
            title: 'Property Disposition',
            content: 'Distribution of assets and property',
            variables: ['primary_beneficiary']
          }
        ]
      }
    },
    variables: {
      client_name: 'John Robert Smith',
      client_address: '123 Main Street, Downtown City, State 12345',
      client_dob: 'January 15, 1965',
      marital_status: 'married',
      spouse_name: 'Mary Elizabeth Smith',
      children: [
        { name: 'Michael Smith', birth_date: 'March 10, 1995' },
        { name: 'Sarah Smith', birth_date: 'August 22, 1997' }
      ],
      primary_beneficiary: 'my spouse, Mary Elizabeth Smith, if she survives me, otherwise to my children in equal shares',
      execution_date: new Date().toLocaleDateString('en-US', { 
        year: 'numeric', 
        month: 'long', 
        day: 'numeric' 
      })
    }
  },
  'template-2': {
    name: 'Contract Amendment',
    content: {
      html: `
        <div class="legal-document">
          <h1>AMENDMENT TO CONTRACT</h1>
          
          <p>This Amendment ("Amendment") is entered into on {{amendment_date}} between {{party_1_name}} ("Party A") and {{party_2_name}} ("Party B").</p>
          
          <h3>RECITALS</h3>
          <p>WHEREAS, the parties entered into a {{original_contract_type}} dated {{original_contract_date}} ("Original Contract");</p>
          <p>WHEREAS, the parties desire to amend certain provisions of the Original Contract;</p>
          
          <h3>AMENDMENTS</h3>
          <p>The following provisions of the Original Contract are hereby amended as follows:</p>
          
          <ol>
            {{#each amendments}}
            <li><strong>{{section}}:</strong> {{description}}</li>
            {{/each}}
          </ol>
          
          <h3>MISCELLANEOUS</h3>
          <p>Except as specifically amended herein, all other terms and conditions of the Original Contract remain in full force and effect.</p>
          
          <div class="signature-block">
            <div class="party-signature">
              <p>{{party_1_name}}</p>
              <p>_________________________</p>
              <p>Date: _______________</p>
            </div>
            <div class="party-signature">
              <p>{{party_2_name}}</p>
              <p>_________________________</p>
              <p>Date: _______________</p>
            </div>
          </div>
        </div>
      `,
      structured: {
        document_type: 'contract_amendment',
        title: 'Amendment to Contract',
        sections: [
          {
            title: 'Parties',
            content: 'Identification of contracting parties',
            variables: ['party_1_name', 'party_2_name']
          },
          {
            title: 'Original Contract Reference',
            content: 'Details of the contract being amended',
            variables: ['original_contract_type', 'original_contract_date']
          },
          {
            title: 'Amendments',
            content: 'Specific changes to the original contract',
            variables: ['amendments']
          }
        ]
      }
    },
    variables: {
      amendment_date: new Date().toLocaleDateString(),
      party_1_name: 'TechCorp Innovations Inc.',
      party_2_name: 'Global Solutions LLC',
      original_contract_type: 'Software License Agreement',
      original_contract_date: 'June 1, 2024',
      amendments: [
        {
          section: 'Section 3.2 - License Fee',
          description: 'The annual license fee is hereby increased from $10,000 to $12,000, effective January 1, 2025.'
        },
        {
          section: 'Section 5.1 - Term',
          description: 'The initial term is extended by an additional 12 months, ending December 31, 2026.'
        }
      ]
    }
  }
}

// Global preview state
const previewCache = ref<Map<string, PreviewResponse>>(new Map())

/**
 * Composable for document preview functionality
 */
export function useDocumentPreview() {
  // State
  const previewContent = ref<string>('')
  const previewLoading = ref(false)
  const previewError = ref<string | null>(null)
  const previewStats = ref<PreviewStats | null>(null)
  const lastRefresh = ref<Date | null>(null)

  // Helper to generate cache key
  const getCacheKey = (request: PreviewRequest): string => {
    return `${request.templateId}-${request.matterId}-${request.format}`
  }

  // Helper to simulate realistic render times
  const simulateRenderTime = (format: string): number => {
    switch (format) {
      case 'html': return 200 + Math.random() * 300 // 200-500ms
      case 'pdf': return 800 + Math.random() * 700 // 800-1500ms
      case 'structured': return 100 + Math.random() * 200 // 100-300ms
      default: return 300
    }
  }

  // Helper to process template content
  const processTemplate = (template: any, variables: Record<string, any>): string => {
    let content = template

    // Simple template processing (in real implementation, use proper template engine)
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`{{${key}}}`, 'g')
      
      if (typeof value === 'string') {
        content = content.replace(regex, value)
      } else if (Array.isArray(value)) {
        // Handle arrays (like children)
        const arrayContent = value.map(item => {
          if (typeof item === 'object') {
            return Object.entries(item).map(([k, v]) => `${k}: ${v}`).join(', ')
          }
          return String(item)
        }).join('; ')
        content = content.replace(regex, arrayContent)
      } else if (typeof value === 'object') {
        content = content.replace(regex, JSON.stringify(value))
      } else {
        content = content.replace(regex, String(value))
      }
    })

    // Handle conditional blocks (simplified)
    content = content.replace(/{{#if\s+(\w+)}}([\s\S]*?){{\/if}}/g, (match, condition, innerContent) => {
      return variables[condition] ? innerContent : ''
    })

    // Handle each blocks (simplified)
    content = content.replace(/{{#each\s+(\w+)}}([\s\S]*?){{\/each}}/g, (match, arrayName, itemTemplate) => {
      const array = variables[arrayName]
      if (!Array.isArray(array)) return ''
      
      return array.map(item => {
        let itemContent = itemTemplate
        if (typeof item === 'object') {
          Object.entries(item).forEach(([key, value]) => {
            itemContent = itemContent.replace(new RegExp(`{{${key}}}`, 'g'), String(value))
          })
        }
        return itemContent
      }).join('')
    })

    return content
  }

  // Generate PDF preview URL (mock)
  const generatePdfPreviewUrl = (content: string): string => {
    // In real implementation, this would send content to PDF generation service
    // For now, return a mock PDF URL
    const blob = new Blob([content], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }

  // Main preview generation method
  const generatePreview = async (request: PreviewRequest): Promise<PreviewResponse> => {
    const startTime = Date.now()
    
    // Check cache first
    const cacheKey = getCacheKey(request)
    if (previewCache.value.has(cacheKey)) {
      const cached = previewCache.value.get(cacheKey)!
      return cached
    }

    // Simulate API delay
    const renderTime = simulateRenderTime(request.format)
    await new Promise(resolve => setTimeout(resolve, renderTime))

    // Get mock template data
    const templateKey = `template-${request.templateId.split('-').pop() || '1'}`
    const templateData = mockTemplateData[templateKey] || mockTemplateData['template-1']

    let content: string
    let variableCount: number

    switch (request.format) {
      case 'html':
        content = processTemplate(templateData.content.html, templateData.variables)
        variableCount = Object.keys(templateData.variables).length
        break
        
      case 'pdf':
        const htmlContent = processTemplate(templateData.content.html, templateData.variables)
        content = generatePdfPreviewUrl(htmlContent)
        variableCount = Object.keys(templateData.variables).length
        break
        
      case 'structured':
        content = JSON.stringify({
          ...templateData.content.structured,
          variables: templateData.variables,
          processed_at: new Date().toISOString()
        }, null, 2)
        variableCount = Object.keys(templateData.variables).length
        break
        
      default:
        throw new Error(`Unsupported preview format: ${request.format}`)
    }

    const response: PreviewResponse = {
      content,
      format: request.format,
      variables: templateData.variables,
      metadata: {
        pages: Math.ceil(content.length / 2000), // Rough page estimation
        renderTime: Date.now() - startTime,
        variableCount,
        lastModified: new Date()
      }
    }

    // Cache the response
    previewCache.value.set(cacheKey, response)

    return response
  }

  // Public method to refresh preview
  const refreshPreview = async (request: PreviewRequest): Promise<void> => {
    try {
      previewLoading.value = true
      previewError.value = null

      // Clear cache for this request
      const cacheKey = getCacheKey(request)
      previewCache.value.delete(cacheKey)

      const response = await generatePreview(request)
      
      previewContent.value = response.content
      previewStats.value = {
        variables: response.metadata.variableCount,
        pages: response.metadata.pages,
        renderTime: response.metadata.renderTime,
        lastModified: response.metadata.lastModified
      }
      lastRefresh.value = new Date()

    } catch (error) {
      previewError.value = error instanceof Error ? error.message : 'Preview generation failed'
      previewContent.value = ''
      previewStats.value = null
    } finally {
      previewLoading.value = false
    }
  }

  // Clear preview state
  const clearPreview = (): void => {
    previewContent.value = ''
    previewError.value = null
    previewStats.value = null
    lastRefresh.value = null
  }

  // Clear all cached previews
  const clearPreviewCache = (): void => {
    previewCache.value.clear()
  }

  // Get cached preview if available
  const getCachedPreview = (request: PreviewRequest): PreviewResponse | null => {
    const cacheKey = getCacheKey(request)
    return previewCache.value.get(cacheKey) || null
  }

  return {
    // State
    previewContent,
    previewLoading,
    previewError,
    previewStats,
    lastRefresh,
    
    // Methods
    generatePreview,
    refreshPreview,
    clearPreview,
    clearPreviewCache,
    getCachedPreview
  }
}

/**
 * Composable for preview format conversion utilities
 */
export function usePreviewFormat() {
  const convertHtmlToPdf = async (htmlContent: string): Promise<string> => {
    // Mock PDF conversion - in real implementation, would use PDF generation service
    const blob = new Blob([htmlContent], { type: 'text/html' })
    return URL.createObjectURL(blob)
  }

  const convertToStructured = (htmlContent: string): any => {
    // Mock conversion to structured format
    return {
      type: 'document',
      content: htmlContent.replace(/<[^>]*>/g, ''), // Strip HTML tags
      metadata: {
        generated_at: new Date().toISOString(),
        format: 'structured'
      }
    }
  }

  const validateFormat = (format: string): boolean => {
    return ['html', 'pdf', 'structured'].includes(format)
  }

  return {
    convertHtmlToPdf,
    convertToStructured,
    validateFormat
  }
}

/**
 * Computed properties for preview statistics
 */
export function usePreviewStats(previewContent: Ref<string>, format: string) {
  const wordCount = computed(() => {
    if (!previewContent.value) return 0
    return previewContent.value.split(/\s+/).filter(word => word.length > 0).length
  })

  const characterCount = computed(() => {
    return previewContent.value.length
  })

  const estimatedPages = computed(() => {
    // Rough estimation: 250 words per page for legal documents
    return Math.ceil(wordCount.value / 250) || 1
  })

  const estimatedReadTime = computed(() => {
    // Average reading speed: 200 words per minute for legal documents
    return Math.ceil(wordCount.value / 200) || 1
  })

  return {
    wordCount,
    characterCount,
    estimatedPages,
    estimatedReadTime
  }
}