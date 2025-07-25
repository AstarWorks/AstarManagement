---
task_id: T04_S01_Case_Management_Kanban
status: completed
priority: High
dependencies: T01_S01_Nuxt3_Project_Foundation, T02_S01_Authentication_System_UI, T03_S01_Basic_Layout_System
sprint: S01_M001_FRONTEND_MVP
updated: 2025-07-24 16:45
completion_notes: |
  ✅ Kanban board layout implemented with 7 Japanese legal status columns
  ✅ Case card component with comprehensive information display
  ✅ Drag-and-drop functionality using Vue Draggable
  ✅ Advanced filtering system with real-time search
  ✅ Mobile-responsive design with touch support
  ✅ Mock data integration with realistic Japanese legal scenarios
  ✅ TypeScript interfaces and type safety throughout
  ✅ Component architecture ready for Storybook integration
---

# T04_S01 - Case Management Kanban Board

## Task Overview
**Duration**: 8 hours  
**Priority**: High  
**Dependencies**: T01_S01_Nuxt3_Project_Foundation, T02_S01_Authentication_System_UI, T03_S01_Basic_Layout_System  
**Sprint**: S01_M001_FRONTEND_MVP  

## Objective
Implement a comprehensive kanban board for Japanese legal case management with 7-status workflow, drag-and-drop functionality, real-time filtering, and mobile-responsive design optimized for legal practice workflows.

## Background
This task creates the core case management interface that enables lawyers and staff to visualize and manage case progress through the Japanese legal workflow. The kanban board must handle complex legal status transitions while remaining intuitive for users of varying technical expertise.

## Technical Requirements

### 1. Kanban Board Layout
Responsive 7-column kanban board for Japanese legal workflow:

**Location**: `pages/cases/kanban.vue`

**Status Columns**:
- 新規 (New) - Initial case intake
- 受任 (Accepted) - Case officially accepted
- 調査 (Investigation) - Evidence gathering phase
- 準備 (Preparation) - Case preparation
- 交渉 (Negotiation) - Settlement negotiations
- 裁判 (Trial) - Court proceedings
- 完了 (Completed) - Case closed

### 2. Drag-and-Drop System
Intuitive case status transitions:

**Features Required**:
- Vue draggable integration with touch support
- Visual feedback during drag operations
- Status transition validation
- Optimistic updates with rollback on failure
- Accessibility support for keyboard navigation

### 3. Case Card Component
Comprehensive case information display:

**Location**: `components/cases/CaseCard.vue`

**Card Elements**:
- Case number and title with Japanese typography
- Client name and case type
- Priority indicators and status badges
- Due date alerts and progress indicators
- Tag system for categorization
- Quick action buttons (edit, view details)

### 4. Filtering and Search
Real-time case filtering capabilities:

**Filter Options**:
- Text search across case title, number, client
- Client type filter (individual/corporate)
- Case priority levels
- Due date ranges
- Assigned lawyer/staff member
- Tag-based filtering with AND/OR logic

## 設計詳細

### Section 3: カードコンポーネント設計 (Case Card Component Design)

日本の法律事務所向けの案件カードコンポーネントを設計します。法的業務に特化した情報表示とユーザビリティを重視します。

#### 3.1 型安全なコンポーネントアーキテクチャ

```typescript
// types/case-card.ts - 完全な型定義
export interface CaseCardProps {
  readonly case: Case
  readonly viewMode: ViewMode
  readonly interactive: boolean
  readonly showQuickActions: boolean
}

export type ViewMode = 'minimal' | 'compact' | 'detailed'

export interface CardDisplayConfig {
  readonly title: {
    readonly maxLines: 1 | 2 | 3
    readonly fontSize: 'text-sm' | 'text-base' | 'text-lg'
  }
  readonly spacing: 'compact' | 'normal' | 'spacious'
  readonly showElements: {
    readonly progress: boolean
    readonly tags: boolean
    readonly dueDate: boolean
    readonly quickActions: boolean
  }
}

export interface QuickAction {
  readonly key: 'view' | 'edit' | 'duplicate' | 'archive'
  readonly label: string
  readonly icon: string
  readonly permissions: readonly Permission[]
}

// Result型での安全なエラーハンドリング
export type ActionResult<T = void> = 
  | { success: true; data: T }
  | { success: false; error: string; code: string }
```

#### 3.2 単機能Composables設計

```typescript
// composables/useCardDisplay.ts - 単純な表示設定
export const useCardDisplay = (viewMode: ViewMode): CardDisplayConfig => {
  const configs: Record<ViewMode, CardDisplayConfig> = {
    minimal: {
      title: { maxLines: 1, fontSize: 'text-sm' },
      spacing: 'compact',
      showElements: {
        progress: false,
        tags: false,
        dueDate: false,
        quickActions: false
      }
    },
    compact: {
      title: { maxLines: 2, fontSize: 'text-base' },
      spacing: 'normal',
      showElements: {
        progress: false,
        tags: true,
        dueDate: true,
        quickActions: false
      }
    },
    detailed: {
      title: { maxLines: 3, fontSize: 'text-base' },
      spacing: 'spacious',
      showElements: {
        progress: true,
        tags: true,
        dueDate: true,
        quickActions: true
      }
    }
  }
  
  return configs[viewMode]
}

// composables/useCardStyling.ts - 純粋関数によるスタイリング
export const useCardStyling = () => {
  const getPriorityClasses = (priority: CasePriority): string => {
    const priorityMap: Record<CasePriority, string> = {
      high: 'border-l-red-500',
      medium: 'border-l-orange-500',
      low: 'border-l-gray-400'
    }
    return priorityMap[priority]
  }
  
  const getStatusClasses = (status: CaseStatus): string => {
    const statusMap: Record<CaseStatus, string> = {
      new: 'bg-blue-50 text-blue-700',
      accepted: 'bg-green-50 text-green-700',
      investigation: 'bg-yellow-50 text-yellow-700',
      preparation: 'bg-purple-50 text-purple-700',
      negotiation: 'bg-indigo-50 text-indigo-700',
      trial: 'bg-red-50 text-red-700',
      completed: 'bg-gray-50 text-gray-700'
    }
    return statusMap[status]
  }
  
  const getCardClasses = (
    case_: Case, 
    interactive: boolean, 
    isOverdue: boolean,
    isDueSoon: boolean
  ): string[] => {
    return [
      'case-card',
      'rounded-lg p-4 transition-all duration-200',
      getPriorityClasses(case_.priority),
      interactive ? 'cursor-pointer hover:shadow-md focus:outline-none focus:ring-2 focus:ring-primary' : '',
      isOverdue ? 'bg-red-50 border-red-200' : '',
      isDueSoon ? 'bg-orange-50 border-orange-200' : ''
    ].filter(Boolean)
  }
  
  return {
    getPriorityClasses,
    getStatusClasses,
    getCardClasses
  }
}

// composables/useCardActions.ts - 責任分離された単機能アクション
export const useCardActions = () => {
  const router = useRouter()
  const { showConfirmDialog } = useDialog()
  const { duplicateCase } = useCaseService()
  
  // 純粋関数のアクションハンドラー
  const createViewHandler = (caseId: string) => async (): Promise<ActionResult> => {
    try {
      await router.push(`/cases/${caseId}`)
      return { success: true, data: undefined }
    } catch (error) {
      return { 
        success: false, 
        error: 'ページの移動に失敗しました',
        code: 'NAVIGATION_FAILED'
      }
    }
  }
  
  const createEditHandler = (caseId: string) => async (): Promise<ActionResult> => {
    try {
      await router.push(`/cases/${caseId}/edit`)
      return { success: true, data: undefined }
    } catch (error) {
      return { 
        success: false, 
        error: 'ページの移動に失敗しました',
        code: 'NAVIGATION_FAILED'
      }
    }
  }
  
  const createDuplicateHandler = (case_: Case) => async (): Promise<ActionResult> => {
    try {
      const confirmed = await showConfirmDialog({
        title: '案件の複製',
        message: `「${case_.title}」を複製しますか？`,
        confirmText: '複製',
        cancelText: 'キャンセル'
      })
      
      if (!confirmed) {
        return { success: true, data: undefined }
      }
      
      const result = await duplicateCase(case_.id)
      if (!result.success) {
        return result
      }
      
      return { success: true, data: result.data }
    } catch (error) {
      return { 
        success: false, 
        error: '案件の複製に失敗しました',
        code: 'DUPLICATE_FAILED'
      }
    }
  }
  
  // ファクトリー関数
  const createActionHandler = (action: QuickAction, case_: Case) => {
    const handlers = {
      view: createViewHandler(case_.id),
      edit: createEditHandler(case_.id),
      duplicate: createDuplicateHandler(case_),
      archive: () => Promise.resolve({ success: false, error: 'Not implemented', code: 'NOT_IMPLEMENTED' } as ActionResult)
    }
    
    return handlers[action.key] || handlers.archive
  }
  
  return {
    createActionHandler
  }
}

// composables/useCardAccessibility.ts - アクセシビリティ特化
export const useCardAccessibility = (case_: Case, interactive: boolean) => {
  const { t } = useI18n()
  
  const ariaLabel = computed(() => {
    const parts = [
      t('case.aria.label'),
      case_.caseNumber,
      case_.title,
      t('case.aria.client', { name: case_.client.name }),
      t('case.aria.status', { status: t(`case.status.${case_.status}`) }),
      t('case.aria.priority', { priority: t(`case.priority.${case_.priority}`) })
    ]
    
    if (case_.dueDate) {
      const dueDate = formatDate(new Date(case_.dueDate), 'yyyy年M月d日')
      parts.push(t('case.aria.dueDate', { date: dueDate }))
    }
    
    return parts.join(', ')
  })
  
  const getKeyboardHandler = (onClick: () => void) => {
    return (event: KeyboardEvent): void => {
      if (!interactive) return
      
      if (event.key === 'Enter' || event.key === ' ') {
        event.preventDefault()
        onClick()
      }
    }
  }
  
  const tabIndex = computed(() => interactive ? 0 : -1)
  const role = computed(() => interactive ? 'button' : 'article')
  
  return {
    ariaLabel,
    getKeyboardHandler,
    tabIndex,
    role
  }
}
```

#### 3.3 メインコンポーネント実装

```vue
<!-- components/cases/CaseCard.vue - 改善されたメインコンポーネント -->
<template>
  <Card 
    :class="cardClasses"
    :aria-label="ariaLabel"
    :tabindex="tabIndex"
    :role="role"
    @click="handleClick"
    @keydown="handleKeyDown"
  >
    <CaseCardHeader
      :case="case"
      :config="displayConfig"
      @title-click="handleTitleClick"
    />
    
    <CaseCardContent
      :case="case"
      :config="displayConfig"
    />
    
    <CaseCardFooter
      v-if="displayConfig.showElements.quickActions"
      :case="case"
      :actions="availableActions"
      @action="handleAction"
    />
    
    <LoadingOverlay v-if="isLoading" />
  </Card>
</template>

<script setup lang="ts">
import { computed, ref } from 'vue'
import type { CaseCardProps, QuickAction, ActionResult } from '@/types/case-card'

const props = withDefaults(defineProps<CaseCardProps>(), {
  interactive: true,
  showQuickActions: true
})

const emit = defineEmits<{
  click: [case_: Case]
  action: [action: QuickAction, result: ActionResult]
}>()

// 単機能composables
const displayConfig = useCardDisplay(props.viewMode)
const { getCardClasses } = useCardStyling()
const { createActionHandler } = useCardActions()
const { ariaLabel, getKeyboardHandler, tabIndex, role } = useCardAccessibility(props.case, props.interactive)
const { isOverdue, isDueSoon } = useDateStatus(props.case.dueDate)
const { availableActions } = usePermissionFilter(QUICK_ACTIONS, props.case)

// 状態
const isLoading = ref(false)

// 計算プロパティ
const cardClasses = computed(() => 
  getCardClasses(props.case, props.interactive, isOverdue.value, isDueSoon.value)
)

// イベントハンドラー
const handleClick = (): void => {
  if (!props.interactive) return
  emit('click', props.case)
}

const handleKeyDown = getKeyboardHandler(handleClick)

const handleTitleClick = (): void => {
  handleClick()
}

const handleAction = async (action: QuickAction): Promise<void> => {
  isLoading.value = true
  
  try {
    const handler = createActionHandler(action, props.case)
    const result = await handler()
    emit('action', action, result)
    
    if (!result.success) {
      useToast().error(result.error)
    }
  } finally {
    isLoading.value = false
  }
}
</script>
```

#### 3.4 子コンポーネント設計

```vue
<!-- components/cases/CaseCardHeader.vue -->
<template>
  <CardHeader :class="headerClasses">
    <div class="flex items-start justify-between">
      <div class="flex-1 min-w-0">
        <!-- 案件番号 -->
        <div class="case-number text-xs font-mono text-muted-foreground mb-1">
          {{ formatCaseNumber(case.caseNumber) }}
        </div>
        
        <!-- 案件タイトル -->
        <CardTitle 
          :class="titleClasses"
          @click="$emit('titleClick', $event)"
        >
          <span 
            :title="case.title"
            :style="titleStyle"
            class="block"
          >
            {{ case.title }}
          </span>
        </CardTitle>
        
        <!-- 依頼者情報 -->
        <div class="flex items-center gap-1 text-xs text-muted-foreground mt-1">
          <User :size="12" class="flex-shrink-0" />
          <span class="truncate">{{ case.client.name }}</span>
          <ClientTypeBadge 
            v-if="case.client.type === 'corporate'"
            :type="case.client.type"
            size="xs"
            class="ml-1"
          />
        </div>
      </div>
      
      <!-- ステータスバッジ -->
      <StatusBadge 
        :status="case.status"
        :size="config.spacing === 'compact' ? 'xs' : 'sm'"
        class="flex-shrink-0"
      />
    </div>
  </CardHeader>
</template>

<script setup lang="ts">
import type { Case, CardDisplayConfig } from '@/types/case-card'

interface CaseCardHeaderProps {
  readonly case: Case
  readonly config: CardDisplayConfig
}

const props = defineProps<CaseCardHeaderProps>()
const emit = defineEmits<{
  titleClick: [event: MouseEvent]
}>()

// 計算プロパティ
const headerClasses = computed(() => [
  'case-card-header',
  props.config.spacing === 'compact' ? 'pb-2' : 'pb-3'
])

const titleClasses = computed(() => [
  'case-title cursor-pointer hover:text-primary transition-colors',
  props.config.title.fontSize,
  'font-semibold leading-tight'
])

const titleStyle = computed(() => ({
  display: '-webkit-box',
  WebkitLineClamp: props.config.title.maxLines,
  WebkitBoxOrient: 'vertical' as const,
  overflow: 'hidden'
}))

// ヘルパー関数
const formatCaseNumber = (caseNumber: string): string => {
  return caseNumber.replace(/([A-Z]+)(\d+)/, '$1-$2')
}
</script>
```

#### 3.5 テスト戦略

```typescript
// tests/components/CaseCard.test.ts - 改善されたテスト
import { describe, it, expect, vi } from 'vitest'
import { mount } from '@vue/test-utils'
import CaseCard from '@/components/cases/CaseCard.vue'
import { createMockCase } from '@/tests/factories/case'
import { createTestingPinia } from '@pinia/testing'

describe('CaseCard', () => {
  const mockCase = createMockCase({
    priority: 'high',
    status: 'investigation'
  })
  
  const createWrapper = (props = {}) => {
    return mount(CaseCard, {
      props: { case: mockCase, ...props },
      global: {
        plugins: [createTestingPinia()]
      }
    })
  }
  
  describe('表示設定', () => {
    it('should apply correct classes for detailed view', () => {
      const wrapper = createWrapper({ viewMode: 'detailed' })
      
      expect(wrapper.classes()).toContain('case-card')
      expect(wrapper.classes()).toContain('border-l-red-500') // high priority
    })
    
    it('should show all elements in detailed view', () => {
      const wrapper = createWrapper({ viewMode: 'detailed' })
      
      expect(wrapper.findComponent({ name: 'CaseCardHeader' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'CaseCardContent' }).exists()).toBe(true)
      expect(wrapper.findComponent({ name: 'CaseCardFooter' }).exists()).toBe(true)
    })
    
    it('should hide footer in compact view', () => {
      const wrapper = createWrapper({ viewMode: 'compact' })
      
      expect(wrapper.findComponent({ name: 'CaseCardFooter' }).exists()).toBe(false)
    })
  })
  
  describe('アクセシビリティ', () => {
    it('should have proper ARIA attributes when interactive', () => {
      const wrapper = createWrapper({ interactive: true })
      
      expect(wrapper.attributes('role')).toBe('button')
      expect(wrapper.attributes('tabindex')).toBe('0')
      expect(wrapper.attributes('aria-label')).toContain(mockCase.title)
    })
    
    it('should have article role when not interactive', () => {
      const wrapper = createWrapper({ interactive: false })
      
      expect(wrapper.attributes('role')).toBe('article')
      expect(wrapper.attributes('tabindex')).toBe('-1')
    })
    
    it('should handle keyboard events', async () => {
      const wrapper = createWrapper({ interactive: true })
      
      await wrapper.trigger('keydown', { key: 'Enter' })
      expect(wrapper.emitted('click')).toHaveLength(1)
      
      await wrapper.trigger('keydown', { key: ' ' })
      expect(wrapper.emitted('click')).toHaveLength(2)
    })
  })
  
  describe('アクション処理', () => {
    it('should emit click event when clicked', async () => {
      const wrapper = createWrapper({ interactive: true })
      
      await wrapper.trigger('click')
      expect(wrapper.emitted('click')).toHaveLength(1)
      expect(wrapper.emitted('click')?.[0]).toEqual([mockCase])
    })
    
    it('should handle action results correctly', async () => {
      const mockAction = { key: 'view' as const, label: '詳細', icon: 'FileText', permissions: [] }
      const wrapper = createWrapper()
      
      wrapper.vm.handleAction(mockAction)
      await wrapper.vm.$nextTick()
      
      expect(wrapper.emitted('action')).toBeDefined()
    })
  })
  
  describe('期日ステータス', () => {
    it('should show overdue styling for past dates', () => {
      const overdueCase = createMockCase({
        dueDate: new Date(Date.now() - 86400000).toISOString()
      })
      
      const wrapper = createWrapper({ case: overdueCase })
      expect(wrapper.classes()).toContain('bg-red-50')
    })
  })
})

// ユーティリティ関数のユニットテスト
describe('useCardStyling', () => {
  const { getPriorityClasses, getStatusClasses } = useCardStyling()
  
  it('should return correct priority classes', () => {
    expect(getPriorityClasses('high')).toBe('border-l-red-500')
    expect(getPriorityClasses('medium')).toBe('border-l-orange-500')
    expect(getPriorityClasses('low')).toBe('border-l-gray-400')
  })
  
  it('should return correct status classes', () => {
    expect(getStatusClasses('new')).toBe('bg-blue-50 text-blue-700')
    expect(getStatusClasses('completed')).toBe('bg-gray-50 text-gray-700')
  })
})
```

#### 3.6 Storybook統合

```typescript
// stories/CaseCard.stories.ts
import type { Meta, StoryObj } from '@storybook/vue3'
import CaseCard from '@/components/cases/CaseCard.vue'
import { createMockCase } from '@/tests/factories/case'

const meta: Meta<typeof CaseCard> = {
  title: 'Legal/CaseCard',
  component: CaseCard,
  parameters: {
    layout: 'padded'
  },
  argTypes: {
    viewMode: {
      control: 'select',
      options: ['minimal', 'compact', 'detailed']
    },
    interactive: {
      control: 'boolean'
    },
    showQuickActions: {
      control: 'boolean'
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

const baseCase = createMockCase()

export const Detailed: Story = {
  args: {
    case: baseCase,
    viewMode: 'detailed',
    interactive: true,
    showQuickActions: true
  }
}

export const Compact: Story = {
  args: {
    case: baseCase,
    viewMode: 'compact',
    interactive: true,
    showQuickActions: false
  }
}

export const Minimal: Story = {
  args: {
    case: baseCase,
    viewMode: 'minimal',
    interactive: true,
    showQuickActions: false
  }
}

export const HighPriority: Story = {
  args: {
    case: { ...baseCase, priority: 'high' },
    viewMode: 'detailed'
  }
}

export const Overdue: Story = {
  args: {
    case: { 
      ...baseCase, 
      dueDate: new Date(Date.now() - 86400000).toISOString(),
      priority: 'high'
    },
    viewMode: 'detailed'
  }
}

export const DueSoon: Story = {
  args: {
    case: { 
      ...baseCase, 
      dueDate: new Date(Date.now() + 172800000).toISOString()
    },
    viewMode: 'detailed'
  }
}
```

### Section 4: フィルタリングシステム設計 (Filtering System Design)

日本の法律事務所向けの高度なフィルタリングシステムを設計します。複雑な検索条件と法的業務特有の要件に対応します。

#### 4.1 型安全なフィルタアーキテクチャ

```typescript
// types/filter.ts - 完全な型定義
export interface FilterConfig<T> {
  readonly fields: readonly (keyof T)[]
  readonly searchable: boolean
  readonly sortable: boolean
  readonly defaultValue: FilterValue<T>
}

export type FilterValue<T> = T[keyof T] | null

export interface FilterOperation<T> {
  readonly type: FilterType
  readonly apply: (items: readonly T[], value: any) => readonly T[]
  readonly validate: (value: any) => boolean
}

export type FilterType = 
  | 'text_search'
  | 'exact_match' 
  | 'multi_select'
  | 'date_range'
  | 'tag_condition'

// Result型での安全なエラーハンドリング
export type FilterResult<T, E = FilterError> = 
  | { success: true; data: FilteredData<T> }
  | { success: false; error: E }

export interface FilteredData<T> {
  readonly items: readonly T[]
  readonly stats: FilterStats
  readonly performance: PerformanceMetrics
}

export interface FilterError {
  readonly code: FilterErrorCode
  readonly message: string
  readonly field?: string
}

export type FilterErrorCode = 
  | 'INVALID_SEARCH_TERM'
  | 'INVALID_DATE_RANGE' 
  | 'MISSING_REQUIRED_FIELD'
  | 'FILTER_TIMEOUT'
```

#### 4.2 単機能フィルタ操作

```typescript
// utils/filterOperations.ts - 単機能フィルタ操作
export const createTextSearchOperation = <T extends Record<string, any>>(): FilterOperation<T> => {
  const apply = (items: readonly T[], searchTerm: string): readonly T[] => {
    if (!searchTerm?.trim()) return items
    
    const normalizedTerm = searchTerm.toLowerCase().trim()
    const searchableFields = ['title', 'caseNumber', 'client.name'] as const
    
    return items.filter(item => 
      searchableFields.some(field => {
        const value = getFieldValue(item, field)
        return typeof value === 'string' && 
               normalizeText(value).includes(normalizedTerm)
      })
    )
  }
  
  const validate = (value: any): boolean => {
    return typeof value === 'string' && value.length <= 100
  }
  
  return {
    type: 'text_search',
    apply,
    validate
  }
}

export const createMultiSelectOperation = <T extends Record<string, any>>(
  field: keyof T
): FilterOperation<T> => {
  const apply = (items: readonly T[], values: readonly string[]): readonly T[] => {
    if (!values || values.length === 0) return items
    
    return items.filter(item => {
      const itemValue = getFieldValue(item, field)
      return values.includes(String(itemValue))
    })
  }
  
  const validate = (value: any): boolean => {
    return Array.isArray(value) && value.every(v => typeof v === 'string')
  }
  
  return {
    type: 'multi_select',
    apply,
    validate
  }
}

export const createDateRangeOperation = <T extends Record<string, any>>(
  field: keyof T
): FilterOperation<T> => {
  const apply = (items: readonly T[], range: DateRange): readonly T[] => {
    if (!range.from && !range.to) return items
    
    return items.filter(item => {
      const itemValue = getFieldValue(item, field)
      if (!itemValue) return false
      
      const itemDate = new Date(String(itemValue))
      if (isNaN(itemDate.getTime())) return false
      
      if (range.from && itemDate < new Date(range.from)) return false
      if (range.to && itemDate > new Date(range.to)) return false
      
      return true
    })
  }
  
  const validate = (value: any): boolean => {
    if (!value || typeof value !== 'object') return false
    
    const { from, to } = value
    if (from && isNaN(new Date(from).getTime())) return false
    if (to && isNaN(new Date(to).getTime())) return false
    
    return true
  }
  
  return {
    type: 'date_range',
    apply,
    validate
  }
}

export const createTagConditionOperation = <T extends { tags: Tag[] }>(): FilterOperation<T> => {
  const apply = (items: readonly T[], condition: TagCondition): readonly T[] => {
    if (!condition.tags.length) return items
    
    return items.filter(item => {
      const itemTagIds = item.tags.map(tag => tag.id)
      
      // 除外チェック
      if (condition.exclude.some(excludeId => itemTagIds.includes(excludeId))) {
        return false
      }
      
      // 包含チェック
      if (condition.mode === 'AND') {
        return condition.tags.every(tagId => itemTagIds.includes(tagId))
      } else {
        return condition.tags.some(tagId => itemTagIds.includes(tagId))
      }
    })
  }
  
  const validate = (value: any): boolean => {
    if (!value || typeof value !== 'object') return false
    
    const { tags, mode, exclude } = value
    return Array.isArray(tags) && 
           ['AND', 'OR'].includes(mode) && 
           Array.isArray(exclude)
  }
  
  return {
    type: 'tag_condition',
    apply,
    validate
  }
}

// ヘルパー関数
const getFieldValue = <T>(obj: T, path: string): unknown => {
  const keys = path.split('.')
  let current: any = obj
  
  for (const key of keys) {
    if (current == null || typeof current !== 'object') return undefined
    current = current[key]
  }
  
  return current
}

const normalizeText = (text: string): string => {
  return text.toLowerCase().trim()
}
```

#### 4.3 責任分離されたフィルタエンジン

```typescript
// composables/useFilterEngine.ts - 責任分離されたフィルタエンジン
export const useFilterEngine = <T extends Record<string, any>>() => {
  const operations = new Map<string, FilterOperation<T>>()
  
  // 操作の登録
  const registerOperation = (key: string, operation: FilterOperation<T>): void => {
    operations.set(key, operation)
  }
  
  // フィルタ適用
  const applyFilters = (
    items: readonly T[], 
    filters: Record<string, any>
  ): FilterResult<T> => {
    try {
      const startTime = performance.now()
      let filteredItems = [...items]
      const appliedOperations: string[] = []
      
      for (const [key, value] of Object.entries(filters)) {
        if (value == null) continue
        
        const operation = operations.get(key)
        if (!operation) {
          console.warn(`Unknown filter operation: ${key}`)
          continue
        }
        
        if (!operation.validate(value)) {
          return {
            success: false,
            error: {
              code: 'INVALID_SEARCH_TERM',
              message: `Invalid value for filter: ${key}`,
              field: key
            }
          }
        }
        
        filteredItems = operation.apply(filteredItems, value)
        appliedOperations.push(key)
      }
      
      const endTime = performance.now()
      
      return {
        success: true,
        data: {
          items: filteredItems,
          stats: {
            totalCount: items.length,
            filteredCount: filteredItems.length,
            appliedOperations
          },
          performance: {
            searchTime: endTime - startTime,
            operationCount: appliedOperations.length
          }
        }
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'FILTER_TIMEOUT',
          message: 'Filter operation failed',
        }
      }
    }
  }
  
  return {
    registerOperation,
    applyFilters
  }
}

// composables/useCaseFilterEngine.ts - Case特化のファクトリー
export const useCaseFilterEngine = () => {
  const engine = useFilterEngine<Case>()
  
  // Case専用の操作を登録
  engine.registerOperation('search', createTextSearchOperation<Case>())
  engine.registerOperation('status', createMultiSelectOperation<Case>('status'))
  engine.registerOperation('priority', createMultiSelectOperation<Case>('priority'))
  engine.registerOperation('assignedTo', createMultiSelectOperation<Case>('assignedLawyer.id'))
  engine.registerOperation('createdDate', createDateRangeOperation<Case>('createdAt'))
  engine.registerOperation('dueDate', createDateRangeOperation<Case>('dueDate'))
  engine.registerOperation('tags', createTagConditionOperation<Case>())
  
  return engine
}
```

#### 4.4 状態管理の責任分離

```typescript
// composables/useFilterState.ts - 状態管理の責任分離
export const useFilterState = <T extends Record<string, any>>(
  defaultFilters: Record<string, any> = {}
) => {
  const filters = ref<Record<string, any>>({ ...defaultFilters })
  const isLoading = ref(false)
  
  // 単純な更新操作
  const updateFilter = (key: string, value: any): void => {
    filters.value = {
      ...filters.value,
      [key]: value
    }
  }
  
  const clearFilter = (key: string): void => {
    const { [key]: removed, ...rest } = filters.value
    filters.value = rest
  }
  
  const clearAllFilters = (): void => {
    filters.value = { ...defaultFilters }
  }
  
  const resetToDefaults = (): void => {
    filters.value = { ...defaultFilters }
  }
  
  // アクティブフィルタの判定
  const hasActiveFilters = computed(() => {
    return Object.entries(filters.value).some(([key, value]) => {
      const defaultValue = defaultFilters[key]
      return value != null && value !== defaultValue
    })
  })
  
  // フィルタの検証
  const validateFilters = (): FilterValidationResult => {
    const errors: FilterValidationError[] = []
    
    for (const [key, value] of Object.entries(filters.value)) {
      if (value == null) continue
      
      // TODO: バリデーションロジックの実装
    }
    
    return {
      isValid: errors.length === 0,
      errors
    }
  }
  
  return {
    filters: readonly(filters),
    isLoading: readonly(isLoading),
    hasActiveFilters,
    updateFilter,
    clearFilter,
    clearAllFilters,
    resetToDefaults,
    validateFilters
  }
}

// composables/useFilterPersistence.ts - 永続化の責任分離
export const useFilterPersistence = (
  storageKey: string,
  filters: Ref<Record<string, any>>
) => {
  const savedSearches = useLocalStorage<SavedSearch[]>(`${storageKey}-saved`, [])
  
  const saveCurrentSearch = (name: string): SaveSearchResult => {
    try {
      if (!name.trim()) {
        return {
          success: false,
          error: { code: 'INVALID_NAME', message: '検索名が必要です' }
        }
      }
      
      const search: SavedSearch = {
        id: generateId(),
        name: name.trim(),
        filters: { ...filters.value },
        createdAt: new Date().toISOString(),
        resultCount: 0 // 実行時に設定
      }
      
      savedSearches.value = [search, ...savedSearches.value.slice(0, 9)]
      
      return { success: true, data: search }
    } catch (error) {
      return {
        success: false,
        error: { code: 'SAVE_FAILED', message: '保存に失敗しました' }
      }
    }
  }
  
  const loadSavedSearch = (searchId: string): LoadSearchResult => {
    const search = savedSearches.value.find(s => s.id === searchId)
    
    if (!search) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: '検索が見つかりません' }
      }
    }
    
    return { success: true, data: search }
  }
  
  const deleteSavedSearch = (searchId: string): DeleteSearchResult => {
    const index = savedSearches.value.findIndex(s => s.id === searchId)
    
    if (index === -1) {
      return {
        success: false,
        error: { code: 'NOT_FOUND', message: '検索が見つかりません' }
      }
    }
    
    savedSearches.value.splice(index, 1)
    return { success: true, data: undefined }
  }
  
  return {
    savedSearches: readonly(savedSearches),
    saveCurrentSearch,
    loadSavedSearch,
    deleteSavedSearch
  }
}
```

#### 4.5 改善されたUIコンポーネント

```vue
<!-- components/cases/CaseFilters.vue - 改善されたコンポーネント -->
<template>
  <div class="case-filters">
    <FilterControls
      :filters="filters"
      :filter-stats="filterStats"
      :available-tags="availableTags"
      @update-filter="handleFilterUpdate"
      @clear-filter="handleFilterClear"
    />
    
    <FilterSummary
      v-if="hasActiveFilters"
      :applied-filters="appliedFilters"
      :result-count="resultCount"
      @clear-filter="handleFilterClear"
      @clear-all="handleClearAll"
    />
    
    <SavedSearchManager
      :searches="savedSearches"
      :can-save="hasActiveFilters"
      @save="handleSaveSearch"
      @load="handleLoadSearch"
      @delete="handleDeleteSearch"
    />
  </div>
</template>

<script setup lang="ts">
interface CaseFiltersProps {
  readonly filters: Record<string, any>
  readonly hasActiveFilters: boolean
  readonly appliedFilters: AppliedFilter[]
  readonly resultCount: number
  readonly filterStats: FilterStats
  readonly availableTags: readonly Tag[]
  readonly savedSearches: readonly SavedSearch[]
}

const props = defineProps<CaseFiltersProps>()

const emit = defineEmits<{
  updateFilter: [key: string, value: any]
  clearFilter: [key: string]
  clearAllFilters: []
  saveSearch: [name: string]
  loadSearch: [searchId: string]
  deleteSearch: [searchId: string]
}>()

// 純粋なイベントハンドラー
const handleFilterUpdate = (key: string, value: any): void => {
  emit('updateFilter', key, value)
}

const handleFilterClear = (key: string): void => {
  emit('clearFilter', key)
}

const handleClearAll = (): void => {
  emit('clearAllFilters')
}

const handleSaveSearch = (name: string): void => {
  emit('saveSearch', name)
}

const handleLoadSearch = (searchId: string): void => {
  emit('loadSearch', searchId)
}

const handleDeleteSearch = (searchId: string): void => {
  emit('deleteSearch', searchId)
}
</script>
```

#### 4.6 テスト戦略

```typescript
// tests/utils/filterOperations.test.ts - 改善されたテスト
import { describe, it, expect } from 'vitest'
import { 
  createTextSearchOperation, 
  createMultiSelectOperation,
  createDateRangeOperation 
} from '@/utils/filterOperations'
import { createMockCase } from '@/tests/factories/case'

describe('filterOperations', () => {
  describe('createTextSearchOperation', () => {
    const operation = createTextSearchOperation<Case>()
    
    it('should filter items by search term', () => {
      const cases = [
        createMockCase({ title: 'Contract Dispute Case' }),
        createMockCase({ title: 'Personal Injury Claim' }),
        createMockCase({ caseNumber: 'CONTRACT-2024-001' })
      ]
      
      const result = operation.apply(cases, 'contract')
      
      expect(result).toHaveLength(2)
      expect(result[0].title).toContain('Contract')
      expect(result[1].caseNumber).toContain('CONTRACT')
    })
    
    it('should return all items for empty search', () => {
      const cases = [createMockCase(), createMockCase()]
      
      const result = operation.apply(cases, '')
      
      expect(result).toHaveLength(2)
    })
    
    it('should validate search terms correctly', () => {
      expect(operation.validate('valid search')).toBe(true)
      expect(operation.validate('')).toBe(true)
      expect(operation.validate(null)).toBe(false)
      expect(operation.validate(123)).toBe(false)
      expect(operation.validate('a'.repeat(101))).toBe(false)
    })
  })
  
  describe('createMultiSelectOperation', () => {
    const operation = createMultiSelectOperation<Case>('status')
    
    it('should filter by multiple status values', () => {
      const cases = [
        createMockCase({ status: 'new' }),
        createMockCase({ status: 'accepted' }),
        createMockCase({ status: 'completed' })
      ]
      
      const result = operation.apply(cases, ['new', 'accepted'])
      
      expect(result).toHaveLength(2)
      expect(result.map(c => c.status)).toEqual(['new', 'accepted'])
    })
    
    it('should return all items for empty selection', () => {
      const cases = [createMockCase(), createMockCase()]
      
      const result = operation.apply(cases, [])
      
      expect(result).toHaveLength(2)
    })
  })
  
  describe('createDateRangeOperation', () => {
    const operation = createDateRangeOperation<Case>('createdAt')
    
    it('should filter by date range', () => {
      const cases = [
        createMockCase({ createdAt: '2024-01-01T00:00:00Z' }),
        createMockCase({ createdAt: '2024-06-01T00:00:00Z' }),
        createMockCase({ createdAt: '2024-12-01T00:00:00Z' })
      ]
      
      const result = operation.apply(cases, {
        from: '2024-05-01T00:00:00Z',
        to: '2024-11-01T00:00:00Z'
      })
      
      expect(result).toHaveLength(1)
      expect(result[0].createdAt).toBe('2024-06-01T00:00:00Z')
    })
  })
})

// 統合テスト
describe('useFilterEngine', () => {
  const { registerOperation, applyFilters } = useFilterEngine<Case>()
  
  beforeEach(() => {
    registerOperation('search', createTextSearchOperation<Case>())
    registerOperation('status', createMultiSelectOperation<Case>('status'))
  })
  
  it('should apply multiple filters correctly', () => {
    const cases = [
      createMockCase({ title: 'Contract Case', status: 'new' }),
      createMockCase({ title: 'Contract Dispute', status: 'accepted' }),
      createMockCase({ title: 'Personal Injury', status: 'new' })
    ]
    
    const result = applyFilters(cases, {
      search: 'contract',
      status: ['new']
    })
    
    expect(result.success).toBe(true)
    if (result.success) {
      expect(result.data.items).toHaveLength(1)
      expect(result.data.items[0].title).toBe('Contract Case')
      expect(result.data.stats.appliedOperations).toEqual(['search', 'status'])
    }
  })
  
  it('should handle invalid filters gracefully', () => {
    const cases = [createMockCase()]
    
    const result = applyFilters(cases, {
      search: 123 // invalid type
    })
    
    expect(result.success).toBe(false)
    if (!result.success) {
      expect(result.error.code).toBe('INVALID_SEARCH_TERM')
      expect(result.error.field).toBe('search')
    }
  })
})
```

### Section 5: テスト統合戦略 (Testing Integration Strategy)

日本の法律事務所向けカンバンボードの包括的テスト戦略を設計します。責任分離とSingle Responsibility Principleに基づいた統合アプローチを構築します。

#### 5.1 完全な型安全テスト設定

```typescript
// types/testing.ts - 完全で拡張可能な型定義
export interface TestConfig {
  readonly timeouts: TestTimeouts
  readonly coverage: CoverageConfig
  readonly mock: MockConfig
  readonly environments: TestEnvironments
  readonly performance: PerformanceConfig
  readonly accessibility: A11yConfig
}

export interface TestTimeouts {
  readonly unit: number
  readonly integration: number
  readonly e2e: number
  readonly storybook: number
  readonly performance: number
  readonly accessibility: number
}

export interface CoverageConfig {
  readonly targets: CoverageTargets
  readonly exclude: readonly string[]
  readonly reports: readonly ReportFormat[]
  readonly threshold: CoverageThreshold
}

export interface CoverageTargets {
  readonly statements: number
  readonly branches: number
  readonly functions: number
  readonly lines: number
}

export interface CoverageThreshold {
  readonly global: CoverageTargets
  readonly perFile: CoverageTargets
}

export interface MockConfig {
  readonly api: MockAPIConfig
  readonly data: MockDataConfig
  readonly delays: MockDelayConfig
  readonly failures: MockFailureConfig
}

export interface MockAPIConfig {
  readonly baseUrl: string
  readonly timeout: number
  readonly retries: number
}

export interface MockDataConfig {
  readonly cases: number
  readonly clients: number
  readonly lawyers: number
  readonly complexity: 'simple' | 'realistic' | 'stress'
}

export interface MockDelayConfig {
  readonly min: number
  readonly max: number
  readonly realistic: boolean
}

export interface MockFailureConfig {
  readonly rate: number
  readonly scenarios: readonly FailureScenario[]
}

export interface FailureScenario {
  readonly name: string
  readonly probability: number
  readonly errorCode: string
  readonly description: string
}

export interface TestEnvironments {
  readonly unit: UnitTestEnvironment
  readonly integration: IntegrationTestEnvironment
  readonly e2e: E2ETestEnvironment
}

export interface UnitTestEnvironment {
  readonly runtime: 'happy-dom' | 'jsdom'
  readonly typescript: boolean
  readonly coverage: boolean
}

export interface IntegrationTestEnvironment {
  readonly runtime: 'node' | 'browser'
  readonly database: boolean
  readonly realAPIs: boolean
}

export interface E2ETestEnvironment {
  readonly browsers: readonly Browser[]
  readonly viewports: readonly Viewport[]
  readonly slowMo: number
  readonly headless: boolean
}

export interface Browser {
  readonly name: 'chromium' | 'firefox' | 'webkit'
  readonly version?: string
  readonly mobile?: boolean
}

export interface Viewport {
  readonly width: number
  readonly height: number
  readonly deviceScaleFactor: number
  readonly name: string
}

export interface PerformanceConfig {
  readonly thresholds: PerformanceThresholds
  readonly monitoring: PerformanceMonitoring
}

export interface PerformanceThresholds {
  readonly renderTime: number
  readonly filterTime: number
  readonly dragDropTime: number
  readonly memoryUsage: number
}

export interface PerformanceMonitoring {
  readonly collectMetrics: boolean
  readonly sampleSize: number
  readonly warmupRuns: number
}

export interface A11yConfig {
  readonly enabled: boolean
  readonly standards: readonly A11yStandard[]
  readonly rules: A11yRuleConfig
  readonly reporting: A11yReporting
}

export type A11yStandard = 'wcag2a' | 'wcag2aa' | 'wcag2aaa' | 'section508'

export interface A11yRuleConfig {
  readonly include: readonly string[]
  readonly exclude: readonly string[]
  readonly custom: readonly A11yCustomRule[]
}

export interface A11yCustomRule {
  readonly id: string
  readonly description: string
  readonly selector: string
  readonly check: (element: Element) => boolean
}

export interface A11yReporting {
  readonly level: 'error' | 'warn' | 'info'
  readonly format: 'json' | 'html' | 'junit'
  readonly includePartial: boolean
}

export type ReportFormat = 'text' | 'lcov' | 'html' | 'json' | 'cobertura'

// 改善されたResult型
export type TestResult<T = unknown> = 
  | TestSuccess<T>
  | TestFailure

export interface TestSuccess<T> {
  readonly success: true
  readonly data: T
  readonly metrics: TestMetrics
  readonly duration: number
  readonly timestamp: string
}

export interface TestFailure {
  readonly success: false
  readonly error: TestError
  readonly partial?: unknown
  readonly duration: number
  readonly timestamp: string
  readonly stackTrace?: string
}

export interface TestError {
  readonly code: TestErrorCode
  readonly message: string
  readonly severity: 'low' | 'medium' | 'high' | 'critical'
  readonly context?: TestContext
  readonly recoverable: boolean
}

export interface TestContext {
  readonly testSuite: string
  readonly testCase: string
  readonly environment: string
  readonly browser?: string
  readonly viewport?: Viewport
}

export interface TestMetrics {
  readonly performance?: PerformanceMetrics
  readonly accessibility?: A11yMetrics
  readonly coverage?: CoverageMetrics
}

export interface PerformanceMetrics {
  readonly renderTime: number
  readonly memoryUsage: number
  readonly cpuUsage: number
  readonly networkRequests: number
}

export interface A11yMetrics {
  readonly violations: number
  readonly warnings: number
  readonly passes: number
  readonly incomplete: number
}

export interface CoverageMetrics {
  readonly statements: number
  readonly branches: number
  readonly functions: number
  readonly lines: number
}

export type TestErrorCode = 
  | 'SETUP_FAILED'
  | 'ASSERTION_FAILED'
  | 'TIMEOUT_EXCEEDED'
  | 'MOCK_ERROR'
  | 'NETWORK_ERROR'
  | 'ACCESSIBILITY_VIOLATION'
  | 'PERFORMANCE_THRESHOLD_EXCEEDED'
  | 'DATA_VALIDATION_FAILED'
  | 'BROWSER_COMPATIBILITY_ISSUE'
```

#### 5.2 責任分離されたテストヘルパー

```typescript
// tests/utils/configFactory.ts - 設定ファクトリー（責任分離）
const TEST_TIMEOUTS = {
  UNIT_DEFAULT: 5000,
  INTEGRATION_DEFAULT: 10000,
  E2E_DEFAULT: 30000,
  STORYBOOK_DEFAULT: 15000,
  PERFORMANCE_DEFAULT: 60000,
  ACCESSIBILITY_DEFAULT: 20000
} as const

const COVERAGE_THRESHOLDS = {
  STRICT: { statements: 90, branches: 85, functions: 90, lines: 90 },
  STANDARD: { statements: 80, branches: 70, functions: 80, lines: 80 },
  RELAXED: { statements: 60, branches: 50, functions: 60, lines: 60 }
} as const

export const createTestConfig = (
  environment: 'development' | 'ci' | 'local' = 'development'
): TestConfig => {
  const isCI = environment === 'ci'
  const coverageLevel = isCI ? 'STRICT' : 'STANDARD'
  
  return {
    timeouts: {
      unit: TEST_TIMEOUTS.UNIT_DEFAULT,
      integration: TEST_TIMEOUTS.INTEGRATION_DEFAULT,
      e2e: isCI ? TEST_TIMEOUTS.E2E_DEFAULT * 2 : TEST_TIMEOUTS.E2E_DEFAULT,
      storybook: TEST_TIMEOUTS.STORYBOOK_DEFAULT,
      performance: TEST_TIMEOUTS.PERFORMANCE_DEFAULT,
      accessibility: TEST_TIMEOUTS.ACCESSIBILITY_DEFAULT
    },
    coverage: {
      targets: COVERAGE_THRESHOLDS[coverageLevel],
      threshold: {
        global: COVERAGE_THRESHOLDS[coverageLevel],
        perFile: COVERAGE_THRESHOLDS.RELAXED
      },
      exclude: [
        'node_modules/',
        'tests/',
        '**/*.d.ts',
        '**/*.config.*',
        '**/*.stories.*',
        '**/mocks/**'
      ],
      reports: isCI 
        ? ['text', 'lcov', 'cobertura'] 
        : ['text', 'html']
    },
    mock: {
      api: {
        baseUrl: process.env.MOCK_API_URL || 'http://localhost:3001',
        timeout: 5000,
        retries: 3
      },
      data: {
        cases: isCI ? 100 : 10,
        clients: isCI ? 50 : 5,
        lawyers: isCI ? 10 : 3,
        complexity: isCI ? 'stress' : 'realistic'
      },
      delays: {
        min: 50,
        max: isCI ? 500 : 200,
        realistic: true
      },
      failures: {
        rate: isCI ? 0.1 : 0.05,
        scenarios: [
          {
            name: 'network_timeout',
            probability: 0.3,
            errorCode: 'NETWORK_ERROR',
            description: 'Simulated network timeout'
          },
          {
            name: 'server_error',
            probability: 0.4,
            errorCode: 'SERVER_ERROR',
            description: 'Simulated server error'
          },
          {
            name: 'auth_failure',
            probability: 0.3,
            errorCode: 'AUTH_ERROR',
            description: 'Simulated authentication failure'
          }
        ]
      }
    },
    environments: {
      unit: {
        runtime: 'happy-dom',
        typescript: true,
        coverage: true
      },
      integration: {
        runtime: 'browser',
        database: environment !== 'local',
        realAPIs: false
      },
      e2e: {
        browsers: isCI 
          ? [
              { name: 'chromium', mobile: false },
              { name: 'firefox', mobile: false }
            ]
          : [
              { name: 'chromium', mobile: false }
            ],
        viewports: [
          { width: 1280, height: 720, deviceScaleFactor: 1, name: 'desktop' },
          { width: 768, height: 1024, deviceScaleFactor: 2, name: 'tablet' },
          { width: 375, height: 667, deviceScaleFactor: 2, name: 'mobile' }
        ],
        slowMo: isCI ? 0 : 100,
        headless: isCI
      }
    },
    performance: {
      thresholds: {
        renderTime: 1000,
        filterTime: 500,
        dragDropTime: 300,
        memoryUsage: 50 * 1024 * 1024 // 50MB
      },
      monitoring: {
        collectMetrics: true,
        sampleSize: isCI ? 10 : 3,
        warmupRuns: 2
      }
    },
    accessibility: {
      enabled: true,
      standards: ['wcag2a', 'wcag2aa'],
      rules: {
        include: [],
        exclude: ['color-contrast'], // CI環境での不安定性を考慮
        custom: []
      },
      reporting: {
        level: 'error',
        format: 'json',
        includePartial: false
      }
    }
  }
}

// tests/utils/dataFactory.ts - データファクトリー（責任分離）
export const createTestFactory = <T>(defaultData: T) => {
  return {
    create: (overrides?: Partial<T>): T => ({
      ...defaultData,
      ...overrides
    }),
    
    createMany: (count: number, overrides?: Partial<T>[]): T[] => {
      return Array.from({ length: count }, (_, index) => ({
        ...defaultData,
        ...overrides?.[index],
        id: `${defaultData.id}-${index}` // Ensure unique IDs
      }))
    },
    
    createRealistic: (scenario: 'simple' | 'complex' | 'edge'): T => {
      const scenarios = {
        simple: defaultData,
        complex: { ...defaultData, /* complex overrides */ },
        edge: { ...defaultData, /* edge case overrides */ }
      }
      return scenarios[scenario]
    }
  }
}

// tests/utils/mockHandlers.ts - Mock handlers（責任分離）
export const createMockHandlerFactory = (config: MockConfig) => {
  const simulateNetworkDelay = () => {
    const { min, max, realistic } = config.delays
    if (!realistic) return 0
    return Math.floor(Math.random() * (max - min + 1)) + min
  }
  
  const shouldSimulateFailure = (scenario?: string): FailureScenario | null => {
    if (Math.random() > config.failures.rate) return null
    
    const availableScenarios = scenario 
      ? config.failures.scenarios.filter(s => s.name === scenario)
      : config.failures.scenarios
    
    if (availableScenarios.length === 0) return null
    
    const random = Math.random()
    let cumulative = 0
    
    for (const failureScenario of availableScenarios) {
      cumulative += failureScenario.probability
      if (random <= cumulative) {
        return failureScenario
      }
    }
    
    return null
  }
  
  return {
    createRESTHandler: <TRequest, TResponse>(
      method: 'GET' | 'POST' | 'PUT' | 'DELETE',
      path: string,
      response: TResponse | ((req: TRequest) => TResponse | Promise<TResponse>),
      options?: {
        delay?: number
        failureScenario?: string
        validate?: (req: TRequest) => boolean
      }
    ) => {
      return rest[method.toLowerCase()](path, async (req, res, ctx) => {
        const delay = options?.delay ?? simulateNetworkDelay()
        const failure = shouldSimulateFailure(options?.failureScenario)
        
        if (failure) {
          return res(
            ctx.delay(delay),
            ctx.status(failure.errorCode === 'AUTH_ERROR' ? 401 : 500),
            ctx.json({
              error: failure.description,
              code: failure.errorCode,
              timestamp: new Date().toISOString()
            })
          )
        }
        
        if (options?.validate) {
          const body = await req.json() as TRequest
          if (!options.validate(body)) {
            return res(
              ctx.delay(delay),
              ctx.status(400),
              ctx.json({
                error: 'Validation failed',
                code: 'DATA_VALIDATION_FAILED'
              })
            )
          }
        }
        
        const responseData = typeof response === 'function' 
          ? await response(await req.json() as TRequest)
          : response
        
        return res(
          ctx.delay(delay),
          ctx.status(200),
          ctx.json(responseData)
        )
      })
    },
    
    createGraphQLHandler: <TVariables, TData>(
      operationName: string,
      response: TData | ((variables: TVariables) => TData | Promise<TData>)
    ) => {
      return graphql.operation(operationName, async (req, res, ctx) => {
        const delay = simulateNetworkDelay()
        const failure = shouldSimulateFailure()
        
        if (failure) {
          return res(
            ctx.delay(delay),
            ctx.errors([
              {
                message: failure.description,
                extensions: { code: failure.errorCode }
              }
            ])
          )
        }
        
        const responseData = typeof response === 'function'
          ? await response(req.variables as TVariables)
          : response
        
        return res(
          ctx.delay(delay),
          ctx.data(responseData)
        )
      })
    }
  }
}

// tests/utils/testRunners.ts - テストランナー（責任分離）
export const createAccessibilityTester = (config: A11yConfig) => {
  return {
    test: async (page: Page, selector?: string): Promise<TestResult<A11yMetrics>> => {
      const startTime = performance.now()
      
      try {
        await injectAxe(page)
        
        const results = await checkA11y(page, selector, {
          rules: {
            ...config.rules.include.reduce((acc, rule) => ({ ...acc, [rule]: { enabled: true } }), {}),
            ...config.rules.exclude.reduce((acc, rule) => ({ ...acc, [rule]: { enabled: false } }), {})
          },
          tags: config.standards
        })
        
        const violations = results.violations || []
        const criticalViolations = violations.filter(v => v.impact === 'critical' || v.impact === 'serious')
        
        return {
          success: criticalViolations.length === 0,
          data: {
            violations: violations.length,
            warnings: results.incomplete?.length || 0,
            passes: results.passes?.length || 0,
            incomplete: results.incomplete?.length || 0
          },
          metrics: {
            accessibility: {
              violations: violations.length,
              warnings: results.incomplete?.length || 0,
              passes: results.passes?.length || 0,
              incomplete: results.incomplete?.length || 0
            }
          },
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        }
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'ACCESSIBILITY_VIOLATION',
            message: error instanceof Error ? error.message : 'Accessibility test failed',
            severity: 'high',
            context: {
              testSuite: 'accessibility',
              testCase: 'wcag-compliance',
              environment: 'browser',
              selector
            },
            recoverable: false
          },
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString(),
          stackTrace: error instanceof Error ? error.stack : undefined
        }
      }
    },
    
    batchTest: async (
      page: Page, 
      selectors: string[]
    ): Promise<TestResult<A11yMetrics>[]> => {
      const results: TestResult<A11yMetrics>[] = []
      
      for (const selector of selectors) {
        const result = await this.test(page, selector)
        results.push(result)
      }
      
      return results
    }
  }
}

export const createPerformanceTester = (config: PerformanceConfig) => {
  return {
    test: async <T>(
      operation: () => Promise<T>,
      testName: string
    ): Promise<TestResult<PerformanceMetrics & { result: T }>> => {
      const startTime = performance.now()
      const startMemory = process.memoryUsage().heapUsed
      
      try {
        // Warmup runs
        for (let i = 0; i < config.monitoring.warmupRuns; i++) {
          await operation()
        }
        
        // Actual test runs
        const times: number[] = []
        let result: T
        
        for (let i = 0; i < config.monitoring.sampleSize; i++) {
          const runStart = performance.now()
          result = await operation()
          times.push(performance.now() - runStart)
        }
        
        const avgTime = times.reduce((a, b) => a + b, 0) / times.length
        const endMemory = process.memoryUsage().heapUsed
        const memoryUsed = endMemory - startMemory
        
        const meetsThreshold = avgTime <= config.thresholds.renderTime && 
                             memoryUsed <= config.thresholds.memoryUsage
        
        return {
          success: meetsThreshold,
          data: {
            renderTime: avgTime,
            memoryUsage: memoryUsed,
            cpuUsage: 0, // Implement with actual CPU monitoring
            networkRequests: 0, // Implement with network monitoring
            result: result!
          },
          metrics: {
            performance: {
              renderTime: avgTime,
              memoryUsage: memoryUsed,
              cpuUsage: 0,
              networkRequests: 0
            }
          },
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString()
        }
      } catch (error) {
        return {
          success: false,
          error: {
            code: 'PERFORMANCE_THRESHOLD_EXCEEDED',
            message: error instanceof Error ? error.message : 'Performance test failed',
            severity: 'medium',
            context: {
              testSuite: 'performance',
              testCase: testName,
              environment: 'node'
            },
            recoverable: true
          },
          duration: performance.now() - startTime,
          timestamp: new Date().toISOString(),
          stackTrace: error instanceof Error ? error.stack : undefined
        }
      }
    }
  }
}
```

#### 5.3 責任分離された単体テスト

```typescript
// tests/unit/composables/useCaseKanban.test.ts - 改善された単体テスト
import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createPinia, setActivePinia } from 'pinia'
import { useCaseKanban } from '@/composables/useCaseKanban'
import { 
  createTestConfig, 
  createTestFactory, 
  createPerformanceTester 
} from '@/tests/utils/testHelpers'
import type { Case, CaseStatus } from '@/types/case'

// テスト設定の分離
const testConfig = createTestConfig('local')
const performanceTester = createPerformanceTester(testConfig.performance)

// テストデータファクトリーの分離
const caseFactory = createTestFactory<Case>({
  id: 'case-1',
  caseNumber: 'CASE-2024-001',
  title: 'テストケース',
  status: 'new',
  priority: 'medium',
  client: { 
    id: 'client-1', 
    name: 'テスト依頼者', 
    type: 'individual' 
  },
  assignedLawyer: null,
  tags: [],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  description: 'テスト用のケース',
  dueDate: '2024-12-31T23:59:59Z'
})

// モックサービスファクトリーの分離
const createMockCaseService = (behavior: 'success' | 'failure' | 'timeout' = 'success') => {
  const behaviors = {
    success: () => Promise.resolve({ success: true, data: { id: '1' } }),
    failure: () => Promise.reject(new Error('Service error')),
    timeout: () => new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Timeout')), testConfig.timeouts.unit + 1000)
    )
  }
  
  return {
    updateCase: vi.fn().mockImplementation(behaviors[behavior]),
    createCase: vi.fn().mockImplementation(behaviors[behavior]),
    deleteCase: vi.fn().mockImplementation(behaviors[behavior])
  }
}

describe('useCaseKanban - 責任分離テスト', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
    vi.clearAllMocks()
  })
  
  afterEach(() => {
    vi.clearAllTimers()
  })
  
  describe('フィルタリング機能', () => {
    // テストヘルパーの分離
    const createFilterTestSuite = (cases: Case[]) => {
      const { applyFilter, filteredCases, clearFilters } = useCaseKanban(cases)
      
      return {
        applyFilter,
        filteredCases,
        clearFilters,
        expectFilterResult: (expectedLength: number, description?: string) => {
          expect(filteredCases.value).toHaveLength(expectedLength)
          if (description) {
            expect(filteredCases.value.length).toBeGreaterThanOrEqual(0) // 正の数値
          }
        }
      }
    }
    
    describe('検索フィルタ', () => {
      const testCases = [
        caseFactory.create({ title: '契約書作成業務', caseNumber: 'CONTRACT-001' }),
        caseFactory.create({ title: '売買契約案件', caseNumber: 'SALES-002' }),
        caseFactory.create({ title: '人身事故対応', caseNumber: 'ACCIDENT-003' }),
        caseFactory.create({ title: 'リース契約', caseNumber: 'LEASE-004' })
      ]
      
      it('should filter by title correctly', () => {
        const suite = createFilterTestSuite(testCases)
        
        suite.applyFilter('search', '契約')
        suite.expectFilterResult(3, '契約関連の案件が3件検索される')
      })
      
      it('should filter by case number', () => {
        const suite = createFilterTestSuite(testCases)
        
        suite.applyFilter('search', 'CONTRACT')
        suite.expectFilterResult(1, '案件番号でフィルタリング')
      })
      
      it('should handle Japanese text search', () => {
        const suite = createFilterTestSuite(testCases)
        
        suite.applyFilter('search', '人身')
        suite.expectFilterResult(1, '日本語テキスト検索')
      })
      
      it('should handle empty search gracefully', () => {
        const suite = createFilterTestSuite(testCases)
        
        suite.applyFilter('search', '')
        suite.expectFilterResult(4, '空文字検索で全件表示')
      })
      
      it('should handle whitespace-only search', () => {
        const suite = createFilterTestSuite(testCases)
        
        suite.applyFilter('search', '   ')
        suite.expectFilterResult(4, '空白文字検索で全件表示')
      })
    })
    
    describe('ステータスフィルタ', () => {
      const statusTestCases = [
        caseFactory.create({ status: 'new', title: '新規案件1' }),
        caseFactory.create({ status: 'accepted', title: '受任案件1' }),
        caseFactory.create({ status: 'investigation', title: '調査案件1' }),
        caseFactory.create({ status: 'completed', title: '完了案件1' })
      ]
      
      it('should filter by single status', () => {
        const suite = createFilterTestSuite(statusTestCases)
        
        suite.applyFilter('status', ['new'])
        suite.expectFilterResult(1, '新規ステータスの案件')
      })
      
      it('should filter by multiple statuses', () => {
        const suite = createFilterTestSuite(statusTestCases)
        
        suite.applyFilter('status', ['new', 'accepted'])
        suite.expectFilterResult(2, '複数ステータスの案件')
      })
      
      it('should handle invalid status gracefully', () => {
        const suite = createFilterTestSuite(statusTestCases)
        
        suite.applyFilter('status', ['invalid-status'])
        suite.expectFilterResult(0, '無効なステータスで0件')
      })
    })
    
    describe('複合フィルタ', () => {
      const complexTestCases = [
        caseFactory.create({ 
          title: '契約書案件', 
          status: 'new', 
          priority: 'high',
          tags: ['contract', 'urgent'] 
        }),
        caseFactory.create({ 
          title: '契約違反', 
          status: 'accepted', 
          priority: 'medium',
          tags: ['contract', 'dispute'] 
        }),
        caseFactory.create({ 
          title: '人身事故', 
          status: 'new', 
          priority: 'high',
          tags: ['accident', 'urgent'] 
        })
      ]
      
      it('should apply multiple filters correctly', () => {
        const suite = createFilterTestSuite(complexTestCases)
        
        // 検索 + ステータス + 優先度
        suite.applyFilter('search', '契約')
        suite.applyFilter('status', ['new'])
        suite.applyFilter('priority', ['high'])
        
        suite.expectFilterResult(1, '複合条件での絞り込み')
      })
      
      it('should reset filters correctly', () => {
        const suite = createFilterTestSuite(complexTestCases)
        
        suite.applyFilter('search', '契約')
        suite.clearFilters()
        
        suite.expectFilterResult(3, 'フィルタリセット後全件表示')
      })
    })
  })
  
  describe('ドラッグ&ドロップ機能', () => {
    describe('成功パターン', () => {
      it('should update case status successfully', async () => {
        const mockService = createMockCaseService('success')
        const testCase = caseFactory.create({ id: 'case-1', status: 'new' })
        const { moveCase } = useCaseKanban([testCase], mockService)
        
        const result = await moveCase('case-1', 'accepted')
        
        expect(result.success).toBe(true)
        expect(mockService.updateCase).toHaveBeenCalledWith('case-1', { 
          status: 'accepted' 
        })
      })
      
      it('should handle status validation', async () => {
        const mockService = createMockCaseService('success')
        const testCase = caseFactory.create({ status: 'completed' })
        const { moveCase, validateStatusTransition } = useCaseKanban([testCase], mockService)
        
        const isValid = validateStatusTransition('completed', 'new')
        expect(isValid).toBe(false) // 完了から新規への遷移は無効
        
        const result = await moveCase(testCase.id, 'new')
        expect(result.success).toBe(false)
      })
    })
    
    describe('エラーハンドリング', () => {
      it('should handle service failures', async () => {
        const mockService = createMockCaseService('failure')
        const testCase = caseFactory.create({ status: 'new' })
        const { moveCase } = useCaseKanban([testCase], mockService)
        
        const result = await moveCase(testCase.id, 'accepted')
        
        expect(result.success).toBe(false)
        expect(result.error).toBeDefined()
        expect(result.error?.code).toBe('MOCK_ERROR')
      })
      
      it('should handle timeout errors', async () => {
        const mockService = createMockCaseService('timeout')
        const testCase = caseFactory.create({ status: 'new' })
        const { moveCase } = useCaseKanban([testCase], mockService)
        
        await expect(moveCase(testCase.id, 'accepted')).rejects.toThrow('Timeout')
      }, testConfig.timeouts.unit * 2)
      
      it('should handle invalid case ID', async () => {
        const mockService = createMockCaseService('success')
        const { moveCase } = useCaseKanban([], mockService)
        
        const result = await moveCase('non-existent-id', 'accepted')
        
        expect(result.success).toBe(false)
        expect(result.error?.code).toBe('CASE_NOT_FOUND')
      })
    })
  })
  
  describe('パフォーマンステスト', () => {
    it('should handle large datasets efficiently', async () => {
      const largeCaseSet = caseFactory.createMany(1000, 
        Array.from({ length: 1000 }, (_, i) => ({ 
          id: `case-${i}`, 
          title: `案件${i}`,
          caseNumber: `CASE-${String(i).padStart(4, '0')}`
        }))
      )
      
      const result = await performanceTester.test(async () => {
        const { filteredCases, applyFilter } = useCaseKanban(largeCaseSet)
        applyFilter('search', '案件1')
        return filteredCases.value
      }, 'large-dataset-filtering')
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.renderTime).toBeLessThan(testConfig.performance.thresholds.filterTime)
        expect(result.data.result.length).toBeGreaterThan(0)
      }
    })
    
    it('should maintain performance with complex filters', async () => {
      const complexCases = caseFactory.createMany(500,
        Array.from({ length: 500 }, (_, i) => ({
          id: `complex-case-${i}`,
          title: `複雑な案件${i}`,
          status: ['new', 'accepted', 'investigation', 'completed'][i % 4] as CaseStatus,
          priority: ['low', 'medium', 'high'][i % 3] as any,
          tags: [`tag${i % 10}`, `category${i % 5}`]
        }))
      )
      
      const result = await performanceTester.test(async () => {
        const { filteredCases, applyFilter } = useCaseKanban(complexCases)
        applyFilter('search', '複雑')
        applyFilter('status', ['new', 'accepted'])
        applyFilter('priority', ['high'])
        return filteredCases.value
      }, 'complex-filtering-performance')
      
      expect(result.success).toBe(true)
      if (result.success) {
        expect(result.data.renderTime).toBeLessThan(testConfig.performance.thresholds.filterTime * 1.5)
      }
    })
  })
  
  describe('エッジケース', () => {
    it('should handle empty case list', () => {
      const { filteredCases, applyFilter } = useCaseKanban([])
      
      applyFilter('search', 'anything')
      expect(filteredCases.value).toHaveLength(0)
    })
    
    it('should handle null/undefined filter values', () => {
      const testCases = [caseFactory.create()]
      const { filteredCases, applyFilter } = useCaseKanban(testCases)
      
      applyFilter('search', null)
      expect(filteredCases.value).toHaveLength(1)
      
      applyFilter('search', undefined)
      expect(filteredCases.value).toHaveLength(1)
    })
    
    it('should handle malformed case data', () => {
      const malformedCase = {
        id: 'malformed',
        // Missing required fields
      } as Case
      
      expect(() => {
        useCaseKanban([malformedCase])
      }).not.toThrow() // Should handle gracefully
    })
  })
})
```

#### 5.4 改善されたページオブジェクトパターンE2Eテスト

```typescript
// tests/e2e/pages/KanbanPage.ts - 責任分離されたページオブジェクト
import { Page, Locator, expect } from '@playwright/test'
import { TestResult, A11yMetrics } from '@/types/testing'

export class KanbanPage {
  private readonly url = '/cases/kanban'
  
  // セレクター定数の外部化
  private readonly selectors = {
    pageTitle: 'h1',
    searchInput: 'input[placeholder*="検索"]',
    kanbanColumn: '[data-testid="kanban-column"]',
    caseCard: '[data-testid^="case-card-"]',
    specificCaseCard: (id: string) => `[data-testid="case-card-${id}"]`,
    columnByStatus: (status: string) => `[data-testid="column-${status}"]`,
    successToast: '.toast-success',
    loadingSpinner: '[data-testid="loading-spinner"]',
    errorMessage: '[data-testid="error-message"]',
    filterPanel: '[data-testid="filter-panel"]',
    statusFilter: '[data-testid="status-filter"]',
    priorityFilter: '[data-testid="priority-filter"]',
    clearFiltersButton: '[data-testid="clear-filters"]',
    resultsCount: '[data-testid="results-count"]'
  } as const
  
  constructor(private readonly page: Page) {}
  
  // ナビゲーション機能
  async navigate(): Promise<void> {
    await this.page.goto(this.url)
    await this.waitForPageLoad()
  }
  
  async waitForPageLoad(): Promise<void> {
    await this.page.waitForLoadState('networkidle')
    await this.page.waitForSelector(this.selectors.pageTitle)
    
    // ローディング完了を待機
    await this.page.waitForFunction(() => {
      const spinner = document.querySelector('[data-testid="loading-spinner"]')
      return !spinner || spinner.getAttribute('style')?.includes('display: none')
    })
  }
  
  // 要素取得
  get pageTitle(): Locator {
    return this.page.locator(this.selectors.pageTitle)
  }
  
  get searchInput(): Locator {
    return this.page.locator(this.selectors.searchInput)
  }
  
  get columns(): Locator {
    return this.page.locator(this.selectors.kanbanColumn)
  }
  
  get caseCards(): Locator {
    return this.page.locator(this.selectors.caseCard)
  }
  
  getColumn(status: string): Locator {
    return this.page.locator(this.selectors.columnByStatus(status))
  }
  
  getCaseCard(id: string): Locator {
    return this.page.locator(this.selectors.specificCaseCard(id))
  }
  
  // アクション機能
  async searchCases(term: string): Promise<void> {
    await this.searchInput.fill(term)
    // デバウンス待機 + ネットワーク応答待機
    await this.page.waitForTimeout(500)
    await this.page.waitForLoadState('networkidle')
  }
  
  async clearSearch(): Promise<void> {
    await this.searchInput.clear()
    await this.page.waitForTimeout(500)
  }
  
  async dragCardToColumn(cardId: string, targetColumn: string): Promise<TestResult<void>> {
    try {
      const sourceCard = this.getCaseCard(cardId)
      const targetCol = this.getColumn(targetColumn)
      
      // ドラッグ前の状態確認
      await expect(sourceCard).toBeVisible()
      await expect(targetCol).toBeVisible()
      
      // ドラッグ&ドロップ実行
      await sourceCard.dragTo(targetCol)
      
      // 成功のトースト確認
      await expect(this.page.locator(this.selectors.successToast)).toBeVisible()
      
      return {
        success: true,
        data: undefined,
        metrics: {},
        duration: 0,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'DRAG_DROP_FAILED',
          message: error instanceof Error ? error.message : 'Drag and drop failed',
          severity: 'medium',
          context: {
            testSuite: 'e2e',
            testCase: 'drag-drop',
            environment: 'browser',
            cardId,
            targetColumn
          },
          recoverable: true
        },
        duration: 0,
        timestamp: new Date().toISOString()
      }
    }
  }
  
  async applyStatusFilter(statuses: string[]): Promise<void> {
    const filterPanel = this.page.locator(this.selectors.filterPanel)
    
    if (!(await filterPanel.isVisible())) {
      await this.page.locator('[data-testid="toggle-filters"]').click()
    }
    
    const statusFilter = this.page.locator(this.selectors.statusFilter)
    await statusFilter.click()
    
    for (const status of statuses) {
      await this.page.locator(`[data-testid="status-option-${status}"]`).click()
    }
    
    await this.page.waitForLoadState('networkidle')
  }
  
  async clearAllFilters(): Promise<void> {
    const clearButton = this.page.locator(this.selectors.clearFiltersButton)
    
    if (await clearButton.isVisible()) {
      await clearButton.click()
      await this.page.waitForLoadState('networkidle')
    }
  }
  
  // 検証機能
  async getColumnCount(): Promise<number> {
    await this.columns.first().waitFor()
    return await this.columns.count()
  }
  
  async getCaseCardCount(): Promise<number> {
    // カードがない場合は0を返す
    try {
      await this.caseCards.first().waitFor({ timeout: 1000 })
      return await this.caseCards.count()
    } catch {
      return 0
    }
  }
  
  async getVisibleCaseCardCount(): Promise<number> {
    const cards = this.caseCards
    const count = await cards.count()
    let visibleCount = 0
    
    for (let i = 0; i < count; i++) {
      if (await cards.nth(i).isVisible()) {
        visibleCount++
      }
    }
    
    return visibleCount
  }
  
  async getResultsCount(): Promise<number> {
    const resultsElement = this.page.locator(this.selectors.resultsCount)
    
    if (!(await resultsElement.isVisible())) {
      return 0
    }
    
    const text = await resultsElement.textContent()
    const match = text?.match(/(\d+)件/)
    return match ? parseInt(match[1]) : 0
  }
  
  async verifyKanbanStructure(): Promise<TestResult<{
    columnCount: number
    hasTitle: boolean
    hasSearchInput: boolean
  }>> {
    try {
      const columnCount = await this.getColumnCount()
      const hasTitle = await this.pageTitle.isVisible()
      const hasSearchInput = await this.searchInput.isVisible()
      
      return {
        success: true,
        data: {
          columnCount,
          hasTitle,
          hasSearchInput
        },
        metrics: {},
        duration: 0,
        timestamp: new Date().toISOString()
      }
    } catch (error) {
      return {
        success: false,
        error: {
          code: 'STRUCTURE_VERIFICATION_FAILED',
          message: error instanceof Error ? error.message : 'Structure verification failed',
          severity: 'high',
          context: {
            testSuite: 'e2e',
            testCase: 'structure-verification',
            environment: 'browser'
          },
          recoverable: false
        },
        duration: 0,
        timestamp: new Date().toISOString()
      }
    }
  }
  
  // エラーハンドリング
  async hasErrorMessage(): Promise<boolean> {
    return await this.page.locator(this.selectors.errorMessage).isVisible()
  }
  
  async getErrorMessage(): Promise<string | null> {
    const errorElement = this.page.locator(this.selectors.errorMessage)
    return await errorElement.isVisible() ? await errorElement.textContent() : null
  }
  
  async isLoading(): Promise<boolean> {
    return await this.page.locator(this.selectors.loadingSpinner).isVisible()
  }
}

// tests/e2e/kanban.spec.ts - 改善されたE2Eテスト
import { test, expect } from '@playwright/test'
import { KanbanPage } from './pages/KanbanPage'
import { 
  createTestConfig, 
  createAccessibilityTester,
  createPerformanceTester 
} from '../utils/testHelpers'

const testConfig = createTestConfig('ci')
const accessibilityTester = createAccessibilityTester(testConfig.accessibility)
const performanceTester = createPerformanceTester(testConfig.performance)

test.describe('Case Kanban Board E2E - Core Functionality', () => {
  let kanbanPage: KanbanPage
  
  test.beforeEach(async ({ page }) => {
    kanbanPage = new KanbanPage(page)
    await kanbanPage.navigate()
  })
  
  test('should display complete kanban structure', async () => {
    const result = await kanbanPage.verifyKanbanStructure()
    
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.columnCount).toBe(7) // 7つのステータス列
      expect(result.data.hasTitle).toBe(true)
      expect(result.data.hasSearchInput).toBe(true)
    }
    
    // タイトルテキストの確認
    await expect(kanbanPage.pageTitle).toContainText('案件カンバンボード')
  })
  
  test('should handle drag and drop operations', async () => {
    // 最初のケースカードが存在することを確認
    const initialCardCount = await kanbanPage.getCaseCardCount()
    expect(initialCardCount).toBeGreaterThan(0)
    
    // ドラッグ&ドロップを実行
    const result = await kanbanPage.dragCardToColumn('case-1', 'accepted')
    
    expect(result.success).toBe(true)
    
    // カード数が変わらないことを確認（移動のみ）
    const finalCardCount = await kanbanPage.getCaseCardCount()
    expect(finalCardCount).toBe(initialCardCount)
  })
  
  describe('Search and Filtering', () => {
    test('should filter cases by search term', async () => {
      const initialCount = await kanbanPage.getVisibleCaseCardCount()
      
      await kanbanPage.searchCases('契約')
      
      const filteredCount = await kanbanPage.getVisibleCaseCardCount()
      expect(filteredCount).toBeLessThanOrEqual(initialCount)
      
      // 結果数表示の確認
      const resultsCount = await kanbanPage.getResultsCount()
      expect(resultsCount).toBe(filteredCount)
    })
    
    test('should clear search filters', async () => {
      // フィルタ適用
      await kanbanPage.searchCases('契約')
      const filteredCount = await kanbanPage.getVisibleCaseCardCount()
      
      // フィルタクリア
      await kanbanPage.clearSearch()
      const clearedCount = await kanbanPage.getVisibleCaseCardCount()
      
      expect(clearedCount).toBeGreaterThanOrEqual(filteredCount)
    })
    
    test('should handle empty search results gracefully', async () => {
      await kanbanPage.searchCases('存在しない検索語')
      
      const count = await kanbanPage.getVisibleCaseCardCount()
      expect(count).toBe(0)
      
      // エラーメッセージではなく「結果なし」メッセージの表示
      const hasError = await kanbanPage.hasErrorMessage()
      expect(hasError).toBe(false)
    })
    
    test('should filter by status', async () => {
      await kanbanPage.applyStatusFilter(['new', 'accepted'])
      
      const visibleCount = await kanbanPage.getVisibleCaseCardCount()
      expect(visibleCount).toBeGreaterThanOrEqual(0)
      
      // 結果数の確認
      const resultsCount = await kanbanPage.getResultsCount()
      expect(resultsCount).toBe(visibleCount)
    })
  })
  
  describe('Error Handling', () => {
    test('should handle network errors gracefully', async ({ page }) => {
      // ネットワークを無効化
      await page.route('**/api/**', route => {
        route.abort('failed')
      })
      
      await kanbanPage.navigate()
      
      // エラーメッセージの表示確認
      const hasError = await kanbanPage.hasErrorMessage()
      expect(hasError).toBe(true)
      
      const errorMessage = await kanbanPage.getErrorMessage()
      expect(errorMessage).toContain('データの読み込みに失敗しました')
    })
    
    test('should handle slow responses', async ({ page }) => {
      // 遅延を追加
      await page.route('**/api/cases', async route => {
        await new Promise(resolve => setTimeout(resolve, 2000))
        route.continue()
      })
      
      await kanbanPage.navigate()
      
      // ローディング状態の確認
      const isLoading = await kanbanPage.isLoading()
      expect(isLoading).toBe(false) // 最終的にローディングが完了
    })
  })
})

test.describe('Performance Tests', () => {
  test('should load kanban board within performance threshold', async ({ page }) => {
    const result = await performanceTester.test(async () => {
      const kanbanPage = new KanbanPage(page)
      await kanbanPage.navigate()
      return await kanbanPage.getCaseCardCount()
    }, 'kanban-initial-load')
    
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.renderTime).toBeLessThan(testConfig.performance.thresholds.renderTime)
      expect(result.data.result).toBeGreaterThan(0) // カードが表示される
    }
  })
  
  test('should maintain performance during filtering', async ({ page }) => {
    const kanbanPage = new KanbanPage(page)
    await kanbanPage.navigate()
    
    const result = await performanceTester.test(async () => {
      await kanbanPage.searchCases('案件')
      return await kanbanPage.getVisibleCaseCardCount()
    }, 'kanban-filtering-performance')
    
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.renderTime).toBeLessThan(testConfig.performance.thresholds.filterTime)
    }
  })
})

test.describe('Accessibility Tests', () => {
  test('should meet WCAG 2.1 AA standards', async ({ page }) => {
    const kanbanPage = new KanbanPage(page)
    await kanbanPage.navigate()
    
    const result = await accessibilityTester.test(page)
    
    expect(result.success).toBe(true)
    
    if (result.success) {
      expect(result.data.violations).toBe(0)
      expect(result.data.passes).toBeGreaterThan(0)
    } else {
      console.log('Accessibility violations:', result.error)
    }
  })
  
  test('should support keyboard navigation', async ({ page }) => {
    const kanbanPage = new KanbanPage(page)
    await kanbanPage.navigate()
    
    // Tab navigation test
    await page.keyboard.press('Tab')
    const focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(['INPUT', 'BUTTON', 'A']).toContain(focusedElement)
    
    // Search input accessibility
    await kanbanPage.searchInput.focus()
    await page.keyboard.type('テスト検索')
    
    const searchValue = await kanbanPage.searchInput.inputValue()
    expect(searchValue).toBe('テスト検索')
  })
  
  test('should provide proper ARIA labels', async ({ page }) => {
    const kanbanPage = new KanbanPage(page)
    await kanbanPage.navigate()
    
    // 検索入力のARIAラベル確認
    const searchInputAriaLabel = await kanbanPage.searchInput.getAttribute('aria-label')
    expect(searchInputAriaLabel).toBeTruthy()
    
    // カンバン列のARIAラベル確認
    const columns = kanbanPage.columns
    const firstColumnAriaLabel = await columns.first().getAttribute('aria-label')
    expect(firstColumnAriaLabel).toContain('ステータス')
  })
})

test.describe('Mobile Responsiveness', () => {
  test.use({ 
    viewport: { width: 375, height: 667 } // iPhone SE size
  })
  
  test('should display mobile-optimized kanban board', async ({ page }) => {
    const kanbanPage = new KanbanPage(page)
    await kanbanPage.navigate()
    
    // モバイルレイアウトの確認
    const columns = kanbanPage.columns
    const firstColumn = columns.first()
    
    // 横スクロール可能性の確認
    const columnWidth = await firstColumn.evaluate(el => el.clientWidth)
    expect(columnWidth).toBeGreaterThan(0)
    expect(columnWidth).toBeLessThan(400) // モバイルビューポートより小さい
  })
  
  test('should support touch interactions', async ({ page }) => {
    const kanbanPage = new KanbanPage(page)
    await kanbanPage.navigate()
    
    const cardCount = await kanbanPage.getCaseCardCount()
    if (cardCount > 0) {
      const firstCard = kanbanPage.caseCards.first()
      
      // タッチタップのテスト
      await firstCard.tap()
      
      // カード詳細の表示確認（想定される動作）
      const cardDetailsVisible = await page.locator('[data-testid="card-details"]').isVisible()
      expect(cardDetailsVisible).toBe(true)
    }
  })
})
```

#### 5.5 改善されたCI/CD統合とジョブ分離

```yaml
# .github/workflows/test-matrix.yml - 責任分離されたCI/CD設定
name: Comprehensive Test Matrix

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main]
  schedule:
    - cron: '0 2 * * *'  # Daily at 2 AM UTC

env:
  NODE_VERSION: '20'
  BUN_VERSION: '1.0.35'
  TEST_ENVIRONMENT: 'ci'

jobs:
  # 依存関係とセットアップの検証
  setup-validation:
    name: Setup Validation
    runs-on: ubuntu-latest
    outputs:
      cache-key: ${{ steps.cache-key.outputs.key }}
      dependency-changes: ${{ steps.changes.outputs.dependencies }}
    
    steps:
      - uses: actions/checkout@v4
        with:
          fetch-depth: 0
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}
      
      - name: Generate cache key
        id: cache-key
        run: |
          echo "key=deps-${{ hashFiles('**/bun.lockb', '**/package.json') }}" >> $GITHUB_OUTPUT
      
      - name: Cache dependencies
        uses: actions/cache@v3
        with:
          path: ~/.bun/install/cache
          key: ${{ steps.cache-key.outputs.key }}
          restore-keys: deps-
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Check for dependency changes
        id: changes
        uses: dorny/paths-filter@v2
        with:
          filters: |
            dependencies:
              - 'package.json'
              - 'bun.lockb'
              - '.github/workflows/**'
      
      - name: Validate TypeScript configuration
        run: bun run typecheck
  
  # 並列実行される単体テスト
  unit-tests:
    name: Unit Tests (Node ${{ matrix.node-version }})
    runs-on: ubuntu-latest
    needs: setup-validation
    
    strategy:
      fail-fast: false
      matrix:
        node-version: [18, 20, 21]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}
      
      - name: Restore dependencies cache
        uses: actions/cache@v3
        with:
          path: ~/.bun/install/cache
          key: ${{ needs.setup-validation.outputs.cache-key }}
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Run unit tests with coverage
        run: |
          bun run test:unit \
            --coverage \
            --reporter=verbose \
            --reporter=github-actions \
            --run
        env:
          TEST_ENVIRONMENT: ${{ env.TEST_ENVIRONMENT }}
        timeout-minutes: 15
      
      - name: Generate coverage report
        if: matrix.node-version == 20
        run: bun run coverage:generate
      
      - name: Upload coverage to Codecov
        if: matrix.node-version == 20
        uses: codecov/codecov-action@v3
        with:
          files: ./coverage/lcov.info
          flags: unit-tests
          name: unit-coverage
          fail_ci_if_error: true
      
      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: unit-test-results-node${{ matrix.node-version }}
          path: |
            test-results/
            coverage/
  
  # 統合テスト（データベース付き）
  integration-tests:
    name: Integration Tests
    runs-on: ubuntu-latest
    needs: setup-validation
    
    services:
      postgres:
        image: postgres:15
        env:
          POSTGRES_PASSWORD: postgres
          POSTGRES_DB: test_db
        options: >-
          --health-cmd pg_isready
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 5432:5432
      
      redis:
        image: redis:7-alpine
        options: >-
          --health-cmd "redis-cli ping"
          --health-interval 10s
          --health-timeout 5s
          --health-retries 5
        ports:
          - 6379:6379
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}
      
      - name: Restore dependencies cache
        uses: actions/cache@v3
        with:
          path: ~/.bun/install/cache
          key: ${{ needs.setup-validation.outputs.cache-key }}
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Setup test database
        run: |
          bun run db:test:setup
          bun run db:test:seed
        env:
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
      
      - name: Run integration tests
        run: bun run test:integration --run
        env:
          TEST_ENVIRONMENT: ${{ env.TEST_ENVIRONMENT }}
          DATABASE_URL: postgresql://postgres:postgres@localhost:5432/test_db
          REDIS_URL: redis://localhost:6379
        timeout-minutes: 20
      
      - name: Upload integration test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: integration-test-results
          path: test-results/integration/
  
  # E2Eテスト（ブラウザマトリックス）
  e2e-tests:
    name: E2E Tests (${{ matrix.browser }})
    runs-on: ubuntu-latest
    needs: [setup-validation, unit-tests]
    
    strategy:
      fail-fast: false
      matrix:
        browser: [chromium, firefox, webkit]
        include:
          - browser: chromium
            viewport: desktop
          - browser: firefox
            viewport: desktop
          - browser: webkit
            viewport: mobile
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}
      
      - name: Restore dependencies cache
        uses: actions/cache@v3
        with:
          path: ~/.bun/install/cache
          key: ${{ needs.setup-validation.outputs.cache-key }}
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Install Playwright browsers
        run: bunx playwright install ${{ matrix.browser }} --with-deps
      
      - name: Build application
        run: bun run build
        env:
          NODE_ENV: production
      
      - name: Start test server
        run: |
          bun run preview &
          echo $! > server.pid
        env:
          PORT: 4173
      
      - name: Wait for server
        run: bunx wait-on http://localhost:4173 --timeout 60000
      
      - name: Run E2E tests
        run: |
          bunx playwright test \
            --project=${{ matrix.browser }} \
            --reporter=html \
            --reporter=github
        env:
          TEST_ENVIRONMENT: ${{ env.TEST_ENVIRONMENT }}
          BROWSER: ${{ matrix.browser }}
          VIEWPORT: ${{ matrix.viewport }}
        timeout-minutes: 30
      
      - name: Stop test server
        if: always()
        run: |
          if [ -f server.pid ]; then
            kill $(cat server.pid) || true
          fi
      
      - name: Upload E2E test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: e2e-results-${{ matrix.browser }}
          path: |
            playwright-report/
            test-results/
  
  # Storybookテストとビジュアルテスト
  storybook-tests:
    name: Storybook Tests
    runs-on: ubuntu-latest
    needs: setup-validation
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}
      
      - name: Restore dependencies cache
        uses: actions/cache@v3
        with:
          path: ~/.bun/install/cache
          key: ${{ needs.setup-validation.outputs.cache-key }}
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Build Storybook
        run: bun run build-storybook
        timeout-minutes: 10
      
      - name: Run Storybook interaction tests
        run: |
          bunx concurrently -k -s first -n "SB,TEST" -c "magenta,blue" \
            "bunx http-server storybook-static --port 6006 --silent" \
            "bunx wait-on http://localhost:6006 && bun run test:storybook"
        timeout-minutes: 15
      
      - name: Upload Storybook build
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: storybook-build
          path: storybook-static/
  
  # パフォーマンステスト
  performance-tests:
    name: Performance Tests
    runs-on: ubuntu-latest
    needs: [setup-validation, unit-tests]
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}
      
      - name: Restore dependencies cache
        uses: actions/cache@v3
        with:
          path: ~/.bun/install/cache
          key: ${{ needs.setup-validation.outputs.cache-key }}
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Build for performance testing
        run: bun run build
        env:
          NODE_ENV: production
          ANALYZE: true
      
      - name: Run performance tests
        run: bun run test:performance
        env:
          TEST_ENVIRONMENT: ${{ env.TEST_ENVIRONMENT }}
        timeout-minutes: 20
      
      - name: Upload performance results
        uses: actions/upload-artifact@v3
        with:
          name: performance-results
          path: performance-results/
  
  # セキュリティテスト
  security-tests:
    name: Security Tests
    runs-on: ubuntu-latest
    needs: setup-validation
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Setup Bun
        uses: oven-sh/setup-bun@v1
        with:
          bun-version: ${{ env.BUN_VERSION }}
      
      - name: Restore dependencies cache
        uses: actions/cache@v3
        with:
          path: ~/.bun/install/cache
          key: ${{ needs.setup-validation.outputs.cache-key }}
      
      - name: Install dependencies
        run: bun install --frozen-lockfile
      
      - name: Run security audit
        run: bun audit
      
      - name: Run vulnerability scan
        uses: securecodewarrior/github-action-add-sarif@v1
        with:
          sarif-file: security-results.sarif
      
      - name: Upload security results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: security-results
          path: security-results/
  
  # テスト結果の統合とレポート生成
  test-summary:
    name: Test Summary
    runs-on: ubuntu-latest
    needs: [unit-tests, integration-tests, e2e-tests, storybook-tests, performance-tests, security-tests]
    if: always()
    
    steps:
      - uses: actions/checkout@v4
      
      - name: Download all test results
        uses: actions/download-artifact@v3
        with:
          path: test-results/
      
      - name: Generate comprehensive test report
        run: |
          bun run generate-test-report \
            --input test-results/ \
            --output test-summary.html \
            --format html,json,markdown
      
      - name: Upload test summary
        uses: actions/upload-artifact@v3
        with:
          name: test-summary
          path: |
            test-summary.html
            test-summary.json
            test-summary.md
      
      - name: Comment test results on PR
        if: github.event_name == 'pull_request'
        uses: marocchino/sticky-pull-request-comment@v2
        with:
          recreate: true
          path: test-summary.md
      
      - name: Check test coverage thresholds
        run: |
          bun run check-coverage-thresholds \
            --unit-threshold 80 \
            --integration-threshold 70 \
            --e2e-threshold 60
```

#### 5.6 改善されたStorybook統合テスト

```typescript
// stories/testing/CaseKanban.test.stories.ts - 責任分離されたテストストーリー
import type { Meta, StoryObj } from '@storybook/vue3'
import { expect, userEvent, within, waitFor } from '@storybook/test'
import { rest } from 'msw'
import CaseKanbanBoard from '@/pages/cases/kanban.vue'
import { 
  createTestFactory,
  createMockHandlerFactory 
} from '@/tests/utils/testHelpers'
import type { Case } from '@/types/case'

// テストデータファクトリーの分離
const caseFactory = createTestFactory<Case>({
  id: 'case-1',
  caseNumber: 'CASE-2024-001',
  title: '売買契約案件',
  status: 'new',
  priority: 'medium',
  client: { id: 'client-1', name: '田中商事', type: 'corporate' },
  assignedLawyer: { id: 'lawyer-1', name: '山田弁護士' },
  tags: ['contract', 'commercial'],
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z'
})

// モックデータの生成
const generateMockCases = (count: number) => {
  return Array.from({ length: count }, (_, i) => 
    caseFactory.create({
      id: `case-${i + 1}`,
      caseNumber: `CASE-2024-${String(i + 1).padStart(3, '0')}`,
      title: `${['契約', '人身事故', '不動産', '刑事', '離婚'][i % 5]}案件${i + 1}`,
      status: ['new', 'accepted', 'investigation', 'preparation', 'negotiation', 'litigation', 'completed'][i % 7] as any,
      priority: ['low', 'medium', 'high'][i % 3] as any
    })
  )
}

// モックハンドラーファクトリーの設定
const mockHandlerFactory = createMockHandlerFactory({
  api: { baseUrl: 'http://localhost:3001', timeout: 5000, retries: 3 },
  data: { cases: 20, clients: 10, lawyers: 5, complexity: 'realistic' },
  delays: { min: 100, max: 300, realistic: true },
  failures: { rate: 0, scenarios: [] }
})

const meta: Meta<typeof CaseKanbanBoard> = {
  title: 'Pages/CaseKanbanBoard',
  component: CaseKanbanBoard,
  parameters: {
    layout: 'fullscreen',
    docs: {
      description: {
        component: '法律事務所向けの案件管理カンバンボード。ドラッグ&ドロップによるステータス管理、リアルタイムフィルタリング、アクセシビリティ対応を提供。'
      }
    },
    msw: {
      handlers: [
        mockHandlerFactory.createRESTHandler(
          'GET',
          '/api/v1/cases',
          generateMockCases(20)
        ),
        mockHandlerFactory.createRESTHandler(
          'PUT',
          '/api/v1/cases/:id',
          (req) => ({ success: true, data: { id: req.params.id } })
        ),
        mockHandlerFactory.createRESTHandler(
          'GET',
          '/api/v1/clients',
          []
        ),
        mockHandlerFactory.createRESTHandler(
          'GET',
          '/api/v1/lawyers',
          []
        )
      ]
    }
  }
}

export default meta
type Story = StoryObj<typeof meta>

// ヘルパー関数の分離
const createStoryTestSuite = (canvasElement: HTMLElement) => {
  const canvas = within(canvasElement)
  
  return {
    canvas,
    async waitForKanbanLoad() {
      await waitFor(() => 
        expect(canvas.getByText('案件カンバンボード')).toBeInTheDocument(),
        { timeout: 5000 }
      )
    },
    
    async getColumns() {
      return canvas.getAllByTestId('kanban-column')
    },
    
    async getCaseCards() {
      return canvas.getAllByTestId(/^case-card-/)
    },
    
    async searchCases(term: string) {
      const searchInput = canvas.getByPlaceholderText(/検索/)
      await userEvent.clear(searchInput)
      await userEvent.type(searchInput, term)
      await waitFor(() => {}, { timeout: 1000 }) // デバウンス待機
    },
    
    async dragCase(caseId: string, targetStatus: string) {
      const caseCard = canvas.getByTestId(`case-card-${caseId}`)
      const targetColumn = canvas.getByTestId(`column-${targetStatus}`)
      
      await userEvent.dragAndDrop(caseCard, targetColumn)
    },
    
    async expectToastMessage(message: string) {
      await waitFor(() =>
        expect(canvas.getByText(message)).toBeInTheDocument(),
        { timeout: 3000 }
      )
    },
    
    async expectFilterResults(expectedCount?: number) {
      if (expectedCount !== undefined) {
        await waitFor(() => {
          const cards = canvas.getAllByTestId(/^case-card-/)
          expect(cards).toHaveLength(expectedCount)
        })
      }
    }
  }
}

// 基本機能テストストーリー
export const Default: Story = {
  name: '基本表示',
  parameters: {
    docs: {
      description: {
        story: 'カンバンボードの基本レイアウトと7つのステータス列の表示を確認します。'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const suite = createStoryTestSuite(canvasElement)
    
    // ローディング完了まで待機
    await suite.waitForKanbanLoad()
    
    // 7つのステータス列の存在確認
    const columns = await suite.getColumns()
    expect(columns).toHaveLength(7)
    
    // 必須要素の確認
    expect(suite.canvas.getByText('新規')).toBeInTheDocument()
    expect(suite.canvas.getByText('受任')).toBeInTheDocument()
    expect(suite.canvas.getByText('調査')).toBeInTheDocument()
    expect(suite.canvas.getByText('準備')).toBeInTheDocument()
    expect(suite.canvas.getByText('交渉')).toBeInTheDocument()
    expect(suite.canvas.getByText('裁判')).toBeInTheDocument()
    expect(suite.canvas.getByText('完了')).toBeInTheDocument()
    
    // 検索入力の存在確認
    expect(suite.canvas.getByPlaceholderText(/検索/)).toBeInTheDocument()
    
    // 案件カードの表示確認
    const caseCards = await suite.getCaseCards()
    expect(caseCards.length).toBeGreaterThan(0)
  }
}

// フィルタリング機能テスト
export const WithFiltering: Story = {
  name: 'フィルタリング機能',
  parameters: {
    docs: {
      description: {
        story: 'リアルタイム検索フィルタリングの動作を確認します。日本語検索とデバウンス処理に対応。'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const suite = createStoryTestSuite(canvasElement)
    
    await suite.waitForKanbanLoad()
    
    // 初期カード数の確認
    const initialCards = await suite.getCaseCards()
    const initialCount = initialCards.length
    
    // 契約案件の検索
    await suite.searchCases('契約')
    
    // フィルタ結果の確認
    await waitFor(async () => {
      const filteredCards = await suite.getCaseCards()
      expect(filteredCards.length).toBeLessThanOrEqual(initialCount)
    })
    
    // 検索クリア
    await suite.searchCases('')
    
    // 全件表示の復帰確認
    await waitFor(async () => {
      const restoredCards = await suite.getCaseCards()
      expect(restoredCards.length).toBe(initialCount)
    })
  }
}

// ドラッグ&ドロップテスト
export const DragAndDrop: Story = {
  name: 'ドラッグ&ドロップ',
  parameters: {
    docs: {
      description: {
        story: 'ケースカードのドラッグ&ドロップによるステータス変更機能を確認します。'
      }
    }
  },
  play: async ({ canvasElement }) => {
    const suite = createStoryTestSuite(canvasElement)
    
    await suite.waitForKanbanLoad()
    
    // 最初のケースカードを取得
    const caseCards = await suite.getCaseCards()
    expect(caseCards.length).toBeGreaterThan(0)
    
    // ドラッグ&ドロップの実行
    await suite.dragCase('case-1', 'accepted')
    
    // 成功メッセージの確認
    await suite.expectToastMessage('ステータスが更新されました')
  }
}

// エラーハンドリングテスト
export const WithNetworkError: Story = {
  name: 'ネットワークエラー処理',
  parameters: {
    docs: {
      description: {
        story: 'ネットワークエラー時のエラーハンドリングとユーザーフィードバックを確認します。'
      }
    },
    msw: {
      handlers: [
        rest.get('/api/v1/cases', (req, res, ctx) => {
          return res(ctx.status(500), ctx.json({ error: 'Internal Server Error' }))
        })
      ]
    }
  },
  play: async ({ canvasElement }) => {
    const suite = createStoryTestSuite(canvasElement)
    
    // エラーメッセージの確認
    await waitFor(() =>
      expect(suite.canvas.getByText(/データの読み込みに失敗しました/)).toBeInTheDocument(),
      { timeout: 5000 }
    )
    
    // リトライボタンの確認
    expect(suite.canvas.getByText('再試行')).toBeInTheDocument()
  }
}

// ローディング状態テスト
export const WithLoading: Story = {
  name: 'ローディング状態',
  parameters: {
    docs: {
      description: {
        story: 'データ読み込み中のローディング表示を確認します。'
      }
    },
    msw: {
      handlers: [
        rest.get('/api/v1/cases', async (req, res, ctx) => {
          await new Promise(resolve => setTimeout(resolve, 2000))
          return res(ctx.json(generateMockCases(5)))
        })
      ]
    }
  },
  play: async ({ canvasElement }) => {
    const suite = createStoryTestSuite(canvasElement)
    
    // ローディングスピナーの確認
    expect(suite.canvas.getByTestId('loading-spinner')).toBeInTheDocument()
    
    // ローディング完了まで待機
    await waitFor(() =>
      expect(suite.canvas.queryByTestId('loading-spinner')).not.toBeInTheDocument(),
      { timeout: 5000 }
    )
    
    // コンテンツの表示確認
    await suite.waitForKanbanLoad()
  }
}

// 大量データテスト
export const WithLargeDataset: Story = {
  name: '大量データ処理',
  parameters: {
    docs: {
      description: {
        story: '1000件の案件データでのパフォーマンスとフィルタリング性能を確認します。'
      }
    },
    msw: {
      handlers: [
        rest.get('/api/v1/cases', (req, res, ctx) => {
          return res(ctx.json(generateMockCases(1000)))
        })
      ]
    }
  },
  play: async ({ canvasElement }) => {
    const suite = createStoryTestSuite(canvasElement)
    
    // 大量データの読み込み完了まで待機
    await suite.waitForKanbanLoad()
    
    // フィルタリングのパフォーマンステスト
    const startTime = performance.now()
    await suite.searchCases('契約')
    const endTime = performance.now()
    
    // パフォーマンス閾値の確認（500ms以下）
    expect(endTime - startTime).toBeLessThan(500)
    
    // フィルタ結果の確認
    await waitFor(async () => {
      const filteredCards = await suite.getCaseCards()
      expect(filteredCards.length).toBeGreaterThan(0)
      expect(filteredCards.length).toBeLessThan(1000)
    })
  }
}

// アクセシビリティテスト
export const AccessibilityTest: Story = {
  name: 'アクセシビリティ',
  parameters: {
    docs: {
      description: {
        story: 'キーボードナビゲーション、ARIAラベル、スクリーンリーダー対応を確認します。'
      }
    },
    a11y: {
      config: {
        rules: [
          { id: 'color-contrast', enabled: true },
          { id: 'keyboard-navigation', enabled: true },
          { id: 'aria-labels', enabled: true }
        ]
      }
    }
  },
  play: async ({ canvasElement }) => {
    const suite = createStoryTestSuite(canvasElement)
    
    await suite.waitForKanbanLoad()
    
    // キーボードナビゲーションテスト
    const searchInput = suite.canvas.getByPlaceholderText(/検索/)
    
    // Tab navigation
    await userEvent.tab()
    expect(searchInput).toHaveFocus()
    
    // キーボード入力
    await userEvent.type(searchInput, '契約')
    
    // ARIAラベルの確認
    const columns = await suite.getColumns()
    for (const column of columns) {
      expect(column).toHaveAttribute('aria-label')
    }
    
    // スクリーンリーダー用のライブリージョン確認
    const liveRegion = suite.canvas.getByRole('status')
    expect(liveRegion).toBeInTheDocument()
  }
}

// モバイル表示テスト
export const MobileView: Story = {
  name: 'モバイル表示',
  parameters: {
    docs: {
      description: {
        story: 'モバイルデバイスでの表示とタッチ操作を確認します。'
      }
    },
    viewport: {
      defaultViewport: 'iphone12'
    }
  },
  play: async ({ canvasElement }) => {
    const suite = createStoryTestSuite(canvasElement)
    
    await suite.waitForKanbanLoad()
    
    // モバイル固有のUI要素確認
    expect(suite.canvas.getByTestId('mobile-menu-toggle')).toBeInTheDocument()
    
    // 横スクロールコンテナの確認
    const scrollContainer = suite.canvas.getByTestId('kanban-scroll-container')
    expect(scrollContainer).toBeInTheDocument()
    
    // タッチ操作のシミュレーション
    const firstCard = (await suite.getCaseCards())[0]
    await userEvent.click(firstCard)
    
    // カード詳細モーダルの表示確認
    await waitFor(() =>
      expect(suite.canvas.getByTestId('case-detail-modal')).toBeInTheDocument()
    )
  }
}
```

## Implementation Guidance

### Main Kanban Board Page
Responsive kanban implementation:

```vue
<!-- pages/cases/kanban.vue -->
<template>
  <div class="kanban-page">
    <!-- Page Header -->
    <div class="kanban-header">
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold">案件カンバンボード</h1>
          <p class="text-muted-foreground mt-1">
            {{ totalCases }}件の案件 | {{ activeCases }}件進行中
          </p>
        </div>
        
        <div class="flex items-center gap-3">
          <!-- View Options -->
          <ToggleGroup v-model="viewMode" type="single">
            <ToggleGroupItem value="compact" class="px-3">
              <LayoutGrid class="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="detailed" class="px-3">
              <LayoutList class="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          
          <!-- Add Case Button -->
          <Button @click="openCreateCaseModal">
            <Plus class="h-4 w-4 mr-2" />
            新規案件
          </Button>
        </div>
      </div>
      
      <!-- Filter Bar -->
      <div class="kanban-filters">
        <div class="flex items-center gap-4">
          <!-- Search Input -->
          <div class="relative flex-1 max-w-md">
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              v-model="filters.search"
              placeholder="案件番号、タイトル、依頼者名で検索..."
              class="pl-10"
            />
          </div>
          
          <!-- Priority Filter -->
          <Select v-model="filters.priority">
            <SelectTrigger class="w-32">
              <SelectValue placeholder="優先度" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="high">高</SelectItem>
              <SelectItem value="medium">中</SelectItem>
              <SelectItem value="low">低</SelectItem>
            </SelectContent>
          </Select>
          
          <!-- Assigned Filter -->
          <Select v-model="filters.assignedTo">
            <SelectTrigger class="w-40">
              <SelectValue placeholder="担当者" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem
                v-for="lawyer in lawyers"
                :key="lawyer.id"
                :value="lawyer.id"
              >
                {{ lawyer.name }}
              </SelectItem>
            </SelectContent>
          </Select>
          
          <!-- Tag Filter -->
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" class="w-32">
                <Tag class="h-4 w-4 mr-2" />
                タグ
                <Badge v-if="selectedTags.length" variant="secondary" class="ml-2">
                  {{ selectedTags.length }}
                </Badge>
              </Button>
            </PopoverTrigger>
            <PopoverContent class="w-80">
              <TagFilter
                v-model="selectedTags"
                :available-tags="availableTags"
                :mode="tagFilterMode"
                @update:mode="tagFilterMode = $event"
              />
            </PopoverContent>
          </Popover>
          
          <!-- Clear Filters -->
          <Button
            v-if="hasActiveFilters"
            variant="ghost"
            size="sm"
            @click="clearFilters"
          >
            フィルター解除
          </Button>
        </div>
      </div>
    </div>
    
    <!-- Kanban Board -->
    <div class="kanban-board" :class="{ 'compact-mode': viewMode === 'compact' }">
      <div class="kanban-columns">
        <div
          v-for="status in legalStatuses"
          :key="status.key"
          class="kanban-column"
          :data-status="status.key"
        >
          <!-- Column Header -->
          <div class="column-header">
            <div class="flex items-center gap-2">
              <div
                class="w-3 h-3 rounded-full"
                :style="{ backgroundColor: status.color }"
              />
              <h3 class="font-semibold">{{ status.label }}</h3>
              <Badge variant="secondary" class="ml-auto">
                {{ getColumnCount(status.key) }}
              </Badge>
            </div>
            
            <div class="column-actions">
              <Button
                variant="ghost"
                size="icon"
                class="h-6 w-6"
                @click="toggleColumnCollapse(status.key)"
              >
                <ChevronDown
                  :class="{ 'rotate-180': collapsedColumns.includes(status.key) }"
                  class="h-4 w-4 transition-transform"
                />
              </Button>
            </div>
          </div>
          
          <!-- Column Content -->
          <div
            v-if="!collapsedColumns.includes(status.key)"
            class="column-content"
          >
            <!-- Drop Zone -->
            <div
              class="drop-zone"
              @drop="onDrop($event, status.key)"
              @dragover.prevent
              @dragenter.prevent
              :class="{ 'drag-over': dragOverColumn === status.key }"
            >
              <!-- Case Cards -->
              <TransitionGroup
                name="case-card"
                tag="div"
                class="case-cards"
              >
                <CaseCard
                  v-for="case_ in getColumnCases(status.key)"
                  :key="case_.id"
                  :case="case_"
                  :view-mode="viewMode"
                  draggable="true"
                  @dragstart="onDragStart($event, case_)"
                  @dragend="onDragEnd"
                  @click="openCaseDetail(case_.id)"
                />
              </TransitionGroup>
              
              <!-- Empty State -->
              <div
                v-if="getColumnCases(status.key).length === 0"
                class="empty-column"
              >
                <FileX class="h-8 w-8 text-muted-foreground mb-2" />
                <p class="text-sm text-muted-foreground">案件がありません</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- Loading Overlay -->
    <div v-if="isLoading" class="loading-overlay">
      <div class="loading-content">
        <Loader2 class="h-8 w-8 animate-spin" />
        <p class="mt-2">案件を読み込み中...</p>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useVuelidate } from '@vuelidate/core'
import { useStorage, useLocalStorage } from '@vueuse/core'
import { useCasesStore } from '~/stores/cases'
import type { Case, CaseStatus, CasePriority } from '~/types/case'

// Page setup
definePageMeta({
  middleware: 'auth',
  layout: 'default'
})

// Store and router
const casesStore = useCasesStore()
const router = useRouter()

// View state
const viewMode = useLocalStorage<'compact' | 'detailed'>('kanban-view-mode', 'detailed')
const collapsedColumns = useLocalStorage<string[]>('kanban-collapsed-columns', [])

// Filter state
const filters = useLocalStorage('kanban-filters', {
  search: '',
  priority: 'all',
  assignedTo: 'all',
  tags: []
})

const selectedTags = ref<string[]>([])
const tagFilterMode = ref<'and' | 'or'>('and')
const dragOverColumn = ref<string | null>(null)

// Data fetching
const { data: cases, pending: isLoading } = await useLazyFetch('/api/v1/cases', {
  transform: (data: any) => data.cases || []
})

const { data: lawyers } = await useFetch('/api/v1/users/lawyers')
const { data: availableTags } = await useFetch('/api/v1/tags')

// Legal workflow statuses
const legalStatuses = [
  { key: 'new', label: '新規', color: '#8b5cf6' },
  { key: 'accepted', label: '受任', color: '#3b82f6' },
  { key: 'investigation', label: '調査', color: '#f59e0b' },
  { key: 'preparation', label: '準備', color: '#10b981' },
  { key: 'negotiation', label: '交渉', color: '#f97316' },
  { key: 'trial', label: '裁判', color: '#ef4444' },
  { key: 'completed', label: '完了', color: '#6b7280' }
]

// Computed values
const totalCases = computed(() => cases.value?.length || 0)
const activeCases = computed(() => 
  cases.value?.filter(c => !['completed', 'cancelled'].includes(c.status)).length || 0
)

const filteredCases = computed(() => {
  if (!cases.value) return []
  
  return cases.value.filter(case_ => {
    // Text search
    const searchTerm = filters.value.search.toLowerCase()
    const matchesSearch = !searchTerm || 
      case_.title.toLowerCase().includes(searchTerm) ||
      case_.caseNumber.toLowerCase().includes(searchTerm) ||
      case_.client.name.toLowerCase().includes(searchTerm)
    
    // Priority filter
    const matchesPriority = filters.value.priority === 'all' || 
      case_.priority === filters.value.priority
    
    // Assigned filter
    const matchesAssigned = filters.value.assignedTo === 'all' || 
      case_.assignedLawyer?.id === filters.value.assignedTo
    
    // Tag filter
    const matchesTags = selectedTags.value.length === 0 || (
      tagFilterMode.value === 'and'
        ? selectedTags.value.every(tagId => case_.tags.some(t => t.id === tagId))
        : selectedTags.value.some(tagId => case_.tags.some(t => t.id === tagId))
    )
    
    return matchesSearch && matchesPriority && matchesAssigned && matchesTags
  })
})

const hasActiveFilters = computed(() => 
  filters.value.search || 
  filters.value.priority !== 'all' || 
  filters.value.assignedTo !== 'all' ||
  selectedTags.value.length > 0
)

// Column operations
const getColumnCases = (status: string) => {
  return filteredCases.value.filter(c => c.status === status)
}

const getColumnCount = (status: string) => {
  return getColumnCases(status).length
}

const toggleColumnCollapse = (status: string) => {
  const index = collapsedColumns.value.indexOf(status)
  if (index > -1) {
    collapsedColumns.value.splice(index, 1)
  } else {
    collapsedColumns.value.push(status)
  }
}

// Drag and drop handlers
let draggedCase: Case | null = null

const onDragStart = (event: DragEvent, case_: Case) => {
  draggedCase = case_
  event.dataTransfer?.setData('text/plain', case_.id)
  
  // Add visual feedback
  const target = event.target as HTMLElement
  target.classList.add('dragging')
}

const onDragEnd = (event: DragEvent) => {
  dragOverColumn.value = null
  draggedCase = null
  
  // Remove visual feedback
  const target = event.target as HTMLElement
  target.classList.remove('dragging')
}

const onDrop = async (event: DragEvent, newStatus: string) => {
  event.preventDefault()
  dragOverColumn.value = null
  
  if (!draggedCase || draggedCase.status === newStatus) return
  
  try {
    // Optimistic update
    const originalStatus = draggedCase.status
    draggedCase.status = newStatus as CaseStatus
    
    // API call
    await $fetch(`/api/v1/cases/${draggedCase.id}/status`, {
      method: 'PATCH',
      body: { status: newStatus }
    })
    
    // Update local state
    await casesStore.updateCaseStatus(draggedCase.id, newStatus as CaseStatus)
    
    // Show success notification
    useToast().success(`案件「${draggedCase.title}」を「${getLegalStatusLabel(newStatus)}」に移動しました`)
  } catch (error) {
    // Rollback on error
    if (draggedCase) {
      draggedCase.status = originalStatus
    }
    
    useToast().error('案件の状態更新に失敗しました')
  }
}

// Helper functions
const getLegalStatusLabel = (status: string) => {
  return legalStatuses.find(s => s.key === status)?.label || status
}

const clearFilters = () => {
  filters.value = {
    search: '',
    priority: 'all',
    assignedTo: 'all',
    tags: []
  }
  selectedTags.value = []
}

// Modal operations
const openCreateCaseModal = () => {
  router.push('/cases/create')
}

const openCaseDetail = (caseId: string) => {
  router.push(`/cases/${caseId}`)
}

// Drag over handling
watch(dragOverColumn, (newValue) => {
  if (newValue) {
    document.body.classList.add('dragging-case')
  } else {
    document.body.classList.remove('dragging-case')
  }
})
</script>

<style scoped>
.kanban-page {
  @apply flex flex-col h-full p-6 space-y-6;
}

.kanban-header {
  @apply space-y-4;
}

.kanban-filters {
  @apply border-b pb-4;
}

.kanban-board {
  @apply flex-1 overflow-hidden;
}

.kanban-columns {
  @apply flex gap-4 h-full overflow-x-auto pb-4;
  min-width: fit-content;
}

.kanban-column {
  @apply flex flex-col bg-card rounded-lg border;
  width: 320px;
  min-width: 280px;
}

.compact-mode .kanban-column {
  width: 280px;
  min-width: 240px;
}

.column-header {
  @apply flex items-center justify-between p-4 border-b bg-muted/50;
}

.column-content {
  @apply flex-1 overflow-hidden;
}

.drop-zone {
  @apply h-full p-2 transition-colors;
}

.drop-zone.drag-over {
  @apply bg-accent/50;
}

.case-cards {
  @apply space-y-3 h-full overflow-y-auto;
}

.empty-column {
  @apply flex flex-col items-center justify-center h-32 text-center;
}

.loading-overlay {
  @apply fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center;
}

.loading-content {
  @apply text-center;
}

/* Drag and drop animations */
.case-card-move,
.case-card-enter-active,
.case-card-leave-active {
  transition: all 0.3s ease;
}

.case-card-enter-from,
.case-card-leave-to {
  opacity: 0;
  transform: translateY(-10px);
}

.case-card-leave-active {
  position: absolute;
  right: 0;
  left: 0;
}

/* Dragging styles */
:global(.dragging) {
  @apply opacity-50 transform rotate-2 scale-95;
}

:global(.dragging-case) {
  cursor: grabbing;
}
</style>
```

### Case Card Component
Comprehensive case information display:

```vue
<!-- components/cases/CaseCard.vue -->
<template>
  <Card 
    class="case-card" 
    :class="{
      'compact': viewMode === 'compact',
      'priority-high': case_.priority === 'high',
      'priority-medium': case_.priority === 'medium',
      'priority-low': case_.priority === 'low',
      'overdue': isOverdue
    }"
    @click="$emit('click')"
  >
    <CardHeader class="case-header">
      <div class="flex items-start justify-between">
        <div class="flex-1 min-w-0">
          <!-- Case Number -->
          <div class="case-number">
            {{ formatCaseNumber(case_.caseNumber) }}
          </div>
          
          <!-- Case Title -->
          <CardTitle class="case-title">
            {{ case_.title }}
          </CardTitle>
          
          <!-- Client Info -->
          <div class="case-client">
            <User class="h-3 w-3" />
            {{ case_.client.name }}
            <Badge 
              v-if="case_.client.type === 'corporate'" 
              variant="outline" 
              class="ml-1 text-xs"
            >
              法人
            </Badge>
          </div>
        </div>
        
        <!-- Priority Indicator -->
        <div class="priority-indicator">
          <AlertCircle 
            v-if="case_.priority === 'high'"
            class="h-4 w-4 text-red-500"
          />
          <Clock 
            v-else-if="case_.priority === 'medium'"
            class="h-4 w-4 text-orange-500"
          />
          <Circle 
            v-else
            class="h-4 w-4 text-gray-400"
          />
        </div>
      </div>
    </CardHeader>
    
    <CardContent class="case-content">
      <!-- Case Type and Category -->
      <div class="case-metadata">
        <Badge variant="secondary" class="text-xs">
          {{ getCaseTypeLabel(case_.caseType) }}
        </Badge>
        
        <Badge 
          v-if="case_.category"
          variant="outline" 
          class="text-xs ml-2"
        >
          {{ case_.category }}
        </Badge>
      </div>
      
      <!-- Tags -->
      <div v-if="case_.tags.length" class="case-tags">
        <Tag 
          v-for="tag in case_.tags.slice(0, viewMode === 'compact' ? 2 : 4)"
          :key="tag.id"
          :tag="tag"
          size="sm"
        />
        <span 
          v-if="case_.tags.length > (viewMode === 'compact' ? 2 : 4)"
          class="text-xs text-muted-foreground"
        >
          +{{ case_.tags.length - (viewMode === 'compact' ? 2 : 4) }}
        </span>
      </div>
      
      <!-- Progress and Due Date -->
      <div v-if="viewMode === 'detailed'" class="case-progress">
        <!-- Progress Bar -->
        <div class="progress-section">
          <div class="flex items-center justify-between text-xs mb-1">
            <span>進捗</span>
            <span>{{ Math.round(case_.progress * 100) }}%</span>
          </div>
          <Progress :value="case_.progress * 100" class="h-2" />
        </div>
        
        <!-- Due Date -->
        <div v-if="case_.dueDate" class="due-date">
          <Calendar class="h-3 w-3" />
          <span :class="{ 'text-red-600': isOverdue, 'text-orange-600': isDueSoon }">
            {{ formatDueDate(case_.dueDate) }}
          </span>
        </div>
      </div>
      
      <!-- Assigned Lawyer -->
      <div v-if="case_.assignedLawyer" class="assigned-lawyer">
        <Avatar class="h-6 w-6">
          <AvatarImage :src="case_.assignedLawyer.avatar" />
          <AvatarFallback class="text-xs">
            {{ getInitials(case_.assignedLawyer.name) }}
          </AvatarFallback>
        </Avatar>
        <span class="text-sm">{{ case_.assignedLawyer.name }}</span>
      </div>
    </CardContent>
    
    <!-- Quick Actions -->
    <CardFooter v-if="viewMode === 'detailed'" class="case-actions">
      <Button 
        variant="ghost" 
        size="sm" 
        @click.stop="openCaseDetail"
      >
        <FileText class="h-4 w-4 mr-1" />
        詳細
      </Button>
      
      <Button 
        variant="ghost" 
        size="sm" 
        @click.stop="openEditDialog"
      >
        <Edit class="h-4 w-4 mr-1" />
        編集
      </Button>
      
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="sm">
            <MoreHorizontal class="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem @click="duplicateCase">
            <Copy class="h-4 w-4 mr-2" />
            複製
          </DropdownMenuItem>
          <DropdownMenuItem @click="exportCase">
            <Download class="h-4 w-4 mr-2" />
            エクスポート
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem 
            @click="archiveCase" 
            class="text-orange-600"
          >
            <Archive class="h-4 w-4 mr-2" />
            アーカイブ
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </CardFooter>
  </Card>
</template>

<script setup lang="ts">
import { format, isAfter, isBefore, addDays } from 'date-fns'
import { ja } from 'date-fns/locale'
import type { Case } from '~/types/case'

interface Props {
  case: Case
  viewMode?: 'compact' | 'detailed'
}

const props = withDefaults(defineProps<Props>(), {
  viewMode: 'detailed'
})

const emit = defineEmits<{
  click: []
}>()

// Date calculations
const now = new Date()
const isOverdue = computed(() => 
  props.case.dueDate && isAfter(now, new Date(props.case.dueDate))
)

const isDueSoon = computed(() => 
  props.case.dueDate && 
  isBefore(now, new Date(props.case.dueDate)) &&
  isAfter(addDays(now, 7), new Date(props.case.dueDate))
)

// Helper functions
const formatCaseNumber = (caseNumber: string) => {
  return caseNumber.replace(/([A-Z]+)(\d+)/, '$1-$2')
}

const formatDueDate = (date: string) => {
  return format(new Date(date), 'M/d(E)', { locale: ja })
}

const getCaseTypeLabel = (type: string) => {
  const labels: Record<string, string> = {
    civil: '民事',
    criminal: '刑事',
    corporate: '企業法務',
    family: '家事',
    administrative: '行政',
    intellectual: '知的財産'
  }
  return labels[type] || type
}

const getInitials = (name: string) => {
  return name.split(' ').map(n => n[0]).join('').toUpperCase()
}

// Actions
const router = useRouter()

const openCaseDetail = () => {
  router.push(`/cases/${props.case.id}`)
}

const openEditDialog = () => {
  router.push(`/cases/${props.case.id}/edit`)
}

const duplicateCase = () => {
  // Implementation for case duplication
  useToast().info('案件の複製機能は開発中です')
}

const exportCase = () => {
  // Implementation for case export
  useToast().info('案件のエクスポート機能は開発中です')
}

const archiveCase = () => {
  // Implementation for case archiving
  useToast().info('案件のアーカイブ機能は開発中です')
}
</script>

<style scoped>
.case-card {
  @apply cursor-pointer transition-all duration-200 hover:shadow-md;
  border-left-width: 4px;
}

.case-card.priority-high {
  border-left-color: #ef4444;
}

.case-card.priority-medium {
  border-left-color: #f97316;
}

.case-card.priority-low {
  border-left-color: #6b7280;
}

.case-card.overdue {
  @apply bg-red-50 border-red-200;
}

.case-card.compact .case-header {
  @apply pb-2;
}

.case-card.compact .case-content {
  @apply py-2;
}

.case-number {
  @apply text-xs font-mono text-muted-foreground;
}

.case-title {
  @apply text-sm font-semibold truncate mt-1;
}

.case-client {
  @apply flex items-center gap-1 text-xs text-muted-foreground mt-1;
}

.priority-indicator {
  @apply flex-shrink-0;
}

.case-metadata {
  @apply flex items-center flex-wrap gap-1 mb-3;
}

.case-tags {
  @apply flex items-center flex-wrap gap-1 mb-3;
}

.case-progress {
  @apply space-y-2 mb-3;
}

.due-date {
  @apply flex items-center gap-1 text-xs;
}

.assigned-lawyer {
  @apply flex items-center gap-2 mt-3 pt-3 border-t;
}

.case-actions {
  @apply flex items-center gap-1 pt-2 border-t;
}
</style>
```

## Integration Points

### State Management Integration
- **Pinia Cases Store**: Centralized case data management
- **Real-time Updates**: WebSocket integration for live updates
- **Optimistic Updates**: Immediate UI feedback with rollback
- **Local Storage**: Filter preferences and view modes

### Component System Integration
- **shadcn-vue Components**: Consistent UI component usage
- **Drag and Drop**: Vue draggable with accessibility support
- **Responsive Design**: Mobile-first approach with touch support
- **Animation System**: Smooth transitions for status changes

### API Integration
- **RESTful Endpoints**: Case CRUD operations
- **Status Validation**: Server-side business rule enforcement
- **Batch Operations**: Multiple case updates
- **Real-time Notifications**: Status change notifications

## Implementation Steps

1. **Create Kanban Board Layout** (2.5 hours)
   - Build responsive 7-column layout for Japanese legal workflow
   - Implement column headers with count badges
   - Add column collapse/expand functionality

2. **Implement Case Card Component** (2 hours)
   - Design comprehensive case information display
   - Add priority indicators and status badges
   - Implement quick action buttons and dropdowns

3. **Add Drag-and-Drop System** (2 hours)
   - Integrate Vue draggable with touch support
   - Implement visual feedback during drag operations
   - Add status transition validation and error handling

4. **Build Filtering System** (1.5 hours)
   - Create comprehensive filter interface
   - Implement real-time search across case data
   - Add tag-based filtering with AND/OR logic

## Testing Requirements

### Kanban Board Functionality Testing
```typescript
// tests/kanban.test.ts
describe('Kanban Board', () => {
  test('should display cases in correct columns', () => {
    const wrapper = mount(KanbanPage)
    expect(wrapper.find('[data-status="new"]')).toBeTruthy()
    expect(wrapper.find('[data-status="completed"]')).toBeTruthy()
  })
  
  test('should update case status on drag and drop', async () => {
    // Test drag and drop functionality
  })
  
  test('should filter cases based on search input', async () => {
    // Test filtering functionality
  })
})
```

### Storybook Stories
```typescript
// stories/CaseCard.stories.ts
export default {
  title: 'Cases/CaseCard',
  component: CaseCard,
  parameters: {
    layout: 'padded'
  }
}

export const Default = {
  args: {
    case: mockCase,
    viewMode: 'detailed'
  }
}

export const Compact = {
  args: {
    case: mockCase,
    viewMode: 'compact'
  }
}

export const HighPriority = {
  args: {
    case: { ...mockCase, priority: 'high' }
  }
}

export const Overdue = {
  args: {
    case: { 
      ...mockCase, 
      dueDate: new Date(Date.now() - 86400000).toISOString()
    }
  }
}
```

## Success Criteria

- [ ] Kanban board displays 7-column Japanese legal workflow
- [ ] Drag-and-drop functionality works on all devices
- [ ] Case cards show comprehensive information clearly
- [ ] Real-time filtering responds immediately to input
- [ ] Status transitions validate business rules
- [ ] Mobile-responsive design works on 320px+ screens
- [ ] Accessibility supports keyboard navigation
- [ ] Japanese text displays correctly in all components
- [ ] Performance remains smooth with 100+ cases

## Security Considerations

### Legal Practice Requirements
- **Client Confidentiality**: No sensitive data in card previews
- **Access Control**: Status transitions respect user permissions
- **Audit Trail**: All status changes logged for compliance
- **Data Isolation**: Multi-tenant case segregation

### Frontend Security
- **Input Validation**: Sanitize all search and filter inputs
- **XSS Prevention**: Escape user-generated content
- **CSRF Protection**: Secure API request handling
- **Permission Checks**: Client-side permission validation

## Performance Considerations

- **Virtual Scrolling**: Handle large case volumes efficiently
- **Lazy Loading**: Load case details on demand
- **Optimistic Updates**: Immediate UI feedback
- **Debounced Search**: Efficient filter processing
- **Mobile Optimization**: Touch-friendly interactions

## 設計詳細

### 1. 状態管理とデータフロー設計 (改善版)

#### 責任分離による型安全な設計

```typescript
// types/case.ts - 完全な型定義
export interface Case {
  readonly id: string
  readonly caseNumber: string
  title: string
  status: CaseStatus
  priority: CasePriority
  readonly clientId: string
  readonly client: CaseClient
  assignedLawyerId?: string
  assignedLawyer?: LawyerInfo
  caseType: CaseType
  category?: string
  description?: string
  tags: CaseTag[]
  progress: number // 0-1 の進捗率
  dueDate?: string
  nextHearingDate?: string
  courtName?: string
  readonly createdAt: string
  readonly updatedAt: string
}

export type CaseStatus = 
  | 'new'           // 新規
  | 'accepted'      // 受任
  | 'investigation' // 調査
  | 'preparation'   // 準備
  | 'negotiation'   // 交渉
  | 'trial'         // 裁判
  | 'completed'     // 完了

export type CasePriority = 'high' | 'medium' | 'low'

export type CaseType = 
  | 'civil'         // 民事
  | 'criminal'      // 刑事
  | 'corporate'     // 企業法務
  | 'family'        // 家事
  | 'administrative' // 行政
  | 'intellectual'  // 知的財産

export interface CaseClient {
  readonly id: string
  readonly name: string
  readonly type: 'individual' | 'corporate'
  readonly email?: string
  readonly phone?: string
}

export interface LawyerInfo {
  readonly id: string
  readonly name: string
  readonly avatar?: string
  readonly role: string
}

export interface CaseTag {
  readonly id: string
  readonly name: string
  readonly color: string
  readonly categoryId?: string
}

// フィルター型定義
export interface CaseFilters {
  readonly search: string
  readonly priority: CasePriority | 'all'
  readonly assignedTo: string
  readonly tags: readonly string[]
}

// エラー処理型定義
export interface CaseError {
  readonly code: CaseErrorCode
  readonly message: string
  readonly details?: unknown
  readonly timestamp: string
}

export type CaseErrorCode = 
  | 'FETCH_FAILED'
  | 'UPDATE_FAILED' 
  | 'VALIDATION_ERROR'
  | 'PERMISSION_DENIED'
  | 'NETWORK_ERROR'

// Result型
export type Result<T, E = CaseError> = 
  | { success: true; data: T }
  | { success: false; error: E }
```

#### 設定の外部化

```typescript
// config/case-management.config.ts
export const CASE_MANAGEMENT_CONFIG = {
  polling: {
    intervalMs: 30000,
    enabled: true
  },
  ui: {
    cardAnimationDuration: 300,
    maxVisibleTags: 4,
    compactMaxVisibleTags: 2
  },
  api: {
    batchSize: 50,
    timeoutMs: 10000
  }
} as const

// config/legal-statuses.config.ts  
export const LEGAL_STATUSES: readonly StatusConfig[] = [
  { 
    key: 'new', 
    label: '新規', 
    color: '#8b5cf6', 
    description: '案件受付・初期相談段階',
    allowedTransitions: ['accepted']
  },
  { 
    key: 'accepted', 
    label: '受任', 
    color: '#3b82f6', 
    description: '正式受任・契約締結済み',
    allowedTransitions: ['investigation']
  },
  { 
    key: 'investigation', 
    label: '調査', 
    color: '#f59e0b', 
    description: '事実調査・証拠収集段階',
    allowedTransitions: ['preparation', 'negotiation']
  },
  { 
    key: 'preparation', 
    label: '準備', 
    color: '#10b981', 
    description: '書面作成・戦略立案段階',
    allowedTransitions: ['negotiation', 'trial']
  },
  { 
    key: 'negotiation', 
    label: '交渉', 
    color: '#f97316', 
    description: '和解交渉・調停段階',
    allowedTransitions: ['trial', 'completed']
  },
  { 
    key: 'trial', 
    label: '裁判', 
    color: '#ef4444', 
    description: '訴訟・審理段階',
    allowedTransitions: ['completed']
  },
  { 
    key: 'completed', 
    label: '完了', 
    color: '#6b7280', 
    description: '案件終了・清算完了',
    allowedTransitions: []
  }
] as const

export interface StatusConfig {
  readonly key: CaseStatus
  readonly label: string
  readonly color: string
  readonly description: string
  readonly allowedTransitions: readonly CaseStatus[]
}
```

#### 単一責任のComposables設計

```typescript
// composables/useCaseFilters.ts - フィルター専用
export const useCaseFilters = () => {
  const filters = useLocalStorage<CaseFilters>('kanban-filters', {
    search: '',
    priority: 'all',
    assignedTo: 'all',
    tags: []
  })

  const clearFilters = () => {
    filters.value = {
      search: '',
      priority: 'all',
      assignedTo: 'all', 
      tags: []
    }
  }

  const hasActiveFilters = computed(() => 
    filters.value.search !== '' ||
    filters.value.priority !== 'all' ||
    filters.value.assignedTo !== 'all' ||
    filters.value.tags.length > 0
  )

  return { 
    filters, 
    clearFilters, 
    hasActiveFilters 
  }
}

// composables/useCaseData.ts - データ取得専用
export const useCaseData = () => {
  const cases = ref<Case[]>([])
  const isLoading = ref(false)
  const error = ref<CaseError | null>(null)
  
  const fetchCases = async (): Promise<void> => {
    try {
      isLoading.value = true
      error.value = null
      
      const response = await $fetch('/api/v1/cases')
      cases.value = response.cases || []
    } catch (err) {
      error.value = createCaseError(err)
    } finally {
      isLoading.value = false
    }
  }
  
  const refreshCases = async (): Promise<void> => {
    await fetchCases()
  }
  
  return { 
    cases: readonly(cases), 
    isLoading: readonly(isLoading), 
    error: readonly(error), 
    fetchCases, 
    refreshCases 
  }
}

// composables/useCaseViewSettings.ts - ビュー設定専用
export const useCaseViewSettings = () => {
  const viewSettings = useLocalStorage('kanban-view-settings', {
    mode: 'detailed' as 'compact' | 'detailed',
    collapsedColumns: [] as CaseStatus[],
    sortBy: 'updatedAt' as keyof Case,
    sortOrder: 'desc' as 'asc' | 'desc'
  })

  const toggleColumnCollapse = (status: CaseStatus) => {
    const index = viewSettings.value.collapsedColumns.indexOf(status)
    if (index > -1) {
      viewSettings.value.collapsedColumns.splice(index, 1)
    } else {
      viewSettings.value.collapsedColumns.push(status)
    }
  }

  const isColumnCollapsed = (status: CaseStatus): boolean => {
    return viewSettings.value.collapsedColumns.includes(status)
  }

  return { 
    viewSettings, 
    toggleColumnCollapse, 
    isColumnCollapsed 
  }
}
```

#### 純粋関数によるフィルター処理

```typescript
// utils/case-filters.ts - 純粋関数でフィルター処理
export const applyCaseFilters = (
  cases: readonly Case[],
  filters: CaseFilters
): Case[] => {
  return cases.filter(case_ => {
    // テキスト検索
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase()
      const matchesSearch = 
        case_.title.toLowerCase().includes(searchTerm) ||
        case_.caseNumber.toLowerCase().includes(searchTerm) ||
        case_.client.name.toLowerCase().includes(searchTerm)
      
      if (!matchesSearch) return false
    }
    
    // 優先度フィルター
    if (filters.priority !== 'all' && case_.priority !== filters.priority) {
      return false
    }
    
    // 担当者フィルター
    if (filters.assignedTo !== 'all' && case_.assignedLawyer?.id !== filters.assignedTo) {
      return false
    }
    
    // タグフィルター
    if (filters.tags.length > 0) {
      const hasMatchingTag = filters.tags.some(tagId =>
        case_.tags.some(tag => tag.id === tagId)
      )
      if (!hasMatchingTag) return false
    }
    
    return true
  })
}

// utils/case-grouping.ts - ステータス別グループ化
export const groupCasesByStatus = (cases: readonly Case[]): Map<CaseStatus, Case[]> => {
  const grouped = new Map<CaseStatus, Case[]>()
  
  // 全ステータスを初期化
  LEGAL_STATUSES.forEach(status => {
    grouped.set(status.key, [])
  })

  // 案件をステータス別にグループ化
  cases.forEach(case_ => {
    const statusCases = grouped.get(case_.status) || []
    statusCases.push(case_)
    grouped.set(case_.status, statusCases)
  })

  return grouped
}

// utils/case-errors.ts - エラーハンドリング
export const createCaseError = (error: unknown): CaseError => {
  if (error instanceof Error) {
    return {
      code: 'FETCH_FAILED',
      message: error.message,
      details: error,
      timestamp: new Date().toISOString()
    }
  }
  
  return {
    code: 'FETCH_FAILED',
    message: 'Unknown error occurred',
    details: error,
    timestamp: new Date().toISOString()
  }
}
```

#### テスト可能なStore設計

```typescript
// stores/cases.ts - 改善版
export const useCasesStore = defineStore('cases', () => {
  // 依存注入可能なサービス
  const caseService = inject<CaseService>('caseService', createDefaultCaseService())
  
  // 単一責任のcomposables使用
  const { cases, isLoading, error, fetchCases, refreshCases } = useCaseData()
  const { filters, clearFilters, hasActiveFilters } = useCaseFilters()
  const { viewSettings, toggleColumnCollapse, isColumnCollapsed } = useCaseViewSettings()
  
  // 選択状態管理
  const selectedCases = ref(new Set<string>())
  
  // 純粋関数による計算
  const filteredCases = computed(() => 
    applyCaseFilters(cases.value, filters.value)
  )
  
  const casesByStatus = computed(() => 
    groupCasesByStatus(filteredCases.value)
  )
  
  const totalCases = computed(() => cases.value.length)
  const activeCases = computed(() => 
    cases.value.filter(c => c.status !== 'completed').length
  )
  
  // リアルタイム更新
  const { pause: pausePolling, resume: resumePolling } = useIntervalFn(
    refreshCases, 
    CASE_MANAGEMENT_CONFIG.polling.intervalMs
  )
  
  // 明確に分離されたアクション
  const updateCaseStatus = async (
    caseId: string, 
    newStatus: CaseStatus
  ): Promise<Result<void, CaseError>> => {
    try {
      // 楽観的更新
      const caseIndex = cases.value.findIndex(c => c.id === caseId)
      if (caseIndex === -1) {
        return { 
          success: false, 
          error: createCaseError(new Error('Case not found')) 
        }
      }

      const originalCase = { ...cases.value[caseIndex] }
      cases.value[caseIndex].status = newStatus
      cases.value[caseIndex].updatedAt = new Date().toISOString()

      // API呼び出し
      const result = await caseService.updateStatus(caseId, newStatus)
      
      if (result.success) {
        return { success: true, data: undefined }
      }
      
      // ロールバック
      cases.value[caseIndex] = originalCase
      return { success: false, error: result.error }
    } catch (err) {
      const error = createCaseError(err)
      return { success: false, error }
    }
  }
  
  const bulkUpdateStatus = async (
    caseIds: readonly string[], 
    newStatus: CaseStatus
  ): Promise<Result<void, CaseError>> => {
    const originalCases = new Map<string, Case>()
    
    try {
      // 楽観的更新とバックアップ
      caseIds.forEach(id => {
        const caseIndex = cases.value.findIndex(c => c.id === id)
        if (caseIndex !== -1) {
          originalCases.set(id, { ...cases.value[caseIndex] })
          cases.value[caseIndex].status = newStatus
          cases.value[caseIndex].updatedAt = new Date().toISOString()
        }
      })

      // バッチAPI呼び出し
      const result = await caseService.bulkUpdateStatus(caseIds, newStatus)
      
      if (result.success) {
        return { success: true, data: undefined }
      }
      
      // ロールバック
      originalCases.forEach((originalCase, id) => {
        const caseIndex = cases.value.findIndex(c => c.id === id)
        if (caseIndex !== -1) {
          cases.value[caseIndex] = originalCase
        }
      })
      
      return { success: false, error: result.error }
    } catch (err) {
      // ロールバック
      originalCases.forEach((originalCase, id) => {
        const caseIndex = cases.value.findIndex(c => c.id === id)
        if (caseIndex !== -1) {
          cases.value[caseIndex] = originalCase
        }
      })
      
      const error = createCaseError(err)
      return { success: false, error }
    }
  }
  
  const toggleCaseSelection = (caseId: string) => {
    if (selectedCases.value.has(caseId)) {
      selectedCases.value.delete(caseId)
    } else {
      selectedCases.value.add(caseId)
    }
  }
  
  const clearCaseSelection = () => {
    selectedCases.value.clear()
  }

  return {
    // 状態
    cases,
    isLoading,
    error,
    filters,
    viewSettings,
    selectedCases: readonly(selectedCases),
    
    // 計算プロパティ
    filteredCases,
    casesByStatus,
    totalCases,
    activeCases,
    hasActiveFilters,
    
    // アクション
    fetchCases,
    refreshCases,
    updateCaseStatus,
    bulkUpdateStatus,
    clearFilters,
    toggleColumnCollapse,
    isColumnCollapsed,
    toggleCaseSelection,
    clearCaseSelection,
    
    // ライフサイクル
    startRealTimeUpdates: resumePolling,
    stopRealTimeUpdates: pausePolling
  }
})

// services/case-service.ts - 依存注入可能なサービス
export interface CaseService {
  updateStatus(caseId: string, status: CaseStatus): Promise<Result<void, CaseError>>
  bulkUpdateStatus(caseIds: readonly string[], status: CaseStatus): Promise<Result<void, CaseError>>
}

export const createDefaultCaseService = (): CaseService => ({
  async updateStatus(caseId: string, status: CaseStatus) {
    try {
      await $fetch(`/api/v1/cases/${caseId}/status`, {
        method: 'PATCH',
        body: { status }
      })
      return { success: true, data: undefined }
    } catch (err) {
      return { success: false, error: createCaseError(err) }
    }
  },
  
  async bulkUpdateStatus(caseIds: readonly string[], status: CaseStatus) {
    try {
      await $fetch('/api/v1/cases/batch-update', {
        method: 'PATCH',
        body: { caseIds, status }
      })
      return { success: true, data: undefined }
    } catch (err) {
      return { success: false, error: createCaseError(err) }
    }
  }
})
```

#### 包括的テスト戦略

```typescript
// tests/case-filters.test.ts
describe('applyCaseFilters', () => {
  const mockCases: Case[] = [
    createMockCase({ 
      id: '1', 
      title: 'テスト案件', 
      priority: 'high',
      client: { name: '田中太郎' } 
    }),
    createMockCase({ 
      id: '2', 
      title: '企業案件', 
      priority: 'low',
      client: { name: '株式会社サンプル' }
    })
  ]
  
  it('should filter by search term in title', () => {
    const filters: CaseFilters = { 
      search: 'テスト', 
      priority: 'all', 
      assignedTo: 'all', 
      tags: [] 
    }
    const result = applyCaseFilters(mockCases, filters)
    
    expect(result).toHaveLength(1)
    expect(result[0].id).toBe('1')
  })
  
  it('should filter by search term in client name', () => {
    const filters: CaseFilters = { 
      search: '田中', 
      priority: 'all', 
      assignedTo: 'all', 
      tags: [] 
    }
    const result = applyCaseFilters(mockCases, filters)
    
    expect(result).toHaveLength(1)
    expect(result[0].client.name).toContain('田中')
  })
  
  it('should filter by priority', () => {
    const filters: CaseFilters = { 
      search: '', 
      priority: 'high', 
      assignedTo: 'all', 
      tags: [] 
    }
    const result = applyCaseFilters(mockCases, filters)
    
    expect(result).toHaveLength(1)
    expect(result[0].priority).toBe('high')
  })
  
  it('should return all cases when no filters applied', () => {
    const filters: CaseFilters = { 
      search: '', 
      priority: 'all', 
      assignedTo: 'all', 
      tags: [] 
    }
    const result = applyCaseFilters(mockCases, filters)
    
    expect(result).toHaveLength(2)
  })
})

// tests/case-grouping.test.ts
describe('groupCasesByStatus', () => {
  it('should group cases by status correctly', () => {
    const cases: Case[] = [
      createMockCase({ status: 'new' }),
      createMockCase({ status: 'accepted' }),
      createMockCase({ status: 'new' })
    ]
    
    const grouped = groupCasesByStatus(cases)
    
    expect(grouped.get('new')).toHaveLength(2)
    expect(grouped.get('accepted')).toHaveLength(1)
    expect(grouped.get('investigation')).toHaveLength(0)
  })
  
  it('should initialize all status groups', () => {
    const cases: Case[] = []
    const grouped = groupCasesByStatus(cases)
    
    LEGAL_STATUSES.forEach(status => {
      expect(grouped.has(status.key)).toBe(true)
      expect(grouped.get(status.key)).toEqual([])
    })
  })
})

// tests/case-store.test.ts
describe('useCasesStore', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should update case status successfully', async () => {
    const mockCaseService: CaseService = {
      updateStatus: vi.fn().mockResolvedValue({ success: true, data: undefined }),
      bulkUpdateStatus: vi.fn()
    }
    
    // 依存注入
    provide('caseService', mockCaseService)
    
    const store = useCasesStore()
    const result = await store.updateCaseStatus('case-1', 'accepted')
    
    expect(result.success).toBe(true)
    expect(mockCaseService.updateStatus).toHaveBeenCalledWith('case-1', 'accepted')
  })
  
  it('should handle update errors gracefully', async () => {
    const mockError = createCaseError(new Error('Network failed'))
    const mockCaseService: CaseService = {
      updateStatus: vi.fn().mockResolvedValue({ success: false, error: mockError }),
      bulkUpdateStatus: vi.fn()
    }
    
    provide('caseService', mockCaseService)
    
    const store = useCasesStore()
    const result = await store.updateCaseStatus('case-1', 'accepted')
    
    expect(result.success).toBe(false)
    expect(result.error).toEqual(mockError)
  })
  
  it('should perform optimistic updates correctly', async () => {
    const mockCases = [createMockCase({ id: 'case-1', status: 'new' })]
    const store = useCasesStore()
    
    // 初期状態設定
    store.cases.value = mockCases
    
    // 楽観的更新のテスト
    const updatePromise = store.updateCaseStatus('case-1', 'accepted')
    
    // 即座にUI状態が更新されることを確認
    expect(store.cases.value[0].status).toBe('accepted')
    
    await updatePromise
  })
})

// tests/helpers/mock-factories.ts
export const createMockCase = (overrides: Partial<Case> = {}): Case => ({
  id: 'mock-case-id',
  caseNumber: 'CASE-2024-001',
  title: 'Mock Case Title',
  status: 'new',
  priority: 'medium',
  clientId: 'mock-client-id',
  client: {
    id: 'mock-client-id',
    name: 'Mock Client',
    type: 'individual'
  },
  caseType: 'civil',
  tags: [],
  progress: 0.5,
  createdAt: '2024-01-01T00:00:00Z',
  updatedAt: '2024-01-01T00:00:00Z',
  ...overrides
})
```

この改善された設計により、以下の品質要件を満たします：

- **✅ モダン**: Composition API + 純粋関数 + 依存注入 + Result型
- **✅ メンテナンス性**: 単一責任 + 設定外部化 + 明確な境界 + エラー型定義
- **✅ Simple over Easy**: 小さなcomposable + 純粋関数 + 責任分離
- **✅ テスト容易性**: 依存注入 + 純粋関数 + モック可能な設計 + 包括的テスト戦略
- **✅ 型安全**: 完全なTypeScript + Result型 + エラー型定義 + 設定型定義

### 2. ドラッグ&ドロップシステム設計 (改善版)

#### 責任分離によるアーキテクチャ設計

```typescript
// types/drag-drop.ts - ドラッグ&ドロップ型定義
export interface DragDropState {
  readonly isDragging: boolean
  readonly draggedItemId: string | null
  readonly draggedItemType: DragItemType
  readonly dropZoneId: string | null
  readonly isValidDrop: boolean
}

export type DragItemType = 'case' | 'document' | 'task'

export interface DragDropConfig {
  readonly animation: {
    readonly duration: number
    readonly easing: string
  }
  readonly validation: {
    readonly enabled: boolean
    readonly strictMode: boolean
  }
  readonly accessibility: {
    readonly announcements: boolean
    readonly keyboardNavigation: boolean
  }
}

export interface DragDropResult<T = unknown> {
  readonly success: boolean
  readonly data?: T
  readonly error?: DragDropError
  readonly rollback?: () => void
}

export interface DragDropError {
  readonly code: DragDropErrorCode
  readonly message: string
  readonly sourceId: string
  readonly targetId: string
}

export type DragDropErrorCode = 
  | 'INVALID_TRANSITION'
  | 'PERMISSION_DENIED' 
  | 'VALIDATION_FAILED'
  | 'NETWORK_ERROR'
  | 'CONCURRENT_MODIFICATION'

// ビジュアル効果のインターフェース
export interface DragVisualEffects {
  applyDragStyle: (element: HTMLElement) => void
  removeDragStyle: (element: HTMLElement) => void
  applyDropZoneStyle: (element: HTMLElement, isValid: boolean) => void
  clearDropZoneStyles: (element: HTMLElement) => void
  clearAllDropZoneStyles: () => void
}

// アクセシビリティのインターフェース
export interface AriaLiveAnnouncer {
  announce: (message: string, priority?: 'polite' | 'assertive') => void
}
```

#### 設定の完全外部化

```typescript
// config/drag-drop.config.ts
export const DRAG_DROP_CONFIG: DragDropConfig = {
  animation: {
    duration: 300,
    easing: 'cubic-bezier(0.4, 0, 0.2, 1)'
  },
  validation: {
    enabled: true,
    strictMode: true
  },
  accessibility: {
    announcements: true,
    keyboardNavigation: true
  }
} as const

// config/drag-drop-styles.config.ts
export const DRAG_DROP_STYLES = {
  dragging: 'dragging',
  dropZone: 'drop-zone',
  validDrop: 'valid-drop',
  invalidDrop: 'invalid-drop'
} as const

// config/drag-drop-messages.config.ts
export const DRAG_DROP_MESSAGES = {
  dragStart: (title: string) => `案件「${title}」をドラッグ中です。移動先のステータス列にドロップしてください。`,
  validDrop: (statusLabel: string) => `「${statusLabel}」に移動可能です`,
  invalidDrop: (statusLabel: string) => `「${statusLabel}」への移動は無効です`,
  dropSuccess: (title: string, statusLabel: string) => `案件「${title}」を「${statusLabel}」に移動しました`,
  noTransitions: '案件はこれ以上移動できません',
  keyboardHelp: (title: string, statuses: string[]) => 
    `案件「${title}」のステータス変更。移動可能な選択肢: ${statuses.join(', ')}`
} as const

// config/drag-drop-timing.config.ts  
export const DRAG_DROP_TIMING = {
  announceDelay: 1000,
  animationDuration: 300,
  debounceMs: 100
} as const

// config/status-transitions.config.ts
export const STATUS_TRANSITION_RULES: Record<CaseStatus, readonly CaseStatus[]> = {
  new: ['accepted'],
  accepted: ['investigation'],
  investigation: ['preparation', 'negotiation'],
  preparation: ['negotiation', 'trial'],
  negotiation: ['trial', 'completed'],
  trial: ['completed'],
  completed: []
} as const
```

#### 単一責任のComposables設計

```typescript
// composables/useDragState.ts - 状態管理専用
export const useDragState = () => {
  const dragState = reactive<DragDropState>({
    isDragging: false,
    draggedItemId: null,
    draggedItemType: 'case',
    dropZoneId: null,
    isValidDrop: false
  })

  const resetDragState = () => {
    dragState.isDragging = false
    dragState.draggedItemId = null
    dragState.dropZoneId = null
    dragState.isValidDrop = false
  }

  const setDraggedItem = (itemId: string, itemType: DragItemType) => {
    dragState.isDragging = true
    dragState.draggedItemId = itemId
    dragState.draggedItemType = itemType
  }

  const setDropZone = (zoneId: string | null, isValid: boolean) => {
    dragState.dropZoneId = zoneId
    dragState.isValidDrop = isValid
  }

  return {
    dragState: readonly(dragState),
    resetDragState,
    setDraggedItem,
    setDropZone
  }
}

// composables/useDragVisualEffects.ts - ビジュアル効果専用
export const useDragVisualEffects = (): DragVisualEffects => {
  const applyDragStyle = (element: HTMLElement) => {
    element.classList.add(DRAG_DROP_STYLES.dragging)
  }

  const removeDragStyle = (element: HTMLElement) => {
    element.classList.remove(DRAG_DROP_STYLES.dragging)
  }

  const applyDropZoneStyle = (element: HTMLElement, isValid: boolean) => {
    const dropZone = element.querySelector(`.${DRAG_DROP_STYLES.dropZone}`)
    if (dropZone) {
      dropZone.classList.toggle(DRAG_DROP_STYLES.validDrop, isValid)
      dropZone.classList.toggle(DRAG_DROP_STYLES.invalidDrop, !isValid)
    }
  }

  const clearDropZoneStyles = (element: HTMLElement) => {
    const dropZone = element.querySelector(`.${DRAG_DROP_STYLES.dropZone}`)
    if (dropZone) {
      dropZone.classList.remove(
        DRAG_DROP_STYLES.validDrop, 
        DRAG_DROP_STYLES.invalidDrop
      )
    }
  }

  const clearAllDropZoneStyles = () => {
    document.querySelectorAll(`.${DRAG_DROP_STYLES.dropZone}`).forEach(zone => {
      zone.classList.remove(
        DRAG_DROP_STYLES.validDrop, 
        DRAG_DROP_STYLES.invalidDrop
      )
    })
  }

  return {
    applyDragStyle,
    removeDragStyle,
    applyDropZoneStyle,
    clearDropZoneStyles,
    clearAllDropZoneStyles
  }
}

// composables/useAriaLiveAnnouncer.ts - アクセシビリティ専用
export const useAriaLiveAnnouncer = (): AriaLiveAnnouncer => {
  const announceRegion = ref<HTMLElement | null>(null)
  
  const createAnnounceRegion = (): void => {
    if (process.client && !announceRegion.value) {
      const region = document.createElement('div')
      region.setAttribute('aria-live', 'polite')
      region.setAttribute('aria-atomic', 'true')
      region.className = 'sr-only'
      region.id = 'drag-drop-announcer'
      
      document.body.appendChild(region)
      announceRegion.value = region
    }
  }
  
  const announce = (message: string, priority: 'polite' | 'assertive' = 'polite'): void => {
    if (!announceRegion.value) {
      createAnnounceRegion()
    }
    
    if (announceRegion.value) {
      announceRegion.value.setAttribute('aria-live', priority)
      announceRegion.value.textContent = message
      
      // メッセージをクリアして再発話を可能にする
      setTimeout(() => {
        if (announceRegion.value) {
          announceRegion.value.textContent = ''
        }
      }, DRAG_DROP_TIMING.announceDelay)
    }
  }
  
  // クリーンアップ
  onUnmounted(() => {
    if (announceRegion.value && announceRegion.value.parentNode) {
      announceRegion.value.parentNode.removeChild(announceRegion.value)
    }
  })
  
  return { announce }
}
```

#### 純粋関数による処理分離

```typescript
// utils/status-validation.ts - 純粋関数による検証
export const createStatusValidator = (
  rules: Record<CaseStatus, readonly CaseStatus[]>
) => {
  return {
    isValidTransition: (from: CaseStatus, to: CaseStatus): boolean => {
      return rules[from]?.includes(to) ?? false
    },
    
    getValidTransitions: (from: CaseStatus): readonly CaseStatus[] => {
      return rules[from] || []
    },
    
    getTransitionPath: (from: CaseStatus, to: CaseStatus): CaseStatus[] | null => {
      if (from === to) return [from]
      
      const visited = new Set<CaseStatus>()
      const queue: Array<{ status: CaseStatus; path: CaseStatus[] }> = [
        { status: from, path: [from] }
      ]
      
      while (queue.length > 0) {
        const { status, path } = queue.shift()!
        
        if (visited.has(status)) continue
        visited.add(status)
        
        const nextStatuses = rules[status] || []
        
        for (const nextStatus of nextStatuses) {
          const newPath = [...path, nextStatus]
          
          if (nextStatus === to) {
            return newPath
          }
          
          if (!visited.has(nextStatus)) {
            queue.push({ status: nextStatus, path: newPath })
          }
        }
      }
      
      return null
    }
  }
}

export const statusValidator = createStatusValidator(STATUS_TRANSITION_RULES)

// utils/drag-drop-handlers.ts - 純粋関数でイベント処理
export const createDragStartHandler = (
  onDragStart: (itemId: string, itemType: DragItemType) => void,
  onVisualEffect: (element: HTMLElement) => void,
  onAnnounce: (message: string) => void
) => {
  return (event: DragEvent, case_: Case): void => {
    if (!event.dataTransfer) return

    try {
      // データ転送設定
      event.dataTransfer.effectAllowed = 'move'
      event.dataTransfer.setData('text/plain', case_.id)
      event.dataTransfer.setData('application/json', JSON.stringify({
        id: case_.id,
        type: 'case',
        status: case_.status
      }))

      // 状態更新
      onDragStart(case_.id, 'case')

      // ビジュアル効果
      const target = event.target as HTMLElement
      onVisualEffect(target)

      // アクセシビリティ
      onAnnounce(DRAG_DROP_MESSAGES.dragStart(case_.title))

    } catch (error) {
      console.error('Drag start failed:', error)
      throw error
    }
  }
}

export const createDropHandler = (
  validator: ReturnType<typeof createStatusValidator>,
  updateCase: (id: string, status: CaseStatus) => Promise<Result<void, CaseError>>,
  onSuccess: (message: string) => void,
  onError: (error: DragDropError) => void
) => {
  return async (
    event: DragEvent,
    targetStatus: CaseStatus,
    draggedCase: Case | null
  ): Promise<DragDropResult> => {
    event.preventDefault()

    if (!draggedCase) {
      const error: DragDropError = {
        code: 'VALIDATION_FAILED',
        message: 'ドラッグされた案件が見つかりません',
        sourceId: '',
        targetId: targetStatus
      }
      onError(error)
      return { success: false, error }
    }

    // 遷移検証
    if (!validator.isValidTransition(draggedCase.status, targetStatus)) {
      const error: DragDropError = {
        code: 'INVALID_TRANSITION',
        message: `「${draggedCase.status}」から「${targetStatus}」への遷移は無効です`,
        sourceId: draggedCase.status,
        targetId: targetStatus
      }
      onError(error)
      return { success: false, error }
    }

    // ステータス更新
    const result = await updateCase(draggedCase.id, targetStatus)

    if (result.success) {
      const statusLabel = LEGAL_STATUSES.find(s => s.key === targetStatus)?.label || targetStatus
      const message = DRAG_DROP_MESSAGES.dropSuccess(draggedCase.title, statusLabel)
      onSuccess(message)
      return { success: true, data: result.data }
    }

    const error: DragDropError = {
      code: 'NETWORK_ERROR',
      message: result.error?.message || 'ステータス更新に失敗しました',
      sourceId: draggedCase.status,
      targetId: targetStatus
    }
    onError(error)
    return { success: false, error }
  }
}
```

#### テスト可能な統合設計

```typescript
// composables/useCaseDragDrop.ts - 改善版
export const useCaseDragDrop = (
  options: {
    visualEffects?: DragVisualEffects
    announcer?: AriaLiveAnnouncer
    statusValidator?: ReturnType<typeof createStatusValidator>
  } = {}
) => {
  // 依存注入
  const visualEffects = options.visualEffects || useDragVisualEffects()
  const announcer = options.announcer || useAriaLiveAnnouncer()
  const validator = options.statusValidator || statusValidator

  // 単一責任のcomposables
  const { dragState, resetDragState, setDraggedItem, setDropZone } = useDragState()
  const casesStore = useCasesStore()

  // 純粋関数によるハンドラー生成
  const handleDragStart = createDragStartHandler(
    setDraggedItem,
    visualEffects.applyDragStyle,
    announcer.announce
  )

  const handleDrop = createDropHandler(
    validator,
    casesStore.updateCaseStatus,
    (message) => {
      announcer.announce(message)
      useToast().success(message)
    },
    (error) => {
      announcer.announce(error.message)
      useToast().error(error.message)
    }
  )

  // 簡略化されたイベントハンドラー
  const onDragStart = (event: DragEvent, case_: Case) => {
    try {
      handleDragStart(event, case_)
    } catch (error) {
      resetDragState()
    }
  }

  const onDragEnter = (event: DragEvent, targetStatus: CaseStatus) => {
    event.preventDefault()
    
    if (!dragState.isDragging || !dragState.draggedItemId) return

    const draggedCase = casesStore.cases.find(c => c.id === dragState.draggedItemId)
    if (!draggedCase) return

    const isValid = validator.isValidTransition(draggedCase.status, targetStatus)
    setDropZone(targetStatus, isValid)

    const target = event.currentTarget as HTMLElement
    visualEffects.applyDropZoneStyle(target, isValid)

    const statusLabel = LEGAL_STATUSES.find(s => s.key === targetStatus)?.label || targetStatus
    const message = isValid 
      ? DRAG_DROP_MESSAGES.validDrop(statusLabel)
      : DRAG_DROP_MESSAGES.invalidDrop(statusLabel)
    announcer.announce(message)
  }

  const onDragLeave = (event: DragEvent) => {
    const relatedTarget = event.relatedTarget as HTMLElement
    const currentTarget = event.currentTarget as HTMLElement
    
    if (relatedTarget && currentTarget.contains(relatedTarget)) return

    setDropZone(null, false)
    visualEffects.clearDropZoneStyles(currentTarget)
  }

  const onDrop = async (event: DragEvent, targetStatus: CaseStatus) => {
    try {
      const draggedCase = casesStore.cases.find(c => c.id === dragState.draggedItemId)
      const result = await handleDrop(event, targetStatus, draggedCase || null)
      return result
    } finally {
      resetDragState()
    }
  }

  const onDragEnd = (event: DragEvent) => {
    try {
      const target = event.target as HTMLElement
      visualEffects.removeDragStyle(target)
      visualEffects.clearAllDropZoneStyles()
    } finally {
      resetDragState()
    }
  }

  // キーボードナビゲーション
  const onKeyboardNavigation = (event: KeyboardEvent, case_: Case) => {
    if (!DRAG_DROP_CONFIG.accessibility.keyboardNavigation) return
    
    const { key, ctrlKey } = event
    
    if (key === 'Enter' || key === ' ') {
      event.preventDefault()
      showStatusSelectionDialog(case_)
    } else if (key === 'ArrowRight' && ctrlKey) {
      event.preventDefault()
      moveToNextValidStatus(case_)
    } else if (key === 'ArrowLeft' && ctrlKey) {
      event.preventDefault()
      moveToPreviousValidStatus(case_)
    }
  }

  const showStatusSelectionDialog = (case_: Case) => {
    const validStatuses = validator.getValidTransitions(case_.status)
    
    if (validStatuses.length === 0) {
      announcer.announce(DRAG_DROP_MESSAGES.noTransitions)
      return
    }
    
    const statusLabels = validStatuses.map(s => 
      LEGAL_STATUSES.find(ls => ls.key === s)?.label || s
    )
    announcer.announce(DRAG_DROP_MESSAGES.keyboardHelp(case_.title, statusLabels))
  }

  const moveToNextValidStatus = async (case_: Case) => {
    const validStatuses = validator.getValidTransitions(case_.status)
    if (validStatuses.length > 0) {
      await casesStore.updateCaseStatus(case_.id, validStatuses[0])
    }
  }

  const moveToPreviousValidStatus = async (case_: Case) => {
    // 逆方向の遷移ロジック（業務ルールに依存）
    const reverseMappings: Record<CaseStatus, CaseStatus[]> = {
      accepted: ['new'],
      investigation: ['accepted'],
      preparation: ['investigation'],
      negotiation: ['investigation', 'preparation'],
      trial: ['preparation', 'negotiation'],
      completed: ['negotiation', 'trial'],
      new: []
    }
    
    const previousStatuses = reverseMappings[case_.status] || []
    if (previousStatuses.length > 0) {
      await casesStore.updateCaseStatus(case_.id, previousStatuses[0])
    }
  }

  return {
    dragState,
    onDragStart,
    onDragEnter, 
    onDragLeave,
    onDrop,
    onDragEnd,
    onKeyboardNavigation,
    validator,
    resetDragState
  }
}
```

#### 包括的テスト戦略

```typescript
// tests/drag-drop-handlers.test.ts
describe('createDragStartHandler', () => {
  it('should handle drag start correctly', () => {
    const mockOnDragStart = vi.fn()
    const mockOnVisualEffect = vi.fn()
    const mockOnAnnounce = vi.fn()
    
    const handler = createDragStartHandler(
      mockOnDragStart,
      mockOnVisualEffect,
      mockOnAnnounce
    )
    
    const mockEvent = {
      dataTransfer: {
        effectAllowed: '',
        setData: vi.fn()
      },
      target: document.createElement('div')
    } as unknown as DragEvent
    
    const mockCase = createMockCase({ id: 'case-1', title: 'テスト案件' })
    
    handler(mockEvent, mockCase)
    
    expect(mockOnDragStart).toHaveBeenCalledWith('case-1', 'case')
    expect(mockOnVisualEffect).toHaveBeenCalled()
    expect(mockOnAnnounce).toHaveBeenCalledWith(
      DRAG_DROP_MESSAGES.dragStart('テスト案件')
    )
  })
  
  it('should handle missing dataTransfer gracefully', () => {
    const mockOnDragStart = vi.fn()
    const mockOnVisualEffect = vi.fn()
    const mockOnAnnounce = vi.fn()
    
    const handler = createDragStartHandler(
      mockOnDragStart,
      mockOnVisualEffect,
      mockOnAnnounce
    )
    
    const mockEvent = {
      dataTransfer: null,
      target: document.createElement('div')
    } as unknown as DragEvent
    
    const mockCase = createMockCase()
    
    handler(mockEvent, mockCase)
    
    expect(mockOnDragStart).not.toHaveBeenCalled()
    expect(mockOnVisualEffect).not.toHaveBeenCalled()
    expect(mockOnAnnounce).not.toHaveBeenCalled()
  })
})

describe('createDropHandler', () => {
  it('should handle valid drop correctly', async () => {
    const mockValidator = {
      isValidTransition: vi.fn().mockReturnValue(true)
    }
    const mockUpdateCase = vi.fn().mockResolvedValue({ success: true })
    const mockOnSuccess = vi.fn()
    const mockOnError = vi.fn()
    
    const handler = createDropHandler(
      mockValidator,
      mockUpdateCase,
      mockOnSuccess,
      mockOnError
    )
    
    const mockEvent = { preventDefault: vi.fn() } as unknown as DragEvent
    const mockCase = createMockCase({ status: 'new', title: 'テスト案件' })
    
    const result = await handler(mockEvent, 'accepted', mockCase)
    
    expect(result.success).toBe(true)
    expect(mockUpdateCase).toHaveBeenCalledWith('mock-case-id', 'accepted')
    expect(mockOnSuccess).toHaveBeenCalled()
    expect(mockOnError).not.toHaveBeenCalled()
  })
  
  it('should handle invalid transition', async () => {
    const mockValidator = {
      isValidTransition: vi.fn().mockReturnValue(false)
    }
    const mockUpdateCase = vi.fn()
    const mockOnSuccess = vi.fn()
    const mockOnError = vi.fn()
    
    const handler = createDropHandler(
      mockValidator,
      mockUpdateCase,
      mockOnSuccess,
      mockOnError
    )
    
    const mockEvent = { preventDefault: vi.fn() } as unknown as DragEvent
    const mockCase = createMockCase({ status: 'completed' })
    
    const result = await handler(mockEvent, 'new', mockCase)
    
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('INVALID_TRANSITION')
    expect(mockUpdateCase).not.toHaveBeenCalled()
    expect(mockOnError).toHaveBeenCalled()
  })
  
  it('should handle missing case', async () => {
    const mockValidator = { isValidTransition: vi.fn() }
    const mockUpdateCase = vi.fn()
    const mockOnSuccess = vi.fn()
    const mockOnError = vi.fn()
    
    const handler = createDropHandler(
      mockValidator,
      mockUpdateCase,
      mockOnSuccess,
      mockOnError
    )
    
    const mockEvent = { preventDefault: vi.fn() } as unknown as DragEvent
    
    const result = await handler(mockEvent, 'accepted', null)
    
    expect(result.success).toBe(false)
    expect(result.error?.code).toBe('VALIDATION_FAILED')
    expect(mockOnError).toHaveBeenCalled()
  })
})

// tests/drag-visual-effects.test.ts
describe('useDragVisualEffects', () => {
  beforeEach(() => {
    document.body.innerHTML = ''
  })
  
  it('should apply drag style correctly', () => {
    const { applyDragStyle } = useDragVisualEffects()
    const element = document.createElement('div')
    
    applyDragStyle(element)
    
    expect(element.classList.contains(DRAG_DROP_STYLES.dragging)).toBe(true)
  })
  
  it('should remove drag style correctly', () => {
    const { applyDragStyle, removeDragStyle } = useDragVisualEffects()
    const element = document.createElement('div')
    
    applyDragStyle(element)
    removeDragStyle(element)
    
    expect(element.classList.contains(DRAG_DROP_STYLES.dragging)).toBe(false)
  })
  
  it('should apply drop zone style correctly', () => {
    const { applyDropZoneStyle } = useDragVisualEffects()
    const container = document.createElement('div')
    const dropZone = document.createElement('div')
    dropZone.className = DRAG_DROP_STYLES.dropZone
    container.appendChild(dropZone)
    
    applyDropZoneStyle(container, true)
    
    expect(dropZone.classList.contains(DRAG_DROP_STYLES.validDrop)).toBe(true)
    expect(dropZone.classList.contains(DRAG_DROP_STYLES.invalidDrop)).toBe(false)
    
    applyDropZoneStyle(container, false)
    
    expect(dropZone.classList.contains(DRAG_DROP_STYLES.validDrop)).toBe(false)
    expect(dropZone.classList.contains(DRAG_DROP_STYLES.invalidDrop)).toBe(true)
  })
})

// tests/status-validation.test.ts
describe('createStatusValidator', () => {
  const testRules = {
    new: ['accepted'],
    accepted: ['investigation'],
    investigation: ['preparation'],
    preparation: ['completed'],
    completed: []
  } as const
  
  const validator = createStatusValidator(testRules)
  
  it('should validate transitions correctly', () => {
    expect(validator.isValidTransition('new', 'accepted')).toBe(true)
    expect(validator.isValidTransition('new', 'investigation')).toBe(false)
    expect(validator.isValidTransition('completed', 'new')).toBe(false)
  })
  
  it('should get valid transitions', () => {
    expect(validator.getValidTransitions('new')).toEqual(['accepted'])
    expect(validator.getValidTransitions('completed')).toEqual([])
  })
  
  it('should find transition path', () => {
    expect(validator.getTransitionPath('new', 'completed')).toEqual([
      'new', 'accepted', 'investigation', 'preparation', 'completed'
    ])
    expect(validator.getTransitionPath('completed', 'new')).toBe(null)
    expect(validator.getTransitionPath('new', 'new')).toEqual(['new'])
  })
})

// tests/case-drag-drop.test.ts
describe('useCaseDragDrop', () => {
  beforeEach(() => {
    setActivePinia(createPinia())
  })
  
  it('should integrate all components correctly', () => {
    const mockVisualEffects = {
      applyDragStyle: vi.fn(),
      removeDragStyle: vi.fn(),
      applyDropZoneStyle: vi.fn(),
      clearDropZoneStyles: vi.fn(),
      clearAllDropZoneStyles: vi.fn()
    }
    
    const mockAnnouncer = {
      announce: vi.fn()
    }
    
    const mockValidator = {
      isValidTransition: vi.fn().mockReturnValue(true),
      getValidTransitions: vi.fn().mockReturnValue(['accepted'])
    }
    
    const { onDragStart } = useCaseDragDrop({
      visualEffects: mockVisualEffects,
      announcer: mockAnnouncer,
      statusValidator: mockValidator
    })
    
    const mockEvent = {
      dataTransfer: {
        effectAllowed: '',
        setData: vi.fn()
      },
      target: document.createElement('div')
    } as unknown as DragEvent
    
    const mockCase = createMockCase()
    
    onDragStart(mockEvent, mockCase)
    
    expect(mockVisualEffects.applyDragStyle).toHaveBeenCalled()
    expect(mockAnnouncer.announce).toHaveBeenCalled()
  })
  
  it('should handle drag enter correctly', () => {
    const mockVisualEffects = {
      applyDragStyle: vi.fn(),
      removeDragStyle: vi.fn(),
      applyDropZoneStyle: vi.fn(),
      clearDropZoneStyles: vi.fn(),
      clearAllDropZoneStyles: vi.fn()
    }
    
    const mockAnnouncer = {
      announce: vi.fn()
    }
    
    const mockValidator = {
      isValidTransition: vi.fn().mockReturnValue(true)
    }
    
    const { onDragEnter, dragState, onDragStart } = useCaseDragDrop({
      visualEffects: mockVisualEffects,
      announcer: mockAnnouncer,
      statusValidator: mockValidator
    })
    
    // ドラッグ開始をシミュレート
    const mockCase = createMockCase({ id: 'case-1' })
    const casesStore = useCasesStore()
    casesStore.cases = [mockCase]
    
    // ドラッグ状態を設定
    dragState.isDragging = true
    dragState.draggedItemId = 'case-1'
    
    const mockEvent = {
      preventDefault: vi.fn(),
      currentTarget: document.createElement('div')
    } as unknown as DragEvent
    
    onDragEnter(mockEvent, 'accepted')
    
    expect(mockEvent.preventDefault).toHaveBeenCalled()
    expect(mockValidator.isValidTransition).toHaveBeenCalledWith('new', 'accepted')
    expect(mockVisualEffects.applyDropZoneStyle).toHaveBeenCalled()
    expect(mockAnnouncer.announce).toHaveBeenCalled()
  })
})
```

この改善されたドラッグ&ドロップシステム設計により、以下の品質要件を満たします：

- **✅ モダン**: Composition API + 純粋関数 + 依存注入 + 型安全インターフェース
- **✅ メンテナンス性**: 完全な責任分離 + 設定外部化 + 明確な境界定義
- **✅ Simple over Easy**: 単一責任composables + 純粋関数ハンドラー + シンプルなイベント処理
- **✅ テスト容易性**: 依存注入 + 純粋関数 + モック可能な設計 + 包括的テストカバレッジ
- **✅ 型安全**: 完全なTypeScript + DOM型チェック + エラー型定義 + 設定型安全性

## Files to Create/Modify

- `pages/cases/kanban.vue` - Main kanban board page
- `components/cases/CaseCard.vue` - Individual case card
- `components/cases/TagFilter.vue` - Tag filtering component
- `components/ui/Tag.vue` - Tag display component
- `composables/useCaseDragDrop.ts` - Drag and drop logic
- `stores/cases.ts` - Case state management
- `types/case.ts` - Case TypeScript definitions

## Related Tasks

- T01_S01_Nuxt3_Project_Foundation (dependency)
- T02_S01_Authentication_System_UI (dependency)
- T03_S01_Basic_Layout_System (dependency)
- T05_S01_Case_Detail_Management
- T06_S01_Client_Management_System

---

**Note**: This kanban board serves as the primary interface for case management. Ensure comprehensive testing of drag-and-drop functionality across all devices and Japanese legal workflow validation before proceeding to other components.