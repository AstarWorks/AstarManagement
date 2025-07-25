# 報酬管理機能詳細設計

## 概要

弁護士と会計士のやり取りをスムーズにすることを第一目的とした報酬・経費管理機能。スマホで簡単に実費を記録し、月末の会計処理を効率化します。

## 機能要件

### 1. 実費メモ機能（最優先）

#### 1.1 基本機能
- スマホから簡単に実費を記録
- 領収書の写真撮影・添付
- 案件への紐付け
- 後でまとめて依頼者に請求

#### 1.2 入力項目
```yaml
必須項目:
  - 日付: 支出日
  - 金額: 支出額
  - 摘要: 簡単な説明（例：タクシー代、印紙代）
  - 案件: 紐付ける案件（選択式）
  
任意項目:
  - 領収書写真: カメラ撮影 or ファイル選択
  - 支払方法: 現金/クレジット/立替
  - メモ: 詳細な説明
```

#### 1.3 使用シナリオ
1. 裁判所へのタクシー移動中にスマホで記録
2. 「タクシー代」「1,200円」を入力
3. 領収書を撮影
4. 案件を選択して保存
5. 月末に案件ごとにまとめて請求書に反映

### 2. 経費メモ機能（会計士向け）

#### 2.1 基本機能
- 事務所経費の記録
- 勘定科目の自動提案
- 月次でCSVエクスポート
- 会計士が求める形式で出力

#### 2.2 入力項目
```yaml
必須項目:
  - 日付: 支出日
  - 金額: 支出額
  - 勘定科目: プルダウン選択
  - 摘要: 説明

任意項目:
  - 領収書写真: 証憑として
  - 支払方法: 現金/クレジット/振込
  - 源泉徴収: あり/なし
  - 消費税区分: 10%/8%/非課税
```

#### 2.3 勘定科目（個人事業主向け）
```yaml
収入系:
  - 売上高（報酬）
  - 雑収入

経費系:
  - 仕入高
  - 給料賃金
  - 外注工賃
  - 減価償却費
  - 貸倒金
  - 地代家賃
  - 利子割引料
  - 租税公課
  - 荷造運賃
  - 水道光熱費
  - 旅費交通費
  - 通信費
  - 広告宣伝費
  - 接待交際費
  - 損害保険料
  - 修繕費
  - 消耗品費
  - 福利厚生費
  - 雑費
```

### 3. 報酬設定機能

#### 3.1 案件ごとの報酬設定
```yaml
着手金:
  - 金額: 固定額
  - 源泉徴収: あり/なし
  - 支払予定日: 日付

成功報酬:
  - 計算方法: 固定額/料率
  - 料率: パーセンテージ
  - 最低報酬額: 下限設定
  - 源泉徴収: あり/なし

タイムチャージ:
  - 時間単価: 1時間あたり
  - 最小単位: 30分/1時間

実費:
  - 請求方法: 実費/定額
  - マージン: 0〜20%
```

#### 3.2 源泉徴収の扱い
- クライアントタイプ（個人/法人）で自動判定はせず、案件ごとに設定
- デフォルト値は設定可能
- 源泉徴収率: 10.21%（復興特別所得税含む）

### 4. 見積書・請求書生成

#### 4.1 見積書
- テンプレートベース
- 着手金、成功報酬（見込み）、実費（概算）を記載
- PDF出力

#### 4.2 請求書
- 実際の報酬額を反映
- 実費明細を添付可能
- 源泉徴収額を自動計算・表示
- 振込先情報を含む

## データモデル

### 実費（expenses）
```sql
CREATE TABLE expenses (
    id VARCHAR(36) PRIMARY KEY,
    case_id VARCHAR(36) NOT NULL,
    date DATE NOT NULL,
    amount DECIMAL(10, 0) NOT NULL,
    description VARCHAR(200) NOT NULL,
    receipt_url VARCHAR(500),
    payment_method VARCHAR(20),
    memo TEXT,
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 経費（business_expenses）
```sql
CREATE TABLE business_expenses (
    id VARCHAR(36) PRIMARY KEY,
    expense_type VARCHAR(20) NOT NULL, -- 'office' / 'personal' / 'case'
    case_id VARCHAR(36), -- 案件実費の場合のみ
    lawyer_id VARCHAR(36), -- 個人経費・案件実費の場合
    date DATE NOT NULL,
    amount DECIMAL(10, 0) NOT NULL,
    account_code VARCHAR(50) NOT NULL,
    description VARCHAR(200) NOT NULL,
    receipt_url VARCHAR(500),
    payment_method VARCHAR(20),
    has_withholding BOOLEAN DEFAULT FALSE,
    withholding_amount DECIMAL(10, 0),
    tax_rate DECIMAL(4, 2),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (lawyer_id) REFERENCES users(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 勘定科目マスタ（account_codes）
```sql
CREATE TABLE account_codes (
    id VARCHAR(36) PRIMARY KEY,
    code VARCHAR(50) NOT NULL,
    name VARCHAR(100) NOT NULL,
    category VARCHAR(20) NOT NULL, -- 'income' / 'expense'
    is_default BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    display_order INTEGER,
    created_at TIMESTAMP NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    UNIQUE KEY unique_code_per_tenant (code, tenant_id)
);
```

### 報酬設定（fee_settings）
```sql
CREATE TABLE fee_settings (
    id VARCHAR(36) PRIMARY KEY,
    case_id VARCHAR(36) NOT NULL UNIQUE,
    retainer_fee DECIMAL(10, 0),
    retainer_withholding BOOLEAN DEFAULT FALSE,
    retainer_paid_date DATE,
    success_fee_type VARCHAR(20), -- 'fixed' or 'rate'
    success_fee_amount DECIMAL(10, 0),
    success_fee_rate DECIMAL(5, 2),
    success_fee_minimum DECIMAL(10, 0),
    success_withholding BOOLEAN DEFAULT FALSE,
    hourly_rate DECIMAL(10, 0),
    hourly_unit INTEGER, -- minutes
    expense_markup DECIMAL(5, 2) DEFAULT 0,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id)
);
```

### 請求書（invoices）
```sql
CREATE TABLE invoices (
    id VARCHAR(36) PRIMARY KEY,
    invoice_number VARCHAR(20) NOT NULL,
    case_id VARCHAR(36) NOT NULL,
    issue_date DATE NOT NULL,
    due_date DATE NOT NULL,
    subtotal DECIMAL(10, 0) NOT NULL,
    tax_amount DECIMAL(10, 0) NOT NULL,
    withholding_amount DECIMAL(10, 0),
    total_amount DECIMAL(10, 0) NOT NULL,
    status VARCHAR(20) NOT NULL, -- draft/sent/paid/overdue
    payment_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id)
);
```

## 画面設計

### 1. 実費入力画面（スマホ最適化）
- 大きな入力フィールド
- カメラ起動ボタン
- よく使う項目のクイック選択
- 音声入力対応

### 2. 経費一覧・入力画面
- カレンダービュー
- 勘定科目別集計
- 領収書画像のサムネイル表示

### 3. 月次レポート画面
- 勘定科目別集計表
- グラフ表示
- CSVエクスポートボタン
- 会計士向けメモ欄

### 4. 報酬設定画面
- 案件詳細画面のタブとして実装
- 着手金、成功報酬の設定
- 源泉徴収のON/OFF

## 今後の拡張予定

1. **自動仕訳機能**
   - AIによる勘定科目の自動提案
   - 過去のパターンから学習

2. **会計ソフト連携**
   - freee、マネーフォワードへの直接連携
   - 仕訳データの自動同期

3. **レシート OCR**
   - 領収書から金額・日付を自動抽出
   - 店名から勘定科目を推測

4. **承認フロー**
   - 一定額以上の経費は承認必要
   - パートナー弁護士による承認