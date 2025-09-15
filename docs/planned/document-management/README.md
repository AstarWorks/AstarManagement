# ドキュメント管理機能（計画）

## 概要

Markdownベースの階層型ドキュメント管理システム。Obsidianライクなファイルシステムベースで、変数システムとバージョニングをサポート予定。

## 計画されている機能

### コア機能
- **Markdownエディタ**: リアルタイムプレビュー、シンタックスハイライト
- **階層型フォルダ構造**: ドラッグ&ドロップでのファイル整理
- **変数システム**: グローバル/プロジェクト/ドキュメント変数
- **バージョン管理**: 変更履歴と復元機能
- **相互リンク**: Wiki形式のリンク（`[[document-name]]`）

### エディタ機能
- **WYSIWYG編集**: マークダウンの知識不要
- **コードブロック**: シンタックスハイライト対応
- **テーブル編集**: GUIでのテーブル作成
- **画像管理**: ドラッグ&ドロップでの画像挿入
- **数式対応**: LaTeX形式の数式レンダリング

### 変数システム
```markdown
# 契約書

契約者: {{client_name}}
契約日: {{contract_date}}
金額: {{amount}}円
```

変数スコープ:
- **グローバル変数**: 組織全体で共有
- **プロジェクト変数**: プロジェクト固有
- **ドキュメント変数**: ドキュメント固有

### エクスポート機能
- PDF出力
- Word (.docx) 出力
- HTML出力
- Markdown（変数展開済み）

## 技術設計案

### バックエンド
```kotlin
// ドメインモデル
data class Document(
    val id: DocumentId,
    val folderId: FolderId,
    val filename: String,
    val content: String,  // Markdown
    val metadata: Map<String, Any>,
    val version: Int,
    val createdAt: Instant,
    val updatedAt: Instant
)

data class Folder(
    val id: FolderId,
    val workspaceId: WorkspaceId,
    val parentId: FolderId?,
    val name: String,
    val path: String,  // /root/projects/project1
    val permissions: Map<RoleId, Permission>
)

data class Variable(
    val id: VariableId,
    val name: String,
    val value: String,
    val scope: VariableScope,
    val scopeId: UUID?  // プロジェクトIDまたはドキュメントID
)

enum class VariableScope {
    GLOBAL,
    PROJECT,
    DOCUMENT
}
```

### フロントエンド
```vue
<!-- エディタコンポーネント -->
<template>
  <div class="document-editor">
    <EditorToolbar
      @format="applyFormat"
      @insert="insertElement"
    />
    
    <div class="editor-container">
      <MonacoEditor
        v-if="!splitView"
        v-model="content"
        language="markdown"
        :options="editorOptions"
      />
      
      <div v-else class="split-view">
        <MonacoEditor
          v-model="content"
          class="w-1/2"
        />
        <MarkdownPreview
          :content="processedContent"
          class="w-1/2"
        />
      </div>
    </div>
    
    <VariablePanel
      v-if="showVariables"
      :variables="variables"
      @insert="insertVariable"
    />
  </div>
</template>
```

### ストレージ
- **ファイルシステム**: S3/MinIO
- **メタデータ**: PostgreSQL
- **全文検索**: Elasticsearch

## 実装優先度

### Phase 1（MVP）
1. 基本的なMarkdownエディタ
2. フォルダ構造
3. ファイルのCRUD操作

### Phase 2
1. 変数システム
2. リアルタイムプレビュー
3. バージョン管理

### Phase 3
1. エクスポート機能
2. 全文検索
3. コラボレーション編集

## 競合製品との差別化

| 機能 | Astar | Notion | Obsidian | Google Docs |
|------|-------|--------|----------|-------------|
| Markdown編集 | ✅ | ✅ | ✅ | ❌ |
| 変数システム | ✅ | ❌ | 部分的 | ❌ |
| ローカルファースト | ✅ | ❌ | ✅ | ❌ |
| リアルタイムコラボ | ✅ | ✅ | ❌ | ✅ |
| AIアシスト | ✅ | 部分的 | プラグイン | 部分的 |
| 業界テンプレート | ✅ | 部分的 | ❌ | ❌ |

## 実装に向けた課題

1. **Markdownパーサー選定**
   - markdown-it
   - remark
   - unified

2. **エディタライブラリ**
   - Monaco Editor（VSCode）
   - CodeMirror
   - TipTap

3. **リアルタイム同期**
   - CRDT（Conflict-free Replicated Data Type）
   - Operational Transformation
   - WebSocket/WebRTC

4. **ファイルストレージ**
   - 大容量ファイル対応
   - CDN配信
   - バージョニング

## ユースケース

### 法律事務所での利用
- 契約書テンプレート管理
- 訴状・準備書面作成
- 判例・法令データベース連携

### 一般企業での利用
- 議事録作成
- プロジェクトドキュメント
- 社内Wiki
- マニュアル管理