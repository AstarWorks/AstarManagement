# 機能別仕様書

このディレクトリには、汎用ビジネス管理プラットフォームの各機能の詳細設計書が含まれています。

## 📋 コア機能一覧

### [project-management/](./project-management/) - プロジェクト管理機能
プロジェクトのワークフロー管理、進捗可視化（カンバン + テーブル）

### [expense-management/](./expense-management/) - 経費管理機能  
経費の入力、管理、集計、財務追跡機能（旧: expense-input）

### [client-management/](./client-management/) - 顧客管理機能
顧客情報の管理、リレーション追跡、CRM機能

### [document-management/](./document-management/) - 文書管理機能
階層型Markdownドキュメント、変数システム、AIエージェント統合

各機能の設計内容:
- 要件定義（汎用仕様）
- データモデル設計  
- API仕様
- UI/UX設計（Notion + Obsidian風）
- テンプレート適用例
- 実装優先順位

## 🎯 機能開発ガイドライン

### 新機能追加時の文書構成
```
feature-name/
├── README.md                    # 機能概要とインデックス
├── requirements.md              # 要件定義
├── data-model.md               # データモデル
├── api-specification.md        # API仕様
├── ui-design.md                # UI設計
├── component-design.md         # コンポーネント設計
├── implementation-priority.md   # 実装優先順位
└── type-definitions.md         # TypeScript型定義
```

### 設計プロセス
1. **要件定義** - ビジネス要件と機能要件の明確化
2. **データ設計** - エンティティとリレーションの定義
3. **API設計** - エンドポイントとデータフローの設計
4. **UI設計** - ユーザーインターフェースとUXの設計
5. **実装計画** - 段階的なリリース計画

## 🔄 開発フェーズ

### Phase 1 (MVP) - 優先実装
- **プロジェクト管理** - カンバン & テーブル形式でのワークフロー管理
- **経費管理** - テーブル形式での財務管理、時間・コスト追跡

### Phase 2 - 拡張機能  
- **顧客管理** - テーブル形式でのリレーション管理、CRM機能
- **文書管理** - 階層型Markdownドキュメント、変数システム

### テンプレート展開
- **法律事務所テンプレート** (最初の実装)
- **司法書士テンプレート** (Phase 2)
- **物流業界テンプレート** (Phase 3)
- **不動産管理テンプレート** (Phase 4)

## 🔗 関連ドキュメント
- [API仕様](../01-api-specifications/)
- [データベース設計](../03-database-design/)
- [システム設計](../05-system-design/)