package com.astarworks.astarmanagement.core.template.domain.repository

import com.astarworks.astarmanagement.core.template.domain.model.Template

/**
 * テンプレートリポジトリ（永続的なコアインターフェース）
 * 
 * 実装は以下の段階で変更される予定：
 * - Stage 0: TemporaryTemplateRepository（削除予定）
 * - Stage 1: YamlTemplateRepository（永続的）
 * - Stage 2: DatabaseTemplateRepository（拡張）
 */
interface TemplateRepository {
    
    /**
     * テンプレートIDでテンプレートを取得
     */
    fun findById(id: String): Template?
    
    /**
     * タグでテンプレートを取得
     */
    fun findByTag(tag: String): List<Template>
    
    /**
     * 複数のタグのうち1つでも持つテンプレートを取得
     */
    fun findByAnyTag(tags: Collection<String>): List<Template>
    
    /**
     * 全テンプレートを取得
     */
    fun findAll(): List<Template>
    
    /**
     * テンプレートが存在するかチェック
     */
    fun existsById(id: String): Boolean
}