# 報酬管理画面 - エクスポート機能設計

## CSV/Excelエクスポート機能

### 1. エクスポート形式

#### CSV形式（基本）
- **文字コード**: UTF-8 BOM付き（Excelで文字化けしない）
- **区切り文字**: カンマ
- **改行コード**: CRLF（Windows対応）
- **ヘッダー行**: あり

**出力項目：**
```csv
日付,摘要,案件番号,勘定科目,金額,消費税,支払方法,メモ
2024-01-20,タクシー代,2024-01-001,旅費交通費,1200,120,現金,東京地裁
2024-01-20,収入印紙代,2024-01-002,租税公課,10000,0,現金,
```

#### Excel形式（詳細）
複数シートで構成される詳細レポート

**シート構成：**
1. **サマリーシート** - 全体集計
2. **明細シート** - 全取引の詳細
3. **勘定科目別集計** - 勘定科目ごとの集計
4. **案件別集計** - 案件ごとの実費集計
5. **グラフシート** - 視覚的な分析

### 2. エクスポートオプション

```typescript
interface ExportOptions {
  format: 'csv' | 'excel'
  dateRange: {
    from: string  // YYYY-MM-DD
    to: string
  }
  filters: {
    expenseType?: 'all' | 'office' | 'personal' | 'case'
    caseId?: string
    accountCode?: string[]
  }
  groupBy?: 'date' | 'accountCode' | 'case'
  includeSubtotals: boolean
  includeReceipts: boolean  // Excel only - 領収書画像を含める
}
```

### 3. UI設計

#### エクスポートダイアログ
```vue
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="export-dialog">
      <DialogHeader>
        <DialogTitle>経費データをエクスポート</DialogTitle>
      </DialogHeader>
      
      <div class="space-y-4">
        <!-- 形式選択 -->
        <div>
          <Label>エクスポート形式</Label>
          <RadioGroup v-model="options.format">
            <div class="flex items-center space-x-2">
              <RadioGroupItem value="csv" id="csv" />
              <Label for="csv">
                CSV（シンプル）
                <span class="text-sm text-muted-foreground block">
                  基本的な項目のみ。会計ソフトへの取り込み用
                </span>
              </Label>
            </div>
            <div class="flex items-center space-x-2">
              <RadioGroupItem value="excel" id="excel" />
              <Label for="excel">
                Excel（詳細レポート）
                <span class="text-sm text-muted-foreground block">
                  集計・グラフ付き。会計士への報告用
                </span>
              </Label>
            </div>
          </RadioGroup>
        </div>
        
        <!-- 期間選択 -->
        <div>
          <Label>対象期間</Label>
          <div class="flex gap-2">
            <DatePicker v-model="options.dateRange.from" placeholder="開始日" />
            <span class="self-center">〜</span>
            <DatePicker v-model="options.dateRange.to" placeholder="終了日" />
          </div>
          <!-- クイック選択 -->
          <div class="flex gap-2 mt-2">
            <Button size="sm" variant="outline" @click="setThisMonth">今月</Button>
            <Button size="sm" variant="outline" @click="setLastMonth">先月</Button>
            <Button size="sm" variant="outline" @click="setThisYear">今年度</Button>
          </div>
        </div>
        
        <!-- フィルター（省略可） -->
        <Collapsible>
          <CollapsibleTrigger class="text-sm">
            詳細フィルター
            <ChevronDown class="h-4 w-4 ml-1 inline" />
          </CollapsibleTrigger>
          <CollapsibleContent class="space-y-3 pt-3">
            <!-- 経費種別 -->
            <div>
              <Label>経費種別</Label>
              <Select v-model="options.filters.expenseType">
                <SelectTrigger>
                  <SelectValue placeholder="すべて" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">すべて</SelectItem>
                  <SelectItem value="office">事務所経費</SelectItem>
                  <SelectItem value="personal">個人経費</SelectItem>
                  <SelectItem value="case">案件実費</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <!-- グループ化（Excel only） -->
            <div v-if="options.format === 'excel'">
              <Label>グループ化</Label>
              <Select v-model="options.groupBy">
                <SelectTrigger>
                  <SelectValue placeholder="なし" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="">なし</SelectItem>
                  <SelectItem value="date">日付別</SelectItem>
                  <SelectItem value="accountCode">勘定科目別</SelectItem>
                  <SelectItem value="case">案件別</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <!-- オプション -->
            <div class="space-y-2">
              <Checkbox 
                v-model="options.includeSubtotals" 
                id="subtotals"
              />
              <Label for="subtotals" class="ml-2">
                小計を含める
              </Label>
            </div>
          </CollapsibleContent>
        </Collapsible>
        
        <!-- アクションボタン -->
        <div class="flex justify-end gap-2">
          <Button variant="outline" @click="close">
            キャンセル
          </Button>
          <Button @click="handleExport" :disabled="isExporting">
            <Loader2 v-if="isExporting" class="h-4 w-4 mr-2 animate-spin" />
            エクスポート
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
```

### 4. Excel出力詳細

#### サマリーシート
```
[2024年1月 経費レポート]

収入合計:     ¥1,234,567
経費合計:       ¥456,789
━━━━━━━━━━━━━━━━
差額:           ¥777,778

【内訳】
事務所経費:     ¥200,000
個人経費:       ¥100,000
案件実費:       ¥156,789
```

#### 明細シート
| 日付 | 摘要 | 案件番号 | 勘定科目 | 金額 | 消費税 | 税込金額 | 支払方法 | メモ |
|------|------|----------|----------|------|--------|----------|----------|------|
| 2024/01/20 | タクシー代 | 2024-01-001 | 旅費交通費 | 1,091 | 109 | 1,200 | 現金 | 東京地裁 |

#### 勘定科目別集計シート
| 勘定科目 | 件数 | 金額合計 | 構成比 |
|----------|------|----------|--------|
| 旅費交通費 | 45 | ¥125,000 | 27.4% |
| 通信費 | 23 | ¥85,000 | 18.6% |
| 消耗品費 | 15 | ¥65,000 | 14.2% |

### 5. 実装詳細

#### CSV生成
```typescript
// composables/useExpenseExport.ts
export const useExpenseExport = () => {
  const exportToCSV = async (expenses: Expense[], options: ExportOptions) => {
    // ヘッダー行
    const headers = ['日付', '摘要', '案件番号', '勘定科目', '金額', '消費税', '支払方法', 'メモ']
    
    // データ行
    const rows = expenses.map(e => [
      formatDate(e.date, 'yyyy/MM/dd'),
      e.description,
      e.caseNumber || '',
      e.accountName,
      e.amount,
      e.taxAmount || 0,
      getPaymentMethodLabel(e.paymentMethod),
      e.memo || ''
    ])
    
    // 小計行（オプション）
    if (options.includeSubtotals && options.groupBy) {
      // グループごとの小計を挿入
    }
    
    // CSV生成
    const csv = [
      headers.join(','),
      ...rows.map(row => 
        row.map(cell => {
          // カンマや改行を含む場合はダブルクォートで囲む
          const str = String(cell)
          return str.includes(',') || str.includes('\n') 
            ? `"${str.replace(/"/g, '""')}"` 
            : str
        }).join(',')
      )
    ].join('\r\n')
    
    // BOM付きUTF-8で出力
    const bom = new Uint8Array([0xEF, 0xBB, 0xBF])
    const blob = new Blob([bom, csv], { type: 'text/csv;charset=utf-8' })
    
    // ダウンロード
    downloadFile(blob, `経費明細_${formatDate(new Date(), 'yyyyMMdd')}.csv`)
  }
  
  const exportToExcel = async (expenses: Expense[], options: ExportOptions) => {
    // サーバーサイドでExcel生成
    const { data } = await $fetch('/api/v1/expenses/export', {
      method: 'POST',
      body: {
        expenses: expenses.map(e => e.id),
        options
      }
    })
    
    // ダウンロードURL取得
    const downloadUrl = data.downloadUrl
    window.open(downloadUrl, '_blank')
  }
  
  return {
    exportToCSV,
    exportToExcel
  }
}
```

### 6. プログレス表示

大量データのエクスポート時にプログレスを表示

```typescript
interface ExportProgress {
  status: 'preparing' | 'processing' | 'finalizing' | 'complete'
  current: number
  total: number
  message: string
}

// プログレス表示コンポーネント
<ProgressDialog 
  :open="isExporting"
  :progress="exportProgress"
  @cancel="cancelExport"
/>
```