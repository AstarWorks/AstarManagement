package com.astarworks.astarmanagement.core.table.helper

import com.astarworks.astarmanagement.core.table.domain.model.*
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.shared.domain.value.*
import kotlinx.serialization.json.*
import java.time.Instant
import java.util.UUID

/**
 * Helper object for creating test data for flexible table system tests.
 * Provides factory methods for creating various domain objects with sensible defaults.
 */
object TableTestHelper {
    
    // Default test IDs
    val DEFAULT_TENANT_ID = UUID.fromString("00000000-0000-0000-0000-000000000001")
    val DEFAULT_WORKSPACE_ID = UUID.fromString("00000000-0000-0000-0000-000000000002")
    val DEFAULT_TABLE_ID = UUID.fromString("00000000-0000-0000-0000-000000000003")
    val DEFAULT_RECORD_ID = UUID.fromString("00000000-0000-0000-0000-000000000004")
    
    /**
     * Creates a test workspace with default values.
     */
    fun createTestWorkspace(
        id: UUID = UUID.randomUUID(),
        tenantId: UUID? = DEFAULT_TENANT_ID,
        name: String = "Test Workspace",
        createdAt: Instant = Instant.now(),
        updatedAt: Instant = Instant.now()
    ): Workspace {
        return Workspace(
            id = WorkspaceId(id),
            tenantId = tenantId?.let { TenantId(it) },
            name = name,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    /**
     * Creates a test table with default values.
     */
    fun createTestTable(
        id: UUID = UUID.randomUUID(),
        workspaceId: UUID = DEFAULT_WORKSPACE_ID,
        name: String = "Test Table",
        properties: Map<String, PropertyDefinition> = createDefaultProperties(),
        propertyOrder: List<String>? = null,
        createdAt: Instant = Instant.now(),
        updatedAt: Instant = Instant.now()
    ): Table {
        // If propertyOrder is not specified, derive it from the properties keys
        val actualPropertyOrder = propertyOrder ?: properties.keys.toList()
        
        return Table(
            id = TableId(id),
            workspaceId = WorkspaceId(workspaceId),
            name = name,
            properties = properties,
            propertyOrder = actualPropertyOrder,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    /**
     * Creates a test record with default values.
     */
    fun createTestRecord(
        id: UUID = UUID.randomUUID(),
        tableId: UUID = DEFAULT_TABLE_ID,
        data: JsonObject = createDefaultRecordData(),
        position: Float = 65536f,
        createdAt: Instant = Instant.now(),
        updatedAt: Instant = Instant.now()
    ): Record {
        return Record(
            id = RecordId(id),
            tableId = TableId(tableId),
            data = data,
            position = position,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    /**
     * Creates a test property definition.
     */
    fun createTestPropertyDefinition(
        type: PropertyType = PropertyType.TEXT,
        displayName: String = "Test Property",
        config: JsonObject = JsonObject(emptyMap())
    ): PropertyDefinition {
        return PropertyDefinition(
            type = type,
            displayName = displayName,
            config = config
        )
    }
    
    /**
     * Creates a test property type catalog entry.
     * @deprecated PropertyTypeCatalog has been removed from the system
     */
    // fun createTestPropertyTypeCatalog(
    //     id: String = "test_type",
    //     category: PropertyTypeCategory = PropertyTypeCategory.BASIC,
    //     validationSchema: JsonObject? = null,
    //     defaultConfig: JsonObject = JsonObject(emptyMap()),
    //     uiComponent: String? = "TextInput",
    //     icon: String? = "text",
    //     description: String? = "Test property type",
    //     isActive: Boolean = true,
    //     isCustom: Boolean = false
    // ): PropertyTypeCatalog {
    //     return PropertyTypeCatalog(
    //         id = id,
    //         category = category,
    //         validationSchema = validationSchema,
    //         defaultConfig = defaultConfig,
    //         uiComponent = uiComponent,
    //         icon = icon,
    //         description = description,
    //         isActive = isActive,
    //         isCustom = isCustom
    //     )
    // }
    
    /**
     * Creates default properties for a test table.
     */
    fun createDefaultProperties(): Map<String, PropertyDefinition> {
        return mapOf(
            "title" to PropertyDefinition(
                type = PropertyType.TEXT,
                displayName = "Title",
                config = buildJsonObject { 
                    put("required", JsonPrimitive(true))
                    put("maxLength", JsonPrimitive(255))
                }
            ),
            "status" to PropertyDefinition(
                type = PropertyType.SELECT,
                displayName = "Status",
                config = buildJsonObject {
                    put("options", JsonArray(listOf(
                        buildJsonObject {
                            put("value", JsonPrimitive("todo"))
                            put("label", JsonPrimitive("未着手"))
                        },
                        buildJsonObject {
                            put("value", JsonPrimitive("in_progress"))
                            put("label", JsonPrimitive("進行中"))
                        },
                        buildJsonObject {
                            put("value", JsonPrimitive("done"))
                            put("label", JsonPrimitive("完了"))
                        }
                    )))
                }
            ),
            "assignee" to PropertyDefinition(
                type = PropertyType.TEXT, // User type removed
                displayName = "Assignee",
                config = JsonObject(emptyMap())
            ),
            "priority" to PropertyDefinition(
                type = PropertyType.NUMBER,
                displayName = "Priority",
                config = buildJsonObject {
                    put("min", JsonPrimitive(1))
                    put("max", JsonPrimitive(10))
                    put("precision", JsonPrimitive(0))
                }
            ),
            "progress" to PropertyDefinition(
                type = PropertyType.NUMBER, // Percent type removed
                displayName = "Progress",
                config = buildJsonObject {
                    put("min", JsonPrimitive(0))
                    put("max", JsonPrimitive(100))
                    put("precision", JsonPrimitive(0))
                }
            ),
            "email" to PropertyDefinition(
                type = PropertyType.EMAIL,
                displayName = "Email",
                config = JsonObject(emptyMap())
            ),
            "website" to PropertyDefinition(
                type = PropertyType.URL,
                displayName = "Website",
                config = JsonObject(emptyMap())
            ),
            "phone" to PropertyDefinition(
                type = PropertyType.TEXT, // Phone type removed
                displayName = "Phone",
                config = JsonObject(emptyMap())
            ),
            "tags" to PropertyDefinition(
                type = PropertyType.MULTI_SELECT,
                displayName = "Tags",
                config = buildJsonObject {
                    put("options", JsonArray(listOf(
                        buildJsonObject {
                            put("value", JsonPrimitive("urgent"))
                            put("label", JsonPrimitive("緊急"))
                        },
                        buildJsonObject {
                            put("value", JsonPrimitive("important"))
                            put("label", JsonPrimitive("重要"))
                        },
                        buildJsonObject {
                            put("value", JsonPrimitive("low"))
                            put("label", JsonPrimitive("低"))
                        }
                    )))
                }
            )
        )
    }
    
    /**
     * Creates default record data.
     */
    fun createDefaultRecordData(): JsonObject {
        return buildJsonObject {
            put("title", JsonPrimitive("Test Record"))
            put("status", JsonPrimitive("todo"))
            put("assignee", JsonNull)
        }
    }
    
    /**
     * Creates a list of test records with sequential positions.
     */
    fun createTestRecords(
        count: Int,
        tableId: UUID = DEFAULT_TABLE_ID
    ): List<Record> {
        var position = 65536f
        return (1..count).map { index ->
            createTestRecord(
                tableId = tableId,
                data = buildJsonObject {
                    put("title", JsonPrimitive("Record $index"))
                    put("index", JsonPrimitive(index))
                },
                position = position
            ).also {
                position += 65536f
            }
        }
    }
    
    /**
     * Creates select options for testing.
     */
    fun createSelectOptions(vararg pairs: Pair<String, String>): List<SelectOption> {
        return pairs.map { (value, label) -> SelectOption(value, label) }
    }
    
    /**
     * Creates a task template table for testing.
     */
    fun createTaskTemplateTable(workspaceId: UUID = DEFAULT_WORKSPACE_ID): Table {
        return Table.create(
            workspaceId = WorkspaceId(workspaceId),
            name = "タスク",
            properties = mapOf(
                "title" to PropertyDefinition(PropertyType.TEXT, "タイトル", JsonObject(emptyMap())),
                "status" to PropertyDefinition(PropertyType.SELECT, "ステータス", JsonObject(emptyMap())),
                "assignee" to PropertyDefinition(PropertyType.TEXT, "担当者", JsonObject(emptyMap())),
                "priority" to PropertyDefinition(PropertyType.SELECT, "優先度", JsonObject(emptyMap())),
                "dueDate" to PropertyDefinition(PropertyType.DATE, "期限", JsonObject(emptyMap()))
            )
        )
    }
    
    /**
     * Creates a customer template table for testing.
     */
    fun createCustomerTemplateTable(workspaceId: UUID = DEFAULT_WORKSPACE_ID): Table {
        return Table.create(
            workspaceId = WorkspaceId(workspaceId),
            name = "顧客",
            properties = mapOf(
                "name" to PropertyDefinition(PropertyType.TEXT, "名前", JsonObject(emptyMap())),
                "email" to PropertyDefinition(PropertyType.TEXT, "メール", JsonObject(emptyMap())),
                "phone" to PropertyDefinition(PropertyType.TEXT, "電話", JsonObject(emptyMap())),
                "company" to PropertyDefinition(PropertyType.TEXT, "会社", JsonObject(emptyMap())),
                "address" to PropertyDefinition(PropertyType.TEXT, "住所", JsonObject(emptyMap()))
            )
        )
    }
}