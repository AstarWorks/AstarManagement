# テーブル機能 - ドメインモデル

## エンティティ

### Table
```kotlin
data class Table(
    val id: TableId,
    val workspaceId: WorkspaceId,
    val name: String,
    val description: String? = null,
    val properties: Map<String, PropertyDefinition>,
    val propertyOrder: List<String>,
    val createdAt: Instant,
    val updatedAt: Instant
)
```

**責務**:
- テーブル定義の管理
- プロパティ定義の保持
- プロパティ順序の管理

**ビジネスルール**:
- テーブル名は255文字以内
- 説明は1000文字以内
- プロパティ順序のキーはすべてプロパティに存在する必要がある

### Record
```kotlin
data class Record(
    val id: RecordId,
    val tableId: TableId,
    val data: Map<String, Any?>,
    val createdAt: Instant,
    val updatedAt: Instant,
    val createdBy: UserId?,
    val updatedBy: UserId?
)
```

**責務**:
- レコードデータの保持
- 作成・更新履歴の管理

**ビジネスルール**:
- データはテーブルのプロパティ定義に準拠する必要がある
- 必須プロパティは必ず値を持つ

### PropertyDefinition
```kotlin
data class PropertyDefinition(
    val type: PropertyType,
    val name: String,
    val description: String? = null,
    val required: Boolean = false,
    val defaultValue: Any? = null,
    val options: List<String>? = null,  // SELECT/MULTI_SELECT用
    val relationTableId: TableId? = null, // RELATION用
    val format: String? = null  // DATE/NUMBER用のフォーマット
)
```

**責務**:
- プロパティの型定義
- バリデーションルールの保持
- デフォルト値の管理

## 値オブジェクト

### PropertyType
```kotlin
enum class PropertyType {
    TEXT,           // テキスト
    NUMBER,         // 数値
    DATE,           // 日付
    CHECKBOX,       // チェックボックス
    SELECT,         // 単一選択
    MULTI_SELECT,   // 複数選択
    USER,           // ユーザー参照
    RELATION,       // テーブル間リレーション
    URL,            // URL
    EMAIL,          // メールアドレス
    PHONE           // 電話番号
}
```

### TableId / RecordId / WorkspaceId
```kotlin
@JvmInline
value class TableId(val value: UUID)

@JvmInline
value class RecordId(val value: UUID)

@JvmInline
value class WorkspaceId(val value: UUID)
```

## サービス

### TableService
```kotlin
@Service
@Transactional
class TableService(
    private val tableRepository: TableRepository,
    private val recordRepository: RecordRepository
) {
    fun createTable(
        workspaceId: WorkspaceId,
        name: String,
        properties: Map<String, PropertyDefinition>
    ): Table
    
    fun updateTable(
        tableId: TableId,
        name: String? = null,
        description: String? = null
    ): Table
    
    fun addProperty(
        tableId: TableId,
        key: String,
        definition: PropertyDefinition
    ): Table
    
    fun removeProperty(
        tableId: TableId,
        propertyKey: String
    ): Table
    
    fun deleteTable(tableId: TableId)
}
```

### RecordService
```kotlin
@Service
@Transactional
class RecordService(
    private val recordRepository: RecordRepository,
    private val tableRepository: TableRepository
) {
    fun createRecord(
        tableId: TableId,
        data: Map<String, Any?>
    ): Record
    
    fun updateRecord(
        recordId: RecordId,
        data: Map<String, Any?>
    ): Record
    
    fun findRecords(
        tableId: TableId,
        filter: RecordFilter? = null,
        pageable: Pageable
    ): Page<Record>
    
    fun deleteRecord(recordId: RecordId)
    
    fun batchUpdate(
        recordIds: List<RecordId>,
        data: Map<String, Any?>
    ): List<Record>
}
```

## リポジトリ

### TableRepository
```kotlin
interface TableRepository {
    fun findById(id: TableId): Table?
    fun findByWorkspaceId(workspaceId: WorkspaceId): List<Table>
    fun save(table: Table): Table
    fun delete(id: TableId)
    fun existsByWorkspaceIdAndName(
        workspaceId: WorkspaceId,
        name: String
    ): Boolean
}
```

### RecordRepository
```kotlin
interface RecordRepository {
    fun findById(id: RecordId): Record?
    fun findByTableId(
        tableId: TableId,
        pageable: Pageable
    ): Page<Record>
    fun save(record: Record): Record
    fun saveAll(records: List<Record>): List<Record>
    fun delete(id: RecordId)
    fun deleteByTableId(tableId: TableId)
    fun count(tableId: TableId): Long
}
```

## バリデーション

### RecordDataValidator
```kotlin
@Component
class RecordDataValidator {
    fun validate(
        data: Map<String, Any?>,
        properties: Map<String, PropertyDefinition>
    ): ValidationResult {
        val errors = mutableListOf<ValidationError>()
        
        // 必須フィールドチェック
        properties.forEach { (key, definition) ->
            if (definition.required && data[key] == null) {
                errors.add(ValidationError(
                    field = key,
                    message = "${definition.name}は必須です"
                ))
            }
        }
        
        // 型チェック
        data.forEach { (key, value) ->
            val definition = properties[key]
            if (definition != null && value != null) {
                validateType(key, value, definition)?.let { errors.add(it) }
            }
        }
        
        return ValidationResult(errors)
    }
}
```

## ドメインイベント

### TableCreatedEvent
```kotlin
data class TableCreatedEvent(
    val tableId: TableId,
    val workspaceId: WorkspaceId,
    val name: String,
    val createdAt: Instant
)
```

### RecordUpdatedEvent
```kotlin
data class RecordUpdatedEvent(
    val recordId: RecordId,
    val tableId: TableId,
    val updatedFields: Set<String>,
    val updatedAt: Instant,
    val updatedBy: UserId
)
```