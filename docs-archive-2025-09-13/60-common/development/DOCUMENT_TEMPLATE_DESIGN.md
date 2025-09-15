# 書類作成画面 - テンプレート管理設計

## 1. テンプレート管理の概要

事務所全体で共有するテンプレート管理システムを提供します。シンプルな運用を重視し、最新版のみを保持する設計とします。

## 2. テンプレート構造

### 2.1 テンプレートデータモデル

```typescript
interface DocumentTemplate {
  id: string
  name: string                    // テンプレート名
  description: string             // 説明
  category: TemplateCategory      // カテゴリー
  content: string                 // Markdown本文
  variables: TemplateVariable[]   // 使用する変数リスト
  isSystem: boolean              // システムテンプレートか
  createdBy: string
  createdAt: Date
  updatedBy: string
  updatedAt: Date
}

interface TemplateVariable {
  name: string          // 変数名（例：案件番号）
  key: string          // 変数キー（例：caseNumber）
  required: boolean    // 必須かどうか
  defaultValue?: string // デフォルト値
  description?: string  // 変数の説明
}

type TemplateCategory = 
  | 'litigation'      // 訴訟関係
  | 'application'     // 申立書
  | 'contract'        // 契約書
  | 'letter'          // 書簡・通知
  | 'internal'        // 内部文書
  | 'other'           // その他
```

### 2.2 システムテンプレート

```typescript
// 初期提供するシステムテンプレート
const systemTemplates: Partial<DocumentTemplate>[] = [
  {
    name: '訴状',
    category: 'litigation',
    description: '民事訴訟の訴状テンプレート',
    content: `# 訴状

令和{{年}}年（ワ）第{{事件番号}}号
{{事件名}}事件

原告　{{原告名}}
　　　{{原告住所}}

被告　{{被告名}}
　　　{{被告住所}}

{{今日}}

{{裁判所名}}　御中

　　　　　　　　　　　　　　原告訴訟代理人
　　　　　　　　　　　　　　弁護士　{{弁護士名}}

## 請求の趣旨

1. {{請求の趣旨1}}
2. 訴訟費用は被告の負担とする
との判決を求める。

## 請求の原因

### 第1　当事者

原告は{{原告説明}}である。
被告は{{被告説明}}である。

### 第2　事実関係

1. {{事実1}}
2. {{事実2}}

### 第3　法的主張

{{法的主張}}

## 証拠方法

1. {{証拠1}}
2. {{証拠2}}

## 添付書類

1. 訴状副本　　　1通
2. {{添付書類}}`,
    variables: [
      { name: '年', key: 'year', required: true },
      { name: '事件番号', key: 'caseNumber', required: false },
      { name: '事件名', key: 'caseName', required: true },
      { name: '原告名', key: 'plaintiffName', required: true },
      { name: '原告住所', key: 'plaintiffAddress', required: true },
      { name: '被告名', key: 'defendantName', required: true },
      { name: '被告住所', key: 'defendantAddress', required: true },
      { name: '裁判所名', key: 'courtName', required: true, defaultValue: '東京地方裁判所' },
      { name: '弁護士名', key: 'lawyerName', required: true }
    ]
  },
  {
    name: '答弁書',
    category: 'litigation',
    description: '民事訴訟の答弁書テンプレート',
    content: `# 答弁書

令和{{年}}年（ワ）第{{事件番号}}号
{{事件名}}事件

原告　{{原告名}}
被告　{{被告名}}

{{今日}}

{{裁判所名}}　御中

　　　　　　　　　　　　　　被告訴訟代理人
　　　　　　　　　　　　　　弁護士　{{弁護士名}}

## 答弁の趣旨

1. 原告の請求を棄却する
2. 訴訟費用は原告の負担とする
との判決を求める。

## 答弁の理由

### 第1　請求原因に対する認否

1. {{認否1}}
2. {{認否2}}

### 第2　被告の主張

{{被告の主張}}

## 証拠方法

1. {{証拠1}}
2. {{証拠2}}`
  },
  {
    name: '準備書面',
    category: 'litigation',
    description: '準備書面のテンプレート',
    content: `# 準備書面{{番号}}

令和{{年}}年（ワ）第{{事件番号}}号
{{事件名}}事件

原告　{{原告名}}
被告　{{被告名}}

{{今日}}

{{裁判所名}}　御中

　　　　　　　　　　　　　　{{提出者}}訴訟代理人
　　　　　　　　　　　　　　弁護士　{{弁護士名}}

## 第1　{{項目1}}

{{内容1}}

## 第2　{{項目2}}

{{内容2}}`
  },
  {
    name: '内容証明郵便',
    category: 'letter',
    description: '内容証明郵便のテンプレート',
    content: `{{今日}}

{{相手方名}}　殿
{{相手方住所}}

{{差出人名}}
{{差出人住所}}

# 通知書

拝啓　時下ますますご清祥のこととお慶び申し上げます。

さて、{{要件}}の件につきまして、下記のとおり通知いたします。

## 記

{{通知内容}}

つきましては、本書面到達後{{期限}}以内に、{{要求事項}}いただきますようお願い申し上げます。

なお、期限内にお応えいただけない場合は、{{警告内容}}こととなりますので、ご承知おきください。

敬具`
  },
  {
    name: '委任状',
    category: 'contract',
    description: '訴訟委任状のテンプレート',
    content: `# 委任状

{{委任者名}}（以下「甲」という。）は、{{受任者名}}弁護士（以下「乙」という。）に対し、下記の事件に関する一切の訴訟行為及びこれに付随する事務を委任する。

## 記

1. **事件名**：{{事件名}}
2. **相手方**：{{相手方名}}
3. **委任事項**：
   - 訴訟提起、応訴、和解、調停、仲裁
   - 保全処分の申立て及びその取消し
   - 強制執行、仮差押え、仮処分
   - 反訴の提起、訴えの取下げ、請求の放棄・認諾
   - 控訴、上告及びそれらの取下げ
   - 復代理人の選任
   - その他一切の訴訟行為

{{今日}}

委任者（甲）
住所：{{委任者住所}}
氏名：{{委任者名}}　　印

受任者（乙）
{{事務所名}}
弁護士　{{弁護士名}}`
  }
]
```

## 3. テンプレート管理画面

### 3.1 テンプレート一覧

```vue
<template>
  <div class="template-manager">
    <!-- ヘッダー -->
    <div class="template-header">
      <h2 class="text-lg font-semibold">書類テンプレート</h2>
      <div class="flex items-center gap-2">
        <Input
          v-model="searchQuery"
          placeholder="テンプレートを検索..."
          class="w-64"
        >
          <Search class="h-4 w-4 text-muted-foreground" />
        </Input>
        <Button @click="createNewTemplate">
          <Plus class="h-4 w-4 mr-1" />
          新規作成
        </Button>
      </div>
    </div>
    
    <!-- カテゴリータブ -->
    <Tabs v-model="selectedCategory" class="mt-4">
      <TabsList>
        <TabsTrigger value="all">すべて</TabsTrigger>
        <TabsTrigger value="litigation">訴訟関係</TabsTrigger>
        <TabsTrigger value="application">申立書</TabsTrigger>
        <TabsTrigger value="contract">契約書</TabsTrigger>
        <TabsTrigger value="letter">書簡・通知</TabsTrigger>
        <TabsTrigger value="internal">内部文書</TabsTrigger>
        <TabsTrigger value="other">その他</TabsTrigger>
      </TabsList>
      
      <TabsContent value="all" class="mt-4">
        <TemplateGrid
          :templates="filteredTemplates"
          @select="selectTemplate"
          @edit="editTemplate"
          @delete="deleteTemplate"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
const searchQuery = ref('')
const selectedCategory = ref('all')
const templates = ref<DocumentTemplate[]>([])

// テンプレートのフィルタリング
const filteredTemplates = computed(() => {
  let filtered = templates.value
  
  // カテゴリーフィルター
  if (selectedCategory.value !== 'all') {
    filtered = filtered.filter(t => t.category === selectedCategory.value)
  }
  
  // 検索フィルター
  if (searchQuery.value) {
    const query = searchQuery.value.toLowerCase()
    filtered = filtered.filter(t => 
      t.name.toLowerCase().includes(query) ||
      t.description.toLowerCase().includes(query)
    )
  }
  
  return filtered
})

const createNewTemplate = () => {
  openTemplateEditor()
}

const selectTemplate = (template: DocumentTemplate) => {
  // テンプレートを選択して書類作成画面へ
  navigateTo(`/documents/new?templateId=${template.id}`)
}

const editTemplate = (template: DocumentTemplate) => {
  if (template.isSystem) {
    showToast({
      type: 'warning',
      title: 'システムテンプレートは編集できません'
    })
    return
  }
  openTemplateEditor(template)
}

const deleteTemplate = async (template: DocumentTemplate) => {
  if (template.isSystem) {
    showToast({
      type: 'warning',
      title: 'システムテンプレートは削除できません'
    })
    return
  }
  
  const confirmed = await confirm({
    title: 'テンプレートを削除しますか？',
    description: `「${template.name}」を削除します。この操作は取り消せません。`
  })
  
  if (confirmed) {
    await $fetch(`/api/v1/templates/${template.id}`, {
      method: 'DELETE'
    })
    await fetchTemplates()
  }
}
</script>
```

### 3.2 テンプレートグリッド表示

```vue
<template>
  <div class="template-grid">
    <Card
      v-for="template in templates"
      :key="template.id"
      class="template-card"
      @click="$emit('select', template)"
    >
      <CardContent class="p-4">
        <div class="flex items-start justify-between">
          <div class="flex-1">
            <h3 class="font-medium flex items-center gap-2">
              {{ template.name }}
              <Badge v-if="template.isSystem" variant="secondary" class="text-xs">
                システム
              </Badge>
            </h3>
            <p class="text-sm text-muted-foreground mt-1">
              {{ template.description }}
            </p>
            <div class="flex items-center gap-4 mt-3 text-xs text-muted-foreground">
              <span>{{ getCategoryLabel(template.category) }}</span>
              <span>更新: {{ formatDate(template.updatedAt) }}</span>
            </div>
          </div>
          
          <DropdownMenu v-if="!template.isSystem">
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" size="sm" @click.stop>
                <MoreVertical class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem @click="$emit('edit', template)">
                <Edit class="h-4 w-4 mr-2" />
                編集
              </DropdownMenuItem>
              <DropdownMenuItem @click="duplicateTemplate(template)">
                <Copy class="h-4 w-4 mr-2" />
                複製
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem 
                @click="$emit('delete', template)"
                class="text-destructive"
              >
                <Trash class="h-4 w-4 mr-2" />
                削除
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <!-- 使用する変数の表示 -->
        <div v-if="template.variables.length" class="mt-3">
          <div class="text-xs text-muted-foreground mb-1">使用する変数:</div>
          <div class="flex flex-wrap gap-1">
            <Badge
              v-for="variable in template.variables.slice(0, 5)"
              :key="variable.key"
              variant="outline"
              class="text-xs"
            >
              {{{{ variable.name }}}}
            </Badge>
            <span 
              v-if="template.variables.length > 5"
              class="text-xs text-muted-foreground"
            >
              他{{ template.variables.length - 5 }}個
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<style scoped>
.template-grid {
  @apply grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4;
}

.template-card {
  @apply cursor-pointer transition-shadow hover:shadow-md;
}
</style>
```

### 3.3 テンプレート編集画面

```vue
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-hidden flex flex-col">
      <DialogHeader>
        <DialogTitle>
          {{ isNew ? '新規テンプレート作成' : 'テンプレート編集' }}
        </DialogTitle>
      </DialogHeader>
      
      <div class="flex-1 overflow-auto">
        <div class="space-y-4">
          <!-- 基本情報 -->
          <div class="grid grid-cols-2 gap-4">
            <div>
              <Label>テンプレート名</Label>
              <Input v-model="template.name" placeholder="例：訴状" />
            </div>
            <div>
              <Label>カテゴリー</Label>
              <Select v-model="template.category">
                <SelectTrigger>
                  <SelectValue placeholder="カテゴリーを選択" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="litigation">訴訟関係</SelectItem>
                  <SelectItem value="application">申立書</SelectItem>
                  <SelectItem value="contract">契約書</SelectItem>
                  <SelectItem value="letter">書簡・通知</SelectItem>
                  <SelectItem value="internal">内部文書</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <div>
            <Label>説明</Label>
            <Textarea 
              v-model="template.description" 
              placeholder="このテンプレートの用途を説明してください"
              rows="2"
            />
          </div>
          
          <!-- 変数設定 -->
          <div>
            <div class="flex items-center justify-between mb-2">
              <Label>使用する変数</Label>
              <Button variant="outline" size="sm" @click="addVariable">
                <Plus class="h-4 w-4 mr-1" />
                変数追加
              </Button>
            </div>
            <div class="space-y-2">
              <div
                v-for="(variable, index) in template.variables"
                :key="index"
                class="flex items-center gap-2"
              >
                <Input
                  v-model="variable.name"
                  placeholder="変数名"
                  class="flex-1"
                />
                <Input
                  v-model="variable.key"
                  placeholder="キー"
                  class="w-32"
                />
                <Checkbox v-model="variable.required" />
                <Label class="text-sm">必須</Label>
                <Button
                  variant="ghost"
                  size="sm"
                  @click="removeVariable(index)"
                >
                  <X class="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>
          
          <!-- テンプレート本文 -->
          <div>
            <Label>テンプレート本文（Markdown）</Label>
            <div class="border rounded-md h-96 overflow-hidden">
              <MarkdownEditor
                v-model="template.content"
                :options="{ lineNumbers: true }"
              />
            </div>
            <p class="text-xs text-muted-foreground mt-1">
              変数は {{変数名}} の形式で記述してください
            </p>
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="close">
          キャンセル
        </Button>
        <Button @click="save" :disabled="!isValid">
          保存
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  initialTemplate?: DocumentTemplate
}>()

const isOpen = defineModel<boolean>('open')
const isNew = computed(() => !props.initialTemplate)

const template = reactive<Partial<DocumentTemplate>>({
  name: '',
  description: '',
  category: 'other',
  content: '',
  variables: [],
  ...props.initialTemplate
})

const isValid = computed(() => 
  template.name && 
  template.category && 
  template.content
)

const addVariable = () => {
  template.variables = [
    ...(template.variables || []),
    { name: '', key: '', required: false }
  ]
}

const removeVariable = (index: number) => {
  template.variables = template.variables?.filter((_, i) => i !== index)
}

const save = async () => {
  try {
    if (isNew.value) {
      await $fetch('/api/v1/templates', {
        method: 'POST',
        body: template
      })
    } else {
      await $fetch(`/api/v1/templates/${template.id}`, {
        method: 'PUT',
        body: template
      })
    }
    
    showToast({
      type: 'success',
      title: 'テンプレートを保存しました'
    })
    
    close()
    emit('saved')
  } catch (error) {
    showToast({
      type: 'error',
      title: 'エラーが発生しました'
    })
  }
}
</script>
```

## 4. テンプレートからの書類作成

### 4.1 テンプレート選択後のフロー

```vue
<template>
  <div class="document-from-template">
    <!-- 変数入力フォーム -->
    <Card v-if="showVariableForm" class="mb-4">
      <CardHeader>
        <CardTitle class="text-base">変数の入力</CardTitle>
        <CardDescription>
          テンプレートで使用する変数を入力してください
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div class="space-y-3">
          <div
            v-for="variable in requiredVariables"
            :key="variable.key"
          >
            <Label :for="variable.key">
              {{ variable.name }}
              <span v-if="variable.required" class="text-destructive">*</span>
            </Label>
            <Input
              :id="variable.key"
              v-model="variableValues[variable.key]"
              :placeholder="variable.description"
            />
          </div>
        </div>
        
        <div class="flex justify-end gap-2 mt-4">
          <Button variant="outline" @click="skipVariables">
            後で入力
          </Button>
          <Button @click="applyVariables" :disabled="!allRequiredFilled">
            適用
          </Button>
        </div>
      </CardContent>
    </Card>
    
    <!-- エディター -->
    <DocumentEditor
      v-model="content"
      :initial-variables="variableValues"
    />
  </div>
</template>

<script setup lang="ts">
const route = useRoute()
const templateId = route.query.templateId as string

const template = ref<DocumentTemplate>()
const content = ref('')
const variableValues = ref<Record<string, string>>({})
const showVariableForm = ref(true)

// テンプレート読み込み
onMounted(async () => {
  if (templateId) {
    const { data } = await $fetch(`/api/v1/templates/${templateId}`)
    template.value = data
    content.value = data.content
    
    // 案件情報から自動入力
    autoFillVariables()
  }
})

// 必須変数のチェック
const requiredVariables = computed(() => 
  template.value?.variables.filter(v => v.required) || []
)

const allRequiredFilled = computed(() => 
  requiredVariables.value.every(v => variableValues.value[v.key])
)

// 案件情報から変数を自動入力
const autoFillVariables = () => {
  const { currentCase } = useCaseStore()
  
  if (currentCase.value) {
    variableValues.value = {
      案件番号: currentCase.value.caseNumber,
      案件名: currentCase.value.title,
      原告名: currentCase.value.plaintiff?.name || '',
      被告名: currentCase.value.defendant?.name || '',
      // ... 他の自動入力
    }
  }
}

// 変数を適用
const applyVariables = () => {
  const { processMarkdown } = useMarkdownProcessor()
  content.value = processMarkdown(template.value!.content, variableValues.value)
  showVariableForm.value = false
}

const skipVariables = () => {
  showVariableForm.value = false
}
</script>
```

## 5. API設計

```typescript
// テンプレート一覧取得
GET /api/v1/templates

// テンプレート詳細取得
GET /api/v1/templates/{id}

// テンプレート作成
POST /api/v1/templates
{
  name: string
  description: string
  category: TemplateCategory
  content: string
  variables: TemplateVariable[]
}

// テンプレート更新
PUT /api/v1/templates/{id}

// テンプレート削除
DELETE /api/v1/templates/{id}

// テンプレート複製
POST /api/v1/templates/{id}/duplicate
```

## 6. 状態管理

```typescript
// stores/documentTemplates.ts
export const useDocumentTemplateStore = defineStore('documentTemplates', () => {
  const templates = ref<DocumentTemplate[]>([])
  const categories = ref<TemplateCategory[]>([
    'litigation',
    'application', 
    'contract',
    'letter',
    'internal',
    'other'
  ])
  
  // テンプレート取得
  const fetchTemplates = async () => {
    const { data } = await $fetch('/api/v1/templates')
    templates.value = data
  }
  
  // テンプレート作成
  const createTemplate = async (template: Partial<DocumentTemplate>) => {
    const { data } = await $fetch('/api/v1/templates', {
      method: 'POST',
      body: template
    })
    templates.value.push(data)
    return data
  }
  
  // テンプレート更新
  const updateTemplate = async (id: string, updates: Partial<DocumentTemplate>) => {
    const { data } = await $fetch(`/api/v1/templates/${id}`, {
      method: 'PUT',
      body: updates
    })
    
    const index = templates.value.findIndex(t => t.id === id)
    if (index !== -1) {
      templates.value[index] = data
    }
    
    return data
  }
  
  // テンプレート削除
  const deleteTemplate = async (id: string) => {
    await $fetch(`/api/v1/templates/${id}`, {
      method: 'DELETE'
    })
    
    templates.value = templates.value.filter(t => t.id !== id)
  }
  
  // カテゴリー別テンプレート取得
  const getTemplatesByCategory = (category: TemplateCategory) => {
    return templates.value.filter(t => t.category === category)
  }
  
  return {
    templates: readonly(templates),
    categories: readonly(categories),
    fetchTemplates,
    createTemplate,
    updateTemplate,
    deleteTemplate,
    getTemplatesByCategory
  }
})
```