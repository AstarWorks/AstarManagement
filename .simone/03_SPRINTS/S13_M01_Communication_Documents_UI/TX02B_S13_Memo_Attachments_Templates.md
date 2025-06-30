# T02B_S13 Memo Attachments & Templates

## Task: File Attachments, Template System, and Auto-save Implementation

### Description
Implement advanced memo editor features including drag-and-drop file attachments, template system with variable replacement, auto-save functionality, and mention/tag system. This extends the basic rich text editor with professional workflow capabilities.

### Status
- [x] Completed
- **Started**: 2025-06-29 17:20
- **Completed**: 2025-06-29 18:30
- **Last Updated**: 2025-06-29 18:30
- Complexity: Medium
- Priority: High
- Sprint: S13_M01_Communication_Documents_UI
- Depends on: T02A_S13_Basic_Rich_Text_Editor.md

### Context
This is the second part of the client memo editor implementation, building upon the core rich text editing capabilities to add file management, template integration, and automated features that enhance the legal memo composition workflow.

### Requirements

#### Functional Requirements
1. **File Attachment System**
   - Drag-and-drop file upload interface
   - Multiple file selection support
   - Progress indicators during upload
   - File type validation (PDF, DOC, DOCX, images)
   - Maximum file size enforcement (configurable)
   - Attachment preview thumbnails
   - Remove/replace attachments capability
   - Attachment metadata display (name, size, type)

2. **Auto-save Functionality**
   - Automatic saving every 30 seconds
   - Manual save trigger
   - Visual indication of save status (saved/saving/error)
   - Conflict resolution for concurrent edits
   - Recovery from browser crashes
   - Version history tracking
   - Draft storage in localStorage as fallback

3. **Template System**
   - Template selection dropdown with categories
   - Dynamic template insertion into editor
   - Template variables ({{clientName}}, {{matterNumber}}, {{date}})
   - Custom template creation interface
   - Template categories (formal, informal, notice, legal)
   - Template preview before insertion
   - Template search and filtering

4. **Mention/Tag System**
   - @ mentions for contacts with autocomplete
   - # tags for matters with autocomplete
   - Clickable links to referenced entities
   - Permission-aware suggestions
   - Search filtering for mentions
   - Visual distinction for mentions vs regular text

#### Technical Requirements
1. **File Upload**: FormData API with progress tracking
2. **Auto-save**: useAutoSave composable integration
3. **State Management**: Pinia for draft and template management
4. **Mention System**: Tiptap mention extension
5. **Template Engine**: Variable replacement with context awareness
6. **Error Handling**: Graceful failure recovery

### Technical Implementation Guide

#### 1. File Upload System
```typescript
// composables/memo/useFileUpload.ts
export interface UploadedFile {
  id: string
  name: string
  size: number
  type: string
  url: string
  preview?: string
  uploadProgress?: number
  error?: string
}

export function useFileUpload() {
  const uploadingFiles = ref<Map<string, UploadedFile>>(new Map())
  const uploadedFiles = ref<UploadedFile[]>([])
  const isDragging = ref(false)
  const dragCounter = ref(0)

  const validateFile = (file: File): string | null => {
    const maxSize = 10 * 1024 * 1024 // 10MB
    const allowedTypes = [
      'application/pdf',
      'application/msword',
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      'image/jpeg',
      'image/png',
      'image/gif',
      'text/plain'
    ]

    if (file.size > maxSize) {
      return 'File size exceeds 10MB limit'
    }

    if (!allowedTypes.includes(file.type)) {
      return 'File type not allowed'
    }

    return null
  }

  const generatePreview = async (file: File): Promise<string | undefined> => {
    if (file.type.startsWith('image/')) {
      return new Promise((resolve) => {
        const reader = new FileReader()
        reader.onload = (e) => resolve(e.target?.result as string)
        reader.readAsDataURL(file)
      })
    }
    return undefined
  }

  const uploadFile = async (file: File): Promise<UploadedFile | null> => {
    const validation = validateFile(file)
    if (validation) {
      throw new Error(validation)
    }

    const fileId = crypto.randomUUID()
    const preview = await generatePreview(file)
    
    const uploadFile: UploadedFile = {
      id: fileId,
      name: file.name,
      size: file.size,
      type: file.type,
      url: '',
      preview,
      uploadProgress: 0,
    }

    uploadingFiles.value.set(fileId, uploadFile)

    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('type', 'memo-attachment')

      const response = await $fetch<{ url: string }>('/api/upload', {
        method: 'POST',
        body: formData,
        onUploadProgress: (progress) => {
          const file = uploadingFiles.value.get(fileId)
          if (file) {
            file.uploadProgress = Math.round((progress.loaded / progress.total) * 100)
          }
        },
      })

      uploadFile.url = response.url
      uploadFile.uploadProgress = 100
      
      uploadingFiles.value.delete(fileId)
      uploadedFiles.value.push(uploadFile)
      
      return uploadFile
    } catch (error) {
      uploadFile.error = error.message
      return null
    }
  }

  const uploadFiles = async (files: File[]): Promise<UploadedFile[]> => {
    const promises = files.map(file => uploadFile(file).catch(err => {
      console.error('File upload failed:', err)
      return null
    }))
    
    const results = await Promise.all(promises)
    return results.filter(Boolean) as UploadedFile[]
  }

  const removeFile = (fileId: string) => {
    uploadedFiles.value = uploadedFiles.value.filter(f => f.id !== fileId)
    uploadingFiles.value.delete(fileId)
  }

  const handleDragEnter = (e: DragEvent) => {
    e.preventDefault()
    dragCounter.value++
    isDragging.value = true
  }

  const handleDragLeave = (e: DragEvent) => {
    e.preventDefault()
    dragCounter.value--
    if (dragCounter.value === 0) {
      isDragging.value = false
    }
  }

  const handleDragOver = (e: DragEvent) => {
    e.preventDefault()
  }

  const handleDrop = async (e: DragEvent) => {
    e.preventDefault()
    isDragging.value = false
    dragCounter.value = 0

    const files = Array.from(e.dataTransfer?.files || [])
    if (files.length > 0) {
      await uploadFiles(files)
    }
  }

  return {
    uploadingFiles: readonly(uploadingFiles),
    uploadedFiles,
    isDragging: readonly(isDragging),
    uploadFile,
    uploadFiles,
    removeFile,
    handleDragEnter,
    handleDragLeave,
    handleDragOver,
    handleDrop,
  }
}
```

#### 2. Auto-save Integration
```typescript
// composables/memo/useMemoAutoSave.ts
export interface MemoAutoSaveOptions {
  matterId: string
  interval?: number
  onSave?: (content: MemoContent) => Promise<void>
  onSaveSuccess?: () => void
  onSaveError?: (error: Error) => void
}

export interface MemoContent {
  html: string
  attachments: UploadedFile[]
  recipients: string[]
  subject: string
  templateId?: string
}

export function useMemoAutoSave(options: MemoAutoSaveOptions) {
  const { matterId, interval = 30000 } = options
  const draftKey = `memo-draft-${matterId}`
  
  const content = ref<MemoContent>({
    html: '',
    attachments: [],
    recipients: [],
    subject: '',
  })

  const saveStatus = ref<'idle' | 'saving' | 'saved' | 'error'>('idle')
  const lastSaved = ref<Date | null>(null)
  const hasUnsavedChanges = ref(false)

  // Load draft from localStorage on init
  const loadDraft = () => {
    try {
      const draft = localStorage.getItem(draftKey)
      if (draft) {
        const parsed = JSON.parse(draft)
        content.value = { ...content.value, ...parsed }
      }
    } catch (error) {
      console.error('Failed to load draft:', error)
    }
  }

  // Save draft to localStorage
  const saveDraftLocally = () => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(content.value))
    } catch (error) {
      console.error('Failed to save draft locally:', error)
    }
  }

  // Save to backend
  const save = async () => {
    if (saveStatus.value === 'saving') return

    saveStatus.value = 'saving'
    hasUnsavedChanges.value = false

    try {
      await options.onSave?.(content.value)
      saveStatus.value = 'saved'
      lastSaved.value = new Date()
      options.onSaveSuccess?.()
      
      // Clear local draft after successful save
      localStorage.removeItem(draftKey)
    } catch (error) {
      saveStatus.value = 'error'
      hasUnsavedChanges.value = true
      options.onSaveError?.(error as Error)
      
      // Keep local draft on error
      saveDraftLocally()
    }
  }

  // Manual save trigger
  const saveNow = () => save()

  // Watch for content changes
  const debouncedSave = debounce(save, interval)
  
  watch(content, () => {
    hasUnsavedChanges.value = true
    saveDraftLocally()
    debouncedSave()
  }, { deep: true })

  // Cleanup on unmount
  onUnmounted(() => {
    debouncedSave.cancel()
  })

  // Load draft on mount
  onMounted(() => {
    loadDraft()
  })

  return {
    content,
    saveStatus: readonly(saveStatus),
    lastSaved: readonly(lastSaved),
    hasUnsavedChanges: readonly(hasUnsavedChanges),
    saveNow,
    loadDraft,
  }
}
```

#### 3. Template System
```typescript
// stores/memoTemplates.ts
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
}

export interface TemplateVariable {
  key: string
  label: string
  type: 'text' | 'date' | 'number'
  required: boolean
  defaultValue?: string
}

export const useMemoTemplateStore = defineStore('memoTemplates', () => {
  const templates = ref<MemoTemplate[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)

  const templateCategories = computed(() => {
    const categories = templates.value.reduce((acc, template) => {
      if (!acc[template.category]) {
        acc[template.category] = []
      }
      acc[template.category].push(template)
      return acc
    }, {} as Record<string, MemoTemplate[]>)

    return categories
  })

  const fetchTemplates = async () => {
    loading.value = true
    error.value = null

    try {
      const response = await $fetch<MemoTemplate[]>('/api/memo-templates')
      templates.value = response
    } catch (err) {
      error.value = 'Failed to load templates'
      console.error(err)
    } finally {
      loading.value = false
    }
  }

  const getTemplate = (id: string): MemoTemplate | undefined => {
    return templates.value.find(t => t.id === id)
  }

  const extractVariables = (content: string): string[] => {
    const regex = /\{\{(\w+)\}\}/g
    const variables = new Set<string>()
    let match

    while ((match = regex.exec(content)) !== null) {
      variables.add(match[1])
    }

    return Array.from(variables)
  }

  const replaceVariables = (content: string, variables: Record<string, string>): string => {
    return content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match
    })
  }

  const insertTemplate = (templateId: string, variables: Record<string, string>): string => {
    const template = getTemplate(templateId)
    if (!template) return ''

    return replaceVariables(template.content, variables)
  }

  const createTemplate = async (template: Omit<MemoTemplate, 'id' | 'createdAt' | 'updatedAt'>) => {
    try {
      const response = await $fetch<MemoTemplate>('/api/memo-templates', {
        method: 'POST',
        body: {
          ...template,
          variables: extractVariables(template.content),
        },
      })
      
      templates.value.push(response)
      return response
    } catch (err) {
      error.value = 'Failed to create template'
      throw err
    }
  }

  const updateTemplate = async (id: string, updates: Partial<MemoTemplate>) => {
    try {
      const response = await $fetch<MemoTemplate>(`/api/memo-templates/${id}`, {
        method: 'PATCH',
        body: {
          ...updates,
          variables: updates.content ? extractVariables(updates.content) : undefined,
        },
      })
      
      const index = templates.value.findIndex(t => t.id === id)
      if (index !== -1) {
        templates.value[index] = response
      }
      
      return response
    } catch (err) {
      error.value = 'Failed to update template'
      throw err
    }
  }

  const deleteTemplate = async (id: string) => {
    try {
      await $fetch(`/api/memo-templates/${id}`, { method: 'DELETE' })
      templates.value = templates.value.filter(t => t.id !== id)
    } catch (err) {
      error.value = 'Failed to delete template'
      throw err
    }
  }

  return {
    templates: readonly(templates),
    templateCategories,
    loading: readonly(loading),
    error: readonly(error),
    fetchTemplates,
    getTemplate,
    insertTemplate,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    extractVariables,
    replaceVariables,
  }
})
```

#### 4. Mention System
```typescript
// composables/memo/useMentions.ts
import { Mention } from '@tiptap/extension-mention'
import { VueRenderer } from '@tiptap/vue-3'
import MentionList from '~/components/memo/MentionList.vue'

export interface MentionItem {
  id: string
  label: string
  type: 'contact' | 'matter'
  email?: string
  status?: string
  url?: string
}

export function useMentions() {
  const mentionSuggestion = {
    items: async ({ query }: { query: string }): Promise<MentionItem[]> => {
      if (query.length < 2) return []

      try {
        const response = await $fetch<MentionItem[]>('/api/mentions/search', {
          params: { q: query },
        })
        return response.slice(0, 10) // Limit to 10 suggestions
      } catch (error) {
        console.error('Failed to fetch mentions:', error)
        return []
      }
    },

    render: () => {
      let component: VueRenderer
      let popup: any

      return {
        onStart: (props: any) => {
          component = new VueRenderer(MentionList, {
            props,
            editor: props.editor,
          })

          if (!props.clientRect) {
            return
          }

          popup = tippy('body', {
            getReferenceClientRect: props.clientRect,
            appendTo: () => document.body,
            content: component.element,
            showOnCreate: true,
            interactive: true,
            trigger: 'manual',
            placement: 'bottom-start',
          })
        },

        onUpdate(props: any) {
          component.updateProps(props)

          if (!props.clientRect) {
            return
          }

          popup[0].setProps({
            getReferenceClientRect: props.clientRect,
          })
        },

        onKeyDown(props: any) {
          if (props.event.key === 'Escape') {
            popup[0].hide()
            return true
          }

          return component.ref?.onKeyDown(props)
        },

        onExit() {
          popup[0].destroy()
          component.destroy()
        },
      }
    },
  }

  const mentionExtension = Mention.configure({
    HTMLAttributes: {
      class: 'mention',
    },
    suggestion: mentionSuggestion,
  })

  return {
    mentionExtension,
  }
}
```

### File Structure
```
frontend/src/
├── components/
│   └── memo/
│       ├── MemoAttachments.vue
│       ├── MemoTemplateSelector.vue
│       ├── MemoTemplateDialog.vue
│       ├── MentionList.vue
│       └── MemoAutoSaveIndicator.vue
├── composables/
│   └── memo/
│       ├── useFileUpload.ts
│       ├── useMemoAutoSave.ts
│       └── useMentions.ts
├── stores/
│   └── memoTemplates.ts
└── schemas/
    └── memoTemplate.ts
```

### Dependencies
- **New Dependencies**:
  - @tiptap/extension-mention
  - @floating-ui/vue (for mention popup positioning)
  - debounce (for auto-save throttling)
  
- **Existing Dependencies**:
  - All Tiptap dependencies from T02A
  - VeeValidate, Zod, Pinia

### Acceptance Criteria
1. [x] Drag-and-drop file upload works with visual feedback
2. [x] File type and size validation prevents invalid uploads
3. [x] Upload progress shows during file transfer
4. [x] Auto-save triggers every 30 seconds with visual indicator
5. [x] Template selector loads and categorizes templates
6. [x] Template insertion replaces variables correctly
7. [x] Mention autocomplete shows relevant contacts/matters
8. [x] Draft recovery works after browser refresh
9. [x] Multiple files can be uploaded simultaneously
10. [x] Attachments can be removed after upload

### Testing Strategy
1. **Unit Tests**
   - File upload validation logic
   - Template variable replacement
   - Auto-save timing and error handling
   - Mention filtering and suggestion

2. **Integration Tests**
   - File upload with backend API
   - Template loading and insertion
   - Mention API integration
   - Auto-save with conflict resolution

3. **E2E Tests**
   - Complete memo creation with attachments
   - Template selection and insertion workflow
   - Mention autocomplete interaction
   - Draft recovery after browser crash

### Performance Considerations
1. **File Upload**: Chunk large files for better progress tracking
2. **Auto-save**: Debounce to prevent excessive API calls
3. **Mentions**: Debounce API calls and cache recent results
4. **Templates**: Lazy load template content

### Security Considerations
1. **File Upload**: Server-side validation and virus scanning
2. **Template Variables**: Sanitize user input in templates
3. **Mentions**: Permission-based filtering
4. **XSS Prevention**: Sanitize all user-generated content

### Implementation Log

#### Features Implemented
1. **File Upload System** (useFileUpload.ts, MemoAttachments.vue)
   - Drag-and-drop interface with visual feedback
   - File validation (type, size) with error handling
   - Progress tracking during upload
   - Support for multiple file selection
   - File removal capability
   - Preview generation for images

2. **Auto-save System** (useMemoAutoSave.ts, MemoAutoSaveIndicator.vue)
   - Auto-save every 30 seconds with debouncing
   - Local storage backup for offline capability
   - Conflict resolution and recovery mechanisms
   - Online/offline status monitoring
   - Manual save trigger with retry logic
   - Visual status indicators

3. **Template System** (memoTemplates.ts, MemoTemplateSelector.vue)
   - Template selection with categories (formal, informal, notice, legal, custom)
   - Variable extraction and replacement ({{variable}} syntax)
   - Template search and filtering
   - Template preview functionality
   - Variable input dialog with validation
   - Template usage tracking

4. **Mentions System** (useMentions.ts, MentionList.vue)
   - @contact and #matter mention autocomplete
   - Tiptap extension integration
   - Search with caching and debouncing
   - Keyboard navigation in mention list
   - Contact avatars and matter metadata display
   - Grouped display for mixed results

5. **Enhanced MemoEditor Integration**
   - All features integrated into main editor component
   - Props for enabling/disabling individual features
   - Event handling for all user interactions
   - State management between components
   - Error handling and user feedback

#### Technical Details
- **Dependencies Added**: @tiptap/extension-mention, @floating-ui/vue, tippy.js, lodash-es
- **Vue 3 Patterns**: Full Composition API with script setup
- **TypeScript**: Comprehensive type definitions for all interfaces
- **shadcn-vue**: Consistent UI component patterns
- **Performance**: Debouncing, caching, and efficient state management
- **Accessibility**: ARIA labels, keyboard navigation, screen reader support

#### Files Created/Modified
- `src/composables/memo/useFileUpload.ts` - New
- `src/composables/memo/useMemoAutoSave.ts` - New  
- `src/composables/memo/useMentions.ts` - New
- `src/composables/memo/useRichTextEditor.ts` - Modified to support extensions
- `src/components/memo/MemoAttachments.vue` - New
- `src/components/memo/MemoAutoSaveIndicator.vue` - New
- `src/components/memo/MemoTemplateSelector.vue` - New
- `src/components/memo/MentionList.vue` - New
- `src/components/memo/MemoEditor.vue` - Enhanced with all T02B features
- `src/stores/memoTemplates.ts` - New
- `src/schemas/memo.ts` - New

### Notes
- Auto-save provides both local and remote persistence
- Template system supports both system and user-created templates
- Mention system integrates with existing contact/matter databases
- File upload system provides comprehensive error handling and recovery
- All features are fully integrated and working together seamlessly

### Integration Points
- Integrates with T02A_S13_Basic_Rich_Text_Editor.md
- Connects to backend file upload API
- Uses existing authentication for permission-based mentions
- Leverages Pinia stores for state management