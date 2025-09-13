/**
 * Central Type Definitions
 * OpenAPI型定義の中央集約
 * 
 * このファイルはOpenAPIから生成された型を一元管理します。
 * 各モジュールはここから必要な型をインポートしてください。
 */

import type { components } from './api'

// ===========================
// User Types
// ===========================
export type UserResponse = components['schemas']['UserResponse']
export type UserUpdateRequest = components['schemas']['UserUpdateRequest']
export type UserProfileResponse = components['schemas']['UserProfileResponse']
export type UserProfileUpdateRequest = components['schemas']['UserProfileUpdateRequest']
export type UserRoleAssignmentRequest = components['schemas']['UserRoleAssignmentRequest']
export type UserRoleAssignmentResult = components['schemas']['UserRoleAssignmentResult']
export type CurrentUserResponse = components['schemas']['CurrentUserResponse']
export type UserDetailResponse = components['schemas']['UserDetailResponse']
export type UserSearchResponse = components['schemas']['UserSearchResponse']
export type UserPermissionsResponse = components['schemas']['UserPermissionsResponse']

// ===========================
// Role & Permission Types
// ===========================
export type RoleResponse = components['schemas']['RoleResponse']
export type RoleCreateRequestDto = components['schemas']['RoleCreateRequestDto']
export type RoleUpdateRequest = components['schemas']['RoleUpdateRequest']
export type RoleReorderRequest = components['schemas']['RoleReorderRequest']
export type PermissionRule = components['schemas']['PermissionRule']
export type PermissionGrantRequest = components['schemas']['PermissionGrantRequest']
export type PermissionGrantResult = components['schemas']['PermissionGrantResult']
export type PermissionSyncRequest = components['schemas']['PermissionSyncRequest']
export type PermissionSyncResult = components['schemas']['PermissionSyncResult']
export type PermissionBulkDeleteRequest = components['schemas']['PermissionBulkDeleteRequest']

// ===========================
// Workspace Types
// ===========================
export type WorkspaceResponse = components['schemas']['WorkspaceResponse']
export type WorkspaceCreateRequest = components['schemas']['WorkspaceCreateRequest']
export type WorkspaceUpdateRequest = components['schemas']['WorkspaceUpdateRequest']
export type WorkspaceListResponse = components['schemas']['WorkspaceListResponse']

// ===========================
// Table & Record Types
// ===========================
export type TableResponse = components['schemas']['TableResponse']
export type TableCreateRequest = components['schemas']['TableCreateRequest']
export type TableUpdateRequest = components['schemas']['TableUpdateRequest']
export type TableListResponse = components['schemas']['TableListResponse']
export type RecordResponse = components['schemas']['RecordResponse']
export type RecordCreateRequest = components['schemas']['RecordCreateRequest']
export type RecordUpdateRequest = components['schemas']['RecordUpdateRequest']
export type RecordListResponse = components['schemas']['RecordListResponse']
export type PropertyDefinitionDto = components['schemas']['PropertyDefinitionDto']
export type PropertyAddRequest = components['schemas']['PropertyAddRequest']
export type PropertyUpdateRequest = components['schemas']['PropertyUpdateRequest']

// ===========================
// Property Value Types
// ===========================
/**
 * PropertyTypeに基づくテーブルセル値の型定義
 * すべての可能なプロパティ値を表現する共用型
 */
export type PropertyValue = 
  | string              // text, long_text, email, url, select
  | number              // number  
  | boolean             // checkbox
  | string[]            // multi_select, file
  | string | string[]   // relation (単一または複数)
  | null                // 空値

// ===========================
// Common Types
// ===========================
export type JsonObject = components['schemas']['JsonObject']
export type JsonElement = components['schemas']['JsonElement']

// Re-export components for advanced usage
export type { components }