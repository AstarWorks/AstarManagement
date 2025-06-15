# tasks-frontend-japanese

### フロントエンド MVPタスクリスト （Next.js + Bun + Tailwind + shadcn/ui）

---

#### 0. 環境セットアップ

* **0-1**: `bunx create-next-app` で `apps/web` 生成
* **0-2**: Tailwind CSS 設定 (`tailwind.config.ts`, `globals.css`)
* **0-3**: shadcn/ui インストール & ダークテーマ生成
* **0-4**: ESLint / Prettier / Husky プリセット適用
* **0-5**: Vitest・Playwright 初期化

---

#### 1. 認証 & RBAC

* **1-1**: NextAuth.js ＋ Keycloak OIDC Provider 組込み
* **1-2**: JWT から `roles` を抽出し React Context に注入
* **1-3**: RBAC HOC/Hook

    * `<Can roles={['LAWYER']}>...</Can>` 実装
* **1-4**: `/login` ページ（SSO リダイレクト）

---

#### 2. ルーティング & レイアウト

* **2-1**: Public Layout → `/login`
* **2-2**: Protected Layout → `/dashboard`, `/matters/[id]`
* **2-3**: グローバル Nav（サイドバー＋トップバー）
* **2-4**: ダークモードトグル & i18n 言語スイッチャ

---

#### 3. 進捗カンバン（Dashboard）

* **3-1**: カンバン列／カード UI（shadcn Card × React-DnD）
* **3-2**: GET `/matters` → 列データロード
* **3-3**: DnD 移動時 PATCH `/matters/{id}/stages`
* **3-4**: KPI バッジ・期日インジケータ表示

---

#### 4. Matter 作成 & 詳細ページ

* **4-1**: Matter 登録フォーム（react-hook-form＋Zod）
* **4-2**: 詳細タブ構成（Overview / Documents / Memo / Expenses）
* **4-3**: PATCH `/matters/{id}` 編集ダイアログ

---

#### 5. ドキュメント機能

* **5-1**: ファイルアップロード

    * POST `/documents` → PUT プリサインド URL
* **5-2**: PDF ビューア（`pdfjs-dist` Dynamic Import）
* **5-3**: ドキュメント一覧テーブル（Matter 内）

---

#### 6. メモ & 実費 UI

* **6-1**: メモ一覧＋新規モーダル (`/memos` CRUD)
* **6-2**: 実費テーブル＋追加ダイアログ (`/expenses` CRUD)
* **6-3**: CSV エクスポート（`papaparse`）

---

#### 7. 検索バー

* **7-1**: ヘッダーに全文検索入力
* **7-2**: GET `/search?q=` 呼び出し & 結果リスト
* **7-3**: 結果クリックで Matter / Document へナビゲート

---

#### 8. 通知 UI

* **8-1**: 通知ベル & 未読バッジ
* **8-2**: ドロップダウンリスト `/notifications`
* **8-3**: クリックで対象リソースにディープリンク

---

#### 9. i18n 基盤

* **9-1**: `next-intl` or `next-i18next` 導入
* **9-2**: ja / en JSON メッセージファイル作成
* **9-3**: Locale Switcher 組込み & ルーティング対応

---

#### 10. テスト

* **10-1**: Vitest ユニットテスト（RBAC Hook, Utils）
* **10-2**: Playwright Component Test（フォーム・カンバン）
* **10-3**: Playwright E2E:

    1. ログイン → 2. Matter 新規 → 3. 文書UP → 4. カンバン移動

---

#### 11. CI 連携

* **11-1**: GitHub Actions に `bun test` + Playwright headless 追加
* **11-2**: Lint / Prettier チェックジョブ
* **11-3**: `web` ビルド & アーティファクトアップロード

---

> **MVP 完了条件 (Front-end)**
> タスク 0〜8 が動作し、タスク 9〜11 の品質ゲートが CI でグリーンになること。
