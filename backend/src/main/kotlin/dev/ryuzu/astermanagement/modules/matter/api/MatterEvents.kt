package dev.ryuzu.astermanagement.modules.matter.api

import org.springframework.modulith.events.Externalized
import java.time.LocalDateTime
import java.util.*

/**
 * Matter module events for inter-module communication
 * These events are published when significant matter operations occur
 */

/**
 * Base interface for all matter events
 */
sealed interface MatterEvent {
    val matterId: UUID
    val timestamp: LocalDateTime
    val userId: UUID
}

/**
 * Published when a new matter is created
 */
@Externalized("matter.created::#{matterId}")
data class MatterCreatedEvent(
    override val matterId: UUID,
    val caseNumber: String,
    val title: String,
    val clientId: UUID?,
    val assignedLawyerId: UUID,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : MatterEvent

/**
 * Published when a matter is updated
 */
@Externalized("matter.updated::#{matterId}")
data class MatterUpdatedEvent(
    override val matterId: UUID,
    val changes: Map<String, Any?>,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : MatterEvent

/**
 * Published when matter status changes
 */
@Externalized("matter.status.changed::#{matterId}")
data class MatterStatusChangedEvent(
    override val matterId: UUID,
    val oldStatus: String,
    val newStatus: String,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : MatterEvent

/**
 * Published when a matter is assigned to a different lawyer
 */
@Externalized("matter.assigned::#{matterId}")
data class MatterAssignedEvent(
    override val matterId: UUID,
    val oldLawyerId: UUID?,
    val newLawyerId: UUID,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : MatterEvent

/**
 * Published when a matter is completed/closed
 */
@Externalized("matter.completed::#{matterId}")
data class MatterCompletedEvent(
    override val matterId: UUID,
    val completionDate: LocalDateTime,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : MatterEvent

/**
 * Published when a matter is deleted (soft delete)
 */
@Externalized("matter.deleted::#{matterId}")
data class MatterDeletedEvent(
    override val matterId: UUID,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : MatterEvent

/**
 * Published when documents are requested for a matter
 */
@Externalized("matter.documents.requested::#{matterId}")
data class MatterDocumentsRequestedEvent(
    override val matterId: UUID,
    val documentTypes: List<String>? = null,
    override val timestamp: LocalDateTime = LocalDateTime.now(),
    override val userId: UUID
) : MatterEvent