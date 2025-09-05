package com.astarworks.astarmanagement.core.template.infrastructure

import com.astarworks.astarmanagement.core.template.domain.model.Template
import com.astarworks.astarmanagement.core.template.domain.repository.TemplateRepository
import com.astarworks.astarmanagement.core.template.infrastructure.yaml.TemplateYamlLoader
import org.slf4j.LoggerFactory
import org.springframework.stereotype.Repository

@Repository
class YamlTemplateRepository(
    private val yamlLoader: TemplateYamlLoader
) : TemplateRepository {
    
    private val logger = LoggerFactory.getLogger(YamlTemplateRepository::class.java)
    
    private val templates: Map<String, Template> by lazy {
        loadAllTemplates()
    }
    
    override fun findById(id: String): Template? {
        logger.debug("Finding template by ID: $id")
        return templates[id]
    }
    
    override fun findByTag(tag: String): List<Template> {
        logger.debug("Finding templates by tag: $tag")
        return templates.values.filter { it.hasTag(tag) }
    }
    
    override fun findByAnyTag(tags: Collection<String>): List<Template> {
        logger.debug("Finding templates by any tag: $tags")
        return templates.values.filter { it.hasAnyTag(tags) }
    }
    
    override fun findAll(): List<Template> {
        logger.debug("Finding all templates")
        return templates.values.toList()
    }
    
    override fun existsById(id: String): Boolean {
        return templates.containsKey(id)
    }
    
    private fun loadAllTemplates(): Map<String, Template> {
        logger.info("Loading all YAML templates")
        
        val allTemplates = mutableListOf<Template>()
        
        try {
            val businessTemplates = yamlLoader.loadTemplatesFromDirectory("templates/business")
            allTemplates.addAll(businessTemplates)
            
            logger.info("Loaded ${businessTemplates.size} business templates")
            
        } catch (e: Exception) {
            logger.error("Failed to load YAML templates", e)
            throw IllegalStateException("Could not load YAML templates", e)
        }
        
        val templateMap = allTemplates.associateBy { it.id }
        
        if (templateMap.size != allTemplates.size) {
            val duplicateIds = allTemplates.groupBy { it.id }
                .filter { it.value.size > 1 }
                .keys
            throw IllegalStateException("Duplicate template IDs found in YAML files: $duplicateIds")
        }
        
        logger.info("Successfully loaded ${templateMap.size} unique templates from YAML")
        
        return templateMap
    }
}