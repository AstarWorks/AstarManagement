package com.astarworks.astarmanagement.core.template.domain.service

import com.astarworks.astarmanagement.core.template.domain.model.Template
import com.astarworks.astarmanagement.core.template.domain.repository.TemplateRepository
import com.astarworks.astarmanagement.core.table.domain.model.PropertyDefinition
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional

/**
 * テンプレートサービス（永続的なコア機能）
 * 業界固有の詳細は関知せず、汎用的なテンプレート機能のみ提供
 */
@Service
@Transactional
class TemplateService(
    private val templateRepository: TemplateRepository
) {
    private val logger = LoggerFactory.getLogger(TemplateService::class.java)
    
    /**
     * テンプレートを取得
     */
    @Transactional(readOnly = true)
    fun getTemplate(templateId: String): Template? {
        logger.debug("Getting template: $templateId")
        return templateRepository.findById(templateId)
    }
    
    /**
     * タグ別のテンプレート一覧を取得
     */
    @Transactional(readOnly = true)
    fun listTemplatesByTag(tag: String): List<Template> {
        logger.debug("Listing templates by tag: $tag")
        return templateRepository.findByTag(tag)
    }
    
    /**
     * 複数のタグのうち1つでも持つテンプレート一覧を取得
     */
    @Transactional(readOnly = true)
    fun listTemplatesByAnyTag(tags: Collection<String>): List<Template> {
        logger.debug("Listing templates by any tag: $tags")
        return templateRepository.findByAnyTag(tags)
    }
    
    /**
     * 全テンプレート一覧を取得
     */
    @Transactional(readOnly = true)
    fun listAllTemplates(): List<Template> {
        logger.debug("Listing all templates")
        return templateRepository.findAll()
    }
    
    /**
     * テンプレートからテーブル作成用のプロパティセットを生成
     * 
     * @param templateId テンプレートID
     * @return テーブル名とプロパティ定義のペア、テンプレートが見つからない場合はnull
     */
    fun createTableProperties(templateId: String): Pair<String, Map<String, PropertyDefinition>>? {
        logger.debug("Creating table properties from template: $templateId")
        
        val template = getTemplate(templateId) ?: run {
            logger.warn("Template not found: $templateId")
            return null
        }
        
        logger.debug("Generated table properties for template: $templateId")
        return template.name to template.getTableProperties()
    }
    
    /**
     * テンプレートが存在するかチェック
     */
    @Transactional(readOnly = true)
    fun templateExists(templateId: String): Boolean {
        return templateRepository.existsById(templateId)
    }
    
    /**
     * 利用可能なタグ一覧を取得
     */
    @Transactional(readOnly = true)
    fun getAvailableTags(): List<String> {
        val allTemplates = listAllTemplates()
        return allTemplates.flatMap { it.tags }.distinct().sorted()
    }
    
    /**
     * テンプレートの詳細情報を取得（メタデータ含む）
     */
    @Transactional(readOnly = true)
    fun getTemplateDetails(templateId: String): Template? {
        return getTemplate(templateId)
    }
}