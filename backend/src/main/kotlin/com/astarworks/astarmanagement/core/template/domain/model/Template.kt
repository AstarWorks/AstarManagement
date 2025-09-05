package com.astarworks.astarmanagement.core.template.domain.model

import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import java.time.Instant

/**
 * テンプレート（永続的なコアモデル）
 * 業界固有の定義とは完全に分離した汎用的なテンプレートモデル
 * 
 * @property id テンプレートID（例: "business.task", "legal.case"）
 * @property name 表示名
 * @property description 説明
 * @property tags タグリスト（将来のフィルタリング・分類用）
 * @property properties プロパティ定義
 * @property propertyOrder プロパティの表示順序
 * @property metadata メタデータ
 * @property version バージョン
 * @property createdAt 作成日時
 */
data class Template(
    val id: String,
    val name: String,
    val description: String? = null,
    val tags: List<String> = emptyList(),
    val properties: Map<String, PropertyDefinition>,
    val propertyOrder: List<String> = properties.keys.toList(),
    val metadata: Map<String, Any> = emptyMap(),
    val version: String = "1.0",
    val createdAt: Instant = Instant.now()
) {
    init {
        require(id.isNotBlank()) { "Template ID must not be blank" }
        require(name.isNotBlank()) { "Template name must not be blank" }
        require(id.matches(Regex("^[a-z0-9._-]+$"))) { 
            "Template ID can only contain lowercase letters, numbers, dots, underscores and hyphens" 
        }
    }
    
    /**
     * テーブル作成時に使用するプロパティセットを取得
     */
    fun getTableProperties(): Map<String, PropertyDefinition> = properties
    
    /**
     * プロパティの表示順序を取得（フォールバック付き）
     */
    fun getOrderedProperties(): List<String> = propertyOrder.ifEmpty { properties.keys.toList() }
    
    /**
     * メタデータ値を取得（型安全）
     */
    inline fun <reified T> getMetadata(key: String): T? {
        return metadata[key] as? T
    }
    
    /**
     * このテンプレートが暫定的なものかどうか
     */
    fun isTemporary(): Boolean = getMetadata<Boolean>("temporary") == true
    
    /**
     * 指定されたタグを持っているかチェック
     */
    fun hasTag(tag: String): Boolean = tags.contains(tag)
    
    /**
     * 複数のタグのうち1つでも持っているかチェック
     */
    fun hasAnyTag(tags: Collection<String>): Boolean = tags.any { this.tags.contains(it) }
}