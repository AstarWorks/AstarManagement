/**
 * ロール操作のComposable
 * Repository層を活用したDiscord風ロール管理
 */

import { useRoleRepository } from '~/modules/role/repositories'
import type {
  RoleResponse,
  RoleCreateRequest,
  RoleUpdateRequest,
  RoleListParams,
  RoleReorderRequest,
  RoleDuplicateRequest,
  PermissionGrantRequest,
  PermissionRevokeRequest,
  PermissionDefinition,
  RoleTemplate
} from '~/modules/role/types'

export const useRole = () => {
  // Repository取得（Mock/Real自動切り替え）
  const repository = useRoleRepository()
  
  // Role CRUD Operations
  const listRoles = (params?: RoleListParams) => repository.listRoles(params)
  const getRole = (roleId: string) => repository.getRole(roleId)
  const createRole = (data: RoleCreateRequest) => repository.createRole(data)
  const updateRole = (roleId: string, data: RoleUpdateRequest) => repository.updateRole(roleId, data)
  const deleteRole = (roleId: string) => repository.deleteRole(roleId)
  
  // Role Operations
  const duplicateRole = (roleId: string, data: RoleDuplicateRequest) => repository.duplicateRole(roleId, data)
  const reorderRoles = (data: RoleReorderRequest) => repository.reorderRoles(data)
  
  // Permission Management
  const getRolePermissions = (roleId: string) => repository.getRolePermissions(roleId)
  const grantPermissions = (roleId: string, data: PermissionGrantRequest) => repository.grantPermissions(roleId, data)
  const revokePermissions = (roleId: string, data: PermissionRevokeRequest) => repository.revokePermissions(roleId, data)
  
  // Permission Catalog
  const getPermissionCatalog = () => repository.getPermissionCatalog()
  const searchPermissions = (query: string) => repository.searchPermissions(query)
  
  // Role Templates
  const getRoleTemplates = () => repository.getRoleTemplates()
  const applyRoleTemplate = (templateId: string) => repository.applyRoleTemplate(templateId)
  
  // Role Statistics
  const getRoleStatistics = (roleId: string) => repository.getRoleStatistics(roleId)
  
  return {
    // CRUD Operations
    listRoles,
    getRole,
    createRole,
    updateRole,
    deleteRole,
    
    // Role Operations
    duplicateRole,
    reorderRoles,
    
    // Permission Management
    getRolePermissions,
    grantPermissions,
    revokePermissions,
    
    // Permission Catalog
    getPermissionCatalog,
    searchPermissions,
    
    // Role Templates
    getRoleTemplates,
    applyRoleTemplate,
    
    // Statistics
    getRoleStatistics
  }
}

/**
 * リアクティブなロール一覧管理
 * Discord風の階層表示対応
 */
export const useRoleList = (params?: MaybeRef<RoleListParams>) => {
  const queryParams = toRef(params)
  const roleApi = useRole()
  
  const { 
    data: response, 
    pending,
    refresh,
    error 
  } = useAsyncData(
    'roleList',
    async () => {
      return await roleApi.listRoles(queryParams.value)
    },
    {
      watch: [queryParams]
    }
  )
  
  // Discord風にposition順でソート（高い順）
  const sortedRoles = computed(() => {
    const roles = response.value?.roles || []
    return [...roles].sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
  })
  
  // 権限付きロール一覧（管理用）
  const rolesWithPermissions = computed(() => {
    return sortedRoles.value.filter(role => role.permissions && role.permissions.length > 0)
  })
  
  // システムロール除外
  const nonSystemRoles = computed(() => {
    return sortedRoles.value.filter(role => !role.isSystem)
  })
  
  return {
    roles: readonly(sortedRoles),
    rolesWithPermissions: readonly(rolesWithPermissions),
    nonSystemRoles: readonly(nonSystemRoles),
    totalCount: computed(() => response.value?.totalCount || 0),
    pending,
    error,
    refresh
  }
}

/**
 * 権限カタログの管理
 * 権限の分類・検索機能
 */
export const usePermissionCatalog = () => {
  const roleApi = useRole()
  
  const { 
    data: catalog, 
    pending,
    refresh,
    error 
  } = useAsyncData(
    'permissionCatalog',
    async () => {
      return await roleApi.getPermissionCatalog()
    }
  )
  
  // カテゴリー別の権限
  const permissionsByCategory = computed(() => {
    if (!catalog.value) return new Map()
    
    const categoryMap = new Map()
    catalog.value.categories.forEach(category => {
      categoryMap.set(category.name, category.permissions)
    })
    return categoryMap
  })
  
  // 全権限の検索
  const searchPermissions = async (query: string) => {
    if (!query.trim()) return []
    return await roleApi.searchPermissions(query)
  }
  
  // 高度な権限（管理者向け）
  const advancedPermissions = computed(() => {
    if (!catalog.value) return []
    
    const advanced: PermissionDefinition[] = []
    catalog.value.categories.forEach(category => {
      category.permissions.forEach(permission => {
        if (permission.isAdvanced) {
          advanced.push({
            ...permission,
            category: category.displayName
          })
        }
      })
    })
    return advanced
  })
  
  return {
    catalog: readonly(catalog),
    permissionsByCategory: readonly(permissionsByCategory),
    advancedPermissions: readonly(advancedPermissions),
    pending,
    error,
    searchPermissions,
    refresh
  }
}

/**
 * ロールテンプレートの管理
 * 業界特化テンプレートの適用
 */
export const useRoleTemplates = () => {
  const roleApi = useRole()
  
  const { 
    data: templateCategories, 
    pending,
    refresh,
    error 
  } = useAsyncData(
    'roleTemplates',
    async () => {
      return await roleApi.getRoleTemplates()
    }
  )
  
  // 推奨テンプレート
  const recommendedTemplates = computed(() => {
    if (!templateCategories.value) return []
    
    const recommended: RoleTemplate[] = []
    templateCategories.value.forEach(category => {
      category.templates.forEach(template => {
        if (template.isRecommended) {
          recommended.push({
            ...template,
            category: category.displayName
          })
        }
      })
    })
    return recommended
  })
  
  // カテゴリー別テンプレート
  const templatesByCategory = computed(() => {
    if (!templateCategories.value) return new Map()
    
    const categoryMap = new Map()
    templateCategories.value.forEach(category => {
      categoryMap.set(category.name, category.templates)
    })
    return categoryMap
  })
  
  // テンプレートを適用してロールを作成
  const applyTemplate = async (templateId: string) => {
    try {
      const newRole = await roleApi.applyRoleTemplate(templateId)
      return newRole
    } catch (error) {
      console.error('[useRoleTemplates] Failed to apply template:', error)
      throw error
    }
  }
  
  return {
    templateCategories: readonly(templateCategories),
    recommendedTemplates: readonly(recommendedTemplates),
    templatesByCategory: readonly(templatesByCategory),
    pending,
    error,
    applyTemplate,
    refresh
  }
}

/**
 * 特定ロールの詳細管理
 * 権限設定・統計情報
 */
export const useRoleData = (roleId: MaybeRef<string>) => {
  const id = toRef(roleId)
  const roleApi = useRole()
  
  // ロール情報の取得
  const { 
    data: role, 
    pending: rolePending, 
    refresh: refreshRole,
    error: roleError 
  } = useAsyncData(
    `role:${id.value}`,
    async () => {
      return await roleApi.getRole(id.value)
    },
    {
      watch: [id]
    }
  )
  
  // ロールの権限取得
  const { 
    data: permissions, 
    pending: permissionsPending, 
    refresh: refreshPermissions,
    error: permissionsError
  } = useAsyncData(
    `role:${id.value}:permissions`,
    async () => {
      return await roleApi.getRolePermissions(id.value)
    },
    {
      watch: [id]
    }
  )
  
  // ロールの統計取得
  const { 
    data: statistics, 
    pending: statsPending, 
    refresh: refreshStats,
    error: statsError
  } = useAsyncData(
    `role:${id.value}:stats`,
    async () => {
      return await roleApi.getRoleStatistics(id.value)
    },
    {
      watch: [id]
    }
  )
  
  // 権限の追加
  const addPermissions = async (permissions: string[]) => {
    await roleApi.grantPermissions(id.value, { permissions })
    await refreshPermissions()
    await refreshStats()
  }
  
  // 権限の削除
  const removePermissions = async (permissions: string[]) => {
    await roleApi.revokePermissions(id.value, { permissions })
    await refreshPermissions()
    await refreshStats()
  }
  
  // データのリフレッシュ
  const refresh = async () => {
    await Promise.all([
      refreshRole(),
      refreshPermissions(),
      refreshStats()
    ])
  }
  
  return {
    role: readonly(role),
    permissions: readonly(permissions),
    statistics: readonly(statistics),
    pending: computed(() => rolePending.value || permissionsPending.value || statsPending.value),
    error: computed(() => roleError.value || permissionsError.value || statsError.value),
    addPermissions,
    removePermissions,
    refresh
  }
}

/**
 * ロール並び替え管理
 * Discord風のドラッグ&ドロップ対応
 */
export const useRoleReorder = () => {
  const roleApi = useRole()
  const { refresh: refreshRoleList } = useRoleList()
  
  // ロールの並び替え
  const reorderRoles = async (newPositions: Record<string, number>) => {
    try {
      await roleApi.reorderRoles({ positions: newPositions })
      // 一覧を更新
      await refreshRoleList()
    } catch (error) {
      console.error('[useRoleReorder] Failed to reorder roles:', error)
      throw error
    }
  }
  
  // ロールを上に移動
  const moveRoleUp = async (roleId: string, currentRoles: RoleResponse[]) => {
    const sortedRoles = [...currentRoles].sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
    const currentIndex = sortedRoles.findIndex(r => r.id === roleId)
    
    if (currentIndex > 0) {
      const targetRole = sortedRoles[currentIndex]
      const aboveRole = sortedRoles[currentIndex - 1]
      
      if (targetRole && aboveRole) {
        const newPositions: Record<string, number> = {
          [targetRole.id]: (aboveRole.position ?? 0) + 1,
          [aboveRole.id]: targetRole.position ?? 0
        }
        
        await reorderRoles(newPositions)
      }
    }
  }
  
  // ロールを下に移動
  const moveRoleDown = async (roleId: string, currentRoles: RoleResponse[]) => {
    const sortedRoles = [...currentRoles].sort((a, b) => (b.position ?? 0) - (a.position ?? 0))
    const currentIndex = sortedRoles.findIndex(r => r.id === roleId)
    
    if (currentIndex >= 0 && currentIndex < sortedRoles.length - 1) {
      const targetRole = sortedRoles[currentIndex]
      const belowRole = sortedRoles[currentIndex + 1]
      
      if (targetRole && belowRole) {
        const newPositions: Record<string, number> = {
          [targetRole.id]: (belowRole.position ?? 0) - 1,
          [belowRole.id]: targetRole.position ?? 0
        }
        
        await reorderRoles(newPositions)
      }
    }
  }
  
  return {
    reorderRoles,
    moveRoleUp,
    moveRoleDown
  }
}