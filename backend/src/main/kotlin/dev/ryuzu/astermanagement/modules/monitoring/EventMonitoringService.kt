package dev.ryuzu.astermanagement.modules.monitoring

import dev.ryuzu.astermanagement.modules.matter.api.*
import dev.ryuzu.astermanagement.modules.document.api.*
import io.micrometer.core.instrument.Counter
import io.micrometer.core.instrument.MeterRegistry
import io.micrometer.core.instrument.Timer
import org.slf4j.LoggerFactory
import org.springframework.context.event.EventListener
import org.springframework.modulith.events.ApplicationModuleListener
import org.springframework.stereotype.Service
import java.time.LocalDateTime
import java.util.concurrent.ConcurrentHashMap
import java.util.concurrent.atomic.AtomicLong

/**
 * Service for monitoring event-driven communication across Spring Modulith modules
 * Provides metrics, tracing, and observability for inter-module events
 */
@Service
class EventMonitoringService(
    private val meterRegistry: MeterRegistry
) {
    private val logger = LoggerFactory.getLogger(EventMonitoringService::class.java)
    
    // Metrics collectors
    private val eventCounters = ConcurrentHashMap<String, Counter>()
    private val eventTimers = ConcurrentHashMap<String, Timer>()
    private val errorCounters = ConcurrentHashMap<String, Counter>()
    
    // Performance tracking
    private val eventProcessingTimes = ConcurrentHashMap<String, AtomicLong>()
    private val lastEventTimes = ConcurrentHashMap<String, LocalDateTime>()
    
    // ========== MATTER MODULE EVENT MONITORING ==========
    
    @ApplicationModuleListener
    fun onMatterCreated(event: MatterCreatedEvent) {
        recordEventMetrics("matter.created", event.timestamp)
        logger.info("Event processed: MatterCreatedEvent(matterId=${event.matterId}, caseNumber=${event.caseNumber})")
    }
    
    @ApplicationModuleListener
    fun onMatterUpdated(event: MatterUpdatedEvent) {
        recordEventMetrics("matter.updated", event.timestamp)
        logger.debug("Event processed: MatterUpdatedEvent(matterId=${event.matterId}, changes=${event.changes.size})")
    }
    
    @ApplicationModuleListener
    fun onMatterStatusChanged(event: MatterStatusChangedEvent) {
        recordEventMetrics("matter.status.changed", event.timestamp)
        logger.info("Event processed: MatterStatusChangedEvent(matterId=${event.matterId}, ${event.oldStatus} -> ${event.newStatus})")
    }
    
    @ApplicationModuleListener
    fun onMatterAssigned(event: MatterAssignedEvent) {
        recordEventMetrics("matter.assigned", event.timestamp)
        logger.info("Event processed: MatterAssignedEvent(matterId=${event.matterId}, newLawyer=${event.newLawyerId})")
    }
    
    @ApplicationModuleListener
    fun onMatterCompleted(event: MatterCompletedEvent) {
        recordEventMetrics("matter.completed", event.timestamp)
        logger.info("Event processed: MatterCompletedEvent(matterId=${event.matterId}, completionDate=${event.completionDate})")
    }
    
    @ApplicationModuleListener
    fun onMatterDeleted(event: MatterDeletedEvent) {
        recordEventMetrics("matter.deleted", event.timestamp)
        logger.warn("Event processed: MatterDeletedEvent(matterId=${event.matterId})")
    }
    
    // ========== DOCUMENT MODULE EVENT MONITORING ==========
    
    @ApplicationModuleListener
    fun onDocumentUploaded(event: DocumentUploadedEvent) {
        recordEventMetrics("document.uploaded", event.timestamp)
        logger.info("Event processed: DocumentUploadedEvent(documentId=${event.documentId}, fileName=${event.fileName}, size=${event.fileSize})")
    }
    
    @ApplicationModuleListener
    fun onDocumentProcessed(event: DocumentProcessedEvent) {
        recordEventMetrics("document.processed", event.timestamp)
        logger.info("Event processed: DocumentProcessedEvent(documentId=${event.documentId}, status=${event.status})")
    }
    
    @ApplicationModuleListener
    fun onDocumentAssociated(event: DocumentAssociatedWithMatterEvent) {
        recordEventMetrics("document.associated", event.timestamp)
        logger.info("Event processed: DocumentAssociatedWithMatterEvent(documentId=${event.documentId}, matterId=${event.matterId})")
    }
    
    @ApplicationModuleListener
    fun onDocumentDisassociated(event: DocumentDisassociatedFromMatterEvent) {
        recordEventMetrics("document.disassociated", event.timestamp)
        logger.info("Event processed: DocumentDisassociatedFromMatterEvent(documentId=${event.documentId}, matterId=${event.matterId})")
    }
    
    @ApplicationModuleListener
    fun onDocumentUpdated(event: DocumentUpdatedEvent) {
        recordEventMetrics("document.updated", event.timestamp)
        logger.debug("Event processed: DocumentUpdatedEvent(documentId=${event.documentId}, changes=${event.changes.size})")
    }
    
    @ApplicationModuleListener
    fun onDocumentDeleted(event: DocumentDeletedEvent) {
        recordEventMetrics("document.deleted", event.timestamp)
        logger.warn("Event processed: DocumentDeletedEvent(documentId=${event.documentId})")
    }
    
    @ApplicationModuleListener
    fun onDocumentVersionCreated(event: DocumentVersionCreatedEvent) {
        recordEventMetrics("document.version.created", event.timestamp)
        logger.info("Event processed: DocumentVersionCreatedEvent(documentId=${event.documentId}, version=${event.versionNumber})")
    }
    
    @ApplicationModuleListener
    fun onDocumentAccessed(event: DocumentAccessedEvent) {
        recordEventMetrics("document.accessed", event.timestamp)
        logger.debug("Event processed: DocumentAccessedEvent(documentId=${event.documentId}, accessType=${event.accessType})")
    }
    
    @ApplicationModuleListener
    fun onDocumentIndexed(event: DocumentIndexedEvent) {
        recordEventMetrics("document.indexed", event.timestamp)
        logger.debug("Event processed: DocumentIndexedEvent(documentId=${event.documentId}, wordCount=${event.wordCount})")
    }
    
    // ========== ERROR HANDLING AND MONITORING ==========
    
    @EventListener
    fun onEventProcessingError(error: EventProcessingError) {
        recordErrorMetrics(error.eventType, error.errorType)
        logger.error("Event processing error: ${error.eventType} - ${error.message}", error.exception)
    }
    
    // ========== METRICS RECORDING ==========
    
    private fun recordEventMetrics(eventType: String, eventTimestamp: LocalDateTime) {
        // Increment event counter
        val counter = eventCounters.computeIfAbsent(eventType) {
            Counter.builder("spring.modulith.events.processed")
                .tag("event.type", eventType)
                .description("Number of processed events by type")
                .register(meterRegistry)
        }
        counter.increment()
        
        // Record processing time
        val processingTime = System.currentTimeMillis() - eventTimestamp.atZone(java.time.ZoneId.systemDefault()).toInstant().toEpochMilli()
        val timer = eventTimers.computeIfAbsent(eventType) {
            Timer.builder("spring.modulith.events.processing.time")
                .tag("event.type", eventType)
                .description("Event processing time by type")
                .register(meterRegistry)
        }
        timer.record(processingTime, java.util.concurrent.TimeUnit.MILLISECONDS)
        
        // Track latest event times
        lastEventTimes[eventType] = LocalDateTime.now()
        eventProcessingTimes.computeIfAbsent(eventType) { AtomicLong(0) }.set(processingTime)
    }
    
    private fun recordErrorMetrics(eventType: String, errorType: String) {
        val errorCounter = errorCounters.computeIfAbsent("${eventType}.${errorType}") {
            Counter.builder("spring.modulith.events.errors")
                .tag("event.type", eventType)
                .tag("error.type", errorType)
                .description("Number of event processing errors by type")
                .register(meterRegistry)
        }
        errorCounter.increment()
    }
    
    // ========== MONITORING ANALYTICS ==========
    
    fun getEventStatistics(): EventStatistics {
        val totalEvents = eventCounters.values.sumOf { it.count().toLong() }
        val totalErrors = errorCounters.values.sumOf { it.count().toLong() }
        val avgProcessingTime = eventProcessingTimes.values.mapNotNull { it.get() }.average()
        
        return EventStatistics(
            totalEventsProcessed = totalEvents,
            totalErrors = totalErrors,
            errorRate = if (totalEvents > 0) (totalErrors.toDouble() / totalEvents) * 100 else 0.0,
            averageProcessingTimeMs = avgProcessingTime,
            activeEventTypes = lastEventTimes.keys.toList(),
            lastActivityTime = lastEventTimes.values.maxOrNull()
        )
    }
    
    fun getEventTypeStatistics(eventType: String): EventTypeStatistics? {
        val counter = eventCounters[eventType]
        val timer = eventTimers[eventType]
        val errorCounter = errorCounters.filterKeys { it.startsWith(eventType) }.values.sumOf { it.count().toLong() }
        
        return if (counter != null && timer != null) {
            EventTypeStatistics(
                eventType = eventType,
                totalCount = counter.count().toLong(),
                errorCount = errorCounter,
                averageProcessingTimeMs = timer.mean(java.util.concurrent.TimeUnit.MILLISECONDS),
                maxProcessingTimeMs = timer.max(java.util.concurrent.TimeUnit.MILLISECONDS),
                lastProcessedTime = lastEventTimes[eventType]
            )
        } else null
    }
    
    fun getHealthStatus(): EventMonitoringHealth {
        val statistics = getEventStatistics()
        val recentActivity = lastEventTimes.values.any { 
            it.isAfter(LocalDateTime.now().minusMinutes(5)) 
        }
        
        val status = when {
            statistics.errorRate > 10 -> HealthStatus.CRITICAL
            statistics.errorRate > 5 -> HealthStatus.WARNING
            statistics.averageProcessingTimeMs > 100 -> HealthStatus.WARNING
            !recentActivity && statistics.totalEventsProcessed > 0 -> HealthStatus.WARNING
            else -> HealthStatus.HEALTHY
        }
        
        return EventMonitoringHealth(
            status = status,
            message = when (status) {
                HealthStatus.CRITICAL -> "High error rate: ${String.format("%.2f", statistics.errorRate)}%"
                HealthStatus.WARNING -> "Performance or activity issues detected"
                HealthStatus.HEALTHY -> "Event processing is healthy"
            },
            statistics = statistics
        )
    }
}

/**
 * Error event for monitoring failed event processing
 */
data class EventProcessingError(
    val eventType: String,
    val errorType: String,
    val message: String,
    val exception: Throwable?,
    val timestamp: LocalDateTime = LocalDateTime.now()
)

/**
 * Overall event processing statistics
 */
data class EventStatistics(
    val totalEventsProcessed: Long,
    val totalErrors: Long,
    val errorRate: Double,
    val averageProcessingTimeMs: Double,
    val activeEventTypes: List<String>,
    val lastActivityTime: LocalDateTime?
)

/**
 * Statistics for a specific event type
 */
data class EventTypeStatistics(
    val eventType: String,
    val totalCount: Long,
    val errorCount: Long,
    val averageProcessingTimeMs: Double,
    val maxProcessingTimeMs: Double,
    val lastProcessedTime: LocalDateTime?
)

/**
 * Health status for event monitoring
 */
data class EventMonitoringHealth(
    val status: HealthStatus,
    val message: String,
    val statistics: EventStatistics
)

enum class HealthStatus {
    HEALTHY, WARNING, CRITICAL
}