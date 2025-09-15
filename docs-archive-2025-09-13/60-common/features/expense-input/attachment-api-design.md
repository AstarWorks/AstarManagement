# 添付ファイルアップロードAPI設計

## 1. 設計方針

### 1.1 長期的な実費作成プロセスへの対応
```
Day 1: 交通費の領収書をアップロード
Day 5: コピー代の領収書を追加
Day 15: 印紙代の領収書を追加
Day 30: 全ての実費をまとめて登録
```

このような使い方を想定し、以下の設計とします：

- アップロードファイルは実費と独立して管理
- 複数の実費で同じファイルを参照可能
- 長期保存（最低30日）

### 1.2 ストレージ構造（ファイルストレージ）
```
attachments/
├── tenant-{tenant_id}/
│   ├── temp/                    # 一時ファイル（未紐付け）
│   │   └── {year-month}/
│   │       └── {file_id}
│   └── expenses/                # 実費紐付け済み
│       └── {year-month}/
│           └── {file_id}
```

## 2. データベース設計

### 2.1 添付ファイルテーブル（改訂版）
```sql
CREATE TABLE attachments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tenant_id UUID NOT NULL REFERENCES tenants(id),
  
  -- ファイル情報
  file_name VARCHAR(255) NOT NULL,      -- 保存時のファイル名
  original_name VARCHAR(255) NOT NULL,   -- アップロード時の元ファイル名
  file_size INTEGER NOT NULL CHECK (file_size > 0),
  mime_type VARCHAR(100) NOT NULL,
  storage_path TEXT NOT NULL,
  
  -- ステータス
  status VARCHAR(20) NOT NULL DEFAULT 'temporary',  -- temporary, linked, archived
  linked_at TIMESTAMPTZ,                 -- 実費に紐付けられた日時
  expires_at TIMESTAMPTZ,                -- 有効期限（一時ファイルのみ）
  
  -- サムネイル（画像の場合）
  thumbnail_path TEXT,
  thumbnail_size INTEGER,
  
  -- プレビュー（PDFの場合）
  preview_path TEXT,
  page_count INTEGER,
  
  -- メタデータ
  uploaded_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  uploaded_by UUID NOT NULL REFERENCES users(id),
  
  -- アクセス制御
  access_scope VARCHAR(50) DEFAULT 'related',  -- related, tenant, public
  
  -- 論理削除
  deleted_at TIMESTAMPTZ,
  deleted_by UUID REFERENCES users(id)
);

-- 実費との関連（多対多）
CREATE TABLE expense_attachment_relations (
  expense_id UUID NOT NULL REFERENCES expenses(id) ON DELETE CASCADE,
  attachment_id UUID NOT NULL REFERENCES attachments(id),
  
  attached_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  attached_by UUID NOT NULL REFERENCES users(id),
  
  PRIMARY KEY (expense_id, attachment_id)
);

-- インデックス
CREATE INDEX idx_attachments_tenant_status ON attachments(tenant_id, status);
CREATE INDEX idx_attachments_expires_at ON attachments(expires_at) WHERE status = 'temporary';
```

### 2.2 アクセス権限の拡張
```sql
-- 添付ファイルのパーミッション
INSERT INTO permissions (code, name_key, resource, action, scope) VALUES
('attachment.upload', 'permissions.attachment.upload', 'attachment', 'create', 'own'),
('attachment.read.own', 'permissions.attachment.read_own', 'attachment', 'read', 'own'),
('attachment.read.related', 'permissions.attachment.read_related', 'attachment', 'read', 'related'),
('attachment.read.all', 'permissions.attachment.read_all', 'attachment', 'read', 'tenant'),
('attachment.delete.own', 'permissions.attachment.delete_own', 'attachment', 'delete', 'own'),
('attachment.delete.all', 'permissions.attachment.delete_all', 'attachment', 'delete', 'tenant');
```

## 3. API設計

### 3.1 ファイルアップロード
```
POST /api/v1/attachments/upload
```

#### リクエスト
```
Content-Type: multipart/form-data

file: (ファイル)
purpose?: string      // "expense", "document", etc.
metadata?: {
  description?: string
  tags?: string[]
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": "att-550e8400-e29b-41d4-a716-446655440000",
    "fileName": "receipt-20240120-123456.jpg",
    "originalName": "領収書.jpg",
    "fileSize": 1024000,
    "mimeType": "image/jpeg",
    "status": "temporary",
    "expiresAt": "2024-01-21T10:00:00Z",
    "urls": {
      "original": "https://storage.example.com/attachments/tenant-123/temp/2024-01/att-550e8400.jpg",
      "thumbnail": "https://storage.example.com/attachments/tenant-123/temp/2024-01/att-550e8400_thumb.webp"
    },
    "uploadedAt": "2024-01-20T10:00:00Z",
    "uploadedBy": {
      "id": "user-123",
      "name": "田中太郎"
    }
  }
}
```

### 3.2 複数ファイル一括アップロード
```
POST /api/v1/attachments/upload-multiple
```

#### リクエスト
```
Content-Type: multipart/form-data

files: (複数ファイル)
purpose?: string
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "uploaded": [
      {
        "id": "att-001",
        "fileName": "receipt1.jpg",
        "status": "uploaded"
      },
      {
        "id": "att-002",
        "fileName": "receipt2.pdf",
        "status": "uploaded"
      }
    ],
    "failed": [
      {
        "fileName": "large-file.zip",
        "error": {
          "code": "FILE_TOO_LARGE",
          "message": "File size exceeds 10MB limit"
        }
      }
    ],
    "summary": {
      "total": 3,
      "uploaded": 2,
      "failed": 1
    }
  }
}
```

### 3.3 ファイル情報取得
```
GET /api/v1/attachments/{id}
```

#### アクセス制御
```kotlin
// アクセス可能な条件
fun canAccessAttachment(userId: UUID, attachment: Attachment): Boolean {
  return when (attachment.accessScope) {
    "public" -> true
    "tenant" -> user.tenantId == attachment.tenantId
    "related" -> {
      // アップロード者本人
      userId == attachment.uploadedBy ||
      // 関連する実費の作成者
      hasRelatedExpenseAccess(userId, attachment.id) ||
      // 管理者権限
      hasPermission(userId, "attachment.read.all")
    }
  }
}
```

### 3.4 ファイル有効期限延長
```
POST /api/v1/attachments/{id}/extend
```

#### リクエストボディ
```json
{
  "days": 30  // 延長日数（最大90日）
}
```

#### レスポンス
```json
{
  "success": true,
  "data": {
    "id": "att-550e8400",
    "newExpiresAt": "2024-02-20T10:00:00Z"
  }
}
```

### 3.5 未使用ファイル一覧
```
GET /api/v1/attachments/temporary
```

月末の実費登録時に、過去にアップロードした未使用ファイルを確認できます。

#### レスポンス
```json
{
  "success": true,
  "data": [
    {
      "id": "att-001",
      "originalName": "交通費領収書.jpg",
      "uploadedAt": "2024-01-05T10:00:00Z",
      "expiresAt": "2024-01-06T10:00:00Z",
      "thumbnail": "https://...",
      "tags": ["交通費", "1月"]
    }
  ],
  "pagination": {
    "page": 1,
    "perPage": 30,
    "total": 45
  }
}
```

## 4. ファイル処理

### 4.1 画像リサイズ（サーバーサイド処理）
```kotlin
@Service
class ImageProcessingService(
    private val fileStorageService: FileStorageService
) {
    
    fun processImage(fileName: String, bucketName: String): ProcessingResult {
        // 画像をダウンロード
        val originalBytes = fileStorageService.downloadFile(bucketName, fileName)
        
        // サムネイル生成（200x200）
        val thumbnail = resizeImage(originalBytes, 200, 200)
        
        // WebP形式で保存
        val thumbnailPath = fileName.replace(Regex("\\.[^.]+$"), "_thumb.webp")
        fileStorageService.uploadFile(bucketName, thumbnailPath, thumbnail)
        
        return ProcessingResult(
            success = true,
            thumbnailPath = thumbnailPath
        )
    }
    
    private fun resizeImage(imageBytes: ByteArray, width: Int, height: Int): ByteArray {
        // ImageIO または他の画像処理ライブラリを使用
        return ImageProcessor.resize(imageBytes, width, height, "webp")
    }
}

// 汎用ファイルストレージインターフェース
interface FileStorageService {
    fun uploadFile(bucket: String, path: String, data: ByteArray): Boolean
    fun downloadFile(bucket: String, path: String): ByteArray
    fun deleteFile(bucket: String, path: String): Boolean
    fun listFiles(bucket: String, prefix: String): List<String>
}
```

### 4.2 PDFプレビュー生成
```typescript
// 1ページ目を画像として抽出
async function generatePdfPreview(pdfBuffer: ArrayBuffer) {
  // PDF.jsを使用して1ページ目を画像化
  const firstPage = await extractFirstPage(pdfBuffer)
  return await convertToImage(firstPage, 'webp')
}
```

## 5. クリーンアップ処理

### 5.1 期限切れファイルの削除（定期ジョブ）
```kotlin
@Scheduled(cron = "0 0 * * * *") // 毎時実行
fun cleanupExpiredFiles() {
    val expiredFiles = attachmentRepository.findExpiredTemporaryFiles()
    
    expiredFiles.forEach { attachment ->
        // ファイルストレージから削除
        fileStorageService.deleteFile("attachments", attachment.storagePath)
        
        // DBから論理削除
        attachment.deletedAt = Instant.now()
        attachmentRepository.save(attachment)
    }
    
    logger.info("Cleaned up ${expiredFiles.size} expired files")
}
```

### 5.2 未使用ファイルの通知
```kotlin
@Scheduled(cron = "0 9 25 * * *") // 毎月25日の朝9時
fun notifyUnusedFiles() {
    val unusedFiles = attachmentRepository
        .findTemporaryFilesByTenant()
        .groupBy { it.uploadedBy }
    
    unusedFiles.forEach { (userId, files) ->
        notificationService.send(
            userId = userId,
            type = "UNUSED_ATTACHMENTS",
            data = mapOf(
                "count" to files.size,
                "totalSize" to files.sumOf { it.fileSize },
                "oldestFile" to files.minBy { it.uploadedAt }
            )
        )
    }
}
```

## 6. 実装の注意点

1. **長期保存対応**
   - 一時ファイルのデフォルト有効期限: 30日
   - 延長可能（最大90日）
   - 実費紐付け後は無期限

2. **パフォーマンス**
   - サムネイルは非同期生成
   - 大きなファイルは分割アップロード対応

3. **セキュリティ**
   - Signed URLで一時的なアクセス許可
   - テナント分離の徹底

この設計でいかがでしょうか？実費作成の長期プロセスに対応できる仕組みになっています。