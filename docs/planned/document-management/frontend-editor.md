# ドキュメントエディタ

## 概要

Markdownベースのリッチテキストエディタ。リアルタイムプレビュー、変数埋め込み、
コラボレーション編集をサポート。Obsidian風の快適な編集体験を提供。

## エディタコンポーネント

### MarkdownEditor
```vue
<template>
  <div class="editor-container flex h-full">
    <!-- ツールバー -->
    <div class="editor-toolbar border-b p-2 flex items-center gap-2">
      <ButtonGroup>
        <Button size="sm" variant="ghost" @click="format('bold')">
          <Bold class="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" @click="format('italic')">
          <Italic class="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" @click="format('strikethrough')">
          <Strikethrough class="h-4 w-4" />
        </Button>
      </ButtonGroup>
      
      <Separator orientation="vertical" class="h-6" />
      
      <ButtonGroup>
        <Button size="sm" variant="ghost" @click="format('h1')">
          H1
        </Button>
        <Button size="sm" variant="ghost" @click="format('h2')">
          H2
        </Button>
        <Button size="sm" variant="ghost" @click="format('h3')">
          H3
        </Button>
      </ButtonGroup>
      
      <Separator orientation="vertical" class="h-6" />
      
      <ButtonGroup>
        <Button size="sm" variant="ghost" @click="insertList('unordered')">
          <List class="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" @click="insertList('ordered')">
          <ListOrdered class="h-4 w-4" />
        </Button>
        <Button size="sm" variant="ghost" @click="insertList('task')">
          <CheckSquare class="h-4 w-4" />
        </Button>
      </ButtonGroup>
      
      <div class="flex-1" />
      
      <ButtonGroup>
        <Button
          size="sm"
          variant="ghost"
          @click="togglePreview"
        >
          <Eye v-if="!showPreview" class="h-4 w-4" />
          <EyeOff v-else class="h-4 w-4" />
        </Button>
        <Button
          size="sm"
          variant="ghost"
          @click="toggleSplitView"
        >
          <Columns class="h-4 w-4" />
        </Button>
      </ButtonGroup>
    </div>
    
    <!-- エディタ本体 -->
    <div class="editor-body flex flex-1">
      <div
        v-if="!showPreview || splitView"
        class="editor-pane flex-1 relative"
        :class="{ 'w-1/2': splitView }"
      >
        <MonacoEditor
          v-model="content"
          language="markdown"
          :options="editorOptions"
          @change="handleContentChange"
        />
        
        <!-- 変数オートコンプリート -->
        <VariableSuggestions
          v-if="showVariableSuggestions"
          :position="suggestionPosition"
          :query="variableQuery"
          @select="insertVariable"
        />
      </div>
      
      <div
        v-if="showPreview || splitView"
        class="preview-pane flex-1 overflow-auto p-4"
        :class="{ 'w-1/2 border-l': splitView }"
      >
        <MarkdownPreview
          :content="processedContent"
          :variables="variables"
        />
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import * as monaco from 'monaco-editor'

const content = ref('')
const showPreview = ref(false)
const splitView = ref(true)
const variables = ref<Record<string, string>>({})

const editorOptions = {
  minimap: { enabled: false },
  fontSize: 14,
  lineNumbers: 'on',
  wordWrap: 'on',
  scrollBeyondLastLine: false,
  renderWhitespace: 'selection',
  quickSuggestions: {
    other: true,
    comments: false,
    strings: false
  }
}

// 変数処理
const processedContent = computed(() => {
  return processVariables(content.value, variables.value)
})

function processVariables(text: string, vars: Record<string, string>): string {
  return text.replace(/\{\{([^}]+)\}\}/g, (match, varName) => {
    return vars[varName.trim()] || match
  })
}

// フォーマット機能
function format(type: string) {
  const selection = getSelection()
  let formatted = ''
  
  switch(type) {
    case 'bold':
      formatted = `**${selection}**`
      break
    case 'italic':
      formatted = `*${selection}*`
      break
    case 'strikethrough':
      formatted = `~~${selection}~~`
      break
    case 'h1':
      formatted = `# ${selection}`
      break
    case 'h2':
      formatted = `## ${selection}`
      break
    case 'h3':
      formatted = `### ${selection}`
      break
  }
  
  replaceSelection(formatted)
}
</script>
```

## 変数システム

### VariableManager
```vue
<template>
  <div class="variable-manager">
    <div class="flex items-center justify-between mb-4">
      <h3 class="text-lg font-semibold">変数管理</h3>
      <Button size="sm" @click="addVariable">
        <Plus class="h-4 w-4 mr-2" />
        変数を追加
      </Button>
    </div>
    
    <div class="space-y-2">
      <div
        v-for="variable in variables"
        :key="variable.id"
        class="flex items-center gap-2 p-2 border rounded"
      >
        <Badge :variant="getScopeVariant(variable.scope)">
          {{ variable.scope }}
        </Badge>
        
        <Input
          v-model="variable.name"
          placeholder="変数名"
          class="w-[200px]"
          @blur="updateVariable(variable)"
        />
        
        <Input
          v-model="variable.value"
          placeholder="値"
          class="flex-1"
          @blur="updateVariable(variable)"
        />
        
        <Button
          size="icon"
          variant="ghost"
          @click="deleteVariable(variable.id)"
        >
          <Trash class="h-4 w-4" />
        </Button>
      </div>
    </div>
    
    <!-- 使用例 -->
    <div class="mt-4 p-3 bg-muted rounded">
      <h4 class="text-sm font-medium mb-2">使用方法</h4>
      <code class="text-xs">
        {{ '{{company_name}}' }} → {{ variables.find(v => v.name === 'company_name')?.value }}
      </code>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Variable {
  id: string
  name: string
  value: string
  scope: 'global' | 'project' | 'document'
}

const variables = ref<Variable[]>([])

async function fetchVariables() {
  const { data } = await $fetch('/api/v1/variables')
  variables.value = data
}

async function updateVariable(variable: Variable) {
  await $fetch(`/api/v1/variables/${variable.id}`, {
    method: 'PUT',
    body: variable
  })
}

function getScopeVariant(scope: string) {
  const variants = {
    global: 'default',
    project: 'secondary',
    document: 'outline'
  }
  return variants[scope] || 'default'
}
</script>
```

## リアルタイムプレビュー

### MarkdownPreview
```vue
<template>
  <div class="markdown-preview prose prose-sm max-w-none">
    <div v-html="renderedContent" />
  </div>
</template>

<script setup lang="ts">
import MarkdownIt from 'markdown-it'
import hljs from 'highlight.js'

const props = defineProps<{
  content: string
  variables?: Record<string, string>
}>()

const md = new MarkdownIt({
  html: true,
  linkify: true,
  typographer: true,
  highlight: function (str, lang) {
    if (lang && hljs.getLanguage(lang)) {
      try {
        return hljs.highlight(str, { language: lang }).value
      } catch (__) {}
    }
    return ''
  }
})

// プラグイン追加
md.use(require('markdown-it-task-lists'))
md.use(require('markdown-it-footnote'))
md.use(require('markdown-it-table-of-contents'))

const renderedContent = computed(() => {
  // Wiki リンクの処理
  const withLinks = props.content.replace(
    /\[\[([^\]]+)\]\]/g,
    (match, name) => {
      return `<a href="/documents/${encodeURIComponent(name)}" class="wiki-link">${name}</a>`
    }
  )
  
  // Markdownレンダリング
  return md.render(withLinks)
})
</script>

<style>
.wiki-link {
  @apply text-primary underline decoration-dotted;
}

.prose pre {
  @apply bg-muted;
}

.prose code {
  @apply bg-muted px-1 py-0.5 rounded;
}
</style>
```

## コラボレーション

### CollaborationCursor
```vue
<template>
  <div class="collaboration-indicators">
    <div
      v-for="user in collaborators"
      :key="user.id"
      class="user-cursor"
      :style="{
        top: `${user.cursor.line * 20}px`,
        left: `${user.cursor.column * 8}px`,
        borderColor: user.color
      }"
    >
      <div class="user-label" :style="{ backgroundColor: user.color }">
        {{ user.name }}
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const { data: collaborators } = await useWebSocket('/ws/collaboration', {
  immediate: true
})

// カーソル位置の送信
function sendCursorPosition(line: number, column: number) {
  sendMessage({
    type: 'cursor',
    data: { line, column }
  })
}

// 編集内容の送信
function sendEdit(operation: any) {
  sendMessage({
    type: 'edit',
    data: operation
  })
}
</script>

<style scoped>
.user-cursor {
  @apply absolute w-0.5 h-5 border-l-2;
}

.user-label {
  @apply absolute -top-6 left-0 text-xs text-white px-1 py-0.5 rounded whitespace-nowrap;
}
</style>
```

## ショートカット

### KeyboardShortcuts
```vue
<template>
  <div class="keyboard-shortcuts">
    <h3 class="text-lg font-semibold mb-4">キーボードショートカット</h3>
    
    <div class="space-y-2">
      <div
        v-for="shortcut in shortcuts"
        :key="shortcut.key"
        class="flex items-center justify-between"
      >
        <span class="text-sm">{{ shortcut.description }}</span>
        <Kbd>{{ shortcut.key }}</Kbd>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
const shortcuts = [
  { key: 'Cmd+B', description: '太字' },
  { key: 'Cmd+I', description: '斜体' },
  { key: 'Cmd+K', description: 'リンク挿入' },
  { key: 'Cmd+Shift+K', description: 'コードブロック' },
  { key: 'Cmd+/', description: 'プレビュー切り替え' },
  { key: 'Cmd+S', description: '保存' },
  { key: 'Cmd+Shift+S', description: '名前を付けて保存' },
  { key: 'Cmd+P', description: 'クイックオープン' }
]

// ショートカット登録
onMounted(() => {
  useEventListener('keydown', (e: KeyboardEvent) => {
    if (e.metaKey && e.key === 'b') {
      e.preventDefault()
      format('bold')
    }
    // ... 他のショートカット
  })
})
</script>
```

## エクスポート

### ExportDialog
```vue
<template>
  <Dialog v-model:open="open">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>ドキュメントをエクスポート</DialogTitle>
      </DialogHeader>
      
      <div class="space-y-4">
        <RadioGroup v-model="exportFormat">
          <div class="flex items-center space-x-2">
            <RadioGroupItem value="markdown" />
            <Label>Markdown (.md)</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem value="html" />
            <Label>HTML (.html)</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem value="pdf" />
            <Label>PDF (.pdf)</Label>
          </div>
          <div class="flex items-center space-x-2">
            <RadioGroupItem value="docx" />
            <Label>Word (.docx)</Label>
          </div>
        </RadioGroup>
        
        <div class="flex items-center space-x-2">
          <Checkbox v-model="includeVariables" />
          <Label>変数を展開して出力</Label>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="open = false">
          キャンセル
        </Button>
        <Button @click="exportDocument">
          エクスポート
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
const exportFormat = ref('markdown')
const includeVariables = ref(true)

async function exportDocument() {
  const response = await $fetch('/api/v1/documents/export', {
    method: 'POST',
    body: {
      documentId: currentDocument.value.id,
      format: exportFormat.value,
      includeVariables: includeVariables.value
    },
    responseType: 'blob'
  })
  
  // ダウンロード
  const url = URL.createObjectURL(response)
  const a = document.createElement('a')
  a.href = url
  a.download = `${currentDocument.value.name}.${exportFormat.value}`
  a.click()
}
</script>
```

## まとめ

ドキュメントエディタにより：
1. **快適な編集体験**: Obsidian風のMarkdownエディタ
2. **変数システム**: テンプレート化と再利用性
3. **リアルタイムプレビュー**: 編集結果を即座に確認
4. **コラボレーション**: 複数人での同時編集