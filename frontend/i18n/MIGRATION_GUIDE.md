# i18n 翻訳キー移行ガイド

## 概要
共通翻訳を`common`から`shared`に移行し、より具体的なカテゴリに分割しました。

## キーの変更マッピング

### 基本アクション
- 旧: `$t('common.actions.edit')` または `$t('expense.actions.edit')`
- 新: `$t('shared.actions.edit')`

### メタデータ
- 旧: `$t('common.createdAt')` または `$t('expense.table.createdAt')`
- 新: `$t('shared.metadata.createdAt')`

### バリデーション
- 旧: `$t('common.validation.required')`
- 新: `$t('shared.validation.required')`

### UI要素
- 旧: `$t('common.loading.title')`
- 新: `$t('shared.ui.loading')`

### テーブル
- 旧: `$t('common.table.columns')`
- 新: `$t('shared.table.columns')`

### フォーム
- 旧: `$t('common.form.submit')`
- 新: `$t('shared.form.submit')`

### 日付・時刻
- 旧: `$t('common.date.today')`
- 新: `$t('shared.dateTime.date.today')`

### ステータス
- 旧: `$t('common.status.active')`
- 新: `$t('shared.status.active')`

### メッセージ
- 旧: `$t('common.error.title')`
- 新: `$t('shared.messages.error.default')`

### 検索
- 旧: `$t('common.search.placeholder')`
- 新: `$t('shared.search.placeholder')`

### フィルター
- 旧: `$t('common.filters.title')`
- 新: `$t('shared.filters.title')`

### ページネーション
- 旧: `$t('common.pagination.next')`
- 新: `$t('shared.pagination.next')`

### ユーザー
- 旧: `$t('common.user')`
- 新: `$t('shared.user.user')`

## 経費モジュール固有の変更

### ドメイン用語
- 旧: `$t('expense.title')`
- 新: `$t('expense.domain.expense')`

### カテゴリ
- 旧: `$t('expense.category.transportation')`
- 新: `$t('expense.domain.categories.transportation')`

### リスト画面
- 旧: `$t('expense.list.title')`
- 新: `$t('expense.list.title')` (変更なし、ただし構造化)

### フォーム
- 旧: `$t('expense.form.fields.date')`
- 新: `$t('expense.form.fields.date.label')`

### 統計
- 新規追加: `$t('expense.statistics.*')`

### インポート/エクスポート
- 新規追加: `$t('expense.importExport.*')`

## コンポーネント更新例

### Before
```vue
<template>
  <Button>{{ $t('expense.actions.save') }}</Button>
  <span>{{ $t('expense.table.createdAt') }}</span>
</template>
```

### After
```vue
<template>
  <Button>{{ $t('shared.actions.save') }}</Button>
  <span>{{ $t('shared.metadata.createdAt') }}</span>
</template>
```

## 移行手順

1. **検索と置換**
   ```bash
   # 例: expense.actions を shared.actions に置換
   find . -name "*.vue" -exec sed -i 's/expense\.actions\./shared.actions./g' {} \;
   ```

2. **重複キーの削除**
   - `expense.json`から汎用的なキーを削除
   - 専門用語のみを`expense.domain`に保持

3. **テスト**
   ```bash
   bun run typecheck
   bun run test
   ```

## 注意事項

- `shared`配下のキーは全モジュールで共通使用
- モジュール固有の専門用語は各モジュールの`domain`に配置
- 重複を避けるため、汎用的なアクションは必ず`shared`を使用

## メリット

1. **保守性向上**: 翻訳の重複がなくなり、一箇所の修正で全体に反映
2. **構造の明確化**: どこに何があるか明確に
3. **拡張性**: 新しいモジュール追加時も同じ構造で対応可能
4. **ファイルサイズ最適化**: 重複削除により全体のサイズ削減