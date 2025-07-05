package dev.ryuzu.astermanagement.service

import dev.ryuzu.astermanagement.modules.matter.domain.Matter
import dev.ryuzu.astermanagement.modules.matter.domain.MatterRepository
import dev.ryuzu.astermanagement.dto.matter.*
import org.springframework.data.domain.Page
import org.springframework.data.domain.PageImpl
import org.springframework.data.domain.Pageable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import jakarta.persistence.EntityManager
import jakarta.persistence.Query
import java.util.regex.Pattern

/**
 * Service for handling matter search operations.
 * Provides full-text search, query parsing, and result highlighting.
 */
@Service
@Transactional(readOnly = true)
class MatterSearchService(
    private val matterRepository: MatterRepository,
    private val entityManager: EntityManager
) {

    /**
     * Performs full-text search across matters with highlighting.
     * 
     * @param query Search query string
     * @param searchType Type of search to perform
     * @param pageable Pagination parameters
     * @return Page of search results with highlights
     */
    fun searchMatters(
        query: String,
        searchType: SearchType = SearchType.FULL_TEXT,
        pageable: Pageable
    ): Page<MatterSearchResultDto> {
        if (query.isBlank()) {
            return PageImpl(emptyList(), pageable, 0)
        }

        return when (searchType) {
            SearchType.FULL_TEXT -> performFullTextSearch(query, pageable)
            SearchType.BASIC -> performBasicSearch(query, pageable)
            SearchType.ADVANCED -> performAdvancedSearch(query, pageable)
        }
    }

    /**
     * Gets search suggestions for autocomplete.
     * 
     * @param query Partial query string
     * @param limit Maximum number of suggestions
     * @return List of search suggestions
     */
    fun getSearchSuggestions(query: String, limit: Int = 10): List<SearchSuggestionDto> {
        if (query.length < 2) {
            return emptyList()
        }

        val suggestions = mutableListOf<SearchSuggestionDto>()
        
        // Case number suggestions
        val caseNumberQuery = """
            SELECT DISTINCT case_number, COUNT(*) as count
            FROM matters 
            WHERE LOWER(case_number) LIKE LOWER(?)
            GROUP BY case_number
            ORDER BY count DESC
            LIMIT ?
        """.trimIndent()
        
        val caseResults = entityManager.createNativeQuery(caseNumberQuery)
            .setParameter(1, "%$query%")
            .setParameter(2, limit / 3)
            .resultList as List<Array<Any>>
        
        caseResults.forEach { result ->
            suggestions.add(
                SearchSuggestionDto(
                    value = result[0] as String,
                    type = SearchSuggestionType.CASE_NUMBER,
                    count = (result[1] as Number).toInt()
                )
            )
        }

        // Client name suggestions
        val clientQuery = """
            SELECT DISTINCT client_name, COUNT(*) as count
            FROM matters 
            WHERE LOWER(client_name) LIKE LOWER(?)
            GROUP BY client_name
            ORDER BY count DESC
            LIMIT ?
        """.trimIndent()
        
        val clientResults = entityManager.createNativeQuery(clientQuery)
            .setParameter(1, "%$query%")
            .setParameter(2, limit / 3)
            .resultList as List<Array<Any>>
        
        clientResults.forEach { result ->
            suggestions.add(
                SearchSuggestionDto(
                    value = result[0] as String,
                    type = SearchSuggestionType.CLIENT_NAME,
                    count = (result[1] as Number).toInt()
                )
            )
        }

        // Title suggestions (partial matches)
        val titleQuery = """
            SELECT DISTINCT title, COUNT(*) as count
            FROM matters 
            WHERE LOWER(title) LIKE LOWER(?)
            GROUP BY title
            ORDER BY count DESC
            LIMIT ?
        """.trimIndent()
        
        val titleResults = entityManager.createNativeQuery(titleQuery)
            .setParameter(1, "%$query%")
            .setParameter(2, limit / 3)
            .resultList as List<Array<Any>>
        
        titleResults.forEach { result ->
            suggestions.add(
                SearchSuggestionDto(
                    value = result[0] as String,
                    type = SearchSuggestionType.TITLE,
                    count = (result[1] as Number).toInt()
                )
            )
        }

        return suggestions.sortedByDescending { it.count }.take(limit)
    }

    /**
     * Parses search query into structured components.
     */
    fun parseSearchQuery(query: String): ParsedSearchQuery {
        val terms = mutableListOf<String>()
        val filters = mutableMapOf<String, String>()
        val operators = mutableSetOf<SearchOperator>()
        
        // Handle quoted phrases
        val quotePattern = Pattern.compile("\"([^\"]+)\"")
        val quoteMatcher = quotePattern.matcher(query)
        var processedQuery = query
        
        while (quoteMatcher.find()) {
            val phrase = quoteMatcher.group(1)
            terms.add(phrase)
            operators.add(SearchOperator.EXACT_PHRASE)
            processedQuery = processedQuery.replace(quoteMatcher.group(0), "")
        }
        
        // Handle field-specific searches (e.g., client:ABC)
        val fieldPattern = Pattern.compile("(\\w+):(\\w+)")
        val fieldMatcher = fieldPattern.matcher(processedQuery)
        
        while (fieldMatcher.find()) {
            val field = fieldMatcher.group(1)
            val value = fieldMatcher.group(2)
            filters[field] = value
            operators.add(SearchOperator.FIELD_SPECIFIC)
            processedQuery = processedQuery.replace(fieldMatcher.group(0), "")
        }
        
        // Handle remaining terms
        val remainingTerms = processedQuery.trim()
            .split("\\s+".toRegex())
            .filter { it.isNotBlank() }
        
        terms.addAll(remainingTerms)
        
        // Detect operators
        if (query.contains(" AND ", ignoreCase = true)) {
            operators.add(SearchOperator.AND)
        }
        if (query.contains(" OR ", ignoreCase = true)) {
            operators.add(SearchOperator.OR)
        }
        if (query.contains("-")) {
            operators.add(SearchOperator.NOT)
        }
        
        return ParsedSearchQuery(
            query = query,
            terms = terms,
            filters = filters,
            operators = operators
        )
    }

    private fun performFullTextSearch(query: String, pageable: Pageable): Page<MatterSearchResultDto> {
        val searchQuery = """
            SELECT m.*, ts_rank(m.search_vector, plainto_tsquery('simple', ?)) as rank,
                   ts_headline('simple', m.title, plainto_tsquery('simple', ?)) as title_highlight,
                   ts_headline('simple', m.client_name, plainto_tsquery('simple', ?)) as client_highlight,
                   ts_headline('simple', COALESCE(m.description, ''), plainto_tsquery('simple', ?)) as desc_highlight
            FROM matters m
            WHERE m.search_vector @@ plainto_tsquery('simple', ?)
            ORDER BY rank DESC, m.created_at DESC
            OFFSET ? LIMIT ?
        """.trimIndent()

        val countQuery = """
            SELECT COUNT(*)
            FROM matters m
            WHERE m.search_vector @@ plainto_tsquery('simple', ?)
        """.trimIndent()

        val results = entityManager.createNativeQuery(searchQuery)
            .setParameter(1, query)
            .setParameter(2, query)
            .setParameter(3, query)
            .setParameter(4, query)
            .setParameter(5, query)
            .setParameter(6, pageable.offset.toInt())
            .setParameter(7, pageable.pageSize)
            .resultList as List<Array<Any>>

        val totalCount = entityManager.createNativeQuery(countQuery)
            .setParameter(1, query)
            .singleResult as Number

        val searchResults = results.map { row ->
            val highlights = mutableMapOf<String, List<String>>()
            
            // Extract highlights from ts_headline results
            val titleHighlight = row[row.size - 3] as? String
            val clientHighlight = row[row.size - 2] as? String
            val descHighlight = row[row.size - 1] as? String
            
            if (!titleHighlight.isNullOrBlank() && titleHighlight.contains("<b>")) {
                highlights["title"] = extractHighlights(titleHighlight)
            }
            if (!clientHighlight.isNullOrBlank() && clientHighlight.contains("<b>")) {
                highlights["clientName"] = extractHighlights(clientHighlight)
            }
            if (!descHighlight.isNullOrBlank() && descHighlight.contains("<b>")) {
                highlights["description"] = extractHighlights(descHighlight)
            }

            MatterSearchResultDto(
                id = java.util.UUID.fromString(row[0] as String),
                caseNumber = row[1] as String,
                title = row[2] as String,
                clientName = row[5] as String,
                status = dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus.valueOf(row[6] as String),
                priority = dev.ryuzu.astermanagement.modules.matter.domain.MatterPriority.valueOf(row[7] as String),
                highlights = highlights,
                relevanceScore = (row[row.size - 4] as Number).toDouble(),
                assignedLawyerName = null, // Would need join to get this
                filingDate = (row[8] as? java.sql.Date)?.toLocalDate(),
                createdAt = (row[row.size - 6] as java.sql.Timestamp).toLocalDateTime()
            )
        }

        return PageImpl(searchResults, pageable, totalCount.toLong())
    }

    private fun performBasicSearch(query: String, pageable: Pageable): Page<MatterSearchResultDto> {
        // Basic search using LIKE queries
        val searchQuery = """
            SELECT m.*
            FROM matters m
            WHERE LOWER(m.case_number) LIKE LOWER(?)
               OR LOWER(m.title) LIKE LOWER(?)
               OR LOWER(m.client_name) LIKE LOWER(?)
            ORDER BY 
                CASE 
                    WHEN LOWER(m.case_number) LIKE LOWER(?) THEN 1
                    WHEN LOWER(m.title) LIKE LOWER(?) THEN 2
                    WHEN LOWER(m.client_name) LIKE LOWER(?) THEN 3
                    ELSE 4
                END,
                m.created_at DESC
            OFFSET ? LIMIT ?
        """.trimIndent()

        val likeQuery = "%$query%"
        val results = entityManager.createNativeQuery(searchQuery, Matter::class.java)
            .setParameter(1, likeQuery)
            .setParameter(2, likeQuery)
            .setParameter(3, likeQuery)
            .setParameter(4, likeQuery)
            .setParameter(5, likeQuery)
            .setParameter(6, likeQuery)
            .setParameter(7, pageable.offset.toInt())
            .setParameter(8, pageable.pageSize)
            .resultList as List<Matter>

        val searchResults = results.mapIndexed { index, matter ->
            MatterSearchResultDto(
                id = matter.id!!,
                caseNumber = matter.caseNumber,
                title = matter.title,
                clientName = matter.clientName,
                status = matter.status,
                priority = matter.priority,
                highlights = emptyMap(),
                relevanceScore = 1.0 - (index * 0.1), // Simple scoring
                assignedLawyerName = matter.assignedLawyer?.let { "${it.firstName} ${it.lastName}" },
                filingDate = matter.filingDate,
                createdAt = matter.createdAt!!
            )
        }

        // Simple count query for basic search
        val countQuery = """
            SELECT COUNT(*)
            FROM matters m
            WHERE LOWER(m.case_number) LIKE LOWER(?)
               OR LOWER(m.title) LIKE LOWER(?)
               OR LOWER(m.client_name) LIKE LOWER(?)
        """.trimIndent()

        val totalCount = entityManager.createNativeQuery(countQuery)
            .setParameter(1, likeQuery)
            .setParameter(2, likeQuery)
            .setParameter(3, likeQuery)
            .singleResult as Number

        return PageImpl(searchResults, pageable, totalCount.toLong())
    }

    private fun performAdvancedSearch(query: String, pageable: Pageable): Page<MatterSearchResultDto> {
        val parsedQuery = parseSearchQuery(query)
        
        // For now, fall back to full-text search
        // TODO: Implement proper advanced search with parsed operators
        return performFullTextSearch(query, pageable)
    }

    private fun extractHighlights(highlightedText: String): List<String> {
        val highlights = mutableListOf<String>()
        val pattern = Pattern.compile("<b>(.*?)</b>")
        val matcher = pattern.matcher(highlightedText)
        
        while (matcher.find()) {
            highlights.add(matcher.group(1))
        }
        
        return highlights
    }
}