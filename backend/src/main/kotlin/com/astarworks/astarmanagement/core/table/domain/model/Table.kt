package com.astarworks.astarmanagement.core.table.domain.model

import com.astarworks.astarmanagement.shared.domain.value.TableId
import com.astarworks.astarmanagement.shared.domain.value.WorkspaceId
import java.time.Instant
import java.util.UUID

/**
 * テーブル
 * Notionのデータベースに相当する動的テーブル定義
 * 
 * @property id テーブルID
 * @property workspaceId 所属するワークスペースID  
 * @property name テーブル名
 * @property properties プロパティ定義（key: プロパティキー, value: PropertyDefinition）
 * @property propertyOrder プロパティの表示順序
 * @property createdAt 作成日時
 * @property updatedAt 更新日時
 */
data class Table(
    val id: TableId = TableId(java.util.UUID.randomUUID()),
    val workspaceId: WorkspaceId,
    val name: String,
    val description: String? = null,
    val properties: Map<String, PropertyDefinition> = emptyMap(),
    val propertyOrder: List<String> = emptyList(),
    val createdAt: Instant = Instant.now(),
    val updatedAt: Instant = Instant.now()
) {
    init {
        require(name.isNotBlank()) { "Table name must not be blank" }
        require(name.length <= 255) { "Table name must not exceed 255 characters" }
        description?.let {
            require(it.length <= 1000) { "Table description must not exceed 1000 characters" }
        }
        validatePropertyOrder()
    }
    
    /**
     * プロパティ順序の検証
     */
    private fun validatePropertyOrder() {
        val propertyKeys = properties.keys
        val orderKeys = propertyOrder.toSet()
        
        // 順序リストのキーがすべてプロパティに存在することを確認
        orderKeys.forEach { key ->
            require(key in propertyKeys) {
                "Property order contains unknown key: $key"
            }
        }
    }
    
    /**
     * プロパティを追加
     */
    fun addProperty(key: String, definition: PropertyDefinition): Table {
        require(key.isNotBlank()) { "Property key must not be blank" }
        
        if (key in properties) {
            throw com.astarworks.astarmanagement.core.table.api.exception.DuplicatePropertyKeyException.of(key, id)
        }
        
        return copy(
            properties = properties + (key to definition),
            propertyOrder = propertyOrder + key,
            updatedAt = Instant.now()
        )
    }
    
    /**
     * プロパティを更新
     */
    fun updateProperty(key: String, definition: PropertyDefinition): Table {
        require(key in properties) { "Property with key '$key' does not exist" }
        
        return copy(
            properties = properties + (key to definition),
            updatedAt = Instant.now()
        )
    }
    
    /**
     * プロパティを削除
     */
    fun removeProperty(key: String): Table {
        require(key in properties) { "Property with key '$key' does not exist" }
        
        return copy(
            properties = properties - key,
            propertyOrder = propertyOrder.filter { it != key },
            updatedAt = Instant.now()
        )
    }
    
    /**
     * プロパティの順序を変更
     */
    fun reorderProperties(newOrder: List<String>): Table {
        val currentKeys = properties.keys
        val newOrderSet = newOrder.toSet()
        
        // 新しい順序がすべてのプロパティを含むことを確認
        require(newOrderSet == currentKeys) {
            "New order must contain exactly the same properties"
        }
        
        return copy(
            propertyOrder = newOrder,
            updatedAt = Instant.now()
        )
    }
    
    /**
     * テーブル名を更新
     */
    fun rename(newName: String): Table {
        require(newName.isNotBlank()) { "Table name must not be blank" }
        require(newName.length <= 255) { "Table name must not exceed 255 characters" }
        
        return copy(
            name = newName,
            updatedAt = Instant.now()
        )
    }
    
    /**
     * テーブルの説明を更新
     */
    fun updateDescription(newDescription: String?): Table {
        newDescription?.let {
            require(it.length <= 1000) { "Table description must not exceed 1000 characters" }
        }
        
        return copy(
            description = newDescription,
            updatedAt = Instant.now()
        )
    }
    
    /**
     * プロパティを取得
     */
    fun getProperty(key: String): PropertyDefinition? {
        return properties[key]
    }
    
    /**
     * 順序付きプロパティリストを取得
     */
    fun getOrderedProperties(): List<Pair<String, PropertyDefinition>> {
        val orderedKeys = if (propertyOrder.isNotEmpty()) {
            propertyOrder
        } else {
            properties.keys.toList()
        }
        
        return orderedKeys.mapNotNull { key ->
            properties[key]?.let { key to it }
        }
    }
    
    /**
     * プロパティ数を取得
     */
    fun getPropertyCount(): Int = properties.size
    
    /**
     * 空のテーブルかどうか
     */
    fun isEmpty(): Boolean = properties.isEmpty()
    
    companion object {
        /**
         * 新しいテーブルを作成
         */
        fun create(
            workspaceId: WorkspaceId,
            name: String,
            description: String? = null,
            properties: Map<String, PropertyDefinition> = emptyMap()
        ): Table {
            return Table(
                workspaceId = workspaceId,
                name = name,
                description = description,
                properties = properties,
                propertyOrder = properties.keys.toList()
            )
        }
        
    }
}