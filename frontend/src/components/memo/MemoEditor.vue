<template>
  <div class="memo-editor-container">
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

    <!-- Editor Content -->
    <div class="memo-editor-wrapper">
      <EditorContent 
        :editor="editor" 
        class="memo-editor-content"
        :class="{
          'has-error': hasError,
          'is-focused': isFocused
        }"
      />
      
      <!-- Character Count -->
      <div class="memo-editor-footer">
        <div class="character-count">
          <span class="text-sm text-muted-foreground">
            {{ characterCount }}{{ maxCharacters ? ` / ${maxCharacters}` : '' }} characters
            • {{ wordCount }} words
          </span>
          <span 
            v-if="maxCharacters && characterCount > maxCharacters * 0.9" 
            class="text-warning text-sm ml-2"
          >
            {{ maxCharacters - characterCount }} characters remaining
          </span>
        </div>
      </div>
    </div>

    <!-- Error Message -->
    <div v-if="errorMessage" class="memo-editor-error">
      <AlertCircle class="h-4 w-4" />
      <span class="text-sm">{{ errorMessage }}</span>
    </div>
  </div>
</template>

<script setup lang="ts">
import { EditorContent } from '@tiptap/vue-3'
import { AlertCircle } from 'lucide-vue-next'
import { useRichTextEditor, type EditorOptions } from '~/composables/memo/useRichTextEditor'
import MemoEditorToolbar from './MemoEditorToolbar.vue'

export interface MemoEditorProps {
  modelValue?: string
  placeholder?: string
  maxCharacters?: number
  disabled?: boolean
  errorMessage?: string
  autofocus?: boolean
}

const props = withDefaults(defineProps<MemoEditorProps>(), {
  modelValue: '',
  placeholder: 'Start typing your memo...',
  maxCharacters: 50000,
  disabled: false,
  autofocus: false
})

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'focus': []
  'blur': []
  'change': [value: string]
}>()

// Internal state
const isFocused = ref(false)
const hasError = computed(() => !!props.errorMessage)

// Editor configuration
const editorOptions: EditorOptions = {
  initialContent: props.modelValue,
  placeholder: props.placeholder,
  maxCharacters: props.maxCharacters,
  onChange: (content: string) => {
    emit('update:modelValue', content)
    emit('change', content)
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

// Computed properties
const characterCount = computed(() => getCharacterCount())
const wordCount = computed(() => getWordCount())

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
  editor
})
</script>

<style scoped>
.memo-editor-container {
  @apply border border-border rounded-md overflow-hidden bg-background;
}

.memo-editor-wrapper {
  @apply relative;
}

.memo-editor-content {
  @apply min-h-[200px] max-h-[600px] overflow-y-auto;
}

.memo-editor-content.has-error {
  @apply border-destructive;
}

.memo-editor-content.is-focused {
  @apply ring-2 ring-primary ring-offset-2;
}

.memo-editor-footer {
  @apply px-4 py-2 bg-muted/30 border-t border-border;
}

.character-count {
  @apply flex items-center justify-between;
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