package com.astarworks.astarmanagement.fixture.builder

import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.core.user.domain.model.UserProfile
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.core.table.domain.model.Table
import com.astarworks.astarmanagement.core.table.domain.model.Record
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypes
import com.astarworks.astarmanagement.core.table.domain.model.PropertyValue
import com.astarworks.astarmanagement.core.table.domain.model.SelectOption
import com.astarworks.astarmanagement.core.auth.domain.model.DynamicRole
import com.astarworks.astarmanagement.shared.domain.value.*
import kotlinx.serialization.json.*
import java.time.Instant
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.UUID

/**
 * Test data builder for domain model entities.
 * Provides consistent, reusable test data creation following the Builder pattern.
 * 
 * This builder creates domain objects with sensible defaults while allowing
 * customization of specific properties for test scenarios.
 */
object DomainModelTestBuilder {
    
    // ===== User Domain =====
    
    /**
     * Creates a User with sensible defaults.
     */
    fun user(
        id: UserId = UserId(UUID.randomUUID()),
        auth0Sub: String = "auth0|${System.currentTimeMillis()}",
        email: String = "test-${System.currentTimeMillis()}@example.com",
        createdAt: Instant = Instant.now(),
        updatedAt: Instant = Instant.now()
    ): User {
        return User(
            id = id,
            auth0Sub = auth0Sub,
            email = email,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    /**
     * Creates a UserProfile with sensible defaults.
     */
    fun userProfile(
        id: UserProfileId = UserProfileId(UUID.randomUUID()),
        userId: UserId = UserId(UUID.randomUUID()),
        displayName: String? = "Test User",
        avatarUrl: String? = null,
        createdAt: Instant = Instant.now(),
        updatedAt: Instant = Instant.now()
    ): UserProfile {
        return UserProfile(
            id = id,
            userId = userId,
            displayName = displayName,
            avatarUrl = avatarUrl,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    // ===== Tenant Domain =====
    
    /**
     * Creates a Tenant with sensible defaults.
     */
    fun tenant(
        id: TenantId = TenantId(UUID.randomUUID()),
        slug: String = "test-tenant-${System.currentTimeMillis()}",
        name: String = "Test Tenant",
        auth0OrgId: String? = null,
        isActive: Boolean = true,
        createdAt: Instant = Instant.now(),
        updatedAt: Instant = Instant.now()
    ): Tenant {
        return Tenant(
            id = id,
            slug = slug,
            name = name,
            auth0OrgId = auth0OrgId,
            isActive = isActive,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    // ===== Workspace Domain =====
    
    /**
     * Creates a Workspace with sensible defaults.
     */
    fun workspace(
        id: WorkspaceId = WorkspaceId(UUID.randomUUID()),
        tenantId: TenantId? = null,
        name: String = "Test Workspace",
        createdBy: UserId? = null,
        teamId: TeamId? = null,
        createdAt: Instant = Instant.now(),
        updatedAt: Instant = Instant.now()
    ): Workspace {
        return Workspace(
            id = id,
            tenantId = tenantId,
            name = name,
            createdBy = createdBy,
            teamId = teamId,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    // ===== Table Domain =====
    
    /**
     * Creates a PropertyDefinition with sensible defaults.
     */
    fun propertyDefinition(
        typeId: String = PropertyTypes.TEXT,
        displayName: String = "Test Property",
        config: JsonObject = buildJsonObject { 
            put("required", false)
        }
    ): PropertyDefinition {
        return PropertyDefinition(
            typeId = typeId,
            displayName = displayName,
            config = config
        )
    }
    
    /**
     * Creates a Table with sensible defaults.
     */
    fun table(
        id: TableId = TableId(UUID.randomUUID()),
        workspaceId: WorkspaceId = WorkspaceId(UUID.randomUUID()),
        name: String = "Test Table",
        properties: Map<String, PropertyDefinition> = emptyMap(),
        propertyOrder: List<String> = emptyList(),
        createdAt: Instant = Instant.now(),
        updatedAt: Instant = Instant.now()
    ): Table {
        return Table(
            id = id,
            workspaceId = workspaceId,
            name = name,
            properties = properties,
            propertyOrder = propertyOrder,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    /**
     * Creates a Record with sensible defaults.
     */
    fun record(
        id: RecordId = RecordId(UUID.randomUUID()),
        tableId: TableId = TableId(UUID.randomUUID()),
        data: JsonObject = JsonObject(emptyMap()),
        position: Float = Record.DEFAULT_POSITION,
        createdAt: Instant = Instant.now(),
        updatedAt: Instant = Instant.now()
    ): Record {
        return Record(
            id = id,
            tableId = tableId,
            data = data,
            position = position,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    // ===== Auth Domain =====
    
    /**
     * Creates a DynamicRole with sensible defaults.
     */
    fun dynamicRole(
        id: RoleId = RoleId(UUID.randomUUID()),
        tenantId: TenantId? = null,
        name: String = "test_role_${System.currentTimeMillis()}",
        displayName: String? = "Test Role",
        color: String? = "#FF5733",
        position: Int = 0,
        isSystem: Boolean = false,
        createdAt: Instant = Instant.now(),
        updatedAt: Instant = Instant.now()
    ): DynamicRole {
        return DynamicRole(
            id = id,
            tenantId = tenantId,
            name = name,
            displayName = displayName,
            color = color,
            position = position,
            isSystem = isSystem,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
    
    // ===== Common Patterns =====
    
    /**
     * Creates a minimal tenant with basic setup.
     */
    fun minimalTenant(): Tenant {
        return tenant(
            slug = "minimal",
            name = "Minimal Tenant"
        )
    }
    
    /**
     * Creates a table with common text properties.
     */
    fun tableWithTextProperties(): Table {
        val properties = mapOf(
            "title" to propertyDefinition(
                typeId = PropertyTypes.TEXT,
                displayName = "Title",
                config = buildJsonObject {
                    put("required", true)
                    put("maxLength", 255)
                }
            ),
            "description" to propertyDefinition(
                typeId = PropertyTypes.LONG_TEXT,
                displayName = "Description",
                config = buildJsonObject {
                    put("required", false)
                }
            )
        )
        
        return table(
            name = "Text Table",
            properties = properties,
            propertyOrder = listOf("title", "description")
        )
    }
    
    /**
     * Creates a record with sample text data.
     */
    fun recordWithTextData(tableId: TableId): Record {
        val data = buildJsonObject {
            put("title", "Sample Title")
            put("description", "Sample description text")
        }
        
        return record(
            tableId = tableId,
            data = data
        )
    }
    
    // ===== Property Value Helpers =====
    
    /**
     * Creates a PropertyValue with sensible defaults.
     */
    fun propertyValue(
        key: String = "test_property",
        value: JsonElement = JsonPrimitive("test value"),
        typeId: String? = null
    ): PropertyValue {
        return PropertyValue(
            key = key,
            value = value,
            typeId = typeId
        )
    }
    
    /**
     * Creates a SelectOption with sensible defaults.
     */
    fun selectOption(
        value: String = "option_${System.currentTimeMillis()}",
        label: String = "Option Label",
        color: String? = null
    ): SelectOption {
        return SelectOption(
            value = value,
            label = label,
            color = color
        )
    }
    
    /**
     * Creates SelectOptions for common test scenarios.
     */
    fun selectOptions(): List<SelectOption> {
        return listOf(
            selectOption(value = "option1", label = "Option 1", color = "#FF5733"),
            selectOption(value = "option2", label = "Option 2", color = "#33FF57"),
            selectOption(value = "option3", label = "Option 3", color = "#3357FF")
        )
    }
    
    /**
     * Creates a PropertyValue for different types.
     */
    fun textPropertyValue(key: String = "text_field", value: String? = "sample text"): PropertyValue {
        return PropertyValue.text(key, value)
    }
    
    fun numberPropertyValue(key: String = "number_field", value: Number? = 42): PropertyValue {
        return PropertyValue.number(key, value)
    }
    
    fun checkboxPropertyValue(key: String = "checkbox_field", value: Boolean = true): PropertyValue {
        return PropertyValue.checkbox(key, value)
    }
    
    fun datePropertyValue(key: String = "date_field", value: LocalDate? = LocalDate.now()): PropertyValue {
        return PropertyValue.date(key, value)
    }
    
    fun selectPropertyValue(key: String = "select_field", value: String? = "option1"): PropertyValue {
        return PropertyValue.select(key, value)
    }
    
    fun multiSelectPropertyValue(key: String = "multi_select_field", values: List<String> = listOf("option1", "option2")): PropertyValue {
        return PropertyValue.multiSelect(key, values)
    }
    
    // ===== Validation Test Helpers =====
    
    /**
     * Creates test cases for blank email addresses (only validation performed by User domain model).
     * Domain trusts Auth0 for email format validation.
     */
    fun invalidEmails(): List<String> {
        return listOf(
            "",           // blank
            "   ",        // whitespace only
            "\t",         // tab only
            "\n"          // newline only
        )
    }
    
    /**
     * Creates test cases for invalid tenant slugs.
     */
    fun invalidSlugs(): List<String> {
        return listOf(
            "",              // blank
            "   ",           // whitespace only
            "UPPERCASE",     // uppercase letters
            "with spaces",   // spaces
            "with_underscore", // underscores
            "with.dot",      // dots  
            "special@char",  // special characters
            "a".repeat(101)  // too long
        )
    }
    
    /**
     * Creates test cases for invalid hex color codes.
     */
    fun invalidColors(): List<String> {
        return listOf(
            "",           // blank
            "#",          // just hash
            "#FF",        // too short
            "#FFFFFFF",   // too long
            "FF5733",     // missing hash
            "#GG5733",    // invalid hex chars
            "#gg5733"     // lowercase invalid hex chars
        )
    }
    
    /**
     * Creates test cases for valid hex color codes.
     */
    fun validColors(): List<String> {
        return listOf(
            "#FF5733",    // uppercase
            "#33FF57",    // mixed
            "#3357FF",    // blue
            "#000000",    // black
            "#FFFFFF",    // white
            "#ff5733"     // lowercase (valid)
        )
    }
    
    /**
     * Creates test cases for invalid role names (DynamicRole).
     */
    fun invalidRoleNames(): List<String> {
        return listOf(
            "",              // blank
            "   ",           // whitespace only
            "UPPERCASE",     // uppercase letters
            "with spaces",   // spaces
            "with-hyphen",   // hyphens
            "with.dot",      // dots
            "with@symbol",   // special characters
            "a".repeat(101)  // too long
        )
    }
    
    /**
     * Creates test cases for valid role names (DynamicRole).
     */
    fun validRoleNames(): List<String> {
        return listOf(
            "admin",
            "user_role",
            "viewer123",
            "role_with_numbers_2024",
            "a",
            "a".repeat(100)  // exactly at limit
        )
    }
    
    /**
     * Creates test cases for valid PropertyType IDs.
     */
    fun validPropertyTypes(): List<String> {
        return PropertyTypes.ALL.toList()
    }
    
    /**
     * Creates test cases for invalid PropertyType IDs.
     */
    fun invalidPropertyTypes(): List<String> {
        return listOf(
            "",
            "invalid_type",
            "UPPERCASE",
            "unknown",
            "null"
        )
    }
    
    /**
     * Creates test cases for boundary string lengths.
     */
    fun boundaryStrings(maxLength: Int): Map<String, String> {
        return mapOf(
            "empty" to "",
            "single" to "a",
            "maxLength" to "a".repeat(maxLength),
            "overLimit" to "a".repeat(maxLength + 1)
        )
    }
    
    // ===== Advanced Test Patterns =====
    
    /**
     * Creates a PropertyDefinition with select options.
     */
    fun selectPropertyDefinition(
        displayName: String = "Select Field",
        options: List<SelectOption> = selectOptions(),
        isRequired: Boolean = false,
        isMultiple: Boolean = false
    ): PropertyDefinition {
        val typeId = if (isMultiple) PropertyTypes.MULTI_SELECT else PropertyTypes.SELECT
        return propertyDefinition(
            typeId = typeId,
            displayName = displayName,
            config = buildJsonObject {
                put("required", isRequired)
                put("multiple", isMultiple)
                put("options", JsonArray(options.map { option ->
                    buildJsonObject {
                        put("value", option.value)
                        put("label", option.label)
                        option.color?.let { put("color", it) }
                    }
                }))
            }
        )
    }
    
    /**
     * Creates a PropertyDefinition with number constraints.
     */
    fun numberPropertyDefinition(
        displayName: String = "Number Field",
        isRequired: Boolean = false,
        min: Double? = null,
        max: Double? = null,
        precision: Int? = null
    ): PropertyDefinition {
        return propertyDefinition(
            typeId = PropertyTypes.NUMBER,
            displayName = displayName,
            config = buildJsonObject {
                put("required", isRequired)
                min?.let { put("min", it) }
                max?.let { put("max", it) }
                precision?.let { put("precision", it) }
            }
        )
    }
    
    /**
     * Creates a PropertyDefinition with text constraints.
     */
    fun textPropertyDefinition(
        displayName: String = "Text Field",
        isRequired: Boolean = false,
        maxLength: Int? = null,
        placeholder: String? = null,
        isLongText: Boolean = false
    ): PropertyDefinition {
        return propertyDefinition(
            typeId = if (isLongText) PropertyTypes.LONG_TEXT else PropertyTypes.TEXT,
            displayName = displayName,
            config = buildJsonObject {
                put("required", isRequired)
                maxLength?.let { put("maxLength", it) }
                placeholder?.let { put("placeholder", it) }
            }
        )
    }
    
    /**
     * Creates a table with various property types for testing.
     */
    fun complexTable(): Table {
        val properties = mapOf(
            "title" to textPropertyDefinition("Title", isRequired = true, maxLength = 255),
            "description" to textPropertyDefinition("Description", isLongText = true),
            "priority" to selectPropertyDefinition("Priority", 
                options = listOf(
                    selectOption("low", "Low", "#33FF57"),
                    selectOption("medium", "Medium", "#FFFF33"),
                    selectOption("high", "High", "#FF5733")
                ),
                isRequired = true
            ),
            "tags" to selectPropertyDefinition("Tags", 
                options = listOf(
                    selectOption("bug", "Bug", "#FF0000"),
                    selectOption("feature", "Feature", "#00FF00"),
                    selectOption("improvement", "Improvement", "#0000FF")
                ),
                isMultiple = true
            ),
            "score" to numberPropertyDefinition("Score", min = 0.0, max = 100.0, precision = 1),
            "completed" to propertyDefinition(PropertyTypes.CHECKBOX, "Completed", 
                buildJsonObject { put("required", false) }
            ),
            "due_date" to propertyDefinition(PropertyTypes.DATE, "Due Date")
        )
        
        return table(
            name = "Complex Test Table",
            properties = properties,
            propertyOrder = listOf("title", "description", "priority", "tags", "score", "completed", "due_date")
        )
    }
    
    /**
     * Creates a record with sample data for complex table.
     */
    fun complexRecord(tableId: TableId): Record {
        val data = buildJsonObject {
            put("title", "Sample Task")
            put("description", "This is a comprehensive test record with various property types")
            put("priority", "high")
            put("tags", JsonArray(listOf(JsonPrimitive("bug"), JsonPrimitive("improvement"))))
            put("score", 85.5)
            put("completed", false)
            put("due_date", "2024-12-31")
        }
        
        return record(tableId = tableId, data = data)
    }
    
    /**
     * Creates boundary test cases for numeric values.
     */
    fun boundaryNumbers(): Map<String, Number> {
        return mapOf(
            "zero" to 0,
            "positive" to 42,
            "negative" to -42,
            "decimal" to 3.14159,
            "maxInt" to Int.MAX_VALUE,
            "minInt" to Int.MIN_VALUE,
            "maxDouble" to Double.MAX_VALUE,
            "minDouble" to Double.MIN_VALUE
        )
    }
    
    /**
     * Creates invalid JSON test cases.
     */
    fun invalidJsonStrings(): List<String> {
        return listOf(
            "{",           // unclosed brace
            "}",           // unopened brace
            "{\"key\":}",  // missing value
            "{key:value}", // unquoted keys
            "not json"     // plain text
        )
    }
    
    // ===== ID Helper Methods =====
    
    /**
     * Creates a TableId for testing.
     */
    fun tableId(): TableId = TableId(UUID.randomUUID())
    
    /**
     * Creates a RecordId for testing.
     */
    fun recordId(): RecordId = RecordId(UUID.randomUUID())
    
    // ===== Additional PropertyDefinition Helpers =====
    
    /**
     * Creates an email property definition.
     */
    fun emailPropertyDefinition(
        displayName: String = "Email Field",
        isRequired: Boolean = false
    ): PropertyDefinition {
        return propertyDefinition(
            typeId = PropertyTypes.EMAIL,
            displayName = displayName,
            config = buildJsonObject {
                put("required", isRequired)
            }
        )
    }
    
    /**
     * Creates a phone property definition.
     */
    fun phonePropertyDefinition(
        displayName: String = "Phone Field",
        isRequired: Boolean = false
    ): PropertyDefinition {
        return propertyDefinition(
            typeId = PropertyTypes.PHONE,
            displayName = displayName,
            config = buildJsonObject {
                put("required", isRequired)
            }
        )
    }
    
    /**
     * Creates a URL property definition.
     */
    fun urlPropertyDefinition(
        displayName: String = "URL Field",
        isRequired: Boolean = false
    ): PropertyDefinition {
        return propertyDefinition(
            typeId = PropertyTypes.URL,
            displayName = displayName,
            config = buildJsonObject {
                put("required", isRequired)
            }
        )
    }
}