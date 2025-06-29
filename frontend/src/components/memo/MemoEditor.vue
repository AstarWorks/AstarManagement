<template>
  <div class="memo-editor-container">
    <!-- Auto-save Indicator -->
    <div class="memo-editor-header">
      <div class="auto-save-section">
        <MemoAutoSaveIndicator
          :status="autoSaveStatus"
          :status-text="autoSaveStatusText"
          :has-unsaved-changes="hasUnsavedChanges"
          :is-online="isOnline"
          :can-save="canSave"
          :last-saved="lastSaved"
          :error="saveError"
          @save="handleManualSave"
          @retry="handleRetry"
        />
      </div>
      
      <!-- Template Selector -->
      <div class="template-section">
        <Button
          variant="outline"
          size="sm"
          @click="showTemplateSelector = !showTemplateSelector"
          class="template-toggle"
        >
          <FileText class="h-4 w-4" />
          Templates
          <ChevronDown :class="['h-4 w-4 transition-transform', { 'rotate-180': showTemplateSelector }]" />
        </Button>
      </div>
    </div>

    <!-- Template Selector (Collapsible) -->
    <div v-if="showTemplateSelector" class="template-selector-section">
      <MemoTemplateSelector
        :show-categories="false"
        max-height="300px"
        @template-selected="handleTemplateSelected"
        @template-preview="handleTemplatePreview"
      />
    </div>

    <!-- Toolbar -->
    <MemoEditorToolbar
      :toggle-bold="toggleBold"
      :toggle-italic="toggleItalic"
      :toggle-underline="toggleUnderline"
      :toggle-strike="toggleStrike"
      :toggle-bullet-list="toggleBulletList"
      :toggle-ordered-list="toggleOrderedList"
      :toggle-task-list="toggleTaskList"
      :toggle-blockquote="toggleBlockquote"
      :toggle-code-block="toggleCodeBlock"
      :insert-horizontal-rule="insertHorizontalRule"
      :insert-table="insertTable"
      :insert-link="insertLink"
      :set-heading="setHeading"
      :set-paragraph="setParagraph"
      :set-text-align="setTextAlign"
      :is-active="isActive"
      :undo="undo"
      :redo="redo"
      :can-undo="canUndo"
      :can-redo="canRedo"
    />

    <!-- Main Editor Area -->
    <div class="memo-editor-main">
      <!-- Editor Content with Mentions -->
      <div class="memo-editor-wrapper">
        <EditorContent 
          :editor="editor" 
          class="memo-editor-content"
          :class="{
            'has-error': hasError,
            'is-focused': isFocused
          }"
        />
      </div>
      
      <!-- Attachments Section -->
      <div v-if="showAttachments || attachments.length > 0" class="attachments-section">
        <MemoAttachments
          :max-files="maxAttachments"
          :max-size="maxAttachmentSize"
          :disabled="disabled"
          @files-uploaded="handleFilesUploaded"
          @file-removed="handleFileRemoved"
          @files-cleared="handleFilesCleared"
        />
      </div>
    </div>

    <!-- Editor Footer -->
    <div class="memo-editor-footer">
      <div class="character-count">
        <span class="text-sm text-muted-foreground">
          {{ characterCount }}{{ maxCharacters ? ` / ${maxCharacters}` : '' }} characters
          • {{ wordCount }} words
          <template v-if="attachments.length > 0">
            • {{ attachments.length }} attachment{{ attachments.length === 1 ? '' : 's' }}
          </template>
        </span>
        <span 
          v-if="maxCharacters && characterCount > maxCharacters * 0.9" 
          class="text-warning text-sm ml-2"
        >
          {{ maxCharacters - characterCount }} characters remaining
        </span>
      </div>
      
      <!-- Attachment Toggle -->
      <Button
        variant="ghost"
        size="sm"
        @click="showAttachments = !showAttachments"
        class="attachment-toggle"
      >
        <Paperclip class="h-4 w-4" />
        Attachments
      </Button>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="memo-editor-error">
      <AlertCircle class="h-4 w-4" />
      <span class="text-sm">{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch, onMounted, nextTick } from 'vue'
import { EditorContent } from '@tiptap/vue-3'
import { 
  AlertCircle, 
  FileText, 
  ChevronDown, 
  Paperclip 
} from 'lucide-vue-next'
import { Button } from '~/components/ui/button'
import { useRichTextEditor, type EditorOptions } from '~/composables/memo/useRichTextEditor'
import { useMemoAutoSave, type MemoContent } from '~/composables/memo/useMemoAutoSave'
import { useMentions } from '~/composables/memo/useMentions'
import type { UploadedFile } from '~/composables/memo/useFileUpload'
import type { MemoTemplate } from '~/stores/memoTemplates'
import MemoEditorToolbar from './MemoEditorToolbar.vue'
import MemoAutoSaveIndicator from './MemoAutoSaveIndicator.vue'
import MemoTemplateSelector from './MemoTemplateSelector.vue'
import MemoAttachments from './MemoAttachments.vue'

export interface MemoEditorProps {
  /** Content value (v-model) */
  modelValue?: string
  /** Matter ID for auto-save */
  matterId?: string
  /** Editor placeholder text */
  placeholder?: string
  /** Maximum character count */
  maxCharacters?: number
  /** Maximum number of attachments */
  maxAttachments?: number
  /** Maximum attachment size in bytes */
  maxAttachmentSize?: number
  /** Disabled state */
  disabled?: boolean
  /** Error message to display */
  errorMessage?: string
  /** Auto-focus on mount */
  autofocus?: boolean
  /** Enable auto-save */
  enableAutoSave?: boolean
  /** Enable attachments */
  enableAttachments?: boolean
  /** Enable mentions */
  enableMentions?: boolean
  /** Enable templates */
  enableTemplates?: boolean
}

const props = withDefaults(defineProps<MemoEditorProps>(), {
  modelValue: '',
  placeholder: 'Start typing your memo...',
  maxCharacters: 50000,
  maxAttachments: 10,
  maxAttachmentSize: 10 * 1024 * 1024, // 10MB
  disabled: false,
  autofocus: false,
  enableAutoSave: true,
  enableAttachments: true,
  enableMentions: true,
  enableTemplates: true
})

const emit = defineEmits<{
  /** Content changed */
  'update:modelValue': [value: string]
  /** Editor focused */
  'focus': []
  /** Editor blurred */
  'blur': []
  /** Content changed (alias for update:modelValue) */
  'change': [value: string]
  /** Files uploaded */
  'filesUploaded': [files: UploadedFile[]]
  /** File removed */
  'fileRemoved': [fileId: string]
  /** Template selected */
  'templateSelected': [template: MemoTemplate, variables: Record<string, string>]
  /** Auto-save triggered */
  'autoSave': [content: MemoContent]
}>()

// Internal state
const isFocused = ref(false)
const showTemplateSelector = ref(false)
const showAttachments = ref(false)
const attachments = ref<UploadedFile[]>([])

// Computed
const hasError = computed(() => !!props.errorMessage)

// Mentions system
const { contactMentionExtension, matterMentionExtension } = useMentions()

// Editor configuration with mentions
const editorOptions: EditorOptions = {
  initialContent: props.modelValue,
  placeholder: props.placeholder,
  maxCharacters: props.maxCharacters,
  extensions: props.enableMentions 
    ? [contactMentionExtension, matterMentionExtension]
    : [],
  onChange: (content: string) => {
    emit('update:modelValue', content)
    emit('change', content)
    
    // Update auto-save content
    if (autoSave) {
      autoSave.setHtml(content)
    }
  },
  onFocus: () => {
    isFocused.value = true
    emit('focus')
  },
  onBlur: () => {
    isFocused.value = false
    emit('blur')
  }
}

// Initialize editor
const {
  editor,
  getCharacterCount,
  getWordCount,
  toggleBold,
  toggleItalic,
  toggleUnderline,
  toggleStrike,
  toggleBulletList,
  toggleOrderedList,
  toggleTaskList,
  toggleBlockquote,
  toggleCodeBlock,
  insertHorizontalRule,
  insertTable,
  insertLink,
  setHeading,
  setParagraph,
  setTextAlign,
  isActive,
  undo,
  redo,
  canUndo,
  canRedo,
  focus,
  setContent
} = useRichTextEditor(editorOptions)

// Auto-save functionality
const autoSave = props.enableAutoSave && props.matterId 
  ? useMemoAutoSave({
      matterId: props.matterId,
      onSave: async (content: MemoContent) => {
        emit('autoSave', content)
        // In production, this would save to backend
        await new Promise(resolve => setTimeout(resolve, 500)) // Simulate API call
      },
      onSaveSuccess: () => {
        console.log('Auto-save successful')
      },
      onSaveError: (error: Error) => {
        console.error('Auto-save failed:', error)
      }
    })
  : null

// Auto-save computed properties
const autoSaveStatus = computed(() => autoSave?.saveStatus.value || 'idle')
const autoSaveStatusText = computed(() => autoSave?.saveStatusText.value || 'No auto-save')
const hasUnsavedChanges = computed(() => autoSave?.hasUnsavedChanges.value || false)
const isOnline = computed(() => autoSave?.isOnline.value ?? true)
const canSave = computed(() => autoSave?.canSave.value || false)
const lastSaved = computed(() => autoSave?.lastSaved.value || null)
const saveError = computed(() => autoSave?.saveError.value || null)

// Editor computed properties
const characterCount = computed(() => getCharacterCount())
const wordCount = computed(() => getWordCount())

// Event handlers
const handleManualSave = () => {
  autoSave?.saveNow()
}

const handleRetry = () => {
  autoSave?.saveNow()
}

const handleFilesUploaded = (files: UploadedFile[]) => {
  attachments.value.push(...files)
  
  // Update auto-save content
  if (autoSave) {
    files.forEach(file => autoSave.addAttachment(file))
  }
  
  emit('filesUploaded', files)
}

const handleFileRemoved = (fileId: string) => {
  attachments.value = attachments.value.filter(f => f.id !== fileId)
  
  // Update auto-save content
  if (autoSave) {
    autoSave.removeAttachment(fileId)
  }
  
  emit('fileRemoved', fileId)
}

const handleFilesCleared = () => {
  const clearedFiles = attachments.value.map(f => f.id)
  attachments.value = []
  
  // Update auto-save content
  if (autoSave) {
    clearedFiles.forEach(fileId => autoSave.removeAttachment(fileId))
  }
}

const handleTemplateSelected = (template: MemoTemplate, variables: Record<string, string>) => {
  // Insert template content into editor
  const templateContent = template.content.replace(/\{\{(\w+)\}\}/g, (match, key) => {
    return variables[key] || match
  })
  
  // Insert at current cursor position instead of appending
  if (editor.value) {
    editor.value.chain()
      .focus()
      .insertContent(templateContent)
      .run()
  } else {
    setContent(templateContent)
  }
  
  showTemplateSelector.value = false
  
  emit('templateSelected', template, variables)
}

const handleTemplatePreview = (template: MemoTemplate) => {
  // Preview functionality can be implemented here
  console.log('Preview template:', template)
}

// Watch for external model value changes
watch(() => props.modelValue, (newValue) => {
  if (editor.value && editor.value.getHTML() !== newValue) {
    setContent(newValue)
  }
})

// Watch for disabled state
watch(() => props.disabled, (disabled) => {
  if (editor.value) {
    editor.value.setEditable(!disabled)
  }
})

// Initialize auto-save content
watch(() => props.modelValue, (content) => {
  if (autoSave && content) {
    autoSave.setHtml(content)
  }
}, { immediate: true })

// Autofocus if needed
onMounted(() => {
  if (props.autofocus && editor.value) {
    nextTick(() => {
      focus()
    })
  }
})

// Public API for parent components
defineExpose({
  focus,
  getCharacterCount,
  getWordCount,
  editor,
  autoSave,
  attachments: computed(() => attachments.value),
  saveNow: () => autoSave?.saveNow(),
  getContent: () => editor.value?.getHTML() || '',
  setContent,
  insertTemplate: handleTemplateSelected
})
</script>

<style scoped>
.memo-editor-container {
  @apply border border-border rounded-md overflow-hidden bg-background;
}

/* Header Section */
.memo-editor-header {
  @apply flex items-center justify-between px-4 py-2 bg-muted/30 border-b border-border;
}

.auto-save-section {
  @apply flex-1;
}

.template-section {
  @apply flex-shrink-0;
}

.template-toggle {
  @apply gap-2;
}

.template-selector-section {
  @apply border-b border-border bg-muted/10;
}

/* Main Editor */
.memo-editor-main {
  @apply flex flex-col;
}

.memo-editor-wrapper {
  @apply relative;
}

.memo-editor-content {
  @apply min-h-[200px] max-h-[600px] overflow-y-auto p-4;
}

.memo-editor-content.has-error {
  @apply border-destructive;
}

.memo-editor-content.is-focused {
  @apply ring-2 ring-primary ring-offset-2;
}

/* Attachments Section */
.attachments-section {
  @apply border-t border-border bg-muted/10 p-4;
}

/* Footer */
.memo-editor-footer {
  @apply flex items-center justify-between px-4 py-2 bg-muted/30 border-t border-border;
}

.character-count {
  @apply flex items-center gap-2;
}

.attachment-toggle {
  @apply gap-2 text-muted-foreground hover:text-foreground;
}

.memo-editor-error {
  @apply flex items-center gap-2 px-4 py-2 text-destructive bg-destructive/10 border-t border-destructive/20;
}

/* Editor content styles */
:deep(.memo-editor) {
  @apply prose prose-sm max-w-none;
}

:deep(.memo-editor h1) {
  @apply text-2xl font-bold mb-4 mt-6 first:mt-0;
}

:deep(.memo-editor h2) {
  @apply text-xl font-semibold mb-3 mt-5 first:mt-0;
}

:deep(.memo-editor h3) {
  @apply text-lg font-semibold mb-2 mt-4 first:mt-0;
}

:deep(.memo-editor h4) {
  @apply text-base font-semibold mb-2 mt-3 first:mt-0;
}

:deep(.memo-editor h5) {
  @apply text-sm font-semibold mb-1 mt-2 first:mt-0;
}

:deep(.memo-editor h6) {
  @apply text-xs font-semibold mb-1 mt-2 first:mt-0;
}

:deep(.memo-editor p) {
  @apply mb-4 last:mb-0;
}

:deep(.memo-editor ul) {
  @apply mb-4 pl-6;
}

:deep(.memo-editor ol) {
  @apply mb-4 pl-6;
}

:deep(.memo-editor li) {
  @apply mb-1;
}

:deep(.memo-editor blockquote) {
  @apply border-l-4 border-primary pl-4 italic my-4 text-muted-foreground;
}

:deep(.memo-editor code) {
  @apply bg-muted px-1 py-0.5 rounded text-sm font-mono;
}

:deep(.memo-editor pre) {
  @apply bg-muted p-4 rounded overflow-x-auto my-4;
}

:deep(.memo-editor pre code) {
  @apply bg-transparent p-0;
}

:deep(.memo-editor hr) {
  @apply border-0 border-t border-border my-6;
}

:deep(.memo-editor a) {
  @apply text-primary underline hover:text-primary/80;
}

:deep(.memo-editor table) {
  @apply w-full border-collapse border border-border my-4;
}

:deep(.memo-editor th) {
  @apply border border-border px-3 py-2 bg-muted font-semibold text-left;
}

:deep(.memo-editor td) {
  @apply border border-border px-3 py-2;
}

:deep(.memo-editor .ProseMirror-focused) {
  @apply outline-none;
}

:deep(.memo-editor .is-empty::before) {
  content: attr(data-placeholder);
  @apply text-muted-foreground pointer-events-none absolute;
}

/* Task list styling */
:deep(.memo-editor ul[data-type="taskList"]) {
  @apply list-none pl-0;
}

:deep(.memo-editor ul[data-type="taskList"] li) {
  @apply flex items-start gap-2;
}

:deep(.memo-editor ul[data-type="taskList"] li > label) {
  @apply flex-shrink-0 mt-1;
}

:deep(.memo-editor ul[data-type="taskList"] li > div) {
  @apply flex-1;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .memo-editor-content {
    @apply min-h-[150px] max-h-[400px];
  }
  
  .memo-editor-footer {
    @apply px-2 py-1;
  }
  
  .character-count {
    @apply flex-col items-start gap-1;
  }
}

/* Dark mode adjustments */
@media (prefers-color-scheme: dark) {
  :deep(.memo-editor blockquote) {
    @apply border-primary/60;
  }
}

/* High contrast mode */
@media (prefers-contrast: high) {
  .memo-editor-container {
    @apply border-2;
  }
  
  :deep(.memo-editor table) {
    @apply border-2;
  }
  
  :deep(.memo-editor th),
  :deep(.memo-editor td) {
    @apply border-2;
  }
}

/* Print styles */
@media print {
  .memo-toolbar,
  .memo-editor-footer {
    @apply hidden;
  }
  
  .memo-editor-container {
    @apply border-0 shadow-none;
  }
}
</style>