# 請求書管理画面設計

## 概要

法律事務所の多様な請求業務に対応する請求書管理機能です。着手金、中間金、成功報酬、実費精算、タイムチャージなど複数種類の請求書に対応し、書類作成と同様の柔軟なカスタマイズを可能にします。メール、郵送、FAX、電子請求書サービスなど多様な送付方法をサポートし、クライアントポータルでの閲覧も実現します。

## 設計方針

### 1. 複数種類の請求書対応
- 着手金、中間金、成功報酬、実費精算、タイムチャージの各請求書タイプ
- 案件の進行に応じた適切な請求書発行

### 2. 承認不要のシンプルな運用
- 担当弁護士が直接発行可能
- 迅速な請求書発行を実現

### 3. 完全カスタマイズ可能
- 書類作成機能と同様の柔軟な編集機能
- 項目の自由な追加・削除・並び替え
- 複数のテンプレート管理

### 4. 高度な送付管理
- メール、郵送、FAX、電子請求書サービス対応
- クライアントポータルでの閲覧
- 電子署名・タイムスタンプ対応

### 5. 手動での入金消込
- 請求書と入金の手動紐付け
- シンプルで確実な管理

## 画面構成

### 1. 請求書一覧画面

```vue
<template>
  <div class="invoice-management">
    <!-- ヘッダー -->
    <div class="page-header">
      <div>
        <h1 class="page-title">請求書管理</h1>
        <p class="page-description">
          請求書の作成、送付、入金状況を管理します
        </p>
      </div>
      <div class="header-actions">
        <Button @click="openCreateDialog">
          <FileText class="h-4 w-4 mr-2" />
          新規請求書
        </Button>
      </div>
    </div>
    
    <!-- 統計カード -->
    <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">今月の請求額</p>
              <p class="text-2xl font-bold">
                ¥{{ formatCurrency(stats.currentMonthTotal) }}
              </p>
            </div>
            <TrendingUp class="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">未収金額</p>
              <p class="text-2xl font-bold text-orange-600">
                ¥{{ formatCurrency(stats.unpaidTotal) }}
              </p>
            </div>
            <Clock class="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">今月の入金額</p>
              <p class="text-2xl font-bold text-green-600">
                ¥{{ formatCurrency(stats.currentMonthPaid) }}
              </p>
            </div>
            <CheckCircle class="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardContent class="p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm text-muted-foreground">請求書発行数</p>
              <p class="text-2xl font-bold">{{ stats.currentMonthCount }}</p>
            </div>
            <FileText class="h-8 w-8 text-muted-foreground" />
          </div>
        </CardContent>
      </Card>
    </div>
    
    <!-- フィルター -->
    <Card class="mb-6">
      <CardContent class="p-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <!-- 検索 -->
          <div class="md:col-span-2">
            <div class="relative">
              <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                v-model="filters.search"
                placeholder="請求書番号、クライアント名、案件名で検索..."
                class="pl-10"
              />
            </div>
          </div>
          
          <!-- 請求書種別 -->
          <Select v-model="filters.type">
            <SelectTrigger>
              <SelectValue placeholder="種別" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="retainer">着手金</SelectItem>
              <SelectItem value="interim">中間金</SelectItem>
              <SelectItem value="success">成功報酬</SelectItem>
              <SelectItem value="expense">実費精算</SelectItem>
              <SelectItem value="timecharge">タイムチャージ</SelectItem>
            </SelectContent>
          </Select>
          
          <!-- ステータス -->
          <Select v-model="filters.status">
            <SelectTrigger>
              <SelectValue placeholder="ステータス" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">すべて</SelectItem>
              <SelectItem value="draft">下書き</SelectItem>
              <SelectItem value="issued">発行済み</SelectItem>
              <SelectItem value="sent">送付済み</SelectItem>
              <SelectItem value="viewed">閲覧済み</SelectItem>
              <SelectItem value="paid">入金済み</SelectItem>
              <SelectItem value="overdue">支払期限超過</SelectItem>
              <SelectItem value="cancelled">キャンセル</SelectItem>
            </SelectContent>
          </Select>
          
          <!-- 期間 -->
          <DateRangePicker
            v-model="filters.dateRange"
            placeholder="期間を選択"
          />
        </div>
      </CardContent>
    </Card>
    
    <!-- 請求書一覧 -->
    <Card>
      <CardContent class="p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>請求書番号</TableHead>
              <TableHead>発行日</TableHead>
              <TableHead>種別</TableHead>
              <TableHead>クライアント</TableHead>
              <TableHead>案件</TableHead>
              <TableHead class="text-right">請求額</TableHead>
              <TableHead>支払期限</TableHead>
              <TableHead>ステータス</TableHead>
              <TableHead>送付方法</TableHead>
              <TableHead class="w-20">操作</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            <TableRow 
              v-for="invoice in invoices" 
              :key="invoice.id"
              class="cursor-pointer hover:bg-muted/50"
              @click="viewInvoice(invoice)"
            >
              <TableCell>
                <div class="font-medium">{{ invoice.invoiceNumber }}</div>
              </TableCell>
              <TableCell>{{ formatDate(invoice.issueDate) }}</TableCell>
              <TableCell>
                <Badge :variant="getTypeVariant(invoice.type)">
                  {{ getTypeLabel(invoice.type) }}
                </Badge>
              </TableCell>
              <TableCell>{{ invoice.client.displayName }}</TableCell>
              <TableCell>
                <NuxtLink 
                  :to="`/cases/${invoice.case.id}`"
                  class="text-primary hover:underline"
                  @click.stop
                >
                  {{ invoice.case.caseNumber }}
                </NuxtLink>
              </TableCell>
              <TableCell class="text-right font-medium">
                ¥{{ formatCurrency(invoice.totalAmount) }}
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-2">
                  {{ formatDate(invoice.dueDate) }}
                  <AlertCircle 
                    v-if="isOverdue(invoice)" 
                    class="h-4 w-4 text-red-600" 
                  />
                </div>
              </TableCell>
              <TableCell>
                <Badge :variant="getStatusVariant(invoice.status)">
                  {{ getStatusLabel(invoice.status) }}
                </Badge>
              </TableCell>
              <TableCell>
                <div class="flex items-center gap-1">
                  <Mail v-if="invoice.sentVia.includes('email')" 
                        class="h-4 w-4 text-muted-foreground" />
                  <Printer v-if="invoice.sentVia.includes('postal')" 
                           class="h-4 w-4 text-muted-foreground" />
                  <Phone v-if="invoice.sentVia.includes('fax')" 
                         class="h-4 w-4 text-muted-foreground" />
                  <Globe v-if="invoice.sentVia.includes('portal')" 
                         class="h-4 w-4 text-muted-foreground" />
                </div>
              </TableCell>
              <TableCell>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" @click.stop>
                      <MoreHorizontal class="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem @click="viewInvoice(invoice)">
                      <Eye class="h-4 w-4 mr-2" />
                      詳細を見る
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      v-if="invoice.status === 'draft'"
                      @click="editInvoice(invoice)"
                    >
                      <Edit class="h-4 w-4 mr-2" />
                      編集
                    </DropdownMenuItem>
                    <DropdownMenuItem @click="duplicateInvoice(invoice)">
                      <Copy class="h-4 w-4 mr-2" />
                      複製
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem 
                      v-if="['draft', 'issued'].includes(invoice.status)"
                      @click="openSendDialog(invoice)"
                    >
                      <Send class="h-4 w-4 mr-2" />
                      送付
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      v-if="invoice.status !== 'paid'"
                      @click="openPaymentDialog(invoice)"
                    >
                      <CreditCard class="h-4 w-4 mr-2" />
                      入金記録
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem @click="downloadPDF(invoice)">
                      <Download class="h-4 w-4 mr-2" />
                      PDFダウンロード
                    </DropdownMenuItem>
                    <DropdownMenuItem 
                      v-if="['draft', 'cancelled'].includes(invoice.status)"
                      @click="deleteInvoice(invoice)"
                      class="text-destructive"
                    >
                      <Trash2 class="h-4 w-4 mr-2" />
                      削除
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
          />
        </div>
      </CardContent>
    </Card>
  </div>
</template>

<script setup lang="ts">
// 請求書タイプのラベル
const getTypeLabel = (type: string) => {
  const labels = {
    retainer: '着手金',
    interim: '中間金',
    success: '成功報酬',
    expense: '実費精算',
    timecharge: 'タイムチャージ'
  }
  return labels[type] || type
}

// ステータスのラベル
const getStatusLabel = (status: string) => {
  const labels = {
    draft: '下書き',
    issued: '発行済み',
    sent: '送付済み',
    viewed: '閲覧済み',
    paid: '入金済み',
    overdue: '期限超過',
    cancelled: 'キャンセル'
  }
  return labels[status] || status
}

// 支払期限超過チェック
const isOverdue = (invoice: Invoice) => {
  return invoice.status !== 'paid' && 
         invoice.status !== 'cancelled' &&
         new Date(invoice.dueDate) < new Date()
}
</script>
```

### 2. 請求書作成・編集画面（エディター形式）

```vue
<template>
  <div class="invoice-editor">
    <!-- ヘッダー -->
    <div class="editor-header">
      <div class="flex items-center gap-4">
        <Button variant="ghost" size="icon" @click="handleBack">
          <ArrowLeft class="h-4 w-4" />
        </Button>
        <h1 class="text-xl font-semibold">
          {{ isEdit ? '請求書編集' : '新規請求書作成' }}
        </h1>
        <Badge v-if="invoice.status" :variant="getStatusVariant(invoice.status)">
          {{ getStatusLabel(invoice.status) }}
        </Badge>
      </div>
      
      <div class="header-actions">
        <!-- テンプレート選択 -->
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <FileText class="h-4 w-4 mr-2" />
              テンプレート
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent class="w-64">
            <DropdownMenuLabel>テンプレートを選択</DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              v-for="template in templates" 
              :key="template.id"
              @click="loadTemplate(template)"
            >
              <div>
                <div class="font-medium">{{ template.name }}</div>
                <div class="text-sm text-muted-foreground">
                  {{ template.description }}
                </div>
              </div>
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem @click="saveAsTemplate">
              <Save class="h-4 w-4 mr-2" />
              現在の内容をテンプレートとして保存
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
        
        <!-- プレビュー -->
        <Button variant="outline" @click="togglePreview">
          <Eye class="h-4 w-4 mr-2" />
          プレビュー
        </Button>
        
        <!-- 保存 -->
        <Button variant="outline" @click="saveDraft">
          下書き保存
        </Button>
        
        <!-- 発行 -->
        <Button @click="issueInvoice" :disabled="!isValid">
          請求書を発行
        </Button>
      </div>
    </div>
    
    <!-- エディターとプレビュー -->
    <div class="editor-container">
      <!-- エディター -->
      <div class="editor-panel" :class="{ 'w-1/2': showPreview }">
        <!-- 基本情報 -->
        <Card class="mb-6">
          <CardHeader>
            <CardTitle>基本情報</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <!-- 請求書番号 -->
              <div class="space-y-2">
                <Label for="invoice-number">請求書番号</Label>
                <Input
                  id="invoice-number"
                  v-model="invoice.invoiceNumber"
                  placeholder="自動採番"
                  disabled
                />
              </div>
              
              <!-- 発行日 -->
              <div class="space-y-2">
                <Label for="issue-date">発行日 *</Label>
                <DatePicker
                  id="issue-date"
                  v-model="invoice.issueDate"
                />
              </div>
              
              <!-- 請求書種別 -->
              <div class="space-y-2">
                <Label for="invoice-type">種別 *</Label>
                <Select v-model="invoice.type">
                  <SelectTrigger id="invoice-type">
                    <SelectValue placeholder="選択してください" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="retainer">着手金請求書</SelectItem>
                    <SelectItem value="interim">中間金請求書</SelectItem>
                    <SelectItem value="success">成功報酬請求書</SelectItem>
                    <SelectItem value="expense">実費精算請求書</SelectItem>
                    <SelectItem value="timecharge">タイムチャージ請求書</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <!-- 支払期限 -->
              <div class="space-y-2">
                <Label for="due-date">支払期限 *</Label>
                <DatePicker
                  id="due-date"
                  v-model="invoice.dueDate"
                />
              </div>
            </div>
            
            <!-- 案件選択 -->
            <div class="space-y-2">
              <Label for="case">関連案件 *</Label>
              <CaseSelect
                id="case"
                v-model="invoice.caseId"
                @update:modelValue="onCaseChange"
              />
            </div>
            
            <!-- クライアント情報（自動入力） -->
            <div v-if="selectedCase" class="p-4 bg-muted rounded-lg">
              <div class="text-sm font-medium mb-2">請求先</div>
              <div class="space-y-1 text-sm">
                <div>{{ selectedCase.client.displayName }}</div>
                <div v-if="selectedCase.client.contact.address">
                  〒{{ selectedCase.client.contact.postalCode }}
                  {{ selectedCase.client.contact.address }}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- 請求内容（エディター） -->
        <Card>
          <CardHeader>
            <CardTitle>請求内容</CardTitle>
          </CardHeader>
          <CardContent>
            <!-- リッチエディター風の編集エリア -->
            <div class="invoice-content-editor">
              <!-- ツールバー -->
              <div class="editor-toolbar">
                <ToggleGroup type="single" size="sm">
                  <ToggleGroupItem value="text" @click="insertElement('text')">
                    <Type class="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="table" @click="insertElement('table')">
                    <Table2 class="h-4 w-4" />
                  </ToggleGroupItem>
                  <ToggleGroupItem value="separator" @click="insertElement('separator')">
                    <Minus class="h-4 w-4" />
                  </ToggleGroupItem>
                </ToggleGroup>
                
                <Separator orientation="vertical" class="mx-2 h-6" />
                
                <!-- テーブル操作（テーブル選択時のみ表示） -->
                <div v-if="selectedElement?.type === 'table'" class="flex items-center gap-2">
                  <Button size="sm" variant="ghost" @click="addTableRow">
                    <Plus class="h-4 w-4 mr-1" />
                    行追加
                  </Button>
                  <Button size="sm" variant="ghost" @click="addTableColumn">
                    <Plus class="h-4 w-4 mr-1" />
                    列追加
                  </Button>
                </div>
              </div>
              
              <!-- コンテンツエリア -->
              <div class="editor-content">
                <draggable 
                  v-model="invoice.elements" 
                  item-key="id"
                  handle=".drag-handle"
                  class="space-y-4"
                >
                  <template #item="{ element, index }">
                    <div 
                      class="element-container"
                      :class="{ 'selected': selectedElement?.id === element.id }"
                      @click="selectElement(element)"
                    >
                      <!-- ドラッグハンドル -->
                      <div class="drag-handle">
                        <GripVertical class="h-4 w-4" />
                      </div>
                      
                      <!-- テキスト要素 -->
                      <div v-if="element.type === 'text'" class="element-content">
                        <Textarea
                          v-model="element.content"
                          :placeholder="element.placeholder || 'テキストを入力...'"
                          class="min-h-[60px] resize-y"
                          @input="updateElement(element)"
                        />
                      </div>
                      
                      <!-- テーブル要素 -->
                      <div v-if="element.type === 'table'" class="element-content">
                        <div class="overflow-x-auto">
                          <table class="invoice-table">
                            <thead>
                              <tr>
                                <th v-for="(header, colIndex) in element.headers" 
                                    :key="colIndex"
                                    class="relative">
                                  <input
                                    v-model="header.text"
                                    class="header-input"
                                    @input="updateElement(element)"
                                  />
                                </th>
                              </tr>
                            </thead>
                            <tbody>
                              <tr v-for="(row, rowIndex) in element.rows" :key="rowIndex">
                                <td v-for="(cell, colIndex) in row.cells" :key="colIndex">
                                  <input
                                    v-if="cell.type === 'text'"
                                    v-model="cell.value"
                                    class="cell-input"
                                    @input="updateElement(element)"
                                  />
                                  <input
                                    v-else-if="cell.type === 'number'"
                                    v-model.number="cell.value"
                                    type="number"
                                    class="cell-input text-right"
                                    @input="updateElement(element)"
                                  />
                                  <DatePicker
                                    v-else-if="cell.type === 'date'"
                                    v-model="cell.value"
                                    class="cell-input"
                                    @update:modelValue="updateElement(element)"
                                  />
                                </td>
                              </tr>
                              <!-- 合計行 -->
                              <tr v-if="element.showTotal" class="total-row">
                                <td :colspan="element.headers.length - 1" class="text-right font-medium">
                                  合計
                                </td>
                                <td class="text-right font-medium">
                                  ¥{{ formatCurrency(calculateTableTotal(element)) }}
                                </td>
                              </tr>
                            </tbody>
                          </table>
                        </div>
                        
                        <!-- テーブル設定 -->
                        <div class="mt-2 flex items-center gap-4 text-sm">
                          <label class="flex items-center gap-2">
                            <Checkbox 
                              v-model="element.showTotal"
                              @update:checked="updateElement(element)"
                            />
                            合計を表示
                          </label>
                          <label class="flex items-center gap-2">
                            <Checkbox 
                              v-model="element.includeTax"
                              @update:checked="updateElement(element)"
                            />
                            税込み計算
                          </label>
                        </div>
                      </div>
                      
                      <!-- 区切り線要素 -->
                      <div v-if="element.type === 'separator'" class="element-content">
                        <Separator />
                      </div>
                      
                      <!-- 削除ボタン -->
                      <Button
                        variant="ghost"
                        size="icon"
                        class="delete-button"
                        @click.stop="removeElement(index)"
                      >
                        <X class="h-4 w-4" />
                      </Button>
                    </div>
                  </template>
                </draggable>
                
                <!-- 要素追加ボタン -->
                <Button
                  variant="outline"
                  class="w-full mt-4"
                  @click="showAddElementMenu"
                >
                  <Plus class="h-4 w-4 mr-2" />
                  要素を追加
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- 振込先情報 -->
        <Card class="mt-6">
          <CardHeader>
            <CardTitle>振込先情報</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-4">
              <div class="space-y-2">
                <Label for="bank-name">銀行名</Label>
                <Input
                  id="bank-name"
                  v-model="invoice.bankInfo.bankName"
                  placeholder="○○銀行"
                />
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="branch-name">支店名</Label>
                  <Input
                    id="branch-name"
                    v-model="invoice.bankInfo.branchName"
                    placeholder="○○支店"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="account-type">口座種別</Label>
                  <Select v-model="invoice.bankInfo.accountType">
                    <SelectTrigger id="account-type">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="normal">普通</SelectItem>
                      <SelectItem value="current">当座</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div class="grid grid-cols-2 gap-4">
                <div class="space-y-2">
                  <Label for="account-number">口座番号</Label>
                  <Input
                    id="account-number"
                    v-model="invoice.bankInfo.accountNumber"
                    placeholder="1234567"
                  />
                </div>
                <div class="space-y-2">
                  <Label for="account-name">口座名義</Label>
                  <Input
                    id="account-name"
                    v-model="invoice.bankInfo.accountName"
                    placeholder="○○法律事務所"
                  />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- 備考 -->
        <Card class="mt-6">
          <CardHeader>
            <CardTitle>備考</CardTitle>
          </CardHeader>
          <CardContent>
            <Textarea
              v-model="invoice.remarks"
              rows="3"
              placeholder="請求書に記載する備考事項"
            />
          </CardContent>
        </Card>
      </div>
      
      <!-- プレビュー -->
      <div v-if="showPreview" class="preview-panel">
        <div class="preview-header">
          <h3 class="font-medium">プレビュー</h3>
          <Button variant="ghost" size="icon" @click="togglePreview">
            <X class="h-4 w-4" />
          </Button>
        </div>
        <div class="preview-content">
          <InvoicePreview :invoice="invoice" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import draggable from 'vuedraggable'

// デフォルトテンプレート
const defaultTemplates = {
  retainer: {
    name: '着手金請求書テンプレート',
    elements: [
      {
        id: '1',
        type: 'text',
        content: '下記のとおりご請求申し上げます。',
      },
      {
        id: '2',
        type: 'table',
        headers: [
          { text: '項目' },
          { text: '内容' },
          { text: '金額' }
        ],
        rows: [
          {
            cells: [
              { type: 'text', value: '着手金' },
              { type: 'text', value: '' },
              { type: 'number', value: 0 }
            ]
          }
        ],
        showTotal: true,
        includeTax: true
      }
    ]
  },
  expense: {
    name: '実費精算請求書テンプレート',
    elements: [
      {
        id: '1',
        type: 'text',
        content: '下記のとおり実費を精算させていただきます。',
      },
      {
        id: '2',
        type: 'table',
        headers: [
          { text: '日付' },
          { text: '項目' },
          { text: '内容' },
          { text: '金額' }
        ],
        rows: [],
        showTotal: true,
        includeTax: false
      }
    ]
  }
}

// 要素の挿入
const insertElement = (type: string) => {
  const newElement = {
    id: generateId(),
    type,
    ...getDefaultElementProps(type)
  }
  invoice.value.elements.push(newElement)
}

// テーブルの合計計算
const calculateTableTotal = (table: TableElement) => {
  return table.rows.reduce((sum, row) => {
    const amountCell = row.cells[row.cells.length - 1]
    return sum + (amountCell.type === 'number' ? amountCell.value : 0)
  }, 0)
}
</script>
```

### 3. 請求書送付ダイアログ

```vue
<template>
  <Dialog v-model:open="isOpen" @update:open="handleClose">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>請求書送付</DialogTitle>
        <DialogDescription>
          請求書の送付方法を選択してください
        </DialogDescription>
      </DialogHeader>
      
      <div class="space-y-6">
        <!-- 送付方法選択 -->
        <div class="space-y-3">
          <Label>送付方法（複数選択可）</Label>
          
          <!-- メール送付 -->
          <Card class="cursor-pointer" @click="toggleMethod('email')">
            <CardContent class="p-4">
              <div class="flex items-start gap-3">
                <Checkbox 
                  :checked="methods.includes('email')"
                  @update:checked="toggleMethod('email')"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2 font-medium">
                    <Mail class="h-4 w-4" />
                    メール送付
                  </div>
                  <p class="text-sm text-muted-foreground mt-1">
                    PDFを添付してメールで送信します
                  </p>
                  
                  <div v-if="methods.includes('email')" class="mt-3 space-y-3">
                    <div class="space-y-2">
                      <Label for="email-to">宛先</Label>
                      <Input
                        id="email-to"
                        v-model="emailSettings.to"
                        type="email"
                        :placeholder="invoice.client.contact.email"
                      />
                    </div>
                    <div class="space-y-2">
                      <Label for="email-cc">CC</Label>
                      <Input
                        id="email-cc"
                        v-model="emailSettings.cc"
                        placeholder="複数の場合はカンマ区切り"
                      />
                    </div>
                    <div class="space-y-2">
                      <Label for="email-subject">件名</Label>
                      <Input
                        id="email-subject"
                        v-model="emailSettings.subject"
                        :placeholder="`請求書送付のご案内（${invoice.invoiceNumber}）`"
                      />
                    </div>
                    <div class="space-y-2">
                      <Label for="email-body">本文</Label>
                      <Textarea
                        id="email-body"
                        v-model="emailSettings.body"
                        rows="5"
                        placeholder="メール本文を入力..."
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <!-- 郵送 -->
          <Card class="cursor-pointer" @click="toggleMethod('postal')">
            <CardContent class="p-4">
              <div class="flex items-start gap-3">
                <Checkbox 
                  :checked="methods.includes('postal')"
                  @update:checked="toggleMethod('postal')"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2 font-medium">
                    <Printer class="h-4 w-4" />
                    郵送
                  </div>
                  <p class="text-sm text-muted-foreground mt-1">
                    印刷して郵送します（送付先住所の確認が必要です）
                  </p>
                  
                  <div v-if="methods.includes('postal')" class="mt-3">
                    <div class="p-3 bg-muted rounded-md">
                      <p class="text-sm font-medium">送付先住所</p>
                      <p class="text-sm mt-1">
                        〒{{ invoice.client.contact.postalCode }}<br>
                        {{ invoice.client.contact.address }}
                      </p>
                    </div>
                    <Alert class="mt-3">
                      <Info class="h-4 w-4" />
                      <AlertDescription>
                        印刷用PDFがダウンロードされます。印刷後、上記住所に郵送してください。
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <!-- FAX -->
          <Card class="cursor-pointer" @click="toggleMethod('fax')">
            <CardContent class="p-4">
              <div class="flex items-start gap-3">
                <Checkbox 
                  :checked="methods.includes('fax')"
                  @update:checked="toggleMethod('fax')"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2 font-medium">
                    <Phone class="h-4 w-4" />
                    FAX送信
                  </div>
                  <p class="text-sm text-muted-foreground mt-1">
                    FAXで送信します
                  </p>
                  
                  <div v-if="methods.includes('fax')" class="mt-3 space-y-3">
                    <div class="space-y-2">
                      <Label for="fax-number">FAX番号</Label>
                      <Input
                        id="fax-number"
                        v-model="faxSettings.number"
                        placeholder="03-1234-5678"
                      />
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <!-- クライアントポータル -->
          <Card class="cursor-pointer" @click="toggleMethod('portal')">
            <CardContent class="p-4">
              <div class="flex items-start gap-3">
                <Checkbox 
                  :checked="methods.includes('portal')"
                  @update:checked="toggleMethod('portal')"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2 font-medium">
                    <Globe class="h-4 w-4" />
                    クライアントポータル
                  </div>
                  <p class="text-sm text-muted-foreground mt-1">
                    クライアントがポータルサイトで閲覧できるようにします
                  </p>
                  
                  <div v-if="methods.includes('portal')" class="mt-3">
                    <Alert>
                      <CheckCircle class="h-4 w-4" />
                      <AlertDescription>
                        クライアントのポータルアカウントで請求書が閲覧可能になります。
                        メール通知も同時に送信されます。
                      </AlertDescription>
                    </Alert>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <!-- 電子請求書サービス -->
          <Card class="cursor-pointer" @click="toggleMethod('einvoice')">
            <CardContent class="p-4">
              <div class="flex items-start gap-3">
                <Checkbox 
                  :checked="methods.includes('einvoice')"
                  @update:checked="toggleMethod('einvoice')"
                />
                <div class="flex-1">
                  <div class="flex items-center gap-2 font-medium">
                    <FileCheck class="h-4 w-4" />
                    電子請求書サービス
                  </div>
                  <p class="text-sm text-muted-foreground mt-1">
                    電子署名・タイムスタンプ付きで送信します
                  </p>
                  
                  <div v-if="methods.includes('einvoice')" class="mt-3 space-y-3">
                    <Select v-model="einvoiceSettings.service">
                      <SelectTrigger>
                        <SelectValue placeholder="サービスを選択" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="invox">invox</SelectItem>
                        <SelectItem value="billone">BillOne</SelectItem>
                        <SelectItem value="cloudsign">クラウドサイン請求書</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
        
        <!-- 送付オプション -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">送付オプション</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <div class="flex items-center space-x-2">
              <Checkbox 
                id="send-copy"
                v-model="options.sendCopyToSelf"
              />
              <Label for="send-copy" class="cursor-pointer">
                自分にもコピーを送信
              </Label>
            </div>
            
            <div class="flex items-center space-x-2">
              <Checkbox 
                id="track-open"
                v-model="options.trackOpen"
              />
              <Label for="track-open" class="cursor-pointer">
                開封確認を有効にする
              </Label>
            </div>
            
            <div class="flex items-center space-x-2">
              <Checkbox 
                id="password-protect"
                v-model="options.passwordProtect"
              />
              <Label for="password-protect" class="cursor-pointer">
                PDFをパスワード保護する
              </Label>
            </div>
            
            <div v-if="options.passwordProtect" class="pl-6">
              <Input
                v-model="options.password"
                type="password"
                placeholder="パスワードを入力"
                class="w-64"
              />
            </div>
          </CardContent>
        </Card>
      </div>
      
      <DialogFooter>
        <Button type="button" variant="outline" @click="handleClose">
          キャンセル
        </Button>
        <Button 
          @click="sendInvoice" 
          :disabled="methods.length === 0 || isSending"
        >
          <Loader2 v-if="isSending" class="h-4 w-4 mr-2 animate-spin" />
          送付
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
// 送付方法の切り替え
const toggleMethod = (method: string) => {
  const index = methods.value.indexOf(method)
  if (index > -1) {
    methods.value.splice(index, 1)
  } else {
    methods.value.push(method)
  }
}

// 請求書送付
const sendInvoice = async () => {
  isSending.value = true
  
  try {
    const sendRequests = []
    
    // メール送付
    if (methods.value.includes('email')) {
      sendRequests.push(sendViaEmail())
    }
    
    // FAX送信
    if (methods.value.includes('fax')) {
      sendRequests.push(sendViaFax())
    }
    
    // ポータル公開
    if (methods.value.includes('portal')) {
      sendRequests.push(publishToPortal())
    }
    
    // 電子請求書
    if (methods.value.includes('einvoice')) {
      sendRequests.push(sendViaEInvoice())
    }
    
    // 郵送用PDFダウンロード
    if (methods.value.includes('postal')) {
      await downloadPostalPDF()
    }
    
    await Promise.all(sendRequests)
    
    toast.success('請求書を送付しました')
    emit('sent', methods.value)
    handleClose()
  } catch (error) {
    toast.error('送付に失敗しました')
  } finally {
    isSending.value = false
  }
}
</script>
```

### 4. 入金記録ダイアログ

```vue
<template>
  <Dialog v-model:open="isOpen" @update:open="handleClose">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>入金記録</DialogTitle>
        <DialogDescription>
          請求書番号: {{ invoice.invoiceNumber }}
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="recordPayment" class="space-y-4">
        <!-- 請求情報 -->
        <Card>
          <CardContent class="p-4">
            <dl class="space-y-2 text-sm">
              <div class="flex justify-between">
                <dt class="text-muted-foreground">請求額</dt>
                <dd class="font-medium">¥{{ formatCurrency(invoice.totalAmount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">既入金額</dt>
                <dd>¥{{ formatCurrency(invoice.paidAmount) }}</dd>
              </div>
              <div class="flex justify-between">
                <dt class="text-muted-foreground">未入金額</dt>
                <dd class="font-medium text-orange-600">
                  ¥{{ formatCurrency(invoice.totalAmount - invoice.paidAmount) }}
                </dd>
              </div>
            </dl>
          </CardContent>
        </Card>
        
        <!-- 入金情報入力 -->
        <div class="space-y-4">
          <div class="space-y-2">
            <Label for="payment-date">入金日 *</Label>
            <DatePicker
              id="payment-date"
              v-model="payment.date"
            />
          </div>
          
          <div class="space-y-2">
            <Label for="payment-amount">入金額 *</Label>
            <div class="relative">
              <span class="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">
                ¥
              </span>
              <Input
                id="payment-amount"
                v-model.number="payment.amount"
                type="number"
                class="pl-8"
                :placeholder="String(invoice.totalAmount - invoice.paidAmount)"
              />
            </div>
          </div>
          
          <div class="space-y-2">
            <Label for="payment-method">入金方法</Label>
            <Select v-model="payment.method">
              <SelectTrigger id="payment-method">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bank_transfer">銀行振込</SelectItem>
                <SelectItem value="cash">現金</SelectItem>
                <SelectItem value="check">小切手</SelectItem>
                <SelectItem value="credit_card">クレジットカード</SelectItem>
                <SelectItem value="other">その他</SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <div class="space-y-2">
            <Label for="payment-reference">振込人名義・参照番号</Label>
            <Input
              id="payment-reference"
              v-model="payment.reference"
              placeholder="山田太郎、振込番号12345など"
            />
          </div>
          
          <div class="space-y-2">
            <Label for="payment-notes">メモ</Label>
            <Textarea
              id="payment-notes"
              v-model="payment.notes"
              rows="2"
            />
          </div>
        </div>
        
        <!-- 入金後のステータス -->
        <Alert v-if="isFullPayment">
          <CheckCircle class="h-4 w-4" />
          <AlertDescription>
            全額入金となるため、請求書のステータスが「入金済み」に変更されます。
          </AlertDescription>
        </Alert>
        
        <Alert v-else-if="payment.amount > 0" variant="warning">
          <AlertCircle class="h-4 w-4" />
          <AlertDescription>
            一部入金となります。残額: ¥{{ formatCurrency(remainingAmount) }}
          </AlertDescription>
        </Alert>
        
        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose">
            キャンセル
          </Button>
          <Button type="submit" :disabled="!isValid || isLoading">
            <Loader2 v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
            入金を記録
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
// 全額入金かどうか
const isFullPayment = computed(() => {
  return payment.value.amount >= (invoice.value.totalAmount - invoice.value.paidAmount)
})

// 残額
const remainingAmount = computed(() => {
  return invoice.value.totalAmount - invoice.value.paidAmount - payment.value.amount
})
</script>
```

## データモデル

```typescript
// 請求書
interface Invoice {
  id: string
  invoiceNumber: string      // 請求書番号（自動採番）
  type: 'retainer' | 'interim' | 'success' | 'expense' | 'timecharge'
  
  // 基本情報
  issueDate: Date
  dueDate: Date
  caseId: string
  case: Case
  clientId: string
  client: Client
  
  // 請求内容（柔軟な構造）
  elements: InvoiceElement[]
  
  // 金額情報
  subtotal: number
  tax: number
  totalAmount: number
  paidAmount: number
  
  // 振込先情報
  bankInfo: BankInfo
  
  // ステータス
  status: 'draft' | 'issued' | 'sent' | 'viewed' | 'paid' | 'overdue' | 'cancelled'
  sentVia: string[]         // ['email', 'postal', 'fax', 'portal', 'einvoice']
  sentAt?: Date
  viewedAt?: Date
  paidAt?: Date
  
  // その他
  remarks?: string
  attachments?: Attachment[]
  
  // システム情報
  createdAt: Date
  updatedAt: Date
  createdBy: User
}

// 請求書要素（柔軟な構造）
interface InvoiceElement {
  id: string
  type: 'text' | 'table' | 'separator'
  content?: string          // テキスト要素の場合
  headers?: TableHeader[]   // テーブル要素の場合
  rows?: TableRow[]        // テーブル要素の場合
  showTotal?: boolean      // 合計表示
  includeTax?: boolean     // 税込み計算
}

// テーブルヘッダー
interface TableHeader {
  text: string
  width?: string
  align?: 'left' | 'center' | 'right'
}

// テーブル行
interface TableRow {
  cells: TableCell[]
}

// テーブルセル
interface TableCell {
  type: 'text' | 'number' | 'date'
  value: any
  format?: string
}

// 振込先情報
interface BankInfo {
  bankName: string
  branchName: string
  accountType: 'normal' | 'current'
  accountNumber: string
  accountName: string
}

// 入金記録
interface Payment {
  id: string
  invoiceId: string
  date: Date
  amount: number
  method: 'bank_transfer' | 'cash' | 'check' | 'credit_card' | 'other'
  reference?: string
  notes?: string
  createdAt: Date
  createdBy: User
}

// 請求書テンプレート
interface InvoiceTemplate {
  id: string
  name: string
  description?: string
  type?: string            // 請求書種別
  elements: InvoiceElement[]
  bankInfo?: BankInfo
  isDefault?: boolean
  createdAt: Date
  updatedBy: User
}
```

## API設計

```typescript
// 請求書API
interface InvoiceAPI {
  // 請求書一覧
  GET /api/v1/invoices
    query: {
      search?: string
      type?: string
      status?: string
      startDate?: Date
      endDate?: Date
      caseId?: string
      clientId?: string
    }
    
  // 請求書詳細
  GET /api/v1/invoices/:id
  
  // 請求書作成
  POST /api/v1/invoices
  
  // 請求書更新
  PUT /api/v1/invoices/:id
  
  // 請求書削除
  DELETE /api/v1/invoices/:id
  
  // 請求書発行
  POST /api/v1/invoices/:id/issue
  
  // 請求書送付
  POST /api/v1/invoices/:id/send
    body: {
      methods: string[]
      emailSettings?: EmailSettings
      faxSettings?: FaxSettings
      einvoiceSettings?: EInvoiceSettings
      options?: SendOptions
    }
    
  // PDFダウンロード
  GET /api/v1/invoices/:id/pdf
  
  // 入金記録
  POST /api/v1/invoices/:id/payments
  GET /api/v1/invoices/:id/payments
  
  // テンプレート管理
  GET /api/v1/invoice-templates
  POST /api/v1/invoice-templates
  PUT /api/v1/invoice-templates/:id
  DELETE /api/v1/invoice-templates/:id
}
```

## 特徴的な機能

### 1. 柔軟な請求書編集
- ドラッグ&ドロップで要素の並び替え
- テキスト、テーブル、区切り線の自由な配置
- テーブルの行・列の動的追加
- 自動計算機能

### 2. 多様な送付方法
- メール（添付/本文埋め込み）
- 郵送用PDF生成
- FAX送信
- クライアントポータル公開
- 電子請求書サービス連携

### 3. セキュリティ機能
- PDFパスワード保護
- 開封確認
- 電子署名・タイムスタンプ
- アクセスログ記録