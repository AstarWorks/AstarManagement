# T02_S03: Advanced Search Implementation

## Task Overview
**Sprint**: S03_M01_Integration_and_Polish  
**Complexity**: Medium  
**Status**: TODO  

## Description
Implement comprehensive search functionality across matter names, client names, and case numbers with real-time suggestions and debouncing. The system should leverage PostgreSQL's full-text search capabilities while providing a responsive user experience with search suggestions and result highlighting.

## Current State Analysis
Based on the codebase analysis:

### Frontend Implementation
- **Location**: `/frontend/src/components/kanban/FilterBar.tsx`
- Search UI already exists with 300ms debouncing (lines 49-54)
- Currently only filters locally - not connected to backend
- Search input accepts case number and title queries (line 155)
- No autocomplete or suggestions implemented yet

### Backend Implementation
- **Database**: PostgreSQL with existing full-text search setup
  - `search_vector` column already exists in matters table (V002 migration, line 43)
  - Full-text index created: `idx_matters_search_vector` (line 68)
  - Trigger for updating search vector on INSERT/UPDATE (lines 75-89)
  - Weighted search across: case_number (A), title (A), client_name (B), description (C), notes (D)
- **Repository**: `MatterRepository.kt` has basic search methods:
  - `searchMatters()` method with multiple criteria (lines 107-115)
  - `fullTextSearch()` method using PostgreSQL ts_vector (lines 120-125)
- **Controller**: Basic CRUD endpoints exist but no dedicated search endpoint

## Objectives

### 1. Backend Search Endpoint Implementation
- Create dedicated search endpoint in `MatterController`
- Implement search service method with query parsing
- Add support for advanced search operators (AND, OR, quotes for exact match)
- Implement result ranking and relevance scoring

### 2. Frontend-Backend Integration
- Connect FilterBar search to backend API
- Implement real-time search with existing 300ms debounce
- Handle loading states and error scenarios
- Update Kanban store to manage search results

### 3. Search Suggestions/Autocomplete
- Implement suggestion endpoint returning top matches
- Add dropdown UI component for suggestions
- Cache frequently searched terms
- Show recent searches for quick access

### 4. Result Highlighting
- Implement search term highlighting in results
- Preserve original text while showing highlights
- Support multiple term highlighting
- Handle special characters and HTML escaping

### 5. Search Analytics
- Track search queries and click-through rates
- Implement search query logging
- Create metrics for search performance
- Build foundation for search improvement

## Technical Guidance

### Backend Implementation Details

```kotlin
// New search endpoint in MatterController.kt
@GetMapping("/search")
@Operation(summary = "Search matters with full-text search")
fun searchMatters(
    @RequestParam query: String,
    @RequestParam(required = false) searchType: SearchType = SearchType.FULL_TEXT,
    @RequestParam(defaultValue = "0") page: Int,
    @RequestParam(defaultValue = "20") size: Int
): PagedResponse<MatterSearchResultDto> {
    // Implementation
}

// Search result DTO with highlights
data class MatterSearchResultDto(
    val id: UUID,
    val caseNumber: String,
    val title: String,
    val clientName: String,
    val highlights: Map<String, List<String>>, // field -> highlighted snippets
    val relevanceScore: Double
)
```

### Frontend Integration

```typescript
// Update kanban-store.ts
interface SearchState {
  query: string
  results: MatterSearchResult[]
  suggestions: SearchSuggestion[]
  isSearching: boolean
  searchHistory: string[]
}

// Search hook
const useSearch = () => {
  const { searchQuery, setSearchQuery } = useKanbanStore()
  
  const searchMatters = useMutation({
    mutationFn: async (query: string) => {
      const response = await fetch(`/api/v1/matters/search?query=${query}`)
      return response.json()
    }
  })
  
  return { searchMatters, searchQuery, setSearchQuery }
}
```

### PostgreSQL Full-Text Search Optimization

```sql
-- Add search configuration for better results
ALTER TABLE matters ADD COLUMN search_config regconfig DEFAULT 'english';

-- Update search vector trigger for better ranking
CREATE OR REPLACE FUNCTION update_matters_search_vector()
RETURNS TRIGGER AS $$
BEGIN
    NEW.search_vector := 
        setweight(to_tsvector(NEW.search_config, COALESCE(NEW.case_number, '')), 'A') ||
        setweight(to_tsvector(NEW.search_config, COALESCE(NEW.title, '')), 'A') ||
        setweight(to_tsvector(NEW.search_config, COALESCE(NEW.client_name, '')), 'B') ||
        setweight(to_tsvector(NEW.search_config, COALESCE(NEW.opposing_party, '')), 'C') ||
        setweight(to_tsvector(NEW.search_config, COALESCE(NEW.description, '')), 'D');
    RETURN NEW;
END;
$$ language 'plpgsql';
```

### Search Query Parser

```kotlin
// Parse advanced search queries
class SearchQueryParser {
    fun parse(query: String): SearchQuery {
        // Handle quoted phrases: "exact match"
        // Handle operators: lawyer:smith AND status:active
        // Handle exclusions: -closed
        // Return structured query object
    }
}
```

## Acceptance Criteria

### Performance Requirements
- [ ] Search returns results in < 500ms for datasets up to 100k matters
- [ ] Autocomplete suggestions appear within 100ms
- [ ] Search index updates are near real-time (< 1 second)

### Functionality Requirements
- [ ] Search works across case number, title, and client name fields
- [ ] Partial matches return relevant results
- [ ] Special characters (hyphens, apostrophes) are handled correctly
- [ ] Search is case-insensitive
- [ ] Results are ranked by relevance

### User Experience Requirements
- [ ] Search suggestions appear after typing 2+ characters
- [ ] Recent searches are saved and displayed
- [ ] Search results highlight matching terms
- [ ] Empty state shows helpful search tips
- [ ] Mobile search experience is optimized

### Technical Requirements
- [ ] Search queries are logged for analytics
- [ ] Common searches are cached (Redis/in-memory)
- [ ] Search API is documented in OpenAPI spec
- [ ] Unit tests cover search parsing logic
- [ ] Integration tests verify full-text search

## Testing Strategy

### Unit Tests
- Search query parser handles all operators
- Highlighting logic preserves HTML safety
- Cache invalidation works correctly
- Search analytics tracking

### Integration Tests
- Full-text search returns expected results
- Search with filters combines correctly
- Pagination works with search results
- Performance meets requirements

### E2E Tests
- User can search and see results
- Autocomplete suggestions work
- Search history is maintained
- Mobile search experience

## Dependencies
- Existing PostgreSQL full-text search setup
- Frontend FilterBar component
- Kanban store for state management
- Backend Matter entity and repository

## Related Files
- Frontend: `/frontend/src/components/kanban/FilterBar.tsx`
- Backend Repository: `/backend/src/main/kotlin/dev/ryuzu/astermanagement/domain/matter/MatterRepository.kt`
- Backend Controller: `/backend/src/main/kotlin/dev/ryuzu/astermanagement/controller/MatterController.kt`
- Database Migration: `/backend/src/main/resources/db/migration/V002__Create_matters_table.sql`
- Kanban Store: `/frontend/src/stores/kanban-store.ts`

## Notes
- Consider implementing search suggestions using PostgreSQL's `ts_headline` function for context
- For Japanese text support, may need to add additional search configuration
- Search analytics can be used to improve search relevance over time
- Consider adding Elasticsearch/OpenSearch in future for more advanced search features