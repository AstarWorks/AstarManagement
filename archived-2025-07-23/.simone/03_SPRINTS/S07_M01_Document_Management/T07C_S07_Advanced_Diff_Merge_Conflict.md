---
task_id: T07C_S07
sprint_sequence_id: S07
status: open
complexity: Medium
last_updated: 2025-07-01T12:00:00Z
---

# Task: Advanced Diff, Merge & Conflict Resolution

## Description

Implement advanced diff calculation algorithms, merge functionality, and comprehensive conflict resolution system for the document version control platform. This task focuses on building sophisticated algorithms that can handle complex merge scenarios, detect conflicts accurately, and provide intuitive conflict resolution workflows for legal professionals.

The implementation will include multiple diff algorithms (Myers, binary delta, metadata comparison), three-way merge capabilities, automatic conflict detection, and both automatic and manual conflict resolution strategies. The system will integrate with the existing audit framework and provide comprehensive conflict tracking for legal compliance.

## Goal / Objectives

- **Advanced Diff Algorithms**: Implement multiple diff calculation algorithms optimized for different content types
- **Three-Way Merge**: Build Git-like three-way merge functionality with merge base calculation
- **Conflict Detection**: Create sophisticated conflict detection for content, metadata, and structural changes
- **Conflict Resolution**: Provide both automatic and manual conflict resolution strategies
- **Performance Optimization**: Optimize for large documents with streaming and parallel processing
- **Audit Integration**: Ensure all merge operations and conflict resolutions are fully audited
- **User Experience**: Build intuitive conflict resolution interfaces with clear visual indicators

## Acceptance Criteria

### Diff Algorithm Implementation
- [ ] Myers algorithm implementation for text-based diff with line-by-line precision
- [ ] Binary delta compression for efficient binary file diff storage
- [ ] Metadata diff algorithm for document properties and annotations
- [ ] Word-level diff calculation for fine-grained text changes
- [ ] Whitespace-aware diff options for formatting-sensitive documents
- [ ] Performance optimization for documents up to 100MB with streaming support
- [ ] Diff result serialization for storage and API transmission

### Merge Functionality
- [ ] Three-way merge algorithm with proper merge base calculation
- [ ] Fast-forward merge detection and optimization
- [ ] Merge commit creation with multiple parent tracking
- [ ] Branch genealogy tracking for complex merge histories
- [ ] Merge preview capability showing proposed changes before commit
- [ ] Transaction safety ensuring atomic merge operations
- [ ] Integration with existing audit system for merge tracking

### Conflict Detection System
- [ ] Content conflict detection for overlapping text modifications
- [ ] Metadata conflict detection for property changes
- [ ] Structural conflict detection for document organization changes
- [ ] Permission conflict detection for access control changes
- [ ] Conflict severity assessment (low, medium, high, critical)
- [ ] Conflict impact analysis showing affected content areas
- [ ] Automatic conflict categorization for resolution strategy selection

### Conflict Resolution
- [ ] Automatic resolution strategies (accept source, accept target, intelligent merge)
- [ ] Manual resolution interface with side-by-side conflict view
- [ ] Conflict resolution history tracking for audit compliance
- [ ] Resolution validation to ensure content integrity
- [ ] Rollback capability for failed resolution attempts
- [ ] Batch conflict resolution for multiple conflicts
- [ ] Conflict resolution permissions and approval workflows

### Performance & Integration
- [ ] Streaming algorithms for large document processing without memory overflow
- [ ] Parallel processing for independent conflict detection tasks
- [ ] Caching layer for frequently calculated diffs and merge bases
- [ ] Background processing for expensive merge operations
- [ ] Integration with existing AuditEventPublisher for comprehensive logging
- [ ] Error handling and recovery for partial merge failures

## Subtasks

### Phase 1: Core Diff Algorithm Implementation
- [ ] **T07C.01**: Implement Myers diff algorithm for text content
  - Create efficient line-based diff calculation using Myers algorithm
  - Add support for different granularity levels (line, word, character)
  - Implement diff path optimization for large documents
  - Add contextual diff with configurable context lines
  - Include whitespace handling options (ignore, preserve, normalize)

- [ ] **T07C.02**: Create binary diff algorithm with delta compression
  - Implement binary delta compression for non-text files
  - Add content type detection for automatic algorithm selection
  - Create efficient binary patch application and rollback
  - Add checksum verification for binary diff integrity
  - Implement streaming support for large binary files

- [ ] **T07C.03**: Build metadata diff algorithm for document properties
  - Create JSON-aware diff for document metadata
  - Implement property-level change tracking
  - Add annotation and tag diff calculation
  - Include permission and access control diff detection
  - Create metadata merge resolution strategies

### Phase 2: Merge Base Calculation and Three-Way Merge
- [ ] **T07C.04**: Implement merge base calculation algorithm
  - Create lowest common ancestor (LCA) algorithm for version trees
  - Add support for multiple merge bases in complex histories
  - Implement merge base caching for performance
  - Add merge base validation and consistency checks
  - Include octopus merge support for multiple branch merging

- [ ] **T07C.05**: Build three-way merge algorithm
  - Implement content-based three-way merge with conflict detection
  - Add fast-forward merge optimization for linear histories
  - Create merge result validation and integrity checks
  - Implement merge commit creation with proper parent tracking
  - Add merge preview functionality for user confirmation

- [ ] **T07C.06**: Create merge strategy framework
  - Implement configurable merge strategies (recursive, ours, theirs)
  - Add custom merge strategies for different content types
  - Create merge strategy selection based on content analysis
  - Implement merge strategy fallback mechanisms
  - Add merge strategy documentation and user guidance

### Phase 3: Conflict Detection and Classification
- [ ] **T07C.07**: Implement content conflict detection
  - Create overlapping change detection for text modifications
  - Add conflict boundary detection with precise line/character ranges
  - Implement conflict severity assessment based on change impact
  - Add contextual conflict information for resolution guidance
  - Include conflict clustering for related changes

- [ ] **T07C.08**: Build metadata and structural conflict detection
  - Implement property conflict detection for metadata changes
  - Add structural conflict detection for document organization
  - Create permission conflict detection for access control changes
  - Implement tag and annotation conflict resolution
  - Add validation conflict detection for business rule violations

- [ ] **T07C.09**: Create conflict impact analysis system
  - Implement affected content area calculation
  - Add dependency impact analysis for related changes
  - Create conflict propagation detection
  - Implement conflict resolution effort estimation
  - Add conflict resolution suggestion engine

### Phase 4: Conflict Resolution Strategies
- [ ] **T07C.10**: Implement automatic resolution strategies
  - Create intelligent merge for non-conflicting sections
  - Add accept source/target strategies for simple conflicts
  - Implement timestamp-based resolution for metadata conflicts
  - Create pattern-based automatic resolution rules
  - Add machine learning integration for resolution suggestions

- [ ] **T07C.11**: Build manual conflict resolution interface
  - Create side-by-side conflict view with highlighting
  - Add inline conflict resolution with accept/reject controls
  - Implement custom resolution with manual content editing
  - Create conflict resolution preview and validation
  - Add undo/redo functionality for resolution steps

- [ ] **T07C.12**: Implement conflict resolution tracking and audit
  - Create comprehensive conflict resolution history
  - Add resolution decision audit trail for compliance
  - Implement resolution validation and integrity checks
  - Create conflict resolution reporting and analytics
  - Add resolution performance metrics and optimization

### Phase 5: Performance Optimization and Caching
- [ ] **T07C.13**: Optimize diff calculation performance
  - Implement streaming algorithms for memory efficiency
  - Add parallel processing for independent diff calculations
  - Create diff result caching with intelligent invalidation
  - Implement incremental diff for frequently changing documents
  - Add performance monitoring and bottleneck identification

- [ ] **T07C.14**: Optimize merge and conflict resolution performance
  - Implement background processing for expensive merge operations
  - Add merge result caching for repeated operations
  - Create conflict resolution batching for efficiency
  - Implement lazy loading for conflict details
  - Add progress tracking for long-running operations

- [ ] **T07C.15**: Build comprehensive testing and validation
  - Create unit tests for all diff algorithms with edge cases
  - Add integration tests for complete merge workflows
  - Implement performance tests for large document scenarios
  - Create conflict resolution scenario testing
  - Add regression testing for algorithm improvements

## Technical Architecture & Guidance

### Diff Algorithm Implementation

```kotlin
// Core diff service interface
interface DiffCalculationService {
    fun calculateTextDiff(oldContent: String, newContent: String, options: DiffOptions = DiffOptions.default()): TextDiff
    fun calculateBinaryDiff(oldContent: ByteArray, newContent: ByteArray): BinaryDiff
    fun calculateMetadataDiff(oldMetadata: Map<String, Any>, newMetadata: Map<String, Any>): MetadataDiff
    fun calculateStructuralDiff(oldStructure: DocumentStructure, newStructure: DocumentStructure): StructuralDiff
}

@Service
class DiffCalculationServiceImpl(
    private val myersAlgorithm: MyersAlgorithm,
    private val binaryDeltaAlgorithm: BinaryDeltaAlgorithm,
    private val metadataComparator: MetadataComparator,
    private val auditEventPublisher: AuditEventPublisher
) : DiffCalculationService {
    
    override fun calculateTextDiff(
        oldContent: String, 
        newContent: String, 
        options: DiffOptions
    ): TextDiff {
        val startTime = System.currentTimeMillis()
        
        try {
            val lines1 = oldContent.lines()
            val lines2 = newContent.lines()
            
            // Use streaming for large content
            return if (lines1.size > 10000 || lines2.size > 10000) {
                calculateStreamingDiff(lines1, lines2, options)
            } else {
                myersAlgorithm.calculateDiff(lines1, lines2, options)
            }
        } finally {
            val duration = System.currentTimeMillis() - startTime
            auditEventPublisher.publishPerformanceEvent(
                "TEXT_DIFF_CALCULATION",
                mapOf(
                    "oldSize" to oldContent.length,
                    "newSize" to newContent.length,
                    "duration" to duration,
                    "algorithm" to "myers"
                )
            )
        }
    }
    
    private fun calculateStreamingDiff(
        lines1: List<String>, 
        lines2: List<String>, 
        options: DiffOptions
    ): TextDiff {
        val chunkSize = 1000
        val diffChunks = mutableListOf<DiffChunk>()
        
        for (i in 0 until maxOf(lines1.size, lines2.size) step chunkSize) {
            val chunk1 = lines1.drop(i).take(chunkSize)
            val chunk2 = lines2.drop(i).take(chunkSize)
            
            val chunkDiff = myersAlgorithm.calculateDiff(chunk1, chunk2, options)
            diffChunks.add(DiffChunk(startLine = i, diff = chunkDiff))
        }
        
        return mergeDiffChunks(diffChunks)
    }
}

// Myers algorithm implementation
@Component
class MyersAlgorithm {
    
    fun calculateDiff(
        lines1: List<String>, 
        lines2: List<String>, 
        options: DiffOptions
    ): TextDiff {
        val n = lines1.size
        val m = lines2.size
        val max = n + m
        
        val v = IntArray(2 * max + 1)
        val trace = mutableListOf<IntArray>()
        
        // Forward search
        for (d in 0..max) {
            trace.add(v.clone())
            
            for (k in -d..d step 2) {
                val x = if (k == -d || (k != d && v[k - 1 + max] < v[k + 1 + max])) {
                    v[k + 1 + max]
                } else {
                    v[k - 1 + max] + 1
                }
                
                var y = x - k
                
                // Extend diagonal
                while (x < n && y < m && isLineEqual(lines1[x], lines2[y], options)) {
                    x++
                    y++
                }
                
                v[k + max] = x
                
                if (x >= n && y >= m) {
                    return buildDiff(lines1, lines2, trace, d, options)
                }
            }
        }
        
        throw IllegalStateException("Diff calculation failed")
    }
    
    private fun isLineEqual(line1: String, line2: String, options: DiffOptions): Boolean {
        return when {
            options.ignoreWhitespace -> line1.trim() == line2.trim()
            options.ignoreCase -> line1.equals(line2, ignoreCase = true)
            else -> line1 == line2
        }
    }
    
    private fun buildDiff(
        lines1: List<String>, 
        lines2: List<String>, 
        trace: List<IntArray>, 
        d: Int, 
        options: DiffOptions
    ): TextDiff {
        val changes = mutableListOf<DiffChange>()
        
        // Backtrack through the trace to build the edit sequence
        var x = lines1.size
        var y = lines2.size
        
        for (depth in d downTo 0) {
            val v = trace[depth]
            val k = x - y
            
            // Determine previous k
            val prevK = if (k == -depth || (k != depth && v[k - 1 + lines1.size + lines2.size] < v[k + 1 + lines1.size + lines2.size])) {
                k + 1
            } else {
                k - 1
            }
            
            val prevX = v[prevK + lines1.size + lines2.size]
            val prevY = prevX - prevK
            
            // Add diagonal moves (no changes)
            while (x > prevX && y > prevY) {
                x--
                y--
                // This is a match, no change needed
            }
            
            // Add change
            if (depth > 0) {
                if (x > prevX) {
                    // Deletion
                    changes.add(0, DiffChange(
                        type = ChangeType.DELETE,
                        oldStart = x - 1,
                        oldLines = 1,
                        newStart = y,
                        newLines = 0,
                        content = listOf(lines1[x - 1])
                    ))
                    x = prevX
                } else {
                    // Insertion
                    changes.add(0, DiffChange(
                        type = ChangeType.INSERT,
                        oldStart = x,
                        oldLines = 0,
                        newStart = y - 1,
                        newLines = 1,
                        content = listOf(lines2[y - 1])
                    ))
                    y = prevY
                }
            }
        }
        
        return TextDiff(
            changes = changes,
            statistics = calculateDiffStatistics(changes),
            algorithm = "myers",
            options = options
        )
    }
}

// Data classes for diff results
data class TextDiff(
    val changes: List<DiffChange>,
    val statistics: DiffStatistics,
    val algorithm: String,
    val options: DiffOptions
)

data class DiffChange(
    val type: ChangeType,
    val oldStart: Int,
    val oldLines: Int,
    val newStart: Int,
    val newLines: Int,
    val content: List<String>
)

enum class ChangeType {
    INSERT, DELETE, MODIFY, EQUAL
}

data class DiffOptions(
    val ignoreWhitespace: Boolean = false,
    val ignoreCase: Boolean = false,
    val contextLines: Int = 3,
    val granularity: DiffGranularity = DiffGranularity.LINE
) {
    companion object {
        fun default() = DiffOptions()
    }
}

enum class DiffGranularity {
    LINE, WORD, CHARACTER
}

data class DiffStatistics(
    val linesAdded: Int,
    val linesDeleted: Int,
    val linesModified: Int,
    val totalChanges: Int
) {
    val changePercentage: Double
        get() = if (totalChanges > 0) (linesAdded + linesDeleted + linesModified).toDouble() / totalChanges * 100 else 0.0
}
```

### Three-Way Merge Implementation

```kotlin
@Service
class MergeService(
    private val diffCalculationService: DiffCalculationService,
    private val conflictDetectionService: ConflictDetectionService,
    private val auditEventPublisher: AuditEventPublisher
) {
    
    @Transactional
    fun performThreeWayMerge(
        baseVersion: DocumentVersion,
        sourceVersion: DocumentVersion,
        targetVersion: DocumentVersion,
        strategy: MergeStrategy = MergeStrategy.RECURSIVE
    ): MergeResult {
        
        val startTime = System.currentTimeMillis()
        
        try {
            // Get content
            val baseContent = baseVersion.getDecompressedContent()
            val sourceContent = sourceVersion.getDecompressedContent()
            val targetContent = targetVersion.getDecompressedContent()
            
            // Calculate diffs
            val baseTSource = diffCalculationService.calculateTextDiff(baseContent, sourceContent)
            val baseToTarget = diffCalculationService.calculateTextDiff(baseContent, targetContent)
            
            // Detect conflicts
            val conflicts = conflictDetectionService.detectConflicts(baseTSource, baseToTarget)
            
            if (conflicts.isNotEmpty() && strategy != MergeStrategy.FORCE) {
                return MergeResult.withConflicts(
                    conflicts = conflicts,
                    partialMerge = attemptPartialMerge(baseContent, baseTSource, baseToTarget, conflicts)
                )
            }
            
            // Perform merge
            val mergedContent = when (strategy) {
                MergeStrategy.RECURSIVE -> performRecursiveMerge(baseContent, baseTSource, baseToTarget)
                MergeStrategy.OURS -> sourceContent
                MergeStrategy.THEIRS -> targetContent
                MergeStrategy.FORCE -> performForceMerge(baseContent, baseTSource, baseToTarget, conflicts)
            }
            
            return MergeResult.success(
                mergedContent = mergedContent,
                appliedChanges = baseTSource.changes + baseToTarget.changes,
                strategy = strategy
            )
            
        } finally {
            val duration = System.currentTimeMillis() - startTime
            auditEventPublisher.publishMergeEvent(
                baseVersionId = baseVersion.id!!,
                sourceVersionId = sourceVersion.id!!,
                targetVersionId = targetVersion.id!!,
                strategy = strategy,
                duration = duration
            )
        }
    }
    
    private fun performRecursiveMerge(
        baseContent: String,
        sourceChanges: TextDiff,
        targetChanges: TextDiff
    ): String {
        val baseLines = baseContent.lines().toMutableList()
        
        // Apply non-conflicting changes in reverse order to maintain line numbers
        val allChanges = (sourceChanges.changes + targetChanges.changes)
            .sortedByDescending { it.oldStart }
        
        for (change in allChanges) {
            when (change.type) {
                ChangeType.INSERT -> {
                    baseLines.addAll(change.oldStart, change.content)
                }
                ChangeType.DELETE -> {
                    repeat(change.oldLines) {
                        if (change.oldStart < baseLines.size) {
                            baseLines.removeAt(change.oldStart)
                        }
                    }
                }
                ChangeType.MODIFY -> {
                    repeat(change.oldLines) {
                        if (change.oldStart < baseLines.size) {
                            baseLines.removeAt(change.oldStart)
                        }
                    }
                    baseLines.addAll(change.oldStart, change.content)
                }
                ChangeType.EQUAL -> {
                    // No change needed
                }
            }
        }
        
        return baseLines.joinToString("\n")
    }
}

enum class MergeStrategy {
    RECURSIVE, OURS, THEIRS, FORCE
}

sealed class MergeResult {
    data class Success(
        val mergedContent: String,
        val appliedChanges: List<DiffChange>,
        val strategy: MergeStrategy,
        val metadata: Map<String, Any> = emptyMap()
    ) : MergeResult()
    
    data class WithConflicts(
        val conflicts: List<MergeConflict>,
        val partialMerge: String?,
        val resolutionRequired: Boolean = true
    ) : MergeResult()
    
    data class Failed(
        val error: String,
        val cause: Exception?
    ) : MergeResult()
    
    companion object {
        fun success(
            mergedContent: String, 
            appliedChanges: List<DiffChange>, 
            strategy: MergeStrategy
        ) = Success(mergedContent, appliedChanges, strategy)
        
        fun withConflicts(
            conflicts: List<MergeConflict>, 
            partialMerge: String?
        ) = WithConflicts(conflicts, partialMerge)
        
        fun failed(error: String, cause: Exception? = null) = Failed(error, cause)
    }
}
```

### Conflict Detection and Resolution

```kotlin
@Service
class ConflictDetectionService(
    private val conflictAnalyzer: ConflictAnalyzer,
    private val auditEventPublisher: AuditEventPublisher
) {
    
    fun detectConflicts(
        sourceChanges: TextDiff,
        targetChanges: TextDiff
    ): List<MergeConflict> {
        val conflicts = mutableListOf<MergeConflict>()
        
        // Group changes by proximity to detect overlapping modifications
        val sourceChangeGroups = groupChangesByProximity(sourceChanges.changes)
        val targetChangeGroups = groupChangesByProximity(targetChanges.changes)
        
        for (sourceGroup in sourceChangeGroups) {
            for (targetGroup in targetChangeGroups) {
                val conflict = detectOverlapConflict(sourceGroup, targetGroup)
                if (conflict != null) {
                    conflicts.add(conflict)
                }
            }
        }
        
        return conflicts.map { conflict ->
            conflict.copy(
                severity = conflictAnalyzer.assessSeverity(conflict),
                impact = conflictAnalyzer.calculateImpact(conflict),
                suggestedResolution = conflictAnalyzer.suggestResolution(conflict)
            )
        }
    }
    
    private fun detectOverlapConflict(
        sourceGroup: ChangeGroup,
        targetGroup: ChangeGroup
    ): MergeConflict? {
        val sourceRange = sourceGroup.getLineRange()
        val targetRange = targetGroup.getLineRange()
        
        // Check for overlap
        if (sourceRange.overlaps(targetRange)) {
            return MergeConflict(
                id = UUID.randomUUID(),
                type = ConflictType.CONTENT_OVERLAP,
                sourceChanges = sourceGroup.changes,
                targetChanges = targetGroup.changes,
                conflictRange = sourceRange.intersect(targetRange),
                description = "Overlapping modifications detected",
                createdAt = LocalDateTime.now()
            )
        }
        
        return null
    }
    
    private fun groupChangesByProximity(changes: List<DiffChange>): List<ChangeGroup> {
        val groups = mutableListOf<ChangeGroup>()
        var currentGroup = mutableListOf<DiffChange>()
        
        for (change in changes.sortedBy { it.oldStart }) {
            if (currentGroup.isEmpty() || 
                change.oldStart <= currentGroup.last().oldStart + currentGroup.last().oldLines + 3) {
                currentGroup.add(change)
            } else {
                if (currentGroup.isNotEmpty()) {
                    groups.add(ChangeGroup(currentGroup.toList()))
                }
                currentGroup = mutableListOf(change)
            }
        }
        
        if (currentGroup.isNotEmpty()) {
            groups.add(ChangeGroup(currentGroup.toList()))
        }
        
        return groups
    }
}

data class MergeConflict(
    val id: UUID,
    val type: ConflictType,
    val sourceChanges: List<DiffChange>,
    val targetChanges: List<DiffChange>,
    val conflictRange: LineRange,
    val description: String,
    val severity: ConflictSeverity = ConflictSeverity.MEDIUM,
    val impact: ConflictImpact? = null,
    val suggestedResolution: ResolutionSuggestion? = null,
    val createdAt: LocalDateTime,
    val resolvedAt: LocalDateTime? = null,
    val resolvedBy: UUID? = null,
    val resolution: ConflictResolution? = null
)

enum class ConflictType {
    CONTENT_OVERLAP, METADATA_CONFLICT, STRUCTURAL_CHANGE, PERMISSION_CONFLICT
}

enum class ConflictSeverity {
    LOW, MEDIUM, HIGH, CRITICAL
}

data class ConflictImpact(
    val affectedLines: Int,
    val affectedCharacters: Int,
    val functionalImpact: String,
    val businessImpact: String
)

data class ResolutionSuggestion(
    val strategy: ResolutionStrategy,
    val confidence: Double,
    val explanation: String,
    val previewContent: String?
)

enum class ResolutionStrategy {
    ACCEPT_SOURCE, ACCEPT_TARGET, MANUAL_MERGE, INTELLIGENT_MERGE, DEFER_TO_USER
}

data class ConflictResolution(
    val strategy: ResolutionStrategy,
    val resolvedContent: String,
    val userInput: Map<String, Any> = emptyMap(),
    val automatedApplied: Boolean = false
)

// Conflict resolution service
@Service
class ConflictResolutionService(
    private val auditEventPublisher: AuditEventPublisher
) {
    
    fun resolveConflict(
        conflict: MergeConflict,
        strategy: ResolutionStrategy,
        userInput: Map<String, Any> = emptyMap()
    ): ConflictResolution {
        
        val resolvedContent = when (strategy) {
            ResolutionStrategy.ACCEPT_SOURCE -> applySourceChanges(conflict)
            ResolutionStrategy.ACCEPT_TARGET -> applyTargetChanges(conflict)
            ResolutionStrategy.MANUAL_MERGE -> applyManualResolution(conflict, userInput)
            ResolutionStrategy.INTELLIGENT_MERGE -> applyIntelligentMerge(conflict)
            ResolutionStrategy.DEFER_TO_USER -> throw IllegalArgumentException("User resolution required")
        }
        
        val resolution = ConflictResolution(
            strategy = strategy,
            resolvedContent = resolvedContent,
            userInput = userInput,
            automatedApplied = strategy != ResolutionStrategy.MANUAL_MERGE
        )
        
        // Audit the resolution
        auditEventPublisher.publishConflictResolution(
            conflictId = conflict.id,
            strategy = strategy,
            resolution = resolution
        )
        
        return resolution
    }
    
    private fun applyIntelligentMerge(conflict: MergeConflict): String {
        // Implement intelligent merge logic based on content analysis
        // This could include machine learning models, pattern recognition, etc.
        return when {
            conflict.sourceChanges.isEmpty() -> applyTargetChanges(conflict)
            conflict.targetChanges.isEmpty() -> applySourceChanges(conflict)
            conflict.type == ConflictType.METADATA_CONFLICT -> mergeMetadataIntelligently(conflict)
            else -> attemptContentMerge(conflict)
        }
    }
    
    private fun attemptContentMerge(conflict: MergeConflict): String {
        // Try to merge non-overlapping parts intelligently
        val sourceContent = conflict.sourceChanges.flatMap { it.content }
        val targetContent = conflict.targetChanges.flatMap { it.content }
        
        // Simple heuristic: if one side is clearly additive, include both
        return if (conflict.sourceChanges.all { it.type == ChangeType.INSERT } ||
                   conflict.targetChanges.all { it.type == ChangeType.INSERT }) {
            (sourceContent + targetContent).distinct().joinToString("\n")
        } else {
            // Fall back to manual resolution required
            throw ConflictResolutionException("Manual resolution required for complex conflict")
        }
    }
}
```

## Performance Targets

- Diff calculation: < 5 seconds for documents up to 50MB
- Three-way merge: < 10 seconds for complex merge scenarios
- Conflict detection: < 3 seconds for documents with 1000+ changes
- Memory usage: < 1GB for largest supported documents
- Streaming support: Handle documents up to 100MB without memory overflow
- Parallel processing: Utilize multiple CPU cores for independent operations

## Integration Points

- **Audit System**: Full integration with AuditEventPublisher for merge and conflict tracking
- **Version Control Core**: Builds upon T07A_S07 backend infrastructure
- **User Interface**: Provides data for T07B_S07 frontend conflict resolution UI
- **Performance Monitoring**: Integration with existing metrics and monitoring systems
- **Error Handling**: Consistent error patterns with existing service layer

## Output Log

*(This section is populated as work progresses on the task)*

[2025-07-01 12:00:00] Task created focusing on advanced diff algorithms and merge functionality
[2025-07-01 12:00:00] Technical architecture defined with Myers algorithm and three-way merge
[2025-07-01 12:00:00] Conflict detection and resolution strategies established
[2025-07-01 12:00:00] Performance optimization patterns designed for large document handling
[2025-07-01 12:00:00] Integration points identified with existing audit and version control systems