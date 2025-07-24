package dev.ryuzu.astermanagement.domain

import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus
import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus.*
import dev.ryuzu.astermanagement.domain.user.UserRole
import dev.ryuzu.astermanagement.domain.user.UserRole.*

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
        INTAKE to setOf(INITIAL_REVIEW, CLOSED),
        INITIAL_REVIEW to setOf(INVESTIGATION, RESEARCH, CLOSED),
        INVESTIGATION to setOf(RESEARCH, DRAFT_PLEADINGS, CLOSED),
        RESEARCH to setOf(DRAFT_PLEADINGS, FILED, CLOSED),
        DRAFT_PLEADINGS to setOf(FILED, RESEARCH, CLOSED),
        FILED to setOf(DISCOVERY, SETTLEMENT, CLOSED),
        DISCOVERY to setOf(MEDIATION, TRIAL_PREP, SETTLEMENT, CLOSED),
        MEDIATION to setOf(SETTLEMENT, TRIAL_PREP, CLOSED),
        TRIAL_PREP to setOf(TRIAL, SETTLEMENT, CLOSED),
        TRIAL to setOf(SETTLEMENT, CLOSED),
        SETTLEMENT to setOf(CLOSED),
        CLOSED to emptySet() // Terminal status - no transitions allowed
    )

    /**
     * Defines which roles can perform specific transitions.
     */
    val rolePermissions: Map<UserRole, Set<Transition>> = mapOf(
        LAWYER to setOf(
            // Lawyers can perform all transitions
            Transition(INTAKE, INITIAL_REVIEW),
            Transition(INTAKE, CLOSED),
            Transition(INITIAL_REVIEW, INVESTIGATION),
            Transition(INITIAL_REVIEW, RESEARCH),
            Transition(INITIAL_REVIEW, CLOSED),
            Transition(INVESTIGATION, RESEARCH),
            Transition(INVESTIGATION, DRAFT_PLEADINGS),
            Transition(INVESTIGATION, CLOSED),
            Transition(RESEARCH, DRAFT_PLEADINGS),
            Transition(RESEARCH, FILED),
            Transition(RESEARCH, CLOSED),
            Transition(DRAFT_PLEADINGS, FILED),
            Transition(DRAFT_PLEADINGS, RESEARCH),
            Transition(DRAFT_PLEADINGS, CLOSED),
            Transition(FILED, DISCOVERY),
            Transition(FILED, SETTLEMENT),
            Transition(FILED, CLOSED),
            Transition(DISCOVERY, MEDIATION),
            Transition(DISCOVERY, TRIAL_PREP),
            Transition(DISCOVERY, SETTLEMENT),
            Transition(DISCOVERY, CLOSED),
            Transition(MEDIATION, SETTLEMENT),
            Transition(MEDIATION, TRIAL_PREP),
            Transition(MEDIATION, CLOSED),
            Transition(TRIAL_PREP, TRIAL),
            Transition(TRIAL_PREP, SETTLEMENT),
            Transition(TRIAL_PREP, CLOSED),
            Transition(TRIAL, SETTLEMENT),
            Transition(TRIAL, CLOSED),
            Transition(SETTLEMENT, CLOSED)
        ),
        CLERK to setOf(
            // Clerks have limited transitions - mainly administrative
            Transition(INTAKE, INITIAL_REVIEW),
            Transition(INITIAL_REVIEW, INVESTIGATION),
            Transition(INITIAL_REVIEW, RESEARCH),
            Transition(INVESTIGATION, RESEARCH),
            Transition(RESEARCH, DRAFT_PLEADINGS),
            Transition(DRAFT_PLEADINGS, FILED)
        ),
        CLIENT to emptySet() // Clients cannot change status
    )

    /**
     * Critical transitions that require extra confirmation.
     */
    val criticalTransitions: Set<Transition> = setOf(
        // Any transition to CLOSED
        Transition(INTAKE, CLOSED),
        Transition(INITIAL_REVIEW, CLOSED),
        Transition(INVESTIGATION, CLOSED),
        Transition(RESEARCH, CLOSED),
        Transition(DRAFT_PLEADINGS, CLOSED),
        Transition(FILED, CLOSED),
        Transition(DISCOVERY, CLOSED),
        Transition(MEDIATION, CLOSED),
        Transition(TRIAL_PREP, CLOSED),
        Transition(TRIAL, CLOSED),
        Transition(SETTLEMENT, CLOSED),
        // Transitions to SETTLEMENT or TRIAL
        Transition(FILED, SETTLEMENT),
        Transition(DISCOVERY, SETTLEMENT),
        Transition(MEDIATION, SETTLEMENT),
        Transition(TRIAL_PREP, SETTLEMENT),
        Transition(TRIAL, SETTLEMENT),
        Transition(TRIAL_PREP, TRIAL)
    )

    /**
     * Transitions that require a reason to be provided.
     */
    val transitionsRequiringReason: Set<Transition> = setOf(
        // All closures require a reason
        Transition(INTAKE, CLOSED),
        Transition(INITIAL_REVIEW, CLOSED),
        Transition(INVESTIGATION, CLOSED),
        Transition(RESEARCH, CLOSED),
        Transition(DRAFT_PLEADINGS, CLOSED),
        Transition(FILED, CLOSED),
        Transition(DISCOVERY, CLOSED),
        Transition(MEDIATION, CLOSED),
        Transition(TRIAL_PREP, CLOSED),
        Transition(TRIAL, CLOSED),
        Transition(SETTLEMENT, CLOSED),
        // Settlement and trial transitions
        Transition(FILED, SETTLEMENT),
        Transition(DISCOVERY, SETTLEMENT),
        Transition(MEDIATION, SETTLEMENT),
        Transition(TRIAL_PREP, SETTLEMENT),
        Transition(TRIAL, SETTLEMENT),
        Transition(TRIAL_PREP, TRIAL)
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