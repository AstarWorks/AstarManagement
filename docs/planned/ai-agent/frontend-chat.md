# AIチャットインターフェース

## 概要

自然言語でプラットフォームの全機能を操作できるAIチャットUI。
サイドバーに常駐し、いつでもアクセス可能な対話型アシスタント。

## チャットコンポーネント

### AIChatPanel
```vue
<template>
  <div class="ai-chat-panel flex flex-col h-full">
    <!-- ヘッダー -->
    <div class="chat-header border-b p-4">
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <Bot class="h-5 w-5" />
          <h3 class="font-semibold">AIアシスタント</h3>
          <Badge v-if="isProcessing" variant="secondary">
            <Loader2 class="h-3 w-3 animate-spin mr-1" />
            処理中
          </Badge>
        </div>
        
        <Button size="icon" variant="ghost" @click="clearChat">
          <RotateCcw class="h-4 w-4" />
        </Button>
      </div>
    </div>
    
    <!-- メッセージエリア -->
    <ScrollArea class="flex-1 p-4">
      <div class="space-y-4">
        <ChatMessage
          v-for="message in messages"
          :key="message.id"
          :message="message"
          @retry="retryMessage"
        />
        
        <div v-if="isTyping" class="flex items-center gap-2">
          <Avatar class="h-8 w-8">
            <AvatarFallback>AI</AvatarFallback>
          </Avatar>
          <div class="typing-indicator">
            <span></span>
            <span></span>
            <span></span>
          </div>
        </div>
      </div>
    </ScrollArea>
    
    <!-- 入力エリア -->
    <div class="chat-input border-t p-4">
      <div class="flex gap-2">
        <Textarea
          v-model="inputMessage"
          placeholder="質問を入力... (Shift+Enterで改行)"
          class="min-h-[60px] resize-none"
          @keydown.enter.exact="sendMessage"
        />
        
        <div class="flex flex-col gap-2">
          <Button
            size="icon"
            :disabled="!inputMessage.trim() || isProcessing"
            @click="sendMessage"
          >
            <Send class="h-4 w-4" />
          </Button>
          
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button size="icon" variant="outline">
                <Paperclip class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @click="attachFile">
                <File class="h-4 w-4 mr-2" />
                ファイルを添付
              </DropdownMenuItem>
              <DropdownMenuItem @click="attachScreenshot">
                <Camera class="h-4 w-4 mr-2" />
                スクリーンショット
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <!-- コンテキスト表示 -->
      <div v-if="context.length > 0" class="mt-2 flex flex-wrap gap-2">
        <Badge
          v-for="item in context"
          :key="item.id"
          variant="secondary"
          class="pr-1"
        >
          {{ item.name }}
          <Button
            size="icon"
            variant="ghost"
            class="h-4 w-4 ml-1"
            @click="removeContext(item.id)"
          >
            <X class="h-3 w-3" />
          </Button>
        </Badge>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
interface Message {
  id: string
  role: 'user' | 'assistant' | 'system'
  content: string
  timestamp: Date
  toolCalls?: ToolCall[]
  attachments?: Attachment[]
}

const messages = ref<Message[]>([])
const inputMessage = ref('')
const isProcessing = ref(false)
const isTyping = ref(false)
const context = ref<ContextItem[]>([])

const { sendMessage: wsSend, onMessage } = useWebSocket('/ws/ai-chat')

async function sendMessage() {
  if (!inputMessage.value.trim() || isProcessing.value) return
  
  const userMessage: Message = {
    id: generateId(),
    role: 'user',
    content: inputMessage.value,
    timestamp: new Date()
  }
  
  messages.value.push(userMessage)
  inputMessage.value = ''
  isProcessing.value = true
  isTyping.value = true
  
  // WebSocket経由で送信
  wsSend({
    type: 'message',
    content: userMessage.content,
    context: context.value
  })
}

// レスポンス受信
onMessage((data) => {
  if (data.type === 'response') {
    isTyping.value = false
    messages.value.push({
      id: generateId(),
      role: 'assistant',
      content: data.content,
      timestamp: new Date(),
      toolCalls: data.toolCalls
    })
    isProcessing.value = false
  } else if (data.type === 'streaming') {
    // ストリーミング対応
    updateLastMessage(data.chunk)
  }
})
</script>

<style scoped>
.typing-indicator {
  @apply flex gap-1;
}

.typing-indicator span {
  @apply h-2 w-2 bg-muted-foreground rounded-full animate-bounce;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.1s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.2s;
}
</style>
```

### ChatMessage
```vue
<template>
  <div class="chat-message flex gap-3">
    <Avatar class="h-8 w-8">
      <AvatarImage v-if="message.role === 'user'" :src="userAvatar" />
      <AvatarFallback>
        {{ message.role === 'user' ? 'You' : 'AI' }}
      </AvatarFallback>
    </Avatar>
    
    <div class="flex-1">
      <div class="flex items-center gap-2 mb-1">
        <span class="text-sm font-medium">
          {{ message.role === 'user' ? 'あなた' : 'AIアシスタント' }}
        </span>
        <span class="text-xs text-muted-foreground">
          {{ formatTime(message.timestamp) }}
        </span>
      </div>
      
      <div class="message-content prose prose-sm max-w-none">
        <div v-html="renderMarkdown(message.content)" />
      </div>
      
      <!-- ツール実行結果 -->
      <div v-if="message.toolCalls" class="mt-3 space-y-2">
        <ToolCallResult
          v-for="call in message.toolCalls"
          :key="call.id"
          :call="call"
        />
      </div>
      
      <!-- 添付ファイル -->
      <div v-if="message.attachments" class="mt-3 flex flex-wrap gap-2">
        <AttachmentPreview
          v-for="attachment in message.attachments"
          :key="attachment.id"
          :attachment="attachment"
        />
      </div>
      
      <!-- アクション -->
      <div class="mt-2 flex gap-2">
        <Button size="sm" variant="ghost" @click="copyMessage">
          <Copy class="h-3 w-3 mr-1" />
          コピー
        </Button>
        <Button
          v-if="message.role === 'assistant'"
          size="sm"
          variant="ghost"
          @click="$emit('retry')"
        >
          <RotateCcw class="h-3 w-3 mr-1" />
          再生成
        </Button>
      </div>
    </div>
  </div>
</template>
```

## ツール実行表示

### ToolCallResult
```vue
<template>
  <Card class="tool-call-result">
    <CardContent class="p-3">
      <div class="flex items-center gap-2 mb-2">
        <component :is="getToolIcon(call.name)" class="h-4 w-4" />
        <span class="text-sm font-medium">{{ getToolLabel(call.name) }}</span>
        <Badge :variant="getStatusVariant(call.status)">
          {{ call.status }}
        </Badge>
      </div>
      
      <div v-if="call.status === 'running'" class="flex items-center gap-2">
        <Loader2 class="h-4 w-4 animate-spin" />
        <span class="text-sm text-muted-foreground">実行中...</span>
      </div>
      
      <div v-else-if="call.status === 'success'" class="space-y-2">
        <div class="text-sm">
          <component :is="getResultComponent(call.name)" :result="call.result" />
        </div>
      </div>
      
      <div v-else-if="call.status === 'error'" class="text-sm text-destructive">
        エラー: {{ call.error }}
      </div>
      
      <Collapsible v-if="call.parameters">
        <CollapsibleTrigger class="text-xs text-muted-foreground hover:underline">
          パラメータを表示
        </CollapsibleTrigger>
        <CollapsibleContent>
          <pre class="text-xs bg-muted p-2 rounded mt-2">{{ JSON.stringify(call.parameters, null, 2) }}</pre>
        </CollapsibleContent>
      </Collapsible>
    </CardContent>
  </Card>
</template>

<script setup lang="ts">
const toolIcons = {
  create_table: Table,
  create_document: FileText,
  query_table: Search,
  update_record: Edit,
  delete_record: Trash
}

const toolLabels = {
  create_table: 'テーブル作成',
  create_document: 'ドキュメント作成',
  query_table: 'データ検索',
  update_record: 'レコード更新',
  delete_record: 'レコード削除'
}

function getToolIcon(name: string) {
  return toolIcons[name] || Tool
}

function getToolLabel(name: string) {
  return toolLabels[name] || name
}
</script>
```

## サジェスト機能

### CommandSuggestions
```vue
<template>
  <div class="command-suggestions">
    <h4 class="text-sm font-medium mb-2">よく使うコマンド</h4>
    
    <div class="grid grid-cols-2 gap-2">
      <Button
        v-for="command in suggestions"
        :key="command.id"
        variant="outline"
        size="sm"
        class="justify-start"
        @click="executeCommand(command)"
      >
        <component :is="command.icon" class="h-4 w-4 mr-2" />
        {{ command.label }}
      </Button>
    </div>
  </div>
</template>

<script setup lang="ts">
const suggestions = [
  {
    id: 'create_table',
    label: 'テーブル作成',
    icon: Table,
    prompt: '新しいテーブルを作成してください'
  },
  {
    id: 'search_docs',
    label: 'ドキュメント検索',
    icon: Search,
    prompt: 'ドキュメントを検索してください'
  },
  {
    id: 'generate_report',
    label: 'レポート生成',
    icon: FileText,
    prompt: 'レポートを生成してください'
  },
  {
    id: 'analyze_data',
    label: 'データ分析',
    icon: BarChart,
    prompt: 'データを分析してください'
  }
]

function executeCommand(command: any) {
  inputMessage.value = command.prompt
  sendMessage()
}
</script>
```

## コンテキスト管理

### ContextSelector
```vue
<template>
  <DropdownMenu>
    <DropdownMenuTrigger asChild>
      <Button variant="outline" size="sm">
        <Plus class="h-4 w-4 mr-2" />
        コンテキスト追加
      </Button>
    </DropdownMenuTrigger>
    
    <DropdownMenuContent class="w-[300px]">
      <DropdownMenuLabel>コンテキストを選択</DropdownMenuLabel>
      <DropdownMenuSeparator />
      
      <Command>
        <CommandInput placeholder="検索..." />
        <CommandList>
          <CommandGroup heading="テーブル">
            <CommandItem
              v-for="table in tables"
              :key="table.id"
              @select="addContext('table', table)"
            >
              <Table class="h-4 w-4 mr-2" />
              {{ table.name }}
            </CommandItem>
          </CommandGroup>
          
          <CommandGroup heading="ドキュメント">
            <CommandItem
              v-for="doc in documents"
              :key="doc.id"
              @select="addContext('document', doc)"
            >
              <FileText class="h-4 w-4 mr-2" />
              {{ doc.name }}
            </CommandItem>
          </CommandGroup>
        </CommandList>
      </Command>
    </DropdownMenuContent>
  </DropdownMenu>
</template>
```

## 会話履歴

### ConversationHistory
```vue
<template>
  <Sheet>
    <SheetTrigger asChild>
      <Button variant="outline" size="sm">
        <History class="h-4 w-4 mr-2" />
        履歴
      </Button>
    </SheetTrigger>
    
    <SheetContent>
      <SheetHeader>
        <SheetTitle>会話履歴</SheetTitle>
      </SheetHeader>
      
      <ScrollArea class="h-full mt-4">
        <div class="space-y-4">
          <Card
            v-for="conversation in conversations"
            :key="conversation.id"
            class="cursor-pointer hover:bg-accent"
            @click="loadConversation(conversation.id)"
          >
            <CardContent class="p-4">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-medium">{{ conversation.title }}</h4>
                <span class="text-xs text-muted-foreground">
                  {{ formatDate(conversation.createdAt) }}
                </span>
              </div>
              
              <p class="text-sm text-muted-foreground line-clamp-2">
                {{ conversation.preview }}
              </p>
              
              <div class="flex items-center gap-2 mt-2">
                <Badge variant="secondary">
                  {{ conversation.messageCount }}件
                </Badge>
                <Badge v-if="conversation.hasToolCalls" variant="outline">
                  ツール実行あり
                </Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </ScrollArea>
    </SheetContent>
  </Sheet>
</template>
```

## 設定

### AISettings
```vue
<template>
  <div class="ai-settings space-y-4">
    <div>
      <Label>AIモデル</Label>
      <Select v-model="settings.model">
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="gpt-4">GPT-4</SelectItem>
          <SelectItem value="gpt-3.5">GPT-3.5</SelectItem>
          <SelectItem value="claude-3">Claude 3</SelectItem>
          <SelectItem value="local">ローカルLLM</SelectItem>
        </SelectContent>
      </Select>
    </div>
    
    <div>
      <Label>応答スタイル</Label>
      <RadioGroup v-model="settings.style">
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="concise" />
          <Label>簡潔</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="detailed" />
          <Label>詳細</Label>
        </div>
        <div class="flex items-center space-x-2">
          <RadioGroupItem value="creative" />
          <Label>クリエイティブ</Label>
        </div>
      </RadioGroup>
    </div>
    
    <div class="flex items-center space-x-2">
      <Switch v-model="settings.autoExecute" />
      <Label>ツールを自動実行</Label>
    </div>
    
    <div class="flex items-center space-x-2">
      <Switch v-model="settings.streaming" />
      <Label>ストリーミング応答</Label>
    </div>
  </div>
</template>
```

## まとめ

AIチャットインターフェースにより：
1. **自然言語操作**: プラットフォームの全機能を会話で操作
2. **ツール実行可視化**: AIの動作を透明に表示
3. **コンテキスト管理**: 関連データを会話に含める
4. **履歴管理**: 過去の会話を参照・再利用