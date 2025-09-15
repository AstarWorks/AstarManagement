# ドキュメント管理

## 概要

Markdownファイルを中心とした階層型ドキュメント管理システム。
Obsidianのようなファイルシステムベースで、変数システムとバージョニングをサポート。

## データモデル

### フォルダ
```kotlin
@Entity
@Table(name = "folders")
data class Folder(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(nullable = false)
    val tenantId: UUID,
    
    @Column(nullable = false)
    val name: String,
    
    val parentId: UUID? = null,
    
    @Column(nullable = false)
    val path: String, // /root/projects/project1
    
    val description: String? = null,
    
    @ElementCollection
    @CollectionTable(name = "folder_permissions")
    val permissions: Map<UUID, String> = emptyMap(), // roleId -> permission
    
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
)
```

### ドキュメント
```kotlin
@Entity
@Table(name = "documents")
data class Document(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(nullable = false)
    val tenantId: UUID,
    
    @Column(nullable = false)
    val folderId: UUID,
    
    @Column(nullable = false)
    val filename: String,
    
    @Column(nullable = false)
    val path: String, // /root/projects/project1/readme.md
    
    @Lob
    val content: String, // Markdownコンテンツ
    
    val mimeType: String = "text/markdown",
    
    val size: Long = 0,
    
    @Column(columnDefinition = "jsonb")
    val metadata: JsonNode? = null, // メタデータ
    
    val createdBy: UUID? = null,
    val updatedBy: UUID? = null,
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
)
```

### バージョン管理
```kotlin
@Entity
@Table(name = "document_versions")
data class DocumentVersion(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(nullable = false)
    val documentId: UUID,
    
    @Column(nullable = false)
    val version: Int,
    
    @Lob
    val content: String,
    
    val changeMessage: String? = null,
    
    val createdBy: UUID? = null,
    val createdAt: Instant = Instant.now()
)
```

## 変数システム

### 変数定義
```kotlin
@Entity
@Table(name = "variables")
data class Variable(
    @Id
    val id: UUID = UUID.randomUUID(),
    
    @Column(nullable = false)
    val tenantId: UUID,
    
    @Column(nullable = false)
    val name: String, // {{company_name}}
    
    val value: String,
    
    @Enumerated(EnumType.STRING)
    val scope: VariableScope, // GLOBAL, PROJECT, DOCUMENT
    
    val scopeId: UUID? = null, // プロジェクトIDまたはドキュメントID
    
    val description: String? = null,
    
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
)

enum class VariableScope {
    GLOBAL,    // テナント全体
    PROJECT,   // プロジェクト固有
    DOCUMENT   // ドキュメント固有
}
```

### 変数処理
```kotlin
@Service
class DocumentService {
    
    fun processVariables(
        content: String,
        documentId: UUID? = null,
        projectId: UUID? = null
    ): String {
        val variables = collectVariables(documentId, projectId)
        return replaceVariables(content, variables)
    }
    
    private fun collectVariables(
        documentId: UUID?,
        projectId: UUID?
    ): Map<String, String> {
        val variables = mutableMapOf<String, String>()
        
        // グローバル変数
        variableRepository.findByScope(VariableScope.GLOBAL)
            .forEach { variables[it.name] = it.value }
        
        // プロジェクト変数
        projectId?.let {
            variableRepository.findByScopeAndScopeId(VariableScope.PROJECT, it)
                .forEach { variables[it.name] = it.value }
        }
        
        // ドキュメント変数
        documentId?.let {
            variableRepository.findByScopeAndScopeId(VariableScope.DOCUMENT, it)
                .forEach { variables[it.name] = it.value }
        }
        
        return variables
    }
    
    private fun replaceVariables(
        content: String,
        variables: Map<String, String>
    ): String {
        var processed = content
        val pattern = Pattern.compile("\\{\\{([^}]+)\\}\\}")
        val matcher = pattern.matcher(content)
        
        while (matcher.find()) {
            val varName = matcher.group(1).trim()
            variables[varName]?.let { value ->
                processed = processed.replace("{{$varName}}", value)
            }
        }
        
        return processed
    }
}
```

## Markdown処理

### プロセッサ
```kotlin
@Component
class MarkdownProcessor {
    
    fun parse(markdown: String): MarkdownDocument {
        val parser = Parser.builder()
            .extensions(listOf(
                TablesExtension.create(),
                StrikethroughExtension.create(),
                TaskListItemsExtension.create()
            ))
            .build()
        
        val document = parser.parse(markdown)
        return MarkdownDocument(
            content = markdown,
            ast = document,
            metadata = extractMetadata(markdown)
        )
    }
    
    fun render(document: MarkdownDocument): String {
        val renderer = HtmlRenderer.builder()
            .extensions(listOf(
                TablesExtension.create(),
                StrikethroughExtension.create(),
                TaskListItemsExtension.create()
            ))
            .build()
        
        return renderer.render(document.ast)
    }
    
    private fun extractMetadata(markdown: String): Map<String, Any> {
        // Frontmatterを抽出
        val frontmatterPattern = Pattern.compile(
            "^---\\s*\\n(.*?)\\n---",
            Pattern.DOTALL or Pattern.MULTILINE
        )
        
        val matcher = frontmatterPattern.matcher(markdown)
        if (matcher.find()) {
            val yaml = matcher.group(1)
            return parseYaml(yaml)
        }
        
        return emptyMap()
    }
}
```

### リンク処理
```kotlin
@Service
class DocumentLinkService {
    
    fun extractLinks(content: String): List<DocumentLink> {
        val links = mutableListOf<DocumentLink>()
        
        // Wikiリンク: [[document-name]]
        val wikiPattern = Pattern.compile("\\[\\[([^\\]]+)\\]\\]")
        val wikiMatcher = wikiPattern.matcher(content)
        while (wikiMatcher.find()) {
            links.add(DocumentLink(
                type = LinkType.WIKI,
                target = wikiMatcher.group(1)
            ))
        }
        
        // テーブルリンク: @table:table-name
        val tablePattern = Pattern.compile("@table:([\\w-]+)")
        val tableMatcher = tablePattern.matcher(content)
        while (tableMatcher.find()) {
            links.add(DocumentLink(
                type = LinkType.TABLE,
                target = tableMatcher.group(1)
            ))
        }
        
        return links
    }
    
    fun resolveLinks(content: String, tenantId: UUID): String {
        var resolved = content
        
        // Wikiリンクを解決
        val wikiPattern = Pattern.compile("\\[\\[([^\\]]+)\\]\\]")
        val wikiMatcher = wikiPattern.matcher(content)
        while (wikiMatcher.find()) {
            val docName = wikiMatcher.group(1)
            val doc = documentRepository.findByFilename(tenantId, docName)
            doc?.let {
                resolved = resolved.replace(
                    "[[$docName]]",
                    "[${docName}](/documents/${it.id})"
                )
            }
        }
        
        return resolved
    }
}
```

## ファイルストレージ

### S3/MinIO統合
```kotlin
@Service
class FileStorageService(
    private val s3Client: S3Client
) {
    
    @Value("\${storage.bucket}")
    private lateinit var bucketName: String
    
    fun uploadDocument(
        tenantId: UUID,
        document: Document
    ): String {
        val key = "${tenantId}/documents/${document.id}.md"
        
        val putRequest = PutObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .contentType("text/markdown")
            .metadata(mapOf(
                "tenant-id" to tenantId.toString(),
                "document-id" to document.id.toString()
            ))
            .build()
        
        s3Client.putObject(
            putRequest,
            RequestBody.fromString(document.content)
        )
        
        return key
    }
    
    fun downloadDocument(key: String): String {
        val getRequest = GetObjectRequest.builder()
            .bucket(bucketName)
            .key(key)
            .build()
        
        return s3Client.getObjectAsBytes(getRequest)
            .asString(StandardCharsets.UTF_8)
    }
}
```

## API設訨

### エンドポイント
```yaml
# フォルダ操作
GET    /api/v1/folders              # フォルダ一覧
POST   /api/v1/folders              # フォルダ作成
GET    /api/v1/folders/{id}         # フォルダ詳細
PUT    /api/v1/folders/{id}         # フォルダ更新
DELETE /api/v1/folders/{id}         # フォルダ削除

# ドキュメント操作
GET    /api/v1/documents            # ドキュメント一覧
POST   /api/v1/documents            # ドキュメント作成
GET    /api/v1/documents/{id}       # ドキュメント取得
PUT    /api/v1/documents/{id}       # ドキュメント更新
DELETE /api/v1/documents/{id}       # ドキュメント削除

# バージョン管理
GET    /api/v1/documents/{id}/versions      # バージョン一覧
GET    /api/v1/documents/{id}/versions/{v}  # 特定バージョン
POST   /api/v1/documents/{id}/restore/{v}   # バージョン復元

# 変数管理
GET    /api/v1/variables            # 変数一覧
POST   /api/v1/variables            # 変数作成
PUT    /api/v1/variables/{id}       # 変数更新
DELETE /api/v1/variables/{id}       # 変数削除
```

## まとめ

ドキュメント管理システムにより：
1. **Obsidianライク**: ファイルシステムベースの直感的な管理
2. **変数システム**: テンプレート化と再利用
3. **バージョニング**: 完全な変更履歴と復元
4. **相互リンク**: ドキュメントとテーブルの連携