# 残りのi18n警告の分類

## 分類結果（全17件）

### 1. エラーメッセージ関連（3件）
**ファイル**: `foundation/composables/useI18n.ts`
- `error.generic.somethingWentWrong` (2箇所)
- `error.generic.tryAgain` (1箇所)

**問題**: キー名の不一致
- 実際のキー: `error.generic.somethingWentWrong`
- 定義済みキー: `error.generic.somethingWentWrong` 

**原因**: ESLintがネストされたキーを正しく認識していない可能性

---

### 2. 認証バリデーション関連（5件）
**ファイル**: `foundation/utils/validationHelpers.ts`
- `auth.validation.password.required` (2箇所)
- `auth.validation.password.minLength` (2箇所)
- `auth.validation.password.pattern` (1箇所)

**問題**: auth.validation.passwordが既存のauth.validation.passwordと構造が異なる
- 必要: `auth.validation.password.{required|minLength|pattern}`
- 現在: `auth.validation.password.{mismatch}`

**解決方法**: auth.validation.passwordセクションを拡張する必要あり

---

### 3. 案件ステータス関連（3件）
**ファイル**: `modules/case/components/ui/CaseProgressIndicator.vue`
- `matter.status.mediation`
- `matter.status.court`
- `matter.status.resolved`

**問題**: matter.statusキーは追加済みだが、ESLintが認識していない
- 定義場所: `/i18n/locales/ja/matter.json`の4-8行目

**原因**: ビルドキャッシュまたはESLintキャッシュの問題の可能性

---

### 4. 期限アラート関連（6件）
**ファイル**: `modules/case/composables/useDueDateAlert.ts`
- `cases.dueDate.alert.daysLate` (1箇所)
- `cases.dueDate.alert.dueToday` (1箇所)
- `cases.dueDate.alert.urgent` (1箇所)
- `cases.dueDate.alert.daysRemaining` (2箇所)
- `cases.dueDate.alert.warning` (1箇所)

**問題**: cases.dueDate.alertに詳細なキーが不足
- 現在: 基本的なアラートメッセージのみ
- 必要: より詳細な状況別メッセージ

---

## 対応優先度

### 高優先度（実装必要）
1. **期限アラート関連** - 6件
   - 実際に使用されている詳細なメッセージが不足

2. **認証バリデーション関連** - 5件
   - パスワード検証で実際に必要なメッセージ

### 中優先度（確認必要）
3. **案件ステータス関連** - 3件
   - キーは存在するがESLintが認識していない
   - キャッシュクリアで解決する可能性

### 低優先度（誤検知の可能性）
4. **エラーメッセージ関連** - 3件
   - キーは正しく存在している
   - ESLintの設定または解析の問題の可能性

---

## 推奨アクション

1. **即座に対応可能**:
   - cases.dueDate.alertに詳細キーを追加
   - auth.validation.passwordを拡張

2. **調査が必要**:
   - ESLintキャッシュのクリア
   - i18n設定の再確認

3. **長期的対応**:
   - ESLintのi18nプラグイン設定の調整
   - 型定義の強化