# グローバル検索画面設計

## 概要

法律事務所のあらゆる情報を横断的に検索できる統合検索機能です。案件、クライアント、書類、請求書、カレンダーなど全データを対象とし、PDFの内容や添付ファイルも含めて検索可能です。AI搭載により自然言語での質問や意味検索を実現し、Elasticsearchによる高速で高度な検索機能を提供します。

## 設計方針

### 1. 全データ横断検索
- 案件、クライアント、書類、請求書、カレンダー、コミュニケーション履歴など全データ対象
- PDFの内容（OCR含む）、添付ファイルの中身も検索
- 削除済みデータ（アーカイブ）も検索可能

### 2. AI搭載検索
- 自然言語での質問対応
- セマンティック検索（意味検索）
- 関連情報の自動提示
- 検索意図の推測と提案

### 3. リッチな結果表示
- プレビュー付き表示
- 検索キーワードのハイライト
- コンテキスト表示（前後の文脈）
- インライン操作

### 4. 基本的な履歴機能
- 最近の検索履歴
- よく使う検索条件の保存
- 検索結果のエクスポート

### 5. Elasticsearch活用
- 高速な全文検索
- リアルタイムインデックス
- 高度な検索機能（ファセット、集計など）

## 画面構成

### 1. グローバル検索メイン画面

```vue
<template>
  <div class="global-search">
    <!-- 検索バー（常に画面上部に固定） -->
    <div class="search-header">
      <div class="search-container">
        <div class="search-input-wrapper">
          <!-- AI検索モード切り替え -->
          <ToggleGroup v-model="searchMode" type="single" class="mr-3">
            <ToggleGroupItem value="keyword">
              <Search class="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="ai">
              <Sparkles class="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          
          <!-- 検索入力 -->
          <div class="flex-1 relative">
            <Input
              v-model="searchQuery"
              :placeholder="searchPlaceholder"
              class="pl-10 pr-24 h-12 text-lg"
              @keydown.enter="executeSearch"
              @input="handleSearchInput"
            />
            <Search class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-muted-foreground" />
            
            <!-- 音声入力 -->
            <Button
              variant="ghost"
              size="icon"
              class="absolute right-14 top-1/2 -translate-y-1/2"
              @click="startVoiceInput"
              v-if="searchMode === 'ai'"
            >
              <Mic class="h-4 w-4" />
            </Button>
            
            <!-- 検索ボタン -->
            <Button 
              class="absolute right-2 top-1/2 -translate-y-1/2"
              size="sm"
              @click="executeSearch"
              :disabled="!searchQuery.trim()"
            >
              検索
            </Button>
          </div>
          
          <!-- 検索オプション -->
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="icon" class="ml-2">
                <Settings2 class="h-4 w-4" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" class="w-80">
              <div class="p-4 space-y-4">
                <div>
                  <Label class="text-sm">検索対象</Label>
                  <div class="mt-2 space-y-2">
                    <label v-for="target in searchTargets" :key="target.value"
                           class="flex items-center gap-2 cursor-pointer">
                      <Checkbox v-model="selectedTargets[target.value]" />
                      <span class="text-sm">{{ target.label }}</span>
                    </label>
                  </div>
                </div>
                
                <Separator />
                
                <div>
                  <Label class="text-sm">期間</Label>
                  <Select v-model="dateRange">
                    <SelectTrigger class="mt-2">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">すべて</SelectItem>
                      <SelectItem value="today">今日</SelectItem>
                      <SelectItem value="week">過去1週間</SelectItem>
                      <SelectItem value="month">過去1ヶ月</SelectItem>
                      <SelectItem value="year">過去1年</SelectItem>
                      <SelectItem value="custom">期間指定</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div class="flex items-center gap-2">
                  <Checkbox v-model="includeArchived" id="include-archived" />
                  <Label for="include-archived" class="text-sm cursor-pointer">
                    アーカイブ済みを含む
                  </Label>
                </div>
              </div>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
        
        <!-- 検索サジェスト -->
        <div v-if="showSuggestions" class="search-suggestions">
          <div v-if="searchMode === 'ai'" class="ai-suggestions">
            <div class="suggestion-header">
              <Sparkles class="h-4 w-4" />
              <span>AI提案</span>
            </div>
            <div v-for="suggestion in aiSuggestions" :key="suggestion.id"
                 class="suggestion-item"
                 @click="selectSuggestion(suggestion)">
              <MessageSquare class="h-4 w-4 text-muted-foreground" />
              <span>{{ suggestion.text }}</span>
            </div>
          </div>
          
          <div v-if="recentSearches.length > 0" class="recent-searches">
            <div class="suggestion-header">
              <Clock class="h-4 w-4" />
              <span>最近の検索</span>
            </div>
            <div v-for="recent in recentSearches" :key="recent.id"
                 class="suggestion-item"
                 @click="selectRecent(recent)">
              <History class="h-4 w-4 text-muted-foreground" />
              <span>{{ recent.query }}</span>
              <span class="text-xs text-muted-foreground ml-auto">
                {{ formatRelativeTime(recent.timestamp) }}
              </span>
            </div>
          </div>
          
          <div v-if="savedSearches.length > 0" class="saved-searches">
            <div class="suggestion-header">
              <Star class="h-4 w-4" />
              <span>保存した検索</span>
            </div>
            <div v-for="saved in savedSearches" :key="saved.id"
                 class="suggestion-item"
                 @click="selectSaved(saved)">
              <BookmarkCheck class="h-4 w-4 text-muted-foreground" />
              <span>{{ saved.name }}</span>
            </div>
          </div>
        </div>
      </div>
    </div>
    
    <!-- 検索結果 -->
    <div class="search-results">
      <!-- 検索実行前 -->
      <div v-if="!hasSearched" class="empty-state">
        <div class="text-center py-16">
          <Search class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
          <h2 class="text-xl font-medium mb-2">
            {{ searchMode === 'ai' ? 'AIに質問してみましょう' : 'キーワードで検索' }}
          </h2>
          <p class="text-muted-foreground mb-8">
            {{ searchMode === 'ai' 
              ? '「先月の山田さんの案件の進捗は？」のように自然な言葉で質問できます' 
              : '案件、クライアント、書類など、あらゆる情報を検索できます' }}
          </p>
          
          <!-- クイックアクセス -->
          <div class="quick-access">
            <h3 class="text-sm font-medium mb-3">クイックアクセス</h3>
            <div class="flex flex-wrap gap-2 justify-center">
              <Button
                v-for="quick in quickAccess"
                :key="quick.id"
                variant="outline"
                size="sm"
                @click="quickSearch(quick)"
              >
                <component :is="quick.icon" class="h-4 w-4 mr-2" />
                {{ quick.label }}
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      <!-- 検索中 -->
      <div v-else-if="isSearching" class="searching-state">
        <div class="text-center py-16">
          <Loader2 class="h-16 w-16 mx-auto animate-spin text-primary mb-4" />
          <h2 class="text-xl font-medium mb-2">
            {{ searchMode === 'ai' ? 'AI が回答を準備しています...' : '検索中...' }}
          </h2>
          <p class="text-muted-foreground">
            {{ searchingMessage }}
          </p>
        </div>
      </div>
      
      <!-- 検索結果表示 -->
      <div v-else-if="searchResults" class="results-container">
        <!-- 結果サマリー -->
        <div class="results-summary">
          <div class="flex items-center justify-between">
            <div>
              <h2 class="text-lg font-medium">
                「{{ lastSearchQuery }}」の検索結果
              </h2>
              <p class="text-sm text-muted-foreground">
                {{ searchResults.totalCount }}件見つかりました
                （{{ searchResults.searchTime }}ms）
              </p>
            </div>
            
            <div class="flex items-center gap-2">
              <!-- 表示形式切り替え -->
              <ToggleGroup v-model="viewMode" type="single">
                <ToggleGroupItem value="list">
                  <List class="h-4 w-4" />
                </ToggleGroupItem>
                <ToggleGroupItem value="grid">
                  <Grid3x3 class="h-4 w-4" />
                </ToggleGroupItem>
              </ToggleGroup>
              
              <!-- 並び順 -->
              <Select v-model="sortBy">
                <SelectTrigger class="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="relevance">関連度順</SelectItem>
                  <SelectItem value="date_desc">更新日（新しい順）</SelectItem>
                  <SelectItem value="date_asc">更新日（古い順）</SelectItem>
                  <SelectItem value="type">種別順</SelectItem>
                </SelectContent>
              </Select>
              
              <!-- アクション -->
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon">
                    <MoreVertical class="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem @click="saveSearch">
                    <Bookmark class="h-4 w-4 mr-2" />
                    この検索を保存
                  </DropdownMenuItem>
                  <DropdownMenuItem @click="exportResults">
                    <Download class="h-4 w-4 mr-2" />
                    結果をエクスポート
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem @click="clearSearch">
                    <X class="h-4 w-4 mr-2" />
                    検索をクリア
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>
        </div>
        
        <!-- AI回答（AIモードの場合） -->
        <Card v-if="searchMode === 'ai' && searchResults.aiAnswer" class="mb-6">
          <CardHeader>
            <CardTitle class="flex items-center gap-2">
              <Sparkles class="h-5 w-5 text-primary" />
              AI の回答
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div class="prose prose-sm max-w-none">
              <div v-html="searchResults.aiAnswer.content"></div>
            </div>
            
            <!-- 参照元 -->
            <div v-if="searchResults.aiAnswer.sources.length > 0" class="mt-4">
              <Label class="text-sm text-muted-foreground">参照元：</Label>
              <div class="flex flex-wrap gap-2 mt-2">
                <Badge
                  v-for="source in searchResults.aiAnswer.sources"
                  :key="source.id"
                  variant="outline"
                  class="cursor-pointer"
                  @click="viewSource(source)"
                >
                  {{ source.title }}
                </Badge>
              </div>
            </div>
            
            <!-- フィードバック -->
            <div class="mt-4 pt-4 border-t flex items-center gap-4">
              <span class="text-sm text-muted-foreground">この回答は役に立ちましたか？</span>
              <Button variant="ghost" size="sm" @click="feedbackPositive">
                <ThumbsUp class="h-4 w-4" />
              </Button>
              <Button variant="ghost" size="sm" @click="feedbackNegative">
                <ThumbsDown class="h-4 w-4" />
              </Button>
            </div>
          </CardContent>
        </Card>
        
        <!-- ファセット（左サイドバー） -->
        <div class="results-layout">
          <aside class="results-facets">
            <Card>
              <CardHeader>
                <CardTitle class="text-sm">絞り込み</CardTitle>
              </CardHeader>
              <CardContent class="space-y-4">
                <!-- 種別 -->
                <div>
                  <Label class="text-xs text-muted-foreground mb-2 block">種別</Label>
                  <div class="space-y-1">
                    <label v-for="facet in searchResults.facets.type" :key="facet.value"
                           class="flex items-center justify-between cursor-pointer p-1 hover:bg-muted rounded">
                      <div class="flex items-center gap-2">
                        <Checkbox v-model="filters.type[facet.value]" />
                        <span class="text-sm">{{ facet.label }}</span>
                      </div>
                      <span class="text-xs text-muted-foreground">{{ facet.count }}</span>
                    </label>
                  </div>
                </div>
                
                <!-- 担当者 -->
                <div>
                  <Label class="text-xs text-muted-foreground mb-2 block">担当者</Label>
                  <div class="space-y-1">
                    <label v-for="facet in searchResults.facets.assignee" :key="facet.value"
                           class="flex items-center justify-between cursor-pointer p-1 hover:bg-muted rounded">
                      <div class="flex items-center gap-2">
                        <Checkbox v-model="filters.assignee[facet.value]" />
                        <span class="text-sm">{{ facet.label }}</span>
                      </div>
                      <span class="text-xs text-muted-foreground">{{ facet.count }}</span>
                    </label>
                  </div>
                </div>
                
                <!-- 日付範囲 -->
                <div>
                  <Label class="text-xs text-muted-foreground mb-2 block">期間</Label>
                  <RadioGroup v-model="filters.dateRange">
                    <div class="space-y-1">
                      <label class="flex items-center gap-2 cursor-pointer p-1">
                        <RadioGroupItem value="all" />
                        <span class="text-sm">すべて</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer p-1">
                        <RadioGroupItem value="today" />
                        <span class="text-sm">今日</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer p-1">
                        <RadioGroupItem value="week" />
                        <span class="text-sm">過去1週間</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer p-1">
                        <RadioGroupItem value="month" />
                        <span class="text-sm">過去1ヶ月</span>
                      </label>
                      <label class="flex items-center gap-2 cursor-pointer p-1">
                        <RadioGroupItem value="year" />
                        <span class="text-sm">過去1年</span>
                      </label>
                    </div>
                  </RadioGroup>
                </div>
                
                <!-- タグ -->
                <div v-if="searchResults.facets.tags.length > 0">
                  <Label class="text-xs text-muted-foreground mb-2 block">タグ</Label>
                  <div class="flex flex-wrap gap-1">
                    <Badge
                      v-for="tag in searchResults.facets.tags"
                      :key="tag.value"
                      variant="outline"
                      class="cursor-pointer"
                      :class="{ 'bg-primary text-primary-foreground': filters.tags.includes(tag.value) }"
                      @click="toggleTag(tag.value)"
                    >
                      {{ tag.label }}
                      <span class="ml-1 text-xs">{{ tag.count }}</span>
                    </Badge>
                  </div>
                </div>
                
                <!-- フィルターリセット -->
                <Button
                  v-if="hasActiveFilters"
                  variant="outline"
                  size="sm"
                  class="w-full"
                  @click="resetFilters"
                >
                  <X class="h-4 w-4 mr-2" />
                  フィルターをクリア
                </Button>
              </CardContent>
            </Card>
          </aside>
          
          <!-- 検索結果リスト -->
          <main class="results-main">
            <!-- 結果なし -->
            <div v-if="filteredResults.length === 0" class="no-results">
              <div class="text-center py-16">
                <SearchX class="h-16 w-16 mx-auto text-muted-foreground mb-4" />
                <h3 class="text-lg font-medium mb-2">検索結果が見つかりませんでした</h3>
                <p class="text-muted-foreground">
                  別のキーワードで検索するか、フィルターを調整してください
                </p>
              </div>
            </div>
            
            <!-- 結果リスト -->
            <div v-else class="results-list" :class="{ 'grid-view': viewMode === 'grid' }">
              <div v-for="result in paginatedResults" :key="result.id" 
                   class="result-item"
                   @click="viewDetail(result)">
                <!-- 結果アイテムヘッダー -->
                <div class="result-header">
                  <div class="flex items-start justify-between">
                    <div class="flex items-start gap-3">
                      <!-- アイコン -->
                      <div class="result-icon" :class="`type-${result.type}`">
                        <component :is="getTypeIcon(result.type)" class="h-5 w-5" />
                      </div>
                      
                      <!-- タイトルと基本情報 -->
                      <div class="flex-1">
                        <h3 class="result-title">
                          <span v-html="highlightText(result.title)"></span>
                        </h3>
                        <div class="result-meta">
                          <span class="meta-item">
                            <component :is="getTypeIcon(result.type)" class="h-3 w-3" />
                            {{ getTypeLabel(result.type) }}
                          </span>
                          <span class="meta-item">
                            <Calendar class="h-3 w-3" />
                            {{ formatDate(result.updatedAt) }}
                          </span>
                          <span v-if="result.assignee" class="meta-item">
                            <User class="h-3 w-3" />
                            {{ result.assignee.name }}
                          </span>
                        </div>
                      </div>
                    </div>
                    
                    <!-- アクション -->
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" @click.stop>
                          <MoreHorizontal class="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuItem @click="openInNewTab(result)">
                          <ExternalLink class="h-4 w-4 mr-2" />
                          新しいタブで開く
                        </DropdownMenuItem>
                        <DropdownMenuItem @click="copyLink(result)">
                          <Link class="h-4 w-4 mr-2" />
                          リンクをコピー
                        </DropdownMenuItem>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem @click="addToFavorites(result)">
                          <Star class="h-4 w-4 mr-2" />
                          お気に入りに追加
                        </DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
                
                <!-- プレビュー/抜粋 -->
                <div class="result-preview">
                  <!-- テキスト抜粋 -->
                  <div v-if="result.excerpt" class="result-excerpt">
                    <p v-html="highlightText(result.excerpt)"></p>
                  </div>
                  
                  <!-- PDFプレビュー -->
                  <div v-if="result.type === 'document' && result.preview" class="result-pdf-preview">
                    <div class="pdf-preview-container">
                      <img :src="result.preview.thumbnail" :alt="result.title" />
                      <div class="pdf-info">
                        <FileText class="h-4 w-4" />
                        <span>{{ result.preview.pageCount }}ページ</span>
                      </div>
                    </div>
                  </div>
                  
                  <!-- 画像プレビュー -->
                  <div v-if="result.type === 'attachment' && result.preview?.isImage" 
                       class="result-image-preview">
                    <img :src="result.preview.url" :alt="result.title" />
                  </div>
                </div>
                
                <!-- 追加情報 -->
                <div v-if="result.highlights && result.highlights.length > 0" class="result-highlights">
                  <Label class="text-xs text-muted-foreground">関連箇所：</Label>
                  <div class="highlights-list">
                    <div v-for="(highlight, index) in result.highlights.slice(0, 3)" 
                         :key="index"
                         class="highlight-item">
                      <span class="highlight-field">{{ highlight.field }}:</span>
                      <span v-html="highlight.text"></span>
                    </div>
                    <button v-if="result.highlights.length > 3"
                            class="show-more"
                            @click.stop="showAllHighlights(result)">
                      他{{ result.highlights.length - 3 }}件
                    </button>
                  </div>
                </div>
                
                <!-- パンくずリスト -->
                <div v-if="result.breadcrumb" class="result-breadcrumb">
                  <ChevronRight class="h-3 w-3 text-muted-foreground" />
                  <span v-for="(crumb, index) in result.breadcrumb" :key="index">
                    <span v-if="index > 0" class="mx-1 text-muted-foreground">/</span>
                    <span class="text-xs">{{ crumb }}</span>
                  </span>
                </div>
                
                <!-- タグ -->
                <div v-if="result.tags && result.tags.length > 0" class="result-tags">
                  <Badge
                    v-for="tag in result.tags"
                    :key="tag"
                    variant="secondary"
                    class="text-xs"
                  >
                    {{ tag }}
                  </Badge>
                </div>
              </div>
            </div>
            
            <!-- ページネーション -->
            <div v-if="totalPages > 1" class="pagination-container">
              <Pagination
                v-model:current="currentPage"
                :total="totalPages"
                :per-page="perPage"
              />
            </div>
          </main>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { useElasticsearch } from '@/composables/useElasticsearch'

// 検索モード
const searchMode = ref<'keyword' | 'ai'>('keyword')

// 検索プレースホルダー
const searchPlaceholder = computed(() => {
  return searchMode.value === 'ai'
    ? '例：先月の山田さんの案件の進捗は？'
    : '案件名、クライアント名、書類内容などを検索...'
})

// AI提案の例
const aiSuggestions = [
  { id: '1', text: '今週締切の案件を教えて' },
  { id: '2', text: '山田太郎さんに関する最新の書類は？' },
  { id: '3', text: '先月の請求書で未入金のものを一覧で見たい' },
  { id: '4', text: '離婚調停の案件で最近更新されたものは？' }
]

// 検索対象
const searchTargets = [
  { value: 'cases', label: '案件' },
  { value: 'clients', label: 'クライアント' },
  { value: 'documents', label: '書類' },
  { value: 'invoices', label: '請求書' },
  { value: 'calendar', label: 'カレンダー' },
  { value: 'communications', label: 'コミュニケーション' },
  { value: 'attachments', label: '添付ファイル' },
  { value: 'notes', label: 'メモ・ノート' }
]

// クイックアクセス
const quickAccess = [
  { id: '1', label: '今日の期日', icon: Calendar, query: 'type:calendar date:today' },
  { id: '2', label: '未読書類', icon: FileText, query: 'type:document status:unread' },
  { id: '3', label: '進行中の案件', icon: Briefcase, query: 'type:case status:active' },
  { id: '4', label: '未入金請求書', icon: Receipt, query: 'type:invoice status:unpaid' }
]

// Elasticsearch検索
const { search, searchWithAI } = useElasticsearch()

// 検索実行
const executeSearch = async () => {
  if (!searchQuery.value.trim()) return
  
  isSearching.value = true
  hasSearched.value = true
  
  try {
    if (searchMode.value === 'ai') {
      // AI検索
      searchResults.value = await searchWithAI({
        query: searchQuery.value,
        targets: Object.keys(selectedTargets.value).filter(k => selectedTargets.value[k]),
        dateRange: dateRange.value,
        includeArchived: includeArchived.value
      })
    } else {
      // キーワード検索
      searchResults.value = await search({
        query: searchQuery.value,
        targets: Object.keys(selectedTargets.value).filter(k => selectedTargets.value[k]),
        dateRange: dateRange.value,
        includeArchived: includeArchived.value,
        filters: activeFilters.value
      })
    }
    
    // 検索履歴に追加
    addToHistory(searchQuery.value)
    lastSearchQuery.value = searchQuery.value
  } catch (error) {
    toast.error('検索に失敗しました')
  } finally {
    isSearching.value = false
  }
}

// テキストハイライト
const highlightText = (text: string) => {
  if (!lastSearchQuery.value) return text
  
  const keywords = lastSearchQuery.value.split(/\s+/)
  let highlighted = text
  
  keywords.forEach(keyword => {
    const regex = new RegExp(`(${escapeRegex(keyword)})`, 'gi')
    highlighted = highlighted.replace(regex, '<mark>$1</mark>')
  })
  
  return highlighted
}

// 音声入力
const startVoiceInput = async () => {
  if (!('webkitSpeechRecognition' in window)) {
    toast.error('お使いのブラウザは音声入力に対応していません')
    return
  }
  
  const recognition = new webkitSpeechRecognition()
  recognition.lang = 'ja-JP'
  recognition.continuous = false
  recognition.interimResults = false
  
  recognition.onresult = (event) => {
    const transcript = event.results[0][0].transcript
    searchQuery.value = transcript
    executeSearch()
  }
  
  recognition.start()
}

// 検索結果のエクスポート
const exportResults = async () => {
  const exportData = {
    query: lastSearchQuery.value,
    timestamp: new Date().toISOString(),
    results: filteredResults.value.map(r => ({
      title: r.title,
      type: r.type,
      url: getResultUrl(r),
      excerpt: r.excerpt,
      updatedAt: r.updatedAt
    }))
  }
  
  const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `search-results-${Date.now()}.json`
  a.click()
}
</script>
```

### 2. 検索結果詳細ダイアログ

```vue
<template>
  <Dialog v-model:open="isOpen" @update:open="handleClose">
    <DialogContent class="max-w-4xl max-h-[90vh]">
      <DialogHeader>
        <DialogTitle class="flex items-center gap-2">
          <component :is="getTypeIcon(result.type)" class="h-5 w-5" />
          {{ result.title }}
        </DialogTitle>
      </DialogHeader>
      
      <div class="result-detail">
        <!-- メタ情報 -->
        <div class="detail-meta">
          <Badge variant="outline">{{ getTypeLabel(result.type) }}</Badge>
          <span class="text-sm text-muted-foreground">
            最終更新: {{ formatDate(result.updatedAt) }}
          </span>
          <span v-if="result.assignee" class="text-sm text-muted-foreground">
            担当: {{ result.assignee.name }}
          </span>
        </div>
        
        <!-- コンテンツプレビュー -->
        <Card class="mt-4">
          <CardContent class="p-6">
            <!-- PDFビューア -->
            <div v-if="result.type === 'document' && result.fileType === 'pdf'" 
                 class="pdf-viewer">
              <PDFViewer 
                :url="result.fileUrl" 
                :highlight="searchKeywords"
                :page="result.matchedPage"
              />
            </div>
            
            <!-- テキストコンテンツ -->
            <div v-else-if="result.content" class="content-preview">
              <div class="prose prose-sm max-w-none" v-html="highlightedContent"></div>
            </div>
            
            <!-- 構造化データ -->
            <div v-else-if="result.structuredData" class="structured-data">
              <dl class="grid grid-cols-2 gap-4">
                <div v-for="(value, key) in result.structuredData" :key="key">
                  <dt class="text-sm font-medium text-muted-foreground">
                    {{ getFieldLabel(key) }}
                  </dt>
                  <dd class="mt-1" v-html="highlightText(String(value))"></dd>
                </div>
              </dl>
            </div>
          </CardContent>
        </Card>
        
        <!-- 関連情報 -->
        <div v-if="result.relatedItems && result.relatedItems.length > 0" class="mt-6">
          <h3 class="text-sm font-medium mb-3">関連する項目</h3>
          <div class="space-y-2">
            <Card v-for="related in result.relatedItems" :key="related.id"
                  class="cursor-pointer hover:bg-muted/50"
                  @click="viewRelated(related)">
              <CardContent class="p-3">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <component :is="getTypeIcon(related.type)" class="h-4 w-4" />
                    <span class="text-sm">{{ related.title }}</span>
                  </div>
                  <ChevronRight class="h-4 w-4 text-muted-foreground" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
        
        <!-- アクション -->
        <div class="mt-6 flex items-center justify-between">
          <div class="flex items-center gap-2">
            <Button variant="outline" @click="openOriginal">
              <ExternalLink class="h-4 w-4 mr-2" />
              元のページを開く
            </Button>
            <Button variant="outline" @click="downloadFile" v-if="result.downloadable">
              <Download class="h-4 w-4 mr-2" />
              ダウンロード
            </Button>
          </div>
          
          <Button @click="handleClose">
            閉じる
          </Button>
        </div>
      </div>
    </DialogContent>
  </Dialog>
</template>
```

### 3. 検索条件保存ダイアログ

```vue
<template>
  <Dialog v-model:open="isOpen" @update:open="handleClose">
    <DialogContent>
      <DialogHeader>
        <DialogTitle>検索条件を保存</DialogTitle>
        <DialogDescription>
          よく使う検索条件を保存して、後で簡単にアクセスできます
        </DialogDescription>
      </DialogHeader>
      
      <form @submit.prevent="handleSave" class="space-y-4">
        <div class="space-y-2">
          <Label for="search-name">保存名 *</Label>
          <Input
            id="search-name"
            v-model="formData.name"
            placeholder="例：今月の未処理案件"
            required
          />
        </div>
        
        <div class="space-y-2">
          <Label for="search-description">説明</Label>
          <Textarea
            id="search-description"
            v-model="formData.description"
            rows="2"
            placeholder="この検索条件の説明（任意）"
          />
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle class="text-sm">保存される検索条件</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2 text-sm">
            <div class="flex items-start gap-2">
              <span class="font-medium min-w-[80px]">検索語句:</span>
              <span class="text-muted-foreground">{{ searchQuery }}</span>
            </div>
            <div class="flex items-start gap-2">
              <span class="font-medium min-w-[80px]">対象:</span>
              <span class="text-muted-foreground">
                {{ selectedTargetLabels.join(', ') }}
              </span>
            </div>
            <div v-if="hasActiveFilters" class="flex items-start gap-2">
              <span class="font-medium min-w-[80px]">フィルター:</span>
              <span class="text-muted-foreground">
                {{ activeFilterSummary }}
              </span>
            </div>
          </CardContent>
        </Card>
        
        <div class="flex items-center space-x-2">
          <Checkbox 
            id="add-to-quick"
            v-model="formData.addToQuickAccess"
          />
          <Label for="add-to-quick" class="cursor-pointer">
            クイックアクセスに追加
          </Label>
        </div>
        
        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose">
            キャンセル
          </Button>
          <Button type="submit" :disabled="!formData.name">
            保存
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>
```

## データモデル

```typescript
// 検索結果
interface SearchResult {
  id: string
  type: 'case' | 'client' | 'document' | 'invoice' | 'calendar' | 'communication' | 'attachment' | 'note'
  title: string
  excerpt?: string
  content?: string
  structuredData?: Record<string, any>
  
  // メタ情報
  updatedAt: Date
  createdAt: Date
  assignee?: User
  tags?: string[]
  
  // 検索関連情報
  score: number              // 関連度スコア
  highlights?: Highlight[]   // ハイライト箇所
  matchedFields?: string[]   // マッチしたフィールド
  breadcrumb?: string[]     // パンくずリスト
  
  // プレビュー情報
  preview?: {
    thumbnail?: string
    pageCount?: number
    isImage?: boolean
    url?: string
  }
  
  // ファイル情報
  fileType?: string
  fileUrl?: string
  downloadable?: boolean
  matchedPage?: number      // PDFでマッチしたページ
  
  // 関連情報
  relatedItems?: RelatedItem[]
}

// ハイライト
interface Highlight {
  field: string
  text: string
}

// 関連項目
interface RelatedItem {
  id: string
  type: string
  title: string
  relevance: number
}

// AI回答
interface AIAnswer {
  content: string           // HTML形式の回答
  sources: Source[]         // 参照元
  confidence: number        // 信頼度スコア
  suggestedActions?: Action[]  // 提案されるアクション
}

// 検索クエリ
interface SearchQuery {
  query: string
  mode: 'keyword' | 'ai'
  targets: string[]
  filters?: SearchFilters
  dateRange?: string
  includeArchived?: boolean
  page?: number
  perPage?: number
  sortBy?: string
}

// 検索フィルター
interface SearchFilters {
  type: Record<string, boolean>
  assignee: Record<string, boolean>
  dateRange: string
  tags: string[]
  status?: Record<string, boolean>
}

// 検索レスポンス
interface SearchResponse {
  results: SearchResult[]
  totalCount: number
  searchTime: number
  facets: {
    type: Facet[]
    assignee: Facet[]
    tags: Facet[]
    dateRange: Facet[]
  }
  aiAnswer?: AIAnswer
  suggestions?: string[]
}

// ファセット
interface Facet {
  value: string
  label: string
  count: number
}

// 保存された検索
interface SavedSearch {
  id: string
  name: string
  description?: string
  query: SearchQuery
  addToQuickAccess: boolean
  createdAt: Date
  lastUsed?: Date
  useCount: number
}

// 検索履歴
interface SearchHistory {
  id: string
  query: string
  mode: 'keyword' | 'ai'
  timestamp: Date
  resultCount: number
}
```

## Elasticsearch設計

### インデックス構造

```json
{
  "settings": {
    "analysis": {
      "analyzer": {
        "japanese_analyzer": {
          "type": "custom",
          "tokenizer": "kuromoji_tokenizer",
          "filter": ["kuromoji_stemmer", "lowercase"]
        }
      }
    }
  },
  "mappings": {
    "properties": {
      "id": { "type": "keyword" },
      "type": { "type": "keyword" },
      "title": {
        "type": "text",
        "analyzer": "japanese_analyzer",
        "fields": {
          "keyword": { "type": "keyword" }
        }
      },
      "content": {
        "type": "text",
        "analyzer": "japanese_analyzer"
      },
      "structuredData": { "type": "object" },
      "tags": { "type": "keyword" },
      "assigneeId": { "type": "keyword" },
      "createdAt": { "type": "date" },
      "updatedAt": { "type": "date" },
      "attachments": {
        "type": "nested",
        "properties": {
          "content": { "type": "text", "analyzer": "japanese_analyzer" },
          "fileType": { "type": "keyword" }
        }
      },
      "vector": {
        "type": "dense_vector",
        "dims": 768
      }
    }
  }
}
```

### 検索クエリ例

```javascript
// キーワード検索
{
  "query": {
    "bool": {
      "must": {
        "multi_match": {
          "query": "山田太郎 離婚",
          "fields": ["title^2", "content", "tags", "attachments.content"],
          "type": "best_fields",
          "analyzer": "japanese_analyzer"
        }
      },
      "filter": [
        { "terms": { "type": ["case", "document"] } },
        { "range": { "updatedAt": { "gte": "now-1M" } } }
      ]
    }
  },
  "highlight": {
    "fields": {
      "content": {},
      "attachments.content": {}
    }
  },
  "aggs": {
    "type": { "terms": { "field": "type" } },
    "assignee": { "terms": { "field": "assigneeId" } },
    "tags": { "terms": { "field": "tags" } }
  }
}

// ベクトル検索（セマンティック検索）
{
  "query": {
    "script_score": {
      "query": { "match_all": {} },
      "script": {
        "source": "cosineSimilarity(params.query_vector, 'vector') + 1.0",
        "params": {
          "query_vector": [0.1, 0.2, ...] // クエリのベクトル表現
        }
      }
    }
  }
}
```

## API設計

```typescript
// 検索API
interface SearchAPI {
  // キーワード検索
  POST /api/v1/search
    body: SearchQuery
    response: SearchResponse
    
  // AI検索
  POST /api/v1/search/ai
    body: {
      query: string
      context?: string
    }
    response: SearchResponse & { aiAnswer: AIAnswer }
    
  // 検索履歴
  GET /api/v1/search/history
  POST /api/v1/search/history/:id/replay
  
  // 保存された検索
  GET /api/v1/search/saved
  POST /api/v1/search/saved
  PUT /api/v1/search/saved/:id
  DELETE /api/v1/search/saved/:id
  
  // インデックス管理
  POST /api/v1/search/index/:type/:id
  DELETE /api/v1/search/index/:type/:id
  POST /api/v1/search/reindex
}
```

## 特徴的な機能

### 1. AI検索機能
- 自然言語での質問理解
- 文脈を考慮した回答生成
- 参照元の明示
- フォローアップ質問の提案

### 2. リアルタイムインデックス
- データ更新時の即時反映
- バックグラウンドでのOCR処理
- 添付ファイルの自動解析

### 3. 高度な検索UI
- インクリメンタル検索
- ファセット絞り込み
- プレビュー表示
- ドラッグ&ドロップでの結果整理