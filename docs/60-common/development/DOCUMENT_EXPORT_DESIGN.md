# 書類作成画面 - エクスポート機能設計

## 1. エクスポート機能の概要

作成した書類をPDF、Word、HTMLなど様々な形式でエクスポートする機能を提供します。
PDFは裁判所提出形式と一般文書形式を選択可能とし、Wordは基本的な書式のみをサポートします。

## 2. エクスポート形式

### 2.1 対応フォーマット

```typescript
type ExportFormat = 'pdf' | 'docx' | 'html' | 'txt'

interface ExportOptions {
  format: ExportFormat
  pdfLayout?: 'court' | 'general' | 'custom'  // PDF時のレイアウト
  includeMetadata?: boolean                    // メタデータを含めるか
  watermark?: string                           // 透かし文字
}
```

### 2.2 PDFレイアウトプリセット

```typescript
// 裁判所提出形式
const courtLayout: PDFLayoutSettings = {
  pageSize: 'A4',
  orientation: 'portrait',
  margins: {
    top: 35,      // mm
    bottom: 27,
    left: 30,
    right: 20
  },
  font: {
    family: 'MS Mincho',
    size: 10.5,   // pt
    lineHeight: 2
  },
  layout: {
    charsPerLine: 40,
    linesPerPage: 26
  },
  header: {
    enabled: false
  },
  footer: {
    enabled: true,
    pageNumber: 'center'  // ページ番号中央
  }
}

// 一般文書形式
const generalLayout: PDFLayoutSettings = {
  pageSize: 'A4',
  orientation: 'portrait',
  margins: {
    top: 25,
    bottom: 25,
    left: 25,
    right: 25
  },
  font: {
    family: 'Noto Sans JP',
    size: 10,
    lineHeight: 1.8
  },
  layout: {
    charsPerLine: null,  // 制限なし
    linesPerPage: null   // 制限なし
  },
  header: {
    enabled: true,
    content: '{{documentTitle}}'
  },
  footer: {
    enabled: true,
    pageNumber: 'right',
    content: '{{date}}'
  }
}
```

## 3. エクスポートダイアログ

### 3.1 エクスポート設定画面

```vue
<template>
  <Dialog v-model:open="isOpen">
    <DialogContent class="export-dialog">
      <DialogHeader>
        <DialogTitle>書類をエクスポート</DialogTitle>
      </DialogHeader>
      
      <div class="space-y-4">
        <!-- ファイル名 -->
        <div>
          <Label>ファイル名</Label>
          <Input 
            v-model="exportSettings.fileName"
            placeholder="書類名"
          />
        </div>
        
        <!-- 形式選択 -->
        <div>
          <Label>エクスポート形式</Label>
          <RadioGroup v-model="exportSettings.format">
            <div class="grid grid-cols-2 gap-4">
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="pdf" id="pdf" />
                <Label for="pdf" class="cursor-pointer">
                  <div class="flex items-center gap-2">
                    <FileText class="h-4 w-4" />
                    <div>
                      <div>PDF</div>
                      <div class="text-xs text-muted-foreground">
                        印刷・提出用
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
              
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="docx" id="docx" />
                <Label for="docx" class="cursor-pointer">
                  <div class="flex items-center gap-2">
                    <FileWord class="h-4 w-4" />
                    <div>
                      <div>Word</div>
                      <div class="text-xs text-muted-foreground">
                        編集可能
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
              
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="html" id="html" />
                <Label for="html" class="cursor-pointer">
                  <div class="flex items-center gap-2">
                    <Code class="h-4 w-4" />
                    <div>
                      <div>HTML</div>
                      <div class="text-xs text-muted-foreground">
                        Web表示用
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
              
              <div class="flex items-center space-x-2">
                <RadioGroupItem value="txt" id="txt" />
                <Label for="txt" class="cursor-pointer">
                  <div class="flex items-center gap-2">
                    <FileText class="h-4 w-4" />
                    <div>
                      <div>テキスト</div>
                      <div class="text-xs text-muted-foreground">
                        プレーンテキスト
                      </div>
                    </div>
                  </div>
                </Label>
              </div>
            </div>
          </RadioGroup>
        </div>
        
        <!-- PDF設定 -->
        <div v-if="exportSettings.format === 'pdf'" class="space-y-3">
          <Separator />
          
          <div>
            <Label>PDFレイアウト</Label>
            <RadioGroup v-model="exportSettings.pdfLayout">
              <div class="space-y-2">
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="court" id="court" />
                  <Label for="court" class="cursor-pointer">
                    <div>
                      <div>裁判所提出形式</div>
                      <div class="text-xs text-muted-foreground">
                        A4縦・1行40文字・1ページ26行
                      </div>
                    </div>
                  </Label>
                </div>
                
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="general" id="general" />
                  <Label for="general" class="cursor-pointer">
                    <div>
                      <div>一般文書形式</div>
                      <div class="text-xs text-muted-foreground">
                        標準的なビジネス文書レイアウト
                      </div>
                    </div>
                  </Label>
                </div>
                
                <div class="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label for="custom" class="cursor-pointer">
                    <div>
                      <div>カスタム</div>
                      <div class="text-xs text-muted-foreground">
                        詳細設定を行う
                      </div>
                    </div>
                  </Label>
                </div>
              </div>
            </RadioGroup>
          </div>
          
          <!-- カスタム設定 -->
          <div v-if="exportSettings.pdfLayout === 'custom'" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <Label>用紙サイズ</Label>
                <Select v-model="customLayout.pageSize">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="A4">A4</SelectItem>
                    <SelectItem value="A3">A3</SelectItem>
                    <SelectItem value="B4">B4</SelectItem>
                    <SelectItem value="B5">B5</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <Label>向き</Label>
                <Select v-model="customLayout.orientation">
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="portrait">縦</SelectItem>
                    <SelectItem value="landscape">横</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div>
              <Label>余白（mm）</Label>
              <div class="grid grid-cols-4 gap-2">
                <div>
                  <Label class="text-xs">上</Label>
                  <Input 
                    v-model.number="customLayout.margins.top"
                    type="number"
                    min="0"
                  />
                </div>
                <div>
                  <Label class="text-xs">下</Label>
                  <Input 
                    v-model.number="customLayout.margins.bottom"
                    type="number"
                    min="0"
                  />
                </div>
                <div>
                  <Label class="text-xs">左</Label>
                  <Input 
                    v-model.number="customLayout.margins.left"
                    type="number"
                    min="0"
                  />
                </div>
                <div>
                  <Label class="text-xs">右</Label>
                  <Input 
                    v-model.number="customLayout.margins.right"
                    type="number"
                    min="0"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 追加オプション -->
        <div class="space-y-2">
          <div class="flex items-center space-x-2">
            <Checkbox 
              v-model="exportSettings.includeMetadata"
              id="metadata"
            />
            <Label for="metadata" class="text-sm">
              メタデータを含める（作成者、作成日時など）
            </Label>
          </div>
          
          <div v-if="exportSettings.format === 'pdf'" 
               class="flex items-center space-x-2">
            <Checkbox 
              v-model="exportSettings.addWatermark"
              id="watermark"
            />
            <Label for="watermark" class="text-sm">
              透かしを追加
            </Label>
          </div>
          
          <div v-if="exportSettings.addWatermark" class="ml-6">
            <Input 
              v-model="exportSettings.watermark"
              placeholder="透かし文字（例：DRAFT）"
              class="w-48"
            />
          </div>
        </div>
      </div>
      
      <DialogFooter>
        <Button variant="outline" @click="close">
          キャンセル
        </Button>
        <Button @click="handleExport" :disabled="isExporting">
          <Loader2 v-if="isExporting" class="h-4 w-4 mr-2 animate-spin" />
          エクスポート
        </Button>
      </DialogFooter>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
const props = defineProps<{
  content: string
  documentTitle?: string
}>()

const isOpen = defineModel<boolean>('open')
const isExporting = ref(false)

const exportSettings = reactive({
  fileName: props.documentTitle || '書類',
  format: 'pdf' as ExportFormat,
  pdfLayout: 'court' as 'court' | 'general' | 'custom',
  includeMetadata: true,
  addWatermark: false,
  watermark: 'DRAFT'
})

const customLayout = reactive({
  pageSize: 'A4',
  orientation: 'portrait',
  margins: {
    top: 25,
    bottom: 25,
    left: 25,
    right: 25
  }
})

const handleExport = async () => {
  isExporting.value = true
  
  try {
    const options: ExportOptions = {
      format: exportSettings.format,
      includeMetadata: exportSettings.includeMetadata
    }
    
    if (exportSettings.format === 'pdf') {
      options.pdfLayout = exportSettings.pdfLayout
      if (exportSettings.addWatermark) {
        options.watermark = exportSettings.watermark
      }
    }
    
    await exportDocument(props.content, exportSettings.fileName, options)
    
    showToast({
      type: 'success',
      title: 'エクスポートが完了しました'
    })
    
    close()
  } catch (error) {
    showToast({
      type: 'error',
      title: 'エクスポートに失敗しました'
    })
  } finally {
    isExporting.value = false
  }
}
</script>
```

## 4. エクスポート処理

### 4.1 エクスポートサービス

```typescript
// composables/useDocumentExport.ts
export const useDocumentExport = () => {
  const exportDocument = async (
    content: string,
    fileName: string,
    options: ExportOptions
  ) => {
    const { processMarkdown } = useMarkdownProcessor()
    const { currentCase } = useCaseStore()
    
    // 変数を適用
    const variables = {
      documentTitle: fileName,
      date: new Date().toLocaleDateString('ja-JP'),
      caseNumber: currentCase.value?.caseNumber || '',
      // ... 他の変数
    }
    
    const processedContent = processMarkdown(content, variables)
    
    // エクスポート処理
    switch (options.format) {
      case 'pdf':
        return await exportPDF(processedContent, fileName, options)
      case 'docx':
        return await exportWord(processedContent, fileName, options)
      case 'html':
        return await exportHTML(processedContent, fileName, options)
      case 'txt':
        return await exportText(content, fileName, options)
    }
  }
  
  // PDF エクスポート
  const exportPDF = async (
    html: string,
    fileName: string,
    options: ExportOptions
  ) => {
    const layout = getPDFLayout(options.pdfLayout!)
    
    const { data } = await $fetch('/api/v1/documents/export/pdf', {
      method: 'POST',
      body: {
        html,
        fileName,
        layout,
        watermark: options.watermark
      }
    })
    
    // ダウンロード
    downloadFile(data.url, `${fileName}.pdf`)
  }
  
  // Word エクスポート
  const exportWord = async (
    html: string,
    fileName: string,
    options: ExportOptions
  ) => {
    // HTMLをシンプルなWordドキュメントに変換
    const { data } = await $fetch('/api/v1/documents/export/docx', {
      method: 'POST',
      body: {
        html,
        fileName,
        metadata: options.includeMetadata
      }
    })
    
    downloadFile(data.url, `${fileName}.docx`)
  }
  
  // HTML エクスポート
  const exportHTML = async (
    html: string,
    fileName: string,
    options: ExportOptions
  ) => {
    // スタイルを含むHTMLファイルを生成
    const fullHTML = `
<!DOCTYPE html>
<html lang="ja">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${fileName}</title>
  <style>
    body {
      font-family: 'Noto Sans JP', sans-serif;
      line-height: 1.8;
      max-width: 800px;
      margin: 0 auto;
      padding: 2rem;
    }
    h1 { 
      font-size: 1.75rem; 
      margin: 2rem 0 1rem;
      border-bottom: 2px solid #333;
      padding-bottom: 0.5rem;
    }
    h2 { 
      font-size: 1.5rem; 
      margin: 1.5rem 0 0.75rem;
    }
    h3 { 
      font-size: 1.25rem; 
      margin: 1rem 0 0.5rem;
    }
    p { 
      margin: 1rem 0;
    }
    table {
      border-collapse: collapse;
      width: 100%;
      margin: 1rem 0;
    }
    th, td {
      border: 1px solid #ddd;
      padding: 0.5rem;
      text-align: left;
    }
    th {
      background-color: #f5f5f5;
    }
    @media print {
      body {
        max-width: 100%;
        margin: 0;
        padding: 0;
      }
    }
  </style>
</head>
<body>
  ${html}
</body>
</html>`
    
    // Blob作成とダウンロード
    const blob = new Blob([fullHTML], { type: 'text/html;charset=utf-8' })
    downloadBlob(blob, `${fileName}.html`)
  }
  
  // テキストエクスポート
  const exportText = async (
    content: string,
    fileName: string,
    options: ExportOptions
  ) => {
    // Markdownをプレーンテキストに変換
    const text = content
      .replace(/^#+\s+/gm, '')  // 見出し記号を削除
      .replace(/\*\*(.*?)\*\*/g, '$1')  // 太字を削除
      .replace(/\*(.*?)\*/g, '$1')  // 斜体を削除
      .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1')  // リンクをテキストに
      .replace(/!\[([^\]]*)\]\([^)]+\)/g, '[$1]')  // 画像を説明文に
      .replace(/```[\s\S]*?```/g, '')  // コードブロックを削除
      .replace(/`([^`]+)`/g, '$1')  // インラインコードを削除
    
    const blob = new Blob([text], { type: 'text/plain;charset=utf-8' })
    downloadBlob(blob, `${fileName}.txt`)
  }
  
  return {
    exportDocument
  }
}
```

### 4.2 PDFレイアウト取得

```typescript
const getPDFLayout = (layoutType: 'court' | 'general' | 'custom'): PDFLayoutSettings => {
  switch (layoutType) {
    case 'court':
      return courtLayout
    case 'general':
      return generalLayout
    case 'custom':
      // カスタム設定を取得
      return getCustomLayout()
    default:
      return generalLayout
  }
}
```

### 4.3 ダウンロードヘルパー

```typescript
// utils/download.ts
export const downloadFile = (url: string, fileName: string) => {
  const link = document.createElement('a')
  link.href = url
  link.download = fileName
  document.body.appendChild(link)
  link.click()
  document.body.removeChild(link)
}

export const downloadBlob = (blob: Blob, fileName: string) => {
  const url = URL.createObjectURL(blob)
  downloadFile(url, fileName)
  URL.revokeObjectURL(url)
}
```

## 5. サーバーサイド処理

### 5.1 PDF生成（サーバーサイド）

```typescript
// server/api/documents/export/pdf.post.ts
import puppeteer from 'puppeteer'

export default defineEventHandler(async (event) => {
  const { html, fileName, layout, watermark } = await readBody(event)
  
  const browser = await puppeteer.launch()
  const page = await browser.newPage()
  
  // HTMLを設定
  await page.setContent(html, { waitUntil: 'networkidle0' })
  
  // PDFオプション
  const pdfOptions: any = {
    format: layout.pageSize,
    landscape: layout.orientation === 'landscape',
    margin: {
      top: `${layout.margins.top}mm`,
      bottom: `${layout.margins.bottom}mm`,
      left: `${layout.margins.left}mm`,
      right: `${layout.margins.right}mm`
    },
    printBackground: true
  }
  
  // 裁判所形式の場合、追加のCSS
  if (layout.charsPerLine && layout.linesPerPage) {
    await page.addStyleTag({
      content: `
        body {
          font-family: 'MS Mincho', serif;
          font-size: ${layout.font.size}pt;
          line-height: ${layout.font.lineHeight};
          width: ${layout.charsPerLine}em;
        }
        @page {
          size: A4;
        }
      `
    })
  }
  
  // 透かし追加
  if (watermark) {
    await page.addStyleTag({
      content: `
        body::before {
          content: '${watermark}';
          position: fixed;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%) rotate(-45deg);
          font-size: 120px;
          color: rgba(0, 0, 0, 0.1);
          z-index: -1;
        }
      `
    })
  }
  
  // PDF生成
  const pdf = await page.pdf(pdfOptions)
  await browser.close()
  
  // ファイル保存とURL生成
  const filePath = await saveTempFile(pdf, `${fileName}.pdf`)
  const downloadUrl = await generateDownloadUrl(filePath)
  
  return {
    url: downloadUrl
  }
})
```

### 5.2 Word生成（サーバーサイド）

```typescript
// server/api/documents/export/docx.post.ts
import { Document, Packer, Paragraph, TextRun } from 'docx'
import { JSDOM } from 'jsdom'

export default defineEventHandler(async (event) => {
  const { html, fileName, metadata } = await readBody(event)
  
  // HTMLをパース
  const dom = new JSDOM(html)
  const doc = dom.window.document
  
  // Wordドキュメント作成
  const wordDoc = new Document({
    sections: [{
      properties: {},
      children: await htmlToDocx(doc.body)
    }]
  })
  
  // メタデータ追加
  if (metadata) {
    wordDoc.coreProperties = {
      creator: 'Astar Management',
      created: new Date(),
      modified: new Date(),
      title: fileName
    }
  }
  
  // ファイル生成
  const buffer = await Packer.toBuffer(wordDoc)
  
  // ファイル保存とURL生成
  const filePath = await saveTempFile(buffer, `${fileName}.docx`)
  const downloadUrl = await generateDownloadUrl(filePath)
  
  return {
    url: downloadUrl
  }
})

// HTMLをdocx要素に変換（基本的な変換のみ）
async function htmlToDocx(element: Element): Promise<Paragraph[]> {
  const paragraphs: Paragraph[] = []
  
  for (const child of element.children) {
    switch (child.tagName.toLowerCase()) {
      case 'h1':
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: child.textContent || '', bold: true, size: 32 })],
            spacing: { after: 200 }
          })
        )
        break
      case 'h2':
        paragraphs.push(
          new Paragraph({
            children: [new TextRun({ text: child.textContent || '', bold: true, size: 28 })],
            spacing: { after: 160 }
          })
        )
        break
      case 'p':
        paragraphs.push(
          new Paragraph({
            children: [new TextRun(child.textContent || '')],
            spacing: { after: 120 }
          })
        )
        break
      // ... 他のタグの処理
    }
  }
  
  return paragraphs
}
```

## 6. レイアウトプリセット保存

### 6.1 カスタムレイアウトの保存

```typescript
// stores/exportSettings.ts
export const useExportSettingsStore = defineStore('exportSettings', () => {
  const customLayouts = ref<SavedLayout[]>([])
  
  interface SavedLayout {
    id: string
    name: string
    settings: PDFLayoutSettings
  }
  
  // カスタムレイアウト保存
  const saveCustomLayout = (name: string, settings: PDFLayoutSettings) => {
    const layout: SavedLayout = {
      id: generateId(),
      name,
      settings
    }
    
    customLayouts.value.push(layout)
    
    // ローカルストレージに保存
    localStorage.setItem('customPDFLayouts', JSON.stringify(customLayouts.value))
  }
  
  // カスタムレイアウト読み込み
  const loadCustomLayouts = () => {
    const saved = localStorage.getItem('customPDFLayouts')
    if (saved) {
      customLayouts.value = JSON.parse(saved)
    }
  }
  
  return {
    customLayouts: readonly(customLayouts),
    saveCustomLayout,
    loadCustomLayouts
  }
})
```