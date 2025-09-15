# カレンダー・期日管理画面設計

## 概要

法律事務所の包括的なスケジュール管理を実現するカレンダー機能です。裁判期日、内部締切、個人予定まで統合的に管理し、Google Calendar/Outlookとの連携により一元的なスケジュール管理を可能にします。高度な通知機能により期日の見落としを防ぎ、カスタマイズ可能な表示で効率的な予定確認を実現します。

## 設計方針

### 1. 統合スケジュール管理
- 裁判期日、内部締切、会議、個人予定をすべて一元管理
- Google Calendar、Outlook Calendarとの双方向同期
- シンプルなデータ構造で柔軟な活用

### 2. 手動期日入力
- すべての期日を手動で登録（将来的に自動計算機能を追加可能）
- 直感的な入力インターフェース

### 3. 高度な通知管理
- 期日種別ごとの通知ルール設定
- エスカレーション機能
- マルチチャネル通知（メール、SMS、LINE、Slack）

### 4. カスタマイズ可能な表示
- 月/週/日/法廷別/弁護士別/締切一覧/ガントチャート/タイムライン
- シンプルなデータ構造で多様な表示を実現

### 5. 競合警告
- 同時刻の期日重複を警告
- 手動での調整をサポート

## 画面構成

### 1. カレンダーメイン画面

```vue
<template>
  <div class="calendar-management">
    <!-- ヘッダー -->
    <div class="page-header">
      <div class="flex items-center gap-4">
        <h1 class="page-title">カレンダー・期日管理</h1>
        <div class="flex items-center gap-2">
          <!-- ビュー切り替え -->
          <ToggleGroup v-model="currentView" type="single">
            <ToggleGroupItem value="month">
              <CalendarDays class="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="week">
              <CalendarRange class="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="day">
              <Calendar class="h-4 w-4" />
            </ToggleGroupItem>
            <ToggleGroupItem value="list">
              <List class="h-4 w-4" />
            </ToggleGroupItem>
          </ToggleGroup>
          
          <!-- カスタムビュー選択 -->
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="outline" size="sm">
                <LayoutGrid class="h-4 w-4 mr-2" />
                カスタムビュー
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent>
              <DropdownMenuItem @click="currentView = 'court'">
                <Building class="h-4 w-4 mr-2" />
                法廷別
              </DropdownMenuItem>
              <DropdownMenuItem @click="currentView = 'lawyer'">
                <Users class="h-4 w-4 mr-2" />
                弁護士別
              </DropdownMenuItem>
              <DropdownMenuItem @click="currentView = 'deadline'">
                <Clock class="h-4 w-4 mr-2" />
                締切一覧
              </DropdownMenuItem>
              <DropdownMenuItem @click="currentView = 'gantt'">
                <BarChart3 class="h-4 w-4 mr-2" />
                ガントチャート
              </DropdownMenuItem>
              <DropdownMenuItem @click="currentView = 'timeline'">
                <GitBranch class="h-4 w-4 mr-2" />
                タイムライン
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
      
      <div class="header-actions">
        <!-- 今日ボタン -->
        <Button variant="outline" @click="goToToday">
          今日
        </Button>
        
        <!-- 日付ナビゲーション -->
        <div class="flex items-center gap-2">
          <Button variant="ghost" size="icon" @click="navigatePrevious">
            <ChevronLeft class="h-4 w-4" />
          </Button>
          <span class="font-medium min-w-[200px] text-center">
            {{ formatDateRange(currentDateRange) }}
          </span>
          <Button variant="ghost" size="icon" @click="navigateNext">
            <ChevronRight class="h-4 w-4" />
          </Button>
        </div>
        
        <!-- 新規予定作成 -->
        <Button @click="openCreateDialog">
          <Plus class="h-4 w-4 mr-2" />
          新規予定
        </Button>
      </div>
    </div>
    
    <!-- サイドバーとメインコンテンツ -->
    <div class="calendar-layout">
      <!-- 左サイドバー -->
      <aside class="calendar-sidebar">
        <!-- ミニカレンダー -->
        <Card class="mb-4">
          <CardContent class="p-4">
            <MiniCalendar 
              v-model="selectedDate"
              :marked-dates="markedDates"
            />
          </CardContent>
        </Card>
        
        <!-- フィルター -->
        <Card>
          <CardHeader>
            <CardTitle class="text-sm">表示フィルター</CardTitle>
          </CardHeader>
          <CardContent class="space-y-3">
            <!-- 予定種別フィルター -->
            <div class="space-y-2">
              <Label class="text-xs text-muted-foreground">予定種別</Label>
              <div class="space-y-1">
                <label class="flex items-center gap-2 cursor-pointer">
                  <Checkbox v-model="filters.types.courtDate" />
                  <div class="flex items-center gap-2 text-sm">
                    <div class="w-3 h-3 rounded-full bg-red-500" />
                    裁判期日
                  </div>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <Checkbox v-model="filters.types.deadline" />
                  <div class="flex items-center gap-2 text-sm">
                    <div class="w-3 h-3 rounded-full bg-orange-500" />
                    締切
                  </div>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <Checkbox v-model="filters.types.meeting" />
                  <div class="flex items-center gap-2 text-sm">
                    <div class="w-3 h-3 rounded-full bg-blue-500" />
                    会議・面談
                  </div>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <Checkbox v-model="filters.types.personal" />
                  <div class="flex items-center gap-2 text-sm">
                    <div class="w-3 h-3 rounded-full bg-gray-500" />
                    個人予定
                  </div>
                </label>
                <label class="flex items-center gap-2 cursor-pointer">
                  <Checkbox v-model="filters.types.external" />
                  <div class="flex items-center gap-2 text-sm">
                    <div class="w-3 h-3 rounded-full bg-purple-500" />
                    外部カレンダー
                  </div>
                </label>
              </div>
            </div>
            
            <!-- 担当者フィルター -->
            <div class="space-y-2">
              <Label class="text-xs text-muted-foreground">担当者</Label>
              <Select v-model="filters.assignee">
                <SelectTrigger class="h-8">
                  <SelectValue placeholder="全員" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全員</SelectItem>
                  <SelectItem value="me">自分のみ</SelectItem>
                  <SelectItem 
                    v-for="user in users" 
                    :key="user.id"
                    :value="user.id"
                  >
                    {{ user.name }}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <!-- カレンダー連携状態 -->
            <div class="pt-3 border-t">
              <Label class="text-xs text-muted-foreground mb-2 block">
                外部カレンダー連携
              </Label>
              <div class="space-y-2">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <img src="/icons/google-calendar.svg" class="h-4 w-4" />
                    <span class="text-sm">Google</span>
                  </div>
                  <Badge v-if="calendarSync.google" variant="success">
                    連携中
                  </Badge>
                  <Button v-else size="sm" variant="ghost" @click="connectGoogle">
                    連携
                  </Button>
                </div>
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <img src="/icons/outlook.svg" class="h-4 w-4" />
                    <span class="text-sm">Outlook</span>
                  </div>
                  <Badge v-if="calendarSync.outlook" variant="success">
                    連携中
                  </Badge>
                  <Button v-else size="sm" variant="ghost" @click="connectOutlook">
                    連携
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </aside>
      
      <!-- メインコンテンツ -->
      <main class="calendar-main">
        <!-- 月表示 -->
        <div v-if="currentView === 'month'" class="calendar-month">
          <div class="calendar-grid">
            <div v-for="day in calendarDays" :key="day.date" 
                 class="calendar-day"
                 :class="{ 
                   'other-month': !day.isCurrentMonth,
                   'today': day.isToday,
                   'selected': day.isSelected
                 }"
                 @click="selectDate(day.date)">
              <div class="day-header">
                <span class="day-number">{{ day.day }}</span>
              </div>
              <div class="day-events">
                <div v-for="event in day.events.slice(0, 3)" 
                     :key="event.id"
                     class="event-item"
                     :class="`event-${event.type}`"
                     @click.stop="viewEvent(event)">
                  <span class="event-time">{{ formatTime(event.startTime) }}</span>
                  <span class="event-title">{{ event.title }}</span>
                </div>
                <button v-if="day.events.length > 3" 
                        class="more-events"
                        @click.stop="showDayEvents(day)">
                  他{{ day.events.length - 3 }}件
                </button>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 週表示 -->
        <div v-if="currentView === 'week'" class="calendar-week">
          <div class="week-header">
            <div class="time-gutter"></div>
            <div v-for="day in weekDays" :key="day.date" 
                 class="week-day-header"
                 :class="{ 'today': day.isToday }">
              <div class="day-name">{{ day.dayName }}</div>
              <div class="day-date">{{ day.date }}</div>
            </div>
          </div>
          <div class="week-body">
            <div class="time-slots">
              <div v-for="hour in 24" :key="hour" class="time-slot">
                <div class="time-label">{{ hour - 1 }}:00</div>
                <div class="time-grid">
                  <div v-for="day in weekDays" :key="day.date" 
                       class="slot-cell"
                       @click="createEventAt(day.date, hour - 1)">
                  </div>
                </div>
              </div>
            </div>
            <div class="week-events">
              <div v-for="event in weekEvents" 
                   :key="event.id"
                   class="week-event"
                   :class="`event-${event.type}`"
                   :style="getEventStyle(event)"
                   @click="viewEvent(event)">
                <div class="event-content">
                  <div class="event-time">
                    {{ formatTime(event.startTime) }} - {{ formatTime(event.endTime) }}
                  </div>
                  <div class="event-title">{{ event.title }}</div>
                  <div v-if="event.location" class="event-location">
                    <MapPin class="h-3 w-3" />
                    {{ event.location }}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
        
        <!-- 締切一覧表示 -->
        <div v-if="currentView === 'deadline'" class="deadline-list">
          <Card>
            <CardHeader>
              <CardTitle>期限・締切一覧</CardTitle>
            </CardHeader>
            <CardContent class="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>期限日</TableHead>
                    <TableHead>種別</TableHead>
                    <TableHead>件名</TableHead>
                    <TableHead>案件</TableHead>
                    <TableHead>担当者</TableHead>
                    <TableHead>残日数</TableHead>
                    <TableHead>ステータス</TableHead>
                    <TableHead class="w-20">操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  <TableRow v-for="deadline in sortedDeadlines" :key="deadline.id"
                           :class="{ 'bg-red-50': deadline.daysRemaining <= 3 }">
                    <TableCell>
                      <div class="font-medium">
                        {{ formatDate(deadline.date) }}
                      </div>
                      <div class="text-sm text-muted-foreground">
                        {{ getDayOfWeek(deadline.date) }}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge :variant="getDeadlineTypeVariant(deadline.type)">
                        {{ deadline.typeLabel }}
                      </Badge>
                    </TableCell>
                    <TableCell>{{ deadline.title }}</TableCell>
                    <TableCell>
                      <NuxtLink 
                        :to="`/cases/${deadline.caseId}`"
                        class="text-primary hover:underline"
                      >
                        {{ deadline.caseNumber }}
                      </NuxtLink>
                    </TableCell>
                    <TableCell>
                      <div class="flex -space-x-2">
                        <Avatar 
                          v-for="assignee in deadline.assignees" 
                          :key="assignee.id"
                          class="h-8 w-8 border-2 border-background"
                        >
                          <AvatarFallback>{{ assignee.name.slice(0, 1) }}</AvatarFallback>
                        </Avatar>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div class="flex items-center gap-2">
                        <span :class="{
                          'text-red-600 font-medium': deadline.daysRemaining <= 3,
                          'text-orange-600': deadline.daysRemaining <= 7,
                        }">
                          {{ deadline.daysRemaining }}日
                        </span>
                        <AlertCircle v-if="deadline.daysRemaining <= 3" 
                                     class="h-4 w-4 text-red-600" />
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge :variant="deadline.completed ? 'success' : 'default'">
                        {{ deadline.completed ? '完了' : '未完了' }}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="icon" 
                        variant="ghost"
                        @click="viewEvent(deadline)"
                      >
                        <Eye class="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
        
        <!-- ガントチャート表示 -->
        <div v-if="currentView === 'gantt'" class="gantt-chart">
          <GanttChart 
            :events="ganttEvents"
            :start-date="ganttStartDate"
            :end-date="ganttEndDate"
            @event-click="viewEvent"
            @event-update="updateEventDates"
          />
        </div>
        
        <!-- タイムライン表示 -->
        <div v-if="currentView === 'timeline'" class="timeline-view">
          <Timeline
            :events="timelineEvents"
            :groups="timelineGroups"
            @event-click="viewEvent"
          />
        </div>
      </main>
    </div>
  </div>
</template>

<script setup lang="ts">
// 競合チェック
const checkConflicts = (event: CalendarEvent) => {
  const conflicts = events.value.filter(e => 
    e.id !== event.id &&
    e.assignees.some(a => event.assignees.includes(a)) &&
    isTimeOverlap(e.startTime, e.endTime, event.startTime, event.endTime)
  )
  
  if (conflicts.length > 0) {
    showConflictWarning(conflicts)
  }
}

// 外部カレンダー連携
const connectGoogle = async () => {
  const authUrl = await $fetch('/api/v1/calendar/google/auth')
  window.location.href = authUrl
}

const connectOutlook = async () => {
  const authUrl = await $fetch('/api/v1/calendar/outlook/auth')
  window.location.href = authUrl
}

// イベントスタイル計算（週表示用）
const getEventStyle = (event: CalendarEvent) => {
  const dayIndex = weekDays.value.findIndex(d => 
    isSameDay(d.date, event.startTime)
  )
  const startHour = event.startTime.getHours()
  const duration = (event.endTime - event.startTime) / (1000 * 60 * 60)
  
  return {
    left: `${(100 / 7) * dayIndex}%`,
    width: `${100 / 7}%`,
    top: `${startHour * 60}px`,
    height: `${duration * 60}px`
  }
}
</script>
```

### 2. 予定作成・編集ダイアログ

```vue
<template>
  <Dialog v-model:open="isOpen" @update:open="handleClose">
    <DialogContent class="max-w-2xl">
      <DialogHeader>
        <DialogTitle>
          {{ isEdit ? '予定編集' : '新規予定作成' }}
        </DialogTitle>
      </DialogHeader>
      
      <form @submit.prevent="handleSubmit" class="space-y-6">
        <!-- 基本情報 -->
        <div class="space-y-4">
          <!-- タイトル -->
          <div class="space-y-2">
            <Label for="title">件名 *</Label>
            <Input
              id="title"
              v-model="formData.title"
              placeholder="予定のタイトルを入力"
              required
            />
          </div>
          
          <!-- 予定種別 -->
          <div class="space-y-2">
            <Label for="type">種別 *</Label>
            <Select v-model="formData.type">
              <SelectTrigger id="type">
                <SelectValue placeholder="選択してください" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="court_date">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-red-500" />
                    裁判期日
                  </div>
                </SelectItem>
                <SelectItem value="deadline">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-orange-500" />
                    締切
                  </div>
                </SelectItem>
                <SelectItem value="client_meeting">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-blue-500" />
                    クライアント面談
                  </div>
                </SelectItem>
                <SelectItem value="internal_meeting">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-green-500" />
                    内部会議
                  </div>
                </SelectItem>
                <SelectItem value="personal">
                  <div class="flex items-center gap-2">
                    <div class="w-3 h-3 rounded-full bg-gray-500" />
                    個人予定
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>
          
          <!-- 日時設定 -->
          <div class="grid grid-cols-2 gap-4">
            <div class="space-y-2">
              <Label for="start-date">開始日時 *</Label>
              <div class="flex gap-2">
                <DatePicker
                  id="start-date"
                  v-model="formData.startDate"
                  class="flex-1"
                />
                <TimePicker
                  v-model="formData.startTime"
                  class="w-24"
                />
              </div>
            </div>
            <div class="space-y-2">
              <Label for="end-date">終了日時 *</Label>
              <div class="flex gap-2">
                <DatePicker
                  id="end-date"
                  v-model="formData.endDate"
                  class="flex-1"
                />
                <TimePicker
                  v-model="formData.endTime"
                  class="w-24"
                />
              </div>
            </div>
          </div>
          
          <!-- 終日設定 -->
          <div class="flex items-center space-x-2">
            <Checkbox 
              id="all-day"
              v-model="formData.allDay"
              @update:checked="handleAllDayChange"
            />
            <Label for="all-day" class="cursor-pointer">
              終日
            </Label>
          </div>
          
          <!-- 案件紐付け（裁判期日・締切の場合） -->
          <div v-if="['court_date', 'deadline'].includes(formData.type)" 
               class="space-y-2">
            <Label for="case">関連案件</Label>
            <CaseSelect
              id="case"
              v-model="formData.caseId"
              placeholder="案件を選択"
            />
          </div>
          
          <!-- 場所（裁判期日の場合は法廷情報） -->
          <div v-if="formData.type === 'court_date'" class="space-y-4">
            <div class="grid grid-cols-2 gap-4">
              <div class="space-y-2">
                <Label for="court">裁判所</Label>
                <Input
                  id="court"
                  v-model="formData.court"
                  placeholder="東京地方裁判所"
                />
              </div>
              <div class="space-y-2">
                <Label for="courtroom">法廷</Label>
                <Input
                  id="courtroom"
                  v-model="formData.courtroom"
                  placeholder="第3法廷"
                />
              </div>
            </div>
          </div>
          
          <!-- 一般的な場所 -->
          <div v-else class="space-y-2">
            <Label for="location">場所</Label>
            <Input
              id="location"
              v-model="formData.location"
              placeholder="会議室A、オンラインなど"
            />
          </div>
          
          <!-- 担当者 -->
          <div class="space-y-2">
            <Label for="assignees">担当者 *</Label>
            <UserMultiSelect
              id="assignees"
              v-model="formData.assigneeIds"
              placeholder="担当者を選択"
            />
          </div>
          
          <!-- 説明・メモ -->
          <div class="space-y-2">
            <Label for="description">説明・メモ</Label>
            <Textarea
              id="description"
              v-model="formData.description"
              rows="3"
              placeholder="詳細な情報やメモを入力"
            />
          </div>
        </div>
        
        <!-- 通知設定 -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">通知設定</CardTitle>
          </CardHeader>
          <CardContent class="space-y-4">
            <!-- 通知ルール -->
            <div class="space-y-2">
              <div class="flex items-center justify-between">
                <Label>通知タイミング</Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  @click="addNotification"
                >
                  <Plus class="h-4 w-4 mr-1" />
                  追加
                </Button>
              </div>
              
              <div class="space-y-2">
                <div v-for="(notification, index) in formData.notifications" 
                     :key="index"
                     class="flex items-center gap-2">
                  <Select v-model="notification.timing">
                    <SelectTrigger class="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="15m">15分前</SelectItem>
                      <SelectItem value="30m">30分前</SelectItem>
                      <SelectItem value="1h">1時間前</SelectItem>
                      <SelectItem value="2h">2時間前</SelectItem>
                      <SelectItem value="1d">1日前</SelectItem>
                      <SelectItem value="3d">3日前</SelectItem>
                      <SelectItem value="1w">1週間前</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Select v-model="notification.channel" class="flex-1">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="email">メール</SelectItem>
                      <SelectItem value="app">アプリ通知</SelectItem>
                      <SelectItem value="sms">SMS</SelectItem>
                      <SelectItem value="line">LINE</SelectItem>
                      <SelectItem value="slack">Slack</SelectItem>
                    </SelectContent>
                  </Select>
                  
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    @click="removeNotification(index)"
                  >
                    <X class="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </div>
            
            <!-- エスカレーション設定 -->
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <Checkbox 
                  id="enable-escalation"
                  v-model="formData.enableEscalation"
                />
                <Label for="enable-escalation" class="cursor-pointer">
                  未確認時のエスカレーション
                </Label>
              </div>
              
              <div v-if="formData.enableEscalation" class="pl-6 space-y-2">
                <div class="flex items-center gap-2">
                  <Label class="min-w-[80px]">通知先</Label>
                  <UserSelect
                    v-model="formData.escalationUserId"
                    placeholder="上長を選択"
                    class="flex-1"
                  />
                </div>
                <div class="flex items-center gap-2">
                  <Label class="min-w-[80px]">タイミング</Label>
                  <Select v-model="formData.escalationTiming">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="30m">30分後</SelectItem>
                      <SelectItem value="1h">1時間後</SelectItem>
                      <SelectItem value="2h">2時間後</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>
            
            <!-- クライアント通知（面談予定の場合） -->
            <div v-if="formData.type === 'client_meeting'" class="space-y-2">
              <div class="flex items-center space-x-2">
                <Checkbox 
                  id="notify-client"
                  v-model="formData.notifyClient"
                />
                <Label for="notify-client" class="cursor-pointer">
                  クライアントに通知
                </Label>
              </div>
              
              <div v-if="formData.notifyClient" class="pl-6">
                <p class="text-sm text-muted-foreground">
                  面談の1日前にクライアントへリマインドメールを送信します
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- 繰り返し設定 -->
        <Card>
          <CardHeader>
            <CardTitle class="text-base">繰り返し設定</CardTitle>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <div class="flex items-center space-x-2">
                <Checkbox 
                  id="enable-recurrence"
                  v-model="formData.enableRecurrence"
                />
                <Label for="enable-recurrence" class="cursor-pointer">
                  繰り返す
                </Label>
              </div>
              
              <div v-if="formData.enableRecurrence" class="space-y-3 pl-6">
                <div class="flex items-center gap-2">
                  <Label class="min-w-[80px]">頻度</Label>
                  <Select v-model="formData.recurrence.frequency">
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="daily">毎日</SelectItem>
                      <SelectItem value="weekly">毎週</SelectItem>
                      <SelectItem value="monthly">毎月</SelectItem>
                      <SelectItem value="yearly">毎年</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <div class="flex items-center gap-2">
                  <Label class="min-w-[80px]">終了</Label>
                  <RadioGroup v-model="formData.recurrence.endType">
                    <div class="flex items-center space-x-2">
                      <RadioGroupItem value="never" id="end-never" />
                      <Label for="end-never" class="cursor-pointer">なし</Label>
                    </div>
                    <div class="flex items-center space-x-2">
                      <RadioGroupItem value="date" id="end-date" />
                      <Label for="end-date" class="cursor-pointer">日付指定</Label>
                      <DatePicker
                        v-if="formData.recurrence.endType === 'date'"
                        v-model="formData.recurrence.endDate"
                        class="ml-2"
                      />
                    </div>
                    <div class="flex items-center space-x-2">
                      <RadioGroupItem value="count" id="end-count" />
                      <Label for="end-count" class="cursor-pointer">回数指定</Label>
                      <Input
                        v-if="formData.recurrence.endType === 'count'"
                        v-model.number="formData.recurrence.count"
                        type="number"
                        class="w-20 ml-2"
                        min="1"
                      />
                    </div>
                  </RadioGroup>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <!-- 外部カレンダー同期 -->
        <Card v-if="hasExternalCalendars">
          <CardHeader>
            <CardTitle class="text-base">外部カレンダー同期</CardTitle>
          </CardHeader>
          <CardContent class="space-y-2">
            <div v-if="calendarSync.google" class="flex items-center space-x-2">
              <Checkbox 
                id="sync-google"
                v-model="formData.syncToGoogle"
              />
              <Label for="sync-google" class="cursor-pointer flex items-center gap-2">
                <img src="/icons/google-calendar.svg" class="h-4 w-4" />
                Google Calendarに同期
              </Label>
            </div>
            
            <div v-if="calendarSync.outlook" class="flex items-center space-x-2">
              <Checkbox 
                id="sync-outlook"
                v-model="formData.syncToOutlook"
              />
              <Label for="sync-outlook" class="cursor-pointer flex items-center gap-2">
                <img src="/icons/outlook.svg" class="h-4 w-4" />
                Outlookカレンダーに同期
              </Label>
            </div>
          </CardContent>
        </Card>
        
        <!-- 競合警告 -->
        <Alert v-if="conflicts.length > 0" variant="warning">
          <AlertTriangle class="h-4 w-4" />
          <AlertTitle>予定の重複があります</AlertTitle>
          <AlertDescription>
            <div class="mt-2 space-y-1">
              <div v-for="conflict in conflicts" :key="conflict.id" class="text-sm">
                {{ formatTime(conflict.startTime) }} - {{ formatTime(conflict.endTime) }}:
                {{ conflict.title }}
                ({{ conflict.assignees.map(a => a.name).join(', ') }})
              </div>
            </div>
          </AlertDescription>
        </Alert>
        
        <DialogFooter>
          <Button type="button" variant="outline" @click="handleClose">
            キャンセル
          </Button>
          <Button type="submit" :disabled="isLoading || !isValid">
            <Loader2 v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
            {{ isEdit ? '更新' : '作成' }}
          </Button>
        </DialogFooter>
      </form>
    </DialogContent>
  </Dialog>
</template>

<script setup lang="ts">
// デフォルト通知設定
const defaultNotifications = {
  court_date: [
    { timing: '1w', channel: 'email' },
    { timing: '3d', channel: 'email' },
    { timing: '1d', channel: 'app' },
    { timing: '2h', channel: 'app' }
  ],
  deadline: [
    { timing: '3d', channel: 'email' },
    { timing: '1d', channel: 'email' },
    { timing: '2h', channel: 'app' }
  ],
  client_meeting: [
    { timing: '1d', channel: 'email' },
    { timing: '2h', channel: 'app' }
  ],
  internal_meeting: [
    { timing: '30m', channel: 'app' }
  ],
  personal: [
    { timing: '30m', channel: 'app' }
  ]
}

// 種別変更時に通知設定を更新
watch(() => formData.value.type, (newType) => {
  if (!isEdit.value && newType) {
    formData.value.notifications = [...defaultNotifications[newType]]
  }
})

// 競合チェック
const conflicts = computed(() => {
  if (!formData.value.startDate || !formData.value.assigneeIds.length) {
    return []
  }
  
  return checkTimeConflicts({
    startTime: combineDatetime(formData.value.startDate, formData.value.startTime),
    endTime: combineDatetime(formData.value.endDate, formData.value.endTime),
    assigneeIds: formData.value.assigneeIds,
    excludeId: props.eventId
  })
})
</script>
```

### 3. 通知管理画面

```vue
<template>
  <div class="notification-settings">
    <Card>
      <CardHeader>
        <CardTitle>通知設定</CardTitle>
        <CardDescription>
          予定種別ごとのデフォルト通知設定を管理します
        </CardDescription>
      </CardHeader>
      <CardContent class="space-y-6">
        <!-- 通知チャネル設定 -->
        <div class="space-y-4">
          <h3 class="font-medium">通知チャネル</h3>
          
          <!-- メール通知 -->
          <div class="flex items-center justify-between p-4 border rounded-lg">
            <div class="flex items-center gap-3">
              <Mail class="h-5 w-5 text-muted-foreground" />
              <div>
                <div class="font-medium">メール通知</div>
                <div class="text-sm text-muted-foreground">
                  {{ user.email }}
                </div>
              </div>
            </div>
            <Switch v-model="channels.email" />
          </div>
          
          <!-- SMS通知 -->
          <div class="flex items-center justify-between p-4 border rounded-lg">
            <div class="flex items-center gap-3">
              <Smartphone class="h-5 w-5 text-muted-foreground" />
              <div>
                <div class="font-medium">SMS通知</div>
                <div class="text-sm text-muted-foreground">
                  {{ user.phone || '電話番号未設定' }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Button 
                v-if="!user.phone"
                variant="outline"
                size="sm"
                @click="openPhoneDialog"
              >
                設定
              </Button>
              <Switch v-model="channels.sms" :disabled="!user.phone" />
            </div>
          </div>
          
          <!-- LINE通知 -->
          <div class="flex items-center justify-between p-4 border rounded-lg">
            <div class="flex items-center gap-3">
              <MessageCircle class="h-5 w-5 text-muted-foreground" />
              <div>
                <div class="font-medium">LINE通知</div>
                <div class="text-sm text-muted-foreground">
                  {{ lineConnected ? '連携済み' : '未連携' }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Button 
                v-if="!lineConnected"
                variant="outline"
                size="sm"
                @click="connectLine"
              >
                連携
              </Button>
              <Switch v-model="channels.line" :disabled="!lineConnected" />
            </div>
          </div>
          
          <!-- Slack通知 -->
          <div class="flex items-center justify-between p-4 border rounded-lg">
            <div class="flex items-center gap-3">
              <Hash class="h-5 w-5 text-muted-foreground" />
              <div>
                <div class="font-medium">Slack通知</div>
                <div class="text-sm text-muted-foreground">
                  {{ slackConnected ? slackWorkspace : '未連携' }}
                </div>
              </div>
            </div>
            <div class="flex items-center gap-2">
              <Button 
                v-if="!slackConnected"
                variant="outline"
                size="sm"
                @click="connectSlack"
              >
                連携
              </Button>
              <Switch v-model="channels.slack" :disabled="!slackConnected" />
            </div>
          </div>
        </div>
        
        <!-- 予定種別ごとの設定 -->
        <div class="space-y-4">
          <h3 class="font-medium">予定種別ごとのデフォルト設定</h3>
          
          <Tabs defaultValue="court_date">
            <TabsList class="grid grid-cols-5 w-full">
              <TabsTrigger value="court_date">裁判期日</TabsTrigger>
              <TabsTrigger value="deadline">締切</TabsTrigger>
              <TabsTrigger value="client_meeting">面談</TabsTrigger>
              <TabsTrigger value="internal_meeting">会議</TabsTrigger>
              <TabsTrigger value="personal">個人</TabsTrigger>
            </TabsList>
            
            <TabsContent value="court_date" class="space-y-4">
              <div class="p-4 border rounded-lg">
                <div class="flex items-center justify-between mb-4">
                  <Label>通知タイミング</Label>
                  <Button
                    variant="outline"
                    size="sm"
                    @click="addDefaultNotification('court_date')"
                  >
                    <Plus class="h-4 w-4 mr-1" />
                    追加
                  </Button>
                </div>
                
                <div class="space-y-2">
                  <div v-for="(notif, index) in defaultSettings.court_date" 
                       :key="index"
                       class="flex items-center gap-2">
                    <Select v-model="notif.timing">
                      <SelectTrigger class="w-32">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1w">1週間前</SelectItem>
                        <SelectItem value="3d">3日前</SelectItem>
                        <SelectItem value="1d">1日前</SelectItem>
                        <SelectItem value="2h">2時間前</SelectItem>
                        <SelectItem value="1h">1時間前</SelectItem>
                        <SelectItem value="30m">30分前</SelectItem>
                      </SelectContent>
                    </Select>
                    
                    <MultiSelect
                      v-model="notif.channels"
                      :options="availableChannels"
                      placeholder="通知方法"
                      class="flex-1"
                    />
                    
                    <Button
                      variant="ghost"
                      size="icon"
                      @click="removeDefaultNotification('court_date', index)"
                    >
                      <X class="h-4 w-4" />
                    </Button>
                  </div>
                </div>
                
                <!-- エスカレーション設定 -->
                <div class="mt-4 pt-4 border-t">
                  <div class="flex items-center space-x-2">
                    <Checkbox 
                      id="court-escalation"
                      v-model="defaultSettings.court_date_escalation"
                    />
                    <Label for="court-escalation" class="cursor-pointer">
                      重要な期日は上長にもエスカレーション
                    </Label>
                  </div>
                </div>
              </div>
            </TabsContent>
            
            <!-- 他の種別も同様の設定UI -->
          </Tabs>
        </div>
        
        <!-- 保存ボタン -->
        <div class="flex justify-end">
          <Button @click="saveSettings" :disabled="isLoading">
            <Loader2 v-if="isLoading" class="h-4 w-4 mr-2 animate-spin" />
            設定を保存
          </Button>
        </div>
      </CardContent>
    </Card>
  </div>
</template>
```

## データモデル

```typescript
// カレンダーイベント（シンプルな構造）
interface CalendarEvent {
  id: string
  title: string
  type: 'court_date' | 'deadline' | 'client_meeting' | 'internal_meeting' | 'personal' | 'external'
  
  // 日時情報
  startTime: Date
  endTime: Date
  allDay: boolean
  
  // 関連情報
  caseId?: string           // 案件との紐付け
  clientId?: string         // クライアントとの紐付け
  assigneeIds: string[]     // 担当者
  
  // 場所情報
  location?: string         // 一般的な場所
  court?: string           // 裁判所（裁判期日の場合）
  courtroom?: string       // 法廷（裁判期日の場合）
  
  // 詳細情報
  description?: string
  attachments?: Attachment[]
  
  // 通知設定
  notifications: Notification[]
  enableEscalation?: boolean
  escalationUserId?: string
  escalationTiming?: string
  notifyClient?: boolean
  
  // 繰り返し設定
  recurrence?: Recurrence
  recurrenceId?: string    // 繰り返しイベントのグループID
  
  // 外部カレンダー
  syncToGoogle?: boolean
  syncToOutlook?: boolean
  googleEventId?: string
  outlookEventId?: string
  
  // システム情報
  createdAt: Date
  updatedAt: Date
  createdBy: User
  completed?: boolean      // 締切の場合の完了フラグ
}

// 通知設定
interface Notification {
  id: string
  timing: string          // '15m', '30m', '1h', '2h', '1d', '3d', '1w'
  channel: 'email' | 'app' | 'sms' | 'line' | 'slack'
  sent: boolean
  sentAt?: Date
}

// 繰り返し設定
interface Recurrence {
  frequency: 'daily' | 'weekly' | 'monthly' | 'yearly'
  interval?: number
  endType: 'never' | 'date' | 'count'
  endDate?: Date
  count?: number
  daysOfWeek?: number[]  // 0-6 (日-土)
  dayOfMonth?: number
}

// 外部カレンダー連携
interface CalendarSync {
  userId: string
  provider: 'google' | 'outlook'
  accessToken: string
  refreshToken: string
  email: string
  syncEnabled: boolean
  lastSyncAt: Date
  syncDirection: 'import' | 'export' | 'both'
}

// 通知チャネル設定
interface NotificationChannels {
  email: boolean
  app: boolean
  sms: boolean
  line: boolean
  slack: boolean
}

// デフォルト通知設定
interface DefaultNotificationSettings {
  eventType: string
  notifications: {
    timing: string
    channels: string[]
  }[]
  enableEscalation?: boolean
}
```

## API設計

```typescript
// カレンダーイベントAPI
interface CalendarAPI {
  // イベント取得
  GET /api/v1/calendar/events
    query: {
      start: Date
      end: Date
      type?: string[]
      assigneeId?: string
      caseId?: string
    }
    
  // イベント作成
  POST /api/v1/calendar/events
  
  // イベント更新
  PUT /api/v1/calendar/events/:id
  
  // イベント削除
  DELETE /api/v1/calendar/events/:id
  
  // 競合チェック
  POST /api/v1/calendar/check-conflicts
    body: {
      startTime: Date
      endTime: Date
      assigneeIds: string[]
      excludeId?: string
    }
    
  // 外部カレンダー連携
  GET /api/v1/calendar/google/auth
  GET /api/v1/calendar/google/callback
  POST /api/v1/calendar/google/sync
  
  GET /api/v1/calendar/outlook/auth
  GET /api/v1/calendar/outlook/callback
  POST /api/v1/calendar/outlook/sync
  
  // 通知設定
  GET /api/v1/calendar/notification-settings
  PUT /api/v1/calendar/notification-settings
}
```

## 表示カスタマイズ

### ビューの種類
1. **月表示** - 標準的なカレンダーグリッド
2. **週表示** - 時間軸付き週間ビュー
3. **日表示** - 1日の詳細スケジュール
4. **法廷別表示** - 法廷ごとにグループ化
5. **弁護士別表示** - 担当者ごとのスケジュール
6. **締切一覧** - 期限順のリスト表示
7. **ガントチャート** - 期間の可視化
8. **タイムライン** - 時系列での表示

### カスタマイズ機能
- ドラッグ&ドロップでの予定変更
- 表示する予定種別のフィルタリング
- カラーテーマのカスタマイズ
- 表示密度の調整