# ドキュメント管理機能 - 詳細設計

## アーキテクチャ設計

### システム構成
```
┌─────────────────────────────────────────────┐
│              フロントエンド                   │
│  ┌─────────────┐  ┌─────────────┐         │
│  │   Editor    │  │   Preview    │         │
│  │  Component  │  │  Component   │         │
│  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│              バックエンド                     │
│  ┌─────────────┐  ┌─────────────┐         │
│  │  Document   │  │  Variable    │         │
│  │   Service   │  │   Service    │         │
│  └─────────────┘  └─────────────┘         │
└─────────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────────┐
│              ストレージ層                     │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐│
│  │PostgreSQL│  │  MinIO   │  │  Redis   ││
│  │(Metadata)│  │ (Files)  │  │ (Cache)  ││
│  └──────────┘  └──────────┘  └──────────┘│
└─────────────────────────────────────────────┘
```

## データベース設計

### folders テーブル
```sql
CREATE TABLE folders (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    parent_id UUID,
    name VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,  -- /root/projects/project1
    description TEXT,
    permissions JSONB DEFAULT '{}',
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_folders_workspace 
        FOREIGN KEY (workspace_id) 
        REFERENCES workspaces(id) ON DELETE CASCADE,
    
    CONSTRAINT fk_folders_parent 
        FOREIGN KEY (parent_id) 
        REFERENCES folders(id) ON DELETE CASCADE,
    
    CONSTRAINT uk_folders_path 
        UNIQUE (workspace_id, path)
);
```

### documents テーブル
```sql
CREATE TABLE documents (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    folder_id UUID NOT NULL,
    filename VARCHAR(255) NOT NULL,
    path TEXT NOT NULL,  -- /root/projects/project1/readme.md
    content_url TEXT,    -- S3/MinIO URL
    mime_type VARCHAR(100) DEFAULT 'text/markdown',
    size BIGINT DEFAULT 0,
    metadata JSONB DEFAULT '{}',
    created_by UUID,
    updated_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_documents_folder 
        FOREIGN KEY (folder_id) 
        REFERENCES folders(id) ON DELETE CASCADE,
    
    CONSTRAINT uk_documents_path 
        UNIQUE (folder_id, filename)
);
```

### document_versions テーブル
```sql
CREATE TABLE document_versions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    document_id UUID NOT NULL,
    version INTEGER NOT NULL,
    content_url TEXT NOT NULL,
    size BIGINT NOT NULL,
    change_message TEXT,
    created_by UUID,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_versions_document 
        FOREIGN KEY (document_id) 
        REFERENCES documents(id) ON DELETE CASCADE,
    
    CONSTRAINT uk_versions_document_version 
        UNIQUE (document_id, version)
);
```

### variables テーブル
```sql
CREATE TABLE variables (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    workspace_id UUID NOT NULL,
    name VARCHAR(255) NOT NULL,
    value TEXT NOT NULL,
    scope VARCHAR(50) NOT NULL, -- GLOBAL, PROJECT, DOCUMENT
    scope_id UUID,  -- プロジェクトIDまたはドキュメントID
    description TEXT,
    created_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    
    CONSTRAINT fk_variables_workspace 
        FOREIGN KEY (workspace_id) 
        REFERENCES workspaces(id) ON DELETE CASCADE,
    
    CONSTRAINT uk_variables_name_scope 
        UNIQUE (workspace_id, name, scope, scope_id)
);
```

## API設計

### ドキュメント操作
```yaml
# フォルダ操作
GET    /api/v1/workspaces/{workspaceId}/folders
POST   /api/v1/workspaces/{workspaceId}/folders
GET    /api/v1/folders/{folderId}
PUT    /api/v1/folders/{folderId}
DELETE /api/v1/folders/{folderId}
POST   /api/v1/folders/{folderId}/move

# ドキュメント操作
GET    /api/v1/folders/{folderId}/documents
POST   /api/v1/folders/{folderId}/documents
GET    /api/v1/documents/{documentId}
PUT    /api/v1/documents/{documentId}
DELETE /api/v1/documents/{documentId}
POST   /api/v1/documents/{documentId}/duplicate

# バージョン管理
GET    /api/v1/documents/{documentId}/versions
GET    /api/v1/documents/{documentId}/versions/{version}
POST   /api/v1/documents/{documentId}/restore/{version}
GET    /api/v1/documents/{documentId}/diff

# 変数管理
GET    /api/v1/workspaces/{workspaceId}/variables
POST   /api/v1/workspaces/{workspaceId}/variables
PUT    /api/v1/variables/{variableId}
DELETE /api/v1/variables/{variableId}
POST   /api/v1/documents/{documentId}/process-variables

# エクスポート
POST   /api/v1/documents/{documentId}/export/pdf
POST   /api/v1/documents/{documentId}/export/docx
POST   /api/v1/documents/{documentId}/export/html
```

## フロントエンド設計

### コンポーネント構成
```
DocumentManager/
├── FileTree/
│   ├── TreeNode.vue
│   ├── TreeFolder.vue
│   └── TreeFile.vue
├── Editor/
│   ├── MarkdownEditor.vue
│   ├── EditorToolbar.vue
│   ├── VariablePanel.vue
│   └── FormatButtons.vue
├── Preview/
│   ├── MarkdownPreview.vue
│   └── PreviewSettings.vue
├── Dialogs/
│   ├── CreateDocumentDialog.vue
│   ├── CreateFolderDialog.vue
│   ├── MoveDialog.vue
│   └── ExportDialog.vue
└── Variables/
    ├── VariableList.vue
    ├── VariableEditor.vue
    └── VariableInserter.vue
```

### 状態管理
```typescript
// stores/document.ts
export const useDocumentStore = defineStore('document', () => {
  const currentDocument = ref<Document | null>(null)
  const folders = ref<Folder[]>([])
  const variables = ref<Variable[]>([])
  const isDirty = ref(false)
  
  async function loadDocument(id: string) {
    const doc = await $fetch(`/api/v1/documents/${id}`)
    currentDocument.value = doc
    isDirty.value = false
  }
  
  async function saveDocument() {
    if (!currentDocument.value || !isDirty.value) return
    
    await $fetch(`/api/v1/documents/${currentDocument.value.id}`, {
      method: 'PUT',
      body: currentDocument.value
    })
    
    isDirty.value = false
  }
  
  function processVariables(content: string): string {
    let processed = content
    
    variables.value.forEach(variable => {
      const pattern = new RegExp(`\\{\\{${variable.name}\\}\\}`, 'g')
      processed = processed.replace(pattern, variable.value)
    })
    
    return processed
  }
  
  return {
    currentDocument,
    folders,
    variables,
    isDirty,
    loadDocument,
    saveDocument,
    processVariables
  }
})
```

## リアルタイム同期設計

### WebSocket実装
```typescript
// composables/useDocumentSync.ts
export function useDocumentSync(documentId: string) {
  const ws = ref<WebSocket | null>(null)
  const collaborators = ref<Collaborator[]>([])
  const pendingChanges = ref<Change[]>([])
  
  function connect() {
    ws.value = new WebSocket(`wss://api.example.com/documents/${documentId}/sync`)
    
    ws.value.onmessage = (event) => {
      const message = JSON.parse(event.data)
      
      switch (message.type) {
        case 'change':
          applyChange(message.change)
          break
        case 'cursor':
          updateCursor(message.userId, message.position)
          break
        case 'collaborator-joined':
          collaborators.value.push(message.collaborator)
          break
      }
    }
  }
  
  function sendChange(change: Change) {
    if (ws.value?.readyState === WebSocket.OPEN) {
      ws.value.send(JSON.stringify({
        type: 'change',
        change
      }))
    } else {
      pendingChanges.value.push(change)
    }
  }
  
  return {
    collaborators,
    connect,
    sendChange
  }
}
```

## セキュリティ考慮事項

1. **アクセス制御**
   - フォルダ/ドキュメント単位での権限設定
   - 継承可能な権限システム

2. **データ保護**
   - ドキュメント暗号化（保存時）
   - HTTPS通信の強制

3. **監査ログ**
   - ドキュメントアクセスログ
   - 変更履歴の記録

4. **入力検証**
   - Markdownインジェクション対策
   - XSS対策（プレビュー時）