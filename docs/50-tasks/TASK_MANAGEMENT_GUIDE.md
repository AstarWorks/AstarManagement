# Astar Management - タスク管理ガイド

## 📋 タスク管理システム概要

このプロジェクトでは、GitHub Issues風のタスク管理システムを採用しています。各タスクは詳細な情報と明確な完了条件を持ち、品質と進捗の可視性を確保します。

## 🏷️ タスクラベリング規則

### 優先度ラベル
- **Critical**: システムの基本機能、セキュリティに関わる重要タスク
- **High**: 主要機能、ユーザー価値に直結するタスク
- **Medium**: 改善、最適化に関するタスク
- **Low**: Nice-to-have機能、技術的改善

### カテゴリラベル
- **backend**: Spring Boot/Kotlin関連のタスク
- **frontend**: Nuxt.js/Vue関連のタスク
- **infrastructure**: Docker、Kubernetes、デプロイ関連
- **documentation**: ドキュメント作成・更新
- **testing**: テスト実装・改善
- **security**: セキュリティ関連の実装・監査

### ドメインラベル
- **auth**: 認証・認可機能
- **matter**: 事件管理機能
- **expense**: 実費・経費管理
- **accounting**: 会計・経理機能
- **document**: 書類作成・管理
- **dashboard**: ダッシュボード・レポート

### サイズ見積もり
- **Small (1-2日)**: 単純なCRUD、基本UI実装
- **Medium (3-5日)**: 複雑なビジネスロジック、統合機能
- **Large (1-2週間)**: 大規模機能、アーキテクチャ変更

## 📝 タスク作成テンプレート

```markdown
#### 🏷️ TASK-XXX: タスクタイトル
- **優先度**: Critical/High/Medium/Low
- **見積もり**: Small/Medium/Large
- **担当者**: 未定/名前
- **Status**: Todo/In Progress/Review/Done
- **関連ドキュメント**: [設計書へのリンク]
- **説明**: 
  - タスクの詳細説明
  - 実装すべき内容
  - 技術的考慮事項
- **Definition of Done**:
  - [ ] 具体的な完了条件1
  - [ ] 具体的な完了条件2
  - [ ] テスト作成・実行
  - [ ] コードレビュー完了
```

## 🔄 タスクライフサイクル

### ステータス管理
1. **Todo**: タスク作成済み、着手待ち
2. **In Progress**: 作業中
3. **Review**: 実装完了、レビュー待ち
4. **Done**: 完了、本番デプロイ済み

### タスク移行条件
- **Todo → In Progress**: 担当者決定、作業開始
- **In Progress → Review**: 実装完了、プルリクエスト作成
- **Review → Done**: コードレビュー承認、マージ完了
- **Review → In Progress**: 修正要求、再作業

## 🎯 Sprint管理

### Sprint期間
- **標準期間**: 2週間
- **Sprint開始**: 月曜日
- **Sprint終了**: 隔週金曜日

### Sprint儀式
1. **Sprint Planning**: Sprint開始時のタスク選択・見積もり
2. **Daily Standup**: 毎日の進捗共有（必要に応じて）
3. **Sprint Review**: Sprint終了時のデモ・振り返り
4. **Sprint Retrospective**: 改善点の洗い出し

## 📊 進捗追跡

### 進捗指標
- **Sprint Velocity**: Sprint毎の完了タスク数
- **Burndown**: 残タスク数の推移
- **完了率**: カテゴリ別・ドメイン別完了率

### レポート頻度
- **毎日**: 個人の進捗更新
- **週次**: Sprint進捗レポート
- **Sprint終了時**: Sprint振り返りレポート

## 🔍 品質ゲート

### タスク完了前チェックリスト
- [ ] 機能要件を満たしている
- [ ] 非機能要件（パフォーマンス・セキュリティ）を満たしている
- [ ] テストが作成され、すべて通過している
- [ ] コードレビューが完了している
- [ ] ドキュメントが更新されている
- [ ] CI/CDパイプラインが通過している

### コード品質基準
- **テストカバレッジ**: 90%以上
- **セキュリティ**: OWASP依存関係チェック通過
- **TypeScript**: strict mode、any型禁止
- **コードスタイル**: ESLint、Ktlint通過

## 🛠️ ツール連携

### GitHub連携
- タスクはGitHub Issuesと同期可能
- プルリクエストでタスクを自動クローズ
- ラベルによる自動分類

### Simone連携
- タスクの自動進捗更新
- 品質ゲート自動チェック
- レポート自動生成

## 📋 タスクファイル構成

```
docs/50-tasks/
├── PRIORITIZED_TASKS.md    # 全体タスクリスト
├── CURRENT_SPRINT.md       # 現在のSprint
├── TASK_MANAGEMENT_GUIDE.md # このファイル
├── sprints/
│   ├── sprint-001.md       # 過去のSprint記録
│   ├── sprint-002.md
│   └── ...
└── templates/
    ├── task-template.md    # タスクテンプレート
    └── sprint-template.md  # Sprintテンプレート
```

## 🚀 開始方法

1. **現在のSprint確認**: `CURRENT_SPRINT.md`を確認
2. **タスク選択**: 優先度と見積もりに基づいてタスクを選択
3. **ステータス更新**: 選択したタスクを"In Progress"に変更
4. **作業開始**: 設計ドキュメントを参照して実装開始
5. **完了報告**: Definition of Doneに基づいて完了報告

## 💡 ベストプラクティス

### タスク分割
- 1タスクは最大2週間以内に完了できるサイズ
- 依存関係を明確にして、並行作業を可能にする
- フロントエンド・バックエンドのタスクを分離

### コミュニケーション
- タスク進捗は毎日更新
- ブロッカーは即座に報告
- 完了時はデモンストレーション実施

### 継続的改善
- Sprint毎に振り返りを実施
- 見積もり精度を向上させる
- プロセス改善提案を積極的に行う