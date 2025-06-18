package com.astermanagement.api.domain

import com.astermanagement.api.domain.matter.MatterStatus
import com.astermanagement.api.domain.matter.MatterStatus.*
import com.astermanagement.api.domain.user.UserRole
import com.astermanagement.api.domain.user.UserRole.*

/**
 * Defines the business rules for matter status transitions.
 * Based on the status-transition-matrix.md requirements.
 */
object StatusTransitionRules {

    /**
     * Represents a status transition.
     */
    data class Transition(
        val from: MatterStatus,
        val to: MatterStatus
    )

    /**
     * Defines allowed transitions for each status.
     */
    val allowedTransitions: Map<MatterStatus, Set<MatterStatus>> = mapOf(
        NEW to setOf(ACTIVE, ON_HOLD),
        ACTIVE to setOf(IN_REVIEW, ON_HOLD, CLOSED, SETTLEMENT, TRIAL),
        IN_REVIEW to setOf(ACTIVE, CLOSED, SETTLEMENT),
        ON_HOLD to setOf(ACTIVE, CLOSED),
        CLOSED to emptySet(), // Terminal status - no transitions allowed
        SETTLEMENT to setOf(CLOSED),
        TRIAL to setOf(CLOSED, SETTLEMENT)
    )

    /**
     * Defines which roles can perform specific transitions.
     */
    val rolePermissions: Map<UserRole, Set<Transition>> = mapOf(
        LAWYER to setOf(
            // Lawyers can perform all transitions
            Transition(NEW, ACTIVE),
            Transition(NEW, ON_HOLD),
            Transition(ACTIVE, IN_REVIEW),
            Transition(ACTIVE, ON_HOLD),
            Transition(ACTIVE, CLOSED),
            Transition(ACTIVE, SETTLEMENT),
            Transition(ACTIVE, TRIAL),
            Transition(IN_REVIEW, ACTIVE),
            Transition(IN_REVIEW, CLOSED),
            Transition(IN_REVIEW, SETTLEMENT),
            Transition(ON_HOLD, ACTIVE),
            Transition(ON_HOLD, CLOSED),
            Transition(SETTLEMENT, CLOSED),
            Transition(TRIAL, CLOSED),
            Transition(TRIAL, SETTLEMENT)
        ),
        CLERK to setOf(
            // Clerks have limited transitions - cannot close, handle settlements, or trial
            Transition(NEW, ACTIVE),
            Transition(NEW, ON_HOLD),
            Transition(ACTIVE, IN_REVIEW),
            Transition(ACTIVE, ON_HOLD),
            Transition(IN_REVIEW, ACTIVE),
            Transition(ON_HOLD, ACTIVE)
        ),
        CLIENT to emptySet() // Clients cannot change status
    )

    /**
     * Critical transitions that require extra confirmation.
     */
    val criticalTransitions: Set<Transition> = setOf(
        // Any transition to CLOSED
        Transition(ACTIVE, CLOSED),
        Transition(IN_REVIEW, CLOSED),
        Transition(ON_HOLD, CLOSED),
        Transition(SETTLEMENT, CLOSED),
        Transition(TRIAL, CLOSED),
        // Transitions to SETTLEMENT or TRIAL
        Transition(ACTIVE, SETTLEMENT),
        Transition(ACTIVE, TRIAL),
        Transition(IN_REVIEW, SETTLEMENT),
        Transition(TRIAL, SETTLEMENT)
    )

    /**
     * Transitions that require a reason to be provided.
     */
    val transitionsRequiringReason: Set<Transition> = setOf(
        // All closures require a reason
        Transition(ACTIVE, CLOSED),
        Transition(IN_REVIEW, CLOSED),
        Transition(ON_HOLD, CLOSED),
        Transition(SETTLEMENT, CLOSED),
        Transition(TRIAL, CLOSED),
        // Moving to ON_HOLD requires explanation
        Transition(NEW, ON_HOLD),
        Transition(ACTIVE, ON_HOLD),
        // Settlement and trial transitions
        Transition(ACTIVE, SETTLEMENT),
        Transition(ACTIVE, TRIAL),
        Transition(IN_REVIEW, SETTLEMENT),
        Transition(TRIAL, SETTLEMENT)
    )

    /**
     * Checks if a transition is allowed based on the current status.
     */
    fun isTransitionAllowed(from: MatterStatus, to: MatterStatus): Boolean {
        return allowedTransitions[from]?.contains(to) ?: false
    }

    /**
     * Checks if a user role can perform a specific transition.
     */
    fun canRolePerformTransition(role: UserRole, from: MatterStatus, to: MatterStatus): Boolean {
        val transition = Transition(from, to)
        return rolePermissions[role]?.contains(transition) ?: false
    }

    /**
     * Checks if a transition is critical and requires extra confirmation.
     */
    fun isCriticalTransition(from: MatterStatus, to: MatterStatus): Boolean {
        return criticalTransitions.contains(Transition(from, to))
    }

    /**
     * Checks if a transition requires a reason to be provided.
     */
    fun requiresReason(from: MatterStatus, to: MatterStatus): Boolean {
        return transitionsRequiringReason.contains(Transition(from, to))
    }

    /**
     * Gets a human-readable error message for invalid transitions.
     */
    fun getTransitionError(from: MatterStatus, to: MatterStatus, role: UserRole): String {
        return when {
            !isTransitionAllowed(from, to) -> 
                "Invalid transition: Cannot move from ${from.name} to ${to.name}"
            !canRolePerformTransition(role, from, to) -> 
                "Insufficient permissions: ${role.name} cannot perform this status change"
            from == CLOSED -> 
                "Cannot transition from CLOSED status - it is a terminal state"
            else -> 
                "Unknown transition error"
        }
    }
}