# 書類作成サポート機能詳細設計

## 概要

VSCode風の軽量エディターで法的書類を効率的に作成。Markdown形式で管理し、テンプレート・変数埋め込み・AIアシスタントで作成を支援します。

## 機能要件

### 1. VSCode風エディター

#### 1.1 画面構成
```
┌─────────────┬─────────────────────────┬──────────────┐
│ ファイル     │  エディター              │ AIアシスタント│
│ ツリー      │  (Markdown)             │  (チャット)   │
│             │                         │              │
│ 📁 2024-001 │ # 訴状                   │ Q: この段落の │
│  ├─ 訴状.md │                         │    表現を...  │
│  ├─ 答弁書  │ 原告 {{clientName}}      │              │
│  └─ 準備書面│ 被告 {{opponentName}}    │ A: 以下のよう │
│             │                         │    に修正... │
└─────────────┴─────────────────────────┴──────────────┘
```

#### 1.2 エディター機能
- Markdownシンタックスハイライト
- リアルタイムプレビュー（切り替え可能）
- 変数の自動補完
- 検索・置換（Ctrl+F / Ctrl+H）
- 複数ファイルの横断検索
- Undo/Redo履歴管理
- 自動保存

#### 1.3 ファイル管理
- 案件ごとのフォルダー構造
- ドラッグ&ドロップでファイル移動
- 右クリックメニュー（新規作成、複製、削除）
- ファイル名の変更

### 2. テンプレート機能

#### 2.1 システムテンプレート
```yaml
訴状:
  - 通常訴状
  - 少額訴訟
  - 労働審判申立書

答弁書:
  - 一般答弁書
  - 認否のみ答弁書

準備書面:
  - 標準準備書面
  - 最終準備書面

内容証明:
  - 債権回収
  - 解雇通知
  - 契約解除

契約書:
  - 売買契約書
  - 業務委託契約書
  - 秘密保持契約書
```

#### 2.2 カスタムテンプレート
- ユーザーが作成・保存
- カテゴリー分類
- 共有設定（個人/事務所全体）

### 3. 変数システム

#### 3.1 システム変数
```
{{caseNumber}}      - 案件番号
{{caseTitle}}       - 案件名
{{clientName}}      - 依頼者名
{{clientAddress}}   - 依頼者住所
{{opponentName}}    - 相手方名
{{opponentAddress}} - 相手方住所
{{courtName}}       - 裁判所名
{{judgeName}}       - 裁判官名
{{nextHearingDate}} - 次回期日
{{lawyerName}}      - 担当弁護士名
{{lawFirmName}}     - 事務所名
{{today}}          - 本日日付
```

#### 3.2 カスタム変数
- 書類ごとに定義可能
- 入力フォームで値を設定
- デフォルト値の設定

### 4. AIアシスタント

#### 4.1 基本機能
- 選択テキストについての質問
- 文章の改善提案
- 法的表現への変換
- 誤字脱字チェック

#### 4.2 使用例
```
ユーザー: 「この段落をもっと強い表現にしてください」
AI: 「以下のように修正することを提案します：
『被告の行為は、明らかに〜』→『被告の行為は、著しく信義則に反し〜』」

ユーザー: 「消滅時効の条文を教えて」
AI: 「民法166条1項により、債権は次に掲げる期間の経過によって時効消滅します...」
```

### 5. エクスポート機能

#### 5.1 PDF出力
```yaml
設定項目:
  - 用紙サイズ: A4/B4/A3
  - 余白: 上下左右の設定
  - フォント: 明朝体/ゴシック体
  - フォントサイズ: 10.5pt/12pt
  - 行間: 1.5倍/2倍
  - ページ番号: 位置と形式
  - ヘッダー/フッター: カスタムテキスト
```

#### 5.2 Word出力
- 見出しスタイルの維持
- 段落スタイルの設定
- ページ設定の保持
- 変更履歴なし（クリーンな文書）

## データモデル

### 書類（documents）
```sql
CREATE TABLE legal_documents (
    id VARCHAR(36) PRIMARY KEY,
    case_id VARCHAR(36) NOT NULL,
    title VARCHAR(200) NOT NULL,
    content TEXT NOT NULL,
    file_path VARCHAR(500) NOT NULL,
    document_type VARCHAR(50),
    template_id VARCHAR(36),
    variables JSON,
    version INTEGER NOT NULL DEFAULT 1,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (template_id) REFERENCES document_templates(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 書類バージョン（document_versions）
```sql
CREATE TABLE document_versions (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    version INTEGER NOT NULL,
    content TEXT NOT NULL,
    variables JSON,
    change_summary VARCHAR(500),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    FOREIGN KEY (document_id) REFERENCES legal_documents(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### AIチャット履歴（ai_chat_history）
```sql
CREATE TABLE ai_chat_history (
    id VARCHAR(36) PRIMARY KEY,
    document_id VARCHAR(36) NOT NULL,
    user_message TEXT NOT NULL,
    ai_response TEXT NOT NULL,
    selected_text TEXT,
    applied BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (document_id) REFERENCES legal_documents(id)
);
```

## 画面設計

### 1. メインエディター画面

#### 1.1 ツールバー
- 新規作成
- テンプレートから作成
- 保存（Ctrl+S）
- エクスポート（PDF/Word）
- プレビュー切り替え
- AIアシスタント表示切り替え

#### 1.2 エディターエリア
- 行番号表示
- 変数のハイライト表示（青色）
- Markdown記法のハイライト
- 変数の自動補完ポップアップ

#### 1.3 ステータスバー
- 文字数/行数
- 保存状態
- エンコーディング
- カーソル位置

### 2. テンプレート選択画面

#### 2.1 カテゴリー別表示
- システムテンプレート
- 個人テンプレート
- 共有テンプレート
- 最近使用したテンプレート

#### 2.2 プレビュー
- テンプレートの内容プレビュー
- 必要な変数一覧
- 使用回数・最終使用日

### 3. 変数入力画面

#### 3.1 変数入力フォーム
- 必須変数の表示
- デフォルト値の表示
- 案件情報からの自動入力
- バリデーション

### 4. エクスポート設定画面

#### 4.1 PDF設定
- レイアウト設定
- スタイル設定
- プレビュー表示

#### 4.2 Word設定
- テンプレート選択
- スタイルマッピング

## 検索機能

### 1. ファイル内検索
- 正規表現対応
- 大文字小文字の区別
- 単語単位の検索

### 2. 横断検索
- 案件内の全書類を検索
- 検索結果のハイライト表示
- ファイルへのジャンプ

### 3. 変数の使用状況検索
- 特定の変数を使用している書類一覧
- 変数の値で検索

## キーボードショートカット

```
Ctrl+S        - 保存
Ctrl+Shift+S  - 名前を付けて保存
Ctrl+P        - クイックオープン
Ctrl+F        - 検索
Ctrl+H        - 置換
Ctrl+Shift+F  - 横断検索
Ctrl+Space    - 変数補完
Ctrl+Enter    - プレビュー切り替え
Ctrl+Shift+P  - コマンドパレット
```

## 今後の拡張予定

### Phase 2
- 音声入力対応
- 手書きメモ取り込み
- OCRでの既存書類取り込み

### Phase 3
- 条文の自動引用
- 判例検索・引用
- 類似書類の自動提案
- 多言語対応（英文契約書等）