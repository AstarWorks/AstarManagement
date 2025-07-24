<template>
  <div class="memo-toolbar" role="toolbar" aria-label="Formatting toolbar">
    <!-- Heading Selector -->
    <div class="toolbar-group">
      <Select :value="currentHeading" @value-change="setHeading">
        <SelectTrigger class="toolbar-select">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem 
            v-for="option in headingOptions" 
            :key="option.value" 
            :value="option.value"
          >
            {{ option.label }}
          </SelectItem>
        </SelectContent>
      </Select>
    </div>

    <div class="toolbar-separator" />

    <!-- Basic Formatting -->
    <div class="toolbar-group">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'is-active': isActive('bold') }"
            @click="toggleBold"
            aria-label="Bold"
          >
            <Bold class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Bold (Ctrl+B)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'is-active': isActive('italic') }"
            @click="toggleItalic"
            aria-label="Italic"
          >
            <Italic class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Italic (Ctrl+I)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'is-active': isActive('underline') }"
            @click="toggleUnderline"
            aria-label="Underline"
          >
            <Underline class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Underline (Ctrl+U)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'is-active': isActive('strike') }"
            @click="toggleStrike"
            aria-label="Strikethrough"
          >
            <Strikethrough class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Strikethrough</p>
        </TooltipContent>
      </Tooltip>
    </div>

    <div class="toolbar-separator" />

    <!-- Lists -->
    <div class="toolbar-group">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'is-active': isActive('bulletList') }"
            @click="toggleBulletList"
            aria-label="Bullet List"
          >
            <List class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Bullet List</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'is-active': isActive('orderedList') }"
            @click="toggleOrderedList"
            aria-label="Numbered List"
          >
            <ListOrdered class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Numbered List</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'is-active': isActive('taskList') }"
            @click="toggleTaskList"
            aria-label="Task List"
          >
            <ListTodo class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Task List</p>
        </TooltipContent>
      </Tooltip>
    </div>

    <div class="toolbar-separator" />

    <!-- Alignment -->
    <div class="toolbar-group">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'is-active': isActive('paragraph', { textAlign: 'left' }) }"
            @click="setTextAlign('left')"
            aria-label="Align Left"
          >
            <AlignLeft class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Align Left</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'is-active': isActive('paragraph', { textAlign: 'center' }) }"
            @click="setTextAlign('center')"
            aria-label="Align Center"
          >
            <AlignCenter class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Align Center</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'is-active': isActive('paragraph', { textAlign: 'right' }) }"
            @click="setTextAlign('right')"
            aria-label="Align Right"
          >
            <AlignRight class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Align Right</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'is-active': isActive('paragraph', { textAlign: 'justify' }) }"
            @click="setTextAlign('justify')"
            aria-label="Justify"
          >
            <AlignJustify class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Justify</p>
        </TooltipContent>
      </Tooltip>
    </div>

    <div class="toolbar-separator" />

    <!-- Special Elements -->
    <div class="toolbar-group">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            @click="showLinkDialog = true"
            aria-label="Insert Link"
          >
            <Link2 class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Insert Link (Ctrl+K)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'is-active': isActive('blockquote') }"
            @click="toggleBlockquote"
            aria-label="Quote"
          >
            <Quote class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Quote Block</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :class="{ 'is-active': isActive('codeBlock') }"
            @click="toggleCodeBlock"
            aria-label="Code Block"
          >
            <Code class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Code Block</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            @click="showTableDialog = true"
            aria-label="Insert Table"
          >
            <Table2 class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Insert Table</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            @click="insertHorizontalRule"
            aria-label="Horizontal Rule"
          >
            <Minus class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Horizontal Rule</p>
        </TooltipContent>
      </Tooltip>
    </div>

    <div class="toolbar-separator" />

    <!-- History -->
    <div class="toolbar-group">
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :disabled="!canUndo"
            @click="undo"
            aria-label="Undo"
          >
            <Undo class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Undo (Ctrl+Z)</p>
        </TooltipContent>
      </Tooltip>
      
      <Tooltip>
        <TooltipTrigger asChild>
          <Button
            variant="ghost"
            size="sm"
            :disabled="!canRedo"
            @click="redo"
            aria-label="Redo"
          >
            <Redo class="h-4 w-4" />
          </Button>
        </TooltipTrigger>
        <TooltipContent>
          <p>Redo (Ctrl+Y)</p>
        </TooltipContent>
      </Tooltip>
    </div>

    <!-- Link Dialog -->
    <Dialog v-model:open="showLinkDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Insert Link</DialogTitle>
          <DialogDescription>
            Add a link to your memo. You can link to external websites or documents.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="link-url">URL</Label>
            <Input
              id="link-url"
              v-model="linkUrl"
              placeholder="https://example.com"
              type="url"
              @keydown.enter="insertLink"
            />
          </div>
          <div class="space-y-2">
            <Label for="link-text">Link Text (optional)</Label>
            <Input
              id="link-text"
              v-model="linkText"
              placeholder="Link text"
              @keydown.enter="insertLink"
            />
            <p class="text-sm text-muted-foreground">
              If no text is provided, the selected text will be used
            </p>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="cancelLinkDialog">
            Cancel
          </Button>
          <Button @click="insertLink" :disabled="!linkUrl.trim()">
            Insert Link
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>

    <!-- Table Dialog -->
    <Dialog v-model:open="showTableDialog">
      <DialogContent class="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Insert Table</DialogTitle>
          <DialogDescription>
            Create a table for organizing information in your memo.
          </DialogDescription>
        </DialogHeader>
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="table-rows">Rows</Label>
            <Input
              id="table-rows"
              v-model.number="tableRows"
              type="number"
              min="1"
              max="20"
            />
          </div>
          <div class="space-y-2">
            <Label for="table-cols">Columns</Label>
            <Input
              id="table-cols"
              v-model.number="tableCols"
              type="number"
              min="1"
              max="10"
            />
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" @click="showTableDialog = false">
            Cancel
          </Button>
          <Button @click="insertTable">
            Insert Table
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  </div>
</template>

<script setup lang="ts">
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  List,
  ListOrdered,
  ListTodo,
  AlignLeft,
  AlignCenter,
  AlignRight,
  AlignJustify,
  Link2,
  Quote,
  Code,
  Table2,
  Minus,
  Undo,
  Redo
} from 'lucide-vue-next'

interface Props {
  // Functions from useRichTextEditor composable
  toggleBold: () => void
  toggleItalic: () => void
  toggleUnderline: () => void
  toggleStrike: () => void
  toggleBulletList: () => void
  toggleOrderedList: () => void
  toggleTaskList: () => void
  toggleBlockquote: () => void
  toggleCodeBlock: () => void
  insertHorizontalRule: () => void
  insertTable: (rows: number, cols: number) => void
  insertLink: (url: string, text?: string) => void
  setHeading: (level: 1 | 2 | 3 | 4 | 5 | 6) => void
  setParagraph: () => void
  setTextAlign: (alignment: 'left' | 'center' | 'right' | 'justify') => void
  isActive: (name: string, attributes?: Record<string, any>) => boolean
  undo: () => void
  redo: () => void
  canUndo: boolean
  canRedo: boolean
}

const props = defineProps<Props>()

const headingOptions = [
  { label: 'Paragraph', value: 'paragraph' },
  { label: 'Heading 1', value: 'h1' },
  { label: 'Heading 2', value: 'h2' },
  { label: 'Heading 3', value: 'h3' },
  { label: 'Heading 4', value: 'h4' },
  { label: 'Heading 5', value: 'h5' },
  { label: 'Heading 6', value: 'h6' },
]

const currentHeading = computed(() => {
  for (let level = 1; level <= 6; level++) {
    if (props.isActive('heading', { level })) {
      return `h${level}`
    }
  }
  return 'paragraph'
})

const setHeading = (value: string) => {
  if (value === 'paragraph') {
    props.setParagraph()
  } else {
    const level = parseInt(value.replace('h', '')) as 1 | 2 | 3 | 4 | 5 | 6
    props.setHeading(level)
  }
}

// Link dialog state
const showLinkDialog = ref(false)
const linkUrl = ref('')
const linkText = ref('')

const insertLink = () => {
  if (!linkUrl.value.trim()) return
  
  props.insertLink(linkUrl.value.trim(), linkText.value.trim() || undefined)
  
  // Reset dialog
  showLinkDialog.value = false
  linkUrl.value = ''
  linkText.value = ''
}

const cancelLinkDialog = () => {
  showLinkDialog.value = false
  linkUrl.value = ''
  linkText.value = ''
}

// Table dialog state
const showTableDialog = ref(false)
const tableRows = ref(3)
const tableCols = ref(3)

const insertTable = () => {
  props.insertTable(tableRows.value, tableCols.value)
  showTableDialog.value = false
}
</script>

<style scoped>
.memo-toolbar {
  @apply flex items-center gap-1 p-2 border-b bg-background;
  @apply flex-wrap sm:flex-nowrap; /* Responsive wrapping */
}

.toolbar-group {
  @apply flex items-center gap-1;
}

.toolbar-separator {
  @apply w-px h-6 bg-border mx-1;
}

.toolbar-select {
  @apply min-w-[120px] text-sm;
}

.is-active {
  @apply bg-accent text-accent-foreground;
}

/* Mobile responsiveness */
@media (max-width: 640px) {
  .memo-toolbar {
    @apply p-1 gap-0.5;
  }
  
  .toolbar-group {
    @apply gap-0.5;
  }
  
  .toolbar-separator {
    @apply mx-0.5 h-4;
  }
  
  .toolbar-select {
    @apply min-w-[100px] text-xs;
  }
}

/* Ensure toolbar is accessible */
.memo-toolbar:focus-within {
  @apply ring-2 ring-primary ring-offset-2;
}

/* High contrast mode support */
@media (prefers-contrast: high) {
  .toolbar-separator {
    @apply border-l-2 border-foreground w-0;
  }
  
  .is-active {
    @apply border-2 border-primary;
  }
}

/* Reduced motion preferences */
@media (prefers-reduced-motion: reduce) {
  .memo-toolbar button {
    @apply transition-none;
  }
}
</style>