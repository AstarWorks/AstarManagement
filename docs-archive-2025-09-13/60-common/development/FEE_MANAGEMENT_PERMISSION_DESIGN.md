# 報酬管理画面 - パーミッション設計

## パーミッションモデル（Discord/GitHub/Cloudflare方式）

### 1. パーミッション定義

報酬管理機能で必要なパーミッションを定義します。

```typescript
// 経費関連パーミッション
const expensePermissions = {
  // 基本操作
  'expense.create': '経費を作成',
  'expense.read': '経費を閲覧',
  'expense.update': '経費を更新',
  'expense.delete': '経費を削除',
  
  // エクスポート
  'expense.export': '経費データをエクスポート',
  
  // テンプレート管理
  'expense.template.create': 'テンプレートを作成',
  'expense.template.update': 'テンプレートを更新',
  'expense.template.delete': 'テンプレートを削除',
  
  // 勘定科目管理
  'account.create': '勘定科目を作成',
  'account.update': '勘定科目を更新',
  'account.delete': '勘定科目を削除',
  
  // 請求書関連
  'invoice.create': '請求書を作成',
  'invoice.read': '請求書を閲覧',
  'invoice.update': '請求書を更新',
  'invoice.delete': '請求書を削除',
  'invoice.send': '請求書を送信',
  
  // 入金管理
  'payment.create': '入金を記録',
  'payment.read': '入金を閲覧',
  'payment.update': '入金を更新',
  'payment.delete': '入金を削除'
}
```

### 2. スコープ定義

パーミッションに対するスコープ（適用範囲）を定義します。

```typescript
// スコープの種類
type ExpenseScope = 
  | 'own'           // 自分のデータのみ
  | 'case'          // 担当案件のデータ
  | 'office'        // 事務所全体
  | 'all'           // すべて

// 経費種別スコープ
type ExpenseTypeScope = 
  | 'personal'      // 個人経費
  | 'case'          // 案件実費
  | 'office'        // 事務所経費
  | 'all'           // すべての種別

// パーミッションとスコープの組み合わせ例
interface ScopedPermission {
  permission: string
  scope: string
  expenseType?: string
}
```

### 3. デフォルトロール設計

```typescript
// 弁護士ロール
const lawyerRole = {
  name: 'lawyer',
  displayName: '弁護士',
  permissions: [
    // 自分の経費は完全に管理可能
    { permission: 'expense.create', scope: 'own' },
    { permission: 'expense.read', scope: 'own' },
    { permission: 'expense.update', scope: 'own' },
    { permission: 'expense.delete', scope: 'own' },
    
    // 担当案件の経費は閲覧可能
    { permission: 'expense.read', scope: 'case' },
    
    // 事務所経費の作成・管理
    { permission: 'expense.create', scope: 'office', expenseType: 'office' },
    { permission: 'expense.update', scope: 'office', expenseType: 'office' },
    
    // エクスポートは全データ可能
    { permission: 'expense.export', scope: 'all' },
    
    // テンプレート・勘定科目は全員管理可能
    { permission: 'expense.template.*', scope: 'all' },
    { permission: 'account.*', scope: 'all' },
    
    // 請求書・入金管理
    { permission: 'invoice.*', scope: 'case' },
    { permission: 'payment.*', scope: 'case' }
  ]
}

// 事務員ロール
const clerkRole = {
  name: 'clerk',
  displayName: '事務員',
  permissions: [
    // 自分の経費は管理可能
    { permission: 'expense.create', scope: 'own' },
    { permission: 'expense.read', scope: 'own' },
    { permission: 'expense.update', scope: 'own' },
    { permission: 'expense.delete', scope: 'own' },
    
    // 全体の経費を閲覧可能
    { permission: 'expense.read', scope: 'all' },
    
    // エクスポート可能
    { permission: 'expense.export', scope: 'all' },
    
    // テンプレート・勘定科目は全員管理可能
    { permission: 'expense.template.*', scope: 'all' },
    { permission: 'account.*', scope: 'all' },
    
    // 請求書の閲覧・作成補助
    { permission: 'invoice.read', scope: 'all' },
    { permission: 'invoice.create', scope: 'all' },
    
    // 入金記録
    { permission: 'payment.*', scope: 'all' }
  ]
}

// クライアントロール
const clientRole = {
  name: 'client',
  displayName: 'クライアント',
  permissions: [
    // 自分の案件の請求書のみ閲覧
    { permission: 'invoice.read', scope: 'own' }
    // 経費データへのアクセスなし
  ]
}
```

### 4. 権限チェックの実装

```typescript
// composables/useExpensePermission.ts
export const useExpensePermission = () => {
  const { user, permissions } = useAuthStore()
  
  // 経費に対する権限チェック
  const canManageExpense = (expense: Expense, action: 'read' | 'update' | 'delete') => {
    // 自分の経費
    if (expense.createdBy === user.id) {
      return hasPermission(`expense.${action}`, 'own')
    }
    
    // 担当案件の経費
    if (expense.caseId && isAssignedToCase(expense.caseId)) {
      return hasPermission(`expense.${action}`, 'case')
    }
    
    // 事務所経費
    if (expense.expenseType === 'office') {
      return hasPermission(`expense.${action}`, 'office', 'office')
    }
    
    // その他
    return hasPermission(`expense.${action}`, 'all')
  }
  
  // 事務所経費を作成できるか
  const canCreateOfficeExpense = () => {
    return hasPermission('expense.create', 'office', 'office')
  }
  
  // エクスポート権限
  const canExportExpenses = () => {
    return hasPermission('expense.export', 'all')
  }
  
  // パーミッションチェック
  const hasPermission = (permission: string, scope: string, expenseType?: string) => {
    return permissions.some(p => {
      // ワイルドカード対応
      const permissionMatch = p.permission === permission || 
                            p.permission.endsWith('*') && 
                            permission.startsWith(p.permission.slice(0, -1))
      
      const scopeMatch = p.scope === scope || p.scope === 'all'
      const typeMatch = !expenseType || !p.expenseType || 
                       p.expenseType === expenseType || 
                       p.expenseType === 'all'
      
      return permissionMatch && scopeMatch && typeMatch
    })
  }
  
  // 案件担当者チェック
  const isAssignedToCase = (caseId: string) => {
    const { cases } = useCasesStore()
    const targetCase = cases.find(c => c.id === caseId)
    return targetCase?.assignees.some(a => a.id === user.id) || false
  }
  
  return {
    canManageExpense,
    canCreateOfficeExpense,
    canExportExpenses,
    hasPermission
  }
}
```

### 5. UIでの権限制御

```vue
<!-- 経費一覧での表示制御 -->
<template>
  <div class="expense-list">
    <ExpenseItem
      v-for="expense in visibleExpenses"
      :key="expense.id"
      :expense="expense"
      :can-edit="canEdit(expense)"
      :can-delete="canDelete(expense)"
      @edit="editExpense"
      @delete="deleteExpense"
    />
  </div>
</template>

<script setup lang="ts">
const { canManageExpense } = useExpensePermission()

// 閲覧可能な経費のみ表示
const visibleExpenses = computed(() => 
  expenses.value.filter(e => canManageExpense(e, 'read'))
)

const canEdit = (expense: Expense) => canManageExpense(expense, 'update')
const canDelete = (expense: Expense) => canManageExpense(expense, 'delete')
</script>
```

```vue
<!-- 経費種別の選択制御 -->
<template>
  <RadioGroup v-model="expenseType">
    <RadioGroupItem value="personal" id="personal">
      <Label for="personal">個人経費</Label>
    </RadioGroupItem>
    <RadioGroupItem value="case" id="case">
      <Label for="case">案件実費</Label>
    </RadioGroupItem>
    <RadioGroupItem 
      value="office" 
      id="office"
      :disabled="!canCreateOfficeExpense"
    >
      <Label for="office">
        事務所経費
        <span v-if="!canCreateOfficeExpense" class="text-muted-foreground">
          （権限がありません）
        </span>
      </Label>
    </RadioGroupItem>
  </RadioGroup>
</template>

<script setup lang="ts">
const { canCreateOfficeExpense } = useExpensePermission()
</script>
```

### 6. APIレベルでの権限チェック

バックエンドでも同様の権限チェックを実装し、二重の保護を行います。

```kotlin
// Spring Security設定例
@PreAuthorize("hasPermission(#expense, 'expense.update')")
fun updateExpense(expense: Expense): Expense {
    // 更新処理
}

// カスタムPermissionEvaluator
class ExpensePermissionEvaluator : PermissionEvaluator {
    override fun hasPermission(
        authentication: Authentication,
        targetDomainObject: Any,
        permission: Any
    ): Boolean {
        if (targetDomainObject is Expense) {
            val user = authentication.principal as User
            val expense = targetDomainObject
            
            // 自分の経費
            if (expense.createdBy == user.id) {
                return hasPermission(user, "$permission:own")
            }
            
            // 担当案件
            if (isAssignedToCase(user, expense.caseId)) {
                return hasPermission(user, "$permission:case")
            }
            
            // その他
            return hasPermission(user, "$permission:all")
        }
        return false
    }
}
```

### 7. 権限エラーハンドリング

```typescript
// エラーメッセージ
const permissionErrors = {
  'expense.create:office': '事務所経費を作成する権限がありません',
  'expense.update:case': 'この案件の経費を編集する権限がありません',
  'expense.delete:own': '経費を削除する権限がありません',
  'expense.export:all': 'データをエクスポートする権限がありません'
}

// エラーハンドリング
const handlePermissionError = (error: any) => {
  if (error.code === 'PERMISSION_DENIED') {
    const message = permissionErrors[error.permission] || 
                   'この操作を実行する権限がありません'
    showToast({
      type: 'error',
      title: '権限エラー',
      description: message
    })
  }
}
```