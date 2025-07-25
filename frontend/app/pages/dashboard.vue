<template>
  <div class="space-y-6">
    <!-- Page Header -->
    <div class="flex items-center justify-between">
      <div>
        <h1 class="text-3xl font-bold text-foreground">ダッシュボード</h1>
        <p class="text-muted-foreground mt-1">法律事務所業務管理システム</p>
      </div>
      <Button>
        <Icon name="lucide:plus" class="w-4 h-4 mr-2" />
        新規案件
      </Button>
    </div>

    <!-- Stats Cards -->
    <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">総案件数</CardTitle>
          <Icon name="lucide:file-text" class="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">245</div>
          <p class="text-xs text-muted-foreground">前月比 +12%</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">アクティブ案件</CardTitle>
          <Icon name="lucide:activity" class="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">89</div>
          <p class="text-xs text-muted-foreground">前月比 +5%</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">今月の売上</CardTitle>
          <Icon name="lucide:trending-up" class="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">¥12,400,000</div>
          <p class="text-xs text-muted-foreground">前月比 +18%</p>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader class="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle class="text-sm font-medium">依頼者数</CardTitle>
          <Icon name="lucide:users" class="w-4 h-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div class="text-2xl font-bold">156</div>
          <p class="text-xs text-muted-foreground">前月比 +8%</p>
        </CardContent>
      </Card>
    </div>

    <!-- Quick Actions -->
    <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle>クイックアクション</CardTitle>
          <CardDescription>よく使用される機能へのショートカット</CardDescription>
        </CardHeader>
        <CardContent class="grid grid-cols-2 gap-4">
          <Button variant="outline" class="h-20 flex-col">
            <Icon name="lucide:plus" class="w-6 h-6 mb-2" />
            新規案件
          </Button>
          <Button variant="outline" class="h-20 flex-col">
            <Icon name="lucide:user-plus" class="w-6 h-6 mb-2" />
            新規依頼者
          </Button>
          <Button variant="outline" class="h-20 flex-col">
            <Icon name="lucide:upload" class="w-6 h-6 mb-2" />
            書類アップロード
          </Button>
          <Button variant="outline" class="h-20 flex-col">
            <Icon name="lucide:calendar" class="w-6 h-6 mb-2" />
            期日管理
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>最近の活動</CardTitle>
          <CardDescription>システム内の最新活動</CardDescription>
        </CardHeader>
        <CardContent>
          <div class="space-y-4">
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 rounded-full bg-blue-500 mt-2"/>
              <div class="flex-1">
                <p class="text-sm font-medium">新規案件が作成されました</p>
                <p class="text-xs text-muted-foreground">田中 vs 山田商事 - 2時間前</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 rounded-full bg-green-500 mt-2"/>
              <div class="flex-1">
                <p class="text-sm font-medium">書類がアップロードされました</p>
                <p class="text-xs text-muted-foreground">契約書_v2.pdf - 4時間前</p>
              </div>
            </div>
            <div class="flex items-start gap-3">
              <div class="w-2 h-2 rounded-full bg-orange-500 mt-2"/>
              <div class="flex-1">
                <p class="text-sm font-medium">期日が近づいています</p>
                <p class="text-xs text-muted-foreground">佐藤商事訴訟 - 明日</p>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  </div>
</template>

<script setup lang="ts">
// Dashboard page
definePageMeta({
  middleware: 'auth'
})
</script>