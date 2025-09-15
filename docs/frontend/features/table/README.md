# テーブルビュー機能

## 概要

カンバン、テーブル、ギャラリーなど、柔軟なデータ表示を実現するビューシステム。
Notionライクな切り替え可能なビューで、同じデータを様々な角度から表示。

## 実装済み機能

### ビュータイプ
- **テーブルビュー**: スプレッドシート形式の表示
- **カンバンビュー**: Trelloスタイルのカード表示
- **ギャラリービュー**: カード形式のグリッド表示（計画中）

### 編集機能
- **インライン編集**: セルを直接編集して即座に保存
- **ドラッグ&ドロップ**: カンバンでカードを移動
- **バッチ編集**: 複数レコードの一括更新

### データ操作
- **フィルタリング**: 複雑な条件での絞り込み
- **ソート**: 複数カラムでの並び替え
- **グループ化**: データを様々な軸でグループ化
- **検索**: 全文検索とカラム別検索

### UI/UX
- **列のピン留め**: 重要な列を左右に固定
- **列の表示/非表示**: 必要な列のみ表示
- **列のリサイズ**: ドラッグで列幅調整
- **無限スクロール**: 大量データの効率的な表示

## 技術スタック

- **Vue 3**: Composition API
- **TanStack Table**: テーブル処理
- **shadcn-vue**: UIコンポーネント
- **VueUse**: ユーティリティComposables

## アーキテクチャ

### コンポーネント構成
```
table/
├── views/               # ビューコンポーネント
│   ├── TableView.vue
│   ├── KanbanView.vue
│   └── GalleryView.vue
├── cells/              # セルレンダラー
│   ├── TextCell.vue
│   ├── NumberCell.vue
│   ├── SelectCell.vue
│   ├── DateCell.vue
│   └── UserCell.vue
├── filters/            # フィルター
│   ├── FilterBuilder.vue
│   └── FilterPopover.vue
└── toolbar/            # ツールバー
    ├── ViewSwitcher.vue
    ├── ColumnToggle.vue
    └── SortControl.vue
```

### 状態管理
Composablesパターンによる状態管理:
- `useTableList`: テーブル一覧管理
- `useRecordList`: レコード一覧管理
- `useTableDetail`: テーブル詳細管理
- `useTableViewMode`: ビューモード管理

詳細は以下のドキュメントを参照:
- [コンポーネント設計](./components.md)
- [状態管理](./state.md)
- [ビュー実装](./views.md)