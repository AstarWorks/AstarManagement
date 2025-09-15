# ユーザー管理画面設計

## 概要

法律事務所のユーザー管理機能を提供します。管理者と弁護士がユーザーを作成でき、カスタムフィールドによる柔軟な情報管理を実現します。

## 機能要件

### 1. ユーザー作成権限
- 管理者（admin）: すべてのロールのユーザーを作成可能
- 弁護士（lawyer）: 事務員（clerk）のみ作成可能
- 事務員（clerk）・クライアント（client）: 作成権限なし

### 2. ユーザー情報管理
- **必須項目**: 氏名、メールアドレス、ロール、パスワード
- **システム定義オプション項目**: 電話番号、部署、プロフィール画像、弁護士登録番号
- **カスタムフィールド**: 事務所ごとに自由に定義可能

### 3. ユーザー無効化
- 論理削除方式（is_activeフラグ）
- データは保持し、監査証跡を維持

## 画面構成

### 1. ユーザー一覧画面

```vue
<template>
  <div class="user-management">
    <!-- ヘッダー -->
    <div class="page-header">
      <div>
        <h1 class="page-title">ユーザー管理</h1>
        <p class="page-description">
          事務所のユーザーアカウントを管理します
        </p>
      </div>
      <div class="header-actions">
        <Button 
          v-if="canCreateUser"
          @click="openCreateDialog"
        >
          <UserPlus class="h-4 w-4 mr-2" />
          新規ユーザー
        </Button>
      </div>
    </div>

    <!-- フィルター -->
    <Card class="mb-6">
      <CardContent class="p-4">
        <div class="flex flex-wrap gap-4">
          <!-- 検索 -->
          <div class="flex-1 min-w-[300px]">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                v-model="filters.search"
                placeholder="名前、メールアドレスで検索..."
                class="pl-10"
              />
            </div>
          </div>
          
          <!-- ロールフィルター -->
          <Select v-model="filters.role">
            <SelectTrigger class="w-40">
              <SelectValue placeholder="ロール" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="admin">管理者</SelectItem>
              <SelectItem value="lawyer">弁護士</SelectItem>
              <SelectItem value="clerk">事務員</SelectItem>
              <SelectItem value="client">クライアント</SelectItem>
            </SelectContent>
          </Select>
          
          <!-- ステータスフィルター -->
          <Select v-model="filters.status">
            <SelectTrigger class="w-40">
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="active">有効</SelectItem>
              <SelectItem value="inactive">無効</SelectItem>
            </SelectContent>
          </Select>
          
          <!-- フィルタークリア -->
          <Button 
            v-if="hasActiveFilters"
            variant="ghost"
            @click="clearFilters"
          >
            <X class="h-4 w-4 mr-1" />
            クリア
          </Button>
        </div>
      </CardContent>
    </Card>

    <!-- ユーザーテーブル -->
    <Card>
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>ユーザー</TableHead>
            <TableHead>ロール</TableHead>
            <TableHead>最終ログイン</TableHead>
            <TableHead>2FA</TableHead>
            <TableHead>ステータス</TableHead>
            <TableHead class="w-[100px]"></TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow 
            v-for="user in paginatedUsers" 
            :key="user.id"
            class="cursor-pointer"
            @click="showUserDetail(user)"
          >
            <!-- ユーザー情報 -->
            <TableCell>
              <div class="flex items-center gap-3">
                <Avatar>
                  <AvatarImage :src="user.profileImage" :alt="user.name" />
                  <AvatarFallback>
                    {{ getInitials(user.name) }}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <div class="font-medium">{{ user.name }}</div>
                  <div class="text-sm text-muted-foreground">{{ user.email }}</div>
                </div>
              </div>
            </TableCell>
            
            <!-- ロール -->
            <TableCell>
              <Badge :variant="getRoleVariant(user.role)">
                {{ getRoleLabel(user.role) }}
              </Badge>
            </TableCell>
            
            <!-- 最終ログイン -->
            <TableCell>
              <div v-if="user.lastLoginAt" class="text-sm">
                {{ formatDateTime(user.lastLoginAt) }}
              </div>
              <div v-else class="text-sm text-muted-foreground">
                未ログイン
              </div>
            </TableCell>
            
            <!-- 2FA状態 -->
            <TableCell>
              <div class="flex items-center gap-2">
                <Shield 
                  v-if="user.isTwoFactorEnabled" 
                  class="h-4 w-4 text-green-600"
                />
                <ShieldOff 
                  v-else 
                  class="h-4 w-4 text-muted-foreground"
                />
                <span class="text-sm">
                  {{ user.isTwoFactorEnabled ? '有効' : '無効' }}
                </span>
              </div>
            </TableCell>
            
            <!-- ステータス -->
            <TableCell>
              <Badge 
                :variant="user.isActive ? 'default' : 'secondary'"
              >
                {{ user.isActive ? '有効' : '無効' }}
              </Badge>
            </TableCell>
            
            <!-- アクション -->
            <TableCell @click.stop>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="sm">
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="editUser(user)">
                    <Edit class="h-4 w-4 mr-2" />
                    編集
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="resetPassword(user)">
                    <Key class="h-4 w-4 mr-2" />
                    パスワードリセット
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem 
                    @click="toggleUserStatus(user)"
                    :class="user.isActive ? 'text-destructive' : ''"
                  >
                    <Power class="h-4 w-4 mr-2" />
                    {{ user.isActive ? '無効化' : '有効化' }}
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        </TableBody>
      </Table>
      
      <!-- ページネーション -->
      <div class="p-4 border-t">
        <Pagination
          v-model:page="currentPage"
          :total="filteredUsers.length"
          :per-page="perPage"
        />
      </div>
    </Card>
  </div>
</template>

<script setup lang="ts">
const { user: currentUser, hasPermission } = useAuthStore()

// 権限チェック
const canCreateUser = computed(() => {
  return currentUser.value?.role === 'admin' || currentUser.value?.role === 'lawyer'
})

// フィルター
const filters = reactive({
  search: '',
  role: 'all',
  status: 'all'
})

// ロール表示
const getRoleLabel = (role: string) => {
  const labels = {
    admin: '管理者',
    lawyer: '弁護士',
    clerk: '事務員',
    client: 'クライアント'
  }
  return labels[role] || role
}

const getRoleVariant = (role: string) => {
  const variants = {
    admin: 'destructive',
    lawyer: 'default',
    clerk: 'secondary',
    client: 'outline'
  }
  return variants[role] || 'default'
}
</script>
```

### 2. ユーザー作成・編集ダイアログ

```vue
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {{ isNew ? '新規ユーザー作成' : 'ユーザー編集' }}
        </DialogTitle>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit">
        <!-- 基本情報タブ -->
        <Tabs v-model="activeTab">
          <TabsList class="grid w-full grid-cols-3">
            <TabsTrigger value="basic">基本情報</TabsTrigger>
            <TabsTrigger value="additional">追加情報</TabsTrigger>
            <TabsTrigger value="permissions">権限設定</TabsTrigger>
          </TabsList>
          
          <!-- 基本情報 -->
          <TabsContent value="basic" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <!-- 氏名 -->
              <div class="col-span-2">
                <Label for="name">氏名 *</Label>
                <Input
                  id="name"
                  v-model="formData.name"
                  required
                />
              </div>
              
              <!-- メールアドレス -->
              <div>
                <Label for="email">メールアドレス *</Label>
                <Input
                  id="email"
                  v-model="formData.email"
                  type="email"
                  required
                  :disabled="!isNew"
                />
                <p v-if="!isNew" class="text-xs text-muted-foreground mt-1">
                  メールアドレスは変更できません
                </p>
              </div>
              
              <!-- ロール -->
              <div>
                <Label for="role">ロール *</Label>
                <Select v-model="formData.role" :disabled="!canChangeRole">
                  <SelectTrigger>
                    <SelectValue placeholder="ロールを選択" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem 
                      v-for="role in availableRoles" 
                      :key="role.value"
                      :value="role.value"
                    >
                      {{ role.label }}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <!-- パスワード（新規作成時のみ） -->
              <div v-if="isNew" class="col-span-2">
                <Label for="password">初期パスワード *</Label>
                <div class="flex gap-2">
                  <Input
                    id="password"
                    v-model="formData.password"
                    :type="showPassword ? 'text' : 'password'"
                    required
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="icon"
                    @click="showPassword = !showPassword"
                  >
                    <Eye v-if="!showPassword" class="h-4 w-4" />
                    <EyeOff v-else class="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant="outline"
                    @click="generatePassword"
                  >
                    <Wand2 class="h-4 w-4 mr-2" />
                    生成
                  </Button>
                </div>
                <p class="text-xs text-muted-foreground mt-1">
                  12文字以上、大文字・小文字・数字・記号を含む
                </p>
              </div>
            </div>
          </TabsContent>
          
          <!-- 追加情報 -->
          <TabsContent value="additional" class="space-y-4">
            <!-- システム定義フィールド -->
            <div class="space-y-4">
              <h3 class="text-sm font-medium">システム定義項目</h3>
              
              <!-- 電話番号 -->
              <div>
                <Label for="phone">電話番号</Label>
                <Input
                  id="phone"
                  v-model="formData.phone"
                  type="tel"
                  placeholder="03-1234-5678"
                />
              </div>
              
              <!-- 部署 -->
              <div>
                <Label for="department">部署</Label>
                <Input
                  id="department"
                  v-model="formData.department"
                  placeholder="例: 企業法務部"
                />
              </div>
              
              <!-- 弁護士登録番号 -->
              <div v-if="formData.role === 'lawyer'">
                <Label for="lawyerNumber">弁護士登録番号</Label>
                <Input
                  id="lawyerNumber"
                  v-model="formData.lawyerNumber"
                  placeholder="12345"
                />
              </div>
              
              <!-- プロフィール画像 -->
              <div>
                <Label>プロフィール画像</Label>
                <div class="flex items-center gap-4">
                  <Avatar class="h-20 w-20">
                    <AvatarImage :src="formData.profileImage" />
                    <AvatarFallback>
                      {{ getInitials(formData.name) }}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      @click="uploadImage"
                    >
                      <Upload class="h-4 w-4 mr-2" />
                      アップロード
                    </Button>
                    <p class="text-xs text-muted-foreground mt-1">
                      JPG、PNG（最大2MB）
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <!-- カスタムフィールド -->
            <div class="space-y-4">
              <div class="flex items-center justify-between">
                <h3 class="text-sm font-medium">カスタム項目</h3>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="addCustomField"
                >
                  <Plus class="h-4 w-4 mr-1" />
                  項目追加
                </Button>
              </div>
              
              <div
                v-for="(field, index) in customFields"
                :key="field.id"
                class="space-y-2"
              >
                <div class="flex items-start gap-2">
                  <div class="flex-1">
                    <Label :for="`custom-${field.id}`">
                      {{ field.label }}
                      <span v-if="field.required" class="text-destructive">*</span>
                    </Label>
                    <CustomFieldInput
                      :id="`custom-${field.id}`"
                      v-model="formData.customFields[field.id]"
                      :field="field"
                    />
                  </div>
                  <Button
                    v-if="canEditCustomFields"
                    type="button"
                    variant="ghost"
                    size="icon"
                    class="mt-6"
                    @click="editCustomField(field)"
                  >
                    <Settings class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
          </TabsContent>
          
          <!-- 権限設定 -->
          <TabsContent value="permissions" class="space-y-4">
            <Alert>
              <Info class="h-4 w-4" />
              <AlertDescription>
                ロールに基づいてデフォルト権限が設定されます。必要に応じて個別に調整できます。
              </AlertDescription>
            </Alert>
            
            <!-- 権限マトリックス -->
            <div class="space-y-4">
              <div
                v-for="module in permissionModules"
                :key="module.id"
                class="space-y-2"
              >
                <h4 class="font-medium">{{ module.label }}</h4>
                <div class="grid grid-cols-2 gap-2">
                  <div
                    v-for="permission in module.permissions"
                    :key="permission.id"
                    class="flex items-center space-x-2"
                  >
                    <Checkbox
                      :id="permission.id"
                      v-model="formData.permissions[permission.id]"
                      :disabled="!canEditPermissions"
                    />
                    <Label :for="permission.id" class="text-sm">
                      {{ permission.label }}
                    </Label>
                  </div>
                </div>
              </div>
            </div>
          </TabsContent>
        </Tabs>
        
        <!-- フッター -->
        <DialogFooter class="mt-6">
          <Button type="button" variant="outline" @click="close">
            キャンセル
          </Button>
          <Button type="submit" :disabled="isSubmitting">
            <Loader2 v-if="isSubmitting" class="h-4 w-4 mr-2 animate-spin" />
            {{ isNew ? '作成' : '更新' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
// カスタムフィールドの型定義
interface CustomFieldDefinition {
  id: string
  label: string
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox'
  required: boolean
  options?: string[] // selectタイプの場合
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
}

// パスワード生成
const generatePassword = () => {
  const length = 16
  const chars = {
    upper: 'ABCDEFGHIJKLMNOPQRSTUVWXYZ',
    lower: 'abcdefghijklmnopqrstuvwxyz',
    number: '0123456789',
    special: '!@#$%^&*()_+-=[]{}|;:,.<>?'
  }
  
  let password = ''
  // 各種文字を最低1つ含める
  password += chars.upper[Math.floor(Math.random() * chars.upper.length)]
  password += chars.lower[Math.floor(Math.random() * chars.lower.length)]
  password += chars.number[Math.floor(Math.random() * chars.number.length)]
  password += chars.special[Math.floor(Math.random() * chars.special.length)]
  
  // 残りをランダムに
  const allChars = Object.values(chars).join('')
  for (let i = password.length; i < length; i++) {
    password += allChars[Math.floor(Math.random() * allChars.length)]
  }
  
  // シャッフル
  formData.password = password.split('').sort(() => Math.random() - 0.5).join('')
  showPassword.value = true
}
</script>
```

### 3. ユーザー詳細画面

```vue
<template>
  <div class="user-detail">
    <!-- ヘッダー -->
    <div class="detail-header">
      <Button variant="ghost" size="sm" @click="goBack">
        <ArrowLeft class="h-4 w-4 mr-2" />
        戻る
      </Button>
    </div>
    
    <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <!-- 左側：プロフィール -->
      <div class="lg:col-span-1">
        <Card>
          <CardContent class="p-6">
            <!-- プロフィール画像 -->
            <div class="text-center mb-6">
              <Avatar class="h-32 w-32 mx-auto mb-4">
                <AvatarImage :src="user.profileImage" />
                <AvatarFallback class="text-2xl">
                  {{ getInitials(user.name) }}
                </AvatarFallback>
              </Avatar>
              <h2 class="text-xl font-semibold">{{ user.name }}</h2>
              <p class="text-muted-foreground">{{ user.email }}</p>
              <Badge class="mt-2" :variant="getRoleVariant(user.role)">
                {{ getRoleLabel(user.role) }}
              </Badge>
            </div>
            
            <!-- ステータス -->
            <div class="space-y-3">
              <div class="flex items-center justify-between py-2 border-b">
                <span class="text-sm">ステータス</span>
                <Badge :variant="user.isActive ? 'default' : 'secondary'">
                  {{ user.isActive ? '有効' : '無効' }}
                </Badge>
              </div>
              
              <div class="flex items-center justify-between py-2 border-b">
                <span class="text-sm">2要素認証</span>
                <div class="flex items-center gap-2">
                  <Shield 
                    :class="user.isTwoFactorEnabled ? 'text-green-600' : 'text-muted-foreground'"
                    class="h-4 w-4"
                  />
                  <span class="text-sm">
                    {{ user.isTwoFactorEnabled ? '有効' : '無効' }}
                  </span>
                </div>
              </div>
              
              <div class="py-2 border-b">
                <span class="text-sm">作成日</span>
                <p class="text-sm text-muted-foreground">
                  {{ formatDate(user.createdAt) }}
                </p>
              </div>
              
              <div class="py-2">
                <span class="text-sm">最終ログイン</span>
                <p class="text-sm text-muted-foreground">
                  {{ user.lastLoginAt ? formatDateTime(user.lastLoginAt) : '未ログイン' }}
                </p>
              </div>
            </div>
            
            <!-- アクション -->
            <div class="mt-6 space-y-2">
              <Button 
                v-if="canEdit"
                class="w-full" 
                @click="editUser"
              >
                <Edit class="h-4 w-4 mr-2" />
                編集
              </Button>
              <Button 
                variant="outline" 
                class="w-full"
                @click="resetPassword"
              >
                <Key class="h-4 w-4 mr-2" />
                パスワードリセット
              </Button>
              <Button 
                v-if="canToggleStatus"
                variant="outline" 
                class="w-full"
                :class="user.isActive ? 'text-destructive' : ''"
                @click="toggleStatus"
              >
                <Power class="h-4 w-4 mr-2" />
                {{ user.isActive ? 'アカウント無効化' : 'アカウント有効化' }}
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <!-- 右側：詳細情報 -->
      <div class="lg:col-span-2 space-y-6">
        <!-- 基本情報 -->
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm font-medium text-muted-foreground">電話番号</dt>
                <dd>{{ user.phone || '-' }}</dd>
              </div>
              <div>
                <dt class="text-sm font-medium text-muted-foreground">部署</dt>
                <dd>{{ user.department || '-' }}</dd>
              </div>
              <div v-if="user.role === 'lawyer'">
                <dt class="text-sm font-medium text-muted-foreground">弁護士登録番号</dt>
                <dd>{{ user.lawyerNumber || '-' }}</dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <!-- カスタムフィールド -->
        <Card v-if="hasCustomFields">
          <CardHeader>
            <CardTitle>追加情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div
                v-for="field in userCustomFields"
                :key="field.id"
              >
                <dt class="text-sm font-medium text-muted-foreground">
                  {{ field.label }}
                </dt>
                <dd>
                  <CustomFieldDisplay
                    :value="user.customFields[field.id]"
                    :field="field"
                  />
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <!-- アクティビティログ -->
        <Card>
          <CardHeader>
            <CardTitle>最近のアクティビティ</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div
                v-for="activity in recentActivities"
                :key="activity.id"
                class="flex items-start gap-3"
              >
                <div 
                  class="h-8 w-8 rounded-full flex items-center justify-center"
                  :class="getActivityIconClass(activity.type)"
                >
                  <component 
                    :is="getActivityIcon(activity.type)" 
                    class="h-4 w-4"
                  />
                </div>
                <div class="flex-1">
                  <p class="text-sm">{{ activity.description }}</p>
                  <p class="text-xs text-muted-foreground">
                    {{ formatDateTime(activity.createdAt) }}
                    <span v-if="activity.ipAddress" class="ml-2">
                      IP: {{ activity.ipAddress }}
                    </span>
                  </p>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- セッション管理 -->
        <Card>
          <CardHeader>
            <CardTitle>アクティブセッション</CardTitle>
            <CardDescription>
              現在ログイン中のデバイス
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-3">
              <div
                v-for="session in activeSessions"
                :key="session.id"
                class="flex items-center justify-between p-3 border rounded-lg"
              >
                <div class="flex items-center gap-3">
                  <Monitor v-if="session.deviceType === 'desktop'" class="h-5 w-5" />
                  <Smartphone v-else-if="session.deviceType === 'mobile'" class="h-5 w-5" />
                  <Tablet v-else class="h-5 w-5" />
                  <div>
                    <p class="font-medium">{{ session.deviceName }}</p>
                    <p class="text-sm text-muted-foreground">
                      {{ session.ipAddress }} • 
                      最終アクティビティ: {{ formatDateTime(session.lastActivityAt) }}
                    </p>
                  </div>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  @click="revokeSession(session)"
                >
                  無効化
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  </div>
</template>
```

### 4. カスタムフィールド管理

```vue
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>カスタムフィールド設定</DialogTitle>
        <DialogDescription>
          ユーザー情報に追加する項目を定義します
        </DialogDescription>
      </DialogHeader>
      
      <div class="space-y-4">
        <!-- フィールド一覧 -->
        <div class="space-y-2">
          <div
            v-for="field in customFields"
            :key="field.id"
            class="flex items-center justify-between p-3 border rounded-lg"
          >
            <div>
              <p class="font-medium">{{ field.label }}</p>
              <p class="text-sm text-muted-foreground">
                {{ getFieldTypeLabel(field.type) }}
                <span v-if="field.required" class="text-destructive ml-1">
                  （必須）
                </span>
              </p>
            </div>
            <div class="flex items-center gap-2">
              <Button
                variant="ghost"
                size="sm"
                @click="editField(field)"
              >
                <Edit class="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                @click="deleteField(field)"
              >
                <Trash class="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
        
        <!-- 新規追加ボタン -->
        <Button
          variant="outline"
          class="w-full"
          @click="addNewField"
        >
          <Plus class="h-4 w-4 mr-2" />
          新しいフィールドを追加
        </Button>
      </div>
    </DialogContent>
  </Dialog>
</template>
```

### 5. カスタムフィールド定義ダイアログ

```vue
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>
          {{ isNew ? '新規フィールド作成' : 'フィールド編集' }}
        </DialogTitle>
      </DialogHeader>
      
      <form @submit.prevent="saveField" class="space-y-4">
        <!-- ラベル -->
        <div>
          <Label for="field-label">項目名 *</Label>
          <Input
            id="field-label"
            v-model="fieldData.label"
            placeholder="例: 社員番号"
            required
          />
        </div>
        
        <!-- タイプ -->
        <div>
          <Label for="field-type">入力タイプ *</Label>
          <Select v-model="fieldData.type">
            <SelectTrigger>
              <SelectValue placeholder="タイプを選択" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">テキスト</SelectItem>
              <SelectItem value="number">数値</SelectItem>
              <SelectItem value="date">日付</SelectItem>
              <SelectItem value="select">選択肢</SelectItem>
              <SelectItem value="checkbox">チェックボックス</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <!-- 選択肢（selectタイプの場合） -->
        <div v-if="fieldData.type === 'select'" class="space-y-2">
          <Label>選択肢</Label>
          <div
            v-for="(option, index) in fieldData.options"
            :key="index"
            class="flex gap-2"
          >
            <Input
              v-model="fieldData.options[index]"
              placeholder="選択肢"
            />
            <Button
              type="button"
              variant="ghost"
              size="icon"
              @click="removeOption(index)"
            >
              <X class="h-4 w-4" />
            </Button>
          </div>
          <Button
            type="button"
            variant="outline"
            size="sm"
            @click="addOption"
          >
            <Plus class="h-4 w-4 mr-1" />
            選択肢を追加
          </Button>
        </div>
        
        <!-- 必須フラグ -->
        <div class="flex items-center space-x-2">
          <Checkbox
            id="field-required"
            v-model="fieldData.required"
          />
          <Label for="field-required">必須項目にする</Label>
        </div>
        
        <!-- バリデーション（数値の場合） -->
        <div v-if="fieldData.type === 'number'" class="grid grid-cols-2 gap-4">
          <div>
            <Label for="field-min">最小値</Label>
            <Input
              id="field-min"
              v-model.number="fieldData.validation.min"
              type="number"
            />
          </div>
          <div>
            <Label for="field-max">最大値</Label>
            <Input
              id="field-max"
              v-model.number="fieldData.validation.max"
              type="number"
            />
          </div>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" @click="close">
            キャンセル
          </Button>
          <Button type="submit">
            {{ isNew ? '作成' : '更新' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
```

## データモデル

### ユーザー拡張情報

```typescript
// カスタムフィールド定義
interface UserCustomFieldDefinition {
  id: string
  tenantId: string
  label: string
  fieldKey: string  // 一意のキー（英数字）
  type: 'text' | 'number' | 'date' | 'select' | 'checkbox'
  required: boolean
  options?: string[]  // selectタイプの場合
  validation?: {
    min?: number
    max?: number
    pattern?: string
  }
  displayOrder: number
  isActive: boolean
  createdAt: Date
  updatedAt: Date
}

// ユーザーのカスタムフィールド値
interface UserCustomFieldValue {
  userId: string
  fieldId: string
  value: any  // JSONBで保存
}
```

### データベース設計

```sql
-- カスタムフィールド定義
CREATE TABLE user_custom_field_definitions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tenant_id UUID NOT NULL,
    label VARCHAR(255) NOT NULL,
    field_key VARCHAR(100) NOT NULL,
    type VARCHAR(50) NOT NULL CHECK (type IN ('text', 'number', 'date', 'select', 'checkbox')),
    required BOOLEAN NOT NULL DEFAULT false,
    options JSONB,
    validation JSONB,
    display_order INTEGER NOT NULL DEFAULT 0,
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    UNIQUE KEY uk_tenant_field_key (tenant_id, field_key)
);

-- ユーザーカスタムフィールド値
CREATE TABLE user_custom_field_values (
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    field_id UUID NOT NULL REFERENCES user_custom_field_definitions(id) ON DELETE CASCADE,
    value JSONB NOT NULL,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    PRIMARY KEY (user_id, field_id)
);
```

## 権限管理

### ユーザー管理に関する権限

```typescript
const userManagementPermissions = {
  // ユーザー作成
  'user.create.admin': '管理者を作成',
  'user.create.lawyer': '弁護士を作成',
  'user.create.clerk': '事務員を作成',
  'user.create.client': 'クライアントを作成',
  
  // ユーザー閲覧
  'user.read.all': 'すべてのユーザーを閲覧',
  'user.read.own': '自分の情報のみ閲覧',
  
  // ユーザー編集
  'user.update.all': 'すべてのユーザーを編集',
  'user.update.own': '自分の情報のみ編集',
  'user.update.role': 'ロールを変更',
  'user.update.permissions': '権限を変更',
  
  // ユーザー無効化
  'user.deactivate': 'ユーザーを無効化',
  'user.activate': 'ユーザーを有効化',
  
  // その他
  'user.reset_password': 'パスワードをリセット',
  'user.manage_custom_fields': 'カスタムフィールドを管理'
}
```