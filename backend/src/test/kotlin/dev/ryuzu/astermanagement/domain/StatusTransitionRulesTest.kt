package dev.ryuzu.astermanagement.domain

import dev.ryuzu.astermanagement.modules.matter.domain.MatterStatus.*
import dev.ryuzu.astermanagement.domain.user.UserRole.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested

/**
 * Test suite for MatterStatus transitions.
 * Verifies all transition combinations using built-in canTransitionTo method.
 */
class StatusTransitionRulesTest {

    @Nested
    @DisplayName("Allowed Transitions")
    inner class AllowedTransitionsTest {
        
        @Test
        fun `INTAKE status can transition to allowed statuses`() {
            assertTrue(INTAKE.canTransitionTo(INITIAL_REVIEW))
            assertTrue(INTAKE.canTransitionTo(CLOSED))
            assertFalse(INTAKE.canTransitionTo(INVESTIGATION))
            assertFalse(INTAKE.canTransitionTo(SETTLEMENT))
        }
        
        @Test
        fun `FILED status has multiple transition options`() {
            assertTrue(FILED.canTransitionTo(DISCOVERY))
            assertTrue(FILED.canTransitionTo(SETTLEMENT))
            assertTrue(FILED.canTransitionTo(CLOSED))
            assertFalse(FILED.canTransitionTo(INTAKE))
        }
        
        @Test
        fun `SETTLEMENT transitions to CLOSED`() {
            assertTrue(SETTLEMENT.canTransitionTo(CLOSED))
            assertFalse(SETTLEMENT.canTransitionTo(INTAKE))
            assertFalse(SETTLEMENT.canTransitionTo(DISCOVERY))
        }
    }
    
    @Nested
    @DisplayName("Additional Transition Tests")
    inner class AdditionalTransitionTests {
        
        @Test
        fun `INITIAL_REVIEW transitions`() {
            assertTrue(INITIAL_REVIEW.canTransitionTo(INVESTIGATION))
            assertTrue(INITIAL_REVIEW.canTransitionTo(RESEARCH))
            assertTrue(INITIAL_REVIEW.canTransitionTo(CLOSED))
            assertFalse(INITIAL_REVIEW.canTransitionTo(INTAKE))
        }
        
        @Test
        fun `TRIAL transitions`() {
            assertTrue(TRIAL.canTransitionTo(SETTLEMENT))
            assertTrue(TRIAL.canTransitionTo(CLOSED))
            assertFalse(TRIAL.canTransitionTo(INTAKE))
            assertFalse(TRIAL.canTransitionTo(DISCOVERY))
        }
        
        @Test
        fun `CLOSED can reopen to any status`() {
            assertTrue(CLOSED.canTransitionTo(INTAKE))
            assertTrue(CLOSED.canTransitionTo(RESEARCH))
            assertTrue(CLOSED.canTransitionTo(TRIAL))
            assertTrue(CLOSED.canTransitionTo(SETTLEMENT))
        }
    }
}