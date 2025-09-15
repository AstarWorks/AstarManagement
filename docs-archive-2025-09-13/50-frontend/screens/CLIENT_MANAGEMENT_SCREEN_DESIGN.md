# クライアント管理画面設計

## 概要

法律事務所のクライアント（依頼者）情報を管理する画面です。詳細な顧客情報管理、個人・法人・その他の種別対応、重複チェック機能、読み取り専用のクライアントポータルを提供します。委任状に基づく厳格なアクセス制限により、情報の機密性を保護します。

## 設計方針

### 1. 詳細な顧客情報管理
- 基本情報に加えて、家族構成、職業、資産状況、相談履歴、紹介元情報を管理
- 事件の背景理解に必要な関係性情報を体系的に記録

### 2. 多様なクライアント種別
- 個人、法人、団体・組合などに対応
- 種別に応じた入力フィールドの動的切り替え

### 3. 重複管理
- 電話番号、メールアドレスによる重複チェック
- 類似クライアントの警告とマージ機能

### 4. クライアントポータル
- クライアントが自分の情報と案件進捗を閲覧可能（読み取り専用）
- セキュアな認証とアクセス制御

### 5. 委任状ベースのアクセス制限
- 委任状に記載された担当者のみが詳細情報にアクセス可能
- その他のスタッフは基本情報のみ閲覧可能

## 画面構成

### 1. クライアント一覧画面

```vue
<template>
  <div class="client-management">
    <!-- ヘッダー -->
    <div class="page-header">
      <div>
        <h1 class="page-title">クライアント管理</h1>
        <p class="page-description">
          依頼者情報の管理と案件との紐付けを行います
        </p>
      </div>
      <div class="header-actions">
        <Button @click="openCreateDialog">
          <UserPlus class="h-4 w-4 mr-2" />
          新規クライアント
        </Button>
      </div>
    </div>

    <!-- フィルター -->
    <Card class="mb-6">
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <!-- 検索 -->
          <div class="md:col-span-2">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                v-model="filters.search"
                placeholder="氏名、フリガナ、電話番号、メールアドレスで検索..."
                class="pl-10"
                @input="handleSearch"
              />
            </div>
          </div>
          
          <!-- 種別フィルター -->
          <Select v-model="filters.type">
            <SelectTrigger>
              <SelectValue placeholder="種別" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="individual">個人</SelectItem>
              <SelectItem value="corporate">法人</SelectItem>
              <SelectItem value="other">その他</SelectItem>
            </SelectContent>
          </Select>
          
          <!-- ステータスフィルター -->
          <Select v-model="filters.status">
            <SelectTrigger>
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="active">アクティブ</SelectItem>
              <SelectItem value="inactive">非アクティブ</SelectItem>
            </SelectContent>
          </Select>
        </div>
        
        <!-- アクセス可能なクライアントのみ表示 -->
        <div class="mt-3 flex items-center gap-2">
          <Checkbox 
            id="show-accessible-only"
            v-model="filters.accessibleOnly"
          />
          <Label for="show-accessible-only" class="text-sm cursor-pointer">
            アクセス権限のあるクライアントのみ表示
          </Label>
        </div>
      </CardContent>
    </Card>

    <!-- クライアント一覧 -->
    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead class="w-12">種別</TableHead>
              <TableHead>クライアント名</TableHead>
              <TableHead>連絡先</TableHead>
              <TableHead>担当弁護士</TableHead>
              <TableHead>案件数</TableHead>
              <TableHead>最終更新</TableHead>
              <TableHead class="w-20">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="client in filteredClients" 
              :key="client.id"
              class="cursor-pointer hover:bg-muted/50"
              @click="viewClientDetail(client)"
            >
              <TableCell>
                <ClientTypeIcon :type="client.type" />
              </TableCell>
              <TableCell>
                <div>
                  <div class="font-medium">{{ client.displayName }}</div>
                  <div v-if="client.furigana" class="text-sm text-muted-foreground">
                    {{ client.furigana }}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div class="space-y-1">
                  <div v-if="client.phone" class="text-sm flex items-center gap-1">
                    <Phone class="h-3 w-3" />
                    {{ formatPhone(client.phone) }}
                  </div>
                  <div v-if="client.email" class="text-sm flex items-center gap-1">
                    <Mail class="h-3 w-3" />
                    {{ client.email }}
                  </div>
                </div>
              </TableCell>
              <TableCell>
                <div v-if="client.assignedLawyers.length > 0" class="flex -space-x-2">
                  <Avatar 
                    v-for="lawyer in client.assignedLawyers.slice(0, 3)" 
                    :key="lawyer.id"
                    class="h-8 w-8 border-2 border-background"
                  >
                    <AvatarFallback>{{ lawyer.name.slice(0, 1) }}</AvatarFallback>
                  </Avatar>
                  <span v-if="client.assignedLawyers.length > 3" 
                        class="flex h-8 w-8 items-center justify-center rounded-full border-2 border-background bg-muted text-xs">
                    +{{ client.assignedLawyers.length - 3 }}
                  </span>
                </div>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  <span>{{ client.caseCount }}</span>
                  <Badge v-if="client.activeCaseCount > 0" variant="default">
                    {{ client.activeCaseCount }}進行中
                  </Badge>
                </div>
              </TableCell>
              <TableCell>
                <div class="text-sm text-muted-foreground">
                  {{ formatDate(client.updatedAt) }}
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon">
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="viewClientDetail(client)">
                      <Eye class="h-4 w-4 mr-2" />
                      詳細を見る
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      v-if="canEditClient(client)"
                      @click="openEditDialog(client)"
                    >
                      <Edit class="h-4 w-4 mr-2" />
                      編集
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="viewCases(client)">
                      <Briefcase class="h-4 w-4 mr-2" />
                      案件一覧
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      v-if="canManageAccess(client)"
                      @click="openAccessDialog(client)"
                    >
                      <Shield class="h-4 w-4 mr-2" />
                      アクセス権限
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
            v-model:current="currentPage"
            :total="totalPages"
            :per-page="perPage"
            @update:current="fetchClients"
          />
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
// 権限チェック
const canEditClient = (client: Client) => {
  // 委任状に基づくアクセス権限をチェック
  return client.assignedLawyers.some(l => l.id === currentUser.value.id) ||
         client.assignedClerks.some(c => c.id === currentUser.value.id)
}

const canManageAccess = (client: Client) => {
  // 主担当弁護士のみアクセス権限を管理可能
  return client.primaryLawyer?.id === currentUser.value.id
}

// 重複チェック警告
const duplicateWarning = ref<DuplicateClient[]>([])

watch([() => filters.value.search], async () => {
  if (filters.value.search.length >= 3) {
    // 電話番号またはメールアドレスでの重複チェック
    duplicateWarning.value = await checkDuplicates(filters.value.search)
  }
})
</script>
```

### 2. クライアント作成・編集ダイアログ

```vue
<template>
  <Dialog v-model:open="isOpen" @update:open="handleClose">
    <DialogContent class="max-w-4xl max-h-[90vh] overflow-y-auto">
      <DialogHeader>
        <DialogTitle>
          {{ isEdit ? 'クライアント情報編集' : '新規クライアント登録' }}
        </DialogTitle>
      </DialogHeader>
      
      <!-- 重複警告 -->
      <Alert v-if="duplicateClients.length > 0" variant="warning" class="mb-4">
        <AlertTriangle class="h-4 w-4" />
        <AlertTitle>類似するクライアントが見つかりました</AlertTitle>
        <AlertDescription>
          <div class="mt-2 space-y-2">
            <div v-for="dup in duplicateClients" :key="dup.id" 
                 class="flex items-center justify-between p-2 bg-muted rounded">
              <div>
                <div class="font-medium">{{ dup.displayName }}</div>
                <div class="text-sm text-muted-foreground">
                  {{ dup.phone }} / {{ dup.email }}
                </div>
              </div>
              <Button size="sm" variant="outline" @click="mergeWithExisting(dup)">
                このクライアントに統合
              </Button>
            </div>
          </div>
        </AlertDescription>
      </Alert>
      
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- クライアント種別 -->
        <div class="space-y-2">
          <Label>クライアント種別 *</Label>
          <RadioGroup v-model="formData.type">
            <div class="flex gap-4">
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="individual" id="type-individual" />
                <Label for="type-individual" class="cursor-pointer">個人</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="corporate" id="type-corporate" />
                <Label for="type-corporate" class="cursor-pointer">法人</Label>
              </div>
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="other" id="type-other" />
                <Label for="type-other" class="cursor-pointer">その他（団体等）</Label>
              </div>
            </div>
          </RadioGroup>
        </div>
        
        <!-- 基本情報（個人） -->
        <div v-if="formData.type === 'individual'" class="space-y-4">
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="lastName">姓 *</Label>
              <Input
                id="lastName"
                v-model="formData.individual.lastName"
                required
                @blur="checkDuplicates"
              />
            </div>
            <div class="space-y-2">
              <Label for="firstName">名 *</Label>
              <Input
                id="firstName"
                v-model="formData.individual.firstName"
                required
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="lastNameKana">姓（フリガナ）</Label>
              <Input
                id="lastNameKana"
                v-model="formData.individual.lastNameKana"
                placeholder="ヤマダ"
              />
            </div>
            <div class="space-y-2">
              <Label for="firstNameKana">名（フリガナ）</Label>
              <Input
                id="firstNameKana"
                v-model="formData.individual.firstNameKana"
                placeholder="タロウ"
              />
            </div>
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="birthDate">生年月日</Label>
              <DatePicker
                id="birthDate"
                v-model="formData.individual.birthDate"
              />
            </div>
            <div class="space-y-2">
              <Label for="gender">性別</Label>
              <Select v-model="formData.individual.gender">
                <SelectTrigger id="gender">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="male">男性</SelectItem>
                  <SelectItem value="female">女性</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                  <SelectItem value="prefer_not_to_say">回答しない</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
        
        <!-- 基本情報（法人） -->
        <div v-if="formData.type === 'corporate'" class="space-y-4">
          <div class="space-y-2">
            <Label for="corporateName">法人名 *</Label>
            <Input
              id="corporateName"
              v-model="formData.corporate.name"
              placeholder="株式会社○○"
              required
              @blur="checkDuplicates"
            />
          </div>
          
          <div class="space-y-2">
            <Label for="corporateNameKana">法人名（フリガナ）</Label>
            <Input
              id="corporateNameKana"
              v-model="formData.corporate.nameKana"
              placeholder="カブシキガイシャ○○"
            />
          </div>
          
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="corporateNumber">法人番号</Label>
              <Input
                id="corporateNumber"
                v-model="formData.corporate.corporateNumber"
                placeholder="1234567890123"
                maxlength="13"
              />
            </div>
            <div class="space-y-2">
              <Label for="registrationNumber">登記番号</Label>
              <Input
                id="registrationNumber"
                v-model="formData.corporate.registrationNumber"
              />
            </div>
          </div>
          
          <div class="space-y-2">
            <Label>代表者情報</Label>
            <Card>
              <CardContent class="p-4 space-y-3">
                <div class="grid grid-cols-2 gap-4">
                  <Input
                    v-model="formData.corporate.representative.lastName"
                    placeholder="代表者姓"
                  />
                  <Input
                    v-model="formData.corporate.representative.firstName"
                    placeholder="代表者名"
                  />
                </div>
                <Input
                  v-model="formData.corporate.representative.title"
                  placeholder="役職（例：代表取締役）"
                />
              </CardContent>
            </Card>
          </div>
        </div>
        
        <!-- 基本情報（その他） -->
        <div v-if="formData.type === 'other'" class="space-y-4">
          <div class="space-y-2">
            <Label for="organizationName">団体名 *</Label>
            <Input
              id="organizationName"
              v-model="formData.other.name"
              required
              @blur="checkDuplicates"
            />
          </div>
          
          <div class="space-y-2">
            <Label for="organizationType">団体種別</Label>
            <Select v-model="formData.other.organizationType">
              <SelectTrigger id="organizationType">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="union">組合</SelectItem>
                <SelectItem value="association">社団</SelectItem>
                <SelectItem value="foundation">財団</SelectItem>
                <SelectItem value="religious">宗教法人</SelectItem>
                <SelectItem value="school">学校法人</SelectItem>
                <SelectItem value="medical">医療法人</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
        
        <!-- 連絡先情報（共通） -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">連絡先情報</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="phone">電話番号</Label>
                <Input
                  id="phone"
                  v-model="formData.contact.phone"
                  type="tel"
                  placeholder="03-1234-5678"
                  @blur="checkDuplicates"
                />
              </div>
              <div class="space-y-2">
                <Label for="mobile">携帯電話</Label>
                <Input
                  id="mobile"
                  v-model="formData.contact.mobile"
                  type="tel"
                  placeholder="090-1234-5678"
                />
              </div>
            </div>
            
            <div class="space-y-2">
              <Label for="email">メールアドレス</Label>
              <Input
                id="email"
                v-model="formData.contact.email"
                type="email"
                @blur="checkDuplicates"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="postalCode">郵便番号</Label>
              <div class="flex gap-2">
                <Input
                  id="postalCode"
                  v-model="formData.contact.postalCode"
                  placeholder="123-4567"
                  class="w-40"
                />
                <Button 
                  type="button" 
                  variant="outline"
                  @click="searchAddress"
                >
                  住所検索
                </Button>
              </div>
            </div>
            
            <div class="space-y-2">
              <Label for="address">住所</Label>
              <Textarea
                id="address"
                v-model="formData.contact.address"
                rows="2"
              />
            </div>
          </CardContent>
        </Card>
        
        <!-- 詳細情報（個人のみ） -->
        <Card v-if="formData.type === 'individual'">
          <CardHeader>
            <CardTitle class="text-base">詳細情報</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- 職業情報 -->
            <div class="space-y-2">
              <Label for="occupation">職業</Label>
              <Input
                id="occupation"
                v-model="formData.individual.occupation"
                placeholder="会社員、自営業など"
              />
            </div>
            
            <div class="space-y-2">
              <Label for="employer">勤務先</Label>
              <Input
                id="employer"
                v-model="formData.individual.employer"
              />
            </div>
            
            <!-- 家族構成 -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label>家族構成</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="addFamilyMember"
                >
                  <Plus class="h-4 w-4 mr-1" />
                  追加
                </Button>
              </div>
              
              <div class="space-y-2">
                <Card v-for="(member, index) in formData.individual.familyMembers" 
                     :key="index">
                  <CardContent class="p-3">
                    <div class="flex gap-2 items-end">
                      <div class="flex-1 grid grid-cols-3 gap-2">
                        <Input
                          v-model="member.relationship"
                          placeholder="続柄（妻、子など）"
                        />
                        <Input
                          v-model="member.name"
                          placeholder="氏名"
                        />
                        <Input
                          v-model="member.age"
                          type="number"
                          placeholder="年齢"
                        />
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        @click="removeFamilyMember(index)"
                      >
                        <X class="h-4 w-4" />
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
            
            <!-- 資産状況（任意） -->
            <div class="space-y-2">
              <Label for="assetInfo">資産状況（任意）</Label>
              <Textarea
                id="assetInfo"
                v-model="formData.individual.assetInfo"
                rows="3"
                placeholder="必要に応じて記入"
              />
            </div>
          </CardContent>
        </Card>
        
        <!-- 紹介元情報 -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">紹介元情報</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="referralSource">紹介元</Label>
              <Select v-model="formData.referralSource">
                <SelectTrigger id="referralSource">
                  <SelectValue placeholder="選択してください" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="web">ウェブサイト</SelectItem>
                  <SelectItem value="existing_client">既存クライアント</SelectItem>
                  <SelectItem value="lawyer">他の弁護士</SelectItem>
                  <SelectItem value="bar_association">弁護士会</SelectItem>
                  <SelectItem value="other">その他</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div v-if="formData.referralSource === 'existing_client'" class="space-y-2">
              <Label for="referrerClient">紹介者（クライアント）</Label>
              <ClientSelect
                id="referrerClient"
                v-model="formData.referrerClientId"
              />
            </div>
            
            <div v-if="formData.referralSource === 'other'" class="space-y-2">
              <Label for="referralDetail">紹介元詳細</Label>
              <Input
                id="referralDetail"
                v-model="formData.referralDetail"
              />
            </div>
          </CardContent>
        </Card>
        
        <!-- 担当者設定（新規登録時のみ） -->
        <Card v-if="!isEdit">
          <CardHeader>
            <CardTitle class="text-base">担当者設定</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="space-y-2">
              <Label for="primaryLawyer">主担当弁護士 *</Label>
              <LawyerSelect
                id="primaryLawyer"
                v-model="formData.primaryLawyerId"
                required
              />
            </div>
            
            <div class="space-y-2">
              <Label for="assignedClerks">担当事務員</Label>
              <ClerkMultiSelect
                id="assignedClerks"
                v-model="formData.assignedClerkIds"
              />
            </div>
          </CardContent>
        </Card>
        
        <!-- メモ -->
        <div class="space-y-2">
          <Label for="notes">メモ</Label>
          <Textarea
            id="notes"
            v-model="formData.notes"
            rows="3"
            placeholder="その他の情報"
          />
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose">
            キャンセル
          </Button>
          <Button type="submit" :disabled="isLoading || !isValid">
            <Loader2 v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
            {{ isEdit ? '更新' : '登録' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
// 重複チェック
const checkDuplicates = debounce(async () => {
  const checkData = {
    phone: formData.value.contact.phone,
    email: formData.value.contact.email,
    name: getClientDisplayName(formData.value)
  }
  
  duplicateClients.value = await $fetch('/api/v1/clients/check-duplicates', {
    method: 'POST',
    body: checkData
  })
}, 500)

// 既存クライアントとの統合
const mergeWithExisting = async (existingClient: Client) => {
  const confirmed = await confirm({
    title: 'クライアント統合の確認',
    description: `このクライアントを「${existingClient.displayName}」に統合しますか？`,
    confirmText: '統合する',
    confirmVariant: 'default'
  })
  
  if (confirmed) {
    // 統合処理
    await navigateTo(`/clients/${existingClient.id}`)
  }
}
</script>
```

### 3. クライアント詳細画面

```vue
<template>
  <div class="client-detail">
    <!-- ヘッダー -->
    <div class="page-header">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="$router.back()">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <div>
          <div class="flex items-center gap-2">
            <ClientTypeIcon :type="client.type" class="h-5 w-5" />
            <h1 class="page-title">{{ client.displayName }}</h1>
          </div>
          <p class="text-muted-foreground">
            {{ client.furigana }}
          </p>
        </div>
      </div>
      
      <div class="header-actions">
        <Button
          v-if="canEdit"
          variant="outline"
          @click="openEditDialog"
        >
          <Edit class="h-4 w-4 mr-2" />
          編集
        </Button>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="icon">
              <MoreVertical class="h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem @click="exportClientInfo">
              <Download class="h-4 w-4 mr-2" />
              情報をエクスポート
            </DropdownMenuItem>
            <DropdownMenuItem @click="printClientInfo">
              <Printer class="h-4 w-4 mr-2" />
              印刷
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              v-if="canManageAccess"
              @click="openAccessDialog"
            >
              <Shield class="h-4 w-4 mr-2" />
              アクセス権限管理
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </div>
    
    <!-- タブ -->
    <Tabs v-model="activeTab" class="mt-6">
      <TabsList>
        <TabsTrigger value="overview">概要</TabsTrigger>
        <TabsTrigger value="cases">
          案件
          <Badge v-if="activeCaseCount > 0" variant="default" class="ml-2">
            {{ activeCaseCount }}
          </Badge>
        </TabsTrigger>
        <TabsTrigger value="documents">書類</TabsTrigger>
        <TabsTrigger value="communications">連絡履歴</TabsTrigger>
        <TabsTrigger value="billing">請求・入金</TabsTrigger>
        <TabsTrigger value="notes">メモ</TabsTrigger>
      </TabsList>
      
      <!-- 概要タブ -->
      <TabsContent value="overview" class="space-y-6">
        <!-- 基本情報 -->
        <Card>
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <!-- 個人の場合 -->
              <template v-if="client.type === 'individual'">
                <div>
                  <dt class="text-sm text-muted-foreground">氏名</dt>
                  <dd class="font-medium">
                    {{ client.individual.lastName }} {{ client.individual.firstName }}
                  </dd>
                </div>
                <div>
                  <dt class="text-sm text-muted-foreground">フリガナ</dt>
                  <dd>
                    {{ client.individual.lastNameKana }} {{ client.individual.firstNameKana }}
                  </dd>
                </div>
                <div v-if="canViewDetails">
                  <dt class="text-sm text-muted-foreground">生年月日</dt>
                  <dd>{{ formatDate(client.individual.birthDate) }}</dd>
                </div>
                <div v-if="canViewDetails">
                  <dt class="text-sm text-muted-foreground">年齢</dt>
                  <dd>{{ calculateAge(client.individual.birthDate) }}歳</dd>
                </div>
              </template>
              
              <!-- 法人の場合 -->
              <template v-if="client.type === 'corporate'">
                <div>
                  <dt class="text-sm text-muted-foreground">法人名</dt>
                  <dd class="font-medium">{{ client.corporate.name }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-muted-foreground">法人番号</dt>
                  <dd>{{ client.corporate.corporateNumber || '-' }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-muted-foreground">代表者</dt>
                  <dd>
                    {{ client.corporate.representative.title }}
                    {{ client.corporate.representative.lastName }}
                    {{ client.corporate.representative.firstName }}
                  </dd>
                </div>
              </template>
            </dl>
          </CardContent>
        </Card>
        
        <!-- 連絡先情報 -->
        <Card>
          <CardHeader>
            <CardTitle>連絡先情報</CardTitle>
          </CardHeader>
          <CardContent>
            <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <dt class="text-sm text-muted-foreground">電話番号</dt>
                <dd class="flex items-center gap-2">
                  <span>{{ formatPhone(client.contact.phone) || '-' }}</span>
                  <Button
                    v-if="client.contact.phone"
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6"
                    @click="copyToClipboard(client.contact.phone)"
                  >
                    <Copy class="h-3 w-3" />
                  </Button>
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">携帯電話</dt>
                <dd class="flex items-center gap-2">
                  <span>{{ formatPhone(client.contact.mobile) || '-' }}</span>
                  <Button
                    v-if="client.contact.mobile"
                    variant="ghost"
                    size="icon"
                    class="h-6 w-6"
                    @click="copyToClipboard(client.contact.mobile)"
                  >
                    <Copy class="h-3 w-3" />
                  </Button>
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">メールアドレス</dt>
                <dd class="flex items-center gap-2">
                  <a 
                    v-if="client.contact.email"
                    :href="`mailto:${client.contact.email}`"
                    class="text-primary hover:underline"
                  >
                    {{ client.contact.email }}
                  </a>
                  <span v-else>-</span>
                </dd>
              </div>
              <div>
                <dt class="text-sm text-muted-foreground">住所</dt>
                <dd>
                  <div v-if="client.contact.postalCode" class="text-sm text-muted-foreground">
                    〒{{ client.contact.postalCode }}
                  </div>
                  <div>{{ client.contact.address || '-' }}</div>
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <!-- 詳細情報（個人のみ、アクセス権限がある場合） -->
        <Card v-if="client.type === 'individual' && canViewDetails">
          <CardHeader>
            <CardTitle>詳細情報</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- 職業情報 -->
            <div>
              <h4 class="font-medium mb-2">職業情報</h4>
              <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt class="text-sm text-muted-foreground">職業</dt>
                  <dd>{{ client.individual.occupation || '-' }}</dd>
                </div>
                <div>
                  <dt class="text-sm text-muted-foreground">勤務先</dt>
                  <dd>{{ client.individual.employer || '-' }}</dd>
                </div>
              </dl>
            </div>
            
            <!-- 家族構成 -->
            <div v-if="client.individual.familyMembers?.length > 0">
              <h4 class="font-medium mb-2">家族構成</h4>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>続柄</TableHead>
                    <TableHead>氏名</TableHead>
                    <TableHead>年齢</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="member in client.individual.familyMembers" :key="member.id">
                    <TableCell>{{ member.relationship }}</TableCell>
                    <TableCell>{{ member.name }}</TableCell>
                    <TableCell>{{ member.age }}歳</TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </div>
            
            <!-- 資産状況 -->
            <div v-if="client.individual.assetInfo">
              <h4 class="font-medium mb-2">資産状況</h4>
              <div class="p-3 bg-muted rounded-md">
                <p class="whitespace-pre-wrap">{{ client.individual.assetInfo }}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- アクセス権限表示 -->
        <Card>
          <CardHeader>
            <CardTitle>担当者情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <!-- 主担当弁護士 -->
              <div>
                <Label class="text-muted-foreground">主担当弁護士</Label>
                <div class="flex items-center gap-2 mt-1">
                  <Avatar>
                    <AvatarFallback>
                      {{ client.primaryLawyer.name.slice(0, 1) }}
                    </AvatarFallback>
                  </Avatar>
                  <span class="font-medium">{{ client.primaryLawyer.name }}</span>
                </div>
              </div>
              
              <!-- その他の担当弁護士 -->
              <div v-if="client.assignedLawyers.length > 1">
                <Label class="text-muted-foreground">担当弁護士</Label>
                <div class="flex flex-wrap gap-2 mt-1">
                  <div v-for="lawyer in client.assignedLawyers.filter(l => l.id !== client.primaryLawyer.id)" 
                       :key="lawyer.id"
                       class="flex items-center gap-2">
                    <Avatar class="h-8 w-8">
                      <AvatarFallback class="text-xs">
                        {{ lawyer.name.slice(0, 1) }}
                      </AvatarFallback>
                    </Avatar>
                    <span class="text-sm">{{ lawyer.name }}</span>
                  </div>
                </div>
              </div>
              
              <!-- 担当事務員 -->
              <div v-if="client.assignedClerks.length > 0">
                <Label class="text-muted-foreground">担当事務員</Label>
                <div class="flex flex-wrap gap-2 mt-1">
                  <div v-for="clerk in client.assignedClerks" 
                       :key="clerk.id"
                       class="flex items-center gap-2">
                    <Avatar class="h-8 w-8">
                      <AvatarFallback class="text-xs">
                        {{ clerk.name.slice(0, 1) }}
                      </AvatarFallback>
                    </Avatar>
                    <span class="text-sm">{{ clerk.name }}</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      
      <!-- 案件タブ -->
      <TabsContent value="cases">
        <ClientCaseList :clientId="client.id" />
      </TabsContent>
      
      <!-- 書類タブ -->
      <TabsContent value="documents">
        <ClientDocumentList :clientId="client.id" />
      </TabsContent>
      
      <!-- 連絡履歴タブ -->
      <TabsContent value="communications">
        <ClientCommunicationHistory :clientId="client.id" />
      </TabsContent>
      
      <!-- 請求・入金タブ -->
      <TabsContent value="billing">
        <ClientBillingHistory :clientId="client.id" />
      </TabsContent>
      
      <!-- メモタブ -->
      <TabsContent value="notes">
        <ClientNotes 
          :clientId="client.id" 
          :canEdit="canEdit"
        />
      </TabsContent>
    </Tabs>
  </div>
</template>

<script setup lang="ts">
// アクセス権限チェック
const canViewDetails = computed(() => {
  // 委任状に基づくアクセス権限チェック
  return client.value.assignedLawyers.some(l => l.id === currentUser.value.id) ||
         client.value.assignedClerks.some(c => c.id === currentUser.value.id)
})

const canEdit = computed(() => canViewDetails.value)

const canManageAccess = computed(() => {
  // 主担当弁護士のみ
  return client.value.primaryLawyer.id === currentUser.value.id
})
</script>
```

### 4. クライアントポータル（読み取り専用）

```vue
<template>
  <div class="client-portal">
    <!-- ヘッダー -->
    <div class="portal-header">
      <div class="container mx-auto px-4 py-6">
        <h1 class="text-2xl font-bold">マイページ</h1>
        <p class="text-muted-foreground">
          案件の進捗状況と書類を確認できます
        </p>
      </div>
    </div>
    
    <div class="container mx-auto px-4 py-8">
      <!-- プロフィール情報 -->
      <Card class="mb-6">
        <CardHeader>
          <CardTitle>プロフィール情報</CardTitle>
        </CardHeader>
        <CardContent>
          <dl class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <dt class="text-sm text-muted-foreground">お名前</dt>
              <dd class="font-medium">{{ currentClient.displayName }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">メールアドレス</dt>
              <dd>{{ currentClient.contact.email }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">電話番号</dt>
              <dd>{{ formatPhone(currentClient.contact.phone) }}</dd>
            </div>
            <div>
              <dt class="text-sm text-muted-foreground">担当弁護士</dt>
              <dd>{{ currentClient.primaryLawyer.name }}</dd>
            </div>
          </dl>
        </CardContent>
      </Card>
      
      <!-- 案件一覧 -->
      <Card>
        <CardHeader>
          <CardTitle>案件一覧</CardTitle>
        </CardHeader>
        <CardContent class="p-0">
          <div v-if="cases.length === 0" class="p-8 text-center text-muted-foreground">
            現在進行中の案件はありません
          </div>
          
          <div v-else class="divide-y">
            <div v-for="case in cases" :key="case.id" 
                 class="p-4 hover:bg-muted/50 cursor-pointer"
                 @click="viewCaseDetail(case)">
              <div class="flex items-start justify-between">
                <div class="space-y-1">
                  <h3 class="font-medium">{{ case.title }}</h3>
                  <p class="text-sm text-muted-foreground">
                    案件番号: {{ case.caseNumber }}
                  </p>
                </div>
                <Badge :variant="getStatusVariant(case.status)">
                  {{ case.statusLabel }}
                </Badge>
              </div>
              
              <!-- 進捗バー -->
              <div class="mt-3">
                <div class="flex items-center justify-between text-sm mb-1">
                  <span class="text-muted-foreground">進捗</span>
                  <span>{{ case.progressPercentage }}%</span>
                </div>
                <Progress :value="case.progressPercentage" />
              </div>
              
              <!-- 最新の更新 -->
              <div v-if="case.latestUpdate" class="mt-3 p-2 bg-muted rounded-md">
                <p class="text-sm">
                  <span class="text-muted-foreground">
                    {{ formatDate(case.latestUpdate.date) }}
                  </span>
                  {{ case.latestUpdate.content }}
                </p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
// クライアントポータル用の認証
const { currentClient } = useClientAuth()

// 読み取り専用のため、編集機能は一切含まない
const viewCaseDetail = (case: Case) => {
  navigateTo(`/portal/cases/${case.id}`)
}
</script>
```

## データモデル

```typescript
// クライアント基本型
interface Client {
  id: string
  type: 'individual' | 'corporate' | 'other'
  displayName: string // 表示用の名前（自動生成）
  
  // 種別ごとの詳細情報
  individual?: IndividualClient
  corporate?: CorporateClient
  other?: OtherClient
  
  // 共通情報
  contact: ContactInfo
  referralSource?: string
  referrerClientId?: string
  referralDetail?: string
  notes?: string
  
  // 担当者情報
  primaryLawyer: User
  assignedLawyers: User[]
  assignedClerks: User[]
  
  // 関連情報
  caseCount: number
  activeCaseCount: number
  
  // システム情報
  createdAt: Date
  updatedAt: Date
  createdBy: User
  updatedBy: User
}

// 個人クライアント
interface IndividualClient {
  lastName: string
  firstName: string
  lastNameKana?: string
  firstNameKana?: string
  birthDate?: Date
  gender?: 'male' | 'female' | 'other' | 'prefer_not_to_say'
  
  // 詳細情報
  occupation?: string
  employer?: string
  familyMembers?: FamilyMember[]
  assetInfo?: string
}

// 法人クライアント
interface CorporateClient {
  name: string
  nameKana?: string
  corporateNumber?: string
  registrationNumber?: string
  representative: {
    lastName?: string
    firstName?: string
    title?: string
  }
}

// その他の団体
interface OtherClient {
  name: string
  nameKana?: string
  organizationType?: string
}

// 連絡先情報
interface ContactInfo {
  phone?: string
  mobile?: string
  email?: string
  postalCode?: string
  address?: string
}

// 家族構成
interface FamilyMember {
  id: string
  relationship: string
  name?: string
  age?: number
}
```

## 権限制御

### アクセスレベル
1. **フルアクセス**: 主担当弁護士
2. **編集アクセス**: 担当弁護士・担当事務員
3. **閲覧アクセス**: その他（基本情報のみ）
4. **クライアントアクセス**: 本人（読み取り専用）

### 詳細情報へのアクセス
- 生年月日、家族構成、資産状況などの詳細情報は担当者のみ閲覧可能
- アクセスログを記録し、監査証跡を残す