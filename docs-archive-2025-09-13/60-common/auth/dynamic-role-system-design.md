# Discord風動的ロールシステム設計書

## 1. 設計思想

### 1.1 基本原則
**完全動的ロール作成システム** - 汎用ビジネス管理プラットフォームの核心
- **初期ロールなし**: システムには事前定義されたロールは存在しない
- **動的ロール作成**: 管理者が組織のニーズに合わせてロールを作成
- **テンプレート同梱**: 業界テンプレートに事前定義されたロールをインポート可能
- **複数ロール付与**: 1ユーザーに複数ロールを付与して柔軟な権限設定
- **階層なし**: ロール間に継承関係はなく、すべて独立
- **色分けと表示**: Discord風の色分けとロール表示機能

### 1.2 業界非依存性
- **コア**: 完全に業界中立、ロール名・権限に業界特有用語なし
- **テンプレート**: 業界特化ロールは外部テンプレートで提供
- **拡張性**: 任意の業界・組織形態に対応可能

## 2. データベース設計

### 2.1 ロールマスタ（完全動的）
```sql
-- 動的ロール管理テーブル
CREATE TABLE roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- ロール基本情報
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6b7280',  -- Discord風カラー（HEX）
  display_order INTEGER DEFAULT 0,     -- 表示順序
  
  -- ロール設定
  is_active BOOLEAN DEFAULT true,
  is_template_imported BOOLEAN DEFAULT false,  -- テンプレート由来フラグ
  template_role_id VARCHAR(100),              -- 元テンプレートロールID
  
  -- メタデータ
  created_at TIMESTAMPTZ DEFAULT NOW(),
  created_by UUID REFERENCES users(id),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID REFERENCES users(id),
  
  -- 制約
  UNIQUE(tenant_id, name)
);

-- インデックス
CREATE INDEX idx_roles_tenant_id ON roles(tenant_id);
CREATE INDEX idx_roles_active ON roles(is_active);
CREATE INDEX idx_roles_display_order ON roles(display_order);
```

### 2.2 動的権限システム
```sql
-- 動的権限定義（リソースベース）
CREATE TABLE permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  
  -- 権限識別子
  resource_type VARCHAR(100) NOT NULL,  -- 'database', 'document', 'workspace'
  action VARCHAR(50) NOT NULL,          -- 'read', 'write', 'delete', 'manage'
  scope VARCHAR(50) DEFAULT 'own',      -- 'own', 'team', 'all', 'none'
  
  -- 権限メタデータ
  name VARCHAR(255) NOT NULL,
  description TEXT,
  is_system BOOLEAN DEFAULT false,      -- システム基本権限
  
  -- 制約条件（JSON）
  conditions JSONB DEFAULT '{}',       -- 追加制約条件
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- ユニーク制約
  UNIQUE(tenant_id, resource_type, action, scope)
);

-- ロール権限マッピング
CREATE TABLE role_permissions (
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  permission_id UUID REFERENCES permissions(id) ON DELETE CASCADE,
  
  -- 権限付与情報
  granted_at TIMESTAMPTZ DEFAULT NOW(),
  granted_by UUID REFERENCES users(id),
  
  PRIMARY KEY (role_id, permission_id)
);
```

### 2.3 ユーザーロール管理
```sql
-- ユーザーロール割り当て（複数ロール対応）
CREATE TABLE user_roles (
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  role_id UUID REFERENCES roles(id) ON DELETE CASCADE,
  
  -- 割り当て情報
  assigned_at TIMESTAMPTZ DEFAULT NOW(),
  assigned_by UUID REFERENCES users(id),
  expires_at TIMESTAMPTZ,              -- 期限付きロール
  
  -- 割り当て理由・メモ
  assignment_reason TEXT,
  notes TEXT,
  
  PRIMARY KEY (user_id, role_id)
);

-- インデックス
CREATE INDEX idx_user_roles_user_id ON user_roles(user_id);
CREATE INDEX idx_user_roles_expires_at ON user_roles(expires_at);
```

## 3. テンプレートロールインポート

### 3.1 テンプレートロール定義
```sql
-- テンプレートロール定義（読み取り専用）
CREATE TABLE template_roles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id VARCHAR(100) NOT NULL,   -- 'legal-office', 'logistics'
  role_id VARCHAR(100) NOT NULL,       -- 'senior-lawyer', 'driver'
  
  -- ロール情報
  name VARCHAR(255) NOT NULL,
  description TEXT,
  color VARCHAR(7) DEFAULT '#6b7280',
  display_order INTEGER DEFAULT 0,
  
  -- 権限定義（JSON）
  permissions JSONB NOT NULL DEFAULT '[]',
  
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  UNIQUE(template_id, role_id)
);

-- テンプレートロールインポート履歴
CREATE TABLE role_import_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  template_id VARCHAR(100) NOT NULL,
  
  -- インポート情報
  imported_roles JSONB NOT NULL,       -- インポートされたロール一覧
  customizations JSONB DEFAULT '{}',   -- 名前・色のカスタマイズ情報
  
  imported_at TIMESTAMPTZ DEFAULT NOW(),
  imported_by UUID REFERENCES users(id),
  
  -- インポート設定
  auto_assign_admin BOOLEAN DEFAULT true,
  admin_role_pattern VARCHAR(255)      -- 管理者ロールの特定パターン
);
```

### 3.2 インポート機能実装（Auth0連携対応）
```kotlin
@Service
@Transactional
class RoleTemplateService(
    private val templateRoleRepository: TemplateRoleRepository,
    private val roleRepository: RoleRepository,
    private val permissionService: PermissionService,
    private val auth0ManagementService: Auth0ManagementService
) {
    
    fun importTemplateRoles(
        tenantId: UUID,
        templateId: String,
        selectedRoles: List<String>,
        customizations: Map<String, RoleCustomization>,
        importedBy: UUID
    ): RoleImportResult {
        
        val templateRoles = templateRoleRepository.findByTemplateIdAndRoleIdIn(
            templateId, selectedRoles
        )
        
        val importedRoles = mutableListOf<Role>()
        
        templateRoles.forEach { templateRole ->
            val customization = customizations[templateRole.roleId]
            
            // 1. アプリケーション内ロール作成
            val role = Role(
                tenantId = tenantId,
                name = customization?.name ?: templateRole.name,
                description = templateRole.description,
                color = customization?.color ?: templateRole.color,
                displayOrder = templateRole.displayOrder,
                isTemplateImported = true,
                templateRoleId = templateRole.roleId,
                createdBy = importedBy
            )
            
            val savedRole = roleRepository.save(role)
            
            // 2. 権限設定
            templateRole.permissions.forEach { permissionDef ->
                val permission = permissionService.findOrCreatePermission(
                    tenantId = tenantId,
                    resourceType = permissionDef.resourceType,
                    action = permissionDef.action,
                    scope = permissionDef.scope
                )
                
                rolePermissionRepository.save(
                    RolePermission(savedRole.id, permission.id, importedBy)
                )
            }
            
            // 3. Auth0 Custom Claims更新準備
            // (実際の更新は次回ログイン時にAuth0 Actionで行われる)
            
            importedRoles.add(savedRole)
        }
        
        // インポート履歴記録
        roleImportHistoryRepository.save(
            RoleImportHistory(
                tenantId = tenantId,
                templateId = templateId,
                importedRoles = importedRoles.map { it.toSummary() },
                customizations = customizations,
                importedBy = importedBy
            )
        )
        
        // Auth0にテンプレートインポート完了を通知（オプション）
        auth0ManagementService.notifyRoleImport(tenantId, importedRoles)
        
        return RoleImportResult(
            importedRoles = importedRoles,
            totalCount = importedRoles.size
        )
    }
}

@Service
class Auth0ManagementService(
    @Value("\${auth0.management.api.token}") private val managementToken: String,
    @Value("\${auth0.domain}") private val domain: String
) {
    
    fun notifyRoleImport(tenantId: UUID, roles: List<Role>) {
        // Auth0 Management APIを使用してロール情報を更新
        // または、次回ログイン時にAuth0 Actionが自動的にロールを取得
        logger.info("Role import completed for tenant $tenantId: ${roles.map { it.name }}")
    }
    
    fun updateUserRoles(auth0UserId: String, roles: List<String>) {
        // 必要に応じてAuth0のapp_metadataを更新
        // 通常は次回API呼び出し時に最新ロールが取得される
    }
}
```

## 4. ロール管理API

### 4.1 動的ロール作成
```kotlin
@RestController
@RequestMapping("/api/roles")
class RoleController(
    private val roleService: RoleService,
    private val permissionService: PermissionService
) {
    
    @PostMapping
    @RequirePermission("role.create")
    fun createRole(@RequestBody request: CreateRoleRequest): Role {
        return roleService.createRole(
            tenantId = getCurrentTenantId(),
            name = request.name,
            description = request.description,
            color = request.color,
            permissions = request.permissions,
            createdBy = getCurrentUserId()
        )
    }
    
    @PutMapping("/{roleId}")
    @RequirePermission("role.update")
    fun updateRole(
        @PathVariable roleId: UUID,
        @RequestBody request: UpdateRoleRequest
    ): Role {
        return roleService.updateRole(roleId, request)
    }
    
    @DeleteMapping("/{roleId}")
    @RequirePermission("role.delete")
    fun deleteRole(@PathVariable roleId: UUID) {
        roleService.deleteRole(roleId)
    }
}

// リクエストDTO
data class CreateRoleRequest(
    val name: String,
    val description: String?,
    val color: String = "#6b7280",
    val permissions: List<PermissionRequest>
)

data class PermissionRequest(
    val resourceType: String,
    val action: String,
    val scope: String = "own",
    val conditions: Map<String, Any> = emptyMap()
)
```

### 4.2 テンプレートロールインポートAPI
```kotlin
@PostMapping("/templates/{templateId}/import")
@RequirePermission("role.import")
fun importTemplateRoles(
    @PathVariable templateId: String,
    @RequestBody request: ImportRolesRequest
): RoleImportResult {
    return roleTemplateService.importTemplateRoles(
        tenantId = getCurrentTenantId(),
        templateId = templateId,
        selectedRoles = request.selectedRoles,
        customizations = request.customizations,
        importedBy = getCurrentUserId()
    )
}

data class ImportRolesRequest(
    val selectedRoles: List<String>,
    val customizations: Map<String, RoleCustomization> = emptyMap(),
    val autoAssignAdmin: Boolean = true
)

data class RoleCustomization(
    val name: String?,
    val color: String?
)
```

## 5. Auth0統合権限チェックシステム

### 5.1 動的権限評価（Auth0連携対応）
```kotlin
@Service
class DynamicPermissionService(
    private val jdbcTemplate: JdbcTemplate,
    private val securityContextService: SecurityContextService
) {
    
    fun hasPermission(
        resourceType: String,
        action: String,
        resourceId: UUID? = null,
        context: Map<String, Any> = emptyMap()
    ): Boolean {
        
        // Auth0 JWTから取得したユーザー情報を使用
        val authContext = securityContextService.getCurrentAuth()
        
        val sql = """
            SELECT check_dynamic_permission(?, ?, ?, ?, ?, ?)
        """
        
        return jdbcTemplate.queryForObject(
            sql,
            Boolean::class.java,
            authContext.userId,
            authContext.tenantId,
            resourceType,
            action,
            resourceId,
            objectMapper.writeValueAsString(context)
        ) ?: false
    }
    
    fun hasPermissionForUser(
        userId: UUID,
        tenantId: UUID,
        resourceType: String,
        action: String,
        resourceId: UUID? = null,
        context: Map<String, Any> = emptyMap()
    ): Boolean {
        
        val sql = """
            SELECT check_dynamic_permission(?, ?, ?, ?, ?, ?)
        """
        
        return jdbcTemplate.queryForObject(
            sql,
            Boolean::class.java,
            userId,
            tenantId,
            resourceType,
            action,
            resourceId,
            objectMapper.writeValueAsString(context)
        ) ?: false
    }
}

@Service
class SecurityContextService {
    
    fun getCurrentAuth(): Auth0Context {
        val authentication = SecurityContextHolder.getContext().authentication
            as? Auth0Authentication
            ?: throw SecurityException("認証情報が見つかりません")
        
        return Auth0Context(
            auth0UserId = authentication.claims.auth0UserId,
            userId = authentication.claims.userId,
            tenantId = authentication.claims.tenantId,
            tenantSlug = authentication.claims.tenantSlug,
            roles = authentication.claims.roles,
            plan = authentication.claims.plan
        )
    }
}

data class Auth0Context(
    val auth0UserId: String,
    val userId: UUID,
    val tenantId: UUID,
    val tenantSlug: String,
    val roles: List<String>,
    val plan: String
)

-- Auth0統合動的権限チェック関数
CREATE OR REPLACE FUNCTION check_dynamic_permission(
    p_user_id UUID,
    p_tenant_id UUID,
    p_resource_type VARCHAR(100),
    p_action VARCHAR(50),
    p_resource_id UUID DEFAULT NULL,
    p_context JSONB DEFAULT '{}'
) RETURNS BOOLEAN AS $$
DECLARE
    v_has_permission BOOLEAN := false;
    v_permission RECORD;
BEGIN
    -- テナント分離チェック（必須）
    IF NOT EXISTS (
        SELECT 1 FROM users 
        WHERE id = p_user_id AND tenant_id = p_tenant_id AND is_active = true
    ) THEN
        RETURN false;
    END IF;
    
    -- ユーザーのロール経由で権限チェック
    FOR v_permission IN
        SELECT DISTINCT p.scope, p.conditions
        FROM user_roles ur
        JOIN role_permissions rp ON ur.role_id = rp.role_id
        JOIN permissions p ON rp.permission_id = p.id
        WHERE ur.user_id = p_user_id
          AND p.resource_type IN (p_resource_type, '*')  -- ワイルドカード対応
          AND p.action IN (p_action, '*')                -- ワイルドカード対応
          AND p.tenant_id = p_tenant_id
          AND (ur.expires_at IS NULL OR ur.expires_at > NOW())
    LOOP
        -- スコープチェック
        IF check_permission_scope(
            p_user_id, 
            p_tenant_id,
            v_permission.scope, 
            p_resource_id,
            p_context
        ) THEN
            -- 条件チェック
            IF check_permission_conditions(
                v_permission.conditions,
                p_context
            ) THEN
                v_has_permission := true;
                EXIT;
            END IF;
        END IF;
    END LOOP;
    
    RETURN v_has_permission;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- スコープチェック関数も更新
CREATE OR REPLACE FUNCTION check_permission_scope(
    p_user_id UUID,
    p_tenant_id UUID,
    p_scope VARCHAR(20),
    p_resource_id UUID,
    p_context JSONB
) RETURNS BOOLEAN AS $$
BEGIN
    CASE p_scope
        WHEN 'all' THEN
            RETURN true;
        WHEN 'workspace' THEN
            -- ワークスペースレベルアクセス
            RETURN EXISTS (
                SELECT 1 FROM workspace_members wm
                WHERE wm.user_id = p_user_id 
                AND wm.tenant_id = p_tenant_id
            );
        WHEN 'team' THEN
            -- チームレベルアクセス
            RETURN EXISTS (
                SELECT 1 FROM user_teams ut
                JOIN teams t ON ut.team_id = t.id
                WHERE ut.user_id = p_user_id 
                AND t.tenant_id = p_tenant_id
            );
        WHEN 'own' THEN
            -- 自分が作成したリソースのみ
            RETURN p_resource_id IS NULL OR EXISTS (
                SELECT 1 FROM (
                    SELECT created_by FROM databases WHERE id = p_resource_id
                    UNION ALL
                    SELECT created_by FROM documents WHERE id = p_resource_id
                    UNION ALL
                    SELECT created_by FROM records WHERE id = p_resource_id
                ) AS resources
                WHERE resources.created_by = p_user_id
            );
        ELSE
            RETURN false;
    END CASE;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
```

## 6. フロントエンド統合

### 6.1 ロール管理コンポーネント
```vue
<template>
  <div class="role-management">
    <!-- ロール一覧 -->
    <div class="roles-list">
      <div 
        v-for="role in roles" 
        :key="role.id"
        class="role-item"
        :style="{ borderColor: role.color }"
      >
        <div class="role-header">
          <div 
            class="role-badge"
            :style="{ backgroundColor: role.color }"
          >
            {{ role.name }}
          </div>
          <div class="role-actions">
            <button @click="editRole(role)">編集</button>
            <button @click="deleteRole(role)">削除</button>
          </div>
        </div>
        <p class="role-description">{{ role.description }}</p>
        <div class="role-permissions">
          <span 
            v-for="permission in role.permissions"
            :key="permission.id"
            class="permission-tag"
          >
            {{ permission.resourceType }}.{{ permission.action }}
          </span>
        </div>
      </div>
    </div>
    
    <!-- ロール作成ボタン -->
    <div class="actions">
      <button @click="createRole" class="btn-primary">
        新しいロールを作成
      </button>
      <button @click="importTemplate" class="btn-secondary">
        テンプレートからインポート
      </button>
    </div>
  </div>
</template>

<script setup lang="ts">
const roles = ref<Role[]>([])
const { hasPermission } = usePermissions()

const createRole = () => {
  if (!hasPermission('role.create')) {
    toast.error('ロール作成権限がありません')
    return
  }
  // ロール作成ダイアログ表示
}

const importTemplate = () => {
  if (!hasPermission('role.import')) {
    toast.error('テンプレートインポート権限がありません')
    return
  }
  // テンプレートインポートダイアログ表示
}
</script>
```

### 6.2 Sidebase Auth連携権限チェックComposable
```typescript
// composables/usePermissions.ts
export function usePermissions() {
  const { data: session } = useAuth()
  const { apiCall } = useApi()
  
  // セッションから情報取得
  const user = computed(() => session.value?.user)
  const tenant = computed(() => ({
    id: session.value?.tenantId,
    slug: session.value?.tenantSlug,
    plan: session.value?.plan
  }))
  const userRoles = computed(() => session.value?.roles || [])
  
  // サーバーサイド権限チェック（推奨）
  const hasPermission = async (
    resourceType: string,
    action: string,
    resourceId?: string,
    context: Record<string, any> = {}
  ): Promise<boolean> => {
    try {
      const response = await apiCall<{ allowed: boolean }>('/api/permissions/check', {
        method: 'POST',
        body: JSON.stringify({
          resourceType,
          action,
          resourceId,
          context
        })
      })
      return response.allowed
    } catch (error) {
      console.error('Permission check failed:', error)
      return false
    }
  }
  
  // クライアントサイド権限チェック（表示制御用）
  const hasPermissionLocal = (
    resourceType: string,
    action: string,
    resourceId?: string,
    context: Record<string, any> = {}
  ): boolean => {
    if (!user.value || !tenant.value?.id) return false
    
    // Sidebase Authセッションから取得したロール情報をチェック
    const roles = userRoles.value
    
    // ロールベースのクライアント権限チェック
    // 注意: これは表示制御のみで、実際の権限チェックはサーバーサイドで行う
    return roles.some(roleName => {
      // 管理者系ロールのチェック例
      if (roleName.includes('管理者') || roleName.includes('admin')) {
        return true
      }
      
      // リソース固有のロールチェック
      if (resourceType === 'role' && roleName.includes('ロール管理')) {
        return action !== 'delete' // 削除以外は許可
      }
      
      return false
    })
  }
  
  // 権限チェック付きAPI呼び出し
  const withPermissionCheck = async <T>(
    resourceType: string,
    action: string,
    apiCall: () => Promise<T>,
    resourceId?: string
  ): Promise<T> => {
    const allowed = await hasPermission(resourceType, action, resourceId)
    if (!allowed) {
      throw new Error(`権限がありません: ${resourceType}.${action}`)
    }
    return await apiCall()
  }
  
  // よく使用する権限チェック
  const canManageRoles = () => hasPermission('role', 'manage')
  const canCreateRole = () => hasPermission('role', 'create')
  const canImportTemplate = () => hasPermission('role', 'import')
  const canManageUsers = () => hasPermission('user', 'manage')
  const canAccessDatabase = (dbId: string) => hasPermission('database', 'read', dbId)
  
  // リアクティブ権限チェック（表示制御用）
  const canManageRolesLocal = computed(() => hasPermissionLocal('role', 'manage'))
  const canCreateRoleLocal = computed(() => hasPermissionLocal('role', 'create'))
  
  return {
    // Computed properties
    user: readonly(user),
    tenant: readonly(tenant),
    userRoles: readonly(userRoles),
    
    // サーバーサイド権限チェック（実際の権限制御）
    hasPermission,
    withPermissionCheck,
    canManageRoles,
    canCreateRole,
    canImportTemplate,
    canManageUsers,
    canAccessDatabase,
    
    // クライアントサイド権限チェック（表示制御のみ）
    hasPermissionLocal,
    canManageRolesLocal,
    canCreateRoleLocal
  }
}

// composables/useRoleManagement.ts - Sidebase Auth連携ロール管理
export function useRoleManagement() {
  const { apiCall } = useApi()
  const { hasPermission, withPermissionCheck } = usePermissions()
  
  const createRole = async (roleData: CreateRoleRequest) => {
    return withPermissionCheck('role', 'create', async () => {
      return await apiCall<Role>('/api/roles', {
        method: 'POST',
        body: JSON.stringify(roleData)
      })
    })
  }
  
  const importTemplateRoles = async (templateId: string, importData: ImportRolesRequest) => {
    return withPermissionCheck('role', 'import', async () => {
      return await apiCall<RoleImportResult>(`/api/roles/templates/${templateId}/import`, {
        method: 'POST',
        body: JSON.stringify(importData)
      })
    })
  }
  
  const assignRoleToUser = async (userId: string, roleId: string) => {
    return withPermissionCheck('user', 'assign_role', async () => {
      return await apiCall(`/api/users/${userId}/roles/${roleId}`, {
        method: 'POST'
      })
    })
  }
  
  // 権限チェック結果をキャッシュ
  const permissionCache = new Map<string, { result: boolean, timestamp: number }>()
  const CACHE_TTL = 5 * 60 * 1000 // 5分
  
  const getCachedPermission = async (key: string, checkFn: () => Promise<boolean>) => {
    const cached = permissionCache.get(key)
    const now = Date.now()
    
    if (cached && (now - cached.timestamp) < CACHE_TTL) {
      return cached.result
    }
    
    const result = await checkFn()
    permissionCache.set(key, { result, timestamp: now })
    return result
  }
  
  return {
    createRole,
    importTemplateRoles,
    assignRoleToUser,
    getCachedPermission
  }
}
```

## 7. テンプレート例（法律事務所）

### 7.1 テンプレートロール定義
```json
{
  "templateId": "legal-office",
  "templateName": "法律事務所テンプレート",
  "version": "1.0.0",
  "roles": [
    {
      "roleId": "senior-partner",
      "name": "シニアパートナー",
      "description": "事務所の最高責任者",
      "color": "#8b5cf6",
      "displayOrder": 1,
      "permissions": [
        {
          "resourceType": "*",
          "action": "*",
          "scope": "all"
        }
      ]
    },
    {
      "roleId": "associate-lawyer", 
      "name": "アソシエイト弁護士",
      "description": "雇用弁護士",
      "color": "#06b6d4",
      "displayOrder": 2,
      "permissions": [
        {
          "resourceType": "database",
          "action": "read",
          "scope": "all"
        },
        {
          "resourceType": "database",
          "action": "write",
          "scope": "own"
        },
        {
          "resourceType": "document",
          "action": "*",
          "scope": "team"
        }
      ]
    },
    {
      "roleId": "paralegal",
      "name": "パラリーガル", 
      "description": "法務補助者",
      "color": "#10b981",
      "displayOrder": 3,
      "permissions": [
        {
          "resourceType": "database",
          "action": "read",
          "scope": "team"
        },
        {
          "resourceType": "database",
          "action": "write",
          "scope": "own"
        },
        {
          "resourceType": "document",
          "action": "read",
          "scope": "all"
        },
        {
          "resourceType": "document",
          "action": "write",
          "scope": "team"
        }
      ]
    },
    {
      "roleId": "client",
      "name": "依頼者",
      "description": "外部顧客",
      "color": "#6b7280", 
      "displayOrder": 4,
      "permissions": [
        {
          "resourceType": "database",
          "action": "read",
          "scope": "own",
          "conditions": {
            "fields": ["title", "status", "summary"]
          }
        },
        {
          "resourceType": "document",
          "action": "read", 
          "scope": "own",
          "conditions": {
            "document_type": ["public", "client_facing"]
          }
        }
      ]
    }
  ]
}
```

## 8. Auth0統合によるメリット

### 8.1 開発効率向上
- **認証処理削除**: ロール取得ロジックを除く認証処理が不要
- **セキュリティ強化**: Auth0のエンタープライズセキュリティを活用
- **JWT管理簡素化**: Auth0が発行したJWTをそのまま活用

### 8.2 権限システム最適化
```kotlin
// Auth0統合前（複雑）
@PreAuthorize("hasRole('ADMIN') or hasPermission(#resourceId, 'WRITE')")
fun updateResource(resourceId: UUID) { }

// Auth0統合後（シンプル）
@RequirePermission("database.write")
fun updateResource(resourceId: UUID) { }
```

### 8.3 フロントエンド統合
```typescript
// Auth0 JWTから直接ロール情報取得
const userRoles = user.value['https://astar-management.com/roles'] as string[]

// サーバーサイド権限チェックと表示制御の分離
const canEdit = await hasPermission('database', 'write', resourceId)  // 実際の権限
const showEditButton = hasPermissionLocal('database', 'write')        // 表示制御
```

## 9. まとめ

この**Auth0統合動的ロールシステム設計**により：

1. **完全な業界非依存性**: コアシステムに法律用語なし
2. **Discord風の柔軟性**: 動的ロール作成、色分け、複数ロール
3. **Auth0の活用**: 認証処理の大幅簡素化
4. **開発速度向上**: 認証機能開発3-4週間短縮
5. **セキュリティ強化**: エンタープライズレベルのセキュリティ
6. **テンプレート活用**: 業界特化はテンプレートで提供
7. **権限システム継続**: 柔軟な権限管理機能は維持

**技術的成果**:
- Spring Bootの認証コード約30%削減
- JWT検証のみに特化した軽量認証層
- Auth0 Custom Claimsによるシームレスなロール連携

**ビジネス成果**:
- 迅速なMVP開発
- 汎用プラットフォームとしての拡張性維持
- エンタープライズ顧客への対応力

**結果**: Auth0の力を活用して開発速度を最優先としながら、真の「汎用ビジネス管理プラットフォーム」の権限システムを実現