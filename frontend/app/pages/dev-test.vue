<template>
  <div class="container mx-auto px-6 py-8">
    <!-- Header -->
    <header class="mb-8">
      <h1 class="text-3xl font-bold text-foreground">
        Astar Management - 開発テストページ
      </h1>
      <p class="text-muted-foreground mt-2">
        法律事務所向け業務管理システムのコンポーネントテスト
      </p>
    </header>

    <!-- Tailwind CSS Test Section -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4 text-foreground">Tailwind CSS テスト</h2>
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-blue-100 text-blue-800 p-4 rounded-lg border border-blue-300">
          <h3 class="font-medium">進行中</h3>
          <p class="text-sm">Tailwind utility classes が動作しています</p>
        </div>
        <div class="bg-green-100 text-green-800 p-4 rounded-lg border border-green-300">
          <h3 class="font-medium">完了</h3>
          <p class="text-sm">レスポンシブグリッドも正常です</p>
        </div>
        <div class="bg-yellow-100 text-yellow-800 p-4 rounded-lg border border-yellow-300">
          <h3 class="font-medium">保留</h3>
          <p class="text-sm">カラーパレットも適用されています</p>
        </div>
      </div>
    </section>

    <!-- shadcn-vue Components Test Section -->
    <section class="mb-8">
      <h2 class="text-xl font-semibold mb-4 text-foreground">shadcn-vue コンポーネントテスト</h2>
      
      <div class="space-y-4">
        <!-- Card Component Test -->
        <Card class="max-w-md">
          <CardHeader>
            <CardTitle>案件管理カード</CardTitle>
            <CardDescription>
              shadcn-vueのCardコンポーネントが正常に動作しています
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div class="space-y-2">
              <Badge variant="secondary">進行中</Badge>
              <p class="text-sm text-muted-foreground">
                案件番号: CASE-2025-001
              </p>
            </div>
          </CardContent>
        </Card>

        <!-- Button Component Test -->
        <div class="flex gap-4 flex-wrap">
          <Button variant="default">デフォルトボタン</Button>
          <Button variant="secondary">セカンダリボタン</Button>
          <Button variant="destructive">削除ボタン</Button>
          <Button variant="outline">アウトラインボタン</Button>
        </div>

        <!-- Input and Form Test -->
        <div class="max-w-md space-y-4">
          <div>
            <Label for="test-input">テスト入力フィールド</Label>
            <Input id="test-input" :placeholder="$t('foundation.search.placeholder')" class="mt-1" />
          </div>
          <div>
            <Label for="test-textarea">テストテキストエリア</Label>
            <Textarea id="test-textarea" placeholder="詳細情報を入力..." class="mt-1" />
          </div>
        </div>
      </div>
    </section>

    <!-- Dark Mode Test -->
    <section>
      <h2 class="text-xl font-semibold mb-4 text-foreground">ダークモードテスト</h2>
      <div class="bg-muted p-4 rounded-lg">
        <p class="text-muted-foreground">
          CSS変数によるテーマシステムが正常に動作しています。
          ブラウザの開発者ツールで <code class="bg-background px-2 py-1 rounded text-xs">html</code> 要素に 
          <code class="bg-background px-2 py-1 rounded text-xs">class="dark"</code> を追加するとダークモードになります。
        </p>
      </div>
    </section>

    <!-- Navigation Test -->
    <section class="mt-8">
      <h2 class="text-xl font-semibold mb-4 text-foreground">ナビゲーションテスト</h2>
      <div class="flex gap-4 flex-wrap">
        <Button as="nuxt-link" to="/signin" variant="outline">{{ $t('modules.navigation.loginPage') }}</Button>
        <Button as="nuxt-link" to="/dashboard" variant="outline">ダッシュボード</Button>
        <Button as="nuxt-link" to="/cases/kanban" variant="outline">案件管理</Button>
      </div>
    </section>
  </div>
</template>

<script setup lang="ts">
// ページメタ設定
definePageMeta({
  layout: 'default'
})

// ページタイトル設定
const { t } = useI18n()
useHead({
  title: `開発テスト - ${t('foundation.common.app.title')}`,
  meta: [
    { name: 'description', content: '開発環境テストページ' }
  ]
})
</script>