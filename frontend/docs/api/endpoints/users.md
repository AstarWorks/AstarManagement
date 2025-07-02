# User API Endpoints

The User API provides endpoints for user management, roles, permissions, and user profiles.

## Base URL

All user endpoints are prefixed with: `/api/v1/users`

## Endpoints

### List Users

**GET** `/api/v1/users`

Retrieves a paginated list of users with filtering options.

#### Query Parameters

```typescript
interface UserQueryParams {
  page?: number              // Default: 0
  size?: number              // Default: 20, Max: 100
  sort?: string              // Format: "field,direction"
  search?: string            // Search in name, email
  status?: UserStatus        // Filter by status
  roleId?: string            // Filter by role
  hasPermission?: string     // Filter by permission
  createdAfter?: string      // ISO date string
  createdBefore?: string     // ISO date string
}
```

#### Response

```typescript
interface PaginatedUserResponse {
  content: User[]
  totalElements: number
  totalPages: number
  size: number
  number: number
}
```

#### Example Request

```bash
curl -X GET "http://localhost:8080/api/v1/users?page=0&size=10&status=ACTIVE&roleId=lawyer" \
  -H "Authorization: Bearer <token>"
```

### Get User by ID

**GET** `/api/v1/users/{id}`

Retrieves detailed information about a specific user.

#### Path Parameters

- `id` (required): UUID of the user

#### Response

```typescript
interface UserDetailResponse extends User {
  sessions: UserSession[]
  recentActivity: UserActivity[]
  permissions: Permission[]
  statistics: {
    totalMatters: number
    activeTasks: number
    documentsUploaded: number
  }
}
```

### Get Current User

**GET** `/api/v1/users/me`

Returns the currently authenticated user's profile.

#### Response

```typescript
interface CurrentUserResponse {
  user: User
  permissions: Permission[]
  preferences: UserPreferences
  notifications: {
    unreadCount: number
    recentNotifications: Notification[]
  }
}
```

### Create User

**POST** `/api/v1/users`

Creates a new user account. Requires admin permissions.

#### Request Body

```typescript
interface CreateUserRequest {
  email: string              // Required, valid email
  name: string               // Required, 2-100 characters
  password: string           // Required, min 8 characters
  roleId: string             // Required, valid role ID
  phoneNumber?: string       // Optional
  preferredLanguage?: 'en' | 'ja'
  timezone?: string          // IANA timezone
  metadata?: UserMetadata
  sendWelcomeEmail?: boolean // Default: true
}
```

#### Validation Rules

- `email`: Must be unique and valid format
- `password`: Min 8 chars, must include uppercase, lowercase, number
- `name`: 2-100 characters
- `roleId`: Must reference existing role

#### Response

```typescript
interface CreateUserResponse {
  user: User
  temporaryPassword?: string // If password was auto-generated
  invitationLink?: string    // If welcome email disabled
}
```

### Update User

**PUT** `/api/v1/users/{id}`

Updates user information. Users can update their own profile, admins can update any user.

#### Path Parameters

- `id` (required): UUID of the user

#### Request Body

```typescript
interface UpdateUserRequest {
  name?: string
  phoneNumber?: string
  avatar?: string            // Base64 or URL
  preferredLanguage?: Language
  timezone?: string
  notificationPreferences?: NotificationPreference[]
  metadata?: UserMetadata
}
```

### Update User Status

**PATCH** `/api/v1/users/{id}/status`

Updates user account status. Requires admin permissions.

#### Request Body

```typescript
interface UpdateUserStatusRequest {
  status: UserStatus
  reason?: string            // Required for suspension
  suspensionEndDate?: string // For temporary suspension
}
```

### Change Password

**POST** `/api/v1/users/me/password`

Changes the current user's password.

#### Request Body

```typescript
interface ChangePasswordRequest {
  currentPassword: string
  newPassword: string
  logoutOtherSessions?: boolean // Default: false
}
```

### Reset Password Request

**POST** `/api/v1/auth/password/reset`

Initiates password reset process.

#### Request Body

```typescript
interface PasswordResetRequest {
  email: string
}
```

### Reset Password

**POST** `/api/v1/auth/password/reset/confirm`

Completes password reset with token.

#### Request Body

```typescript
interface ResetPasswordRequest {
  token: string
  newPassword: string
}
```

### Update User Preferences

**PUT** `/api/v1/users/me/preferences`

Updates current user's UI preferences.

#### Request Body

```typescript
interface UserPreferences {
  theme: 'light' | 'dark' | 'system'
  sidebarCollapsed: boolean
  dashboardLayout: DashboardLayout
  emailNotifications: boolean
  pushNotifications: boolean
  smsNotifications: boolean
  autoLogoutMinutes?: number
  defaultMatterView: 'kanban' | 'list' | 'calendar'
  dateFormat: string
  timeFormat: '12h' | '24h'
  firstDayOfWeek: 0 | 1 | 6
}
```

## Role Management

### List Roles

**GET** `/api/v1/roles`

Retrieves all available roles.

#### Response

```typescript
interface RoleListResponse {
  roles: Role[]
}
```

### Assign Role

**PUT** `/api/v1/users/{id}/role`

Assigns a role to a user. Requires admin permissions.

#### Request Body

```typescript
interface AssignRoleRequest {
  roleId: string
  reason?: string
}
```

## Permission Management

### List Permissions

**GET** `/api/v1/permissions`

Retrieves all available permissions.

#### Query Parameters

- `resource`: Filter by resource type
- `action`: Filter by action type

### Grant Permission

**POST** `/api/v1/users/{id}/permissions`

Grants additional permissions to a user.

#### Request Body

```typescript
interface GrantPermissionRequest {
  permissions: string[] // Permission IDs
  expiresAt?: string   // Optional expiration
}
```

### Revoke Permission

**DELETE** `/api/v1/users/{id}/permissions/{permissionId}`

Revokes a specific permission from a user.

## Two-Factor Authentication

### Enable 2FA

**POST** `/api/v1/users/me/2fa/enable`

Initiates 2FA setup for current user.

#### Request Body

```typescript
interface TwoFactorSetupRequest {
  method: 'TOTP' | 'SMS' | 'EMAIL'
  phoneNumber?: string // Required for SMS
}
```

#### Response

```typescript
interface TwoFactorSetupResponse {
  method: TwoFactorMethod
  secret?: string        // For TOTP
  qrCode?: string       // QR code data URL
  backupCodes?: string[] // One-time backup codes
}
```

### Confirm 2FA

**POST** `/api/v1/users/me/2fa/confirm`

Confirms 2FA setup with verification code.

#### Request Body

```typescript
interface Confirm2FARequest {
  code: string
}
```

### Disable 2FA

**POST** `/api/v1/users/me/2fa/disable`

Disables 2FA for current user.

#### Request Body

```typescript
interface Disable2FARequest {
  password: string // Current password required
}
```

## User Sessions

### List Sessions

**GET** `/api/v1/users/me/sessions`

Lists all active sessions for current user.

#### Response

```typescript
interface SessionListResponse {
  sessions: UserSession[]
  currentSessionId: string
}
```

### Terminate Session

**DELETE** `/api/v1/users/me/sessions/{sessionId}`

Terminates a specific session.

### Terminate All Sessions

**DELETE** `/api/v1/users/me/sessions`

Terminates all sessions except current.

## API Keys

### List API Keys

**GET** `/api/v1/users/me/api-keys`

Lists all API keys for current user.

### Create API Key

**POST** `/api/v1/users/me/api-keys`

Creates a new API key.

#### Request Body

```typescript
interface CreateApiKeyRequest {
  name: string
  permissions?: string[] // Subset of user's permissions
  expiresInDays?: number
}
```

#### Response

```typescript
interface CreateApiKeyResponse {
  id: string
  name: string
  key: string // Only shown once!
  expiresAt?: string
}
```

### Delete API Key

**DELETE** `/api/v1/users/me/api-keys/{keyId}`

Revokes an API key.

## User Activity

### Get Activity Log

**GET** `/api/v1/users/{id}/activity`

Retrieves user activity log. Users can view own activity, admins can view any.

#### Query Parameters

```typescript
interface ActivityQueryParams {
  page?: number
  size?: number
  action?: ActivityAction
  dateFrom?: string
  dateTo?: string
}
```

## Using User API in Nuxt.js

### User Composable

```typescript
// composables/api/useUsers.ts
export const useUsers = () => {
  const { $api } = useNuxtApp()
  
  const fetchUsers = async (params?: UserQueryParams) => {
    return await $api<PaginatedUserResponse>('/users', { params })
  }
  
  const getUser = async (id: string) => {
    return await $api<UserDetailResponse>(`/users/${id}`)
  }
  
  const getCurrentUser = async () => {
    return await $api<CurrentUserResponse>('/users/me')
  }
  
  const createUser = async (data: CreateUserRequest) => {
    return await $api<CreateUserResponse>('/users', {
      method: 'POST',
      body: data
    })
  }
  
  const updateUser = async (id: string, data: UpdateUserRequest) => {
    return await $api<User>(`/users/${id}`, {
      method: 'PUT',
      body: data
    })
  }
  
  const changePassword = async (data: ChangePasswordRequest) => {
    return await $api('/users/me/password', {
      method: 'POST',
      body: data
    })
  }
  
  return {
    fetchUsers,
    getUser,
    getCurrentUser,
    createUser,
    updateUser,
    changePassword
  }
}
```

### Profile Management Component

```vue
<script setup lang="ts">
const { getCurrentUser, updateUser } = useUsers()
const { showToast } = useToast()

const { data: currentUser, refresh } = await useAsyncData(
  'currentUser',
  () => getCurrentUser()
)

const updateProfile = async (updates: UpdateUserRequest) => {
  try {
    await updateUser(currentUser.value.user.id, updates)
    await refresh()
    showToast('Profile updated successfully', 'success')
  } catch (error) {
    showToast('Failed to update profile', 'error')
  }
}
</script>
```

## Error Handling

### 400 Bad Request

```json
{
  "error": {
    "code": "VALIDATION_ERROR",
    "message": "Validation failed",
    "details": [
      {
        "field": "email",
        "message": "Email already exists"
      }
    ]
  }
}
```

### 403 Forbidden

```json
{
  "error": {
    "code": "INSUFFICIENT_PERMISSIONS",
    "message": "You do not have permission to perform this action"
  }
}
```

### 409 Conflict

```json
{
  "error": {
    "code": "EMAIL_EXISTS",
    "message": "A user with this email already exists"
  }
}
```