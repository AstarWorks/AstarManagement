# 書類作成画面 - エディター設計

## 1. エディターの技術選定

### 選定ライブラリ
- **CodeMirror 6**を採用
- Vue 3対応の`@codemirror/view`使用
- VSCode風テーマとキーバインド

### 主要パッケージ
```json
{
  "@codemirror/lang-markdown": "^6.x",
  "@codemirror/view": "^6.x",
  "@codemirror/state": "^6.x",
  "@codemirror/commands": "^6.x",
  "@codemirror/search": "^6.x",
  "@codemirror/autocomplete": "^6.x",
  "@codemirror/theme-one-dark": "^6.x",
  "vue-codemirror": "^6.x",
  "marked": "^9.x",
  "marked-highlight": "^2.x",
  "dompurify": "^3.x"
}
```

## 2. エディターコンポーネント設計

### 2.1 メインレイアウト

```vue
<template>
  <div class="document-editor">
    <!-- ツールバー -->
    <EditorToolbar
      v-model:viewMode="viewMode"
      @save="saveDocument"
      @export="showExportDialog"
      @settings="showSettings"
    />
    
    <!-- エディターエリア -->
    <div class="editor-container" :class="viewModeClass">
      <!-- サイドバー -->
      <EditorSidebar
        v-if="showSidebar"
        :documents="documents"
        :templates="templates"
        @select-document="loadDocument"
        @select-template="loadTemplate"
      />
      
      <!-- エディター本体 -->
      <div class="editor-main">
        <!-- Markdownエディター -->
        <div v-if="viewMode !== 'preview'" class="editor-pane">
          <MarkdownEditor
            v-model="content"
            :options="editorOptions"
            @change="handleContentChange"
          />
        </div>
        
        <!-- プレビュー -->
        <div v-if="viewMode !== 'editor'" class="preview-pane">
          <DocumentPreview
            :content="processedContent"
            :style="previewStyle"
          />
        </div>
      </div>
    </div>
    
    <!-- ステータスバー -->
    <EditorStatusBar
      :wordCount="wordCount"
      :saveStatus="saveStatus"
      :currentLine="currentLine"
    />
  </div>
</template>

<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useDebounceFn } from '@vueuse/core'

const viewMode = ref<'editor' | 'preview' | 'split'>('split')
const content = ref('')
const processedContent = ref('')

// デバウンス更新（500ms）
const updatePreview = useDebounceFn(() => {
  processedContent.value = processMarkdown(content.value)
}, 500)

// コンテンツ変更時の処理
const handleContentChange = () => {
  updatePreview()
  autoSave()
}

// ビューモードに応じたクラス
const viewModeClass = computed(() => ({
  'view-editor': viewMode.value === 'editor',
  'view-preview': viewMode.value === 'preview',
  'view-split': viewMode.value === 'split'
}))
</script>

<style scoped>
.document-editor {
  @apply flex flex-col h-screen;
}

.editor-container {
  @apply flex-1 flex overflow-hidden;
}

.editor-main {
  @apply flex-1 flex;
}

.editor-pane,
.preview-pane {
  @apply flex-1 overflow-auto;
}

.view-split .editor-pane {
  @apply w-1/2 border-r;
}

.view-editor .preview-pane,
.view-preview .editor-pane {
  @apply hidden;
}
</style>
```

### 2.2 CodeMirrorエディター実装

```vue
<template>
  <div ref="editorContainer" class="markdown-editor"></div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue'
import { EditorView, basicSetup } from 'codemirror'
import { EditorState } from '@codemirror/state'
import { markdown } from '@codemirror/lang-markdown'
import { oneDark } from '@codemirror/theme-one-dark'
import { vim } from '@codemirror/vim'
import { keymap } from '@codemirror/view'
import { vscodeKeymap } from './vscode-keymap'

const props = defineProps<{
  modelValue: string
  options?: EditorOptions
}>()

const emit = defineEmits<{
  'update:modelValue': [value: string]
  'change': [value: string]
}>()

const editorContainer = ref<HTMLElement>()
let editorView: EditorView | null = null

// エディター拡張機能
const createExtensions = () => {
  const extensions = [
    basicSetup,
    markdown(),
    EditorView.updateListener.of((update) => {
      if (update.docChanged) {
        const value = update.state.doc.toString()
        emit('update:modelValue', value)
        emit('change', value)
      }
    }),
    // 行番号
    EditorView.lineWrapping,
    // テーマ
    props.options?.theme === 'dark' ? oneDark : [],
    // キーバインド
    keymap.of(vscodeKeymap),
    // 自動補完
    createAutoComplete(),
    // 変数ハイライト
    variableHighlighter()
  ]
  
  return extensions
}

// 変数の自動補完
const createAutoComplete = () => {
  return autocompletion({
    override: [
      (context) => {
        const word = context.matchBefore(/\{\{[\w]*/)
        if (!word) return null
        
        return {
          from: word.from,
          options: [
            { label: '{{案件番号}}', type: 'variable' },
            { label: '{{案件名}}', type: 'variable' },
            { label: '{{原告名}}', type: 'variable' },
            { label: '{{被告名}}', type: 'variable' },
            { label: '{{今日}}', type: 'variable' },
            { label: '{{弁護士名}}', type: 'variable' },
            // ... 他の変数
          ]
        }
      }
    ]
  })
}

// 変数のシンタックスハイライト
const variableHighlighter = () => {
  return syntaxHighlighting(
    HighlightStyle.define([
      {
        tag: tags.meta,
        class: 'cm-variable',
        color: '#79c0ff'
      }
    ])
  )
}

onMounted(() => {
  if (!editorContainer.value) return
  
  const startState = EditorState.create({
    doc: props.modelValue,
    extensions: createExtensions()
  })
  
  editorView = new EditorView({
    state: startState,
    parent: editorContainer.value
  })
})

// 外部からの値変更に対応
watch(() => props.modelValue, (newValue) => {
  if (!editorView) return
  
  const currentValue = editorView.state.doc.toString()
  if (currentValue !== newValue) {
    editorView.dispatch({
      changes: {
        from: 0,
        to: currentValue.length,
        insert: newValue
      }
    })
  }
})
</script>

<style>
.markdown-editor {
  @apply h-full;
}

.cm-editor {
  @apply h-full;
}

.cm-variable {
  @apply text-blue-400 font-medium;
}
</style>
```

### 2.3 VSCodeキーバインド定義

```typescript
// vscode-keymap.ts
import { 
  selectAll, 
  undo, 
  redo,
  indentMore,
  indentLess
} from '@codemirror/commands'

export const vscodeKeymap = [
  // 基本操作
  { key: 'Ctrl-a', run: selectAll },
  { key: 'Ctrl-z', run: undo },
  { key: 'Ctrl-y', run: redo },
  { key: 'Ctrl-Shift-z', run: redo },
  
  // インデント
  { key: 'Tab', run: indentMore },
  { key: 'Shift-Tab', run: indentLess },
  
  // 検索・置換
  { key: 'Ctrl-f', run: openSearchPanel },
  { key: 'Ctrl-h', run: openReplacePanel },
  
  // 保存
  { key: 'Ctrl-s', run: () => { 
    document.dispatchEvent(new Event('save-document'))
    return true 
  }},
  
  // マルチカーソル
  { key: 'Alt-Click', run: addCursor },
  { key: 'Ctrl-Alt-Up', run: addCursorAbove },
  { key: 'Ctrl-Alt-Down', run: addCursorBelow },
  
  // 行操作
  { key: 'Alt-Up', run: moveLineUp },
  { key: 'Alt-Down', run: moveLineDown },
  { key: 'Shift-Alt-Up', run: copyLineUp },
  { key: 'Shift-Alt-Down', run: copyLineDown },
  
  // コメント
  { key: 'Ctrl-/', run: toggleComment }
]
```

## 3. プレビュー機能

### 3.1 Markdown処理

```typescript
// composables/useMarkdownProcessor.ts
import { marked } from 'marked'
import { markedHighlight } from 'marked-highlight'
import hljs from 'highlight.js'
import DOMPurify from 'dompurify'

export const useMarkdownProcessor = () => {
  // Marked設定
  marked.use(
    markedHighlight({
      langPrefix: 'hljs language-',
      highlight(code, lang) {
        const language = hljs.getLanguage(lang) ? lang : 'plaintext'
        return hljs.highlight(code, { language }).value
      }
    })
  )
  
  // 変数置換
  const replaceVariables = (content: string, variables: Record<string, string>) => {
    let processed = content
    
    Object.entries(variables).forEach(([key, value]) => {
      const regex = new RegExp(`\\{\\{${key}\\}\\}`, 'g')
      processed = processed.replace(regex, value)
    })
    
    return processed
  }
  
  // Markdown処理
  const processMarkdown = (content: string, variables?: Record<string, string>) => {
    // 変数置換
    let processed = content
    if (variables) {
      processed = replaceVariables(content, variables)
    }
    
    // Markdown変換
    const html = marked(processed)
    
    // サニタイズ
    const clean = DOMPurify.sanitize(html, {
      USE_PROFILES: { html: true }
    })
    
    return clean
  }
  
  return {
    processMarkdown,
    replaceVariables
  }
}
```

### 3.2 プレビューコンポーネント

```vue
<template>
  <div class="document-preview" :class="styleClass">
    <div class="preview-header" v-if="showHeader">
      <h1>{{ documentTitle }}</h1>
      <div class="preview-meta">
        作成日: {{ formatDate(createdAt) }}
      </div>
    </div>
    
    <div 
      class="preview-content"
      v-html="processedHtml"
    ></div>
    
    <div class="preview-footer" v-if="showFooter">
      <div class="page-number">- {{ currentPage }} -</div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useMarkdownProcessor } from '@/composables/useMarkdownProcessor'
import { useCaseStore } from '@/stores/cases'

const props = defineProps<{
  content: string
  style: 'court' | 'general' | 'custom'
  showHeader?: boolean
  showFooter?: boolean
}>()

const { processMarkdown } = useMarkdownProcessor()
const { currentCase } = useCaseStore()

// 変数データの準備
const variables = computed(() => ({
  案件番号: currentCase.value?.caseNumber || '',
  案件名: currentCase.value?.title || '',
  原告名: currentCase.value?.plaintiff?.name || '',
  被告名: currentCase.value?.defendant?.name || '',
  今日: new Date().toLocaleDateString('ja-JP'),
  弁護士名: currentCase.value?.lawyer?.name || '',
  // ... 他の変数
}))

// 処理済みHTML
const processedHtml = computed(() => 
  processMarkdown(props.content, variables.value)
)

// スタイルクラス
const styleClass = computed(() => `preview-style-${props.style}`)
</script>

<style scoped>
.document-preview {
  @apply p-8 bg-white min-h-full;
}

/* 裁判所提出書類スタイル */
.preview-style-court {
  @apply max-w-[210mm] mx-auto;
  font-family: 'MS Mincho', serif;
  line-height: 2;
}

.preview-style-court :deep(h1) {
  @apply text-center text-xl font-normal mb-8;
}

.preview-style-court :deep(p) {
  @apply indent-8 mb-4;
}

/* 一般文書スタイル */
.preview-style-general {
  @apply max-w-3xl mx-auto;
  font-family: 'Noto Sans JP', sans-serif;
}

.preview-style-general :deep(h1) {
  @apply text-2xl font-bold mb-4 pb-2 border-b;
}

.preview-style-general :deep(h2) {
  @apply text-xl font-semibold mt-6 mb-3;
}

.preview-style-general :deep(p) {
  @apply mb-4 leading-relaxed;
}

/* 印刷用スタイル */
@media print {
  .document-preview {
    @apply p-0;
  }
  
  .preview-header,
  .preview-footer {
    @apply fixed left-0 right-0;
  }
  
  .preview-header {
    @apply top-0;
  }
  
  .preview-footer {
    @apply bottom-0;
  }
}
</style>
```

## 4. ツールバー実装

### 4.1 エディターツールバー

```vue
<template>
  <div class="editor-toolbar">
    <!-- ファイル操作 -->
    <div class="toolbar-section">
      <Button variant="ghost" size="sm" @click="$emit('new')">
        <FilePlus class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" @click="$emit('save')">
        <Save class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" @click="$emit('open')">
        <FolderOpen class="h-4 w-4" />
      </Button>
    </div>
    
    <Separator orientation="vertical" />
    
    <!-- 編集操作 -->
    <div class="toolbar-section">
      <Button variant="ghost" size="sm" @click="undo">
        <Undo class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" @click="redo">
        <Redo class="h-4 w-4" />
      </Button>
    </div>
    
    <Separator orientation="vertical" />
    
    <!-- 書式 -->
    <div class="toolbar-section">
      <Button variant="ghost" size="sm" @click="insertBold">
        <Bold class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" @click="insertItalic">
        <Italic class="h-4 w-4" />
      </Button>
      <Button variant="ghost" size="sm" @click="insertLink">
        <Link class="h-4 w-4" />
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Heading class="h-4 w-4" />
            <ChevronDown class="h-3 w-3 ml-1" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent>
          <DropdownMenuItem @click="insertHeading(1)">
            見出し1
          </DropdownMenuItem>
          <DropdownMenuItem @click="insertHeading(2)">
            見出し2
          </DropdownMenuItem>
          <DropdownMenuItem @click="insertHeading(3)">
            見出し3
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    
    <Separator orientation="vertical" />
    
    <!-- 変数挿入 -->
    <div class="toolbar-section">
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <Variable class="h-4 w-4" />
            変数
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent class="w-48">
          <DropdownMenuLabel>案件情報</DropdownMenuLabel>
          <DropdownMenuItem @click="insertVariable('案件番号')">
            案件番号
          </DropdownMenuItem>
          <DropdownMenuItem @click="insertVariable('案件名')">
            案件名
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuLabel>当事者情報</DropdownMenuLabel>
          <DropdownMenuItem @click="insertVariable('原告名')">
            原告名
          </DropdownMenuItem>
          <DropdownMenuItem @click="insertVariable('被告名')">
            被告名
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
    
    <div class="toolbar-spacer" />
    
    <!-- 表示モード -->
    <div class="toolbar-section">
      <ToggleGroup v-model="viewMode" type="single">
        <ToggleGroupItem value="editor">
          <FileText class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="split">
          <Columns class="h-4 w-4" />
        </ToggleGroupItem>
        <ToggleGroupItem value="preview">
          <Eye class="h-4 w-4" />
        </ToggleGroupItem>
      </ToggleGroup>
    </div>
    
    <!-- エクスポート -->
    <div class="toolbar-section">
      <Button variant="outline" size="sm" @click="$emit('export')">
        <Download class="h-4 w-4 mr-1" />
        エクスポート
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { inject } from 'vue'

const viewMode = defineModel<'editor' | 'preview' | 'split'>('viewMode')
const editorAPI = inject('editorAPI')

// エディター操作
const insertBold = () => {
  editorAPI?.insertText('****', -2)
}

const insertItalic = () => {
  editorAPI?.insertText('**', -1)
}

const insertLink = () => {
  editorAPI?.insertText('[]()', -3)
}

const insertHeading = (level: number) => {
  const prefix = '#'.repeat(level) + ' '
  editorAPI?.insertLinePrefix(prefix)
}

const insertVariable = (name: string) => {
  editorAPI?.insertText(`{{${name}}}`)
}
</script>

<style scoped>
.editor-toolbar {
  @apply flex items-center gap-2 px-4 py-2 border-b bg-background;
}

.toolbar-section {
  @apply flex items-center gap-1;
}

.toolbar-spacer {
  @apply flex-1;
}
</style>
```

## 5. 自動保存機能

```typescript
// composables/useAutoSave.ts
export const useAutoSave = (
  content: Ref<string>,
  documentId: Ref<string | null>
) => {
  const saveStatus = ref<'saved' | 'saving' | 'error'>('saved')
  const lastSaved = ref<Date | null>(null)
  
  // 30秒ごとの自動保存
  const { pause, resume } = useIntervalFn(async () => {
    if (!documentId.value) return
    
    saveStatus.value = 'saving'
    
    try {
      await $fetch(`/api/v1/documents/${documentId.value}/draft`, {
        method: 'PUT',
        body: {
          content: content.value
        }
      })
      
      saveStatus.value = 'saved'
      lastSaved.value = new Date()
    } catch (error) {
      saveStatus.value = 'error'
      console.error('Auto-save failed:', error)
    }
  }, 30000)
  
  // 手動保存
  const save = async () => {
    pause()
    
    saveStatus.value = 'saving'
    
    try {
      if (documentId.value) {
        // 既存文書の更新
        await $fetch(`/api/v1/documents/${documentId.value}`, {
          method: 'PUT',
          body: {
            content: content.value
          }
        })
      } else {
        // 新規文書の作成
        const { data } = await $fetch('/api/v1/documents', {
          method: 'POST',
          body: {
            content: content.value,
            caseId: currentCase.value?.id
          }
        })
        documentId.value = data.id
      }
      
      saveStatus.value = 'saved'
      lastSaved.value = new Date()
    } catch (error) {
      saveStatus.value = 'error'
      throw error
    } finally {
      resume()
    }
  }
  
  return {
    saveStatus: readonly(saveStatus),
    lastSaved: readonly(lastSaved),
    save
  }
}
```