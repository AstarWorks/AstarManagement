package dev.ryuzu.astermanagement.dto.matter

import dev.ryuzu.astermanagement.domain.matter.MatterStatus
import dev.ryuzu.astermanagement.domain.matter.MatterPriority
import java.time.LocalDate
import java.time.LocalDateTime
import java.util.*

/**
 * Data transfer object for matter search results with highlighting.
 * Extends basic matter information with search-specific metadata.
 * 
 * @property id Unique identifier
 * @property caseNumber Unique case number
 * @property title Matter title
 * @property clientName Name of the client
 * @property status Current matter status
 * @property priority Matter priority level
 * @property highlights Map of field names to highlighted text snippets
 * @property relevanceScore Search relevance score (0.0 - 1.0)
 * @property assignedLawyerName Name of assigned lawyer
 * @property filingDate Filing date for sorting/display
 * @property createdAt Creation timestamp
 */
data class MatterSearchResultDto(
    val id: UUID,
    val caseNumber: String,
    val title: String,
    val clientName: String,
    val status: MatterStatus,
    val priority: MatterPriority,
    val highlights: Map<String, List<String>>,
    val relevanceScore: Double,
    val assignedLawyerName: String?,
    val filingDate: LocalDate?,
    val createdAt: LocalDateTime
)

/**
 * Search suggestion for autocomplete functionality.
 * 
 * @property value The suggestion text
 * @property type Type of suggestion (case_number, title, client_name)
 * @property count Number of matches for this suggestion
 */
data class SearchSuggestionDto(
    val value: String,
    val type: SearchSuggestionType,
    val count: Int
)

/**
 * Types of search suggestions available.
 */
enum class SearchSuggestionType {
    CASE_NUMBER,
    TITLE,
    CLIENT_NAME,
    DESCRIPTION
}

/**
 * Search query with parsed components and metadata.
 * 
 * @property query Original search query
 * @property terms Parsed search terms
 * @property filters Applied filters
 * @property operators Applied search operators
 */
data class ParsedSearchQuery(
    val query: String,
    val terms: List<String>,
    val filters: Map<String, String>,
    val operators: Set<SearchOperator>
)

/**
 * Search operators for advanced search functionality.
 */
enum class SearchOperator {
    AND,
    OR,
    NOT,
    EXACT_PHRASE,
    FIELD_SPECIFIC
}

/**
 * Search type for different search modes.
 */
enum class SearchType {
    FULL_TEXT,
    BASIC,
    ADVANCED
}