package dev.ryuzu.astermanagement.domain.matter

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals
import kotlin.test.assertFalse
import kotlin.test.assertTrue

/**
 * Unit tests for MatterStatus enum and business logic
 */
class MatterStatusTest {

    @Test
    fun `should have correct display names`() {
        assertEquals("Intake", MatterStatus.INTAKE.displayName)
        assertEquals("Initial Review", MatterStatus.INITIAL_REVIEW.displayName)
        assertEquals("Investigation", MatterStatus.INVESTIGATION.displayName)
        assertEquals("Research", MatterStatus.RESEARCH.displayName)
        assertEquals("Draft Pleadings", MatterStatus.DRAFT_PLEADINGS.displayName)
        assertEquals("Filed", MatterStatus.FILED.displayName)
        assertEquals("Discovery", MatterStatus.DISCOVERY.displayName)
        assertEquals("Mediation", MatterStatus.MEDIATION.displayName)
        assertEquals("Trial Prep", MatterStatus.TRIAL_PREP.displayName)
        assertEquals("Trial", MatterStatus.TRIAL.displayName)
        assertEquals("Settlement", MatterStatus.SETTLEMENT.displayName)
        assertEquals("Closed", MatterStatus.CLOSED.displayName)
    }

    @Test
    fun `should allow valid transitions from INTAKE`() {
        assertTrue(MatterStatus.INTAKE.canTransitionTo(MatterStatus.INITIAL_REVIEW))
        assertTrue(MatterStatus.INTAKE.canTransitionTo(MatterStatus.CLOSED))
        assertFalse(MatterStatus.INTAKE.canTransitionTo(MatterStatus.FILED))
        assertFalse(MatterStatus.INTAKE.canTransitionTo(MatterStatus.TRIAL))
    }

    @Test
    fun `should allow valid transitions from INITIAL_REVIEW`() {
        assertTrue(MatterStatus.INITIAL_REVIEW.canTransitionTo(MatterStatus.INVESTIGATION))
        assertTrue(MatterStatus.INITIAL_REVIEW.canTransitionTo(MatterStatus.RESEARCH))
        assertTrue(MatterStatus.INITIAL_REVIEW.canTransitionTo(MatterStatus.CLOSED))
        assertFalse(MatterStatus.INITIAL_REVIEW.canTransitionTo(MatterStatus.FILED))
        assertFalse(MatterStatus.INITIAL_REVIEW.canTransitionTo(MatterStatus.TRIAL))
    }

    @Test
    fun `should allow valid transitions from INVESTIGATION`() {
        assertTrue(MatterStatus.INVESTIGATION.canTransitionTo(MatterStatus.RESEARCH))
        assertTrue(MatterStatus.INVESTIGATION.canTransitionTo(MatterStatus.DRAFT_PLEADINGS))
        assertTrue(MatterStatus.INVESTIGATION.canTransitionTo(MatterStatus.CLOSED))
        assertFalse(MatterStatus.INVESTIGATION.canTransitionTo(MatterStatus.INTAKE))
        assertFalse(MatterStatus.INVESTIGATION.canTransitionTo(MatterStatus.TRIAL))
    }

    @Test
    fun `should allow valid transitions from RESEARCH`() {
        assertTrue(MatterStatus.RESEARCH.canTransitionTo(MatterStatus.DRAFT_PLEADINGS))
        assertTrue(MatterStatus.RESEARCH.canTransitionTo(MatterStatus.FILED))
        assertTrue(MatterStatus.RESEARCH.canTransitionTo(MatterStatus.CLOSED))
        assertFalse(MatterStatus.RESEARCH.canTransitionTo(MatterStatus.INTAKE))
        assertFalse(MatterStatus.RESEARCH.canTransitionTo(MatterStatus.TRIAL))
    }

    @Test
    fun `should allow valid transitions from DRAFT_PLEADINGS`() {
        assertTrue(MatterStatus.DRAFT_PLEADINGS.canTransitionTo(MatterStatus.FILED))
        assertTrue(MatterStatus.DRAFT_PLEADINGS.canTransitionTo(MatterStatus.RESEARCH))
        assertTrue(MatterStatus.DRAFT_PLEADINGS.canTransitionTo(MatterStatus.CLOSED))
        assertFalse(MatterStatus.DRAFT_PLEADINGS.canTransitionTo(MatterStatus.INTAKE))
        assertFalse(MatterStatus.DRAFT_PLEADINGS.canTransitionTo(MatterStatus.TRIAL))
    }

    @Test
    fun `should allow valid transitions from FILED`() {
        assertTrue(MatterStatus.FILED.canTransitionTo(MatterStatus.DISCOVERY))
        assertTrue(MatterStatus.FILED.canTransitionTo(MatterStatus.SETTLEMENT))
        assertTrue(MatterStatus.FILED.canTransitionTo(MatterStatus.CLOSED))
        assertFalse(MatterStatus.FILED.canTransitionTo(MatterStatus.INTAKE))
        assertFalse(MatterStatus.FILED.canTransitionTo(MatterStatus.RESEARCH))
    }

    @Test
    fun `should allow valid transitions from DISCOVERY`() {
        assertTrue(MatterStatus.DISCOVERY.canTransitionTo(MatterStatus.MEDIATION))
        assertTrue(MatterStatus.DISCOVERY.canTransitionTo(MatterStatus.TRIAL_PREP))
        assertTrue(MatterStatus.DISCOVERY.canTransitionTo(MatterStatus.SETTLEMENT))
        assertTrue(MatterStatus.DISCOVERY.canTransitionTo(MatterStatus.CLOSED))
        assertFalse(MatterStatus.DISCOVERY.canTransitionTo(MatterStatus.INTAKE))
        assertFalse(MatterStatus.DISCOVERY.canTransitionTo(MatterStatus.RESEARCH))
    }

    @Test
    fun `should allow valid transitions from MEDIATION`() {
        assertTrue(MatterStatus.MEDIATION.canTransitionTo(MatterStatus.SETTLEMENT))
        assertTrue(MatterStatus.MEDIATION.canTransitionTo(MatterStatus.TRIAL_PREP))
        assertTrue(MatterStatus.MEDIATION.canTransitionTo(MatterStatus.CLOSED))
        assertFalse(MatterStatus.MEDIATION.canTransitionTo(MatterStatus.INTAKE))
        assertFalse(MatterStatus.MEDIATION.canTransitionTo(MatterStatus.DISCOVERY))
    }

    @Test
    fun `should allow valid transitions from TRIAL_PREP`() {
        assertTrue(MatterStatus.TRIAL_PREP.canTransitionTo(MatterStatus.TRIAL))
        assertTrue(MatterStatus.TRIAL_PREP.canTransitionTo(MatterStatus.SETTLEMENT))
        assertTrue(MatterStatus.TRIAL_PREP.canTransitionTo(MatterStatus.CLOSED))
        assertFalse(MatterStatus.TRIAL_PREP.canTransitionTo(MatterStatus.INTAKE))
        assertFalse(MatterStatus.TRIAL_PREP.canTransitionTo(MatterStatus.RESEARCH))
    }

    @Test
    fun `should allow valid transitions from TRIAL`() {
        assertTrue(MatterStatus.TRIAL.canTransitionTo(MatterStatus.SETTLEMENT))
        assertTrue(MatterStatus.TRIAL.canTransitionTo(MatterStatus.CLOSED))
        assertFalse(MatterStatus.TRIAL.canTransitionTo(MatterStatus.INTAKE))
        assertFalse(MatterStatus.TRIAL.canTransitionTo(MatterStatus.RESEARCH))
        assertFalse(MatterStatus.TRIAL.canTransitionTo(MatterStatus.DISCOVERY))
    }

    @Test
    fun `should allow valid transitions from SETTLEMENT`() {
        assertTrue(MatterStatus.SETTLEMENT.canTransitionTo(MatterStatus.CLOSED))
        assertFalse(MatterStatus.SETTLEMENT.canTransitionTo(MatterStatus.INTAKE))
        assertFalse(MatterStatus.SETTLEMENT.canTransitionTo(MatterStatus.TRIAL))
        assertFalse(MatterStatus.SETTLEMENT.canTransitionTo(MatterStatus.DISCOVERY))
    }

    @Test
    fun `should allow reopening from CLOSED to any status`() {
        assertTrue(MatterStatus.CLOSED.canTransitionTo(MatterStatus.INTAKE))
        assertTrue(MatterStatus.CLOSED.canTransitionTo(MatterStatus.RESEARCH))
        assertTrue(MatterStatus.CLOSED.canTransitionTo(MatterStatus.TRIAL))
        assertTrue(MatterStatus.CLOSED.canTransitionTo(MatterStatus.SETTLEMENT))
    }
}