# i18n実装ガイド

## 1. データベース設計でのi18n対応

### 1.1 権限テーブルの修正
```sql
-- nameカラムをname_keyに変更
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,
  name_key VARCHAR(255) NOT NULL,     -- i18nキー（例: 'permissions.expense.create'）
  description_key TEXT,                -- 説明のi18nキー
  resource VARCHAR(50) NOT NULL,
  action VARCHAR(50) NOT NULL,
  scope VARCHAR(50) DEFAULT 'own',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- ロールテーブルも同様
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),
  code VARCHAR(100) NOT NULL,
  name_key VARCHAR(255) NOT NULL,     -- i18nキー（例: 'roles.admin'）
  description_key TEXT,
  is_system BOOLEAN DEFAULT false,
  is_custom BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  UNIQUE(tenant_id, code)
);

-- システムロールの登録
INSERT INTO roles (code, name_key, is_system, tenant_id) VALUES
('admin', 'roles.admin', true, NULL),
('lawyer', 'roles.lawyer', true, NULL),
('paralegal', 'roles.paralegal', true, NULL),
('member', 'roles.member', true, NULL);
```

### 1.2 科目マスタのi18n対応
```sql
CREATE TABLE expense_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  code VARCHAR(50) NOT NULL,
  name_key VARCHAR(255) NOT NULL,    -- i18nキー
  display_order INTEGER NOT NULL DEFAULT 0,
  is_active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(tenant_id, code)
);

-- デフォルトカテゴリー
INSERT INTO expense_categories (tenant_id, code, name_key, display_order) VALUES
(tenant_id, 'transportation', 'expense.categories.transportation', 1),
(tenant_id, 'stamp_fee', 'expense.categories.stamp_fee', 2),
(tenant_id, 'copy_fee', 'expense.categories.copy_fee', 3),
(tenant_id, 'postage', 'expense.categories.postage', 4),
(tenant_id, 'other', 'expense.categories.other', 99);
```

## 2. フロントエンド（Vue.js）でのi18n

### 2.1 言語ファイル構造
```
locales/
├── ja/
│   ├── common.ts
│   ├── auth.ts
│   ├── expense.ts
│   ├── permissions.ts
│   └── index.ts
└── en/
    ├── common.ts
    ├── auth.ts
    ├── expense.ts
    ├── permissions.ts
    └── index.ts
```

### 2.2 権限の言語ファイル
```typescript
// locales/ja/permissions.ts
export default {
  permissions: {
    expense: {
      create: '実費作成',
      read: '実費閲覧',
      update_own: '実費更新（自分）',
      update_all: '実費更新（全て）',
      delete_own: '実費削除（自分）',
      delete_all: '実費削除（全て）',
      export: '実費エクスポート'
    },
    report: {
      view: 'レポート閲覧',
      create: 'レポート作成'
    },
    user: {
      invite: 'ユーザー招待',
      manage: 'ユーザー管理'
    },
    system: {
      settings: 'システム設定'
    }
  },
  roles: {
    admin: '管理者',
    lawyer: '弁護士',
    paralegal: 'パラリーガル',
    member: 'メンバー'
  }
}

// locales/en/permissions.ts
export default {
  permissions: {
    expense: {
      create: 'Create Expense',
      read: 'View Expenses',
      update_own: 'Update Own Expenses',
      update_all: 'Update All Expenses',
      delete_own: 'Delete Own Expenses',
      delete_all: 'Delete All Expenses',
      export: 'Export Expenses'
    },
    report: {
      view: 'View Reports',
      create: 'Create Reports'
    },
    user: {
      invite: 'Invite Users',
      manage: 'Manage Users'
    },
    system: {
      settings: 'System Settings'
    }
  },
  roles: {
    admin: 'Administrator',
    lawyer: 'Lawyer',
    paralegal: 'Paralegal',
    member: 'Member'
  }
}
```

### 2.3 実費カテゴリーの言語ファイル
```typescript
// locales/ja/expense.ts
export default {
  categories: {
    transportation: '交通費',
    stamp_fee: '印紙代',
    copy_fee: 'コピー代',
    postage: '郵送費',
    other: 'その他'
  },
  fields: {
    date: '日付',
    category: '科目',
    description: '摘要',
    income_amount: '収入金額',
    expense_amount: '支出金額',
    balance: '差引残額',
    case: '案件',
    memo: 'メモ'
  },
  actions: {
    create: '新規作成',
    edit: '編集',
    delete: '削除',
    save: '保存',
    cancel: 'キャンセル',
    export: 'エクスポート',
    import: 'インポート'
  },
  messages: {
    create_success: '実費を登録しました',
    update_success: '実費を更新しました',
    delete_success: '実費を削除しました',
    delete_confirm: 'この実費を削除してもよろしいですか？',
    validation: {
      required: '{field}は必須です',
      invalid_amount: '金額は0以上の数値を入力してください',
      future_date: '未来の日付は入力できません'
    }
  }
}
```

### 2.4 コンポーネントでの使用
```vue
<template>
  <div>
    <!-- ロール表示 -->
    <span>{{ $t(`roles.${user.role}`) }}</span>
    
    <!-- 権限による表示制御 -->
    <button v-if="can.createExpense" @click="create">
      {{ $t('expense.actions.create') }}
    </button>
    
    <!-- カテゴリー選択 -->
    <select v-model="expense.category">
      <option 
        v-for="category in categories" 
        :key="category.code"
        :value="category.code"
      >
        {{ $t(`expense.categories.${category.code}`) }}
      </option>
    </select>
    
    <!-- エラーメッセージ -->
    <span v-if="errors.amount" class="error">
      {{ $t('expense.messages.validation.invalid_amount') }}
    </span>
  </div>
</template>

<script setup lang="ts">
import { useI18n } from 'vue-i18n'

const { t } = useI18n()

// バリデーションメッセージ
const validateAmount = (value: number) => {
  if (value < 0) {
    return t('expense.messages.validation.invalid_amount')
  }
  return true
}

// 成功メッセージ
const handleSave = async () => {
  try {
    await saveExpense()
    toast.success(t('expense.messages.create_success'))
  } catch (error) {
    toast.error(t('common.errors.save_failed'))
  }
}

// 確認ダイアログ
const handleDelete = async () => {
  const confirmed = await confirm(t('expense.messages.delete_confirm'))
  if (confirmed) {
    await deleteExpense()
    toast.success(t('expense.messages.delete_success'))
  }
}
</script>
```

## 3. バックエンド（Kotlin）でのi18n

### 3.1 メッセージソース設定
```kotlin
// application.yml
spring:
  messages:
    basename: messages
    encoding: UTF-8
    fallback-to-system-locale: false
    use-code-as-default-message: false
```

### 3.2 メッセージファイル
```properties
# messages_ja.properties
permissions.expense.create=実費作成
permissions.expense.read=実費閲覧
permissions.expense.update_own=実費更新（自分）
permissions.expense.update_all=実費更新（全て）

roles.admin=管理者
roles.lawyer=弁護士
roles.paralegal=パラリーガル
roles.member=メンバー

expense.categories.transportation=交通費
expense.categories.stamp_fee=印紙代
expense.categories.copy_fee=コピー代
expense.categories.postage=郵送費
expense.categories.other=その他

# バリデーションメッセージ
validation.expense.amount.positive=金額は0以上の数値を入力してください
validation.expense.date.not_future=未来の日付は入力できません
validation.expense.description.required=摘要は必須です

# messages_en.properties
permissions.expense.create=Create Expense
permissions.expense.read=View Expenses
# ... 省略
```

### 3.3 Kotlinでの使用
```kotlin
@RestController
@RequestMapping("/api/expenses")
class ExpenseController(
    private val messageSource: MessageSource,
    private val expenseService: ExpenseService
) {
    @PostMapping
    fun createExpense(
        @Valid @RequestBody dto: CreateExpenseDto,
        locale: Locale
    ): ResponseEntity<ApiResponse> {
        val expense = expenseService.create(dto)
        
        val message = messageSource.getMessage(
            "expense.messages.create_success",
            null,
            locale
        )
        
        return ResponseEntity.ok(
            ApiResponse(
                success = true,
                data = expense,
                message = message
            )
        )
    }
}

// バリデーション
data class CreateExpenseDto(
    @field:NotBlank(message = "{validation.expense.description.required}")
    val description: String,
    
    @field:PositiveOrZero(message = "{validation.expense.amount.positive}")
    val expenseAmount: BigDecimal,
    
    @field:PastOrPresent(message = "{validation.expense.date.not_future}")
    val date: LocalDate
)

// 例外ハンドリング
@RestControllerAdvice
class GlobalExceptionHandler(
    private val messageSource: MessageSource
) {
    @ExceptionHandler(MethodArgumentNotValidException::class)
    fun handleValidationException(
        ex: MethodArgumentNotValidException,
        locale: Locale
    ): ResponseEntity<ApiResponse> {
        val errors = ex.bindingResult.fieldErrors.map { error ->
            FieldError(
                field = error.field,
                message = messageSource.getMessage(error, locale)
            )
        }
        
        return ResponseEntity.badRequest().body(
            ApiResponse(
                success = false,
                errors = errors,
                message = messageSource.getMessage(
                    "common.errors.validation_failed",
                    null,
                    locale
                )
            )
        )
    }
}
```

### 3.4 動的な権限名の取得
```kotlin
@Service
class PermissionService(
    private val jdbcTemplate: JdbcTemplate,
    private val messageSource: MessageSource
) {
    fun getPermissionsWithNames(locale: Locale): List<PermissionDto> {
        val permissions = jdbcTemplate.query(
            "SELECT code, name_key, resource, action, scope FROM permissions"
        ) { rs, _ ->
            Permission(
                code = rs.getString("code"),
                nameKey = rs.getString("name_key"),
                resource = rs.getString("resource"),
                action = rs.getString("action"),
                scope = rs.getString("scope")
            )
        }
        
        return permissions.map { permission ->
            PermissionDto(
                code = permission.code,
                name = messageSource.getMessage(
                    permission.nameKey,
                    null,
                    permission.nameKey, // フォールバック
                    locale
                ),
                resource = permission.resource,
                action = permission.action,
                scope = permission.scope
            )
        }
    }
}
```

## 4. ベストプラクティス

1. **キー命名規則**
   - ドット記法で階層化: `expense.messages.create_success`
   - 機能別にグループ化: `permissions.expense.*`

2. **フォールバック戦略**
   - 翻訳がない場合はキーを表示
   - 英語をデフォルト言語に

3. **動的メッセージ**
   ```typescript
   // パラメータ付きメッセージ
   $t('expense.messages.deleted_count', { count: 5 })
   // "5件の実費を削除しました"
   ```

4. **日付・数値フォーマット**
   ```typescript
   // 日付フォーマット
   $d(new Date(), 'long') // "2024年1月20日"
   
   // 通貨フォーマット
   $n(1500, 'currency') // "¥1,500"
   ```

これで全てのハードコーディングされた文字列をi18n対応にできます！