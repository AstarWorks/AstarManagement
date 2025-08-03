# 状態管理設計（Pinia）

## 概要

Astar Management システムのグローバル状態管理設計。Piniaを使用し、TypeScript完全対応、永続化、リアクティブな状態管理を実装します。

## 設計原則

1. **Single Source of Truth**: 各データは1つのストアで管理
2. **責務の分離**: ドメインごとにストアを分割
3. **TypeScript First**: 型安全性を重視
4. **永続化対応**: 必要なデータはlocalStorageに保存
5. **楽観的更新**: UXを優先し、API通信は非同期で処理

## ストア構成

```
stores/
├── auth.ts          # 認証・ユーザー情報
├── ui.ts            # UI状態（サイドバー、モーダル、テーマ）
├── cases.ts         # 案件データ
├── clients.ts       # クライアントデータ
├── tags.ts          # タグ・カテゴリー
├── documents.ts     # 書類データ
├── expenses.ts      # 経費・報酬データ
├── accounting.ts    # 会計データ
├── dashboard.ts     # ダッシュボード設定
├── notifications.ts # 通知
└── search.ts        # 検索履歴・設定
```

## 1. 認証ストア（auth.ts）

```typescript
// stores/auth.ts
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { User, Permission } from '~/types/auth'

interface AuthState {
  user: User | null
  accessToken: string | null
  refreshToken: string | null
  permissions: Permission[]
  isAuthenticated: boolean
  lastActivity: Date | null
}

export const useAuthStore = defineStore('auth', {
  state: (): AuthState => ({
    user: null,
    accessToken: useStorage('access_token', null),
    refreshToken: useStorage('refresh_token', null),
    permissions: [],
    isAuthenticated: false,
    lastActivity: null
  }),

  getters: {
    // 権限チェック
    hasPermission: (state) => (permission: string) => {
      return state.permissions.some(p => 
        p.resource === permission.split('.')[0] && 
        p.action === permission.split('.')[1]
      )
    },
    
    // ロールチェック
    hasRole: (state) => (role: string) => {
      return state.user?.roles?.includes(role) ?? false
    },
    
    // タイムアウトチェック
    isSessionExpired: (state) => {
      if (!state.lastActivity) return false
      const timeout = 30 * 60 * 1000 // 30分
      return Date.now() - state.lastActivity.getTime() > timeout
    }
  },

  actions: {
    async login(email: string, password: string) {
      try {
        const { data } = await $fetch('/api/v1/sessions', {
          method: 'POST',
          body: { email, password }
        })
        
        this.accessToken = data.accessToken
        this.refreshToken = data.refreshToken
        this.user = data.user
        this.permissions = data.permissions
        this.isAuthenticated = true
        this.updateActivity()
        
        // WebSocket接続開始
        const { connect } = useWebSocket()
        connect()
        
        return { success: true }
      } catch (error) {
        return { 
          success: false, 
          error: error.data?.message || 'ログインに失敗しました' 
        }
      }
    },
    
    async logout() {
      try {
        await $fetch('/api/v1/sessions', { method: 'DELETE' })
      } finally {
        this.$reset()
        // WebSocket切断
        const { disconnect } = useWebSocket()
        disconnect()
        navigateTo('/login')
      }
    },
    
    updateActivity() {
      this.lastActivity = new Date()
    },
    
    async refreshAccessToken() {
      try {
        const { data } = await $fetch('/api/v1/sessions/refresh', {
          method: 'POST',
          body: { refreshToken: this.refreshToken }
        })
        this.accessToken = data.accessToken
        return true
      } catch {
        await this.logout()
        return false
      }
    }
  }
})
```

## 2. UIストア（ui.ts）

```typescript
// stores/ui.ts
import { defineStore } from 'pinia'
import { useStorage, usePreferredColorScheme } from '@vueuse/core'

interface UIState {
  sidebarOpen: boolean
  sidebarCollapsed: boolean
  theme: 'light' | 'dark' | 'system'
  locale: 'ja' | 'en'
  loading: Record<string, boolean>
  modals: Record<string, boolean>
  toasts: Toast[]
}

interface Toast {
  id: string
  title: string
  description?: string
  type: 'info' | 'success' | 'warning' | 'error'
  duration?: number
}

export const useUIStore = defineStore('ui', {
  state: (): UIState => ({
    sidebarOpen: useStorage('sidebar_open', true),
    sidebarCollapsed: useStorage('sidebar_collapsed', false),
    theme: useStorage('theme', 'system'),
    locale: useStorage('locale', 'ja'),
    loading: {},
    modals: {},
    toasts: []
  }),

  getters: {
    // 実際のテーマ
    actualTheme: (state) => {
      if (state.theme === 'system') {
        const preferred = usePreferredColorScheme()
        return preferred.value === 'dark' ? 'dark' : 'light'
      }
      return state.theme
    },
    
    // ローディング状態
    isLoading: (state) => (key: string) => {
      return state.loading[key] ?? false
    },
    
    // モーダル状態
    isModalOpen: (state) => (key: string) => {
      return state.modals[key] ?? false
    }
  },

  actions: {
    toggleSidebar() {
      this.sidebarOpen = !this.sidebarOpen
    },
    
    toggleSidebarCollapse() {
      this.sidebarCollapsed = !this.sidebarCollapsed
    },
    
    setTheme(theme: 'light' | 'dark' | 'system') {
      this.theme = theme
      // HTML要素にクラスを適用
      if (process.client) {
        const html = document.documentElement
        html.classList.remove('light', 'dark')
        html.classList.add(this.actualTheme)
      }
    },
    
    setLocale(locale: 'ja' | 'en') {
      this.locale = locale
      const { $i18n } = useNuxtApp()
      $i18n.setLocale(locale)
    },
    
    setLoading(key: string, value: boolean) {
      this.loading[key] = value
    },
    
    openModal(key: string) {
      this.modals[key] = true
    },
    
    closeModal(key: string) {
      this.modals[key] = false
    },
    
    showToast(toast: Omit<Toast, 'id'>) {
      const id = Math.random().toString(36).substring(7)
      this.toasts.push({ ...toast, id })
      
      // 自動削除
      if (toast.duration !== 0) {
        setTimeout(() => {
          this.removeToast(id)
        }, toast.duration ?? 5000)
      }
    },
    
    removeToast(id: string) {
      const index = this.toasts.findIndex(t => t.id === id)
      if (index > -1) {
        this.toasts.splice(index, 1)
      }
    }
  }
})
```

## 3. 案件ストア（cases.ts）

```typescript
// stores/cases.ts
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { Case, CaseFilter, CaseStatus } from '~/types/case'

interface CasesState {
  cases: Case[]
  selectedCase: Case | null
  filters: CaseFilter
  viewMode: 'table' | 'card' | 'kanban'
  kanbanGroupBy: 'status' | 'assignee' | 'priority'
  isLoading: boolean
  lastFetch: Date | null
}

export const useCasesStore = defineStore('cases', {
  state: (): CasesState => ({
    cases: [],
    selectedCase: null,
    filters: useStorage('case_filters', {
      search: '',
      status: [],
      tags: [],
      assignee: null,
      clientId: null,
      dateFrom: null,
      dateTo: null,
      mode: 'and' as 'and' | 'or'
    }),
    viewMode: useStorage('case_view_mode', 'table'),
    kanbanGroupBy: useStorage('kanban_group_by', 'status'),
    isLoading: false,
    lastFetch: null
  }),

  getters: {
    // フィルタリングされた案件
    filteredCases: (state) => {
      let result = state.cases
      
      // 検索フィルター
      if (state.filters.search) {
        const search = state.filters.search.toLowerCase()
        result = result.filter(c => 
          c.title.toLowerCase().includes(search) ||
          c.caseNumber.includes(search) ||
          c.clientName.toLowerCase().includes(search)
        )
      }
      
      // タグフィルター
      if (state.filters.tags.length > 0) {
        const tagIds = state.filters.tags.map(t => t.id)
        result = result.filter(c => {
          const caseTags = c.tags.map(t => t.id)
          if (state.filters.mode === 'and') {
            return tagIds.every(id => caseTags.includes(id))
          } else {
            return tagIds.some(id => caseTags.includes(id))
          }
        })
      }
      
      // その他のフィルター
      if (state.filters.assignee) {
        result = result.filter(c => 
          c.assignees.some(a => a.id === state.filters.assignee)
        )
      }
      
      if (state.filters.clientId) {
        result = result.filter(c => c.clientId === state.filters.clientId)
      }
      
      if (state.filters.dateFrom) {
        result = result.filter(c => 
          new Date(c.createdAt) >= new Date(state.filters.dateFrom!)
        )
      }
      
      if (state.filters.dateTo) {
        result = result.filter(c => 
          new Date(c.createdAt) <= new Date(state.filters.dateTo!)
        )
      }
      
      return result
    },
    
    // Kanban用グループ化
    kanbanGroups: (state, getters) => {
      const cases = getters.filteredCases
      const groups = new Map<string, Case[]>()
      
      cases.forEach(c => {
        let key: string
        switch (state.kanbanGroupBy) {
          case 'status':
            key = c.status
            break
          case 'assignee':
            key = c.assignees[0]?.name || '未割当'
            break
          case 'priority':
            key = c.priority || '通常'
            break
        }
        
        if (!groups.has(key)) {
          groups.set(key, [])
        }
        groups.get(key)!.push(c)
      })
      
      return groups
    },
    
    // 統計情報
    statistics: (state) => {
      const total = state.cases.length
      const byStatus = state.cases.reduce((acc, c) => {
        acc[c.status] = (acc[c.status] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      return { total, byStatus }
    }
  },

  actions: {
    async fetchCases(force = false) {
      // キャッシュチェック（5分）
      if (!force && this.lastFetch && 
          Date.now() - this.lastFetch.getTime() < 5 * 60 * 1000) {
        return
      }
      
      this.isLoading = true
      try {
        const { data } = await $fetch('/api/v1/cases', {
          params: {
            page: 1,
            perPage: 1000 // 一旦全件取得
          }
        })
        this.cases = data
        this.lastFetch = new Date()
      } finally {
        this.isLoading = false
      }
    },
    
    async createCase(caseData: Partial<Case>) {
      const { data } = await $fetch('/api/v1/cases', {
        method: 'POST',
        body: caseData
      })
      
      // 楽観的更新
      this.cases.unshift(data)
      
      return data
    },
    
    async updateCase(id: string, updates: Partial<Case>) {
      // 楽観的更新
      const index = this.cases.findIndex(c => c.id === id)
      if (index > -1) {
        const oldCase = this.cases[index]
        this.cases[index] = { ...oldCase, ...updates }
        
        try {
          const { data } = await $fetch(`/api/v1/cases/${id}`, {
            method: 'PATCH',
            body: updates
          })
          this.cases[index] = data
        } catch (error) {
          // ロールバック
          this.cases[index] = oldCase
          throw error
        }
      }
    },
    
    async updateCaseStatus(id: string, status: CaseStatus) {
      await this.updateCase(id, { status })
    },
    
    async deleteCase(id: string) {
      const index = this.cases.findIndex(c => c.id === id)
      if (index > -1) {
        const oldCase = this.cases[index]
        this.cases.splice(index, 1)
        
        try {
          await $fetch(`/api/v1/cases/${id}`, { method: 'DELETE' })
        } catch (error) {
          // ロールバック
          this.cases.splice(index, 0, oldCase)
          throw error
        }
      }
    },
    
    selectCase(caseId: string | null) {
      this.selectedCase = caseId 
        ? this.cases.find(c => c.id === caseId) || null
        : null
    },
    
    updateFilters(filters: Partial<CaseFilter>) {
      this.filters = { ...this.filters, ...filters }
    },
    
    setViewMode(mode: 'table' | 'card' | 'kanban') {
      this.viewMode = mode
    },
    
    setKanbanGroupBy(groupBy: 'status' | 'assignee' | 'priority') {
      this.kanbanGroupBy = groupBy
    }
  }
})
```

## 4. タグストア（tags.ts）

```typescript
// stores/tags.ts
import { defineStore } from 'pinia'
import type { Tag, TagCategory } from '~/types/tag'

interface TagsState {
  categories: TagCategory[]
  tags: Tag[]
  isLoading: boolean
}

export const useTagsStore = defineStore('tags', {
  state: (): TagsState => ({
    categories: [],
    tags: [],
    isLoading: false
  }),

  getters: {
    // カテゴリー別タグ
    tagsByCategory: (state) => {
      return state.categories.map(category => ({
        ...category,
        tags: state.tags.filter(tag => tag.categoryId === category.id)
      }))
    },
    
    // タグIDマップ（高速検索用）
    tagMap: (state) => {
      return new Map(state.tags.map(tag => [tag.id, tag]))
    },
    
    // よく使うタグ
    frequentTags: (state) => {
      return [...state.tags]
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 10)
    },
    
    // システムタグ（ステータスなど）
    systemTags: (state) => {
      return state.tags.filter(tag => {
        const category = state.categories.find(c => c.id === tag.categoryId)
        return category?.isSystem
      })
    }
  },

  actions: {
    async fetchTags() {
      if (this.tags.length > 0) return // キャッシュ済み
      
      this.isLoading = true
      try {
        const [categoriesRes, tagsRes] = await Promise.all([
          $fetch('/api/v1/tag-categories'),
          $fetch('/api/v1/tags')
        ])
        
        this.categories = categoriesRes.data
        this.tags = tagsRes.data
      } finally {
        this.isLoading = false
      }
    },
    
    async createTag(categoryId: string, tagData: Partial<Tag>) {
      const { data } = await $fetch('/api/v1/tags', {
        method: 'POST',
        body: { ...tagData, categoryId }
      })
      
      this.tags.push(data)
      return data
    },
    
    async updateTag(id: string, updates: Partial<Tag>) {
      const { data } = await $fetch(`/api/v1/tags/${id}`, {
        method: 'PATCH',
        body: updates
      })
      
      const index = this.tags.findIndex(t => t.id === id)
      if (index > -1) {
        this.tags[index] = data
      }
      
      return data
    },
    
    async deleteTag(id: string) {
      await $fetch(`/api/v1/tags/${id}`, { method: 'DELETE' })
      const index = this.tags.findIndex(t => t.id === id)
      if (index > -1) {
        this.tags.splice(index, 1)
      }
    },
    
    async createCategory(categoryData: Partial<TagCategory>) {
      const { data } = await $fetch('/api/v1/tag-categories', {
        method: 'POST',
        body: categoryData
      })
      
      this.categories.push(data)
      return data
    },
    
    async updateCategoryOrder(categoryId: string, newOrder: number) {
      await $fetch(`/api/v1/tag-categories/${categoryId}/order`, {
        method: 'PATCH',
        body: { order: newOrder }
      })
      
      // ローカル更新
      const category = this.categories.find(c => c.id === categoryId)
      if (category) {
        category.displayOrder = newOrder
        this.categories.sort((a, b) => a.displayOrder - b.displayOrder)
      }
    }
  }
})
```

## 5. 経費ストア（expenses.ts）

```typescript
// stores/expenses.ts
import { defineStore } from 'pinia'
import { useStorage } from '@vueuse/core'
import type { Expense, ExpenseTemplate } from '~/types/expense'

interface ExpensesState {
  expenses: Expense[]
  templates: ExpenseTemplate[]
  quickInputMode: boolean
  currentMonth: string
  filters: {
    type: 'all' | 'office' | 'personal' | 'case'
    caseId?: string
    lawyerId?: string
    dateFrom?: string
    dateTo?: string
  }
}

export const useExpensesStore = defineStore('expenses', {
  state: (): ExpensesState => ({
    expenses: [],
    templates: [],
    quickInputMode: useStorage('expense_quick_mode', true),
    currentMonth: new Date().toISOString().slice(0, 7),
    filters: {
      type: 'all'
    }
  }),

  getters: {
    // フィルタリングされた経費
    filteredExpenses: (state) => {
      let result = state.expenses
      
      if (state.filters.type !== 'all') {
        result = result.filter(e => e.expenseType === state.filters.type)
      }
      
      if (state.filters.caseId) {
        result = result.filter(e => e.caseId === state.filters.caseId)
      }
      
      if (state.filters.lawyerId) {
        result = result.filter(e => e.lawyerId === state.filters.lawyerId)
      }
      
      if (state.filters.dateFrom) {
        result = result.filter(e => e.date >= state.filters.dateFrom!)
      }
      
      if (state.filters.dateTo) {
        result = result.filter(e => e.date <= state.filters.dateTo!)
      }
      
      return result
    },
    
    // 月別集計
    monthlyTotal: (state, getters) => {
      const expenses = getters.filteredExpenses.filter(e => 
        e.date.startsWith(state.currentMonth)
      )
      
      return expenses.reduce((sum, e) => sum + e.amount, 0)
    },
    
    // カテゴリー別集計
    byCategory: (state, getters) => {
      const expenses = getters.filteredExpenses
      const result: Record<string, number> = {}
      
      expenses.forEach(e => {
        result[e.accountCode] = (result[e.accountCode] || 0) + e.amount
      })
      
      return result
    },
    
    // よく使うテンプレート
    frequentTemplates: (state) => {
      return [...state.templates]
        .sort((a, b) => b.usageCount - a.usageCount)
        .slice(0, 6)
    }
  },

  actions: {
    async fetchExpenses(month?: string) {
      const targetMonth = month || this.currentMonth
      
      const { data } = await $fetch('/api/v1/expenses', {
        params: {
          dateFrom: `${targetMonth}-01`,
          dateTo: `${targetMonth}-31`
        }
      })
      
      this.expenses = data
    },
    
    async fetchTemplates() {
      const { data } = await $fetch('/api/v1/expense-templates')
      this.templates = data
    },
    
    async createExpense(expenseData: Partial<Expense>) {
      const { data } = await $fetch('/api/v1/expenses', {
        method: 'POST',
        body: expenseData
      })
      
      this.expenses.unshift(data)
      
      // 今月のデータなら通知
      if (data.date.startsWith(this.currentMonth)) {
        const { showToast } = useUIStore()
        showToast({
          type: 'success',
          title: '経費を記録しました',
          description: `${data.description} ¥${data.amount.toLocaleString()}`
        })
      }
      
      return data
    },
    
    async createFromTemplate(templateId: string, overrides: Partial<Expense> = {}) {
      const template = this.templates.find(t => t.id === templateId)
      if (!template) throw new Error('テンプレートが見つかりません')
      
      const expenseData = {
        amount: template.amount,
        accountCode: template.accountCode,
        description: template.description,
        ...overrides
      }
      
      // テンプレート使用回数を更新
      template.usageCount++
      template.lastUsedAt = new Date().toISOString()
      
      return await this.createExpense(expenseData)
    },
    
    async uploadReceipt(expenseId: string, file: File) {
      const formData = new FormData()
      formData.append('file', file)
      
      const { data } = await $fetch(`/api/v1/expenses/${expenseId}/receipt`, {
        method: 'POST',
        body: formData
      })
      
      // ローカル更新
      const expense = this.expenses.find(e => e.id === expenseId)
      if (expense) {
        expense.receiptUrl = data.receiptUrl
      }
      
      return data
    },
    
    setCurrentMonth(month: string) {
      this.currentMonth = month
      this.fetchExpenses(month)
    },
    
    toggleQuickInputMode() {
      this.quickInputMode = !this.quickInputMode
    }
  }
})
```

## 6. 会計ストア（accounting.ts）

```typescript
// stores/accounting.ts
import { defineStore } from 'pinia'
import type { Deposit, Receivable, MonthlyReport } from '~/types/accounting'

interface AccountingState {
  deposits: Deposit[]
  receivables: Receivable[]
  monthlyReport: MonthlyReport | null
  selectedMonth: string
  alerts: AccountingAlert[]
}

interface AccountingAlert {
  id: string
  type: 'negative_deposit' | 'overdue_receivable' | 'low_balance'
  severity: 'high' | 'medium' | 'low'
  message: string
  data: any
}

export const useAccountingStore = defineStore('accounting', {
  state: (): AccountingState => ({
    deposits: [],
    receivables: [],
    monthlyReport: null,
    selectedMonth: new Date().toISOString().slice(0, 7),
    alerts: []
  }),

  getters: {
    // 預り金残高サマリー
    depositSummary: (state) => {
      const summary = new Map<string, {
        caseId: string
        caseNumber: string
        balance: number
        isNegative: boolean
      }>()
      
      state.deposits.forEach(d => {
        const current = summary.get(d.caseId) || {
          caseId: d.caseId,
          caseNumber: d.caseNumber,
          balance: 0,
          isNegative: false
        }
        
        current.balance = d.balance // 最新の残高を使用
        current.isNegative = d.balance < 0
        summary.set(d.caseId, current)
      })
      
      return Array.from(summary.values())
    },
    
    // マイナス残高の案件
    negativeBalanceCases: (state, getters) => {
      return getters.depositSummary.filter(d => d.isNegative)
    },
    
    // 未回収売掛金
    overdueReceivables: (state) => {
      const today = new Date()
      return state.receivables.filter(r => 
        r.status !== 'paid' && new Date(r.dueDate) < today
      )
    },
    
    // 回収率
    collectionRate: (state) => {
      const total = state.receivables.reduce((sum, r) => sum + r.totalAmount, 0)
      const paid = state.receivables
        .filter(r => r.status === 'paid')
        .reduce((sum, r) => sum + r.totalAmount, 0)
      
      return total > 0 ? (paid / total) * 100 : 0
    }
  },

  actions: {
    async fetchDeposits(caseId?: string) {
      const params = caseId ? { caseId } : {}
      const { data } = await $fetch('/api/v1/deposits', { params })
      this.deposits = data
      
      // アラートチェック
      this.checkDepositAlerts()
    },
    
    async createDeposit(depositData: Partial<Deposit>) {
      const { data } = await $fetch('/api/v1/deposits', {
        method: 'POST',
        body: depositData
      })
      
      this.deposits.push(data)
      
      // 残高チェック
      if (data.balance < 0) {
        this.addAlert({
          type: 'negative_deposit',
          severity: 'high',
          message: `案件 ${data.caseNumber} の預り金残高がマイナスです（¥${data.balance.toLocaleString()}）`,
          data: data
        })
      }
      
      return data
    },
    
    async fetchReceivables() {
      const { data } = await $fetch('/api/v1/receivables')
      this.receivables = data
      
      // 期限切れチェック
      this.checkReceivableAlerts()
    },
    
    async recordPayment(invoiceId: string, paymentData: any) {
      const { data } = await $fetch(`/api/v1/invoices/${invoiceId}/payments`, {
        method: 'POST',
        body: paymentData
      })
      
      // 売掛金ステータス更新
      const receivable = this.receivables.find(r => r.invoiceId === invoiceId)
      if (receivable) {
        receivable.paidAmount += paymentData.amount
        if (receivable.paidAmount >= receivable.totalAmount) {
          receivable.status = 'paid'
        } else {
          receivable.status = 'partial'
        }
      }
      
      return data
    },
    
    async generateMonthlyReport(month?: string) {
      const targetMonth = month || this.selectedMonth
      const [year, monthNum] = targetMonth.split('-')
      
      const { data } = await $fetch('/api/v1/reports/monthly', {
        method: 'POST',
        body: {
          year: parseInt(year),
          month: parseInt(monthNum),
          includeDetails: true
        }
      })
      
      this.monthlyReport = data
      return data
    },
    
    async exportMonthlyReport(format: 'excel' | 'pdf' = 'excel') {
      if (!this.monthlyReport) {
        await this.generateMonthlyReport()
      }
      
      const response = await $fetch(`/api/v1/reports/${this.monthlyReport!.reportId}/download`, {
        responseType: 'blob'
      })
      
      // ダウンロード処理
      const blob = new Blob([response])
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `月次報告書_${this.selectedMonth}.${format === 'excel' ? 'xlsx' : 'pdf'}`
      a.click()
      URL.revokeObjectURL(url)
    },
    
    checkDepositAlerts() {
      this.depositSummary.forEach(summary => {
        if (summary.isNegative) {
          this.addAlert({
            type: 'negative_deposit',
            severity: 'high',
            message: `案件 ${summary.caseNumber} の預り金残高がマイナスです`,
            data: summary
          })
        }
      })
    },
    
    checkReceivableAlerts() {
      const today = new Date()
      this.receivables.forEach(r => {
        if (r.status !== 'paid') {
          const dueDate = new Date(r.dueDate)
          const daysOverdue = Math.floor((today.getTime() - dueDate.getTime()) / (1000 * 60 * 60 * 24))
          
          if (daysOverdue > 30) {
            this.addAlert({
              type: 'overdue_receivable',
              severity: 'high',
              message: `請求書 ${r.invoiceNumber} が30日以上未払いです`,
              data: r
            })
          } else if (daysOverdue > 0) {
            this.addAlert({
              type: 'overdue_receivable',
              severity: 'medium',
              message: `請求書 ${r.invoiceNumber} の支払期限が過ぎています`,
              data: r
            })
          }
        }
      })
    },
    
    addAlert(alert: Omit<AccountingAlert, 'id'>) {
      const id = Math.random().toString(36).substring(7)
      this.alerts.push({ ...alert, id })
    },
    
    dismissAlert(id: string) {
      const index = this.alerts.findIndex(a => a.id === id)
      if (index > -1) {
        this.alerts.splice(index, 1)
      }
    }
  }
})
```

## 7. グローバルコンポーザブル

```typescript
// composables/useStore.ts
export const useStore = () => {
  return {
    auth: useAuthStore(),
    ui: useUIStore(),
    cases: useCasesStore(),
    clients: useClientsStore(),
    tags: useTagsStore(),
    documents: useDocumentsStore(),
    expenses: useExpensesStore(),
    accounting: useAccountingStore(),
    dashboard: useDashboardStore(),
    notifications: useNotificationsStore(),
    search: useSearchStore()
  }
}

// composables/usePermission.ts
export const usePermission = () => {
  const { auth } = useStore()
  
  const can = (permission: string) => {
    return auth.hasPermission(permission)
  }
  
  const cannot = (permission: string) => {
    return !can(permission)
  }
  
  const canAny = (...permissions: string[]) => {
    return permissions.some(p => can(p))
  }
  
  const canAll = (...permissions: string[]) => {
    return permissions.every(p => can(p))
  }
  
  return { can, cannot, canAny, canAll }
}

// composables/useLoading.ts
export const useLoading = (key: string) => {
  const { ui } = useStore()
  
  const isLoading = computed(() => ui.isLoading(key))
  
  const withLoading = async <T>(fn: () => Promise<T>): Promise<T> => {
    ui.setLoading(key, true)
    try {
      return await fn()
    } finally {
      ui.setLoading(key, false)
    }
  }
  
  return { isLoading, withLoading }
}
```

## 8. Piniaプラグイン設定

```typescript
// plugins/pinia.client.ts
import { createPersistedState } from 'pinia-plugin-persistedstate'

export default defineNuxtPlugin(({ $pinia }) => {
  // 永続化プラグイン
  $pinia.use(createPersistedState({
    storage: localStorage,
    beforeRestore: (ctx) => {
      console.log(`Restoring '${ctx.store.$id}'`)
    },
    afterRestore: (ctx) => {
      console.log(`Restored '${ctx.store.$id}'`)
    }
  }))
  
  // 開発環境でのデバッグ
  if (process.dev) {
    $pinia.use(({ store }) => {
      store.$onAction(({
        name,
        args,
        after,
        onError
      }) => {
        console.log(`[${store.$id}] ${name}`, args)
        
        after((result) => {
          console.log(`[${store.$id}] ${name} result:`, result)
        })
        
        onError((error) => {
          console.error(`[${store.$id}] ${name} error:`, error)
        })
      })
    })
  }
})
```

## 9. 型定義

```typescript
// types/store.ts
export interface StoreState {
  auth: ReturnType<typeof useAuthStore>
  ui: ReturnType<typeof useUIStore>
  cases: ReturnType<typeof useCasesStore>
  clients: ReturnType<typeof useClientsStore>
  tags: ReturnType<typeof useTagsStore>
  documents: ReturnType<typeof useDocumentsStore>
  expenses: ReturnType<typeof useExpensesStore>
  accounting: ReturnType<typeof useAccountingStore>
  dashboard: ReturnType<typeof useDashboardStore>
  notifications: ReturnType<typeof useNotificationsStore>
  search: ReturnType<typeof useSearchStore>
}

// アプリケーション全体の状態ツリー
export type AppState = {
  [K in keyof StoreState]: StoreState[K]['$state']
}
```

## まとめ

この状態管理設計により：

1. **型安全性**: TypeScriptによる完全な型サポート
2. **永続化**: 重要なデータはlocalStorageに自動保存
3. **楽観的更新**: UIの応答性を向上
4. **リアクティブ**: Vue3のreactivity systemを活用
5. **開発体験**: デバッグツールとホットリロード対応

各画面コンポーネントはこれらのストアを使用して、一貫性のある状態管理を実現します。