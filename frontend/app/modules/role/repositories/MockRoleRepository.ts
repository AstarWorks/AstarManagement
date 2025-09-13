/**
 * MockRoleRepository
 * 開発・テスト用のモック実装
 * Discord風のロールシステムを再現
 */

import type {
  RoleRepository,
  RoleResponse,
  RoleCreateRequest,
  RoleUpdateRequest,
  RoleListResponse,
  RoleListParams,
  RoleReorderRequest,
  RoleDuplicateRequest,
  PermissionGrantRequest,
  PermissionGrantResult,
  PermissionRevokeRequest,
  PermissionRevokeResult,
  PermissionCatalog,
  PermissionDefinition,
  RoleTemplateCategory,
  RoleTemplate,
  PermissionRule
} from '../types'

// 文字列権限をPermissionRuleオブジェクトに変換するヘルパー関数
function parsePermissionString(permission: string): PermissionRule {
  // 権限文字列を解析 (例: "table.view" -> { resourceType: 'TABLE', action: 'VIEW', scope: 'ALL' })
  const parts = permission.split('.')
  const resourceMap: Record<string, PermissionRule['resourceType']> = {
    'workspace': 'WORKSPACE',
    'table': 'TABLE',
    'record': 'RECORD',
    'document': 'DOCUMENT',
    'user': 'USER',
    'role': 'ROLE',
    'tenant': 'TENANT',
    'settings': 'SETTINGS'
  }
  const actionMap: Record<string, PermissionRule['action']> = {
    'view': 'VIEW',
    'create': 'CREATE',
    'edit': 'EDIT',
    'update': 'EDIT',
    'delete': 'DELETE',
    'manage': 'MANAGE',
    '*': 'MANAGE'
  }
  
  if (permission === '*') {
    return { resourceType: 'TENANT', action: 'MANAGE', scope: 'ALL' }
  }
  
  const [resource, action] = parts
  return {
    resourceType: (resource && resourceMap[resource]) || 'TABLE',
    action: (action && actionMap[action]) || 'VIEW',
    scope: 'ALL'
  }
}

// Discord風のモックロールデータ
const mockRoles: RoleResponse[] = [
  {
    id: 'role-1',
    tenantId: 'tenant-1',
    name: 'owner',
    displayName: 'オーナー',
    color: '#FF6B6B',
    position: 100,
    system: false,
    permissions: [parsePermissionString('*')],
    userCount: 1,
    createdAt: '2024-01-01T00:00:00Z',
    updatedAt: '2024-01-01T00:00:00Z'
  },
  {
    id: 'role-2',
    tenantId: 'tenant-1',
    name: 'admin',
    displayName: '管理者',
    color: '#FFD93D',
    position: 90,
    system: false,
    permissions: [
      parsePermissionString('workspace.*'),
      parsePermissionString('table.*'),
      parsePermissionString('record.*'),
      parsePermissionString('user.view'),
      parsePermissionString('user.update'),
      parsePermissionString('role.view')
    ],
    userCount: 2,
    createdAt: '2024-01-02T00:00:00Z',
    updatedAt: '2024-01-02T00:00:00Z'
  },
  {
    id: 'role-3',
    tenantId: 'tenant-1',
    name: 'moderator',
    displayName: 'モデレーター',
    color: '#6BCB77',
    position: 70,
    system: false,
    permissions: [
      parsePermissionString('table.view'),
      parsePermissionString('table.create'),
      parsePermissionString('table.update'),
      parsePermissionString('record.*'),
      parsePermissionString('user.view')
    ],
    userCount: 3,
    createdAt: '2024-01-03T00:00:00Z',
    updatedAt: '2024-01-03T00:00:00Z'
  },
  {
    id: 'role-4',
    tenantId: 'tenant-1',
    name: 'member',
    displayName: 'メンバー',
    color: '#4ECDC4',
    position: 50,
    system: false,
    permissions: [
      parsePermissionString('table.view'),
      parsePermissionString('record.view'),
      parsePermissionString('record.create'),
      parsePermissionString('record.update.own')
    ],
    userCount: 10,
    createdAt: '2024-01-04T00:00:00Z',
    updatedAt: '2024-01-04T00:00:00Z'
  },
  {
    id: 'role-5',
    tenantId: 'tenant-1',
    name: 'viewer',
    displayName: '閲覧者',
    color: '#95E77E',
    position: 10,
    system: false,
    permissions: [
      parsePermissionString('table.view'),
      parsePermissionString('record.view')
    ],
    userCount: 5,
    createdAt: '2024-01-05T00:00:00Z',
    updatedAt: '2024-01-05T00:00:00Z'
  }
]

// 権限カタログ
const mockPermissionCatalog: PermissionCatalog = {
  categories: [
    {
      name: 'workspace',
      displayName: 'ワークスペース',
      description: 'ワークスペース関連の権限',
      permissions: [
        {
          rule: 'workspace.view',
          displayName: 'ワークスペースを表示',
          description: 'ワークスペースの情報を閲覧できます'
        },
        {
          rule: 'workspace.create',
          displayName: 'ワークスペースを作成',
          description: '新しいワークスペースを作成できます'
        },
        {
          rule: 'workspace.update',
          displayName: 'ワークスペースを編集',
          description: 'ワークスペースの設定を変更できます'
        },
        {
          rule: 'workspace.delete',
          displayName: 'ワークスペースを削除',
          description: 'ワークスペースを削除できます',
          isAdvanced: true
        }
      ]
    },
    {
      name: 'table',
      displayName: 'テーブル',
      description: 'テーブル関連の権限',
      permissions: [
        {
          rule: 'table.view',
          displayName: 'テーブルを表示',
          description: 'テーブルの構造とデータを閲覧できます'
        },
        {
          rule: 'table.create',
          displayName: 'テーブルを作成',
          description: '新しいテーブルを作成できます'
        },
        {
          rule: 'table.update',
          displayName: 'テーブルを編集',
          description: 'テーブルの構造を変更できます'
        },
        {
          rule: 'table.delete',
          displayName: 'テーブルを削除',
          description: 'テーブルを削除できます',
          isAdvanced: true
        }
      ]
    },
    {
      name: 'record',
      displayName: 'レコード',
      description: 'レコード関連の権限',
      permissions: [
        {
          rule: 'record.view',
          displayName: 'レコードを表示',
          description: 'レコードを閲覧できます'
        },
        {
          rule: 'record.create',
          displayName: 'レコードを作成',
          description: '新しいレコードを作成できます'
        },
        {
          rule: 'record.update',
          displayName: 'レコードを編集',
          description: 'すべてのレコードを編集できます'
        },
        {
          rule: 'record.update.own',
          displayName: '自分のレコードを編集',
          description: '自分が作成したレコードのみ編集できます'
        },
        {
          rule: 'record.delete',
          displayName: 'レコードを削除',
          description: 'レコードを削除できます',
          isAdvanced: true
        }
      ]
    },
    {
      name: 'user',
      displayName: 'ユーザー',
      description: 'ユーザー管理関連の権限',
      permissions: [
        {
          rule: 'user.view',
          displayName: 'ユーザーを表示',
          description: 'ユーザー情報を閲覧できます'
        },
        {
          rule: 'user.create',
          displayName: 'ユーザーを招待',
          description: '新しいユーザーを招待できます'
        },
        {
          rule: 'user.update',
          displayName: 'ユーザーを編集',
          description: 'ユーザー情報を編集できます'
        },
        {
          rule: 'user.delete',
          displayName: 'ユーザーを削除',
          description: 'ユーザーを削除できます',
          isAdvanced: true
        }
      ]
    },
    {
      name: 'role',
      displayName: 'ロール',
      description: 'ロール管理関連の権限',
      permissions: [
        {
          rule: 'role.view',
          displayName: 'ロールを表示',
          description: 'ロール情報を閲覧できます'
        },
        {
          rule: 'role.create',
          displayName: 'ロールを作成',
          description: '新しいロールを作成できます',
          isAdvanced: true
        },
        {
          rule: 'role.update',
          displayName: 'ロールを編集',
          description: 'ロールの権限を編集できます',
          isAdvanced: true
        },
        {
          rule: 'role.delete',
          displayName: 'ロールを削除',
          description: 'ロールを削除できます',
          isAdvanced: true
        }
      ]
    }
  ],
  totalPermissions: 20
}

// ロールテンプレート
const mockRoleTemplates: RoleTemplateCategory[] = [
  {
    id: 'cat-1',
    name: 'general',
    displayName: '一般',
    description: '汎用的なロールテンプレート',
    templates: [
      {
        id: 'template-1',
        name: 'project-manager',
        displayName: 'プロジェクトマネージャー',
        description: 'プロジェクト全体を管理する権限',
        color: '#FF9F43',
        position: 80,
        permissions: [
          'workspace.view',
          'workspace.update',
          'table.*',
          'record.*',
          'user.view',
          'user.create'
        ],
        isRecommended: true
      },
      {
        id: 'template-2',
        name: 'developer',
        displayName: '開発者',
        description: '開発作業に必要な権限',
        color: '#54A0FF',
        position: 60,
        permissions: [
          'table.view',
          'table.create',
          'table.update',
          'record.*'
        ]
      }
    ]
  },
  {
    id: 'cat-2',
    name: 'law-firm',
    displayName: '法律事務所',
    description: '法律事務所向けのロールテンプレート',
    templates: [
      {
        id: 'template-3',
        name: 'partner',
        displayName: 'パートナー弁護士',
        description: '事務所のパートナー弁護士用',
        color: '#8B4513',
        position: 95,
        permissions: ['*'],
        isRecommended: true
      },
      {
        id: 'template-4',
        name: 'associate',
        displayName: 'アソシエイト弁護士',
        description: 'アソシエイト弁護士用',
        color: '#4682B4',
        position: 75,
        permissions: [
          'workspace.view',
          'table.*',
          'record.*',
          'user.view'
        ]
      },
      {
        id: 'template-5',
        name: 'paralegal',
        displayName: 'パラリーガル',
        description: '法務アシスタント用',
        color: '#32CD32',
        position: 40,
        permissions: [
          'table.view',
          'record.view',
          'record.create',
          'record.update.own'
        ]
      }
    ]
  }
]

export class MockRoleRepository implements RoleRepository {
  
  // Simulate network delay
  private async delay(ms: number = 200): Promise<void> {
    await new Promise(resolve => setTimeout(resolve, ms))
  }
  
  // ===========================
  // Role CRUD Operations
  // ===========================
  
  async listRoles(params?: RoleListParams): Promise<RoleListResponse> {
    await this.delay()
    
    let roles = [...mockRoles]
    
    // Filter system roles if needed
    if (params?.includeSystem === false) {
      roles = roles.filter(r => !r.system)
    }
    
    // Sort roles
    if (params?.sortBy) {
      roles.sort((a, b) => {
        const aVal = a[params.sortBy as keyof RoleResponse]
        const bVal = b[params.sortBy as keyof RoleResponse]
        
        if (params.sortDirection === 'desc') {
          return String(bVal).localeCompare(String(aVal))
        }
        return String(aVal).localeCompare(String(bVal))
      })
    } else {
      // Default sort by position (highest first, Discord style)
      roles.sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
    }
    
    return {
      roles,
      totalCount: roles.length
    }
  }
  
  async getRole(roleId: string): Promise<RoleResponse> {
    await this.delay()
    const role = mockRoles.find(r => r.id === roleId)
    if (!role) throw new Error(`Role ${roleId} not found`)
    return role
  }
  
  async createRole(data: RoleCreateRequest): Promise<RoleResponse> {
    await this.delay()
    const newRole: RoleResponse = {
      id: `role-${Date.now()}`,
      tenantId: 'tenant-1',
      name: data.name,
      displayName: data.displayName || data.name,
      color: data.color || '#808080',
      position: data.position || 30,
      system: false,
      permissions: data.permissions || [],
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    mockRoles.push(newRole)
    return newRole
  }
  
  async updateRole(roleId: string, data: RoleUpdateRequest): Promise<RoleResponse> {
    await this.delay()
    const index = mockRoles.findIndex(r => r.id === roleId)
    if (index === -1) throw new Error(`Role ${roleId} not found`)
    
    const currentRole = mockRoles[index]
    if (!currentRole) throw new Error(`Role ${roleId} not found`)
    
    const updatedRole: RoleResponse = {
      id: currentRole.id,
      tenantId: currentRole.tenantId,
      name: currentRole.name,
      displayName: data.displayName ?? currentRole.displayName,
      color: data.color ?? currentRole.color,
      position: data.position ?? currentRole.position,
      system: currentRole.system,
      permissions: currentRole.permissions,
      userCount: currentRole.userCount,
      createdAt: currentRole.createdAt,
      updatedAt: new Date().toISOString()
    }
    mockRoles[index] = updatedRole
    return updatedRole
  }
  
  async deleteRole(roleId: string): Promise<void> {
    await this.delay()
    const index = mockRoles.findIndex(r => r.id === roleId)
    if (index === -1) throw new Error(`Role ${roleId} not found`)
    mockRoles.splice(index, 1)
  }
  
  // ===========================
  // Role Operations
  // ===========================
  
  async duplicateRole(roleId: string, data: RoleDuplicateRequest): Promise<RoleResponse> {
    await this.delay()
    const originalRole = mockRoles.find(r => r.id === roleId)
    if (!originalRole) throw new Error(`Role ${roleId} not found`)
    
    const newRole: RoleResponse = {
      ...originalRole,
      id: `role-${Date.now()}`,
      name: data.newName,
      displayName: `${originalRole.displayName} (Copy)`,
      permissions: data.includePermissions ? originalRole.permissions : [],
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    mockRoles.push(newRole)
    return newRole
  }
  
  async reorderRoles(data: RoleReorderRequest): Promise<RoleResponse[]> {
    await this.delay()
    
    // Update positions
    if (data.positions) {
      data.positions.forEach(positionUpdate => {
        const role = mockRoles.find(r => r.id === positionUpdate.roleId)
        if (role && positionUpdate.position !== undefined) {
          role.position = positionUpdate.position
          role.updatedAt = new Date().toISOString()
        }
      })
    }
    
    // Return sorted roles
    return mockRoles.sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
  }
  
  // ===========================
  // Permission Management
  // ===========================
  
  async getRolePermissions(roleId: string): Promise<string[]> {
    await this.delay()
    const role = mockRoles.find(r => r.id === roleId)
    if (!role) throw new Error(`Role ${roleId} not found`)
    // Convert PermissionRule objects to strings for backward compatibility
    return (role.permissions || []).map(p => 
      typeof p === 'string' ? p : `${p.resourceType}.${p.action}`
    )
  }
  
  async grantPermissions(
    roleId: string,
    data: PermissionGrantRequest
  ): Promise<PermissionGrantResult> {
    await this.delay()
    const role = mockRoles.find(r => r.id === roleId)
    if (!role) throw new Error(`Role ${roleId} not found`)
    
    const currentPermissions = role.permissions || []
    const newPermissions = data.permissions || []
    // Merge permissions (avoid duplicates)
    const mergedPermissions = [...currentPermissions]
    newPermissions.forEach(newPerm => {
      const exists = mergedPermissions.some(p => 
        p.resourceType === newPerm.resourceType && 
        p.action === newPerm.action && 
        p.scope === newPerm.scope
      )
      if (!exists) {
        mergedPermissions.push(newPerm)
      }
    })
    role.permissions = mergedPermissions
    role.updatedAt = new Date().toISOString()
    
    return {
      roleId,
      granted: data.permissions || [],
      failed: [],
      totalGranted: (data.permissions || []).length
    }
  }
  
  async revokePermissions(
    roleId: string,
    data: PermissionRevokeRequest
  ): Promise<PermissionRevokeResult> {
    await this.delay()
    const role = mockRoles.find(r => r.id === roleId)
    if (!role) throw new Error(`Role ${roleId} not found`)
    
    const currentPermissions = role.permissions || []
    const toRemove = data.permissions || []
    // Remove permissions
    role.permissions = currentPermissions.filter(p => {
      // Check if this permission should be removed
      return !toRemove.some(removePerm => 
        typeof removePerm === 'string' 
          ? `${p.resourceType}.${p.action}` === removePerm
          : false
      )
    })
    role.updatedAt = new Date().toISOString()
    
    return {
      roleId,
      revoked: data.permissions,
      failed: {},
      totalRevoked: data.permissions.length
    }
  }
  
  // ===========================
  // Permission Catalog
  // ===========================
  
  async getPermissionCatalog(): Promise<PermissionCatalog> {
    await this.delay()
    return mockPermissionCatalog
  }
  
  async searchPermissions(query: string): Promise<PermissionDefinition[]> {
    await this.delay()
    const searchLower = query.toLowerCase()
    const results: PermissionDefinition[] = []
    
    mockPermissionCatalog.categories.forEach(category => {
      category.permissions.forEach(permission => {
        if (
          permission.rule.toLowerCase().includes(searchLower) ||
          permission.displayName.toLowerCase().includes(searchLower) ||
          permission.description?.toLowerCase().includes(searchLower)
        ) {
          results.push(permission)
        }
      })
    })
    
    return results
  }
  
  // ===========================
  // Role Templates
  // ===========================
  
  async getRoleTemplates(): Promise<RoleTemplateCategory[]> {
    await this.delay()
    return mockRoleTemplates
  }
  
  async applyRoleTemplate(templateId: string): Promise<RoleResponse> {
    await this.delay()
    
    // Find template
    let template: RoleTemplate | undefined
    for (const category of mockRoleTemplates) {
      template = category.templates.find(t => t.id === templateId)
      if (template) break
    }
    
    if (!template) throw new Error(`Template ${templateId} not found`)
    
    // Create role from template
    const newRole: RoleResponse = {
      id: `role-${Date.now()}`,
      tenantId: 'tenant-1',
      name: template.name,
      displayName: template.displayName,
      color: template.color,
      position: template.position,
      system: false,
      permissions: template.permissions.map(p => 
        typeof p === 'string' ? parsePermissionString(p) : p
      ),
      userCount: 0,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }
    
    mockRoles.push(newRole)
    return newRole
  }
  
  // ===========================
  // Role Statistics
  // ===========================
  
  async getRoleStatistics(roleId: string): Promise<{
    userCount: number
    permissionCount: number
    lastModified: string
    createdBy?: string
  }> {
    await this.delay()
    const role = mockRoles.find(r => r.id === roleId)
    if (!role) throw new Error(`Role ${roleId} not found`)
    
    return {
      userCount: role.userCount || 0,
      permissionCount: role.permissions?.length || 0,
      lastModified: role.updatedAt || new Date().toISOString(),
      createdBy: 'システム管理者'
    }
  }
}