package com.astarworks.astarmanagement.core.table.helper

import com.astarworks.astarmanagement.core.table.domain.model.*
import com.astarworks.astarmanagement.core.workspace.domain.model.Workspace
import com.astarworks.astarmanagement.shared.domain.value.*
import org.assertj.core.api.Assertions.assertThat
import java.util.UUID

/**
 * Assertion helper for flexible table system tests.
 * Provides fluent assertion methods for validating domain objects.
 */
object TableAssertions {
    
    /**
     * Asserts workspace properties.
     */
    fun assertWorkspaceProperties(
        workspace: Workspace,
        name: String? = null,
        tenantId: UUID? = null
    ) {
        name?.let {
            assertThat(workspace.name)
                .describedAs("Workspace name")
                .isEqualTo(it)
        }
        
        if (tenantId != null) {
            assertThat(workspace.tenantId)
                .describedAs("Workspace tenant ID")
                .isEqualTo(tenantId)
        }
        
        assertThat(workspace.id)
            .describedAs("Workspace ID")
            .isNotNull()
        
        assertThat(workspace.createdAt)
            .describedAs("Workspace created timestamp")
            .isNotNull()
        
        assertThat(workspace.updatedAt)
            .describedAs("Workspace updated timestamp")
            .isNotNull()
    }
    
    /**
     * Asserts table properties.
     */
    fun assertTableProperties(
        table: Table,
        name: String? = null,
        workspaceId: UUID? = null,
        propertyCount: Int? = null
    ) {
        name?.let {
            assertThat(table.name)
                .describedAs("Table name")
                .isEqualTo(it)
        }
        
        workspaceId?.let {
            assertThat(table.workspaceId)
                .describedAs("Table workspace ID")
                .isEqualTo(it)
        }
        
        propertyCount?.let {
            assertThat(table.properties)
                .describedAs("Table properties")
                .hasSize(it)
        }
        
        assertThat(table.id)
            .describedAs("Table ID")
            .isNotNull()
        
        // Verify property order consistency
        assertThat(table.propertyOrder)
            .describedAs("Property order keys")
            .allMatch { key -> table.properties.containsKey(key) }
    }
    
    /**
     * Asserts record properties.
     */
    fun assertRecordProperties(
        record: Record,
        tableId: UUID? = null,
        position: Float? = null,
        dataKeys: Set<String>? = null
    ) {
        tableId?.let {
            assertThat(record.tableId)
                .describedAs("Record table ID")
                .isEqualTo(it)
        }
        
        position?.let {
            assertThat(record.position)
                .describedAs("Record position")
                .isEqualTo(it)
        }
        
        dataKeys?.let {
            assertThat(record.data.keys)
                .describedAs("Record data keys")
                .isEqualTo(it)
        }
        
        assertThat(record.id)
            .describedAs("Record ID")
            .isNotNull()
        
        assertThat(record.position)
            .describedAs("Record position")
            .isGreaterThan(0f)
    }
    
    /**
     * Asserts property type catalog properties.
     * @deprecated PropertyTypeCatalog has been removed from the system
     */
    // fun assertPropertyType(
    //     type: PropertyTypeCatalog,
    //     id: String? = null,
    //     category: PropertyTypeCategory? = null,
    //     isActive: Boolean? = null,
    //     isCustom: Boolean? = null
    // ) {
    //     id?.let {
    //         assertThat(type.id)
    //             .describedAs("Property type ID")
    //             .isEqualTo(it)
    //     }
    //     
    //     category?.let {
    //         assertThat(type.category)
    //             .describedAs("Property type category")
    //             .isEqualTo(it)
    //     }
    //     
    //     isActive?.let {
    //         assertThat(type.isActive)
    //             .describedAs("Property type active status")
    //             .isEqualTo(it)
    //     }
    //     
    //     isCustom?.let {
    //         assertThat(type.isCustom)
    //             .describedAs("Property type custom status")
    //             .isEqualTo(it)
    //     }
    // }
    
    /**
     * Asserts property definition properties.
     */
    fun assertPropertyDefinition(
        definition: PropertyDefinition,
        type: PropertyType? = null,
        displayName: String? = null,
        isRequired: Boolean? = null
    ) {
        type?.let {
            assertThat(definition.type)
                .describedAs("Property definition type")
                .isEqualTo(it)
        }
        
        displayName?.let {
            assertThat(definition.displayName)
                .describedAs("Property definition display name")
                .isEqualTo(it)
        }
        
        isRequired?.let { required ->
            assertThat(definition.isRequired)
                .describedAs("Property definition required status")
                .isEqualTo(required)
        }
    }
    
    /**
     * Asserts validation errors.
     */
    fun assertValidationErrors(
        errors: List<String>,
        expectedErrors: List<String>
    ) {
        assertThat(errors)
            .describedAs("Validation errors")
            .containsExactlyInAnyOrderElementsOf(expectedErrors)
    }
    
    /**
     * Asserts that validation passed (no errors).
     */
    fun assertNoValidationErrors(errors: List<String>) {
        assertThat(errors)
            .describedAs("Validation errors")
            .isEmpty()
    }
    
    /**
     * Asserts record position ordering.
     */
    fun assertRecordOrdering(records: List<Record>) {
        if (records.size <= 1) return
        
        for (i in 0 until records.size - 1) {
            assertThat(records[i].position)
                .describedAs("Record ${i} position should be less than record ${i + 1}")
                .isLessThan(records[i + 1].position)
        }
    }
    
    /**
     * Asserts that records belong to the same table.
     */
    fun assertSameTable(records: List<Record>, tableId: UUID) {
        assertThat(records)
            .describedAs("All records should belong to table $tableId")
            .allMatch { it.tableId == TableId(tableId) }
    }
    
    /**
     * Asserts tenant isolation.
     */
    fun assertTenantIsolation(workspace: Workspace, expectedTenantId: UUID) {
        assertThat(workspace.belongsToTenant(TenantId(expectedTenantId)))
            .describedAs("Workspace should belong to tenant $expectedTenantId")
            .isTrue()
        
        assertThat(workspace.tenantId)
            .describedAs("Workspace tenant ID")
            .isEqualTo(expectedTenantId)
    }
    
    /**
     * Asserts table template properties.
     */
    fun assertTaskTemplate(table: Table) {
        assertThat(table.properties)
            .describedAs("Task template should have standard properties")
            .containsKeys("title", "status", "assignee", "due_date", "description")
        
        assertThat(table.properties["title"]?.type)
            .describedAs("Title should be text type")
            .isEqualTo(PropertyType.TEXT)
        
        assertThat(table.properties["status"]?.type)
            .describedAs("Status should be select type")
            .isEqualTo(PropertyType.SELECT)
    }
    
    /**
     * Asserts customer template properties.
     */
    fun assertCustomerTemplate(table: Table) {
        assertThat(table.properties)
            .describedAs("Customer template should have standard properties")
            .containsKeys("name", "email", "phone", "company", "status", "notes")
        
        assertThat(table.properties["email"]?.type)
            .describedAs("Email should be email type")
            .isEqualTo(PropertyType.EMAIL)
        
        assertThat(table.properties["phone"]?.type)
            .describedAs("Phone should be phone type")
            .isEqualTo(PropertyType.TEXT) // Phone type removed
    }
}