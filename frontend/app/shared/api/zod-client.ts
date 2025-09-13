import { makeApi, Zodios, type ZodiosOptions } from '@zodios/core'
import { z } from 'zod'

const JsonElement = z.unknown()
const WorkspaceUpdateRequest = z
  .object({
    name: z.string().min(1).max(255),
    description: z.string().min(0).max(1000),
    settings: z.record(z.string(), JsonElement),
  })
  .partial()
  .strict()
  .passthrough()
const WorkspaceResponse = z
  .object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    createdBy: z.string().uuid(),
    teamId: z.string().uuid(),
    tableCount: z.number().int(),
    recordCount: z.number().int(),
    settings: z.record(z.string(), JsonElement),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .strict()
  .passthrough()
const UserProfileResponse = z
  .object({
    id: z.string().uuid(),
    userId: z.string().uuid(),
    displayName: z.string(),
    avatarUrl: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .strict()
  .passthrough()
const UserDetailResponse = z
  .object({
    id: z.string().uuid(),
    auth0Sub: z.string(),
    email: z.string(),
    profile: UserProfileResponse,
    tenantCount: z.number().int(),
    roleCount: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .strict()
  .passthrough()
const PermissionRule = z
  .object({
    resourceType: z.enum([
      'TABLE',
      'RECORD',
      'DOCUMENT',
      'DIRECTORY',
      'WORKSPACE',
      'TENANT',
      'USER',
      'ROLE',
      'PROPERTY_TYPE',
      'RESOURCE_GROUP',
      'SETTINGS',
    ]),
    action: z.enum([
      'VIEW',
      'CREATE',
      'EDIT',
      'DELETE',
      'MANAGE',
      'EXPORT',
      'IMPORT',
    ]),
    scope: z.enum(['ALL', 'TEAM', 'OWN', 'RESOURCE_GROUP', 'RESOURCE_ID']),
  })
  .partial()
  .strict()
  .passthrough()
const GeneralRule = PermissionRule
const ResourceGroupRule = PermissionRule.and(
  z.object({ groupId: z.string().uuid() }).partial().strict().passthrough()
)
const ResourceIdRule = PermissionRule.and(
  z.object({ resourceId: z.string().uuid() }).partial().strict().passthrough()
)
const CurrentUserResponse = z
  .object({
    user: UserDetailResponse,
    currentTenantId: z.string().uuid(),
    permissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
  })
  .partial()
  .strict()
  .passthrough()
const UserUpdateRequest = z
  .object({ email: z.string().min(1).email() })
  .strict()
  .passthrough()
const UserResponse = z
  .object({
    id: z.string().uuid(),
    auth0Sub: z.string(),
    email: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .strict()
  .passthrough()
const UserProfileUpdateRequest = z
  .object({
    displayName: z.string().min(0).max(255),
    avatarUrl: z.string().min(0).max(500),
  })
  .partial()
  .strict()
  .passthrough()
const RoleResponse = z
  .object({
    id: z.string().uuid(),
    tenantId: z.string().uuid(),
    name: z.string(),
    displayName: z.string(),
    color: z.string(),
    position: z.number().int(),
    permissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
    userCount: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    system: z.boolean(),
  })
  .partial()
  .strict()
  .passthrough()
const UserRoleAssignmentRequest = z
  .object({ roleIds: z.array(z.string().uuid()) })
  .partial()
  .strict()
  .passthrough()
const FailedRoleAssignment = z
  .object({ roleId: z.string().uuid(), reason: z.string() })
  .partial()
  .strict()
  .passthrough()
const UserRoleAssignmentResult = z
  .object({
    userId: z.string().uuid(),
    assignedRoles: z.array(z.string().uuid()),
    failedRoles: z.array(FailedRoleAssignment),
    totalAssigned: z.number().int(),
  })
  .partial()
  .strict()
  .passthrough()
const TenantResponse = z
  .object({
    id: z.string().uuid(),
    slug: z.string(),
    name: z.string(),
    auth0OrgId: z.string(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    active: z.boolean(),
  })
  .partial()
  .strict()
  .passthrough()
const UpdateTenantRequest = z
  .object({ name: z.string().min(1).max(255) })
  .strict()
  .passthrough()
const PropertyDefinitionDto = z
  .object({
    key: z.string().min(1).max(50),
    type: z.enum([
      'text',
      'long_text',
      'number',
      'checkbox',
      'date',
      'datetime',
      'select',
      'multi_select',
      'email',
      'url',
      'file',
      'relation',
    ]),
    displayName: z.string().min(1).max(255),
    config: z.record(z.string(), JsonElement).optional(),
    required: z.boolean().optional(),
    defaultValue: JsonElement.optional(),
    description: z.string().optional(),
  })
  .strict()
  .passthrough()
const TableResponse = z
  .object({
    id: z.string().uuid(),
    workspaceId: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    properties: z.record(z.string(), PropertyDefinitionDto),
    propertyOrder: z.array(z.string()),
    recordCount: z.number().int(),
    icon: z.string(),
    color: z.string(),
    settings: z.record(z.string(), JsonElement),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    orderedProperties: z.array(PropertyDefinitionDto),
  })
  .partial()
  .strict()
  .passthrough()
const TableUpdateRequest = z
  .object({
    name: z.string().min(1).max(255),
    description: z.string().min(0).max(1000),
    propertyOrder: z.array(z.string()),
    icon: z.string(),
    color: z.string(),
    settings: z.record(z.string(), JsonElement),
  })
  .partial()
  .strict()
  .passthrough()
const PropertyUpdateRequest = z
  .object({
    displayName: z.string(),
    config: z.record(z.string(), JsonElement),
    required: z.boolean(),
    defaultValue: JsonElement,
    description: z.string(),
  })
  .partial()
  .strict()
  .passthrough()
const PropertyReorderRequest = z
  .object({ order: z.array(z.string()).min(1).max(2147483647) })
  .strict()
  .passthrough()
const PermissionSyncRequest = z
  .object({
    permissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
  })
  .partial()
  .strict()
  .passthrough()
const PermissionSyncResult = z
  .object({
    added: z.array(z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])),
    removed: z.array(z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])),
    unchanged: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
  })
  .partial()
  .strict()
  .passthrough()
const PermissionGrantRequest = z
  .object({
    permissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
  })
  .partial()
  .strict()
  .passthrough()
const FailedPermissionGrant = z
  .object({
    permission: z.union([GeneralRule, ResourceGroupRule, ResourceIdRule]),
    reason: z.string(),
  })
  .partial()
  .strict()
  .passthrough()
const PermissionGrantResult = z
  .object({
    roleId: z.string().uuid(),
    granted: z.array(z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])),
    failed: z.array(FailedPermissionGrant),
    totalGranted: z.number().int(),
  })
  .partial()
  .strict()
  .passthrough()
const PermissionBulkDeleteRequest = z
  .object({
    permissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
  })
  .partial()
  .strict()
  .passthrough()
const RoleUpdateRequest = z
  .object({
    displayName: z.string(),
    color: z.string(),
    position: z.number().int(),
  })
  .partial()
  .strict()
  .passthrough()
const RolePositionUpdate = z
  .object({ roleId: z.string().uuid(), position: z.number().int() })
  .partial()
  .strict()
  .passthrough()
const RoleReorderRequest = z
  .object({ positions: z.array(RolePositionUpdate) })
  .partial()
  .strict()
  .passthrough()
const RecordResponse = z
  .object({
    id: z.string().uuid(),
    tableId: z.string().uuid(),
    data: z.record(z.string(), JsonElement),
    position: z.number(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    primaryFieldValue: JsonElement,
  })
  .partial()
  .strict()
  .passthrough()
const JsonObject = z.record(z.string(), JsonElement)
const RecordUpdateRequest = z
  .object({ data: JsonObject, merge: z.boolean().optional() })
  .strict()
  .passthrough()
const RecordMoveRequest = z
  .object({
    afterRecordId: z.string().uuid(),
    beforeRecordId: z.string().uuid(),
    movingToFirst: z.boolean(),
    movingToLast: z.boolean(),
  })
  .partial()
  .strict()
  .passthrough()
const RecordReorderRequest = z
  .object({ recordIds: z.array(z.string().uuid()) })
  .strict()
  .passthrough()
const RecordListResponse = z
  .object({
    records: z.array(RecordResponse),
    totalCount: z.number().int(),
    tableId: z.string().uuid(),
  })
  .partial()
  .strict()
  .passthrough()
const RecordBulkFieldUpdateRequest = z
  .object({
    recordIds: z.array(z.string().uuid()).min(1).max(1000),
    field: z.string(),
    value: JsonElement.optional(),
    clearingField: z.boolean().optional(),
  })
  .strict()
  .passthrough()
const RecordValidationError = z
  .object({ field: z.string(), message: z.string(), value: z.unknown() })
  .partial()
  .strict()
  .passthrough()
const RecordBatchError = z
  .object({
    recordId: z.string().uuid(),
    index: z.number().int(),
    data: z.record(z.string(), JsonElement),
    error: z.string(),
    validationErrors: z.array(RecordValidationError),
  })
  .partial()
  .strict()
  .passthrough()
const RecordBatchResponse = z
  .object({
    succeeded: z.array(RecordResponse),
    failed: z.array(RecordBatchError),
    totalProcessed: z.number().int(),
    successCount: z.number().int(),
    failureCount: z.number().int(),
    completeSuccess: z.boolean(),
    completeFailure: z.boolean(),
    partialSuccess: z.boolean(),
    successRate: z.number(),
  })
  .partial()
  .strict()
  .passthrough()
const RecordBatchUpdateRequest = z
  .object({
    updates: z.record(z.string(), JsonObject),
    merge: z.boolean().optional(),
    batchSize: z.number().int().optional(),
    recordIds: z.array(z.string().uuid()).optional(),
  })
  .strict()
  .passthrough()
const RecordBatchCreateRequest = z
  .object({
    tableId: z.string().uuid(),
    records: z.array(JsonObject).min(1).max(1000),
    batchSize: z.number().int().optional(),
    withinSizeLimit: z.boolean().optional(),
  })
  .strict()
  .passthrough()
const RecordBatchDeleteRequest = z
  .object({
    recordIds: z.array(z.string().uuid()).min(1).max(1000),
    batchSize: z.number().int().optional(),
  })
  .strict()
  .passthrough()
const WorkspaceListResponse = z
  .object({
    workspaces: z.array(WorkspaceResponse),
    totalCount: z.number().int(),
    hasMore: z.boolean(),
  })
  .partial()
  .strict()
  .passthrough()
const WorkspaceCreateRequest = z
  .object({
    name: z.string().min(1).max(255),
    description: z.string().min(0).max(1000).optional(),
    settings: z.record(z.string(), JsonElement).optional(),
    validName: z.boolean().optional(),
  })
  .strict()
  .passthrough()
const CreateTenantRequest = z
  .object({
    slug: z
      .string()
      .min(3)
      .max(100)
      .regex(/^[a-z0-9-]+$/),
    name: z.string().min(1).max(255),
    auth0OrgId: z.string().min(0).max(255).optional(),
  })
  .strict()
  .passthrough()
const TableCreateRequest = z
  .object({
    workspaceId: z.string().uuid(),
    name: z.string().min(1).max(255),
    description: z.string().min(0).max(1000).optional(),
    properties: z.array(PropertyDefinitionDto).optional(),
    templateName: z.string().optional(),
    icon: z.string().optional(),
    color: z.string().optional(),
    propertiesMap: z.record(z.string(), PropertyDefinitionDto).optional(),
  })
  .strict()
  .passthrough()
const PropertyAddRequest = z
  .object({
    definition: PropertyDefinitionDto,
    position: z.number().int().optional(),
  })
  .strict()
  .passthrough()
const TableImportRequest = z
  .object({
    format: z.string(),
    records: z.array(JsonObject).optional(),
    csvData: z.string().optional(),
    skipHeader: z.boolean().optional(),
    fieldMapping: z.record(z.string(), JsonElement).optional(),
    updateExisting: z.boolean().optional(),
    upsertKey: z.string().optional(),
    upsert: z.boolean().optional(),
  })
  .strict()
  .passthrough()
const ImportError = z
  .object({
    row: z.number().int(),
    field: z.string(),
    value: z.unknown(),
    message: z.string(),
    recordData: z.record(z.string(), JsonElement),
  })
  .partial()
  .strict()
  .passthrough()
const TableImportResponse = z
  .object({
    tableId: z.string().uuid(),
    tableName: z.string(),
    importedCount: z.number().int(),
    updatedCount: z.number().int(),
    failedCount: z.number().int(),
    errors: z.array(ImportError),
    importedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .strict()
  .passthrough()
const TableDuplicateRequest = z
  .object({
    name: z.string().min(1),
    includeRecords: z.boolean().optional(),
    targetWorkspaceId: z.string().uuid().optional(),
  })
  .strict()
  .passthrough()
const RoleCreateRequestDto = z
  .object({
    name: z.string(),
    displayName: z.string(),
    color: z.string(),
    position: z.number().int(),
    permissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
  })
  .partial()
  .strict()
  .passthrough()
const InvalidPermission = z
  .object({ input: z.string(), reason: z.string() })
  .partial()
  .strict()
  .passthrough()
const PermissionWarning = z
  .object({
    rule: z.union([GeneralRule, ResourceGroupRule, ResourceIdRule]),
    message: z.string(),
  })
  .partial()
  .strict()
  .passthrough()
const PermissionValidationResult = z
  .object({
    valid: z.array(z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])),
    invalid: z.array(InvalidPermission),
    warnings: z.array(PermissionWarning),
  })
  .partial()
  .strict()
  .passthrough()
const PermissionCopyRequest = z
  .object({ overwrite: z.boolean() })
  .partial()
  .strict()
  .passthrough()
const RoleDuplicateRequest = z
  .object({ newName: z.string(), includePermissions: z.boolean() })
  .partial()
  .strict()
  .passthrough()
const RecordCreateRequest = z
  .object({
    tableId: z.string().uuid(),
    data: JsonObject,
    position: z.number().optional(),
  })
  .strict()
  .passthrough()
const RecordValidateRequest = z
  .object({
    tableId: z.string().uuid(),
    data: JsonObject,
    recordId: z.string().uuid().optional(),
    partial: z.boolean().optional(),
    partialValidation: z.boolean().optional(),
    fullValidation: z.boolean().optional(),
  })
  .strict()
  .passthrough()
const RecordValidationWarning = z
  .object({
    field: z.string(),
    message: z.string(),
    suggestedValue: JsonElement,
  })
  .partial()
  .strict()
  .passthrough()
const RecordValidationResponse = z
  .object({
    valid: z.boolean(),
    errors: z.array(RecordValidationError),
    warnings: z.array(RecordValidationWarning),
    processedData: z.record(z.string(), JsonElement),
  })
  .partial()
  .strict()
  .passthrough()
const RecordSearchFilter = z
  .object({
    field: z.string(),
    operator: z.enum([
      'eq',
      'neq',
      'gt',
      'gte',
      'lt',
      'lte',
      'between',
      'in',
      'not_in',
      'contains',
      'starts_with',
      'ends_with',
      'is_null',
      'is_not_null',
    ]),
    value: JsonElement,
    values: z.array(JsonElement),
    rangeFilter: z.boolean(),
    textFilter: z.boolean(),
  })
  .partial()
  .strict()
  .passthrough()
const RecordSortRequest = z
  .object({ field: z.string(), direction: z.enum(['asc', 'desc']) })
  .partial()
  .strict()
  .passthrough()
const RecordSearchRequest = z
  .object({
    query: z.string(),
    filters: z.array(RecordSearchFilter),
    fields: z.array(z.string()),
    sort: z.array(RecordSortRequest),
    limit: z.number().int().lte(1000),
    includeArchived: z.boolean(),
  })
  .partial()
  .strict()
  .passthrough()
const RecordFilterRequest = z
  .object({
    filters: z.record(z.string(), JsonElement),
    sort: RecordSortRequest,
    fields: z.array(z.string()),
  })
  .partial()
  .strict()
  .passthrough()
const PageResponseRecordResponse = z
  .object({
    content: z.array(RecordResponse),
    page: z.number().int(),
    size: z.number().int(),
    totalElements: z.number().int(),
    totalPages: z.number().int(),
    first: z.boolean(),
    last: z.boolean(),
    numberOfElements: z.number().int(),
  })
  .partial()
  .strict()
  .passthrough()
const RecordCopyRequest = z
  .object({
    recordIds: z.array(z.string().uuid()).min(1).max(100),
    targetTableId: z.string().uuid().optional(),
    includeData: z.boolean().optional(),
    fieldMapping: z.record(z.string(), z.string()).optional(),
    crossTableCopy: z.boolean().optional(),
  })
  .strict()
  .passthrough()
const RecordCopyResponse = z
  .object({
    originalIds: z.array(z.string().uuid()),
    copiedRecords: z.array(RecordResponse),
    mapping: z.record(z.string(), z.string().uuid()),
    copyCount: z.number().int(),
  })
  .partial()
  .strict()
  .passthrough()
const UserProfileDto = z
  .object({ displayName: z.string(), email: z.string(), avatarUrl: z.string() })
  .partial()
  .strict()
  .passthrough()
const SetupRequest = z
  .object({
    tenantName: z.string(),
    tenantType: z.enum(['PERSONAL', 'TEAM', 'ENTERPRISE']),
    userProfile: UserProfileDto,
  })
  .partial()
  .strict()
  .passthrough()
const TenantDto = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    type: z.enum(['PERSONAL', 'TEAM', 'ENTERPRISE']),
    orgId: z.string(),
    active: z.boolean(),
  })
  .partial()
  .strict()
  .passthrough()
const UserDto = z
  .object({
    id: z.string().uuid(),
    auth0Sub: z.string(),
    email: z.string(),
    displayName: z.string(),
    avatarUrl: z.string(),
    active: z.boolean(),
  })
  .partial()
  .strict()
  .passthrough()
const SetupResponse = z
  .object({
    userId: z.string().uuid(),
    tenantId: z.string().uuid(),
    tenantUserId: z.string().uuid(),
    tenant: TenantDto,
    user: UserDto,
    message: z.string(),
  })
  .partial()
  .strict()
  .passthrough()
const SimpleSetupResponse = z
  .object({
    userId: z.string().uuid(),
    tenantId: z.string().uuid(),
    tenantName: z.string(),
    success: z.boolean(),
    message: z.string(),
  })
  .partial()
  .strict()
  .passthrough()
const WorkspaceStatistics = z
  .object({
    totalTables: z.number().int(),
    totalRecords: z.number().int(),
    totalUsers: z.number().int(),
    storageUsed: z.number().int(),
    lastActivity: z.string().datetime({ offset: true }),
  })
  .partial()
  .strict()
  .passthrough()
const UserSearchResponse = z
  .object({
    users: z.array(UserResponse),
    totalCount: z.number().int(),
    hasMore: z.boolean(),
  })
  .partial()
  .strict()
  .passthrough()
const RolePermissions = z
  .object({
    roleName: z.string(),
    permissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
  })
  .partial()
  .strict()
  .passthrough()
const UserPermissionsResponse = z
  .object({
    userId: z.string().uuid(),
    tenantUserId: z.string().uuid(),
    roles: z.array(RoleResponse),
    effectivePermissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
    permissionsByRole: z.array(RolePermissions),
  })
  .partial()
  .strict()
  .passthrough()
const FrequencyItem = z
  .object({
    value: z.unknown(),
    count: z.number().int(),
    percentage: z.number(),
  })
  .partial()
  .strict()
  .passthrough()
const FieldStatistics = z
  .object({
    fieldKey: z.string(),
    fieldType: z.string(),
    totalCount: z.number().int(),
    nonNullCount: z.number().int(),
    nullCount: z.number().int(),
    fillRate: z.number(),
    uniqueCount: z.number().int(),
    minValue: z.unknown(),
    maxValue: z.unknown(),
    avgValue: z.number(),
    mostFrequent: z.array(FrequencyItem),
  })
  .partial()
  .strict()
  .passthrough()
const TableStatisticsResponse = z
  .object({
    tableId: z.string().uuid(),
    tableName: z.string(),
    recordCount: z.number().int(),
    propertyCount: z.number().int(),
    fieldStatistics: z.array(FieldStatistics),
    storageSize: z.number().int(),
    createdAt: z.string().datetime({ offset: true }),
    updatedAt: z.string().datetime({ offset: true }),
    lastRecordCreatedAt: z.string().datetime({ offset: true }),
    lastRecordUpdatedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .strict()
  .passthrough()
const TableSchemaResponse = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    description: z.string(),
    properties: z.record(z.string(), PropertyDefinitionDto),
    propertyOrder: z.array(z.string()),
    version: z.string(),
    exportedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .strict()
  .passthrough()
const TableExportResponse = z
  .object({
    tableId: z.string().uuid(),
    tableName: z.string(),
    format: z.string(),
    schema: TableSchemaResponse,
    records: z.array(JsonObject),
    data: z.string(),
    recordCount: z.number().int(),
    exportedAt: z.string().datetime({ offset: true }),
  })
  .partial()
  .strict()
  .passthrough()
const TableListResponse = z
  .object({ tables: z.array(TableResponse), totalCount: z.number().int() })
  .partial()
  .strict()
  .passthrough()
const EffectivePermissionsResponse = z
  .object({
    directPermissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
    effectivePermissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
  })
  .partial()
  .strict()
  .passthrough()
const RolePermissionDiff = z
  .object({
    onlyInFirst: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
    onlyInSecond: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
    common: z.array(z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])),
  })
  .partial()
  .strict()
  .passthrough()
const PermissionCheckResult = z
  .object({
    rule: z.union([GeneralRule, ResourceGroupRule, ResourceIdRule]),
    hasPermission: z.boolean(),
    matchedBy: z.string(),
  })
  .partial()
  .strict()
  .passthrough()
const WorkspaceDto = z
  .object({
    id: z.string().uuid(),
    name: z.string(),
    displayName: z.string(),
    role: z.string(),
    lastAccessedAt: z.string().datetime({ offset: true }),
    active: z.boolean(),
  })
  .partial()
  .strict()
  .passthrough()
const MyWorkspacesResponse = z
  .object({
    workspaces: z.array(WorkspaceDto),
    totalCount: z.number().int(),
    activeCount: z.number().int(),
  })
  .partial()
  .strict()
  .passthrough()
const AuthTestResponse = z
  .object({
    message: z.string(),
    endpoint: z.string(),
    userRoles: z.array(RoleResponse),
    userId: z.string(),
    testResult: z.enum([
      'SUCCESS',
      'FAILED',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
    ]),
  })
  .partial()
  .strict()
  .passthrough()
const PublicTestResponse = z
  .object({
    message: z.string(),
    endpoint: z.string(),
    testResult: z.enum([
      'SUCCESS',
      'FAILED',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
    ]),
  })
  .partial()
  .strict()
  .passthrough()
const PermissionTestResponse = z
  .object({
    message: z.string(),
    endpoint: z.string(),
    requiredPermission: z.union([
      GeneralRule,
      ResourceGroupRule,
      ResourceIdRule,
    ]),
    userPermissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
    hasRequiredPermission: z.boolean(),
    userId: z.string(),
    testResult: z.enum([
      'SUCCESS',
      'FAILED',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
    ]),
  })
  .partial()
  .strict()
  .passthrough()
const MultiPermissionTestResponse = z
  .object({
    message: z.string(),
    endpoint: z.string(),
    requiredPermissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
    userPermissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
    matchedPermissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
    hasAnyRequiredPermission: z.boolean(),
    userId: z.string(),
    testResult: z.enum([
      'SUCCESS',
      'FAILED',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
    ]),
  })
  .partial()
  .strict()
  .passthrough()
const HybridAuthTestResponse = z
  .object({
    message: z.string(),
    endpoint: z.string(),
    authMethod: z.string(),
    userRoles: z.array(RoleResponse),
    userPermissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
    userId: z.string(),
    testResult: z.enum([
      'SUCCESS',
      'FAILED',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
    ]),
  })
  .partial()
  .strict()
  .passthrough()
const AuthenticatedTestResponse = z
  .object({
    message: z.string(),
    endpoint: z.string(),
    userRoles: z.array(RoleResponse),
    userPermissions: z.array(
      z.union([GeneralRule, ResourceGroupRule, ResourceIdRule])
    ),
    userId: z.string(),
    testResult: z.enum([
      'SUCCESS',
      'FAILED',
      'UNAUTHORIZED',
      'FORBIDDEN',
      'NOT_FOUND',
    ]),
  })
  .partial()
  .strict()
  .passthrough()
const UserTenantDto = z
  .object({
    tenantId: z.string().uuid(),
    tenantName: z.string(),
    orgId: z.string(),
    roles: z.array(z.string()),
    joinedAt: z.string(),
    active: z.boolean(),
  })
  .partial()
  .strict()
  .passthrough()
const MyTenantsResponse = z
  .object({
    tenants: z.array(UserTenantDto),
    defaultTenantId: z.string().uuid(),
  })
  .partial()
  .strict()
  .passthrough()
const JwtClaimsResponse = z
  .object({
    sub: z.string(),
    email: z.string(),
    emailVerified: z.boolean(),
    name: z.string(),
    picture: z.string(),
    aud: z.array(z.string()),
    iss: z.string(),
    iat: z.string().datetime({ offset: true }),
    exp: z.string().datetime({ offset: true }),
    scope: z.string(),
  })
  .partial()
  .strict()
  .passthrough()
const AuthenticatedContextDto = z
  .object({
    auth0Sub: z.string(),
    userId: z.string().uuid(),
    tenantUserId: z.string().uuid(),
    tenantId: z.string().uuid(),
    roles: z.array(z.string()),
    email: z.string(),
    active: z.boolean(),
  })
  .partial()
  .strict()
  .passthrough()
const RawJwtClaimsDto = z
  .object({
    orgId: z.string(),
    customTenantId: z.string(),
    roles: z.array(z.string()),
  })
  .partial()
  .strict()
  .passthrough()
const BusinessContextResponse = z
  .object({
    authenticatedContext: AuthenticatedContextDto,
    springSecurityAuthorities: z.array(z.string()),
    rawJwtClaims: RawJwtClaimsDto,
  })
  .partial()
  .strict()
  .passthrough()

export const schemas = {
  JsonElement,
  WorkspaceUpdateRequest,
  WorkspaceResponse,
  UserProfileResponse,
  UserDetailResponse,
  PermissionRule,
  GeneralRule,
  ResourceGroupRule,
  ResourceIdRule,
  CurrentUserResponse,
  UserUpdateRequest,
  UserResponse,
  UserProfileUpdateRequest,
  RoleResponse,
  UserRoleAssignmentRequest,
  FailedRoleAssignment,
  UserRoleAssignmentResult,
  TenantResponse,
  UpdateTenantRequest,
  PropertyDefinitionDto,
  TableResponse,
  TableUpdateRequest,
  PropertyUpdateRequest,
  PropertyReorderRequest,
  PermissionSyncRequest,
  PermissionSyncResult,
  PermissionGrantRequest,
  FailedPermissionGrant,
  PermissionGrantResult,
  PermissionBulkDeleteRequest,
  RoleUpdateRequest,
  RolePositionUpdate,
  RoleReorderRequest,
  RecordResponse,
  JsonObject,
  RecordUpdateRequest,
  RecordMoveRequest,
  RecordReorderRequest,
  RecordListResponse,
  RecordBulkFieldUpdateRequest,
  RecordValidationError,
  RecordBatchError,
  RecordBatchResponse,
  RecordBatchUpdateRequest,
  RecordBatchCreateRequest,
  RecordBatchDeleteRequest,
  WorkspaceListResponse,
  WorkspaceCreateRequest,
  CreateTenantRequest,
  TableCreateRequest,
  PropertyAddRequest,
  TableImportRequest,
  ImportError,
  TableImportResponse,
  TableDuplicateRequest,
  RoleCreateRequestDto,
  InvalidPermission,
  PermissionWarning,
  PermissionValidationResult,
  PermissionCopyRequest,
  RoleDuplicateRequest,
  RecordCreateRequest,
  RecordValidateRequest,
  RecordValidationWarning,
  RecordValidationResponse,
  RecordSearchFilter,
  RecordSortRequest,
  RecordSearchRequest,
  RecordFilterRequest,
  PageResponseRecordResponse,
  RecordCopyRequest,
  RecordCopyResponse,
  UserProfileDto,
  SetupRequest,
  TenantDto,
  UserDto,
  SetupResponse,
  SimpleSetupResponse,
  WorkspaceStatistics,
  UserSearchResponse,
  RolePermissions,
  UserPermissionsResponse,
  FrequencyItem,
  FieldStatistics,
  TableStatisticsResponse,
  TableSchemaResponse,
  TableExportResponse,
  TableListResponse,
  EffectivePermissionsResponse,
  RolePermissionDiff,
  PermissionCheckResult,
  WorkspaceDto,
  MyWorkspacesResponse,
  AuthTestResponse,
  PublicTestResponse,
  PermissionTestResponse,
  MultiPermissionTestResponse,
  HybridAuthTestResponse,
  AuthenticatedTestResponse,
  UserTenantDto,
  MyTenantsResponse,
  JwtClaimsResponse,
  AuthenticatedContextDto,
  RawJwtClaimsDto,
  BusinessContextResponse,
}

const endpoints = makeApi([
  {
    method: 'get',
    path: '/api/v1/auth/business-context',
    alias: 'getBusinessContext',
    requestFormat: 'json',
    response: BusinessContextResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/claims',
    alias: 'getJwtClaims',
    requestFormat: 'json',
    response: JwtClaimsResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/me',
    alias: 'getCurrentUser_1',
    requestFormat: 'json',
    response: z.object({}).partial().strict().passthrough(),
  },
  {
    method: 'post',
    path: '/api/v1/auth/setup',
    alias: 'completeSetup',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: SetupRequest,
      },
    ],
    response: SetupResponse,
  },
  {
    method: 'post',
    path: '/api/v1/auth/setup/create-default-workspace',
    alias: 'createDefaultWorkspace_1',
    requestFormat: 'json',
    response: SimpleSetupResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/setup/my-tenants',
    alias: 'getMyTenants_1',
    requestFormat: 'json',
    response: MyTenantsResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/test/admin-only',
    alias: 'adminOnly',
    requestFormat: 'json',
    response: AuthTestResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/test/admin-or-user',
    alias: 'adminOrUser',
    requestFormat: 'json',
    response: AuthTestResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/test/authenticated',
    alias: 'authenticatedEndpoint',
    requestFormat: 'json',
    response: AuthenticatedTestResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/test/hybrid/table-create',
    alias: 'tableCreateHybrid',
    requestFormat: 'json',
    response: HybridAuthTestResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/test/permission/any-view',
    alias: 'anyView',
    requestFormat: 'json',
    response: MultiPermissionTestResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/test/permission/document-edit-own',
    alias: 'documentEditOwn',
    requestFormat: 'json',
    response: PermissionTestResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/test/permission/document-view-team',
    alias: 'documentViewTeam',
    requestFormat: 'json',
    response: PermissionTestResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/test/permission/settings-manage',
    alias: 'settingsManage',
    requestFormat: 'json',
    response: PermissionTestResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/test/permission/table-delete',
    alias: 'tableDelete',
    requestFormat: 'json',
    response: PermissionTestResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/test/permission/table-view',
    alias: 'tableView',
    requestFormat: 'json',
    response: PermissionTestResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/test/public',
    alias: 'publicEndpoint',
    requestFormat: 'json',
    response: PublicTestResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/test/user-only',
    alias: 'userOnly',
    requestFormat: 'json',
    response: AuthTestResponse,
  },
  {
    method: 'get',
    path: '/api/v1/auth/test/viewer-only',
    alias: 'viewerOnly',
    requestFormat: 'json',
    response: AuthTestResponse,
  },
  {
    method: 'get',
    path: '/api/v1/my-tenants',
    alias: 'getMyTenants',
    description: `Legacy endpoint - use /my-workspaces instead`,
    requestFormat: 'json',
    response: MyWorkspacesResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: MyWorkspacesResponse,
      },
      {
        status: 403,
        description: `Forbidden`,
        schema: MyWorkspacesResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/my-workspaces',
    alias: 'getMyWorkspaces',
    description: `Gets all workspaces/tenants accessible to the authenticated user`,
    requestFormat: 'json',
    response: MyWorkspacesResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized - authentication required`,
        schema: MyWorkspacesResponse,
      },
      {
        status: 403,
        description: `Forbidden - setup mode users cannot access workspaces`,
        schema: MyWorkspacesResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/api/v1/records',
    alias: 'createRecord',
    description: `Creates a new record in a table`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RecordCreateRequest,
      },
    ],
    response: RecordResponse,
    errors: [
      {
        status: 400,
        description: `Invalid record data`,
        schema: RecordResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: RecordResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: RecordResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: RecordResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/records/:id',
    alias: 'getRecord',
    description: `Retrieves a specific record by ID`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Record ID'),
      },
    ],
    response: RecordResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: RecordResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: RecordResponse,
      },
      {
        status: 404,
        description: `Record not found`,
        schema: RecordResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/api/v1/records/:id',
    alias: 'updateRecord',
    description: `Updates an existing record`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RecordUpdateRequest,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Record ID'),
      },
    ],
    response: RecordResponse,
    errors: [
      {
        status: 400,
        description: `Invalid record data`,
        schema: RecordResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: RecordResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: RecordResponse,
      },
      {
        status: 404,
        description: `Record not found`,
        schema: RecordResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/api/v1/records/:id',
    alias: 'deleteRecord',
    description: `Permanently deletes a record`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Record ID'),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Access denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Record not found`,
        schema: z.void(),
      },
    ],
  },
  {
    method: 'put',
    path: '/api/v1/records/:id/move',
    alias: 'moveRecord',
    description: `Changes the position of a record`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RecordMoveRequest,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Record ID'),
      },
    ],
    response: RecordResponse,
    errors: [
      {
        status: 400,
        description: `Invalid move request`,
        schema: RecordResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: RecordResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: RecordResponse,
      },
      {
        status: 404,
        description: `Record not found`,
        schema: RecordResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/api/v1/records/batch',
    alias: 'updateRecordsBatch',
    description: `Updates multiple records in a single operation`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RecordBatchUpdateRequest,
      },
    ],
    response: RecordListResponse,
    errors: [
      {
        status: 400,
        description: `Invalid record data or batch size exceeded`,
        schema: RecordListResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: RecordListResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: RecordListResponse,
      },
      {
        status: 404,
        description: `One or more records not found`,
        schema: RecordListResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/api/v1/records/batch',
    alias: 'createRecordsBatch',
    description: `Creates multiple records in a single operation`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RecordBatchCreateRequest,
      },
    ],
    response: RecordListResponse,
    errors: [
      {
        status: 400,
        description: `Invalid record data or batch size exceeded`,
        schema: RecordListResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: RecordListResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: RecordListResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: RecordListResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/api/v1/records/batch',
    alias: 'deleteRecordsBatch',
    description: `Deletes multiple records in a single operation`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RecordBatchDeleteRequest,
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 400,
        description: `Invalid request or batch size exceeded`,
        schema: z.void(),
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Access denied`,
        schema: z.void(),
      },
    ],
  },
  {
    method: 'put',
    path: '/api/v1/records/bulk-field-update',
    alias: 'bulkUpdateField',
    description: `Updates a specific field across multiple records`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RecordBulkFieldUpdateRequest,
      },
    ],
    response: RecordBatchResponse,
    errors: [
      {
        status: 400,
        description: `Invalid request or exceeds batch limit`,
        schema: RecordBatchResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: RecordBatchResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: RecordBatchResponse,
      },
      {
        status: 404,
        description: `Record not found`,
        schema: RecordBatchResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/api/v1/records/copy',
    alias: 'copyRecords',
    description: `Copies one or more records within or across tables`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RecordCopyRequest,
      },
    ],
    response: RecordCopyResponse,
    errors: [
      {
        status: 400,
        description: `Invalid request or exceeds copy limit`,
        schema: RecordCopyResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: RecordCopyResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: RecordCopyResponse,
      },
      {
        status: 404,
        description: `Record or table not found`,
        schema: RecordCopyResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/records/table/:tableId',
    alias: 'listRecords',
    description: `Retrieves records from a table with pagination`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'tableId',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
      {
        name: 'page',
        type: 'Query',
        schema: z
          .number()
          .int()
          .describe('Page number (0-based)')
          .optional()
          .default(0),
      },
      {
        name: 'size',
        type: 'Query',
        schema: z.number().int().describe('Page size').optional().default(20),
      },
      {
        name: 'sortBy',
        type: 'Query',
        schema: z.string().describe('Sort field').optional(),
      },
      {
        name: 'sortDirection',
        type: 'Query',
        schema: z
          .string()
          .describe('Sort direction (ASC/DESC)')
          .optional()
          .default('ASC'),
      },
    ],
    response: PageResponseRecordResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: PageResponseRecordResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: PageResponseRecordResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: PageResponseRecordResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/api/v1/records/table/:tableId/clear',
    alias: 'clearTable',
    description: `Removes all records from a table`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'tableId',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
      {
        name: 'confirm',
        type: 'Query',
        schema: z.boolean().describe('Confirmation flag'),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Access denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Table not found`,
        schema: z.void(),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/records/table/:tableId/count',
    alias: 'countRecords',
    description: `Gets the total number of records in a table`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'tableId',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
    ],
    response: z.record(z.string(), z.number().int()),
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: z.record(z.string(), z.number().int()),
      },
      {
        status: 403,
        description: `Access denied`,
        schema: z.record(z.string(), z.number().int()),
      },
      {
        status: 404,
        description: `Table not found`,
        schema: z.record(z.string(), z.number().int()),
      },
    ],
  },
  {
    method: 'post',
    path: '/api/v1/records/table/:tableId/filter',
    alias: 'filterRecords',
    description: `Searches and filters records based on criteria`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RecordFilterRequest,
      },
      {
        name: 'tableId',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
      {
        name: 'page',
        type: 'Query',
        schema: z
          .number()
          .int()
          .describe('Page number (0-based)')
          .optional()
          .default(0),
      },
      {
        name: 'size',
        type: 'Query',
        schema: z.number().int().describe('Page size').optional().default(20),
      },
    ],
    response: PageResponseRecordResponse,
    errors: [
      {
        status: 400,
        description: `Invalid filter criteria`,
        schema: PageResponseRecordResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: PageResponseRecordResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: PageResponseRecordResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: PageResponseRecordResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/records/table/:tableId/paged',
    alias: 'getRecordsPaged',
    description: `Retrieves records with advanced pagination support`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'tableId',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
      {
        name: 'page',
        type: 'Query',
        schema: z
          .number()
          .int()
          .describe('Page number (0-based)')
          .optional()
          .default(0),
      },
      {
        name: 'size',
        type: 'Query',
        schema: z.number().int().describe('Page size').optional().default(20),
      },
      {
        name: 'sortBy',
        type: 'Query',
        schema: z.string().describe('Sort field').optional(),
      },
      {
        name: 'sortDirection',
        type: 'Query',
        schema: z
          .string()
          .describe('Sort direction (ASC/DESC)')
          .optional()
          .default('ASC'),
      },
    ],
    response: PageResponseRecordResponse,
    errors: [
      {
        status: 400,
        description: `Invalid pagination parameters`,
        schema: PageResponseRecordResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: PageResponseRecordResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: PageResponseRecordResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: PageResponseRecordResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/api/v1/records/table/:tableId/reorder',
    alias: 'reorderRecords',
    description: `Sets a new order for multiple records`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RecordReorderRequest,
      },
      {
        name: 'tableId',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
    ],
    response: RecordListResponse,
    errors: [
      {
        status: 400,
        description: `Invalid reorder request`,
        schema: RecordListResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: RecordListResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: RecordListResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: RecordListResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/api/v1/records/table/:tableId/search',
    alias: 'searchRecords',
    description: `Advanced search with complex filtering and sorting`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RecordSearchRequest,
      },
      {
        name: 'tableId',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
    ],
    response: RecordListResponse,
    errors: [
      {
        status: 400,
        description: `Invalid search parameters`,
        schema: RecordListResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: RecordListResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: RecordListResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: RecordListResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/api/v1/records/validate',
    alias: 'validateRecordData',
    description: `Validates record data against table schema without saving`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RecordValidateRequest,
      },
    ],
    response: RecordValidationResponse,
    errors: [
      {
        status: 400,
        description: `Invalid request`,
        schema: RecordValidationResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: RecordValidationResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: RecordValidationResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: RecordValidationResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/roles',
    alias: 'getRoles',
    requestFormat: 'json',
    parameters: [
      {
        name: 'includePermissions',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
      {
        name: 'includeUserCount',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
    ],
    response: z.array(RoleResponse),
  },
  {
    method: 'post',
    path: '/api/v1/roles',
    alias: 'createRole',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RoleCreateRequestDto,
      },
    ],
    response: RoleResponse,
  },
  {
    method: 'get',
    path: '/api/v1/roles/:id',
    alias: 'getRole',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'includePermissions',
        type: 'Query',
        schema: z.boolean().optional().default(true),
      },
      {
        name: 'includeUserCount',
        type: 'Query',
        schema: z.boolean().optional().default(true),
      },
    ],
    response: RoleResponse,
  },
  {
    method: 'put',
    path: '/api/v1/roles/:id',
    alias: 'updateRole',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RoleUpdateRequest,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: RoleResponse,
  },
  {
    method: 'delete',
    path: '/api/v1/roles/:id',
    alias: 'deleteRole',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'post',
    path: '/api/v1/roles/:id/duplicate',
    alias: 'duplicateRole',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RoleDuplicateRequest,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: RoleResponse,
  },
  {
    method: 'get',
    path: '/api/v1/roles/:id/export',
    alias: 'exportRole',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.object({}).partial().strict().passthrough(),
  },
  {
    method: 'get',
    path: '/api/v1/roles/:roleId/permissions',
    alias: 'getPermissions',
    requestFormat: 'json',
    parameters: [
      {
        name: 'roleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'detailed',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
    ],
    response: z.object({}).partial().strict().passthrough(),
  },
  {
    method: 'put',
    path: '/api/v1/roles/:roleId/permissions',
    alias: 'syncPermissions',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PermissionSyncRequest,
      },
      {
        name: 'roleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PermissionSyncResult,
  },
  {
    method: 'post',
    path: '/api/v1/roles/:roleId/permissions',
    alias: 'grantPermissions',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PermissionGrantRequest,
      },
      {
        name: 'roleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PermissionGrantResult,
  },
  {
    method: 'delete',
    path: '/api/v1/roles/:roleId/permissions',
    alias: 'revokePermissions',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PermissionBulkDeleteRequest,
      },
      {
        name: 'roleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'delete',
    path: '/api/v1/roles/:roleId/permissions/:permission',
    alias: 'revokePermission',
    requestFormat: 'json',
    parameters: [
      {
        name: 'roleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'permission',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'delete',
    path: '/api/v1/roles/:roleId/permissions/all',
    alias: 'revokeAllPermissions',
    requestFormat: 'json',
    parameters: [
      {
        name: 'roleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'get',
    path: '/api/v1/roles/:roleId/permissions/check',
    alias: 'checkPermission',
    requestFormat: 'json',
    parameters: [
      {
        name: 'roleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'permission',
        type: 'Query',
        schema: z.string(),
      },
    ],
    response: PermissionCheckResult,
  },
  {
    method: 'get',
    path: '/api/v1/roles/:roleId/permissions/compare',
    alias: 'comparePermissions',
    requestFormat: 'json',
    parameters: [
      {
        name: 'roleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'with',
        type: 'Query',
        schema: z.string().uuid(),
      },
    ],
    response: RolePermissionDiff,
  },
  {
    method: 'post',
    path: '/api/v1/roles/:roleId/permissions/copy-from/:sourceRoleId',
    alias: 'copyPermissions',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z
          .object({ overwrite: z.boolean() })
          .partial()
          .strict()
          .passthrough(),
      },
      {
        name: 'roleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'sourceRoleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.array(z.string()),
  },
  {
    method: 'get',
    path: '/api/v1/roles/:roleId/permissions/effective',
    alias: 'getEffectivePermissions',
    requestFormat: 'json',
    parameters: [
      {
        name: 'roleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: EffectivePermissionsResponse,
  },
  {
    method: 'get',
    path: '/api/v1/roles/:roleId/permissions/suggestions',
    alias: 'getPermissionSuggestions',
    requestFormat: 'json',
    parameters: [
      {
        name: 'roleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.array(z.string()),
  },
  {
    method: 'post',
    path: '/api/v1/roles/:roleId/permissions/validate',
    alias: 'validatePermissions',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PermissionGrantRequest,
      },
      {
        name: 'roleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: PermissionValidationResult,
  },
  {
    method: 'get',
    path: '/api/v1/roles/by-permission',
    alias: 'getRolesByPermission',
    requestFormat: 'json',
    parameters: [
      {
        name: 'permission',
        type: 'Query',
        schema: z.string(),
      },
    ],
    response: z.array(RoleResponse),
  },
  {
    method: 'put',
    path: '/api/v1/roles/reorder',
    alias: 'reorderRoles',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: RoleReorderRequest,
      },
    ],
    response: z.void(),
  },
  {
    method: 'get',
    path: '/api/v1/roles/search',
    alias: 'searchRoles',
    requestFormat: 'json',
    parameters: [
      {
        name: 'q',
        type: 'Query',
        schema: z.string(),
      },
      {
        name: 'includePermissions',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
    ],
    response: z.array(RoleResponse),
  },
  {
    method: 'post',
    path: '/api/v1/roles/validate',
    alias: 'validateRoleCreation',
    requestFormat: 'json',
    parameters: [
      {
        name: 'name',
        type: 'Query',
        schema: z.string(),
      },
    ],
    response: z.object({}).partial().strict().passthrough(),
  },
  {
    method: 'post',
    path: '/api/v1/tables',
    alias: 'createTable',
    description: `Creates a new table in a workspace`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: TableCreateRequest,
      },
    ],
    response: TableResponse,
    errors: [
      {
        status: 400,
        description: `Invalid request data`,
        schema: TableResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableResponse,
      },
      {
        status: 404,
        description: `Workspace not found`,
        schema: TableResponse,
      },
      {
        status: 409,
        description: `Table name already exists or limit exceeded`,
        schema: TableResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/tables/:id',
    alias: 'getTable',
    description: `Retrieves a specific table by ID`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
      {
        name: 'includeRecordCount',
        type: 'Query',
        schema: z
          .boolean()
          .describe('Include record count')
          .optional()
          .default(false),
      },
    ],
    response: TableResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: TableResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/api/v1/tables/:id',
    alias: 'updateTable',
    description: `Updates an existing table`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: TableUpdateRequest,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
    ],
    response: TableResponse,
    errors: [
      {
        status: 400,
        description: `Invalid request data`,
        schema: TableResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: TableResponse,
      },
      {
        status: 409,
        description: `Table name already exists`,
        schema: TableResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/api/v1/tables/:id',
    alias: 'deleteTable',
    description: `Permanently deletes a table and all its records`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Access denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Table not found`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `Table in use or deletion restricted`,
        schema: z.void(),
      },
    ],
  },
  {
    method: 'post',
    path: '/api/v1/tables/:id/duplicate',
    alias: 'duplicateTable',
    description: `Creates a copy of an existing table`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: TableDuplicateRequest,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
    ],
    response: TableResponse,
    errors: [
      {
        status: 400,
        description: `Invalid request data`,
        schema: TableResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: TableResponse,
      },
      {
        status: 409,
        description: `Table name already exists or limit exceeded`,
        schema: TableResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/tables/:id/export',
    alias: 'exportTable',
    description: `Exports a table&#x27;s schema and optionally its data`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
      {
        name: 'format',
        type: 'Query',
        schema: z
          .string()
          .describe('Export format (json, csv)')
          .optional()
          .default('json'),
      },
      {
        name: 'includeRecords',
        type: 'Query',
        schema: z
          .boolean()
          .describe('Include records in export')
          .optional()
          .default(true),
      },
    ],
    response: TableExportResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableExportResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableExportResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: TableExportResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/api/v1/tables/:id/import',
    alias: 'importData',
    description: `Imports data into an existing table`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: TableImportRequest,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
    ],
    response: TableImportResponse,
    errors: [
      {
        status: 400,
        description: `Invalid import data`,
        schema: TableImportResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableImportResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableImportResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: TableImportResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/api/v1/tables/:id/properties',
    alias: 'addProperty',
    description: `Adds a new property to a table`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PropertyAddRequest,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
    ],
    response: TableResponse,
    errors: [
      {
        status: 400,
        description: `Invalid property definition`,
        schema: TableResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: TableResponse,
      },
      {
        status: 409,
        description: `Property key already exists or limit exceeded`,
        schema: TableResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/api/v1/tables/:id/properties/:key',
    alias: 'updateProperty',
    description: `Updates an existing property in a table`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PropertyUpdateRequest,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
      {
        name: 'key',
        type: 'Path',
        schema: z.string().describe('Property key'),
      },
    ],
    response: TableResponse,
    errors: [
      {
        status: 400,
        description: `Invalid property definition`,
        schema: TableResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableResponse,
      },
      {
        status: 404,
        description: `Table or property not found`,
        schema: TableResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/api/v1/tables/:id/properties/:key',
    alias: 'removeProperty',
    description: `Removes a property from a table`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
      {
        name: 'key',
        type: 'Path',
        schema: z.string().describe('Property key'),
      },
    ],
    response: TableResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableResponse,
      },
      {
        status: 404,
        description: `Table or property not found`,
        schema: TableResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/api/v1/tables/:id/properties/reorder',
    alias: 'reorderProperties',
    description: `Changes the display order of properties in a table`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: PropertyReorderRequest,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
    ],
    response: TableResponse,
    errors: [
      {
        status: 400,
        description: `Invalid property order`,
        schema: TableResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: TableResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/tables/:id/schema',
    alias: 'getTableSchema',
    description: `Retrieves the schema definition of a table`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
    ],
    response: TableSchemaResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableSchemaResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableSchemaResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: TableSchemaResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/tables/:id/statistics',
    alias: 'getTableStatistics',
    description: `Retrieves statistical information about a table`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Table ID'),
      },
    ],
    response: TableStatisticsResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableStatisticsResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableStatisticsResponse,
      },
      {
        status: 404,
        description: `Table not found`,
        schema: TableStatisticsResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/api/v1/tables/from-template',
    alias: 'createTableFromTemplate',
    description: `Creates a new table using a predefined template`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: TableCreateRequest,
      },
    ],
    response: TableResponse,
    errors: [
      {
        status: 400,
        description: `Invalid template or request data`,
        schema: TableResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableResponse,
      },
      {
        status: 404,
        description: `Workspace not found`,
        schema: TableResponse,
      },
      {
        status: 409,
        description: `Table name already exists or limit exceeded`,
        schema: TableResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/tables/workspace/:workspaceId',
    alias: 'listTables',
    description: `Retrieves all tables in a specific workspace`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'workspaceId',
        type: 'Path',
        schema: z.string().uuid().describe('Workspace ID'),
      },
      {
        name: 'includeRecordCounts',
        type: 'Query',
        schema: z
          .boolean()
          .describe('Include record counts')
          .optional()
          .default(false),
      },
    ],
    response: TableListResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: TableListResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: TableListResponse,
      },
      {
        status: 404,
        description: `Workspace not found`,
        schema: TableListResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/tenants',
    alias: 'getAllTenants',
    requestFormat: 'json',
    response: z.array(TenantResponse),
  },
  {
    method: 'post',
    path: '/api/v1/tenants',
    alias: 'createTenant',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: CreateTenantRequest,
      },
    ],
    response: TenantResponse,
  },
  {
    method: 'get',
    path: '/api/v1/tenants/:id',
    alias: 'getTenantById',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: TenantResponse,
  },
  {
    method: 'put',
    path: '/api/v1/tenants/:id',
    alias: 'updateTenant',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z
          .object({ name: z.string().min(1).max(255) })
          .strict()
          .passthrough(),
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: TenantResponse,
  },
  {
    method: 'delete',
    path: '/api/v1/tenants/:id',
    alias: 'deactivateTenant',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: TenantResponse,
  },
  {
    method: 'post',
    path: '/api/v1/tenants/:id/activate',
    alias: 'activateTenant',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: TenantResponse,
  },
  {
    method: 'post',
    path: '/api/v1/tenants/:id/link-auth0',
    alias: 'linkAuth0Organization',
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'auth0OrgId',
        type: 'Query',
        schema: z.string(),
      },
    ],
    response: TenantResponse,
  },
  {
    method: 'get',
    path: '/api/v1/tenants/active',
    alias: 'getActiveTenants',
    requestFormat: 'json',
    response: z.array(TenantResponse),
  },
  {
    method: 'get',
    path: '/api/v1/tenants/current',
    alias: 'getCurrentTenant',
    requestFormat: 'json',
    response: TenantResponse,
  },
  {
    method: 'get',
    path: '/api/v1/tenants/slug/:slug',
    alias: 'getTenantBySlug',
    requestFormat: 'json',
    parameters: [
      {
        name: 'slug',
        type: 'Path',
        schema: z.string(),
      },
    ],
    response: TenantResponse,
  },
  {
    method: 'get',
    path: '/api/v1/user-roles/:userId/permissions',
    alias: 'getUserPermissions',
    requestFormat: 'json',
    parameters: [
      {
        name: 'userId',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: UserPermissionsResponse,
  },
  {
    method: 'get',
    path: '/api/v1/user-roles/:userId/roles',
    alias: 'getUserRoles',
    requestFormat: 'json',
    parameters: [
      {
        name: 'userId',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'includePermissions',
        type: 'Query',
        schema: z.boolean().optional().default(false),
      },
    ],
    response: z.array(RoleResponse),
  },
  {
    method: 'put',
    path: '/api/v1/user-roles/:userId/roles',
    alias: 'setUserRoles',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: UserRoleAssignmentRequest,
      },
      {
        name: 'userId',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: UserRoleAssignmentResult,
  },
  {
    method: 'post',
    path: '/api/v1/user-roles/:userId/roles',
    alias: 'assignRoles',
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: UserRoleAssignmentRequest,
      },
      {
        name: 'userId',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: UserRoleAssignmentResult,
  },
  {
    method: 'delete',
    path: '/api/v1/user-roles/:userId/roles/:roleId',
    alias: 'removeRole',
    requestFormat: 'json',
    parameters: [
      {
        name: 'userId',
        type: 'Path',
        schema: z.string().uuid(),
      },
      {
        name: 'roleId',
        type: 'Path',
        schema: z.string().uuid(),
      },
    ],
    response: z.void(),
  },
  {
    method: 'get',
    path: '/api/v1/user-roles/me/permissions',
    alias: 'getMyPermissions',
    requestFormat: 'json',
    response: UserPermissionsResponse,
  },
  {
    method: 'get',
    path: '/api/v1/user-roles/me/permissions/check',
    alias: 'checkMyPermission',
    requestFormat: 'json',
    parameters: [
      {
        name: 'permission',
        type: 'Query',
        schema: z.string(),
      },
    ],
    response: z.object({}).partial().strict().passthrough(),
  },
  {
    method: 'post',
    path: '/api/v1/user-roles/me/permissions/check-resource',
    alias: 'checkMyResourceAccess',
    requestFormat: 'json',
    parameters: [
      {
        name: 'resourceId',
        type: 'Query',
        schema: z.string().uuid(),
      },
      {
        name: 'resourceType',
        type: 'Query',
        schema: z.string(),
      },
      {
        name: 'action',
        type: 'Query',
        schema: z.string(),
      },
    ],
    response: z.object({}).partial().strict().passthrough(),
  },
  {
    method: 'get',
    path: '/api/v1/user-roles/me/roles',
    alias: 'getMyRoles',
    requestFormat: 'json',
    response: z.array(RoleResponse),
  },
  {
    method: 'get',
    path: '/api/v1/users',
    alias: 'listUsers',
    description: `Retrieves all users in the current tenant (admin only)`,
    requestFormat: 'json',
    response: UserSearchResponse,
  },
  {
    method: 'get',
    path: '/api/v1/users/:userId',
    alias: 'getUserById',
    description: `Retrieves a specific user&#x27;s information`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'userId',
        type: 'Path',
        schema: z.string().uuid().describe('User ID'),
      },
    ],
    response: UserDetailResponse,
  },
  {
    method: 'get',
    path: '/api/v1/users/:userId/profile',
    alias: 'getUserProfile',
    description: `Retrieves a specific user&#x27;s profile information`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'userId',
        type: 'Path',
        schema: z.string().uuid().describe('User ID'),
      },
    ],
    response: UserProfileResponse,
  },
  {
    method: 'get',
    path: '/api/v1/users/me',
    alias: 'getCurrentUser',
    description: `Retrieves the authenticated user&#x27;s details including profile`,
    requestFormat: 'json',
    response: CurrentUserResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized - invalid or missing JWT token`,
        schema: CurrentUserResponse,
      },
      {
        status: 404,
        description: `User not found`,
        schema: CurrentUserResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/api/v1/users/me',
    alias: 'updateCurrentUser',
    description: `Updates the authenticated user&#x27;s information`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: z
          .object({ email: z.string().min(1).email() })
          .strict()
          .passthrough(),
      },
    ],
    response: UserResponse,
    errors: [
      {
        status: 400,
        description: `Invalid request data`,
        schema: UserResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: UserResponse,
      },
      {
        status: 404,
        description: `User not found`,
        schema: UserResponse,
      },
      {
        status: 409,
        description: `Email already in use`,
        schema: UserResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/users/me/profile',
    alias: 'getCurrentUserProfile',
    description: `Retrieves the authenticated user&#x27;s profile information`,
    requestFormat: 'json',
    response: UserProfileResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: UserProfileResponse,
      },
      {
        status: 404,
        description: `Profile not found`,
        schema: UserProfileResponse,
      },
    ],
  },
  {
    method: 'put',
    path: '/api/v1/users/me/profile',
    alias: 'updateCurrentUserProfile',
    description: `Updates or creates the authenticated user&#x27;s profile information`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: UserProfileUpdateRequest,
      },
    ],
    response: UserProfileResponse,
    errors: [
      {
        status: 400,
        description: `Invalid request data`,
        schema: UserProfileResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: UserProfileResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/api/v1/users/sync-auth0',
    alias: 'syncWithAuth0',
    description: `Manually synchronizes user data with Auth0 (admin only)`,
    requestFormat: 'json',
    response: z.object({}).partial().strict().passthrough(),
  },
  {
    method: 'get',
    path: '/api/v1/workspaces',
    alias: 'listWorkspaces',
    description: `Retrieves all workspaces for the current tenant`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'includeCounts',
        type: 'Query',
        schema: z
          .boolean()
          .describe('Include table counts')
          .optional()
          .default(false),
      },
    ],
    response: WorkspaceListResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: WorkspaceListResponse,
      },
    ],
  },
  {
    method: 'post',
    path: '/api/v1/workspaces',
    alias: 'createWorkspace',
    description: `Creates a new workspace for the current tenant`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: WorkspaceCreateRequest,
      },
    ],
    response: WorkspaceResponse,
    errors: [
      {
        status: 400,
        description: `Invalid request data`,
        schema: WorkspaceResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: WorkspaceResponse,
      },
      {
        status: 409,
        description: `Workspace name already exists or limit exceeded`,
        schema: WorkspaceResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/workspaces/:id',
    alias: 'getWorkspace',
    description: `Retrieves a specific workspace by ID`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Workspace ID'),
      },
      {
        name: 'detailed',
        type: 'Query',
        schema: z
          .boolean()
          .describe('Include detailed information')
          .optional()
          .default(false),
      },
    ],
    response: z.object({}).partial().strict().passthrough(),
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: z.object({}).partial().strict().passthrough(),
      },
      {
        status: 403,
        description: `Access denied`,
        schema: z.object({}).partial().strict().passthrough(),
      },
      {
        status: 404,
        description: `Workspace not found`,
        schema: z.object({}).partial().strict().passthrough(),
      },
    ],
  },
  {
    method: 'put',
    path: '/api/v1/workspaces/:id',
    alias: 'updateWorkspace',
    description: `Updates an existing workspace`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'body',
        type: 'Body',
        schema: WorkspaceUpdateRequest,
      },
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Workspace ID'),
      },
    ],
    response: WorkspaceResponse,
    errors: [
      {
        status: 400,
        description: `Invalid request data`,
        schema: WorkspaceResponse,
      },
      {
        status: 401,
        description: `Unauthorized`,
        schema: WorkspaceResponse,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: WorkspaceResponse,
      },
      {
        status: 404,
        description: `Workspace not found`,
        schema: WorkspaceResponse,
      },
      {
        status: 409,
        description: `Workspace name already exists`,
        schema: WorkspaceResponse,
      },
    ],
  },
  {
    method: 'delete',
    path: '/api/v1/workspaces/:id',
    alias: 'deleteWorkspace',
    description: `Permanently deletes a workspace and all its contents`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Workspace ID'),
      },
      {
        name: 'force',
        type: 'Query',
        schema: z
          .boolean()
          .describe('Force delete even if not empty')
          .optional()
          .default(false),
      },
    ],
    response: z.void(),
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: z.void(),
      },
      {
        status: 403,
        description: `Access denied`,
        schema: z.void(),
      },
      {
        status: 404,
        description: `Workspace not found`,
        schema: z.void(),
      },
      {
        status: 409,
        description: `Workspace not empty or in use`,
        schema: z.void(),
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/workspaces/:id/statistics',
    alias: 'getWorkspaceStatistics',
    description: `Retrieves detailed statistics for a workspace`,
    requestFormat: 'json',
    parameters: [
      {
        name: 'id',
        type: 'Path',
        schema: z.string().uuid().describe('Workspace ID'),
      },
    ],
    response: WorkspaceStatistics,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: WorkspaceStatistics,
      },
      {
        status: 403,
        description: `Access denied`,
        schema: WorkspaceStatistics,
      },
      {
        status: 404,
        description: `Workspace not found`,
        schema: WorkspaceStatistics,
      },
    ],
  },
  {
    method: 'post',
    path: '/api/v1/workspaces/default',
    alias: 'createDefaultWorkspace',
    description: `Creates a default workspace for tenant onboarding`,
    requestFormat: 'json',
    response: WorkspaceResponse,
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: WorkspaceResponse,
      },
      {
        status: 409,
        description: `Default workspace already exists`,
        schema: WorkspaceResponse,
      },
    ],
  },
  {
    method: 'get',
    path: '/api/v1/workspaces/quota',
    alias: 'getWorkspaceQuota',
    description: `Retrieves workspace quota information for the tenant`,
    requestFormat: 'json',
    response: z.object({}).partial().strict().passthrough(),
    errors: [
      {
        status: 401,
        description: `Unauthorized`,
        schema: z.object({}).partial().strict().passthrough(),
      },
    ],
  },
])

export const astarApi = new Zodios(endpoints)

export function createApiClient(baseUrl: string, options?: ZodiosOptions) {
  return new Zodios(baseUrl, endpoints, options)
}
