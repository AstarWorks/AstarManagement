# 会計機能詳細設計

## 概要

弁護士事務所の会計処理を効率化する機能。預り金管理と月次収支報告のExcel出力を中心に、会計士への報告業務を簡素化します。

## 機能要件

### 1. 預り金管理

#### 1.1 基本機能
- 案件ごとに預り金を管理
- 受領・使用・返金の記録
- 残高の自動計算
- マイナス残高の警告

#### 1.2 預り金の流れ
```
1. 受領: クライアントから預り金を受け取る
2. 使用: 印紙代、交通費などで使用（実費として記録）
3. 精算: 残額を返金 or 追加請求
```

#### 1.3 データ構造
```yaml
預り金台帳:
  - 案件ID
  - 取引日
  - 取引種別: 受領/使用/返金
  - 金額
  - 摘要
  - 残高（自動計算）
  - 関連実費ID（使用の場合）
```

### 2. 月次収支報告（Excel出力）

#### 2.1 出力内容
```
【収入の部】
- 報酬収入（着手金、成功報酬、タイムチャージ等）
- 源泉徴収額
- 手取り額

【支出の部】
- 事務所経費
- 弁護士個人経費  
- 案件実費（クライアント請求分）
- 勘定科目別集計

【預り金の部】
- 案件別の受領・使用・残高一覧
- 預り金総残高

【源泉徴収一覧】
- 支払者別の源泉徴収明細
```

#### 2.2 集計軸
- 期間: 月次/四半期/年次
- 弁護士別
- 案件別
- 勘定科目別

### 3. 売掛金管理

#### 3.1 基本機能
- 請求済み未入金の管理
- 入金予定日の設定
- 督促アラート
- 回収率の計算

#### 3.2 表示項目
```yaml
売掛金一覧:
  - 請求書番号
  - 案件番号・案件名
  - クライアント名
  - 請求日
  - 請求額
  - 入金済額
  - 未収額
  - 経過日数
  - ステータス: 期限内/遅延/回収不能
```

## データモデル

### 預り金（deposits）
```sql
CREATE TABLE deposits (
    id VARCHAR(36) PRIMARY KEY,
    case_id VARCHAR(36) NOT NULL,
    transaction_date DATE NOT NULL,
    transaction_type VARCHAR(20) NOT NULL, -- 'received' / 'used' / 'refunded'
    amount DECIMAL(10, 0) NOT NULL,
    balance DECIMAL(10, 0) NOT NULL,
    description VARCHAR(200) NOT NULL,
    related_expense_id VARCHAR(36),
    created_by VARCHAR(36) NOT NULL,
    created_at TIMESTAMP NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (related_expense_id) REFERENCES expenses(id),
    FOREIGN KEY (created_by) REFERENCES users(id)
);
```

### 売掛金（receivables）
```sql
CREATE TABLE receivables (
    id VARCHAR(36) PRIMARY KEY,
    invoice_id VARCHAR(36) NOT NULL,
    case_id VARCHAR(36) NOT NULL,
    client_id VARCHAR(36) NOT NULL,
    invoice_date DATE NOT NULL,
    due_date DATE NOT NULL,
    total_amount DECIMAL(10, 0) NOT NULL,
    paid_amount DECIMAL(10, 0) NOT NULL DEFAULT 0,
    status VARCHAR(20) NOT NULL, -- 'pending' / 'partial' / 'paid' / 'overdue'
    last_reminder_date DATE,
    notes TEXT,
    created_at TIMESTAMP NOT NULL,
    updated_at TIMESTAMP NOT NULL,
    tenant_id VARCHAR(36) NOT NULL,
    FOREIGN KEY (invoice_id) REFERENCES invoices(id),
    FOREIGN KEY (case_id) REFERENCES cases(id),
    FOREIGN KEY (client_id) REFERENCES clients(id)
);
```

## 画面設計

### 1. 預り金管理画面

#### 1.1 一覧表示
- 案件別の預り金残高一覧
- 残高がマイナスの案件は赤字で強調
- クイック検索機能

#### 1.2 詳細画面
- 取引履歴の時系列表示
- 残高推移グラフ
- 実費との紐付け確認

#### 1.3 入力画面
```yaml
必須項目:
  - 案件選択
  - 取引種別
  - 金額
  - 取引日
  - 摘要

使用時の追加項目:
  - 実費選択（既存実費と紐付け）
  - または新規実費作成
```

### 2. 月次レポート画面

#### 2.1 レポート設定
- 対象期間選択
- 出力項目選択
- フィルター設定（弁護士、案件種別等）

#### 2.2 プレビュー
- Excel出力前の確認画面
- 集計値の表示
- グラフ表示（収支推移等）

#### 2.3 出力オプション
- Excel形式
- PDF形式（将来対応）
- メール送信機能（将来対応）

### 3. 売掛金管理画面

#### 3.1 ダッシュボード
- 売掛金総額
- 回収率
- 遅延件数・金額
- 月別推移グラフ

#### 3.2 一覧表示
- ソート: 金額順/経過日数順/クライアント順
- フィルター: ステータス/期間/担当弁護士
- 一括操作: 督促メール送信等

## Excel出力仕様

### シート構成
```
1. サマリー: 全体集計
2. 収入明細: 報酬収入の詳細
3. 支出明細: 経費の詳細  
4. 預り金: 案件別預り金状況
5. 源泉徴収: 源泉徴収の明細
6. 売掛金: 未回収の請求一覧
```

### フォーマット
- ヘッダー行の固定
- 金額は3桁カンマ区切り
- 小計・合計行の自動計算
- 条件付き書式（マイナス値は赤字等）

## 通知・アラート

### 1. 預り金アラート
- 残高不足警告
- 長期間動きがない預り金の確認

### 2. 売掛金アラート  
- 支払期限前リマインド
- 支払遅延通知
- 回収不能リスク警告

### 3. 月次締めリマインド
- 月末の経費入力促進
- レポート作成リマインド

## 今後の拡張予定

### Phase 2
- 会計ソフト連携（freee、マネーフォワード）
- 自動仕訳生成
- 銀行口座連携

### Phase 3
- インボイス制度対応
- 電子帳簿保存法対応
- AIによる勘定科目提案