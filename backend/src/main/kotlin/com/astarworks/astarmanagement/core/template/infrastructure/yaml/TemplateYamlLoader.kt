package com.astarworks.astarmanagement.core.template.infrastructure.yaml

import com.astarworks.astarmanagement.core.template.domain.model.Template
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import com.astarworks.astarmanagement.core.table.domain.model.PropertyType
import com.charleskorn.kaml.Yaml
import com.charleskorn.kaml.YamlConfiguration
import kotlinx.serialization.Contextual
import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.serialization.decodeFromString
import kotlinx.serialization.json.*
import org.slf4j.LoggerFactory
import org.springframework.core.io.ClassPathResource
import org.springframework.stereotype.Component
import java.time.Instant

/**
 * YAMLファイルからテンプレートを読み込むローダー
 * 
 * YAMLファイル形式:
 * ```yaml
 * id: business.task
 * name: タスク
 * description: タスク管理用テンプレート
 * tags: 
 *   - business
 *   - task-management
 * properties:
 *   title:
 *     typeId: text
 *     displayName: タイトル
 *     required: true
 *   status:
 *     typeId: select
 *     displayName: ステータス
 *     options:
 *       - value: todo
 *         label: 未着手
 * metadata:
 *   temporary: false
 *   version: 1.0
 * ```
 */
@Component
class TemplateYamlLoader {
    
    private val logger = LoggerFactory.getLogger(TemplateYamlLoader::class.java)
    
    private val yaml = Yaml(
        configuration = YamlConfiguration(
            strictMode = false,
            encodeDefaults = false
        )
    )
    
    /**
     * 指定されたパスからテンプレートを読み込む
     */
    fun loadTemplate(yamlPath: String): Template? {
        return try {
            logger.debug("Loading template from: $yamlPath")
            
            val resource = ClassPathResource(yamlPath)
            if (!resource.exists()) {
                logger.warn("Template YAML file not found: $yamlPath")
                return null
            }
            
            val yamlContent = resource.inputStream.use { input ->
                val yamlString = input.bufferedReader().use { it.readText() }
                yaml.decodeFromString<TemplateYaml>(yamlString)
            }
            
            val template = convertToTemplate(yamlContent)
            logger.debug("Successfully loaded template: ${template.id}")
            
            template
        } catch (e: Exception) {
            logger.error("Failed to load template from $yamlPath", e)
            null
        }
    }
    
    /**
     * 指定されたディレクトリ配下の全YAMLファイルからテンプレートを読み込む
     */
    fun loadTemplatesFromDirectory(directoryPath: String): List<Template> {
        logger.debug("Loading templates from directory: $directoryPath")
        
        val templates = mutableListOf<Template>()
        
        try {
            // 簡易実装：既知のファイル名で読み込み
            // 実際の実装ではディレクトリスキャンが必要
            val knownFiles = listOf(
                "task.yaml",
                "customer.yaml", 
                "project.yaml",
                "expense.yaml",
                "inventory.yaml"
            )
            
            knownFiles.forEach { fileName ->
                val fullPath = "$directoryPath/$fileName"
                loadTemplate(fullPath)?.let { template ->
                    templates.add(template)
                }
            }
            
            logger.info("Loaded ${templates.size} templates from $directoryPath")
            
        } catch (e: Exception) {
            logger.error("Failed to load templates from directory $directoryPath", e)
        }
        
        return templates
    }
    
    /**
     * YAMLデータからTemplateドメインオブジェクトに変換
     */
    private fun convertToTemplate(yaml: TemplateYaml): Template {
        val properties = yaml.properties.mapValues { (_, propYaml) ->
            val config = buildJsonObject {
                // 既存の config を追加
                propYaml.config?.forEach { (key, value) ->
                    put(key, JsonPrimitive(value.toString()))
                }
                
                // required を config に統合
                if (propYaml.required == true) {
                    put("required", JsonPrimitive(true))
                }
                
                // validationRules を config に統合  
                propYaml.validationRules?.forEach { (key, value) ->
                    put(key, JsonPrimitive(value.toString()))
                }
            }
            
            val propertyType = PropertyType.fromValue(propYaml.typeId) ?: throw IllegalArgumentException("Unknown property type: ${propYaml.typeId}")
            PropertyDefinition(
                type = propertyType,
                displayName = propYaml.displayName,
                config = config
            )
        }
        
        return Template(
            id = yaml.id,
            name = yaml.name,
            description = yaml.description,
            tags = yaml.tags,
            properties = properties,
            propertyOrder = yaml.propertyOrder ?: properties.keys.toList(),
            metadata = yaml.metadata,
            version = yaml.version ?: "1.0",
            createdAt = Instant.now()
        )
    }
}

/**
 * YAML用のデータクラス
 */
@Serializable
data class TemplateYaml(
    val id: String,
    val name: String,
    val description: String? = null,
    val tags: List<String> = emptyList(),
    val properties: Map<String, PropertyYaml> = emptyMap(),
    @SerialName("propertyOrder")
    val propertyOrder: List<String>? = null,
    val metadata: JsonObject = JsonObject(emptyMap()),
    val version: String? = null
)

@Serializable
data class PropertyYaml(
    @SerialName("typeId")
    val typeId: String,
    @SerialName("displayName")
    val displayName: String,
    val required: Boolean? = null,
    val config: JsonObject? = null,
    @SerialName("validationRules")
    val validationRules: JsonObject? = null
)