# 権限管理システム設計書（MVP → エンタープライズ対応）

## 1. 設計思想

### 1.1 段階的な進化
```
MVP: 固定ロール（4種類）
 ↓
Phase 2: カスタムロール作成
 ↓
Phase 3: 細かいパーミッション制御
```

### 1.2 Discord型権限システムの特徴
- **ロール**: パーミッションの集合（プリセット）
- **パーミッション**: 個別の権限（例: expense.create）
- **階層**: 上位権限は下位権限を包含
- **カスタマイズ**: 事務所ごとに独自ロール作成可能

## 2. データベース設計

### 2.1 権限（パーミッション）定義
```sql
-- 権限マスタ（システム共通）
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(100) UNIQUE NOT NULL,  -- 例: 'expense.create'
  name VARCHAR(255) NOT NULL,          -- 例: '実費作成'
  description TEXT,
  resource VARCHAR(50) NOT NULL,       -- 例: 'expense'
  action VARCHAR(50) NOT NULL,         -- 例: 'create'
  scope VARCHAR(50) DEFAULT 'own',     -- own, tenant, all
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 初期データ（MVP用）
-- name_keyはi18nキーを格納
INSERT INTO permissions (code, name_key, resource, action, scope) VALUES
-- 実費管理
('expense.create', 'permissions.expense.create', 'expense', 'create', 'own'),
('expense.read', 'permissions.expense.read', 'expense', 'read', 'tenant'),
('expense.update.own', 'permissions.expense.update_own', 'expense', 'update', 'own'),
('expense.update.all', 'permissions.expense.update_all', 'expense', 'update', 'all'),
('expense.delete.own', 'permissions.expense.delete_own', 'expense', 'delete', 'own'),
('expense.delete.all', 'permissions.expense.delete_all', 'expense', 'delete', 'all'),
('expense.export', 'permissions.expense.export', 'expense', 'export', 'tenant'),

-- レポート
('report.view', 'permissions.report.view', 'report', 'read', 'tenant'),
('report.create', 'permissions.report.create', 'report', 'create', 'tenant'),

-- ユーザー管理
('user.invite', 'permissions.user.invite', 'user', 'create', 'tenant'),
('user.manage', 'permissions.user.manage', 'user', 'manage', 'tenant'),

-- システム管理
('system.settings', 'permissions.system.settings', 'system', 'manage', 'tenant');
```

### 2.2 ロール定義
```sql
-- ロールマスタ
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID REFERENCES tenants(id),  -- NULLならシステムロール
  code VARCHAR(100) NOT NULL,
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,  -- システム定義ロール
  is_custom BOOLEAN DEFAULT false,  -- カスタムロール（Phase 2）
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  
  -- テナントごとにコードはユニーク
  UNIQUE(tenant_id, code)
);

-- システムロール（MVP用）
INSERT INTO roles (code, name, is_system, tenant_id) VALUES
('admin', '管理者', true, NULL),
('lawyer', '弁護士', true, NULL),
('paralegal', 'パラリーガル', true, NULL),
('member', 'メンバー', true, NULL);
```

### 2.3 ロールとパーミッションの紐付け
```sql
-- ロール・パーミッション関連
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  PRIMARY KEY (role_id, permission_id)
);

-- MVP用の権限設定
-- Admin: 全権限
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'admin';

-- Lawyer: 実費とレポート
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'lawyer' 
  AND p.code IN (
    'expense.create', 'expense.read', 'expense.update.own',
    'expense.delete.own', 'expense.export',
    'report.view', 'report.create'
  );

-- Paralegal: 実費入力と閲覧
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'paralegal'
  AND p.code IN (
    'expense.create', 'expense.read', 'expense.update.own',
    'expense.export', 'report.view'
  );

-- Member: 閲覧のみ
INSERT INTO role_permissions (role_id, permission_id)
SELECT r.id, p.id
FROM roles r, permissions p
WHERE r.code = 'member'
  AND p.code IN ('expense.read', 'report.view');
```

### 2.4 ユーザーとロールの紐付け
```sql
-- ユーザー・ロール関連
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,  -- 期限付きロール対応
  PRIMARY KEY (user_id, role_id)
);

-- 将来の拡張用（Phase 3）
CREATE TABLE user_permissions (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  granted BOOLEAN DEFAULT true,  -- false で権限剥奪
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,
  PRIMARY KEY (user_id, permission_id)
);
```

## 3. 権限チェックの実装

### 3.1 SQL関数での権限チェック
```sql
-- ユーザーが特定の権限を持っているかチェック
CREATE OR REPLACE FUNCTION user_has_permission(
  p_user_id UUID,
  p_permission_code VARCHAR(100),
  p_resource_id UUID DEFAULT NULL
) RETURNS BOOLEAN AS $$
DECLARE
  v_has_permission BOOLEAN := false;
  v_scope VARCHAR(50);
  v_resource_owner UUID;
BEGIN
  -- ロールベースの権限チェック
  SELECT EXISTS (
    SELECT 1
    FROM user_roles ur
    JOIN role_permissions rp ON ur.role_id = rp.role_id
    JOIN permissions p ON rp.permission_id = p.id
    WHERE ur.user_id = p_user_id
      AND p.code = p_permission_code
      AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
  ) INTO v_has_permission;

  -- スコープチェック（own の場合）
  IF v_has_permission AND p_resource_id IS NOT NULL THEN
    SELECT scope INTO v_scope
    FROM permissions
    WHERE code = p_permission_code;
    
    IF v_scope = 'own' THEN
      -- リソースの所有者確認（例: expense）
      EXECUTE format('SELECT created_by FROM %I WHERE id = $1', 
        split_part(p_permission_code, '.', 1))
      INTO v_resource_owner
      USING p_resource_id;
      
      v_has_permission := (v_resource_owner = p_user_id);
    END IF;
  END IF;

  RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

### 3.2 Kotlin側での権限チェック
```kotlin
@Component
class PermissionService(
    private val jdbcTemplate: JdbcTemplate
) {
    fun hasPermission(
        userId: UUID,
        permission: String,
        resourceId: UUID? = null
    ): Boolean {
        return jdbcTemplate.queryForObject(
            "SELECT user_has_permission(?, ?, ?)",
            Boolean::class.java,
            userId, permission, resourceId
        )
    }
}

// アノテーションベースの権限チェック
@Target(AnnotationTarget.FUNCTION)
@Retention(AnnotationRetention.RUNTIME)
annotation class RequirePermission(
    val value: String,
    val scope: PermissionScope = PermissionScope.OWN
)

@RestController
@RequestMapping("/api/expenses")
class ExpenseController(
    private val expenseService: ExpenseService
) {
    @PostMapping
    @RequirePermission("expense.create")
    fun createExpense(@RequestBody dto: CreateExpenseDto): Expense {
        return expenseService.create(dto)
    }
    
    @PutMapping("/{id}")
    @RequirePermission("expense.update", scope = PermissionScope.OWN)
    fun updateExpense(
        @PathVariable id: UUID,
        @RequestBody dto: UpdateExpenseDto
    ): Expense {
        return expenseService.update(id, dto)
    }
}
```

## 4. 段階的な移行計画

### Phase 1 (MVP) - 固定ロール
```kotlin
// シンプルなロールチェック
fun isAdmin(): Boolean = currentUser.role == "admin"
fun isLawyer(): Boolean = currentUser.role == "lawyer"
```

### Phase 2 - カスタムロール
```kotlin
// UI でロール作成
data class CreateRoleDto(
    val name: String,
    val permissions: List<String>
)

// 例: "シニアパラリーガル" ロール作成
// - 実費の全て操作
// - レポート作成
// - ユーザー招待は不可
```

### Phase 3 - 細かい権限制御
```kotlin
// 条件付き権限
data class ConditionalPermission(
    val permission: String,
    val condition: String  // 例: "amount < 10000"
)

// 例: "研修弁護士は10万円未満の実費のみ承認可能"
```

## 5. フロントエンドでの権限制御

```typescript
// Composable for permission check
export const usePermissions = () => {
  const user = useAuthStore()
  
  const hasPermission = (permission: string): boolean => {
    return user.permissions.includes(permission)
  }
  
  const can = {
    createExpense: () => hasPermission('expense.create'),
    updateExpense: (expense: Expense) => 
      hasPermission('expense.update.all') ||
      (hasPermission('expense.update.own') && expense.createdBy === user.id),
    deleteExpense: (expense: Expense) =>
      hasPermission('expense.delete.all') ||
      (hasPermission('expense.delete.own') && expense.createdBy === user.id)
  }
  
  return { hasPermission, can }
}

// Component usage
<template>
  <div>
    <button v-if="can.createExpense()" @click="create">
      新規作成
    </button>
    <button 
      v-if="can.updateExpense(expense)" 
      @click="edit(expense)"
    >
      編集
    </button>
  </div>
</template>
```

## 6. メリット

1. **MVP でシンプル**: 4つの固定ロールで開始
2. **将来性**: カスタムロール、細かい権限に対応可能
3. **事務所ごとのカスタマイズ**: 各事務所で独自の権限体系
4. **監査対応**: 誰がいつ何の権限を付与したか記録

この設計により、MVP段階ではシンプルに保ちつつ、将来の柔軟な権限管理への道筋を確保できます。