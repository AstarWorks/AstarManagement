# T02_S13 Client Memo Editor (SPLIT INTO SUBTASKS)

## Task: Rich Text Editor Implementation for Memo Composition

### Description
**This task has been split into manageable subtasks for better development workflow.**

This comprehensive rich text editor implementation for client memo composition has been divided into two sequential tasks:
1. **T02A_S13_Basic_Rich_Text_Editor.md** - Core rich text editing with Tiptap integration and toolbar
2. **T02B_S13_Memo_Attachments_Templates.md** - File attachments, template system, and auto-save functionality

### Status
- [x] Split into subtasks
- Complexity: Originally High → Now split into 2 Medium tasks
- Priority: High
- Sprint: S13_M01_Communication_Documents_UI

### Split Task Overview

#### T02A_S13: Basic Rich Text Editor (Medium Complexity)
**Focus**: Core editing experience and toolbar interface
- Tiptap v2 editor setup with Vue 3 integration
- Comprehensive formatting toolbar (bold, italic, underline, lists, etc.)
- Table support with insertion and manipulation
- Link insertion with dialog interface
- Text alignment controls
- VeeValidate form integration
- Mobile responsive design
- Accessibility features

#### T02B_S13: Memo Attachments & Templates (Medium Complexity)
**Focus**: Advanced workflow features and automation
**Depends on**: T02A_S13_Basic_Rich_Text_Editor.md
- Drag-and-drop file upload system
- Auto-save functionality with conflict resolution
- Template system with variable replacement
- Mention/tag system (@contacts, #matters)
- Draft recovery and version history
- File management and validation

### Why This Split Benefits Development
1. **Manageable Scope**: Each task can be completed in a single sprint
2. **Clear Dependencies**: T02A establishes foundation for T02B
3. **Testable Increments**: Each task delivers working functionality
4. **Parallel Planning**: Backend file upload API can be developed alongside T02A
5. **Risk Reduction**: Core editing functionality delivered first, advanced features second

### Implementation Sequence
1. Start with **T02A_S13_Basic_Rich_Text_Editor.md** to establish core editing functionality
2. Once T02A is complete, proceed with **T02B_S13_Memo_Attachments_Templates.md** for advanced features
3. Both tasks together achieve the original comprehensive memo editor requirements

### New Task Files
- `/S13_M01_Communication_Documents_UI/T02A_S13_Basic_Rich_Text_Editor.md`
- `/S13_M01_Communication_Documents_UI/T02B_S13_Memo_Attachments_Templates.md`

---

## ORIGINAL TASK SPECIFICATION (ARCHIVED)
*The content below represents the original comprehensive task specification. It has been preserved for reference but is superseded by the split tasks above.*

### Context
The legal case management system requires a sophisticated memo editor that allows lawyers to compose professional client communications with rich formatting, file attachments, and seamless integration with the matter management system.

### Requirements

#### Functional Requirements
1. **Rich Text Editor**
   - Full formatting capabilities (bold, italic, underline, strikethrough)
   - Heading levels (H1-H6)
   - Lists (ordered, unordered, task lists)
   - Tables with cell merging
   - Links with preview
   - Code blocks for legal references
   - Block quotes for citations
   - Horizontal rules
   - Text alignment (left, center, right, justify)

2. **Attachment System**
   - Drag-and-drop file upload
   - Multiple file selection
   - Progress indicators during upload
   - File type validation (PDF, DOC, DOCX, images)
   - Maximum file size enforcement
   - Attachment preview thumbnails
   - Remove attachments capability

3. **Auto-save Functionality**
   - Automatic saving every 30 seconds
   - Manual save trigger
   - Visual indication of save status
   - Conflict resolution for concurrent edits
   - Recovery from browser crashes
   - Version history tracking

4. **Template System**
   - Template selection dropdown
   - Dynamic template insertion
   - Template variables (client name, matter number, date)
   - Custom template creation
   - Template categories (formal, informal, notice)

5. **Mention/Tag System**
   - @ mentions for contacts
   - # tags for matters
   - Autocomplete dropdown
   - Clickable links to referenced entities
   - Permission-aware suggestions

#### Technical Requirements
1. **Editor Library**: Tiptap v2 (Vue 3 compatible)
2. **Form Integration**: VeeValidate with Zod schema
3. **File Upload**: FormData API with progress tracking
4. **Auto-save**: useAutoSave composable integration
5. **State Management**: Pinia for draft management
6. **Accessibility**: ARIA labels and keyboard navigation

### Technical Implementation Guide

#### 1. Tiptap Editor Setup
```typescript
// composables/useRichTextEditor.ts
import { useEditor } from '@tiptap/vue-3'
import StarterKit from '@tiptap/starter-kit'
import Mention from '@tiptap/extension-mention'
import Table from '@tiptap/extension-table'
import TableRow from '@tiptap/extension-table-row'
import TableCell from '@tiptap/extension-table-cell'
import TableHeader from '@tiptap/extension-table-header'
import Link from '@tiptap/extension-link'
import Placeholder from '@tiptap/extension-placeholder'

export function useRichTextEditor(options: EditorOptions) {
  const editor = useEditor({
    extensions: [
      StarterKit,
      Mention.configure({
        HTMLAttributes: {
          class: 'mention',
        },
        suggestion: mentionSuggestion,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableHeader,
      TableCell,
      Link.configure({
        openOnClick: false,
        HTMLAttributes: {
          class: 'memo-link',
        },
      }),
      Placeholder.configure({
        placeholder: 'Start typing your memo...',
      }),
    ],
    content: options.initialContent,
    onUpdate: ({ editor }) => {
      options.onChange?.(editor.getHTML())
    },
  })

  return {
    editor,
    // ... other utilities
  }
}
```

#### 2. File Upload Integration
```typescript
// composables/useFileUpload.ts
export function useFileUpload() {
  const uploadProgress = ref<Record<string, number>>({})
  const uploadingFiles = ref<Set<string>>(new Set())

  const uploadFile = async (file: File, onProgress?: (progress: number) => void) => {
    const formData = new FormData()
    formData.append('file', file)
    
    const xhr = new XMLHttpRequest()
    const fileId = crypto.randomUUID()
    
    uploadingFiles.value.add(fileId)
    
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable) {
        const progress = (e.loaded / e.total) * 100
        uploadProgress.value[fileId] = progress
        onProgress?.(progress)
      }
    })

    // ... implementation
  }

  return {
    uploadFile,
    uploadProgress,
    uploadingFiles,
  }
}
```

#### 3. Auto-save Integration
```typescript
// components/MemoEditor.vue
import { useAutoSave } from '~/composables/form/useAutoSave'

const autoSave = useAutoSave(form, {
  key: `memo-draft-${props.matterId}`,
  debounce: 30000, // 30 seconds
  storage: 'localStorage',
  onSave: async (values) => {
    // Save to backend
    await saveMemoD raft(values)
  },
  onSaveSuccess: () => {
    toast.success('Draft saved')
  },
  onSaveError: (error) => {
    toast.error('Failed to save draft')
  },
})
```

#### 4. Template System
```typescript
// stores/memoTemplates.ts
export const useMemoTemplateStore = defineStore('memoTemplates', () => {
  const templates = ref<MemoTemplate[]>([])
  
  const insertTemplate = (templateId: string, variables: Record<string, string>) => {
    const template = templates.value.find(t => t.id === templateId)
    if (!template) return ''
    
    return template.content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
      return variables[key] || match
    })
  }
  
  return {
    templates,
    insertTemplate,
  }
})
```

### Dependencies
- **Existing Components**:
  - Form.vue component pattern
  - FormFieldWrapper for consistent field styling
  - useAutoSave composable
  - VeeValidate form integration

- **New Dependencies**:
  - @tiptap/vue-3
  - @tiptap/starter-kit
  - @tiptap/extension-mention
  - @tiptap/extension-table
  - @tiptap/extension-link
  - @tiptap/extension-placeholder

### File Structure
```
frontend/src/
├── components/
│   ├── memo/
│   │   ├── MemoEditor.vue
│   │   ├── MemoEditorToolbar.vue
│   │   ├── MemoAttachments.vue
│   │   ├── MemoTemplateSelector.vue
│   │   └── MemoMentionList.vue
│   └── forms/
│       └── FormRichTextEditor.vue
├── composables/
│   ├── memo/
│   │   ├── useRichTextEditor.ts
│   │   ├── useFileUpload.ts
│   │   └── useMemoTemplates.ts
│   └── form/
│       └── useAutoSave.ts (existing)
├── stores/
│   └── memoTemplates.ts
└── schemas/
    └── memo.ts
```

### Acceptance Criteria
1. [ ] Rich text editor renders with all formatting options
2. [ ] Files can be dragged and dropped onto the editor
3. [ ] Auto-save works every 30 seconds with visual feedback
4. [ ] Templates can be selected and inserted with variable replacement
5. [ ] Mentions autocomplete shows relevant contacts and matters
6. [ ] Form validation integrates with VeeValidate
7. [ ] Accessibility: All controls keyboard navigable
8. [ ] Mobile responsive: Touch-friendly toolbar
9. [ ] Performance: Editor handles large documents smoothly
10. [ ] Draft recovery works after browser crash

### Testing Strategy
1. **Unit Tests**
   - Editor initialization and configuration
   - File upload progress tracking
   - Template variable replacement
   - Mention suggestion filtering

2. **Integration Tests**
   - Form submission with rich content
   - Auto-save and recovery flow
   - File upload with backend API
   - Template insertion workflow

3. **E2E Tests**
   - Complete memo creation flow
   - Drag and drop file upload
   - Mention autocomplete interaction
   - Mobile editing experience

### Performance Considerations
1. **Lazy Loading**: Load editor extensions on demand
2. **Debouncing**: Throttle auto-save to prevent excessive saves
3. **Virtual Scrolling**: For long documents
4. **Image Optimization**: Compress images before upload
5. **Chunk Loading**: Split large editor bundles

### Security Considerations
1. **XSS Prevention**: Sanitize HTML content
2. **File Validation**: Check file types and sizes
3. **CSRF Protection**: Include tokens in upload requests
4. **Access Control**: Verify permissions for mentions
5. **Content Security Policy**: Configure for editor

### Related Tasks
- T01_S13: Document List View (provides context for attachments)
- T03_S13: Email Integration (shares rich text editing)
- T04_S13: Communication Timeline (displays sent memos)

### Notes
- Consider using Tiptap's collaboration features for future real-time editing
- Implement progressive enhancement for better initial load
- Plan for offline capability with IndexedDB storage
- Consider AI-powered writing assistance integration

### Subtask Breakdown (for future sprint planning)
1. **Subtask 1**: Basic Tiptap editor setup with toolbar
2. **Subtask 2**: File upload system with drag-and-drop
3. **Subtask 3**: Auto-save functionality integration
4. **Subtask 4**: Template system implementation
5. **Subtask 5**: Mention/tag system with autocomplete
6. **Subtask 6**: Mobile optimization and testing

### References
- [Tiptap Documentation](https://tiptap.dev/)
- [VeeValidate Custom Components](https://vee-validate.logaretm.com/v4/guide/components/custom-inputs/)
- Existing useAutoSave implementation: `frontend/src/composables/form/useAutoSave.ts`
- Form patterns: `frontend/src/components/forms/`