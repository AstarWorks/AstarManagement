package dev.ryuzu.astermanagement.domain

import com.astermanagement.api.domain.StatusTransitionRules
import dev.ryuzu.astermanagement.domain.matter.MatterStatus.*
import dev.ryuzu.astermanagement.domain.user.UserRole.*
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested

/**
 * Test suite for StatusTransitionRules.
 * Verifies all transition combinations and role permissions.
 */
class StatusTransitionRulesTest {

    @Nested
    @DisplayName("Allowed Transitions")
    inner class AllowedTransitionsTest {
        
        @Test
        fun `NEW status can transition to ACTIVE and ON_HOLD`() {
            assertTrue(StatusTransitionRules.isTransitionAllowed(NEW, ACTIVE))
            assertTrue(StatusTransitionRules.isTransitionAllowed(NEW, ON_HOLD))
            assertFalse(StatusTransitionRules.isTransitionAllowed(NEW, CLOSED))
            assertFalse(StatusTransitionRules.isTransitionAllowed(NEW, IN_REVIEW))
        }
        
        @Test
        fun `ACTIVE status has multiple transition options`() {
            assertTrue(StatusTransitionRules.isTransitionAllowed(ACTIVE, IN_REVIEW))
            assertTrue(StatusTransitionRules.isTransitionAllowed(ACTIVE, ON_HOLD))
            assertTrue(StatusTransitionRules.isTransitionAllowed(ACTIVE, CLOSED))
            assertTrue(StatusTransitionRules.isTransitionAllowed(ACTIVE, SETTLEMENT))
            assertTrue(StatusTransitionRules.isTransitionAllowed(ACTIVE, TRIAL))
            assertFalse(StatusTransitionRules.isTransitionAllowed(ACTIVE, NEW))
        }
        
        @Test
        fun `CLOSED is a terminal status with no transitions`() {
            assertFalse(StatusTransitionRules.isTransitionAllowed(CLOSED, NEW))
            assertFalse(StatusTransitionRules.isTransitionAllowed(CLOSED, ACTIVE))
            assertFalse(StatusTransitionRules.isTransitionAllowed(CLOSED, IN_REVIEW))
            assertFalse(StatusTransitionRules.isTransitionAllowed(CLOSED, ON_HOLD))
            assertFalse(StatusTransitionRules.isTransitionAllowed(CLOSED, SETTLEMENT))
            assertFalse(StatusTransitionRules.isTransitionAllowed(CLOSED, TRIAL))
        }
    }
    
    @Nested
    @DisplayName("Role Permissions")
    inner class RolePermissionsTest {
        
        @Test
        fun `LAWYER can perform all transitions`() {
            // Test critical transitions
            assertTrue(StatusTransitionRules.canRolePerformTransition(LAWYER, ACTIVE, CLOSED))
            assertTrue(StatusTransitionRules.canRolePerformTransition(LAWYER, ACTIVE, SETTLEMENT))
            assertTrue(StatusTransitionRules.canRolePerformTransition(LAWYER, ACTIVE, TRIAL))
            assertTrue(StatusTransitionRules.canRolePerformTransition(LAWYER, TRIAL, CLOSED))
            
            // Test regular transitions
            assertTrue(StatusTransitionRules.canRolePerformTransition(LAWYER, NEW, ACTIVE))
            assertTrue(StatusTransitionRules.canRolePerformTransition(LAWYER, ACTIVE, IN_REVIEW))
        }
        
        @Test
        fun `CLERK has limited permissions`() {
            // Allowed transitions
            assertTrue(StatusTransitionRules.canRolePerformTransition(CLERK, NEW, ACTIVE))
            assertTrue(StatusTransitionRules.canRolePerformTransition(CLERK, ACTIVE, IN_REVIEW))
            assertTrue(StatusTransitionRules.canRolePerformTransition(CLERK, ON_HOLD, ACTIVE))
            
            // Forbidden transitions
            assertFalse(StatusTransitionRules.canRolePerformTransition(CLERK, ACTIVE, CLOSED))
            assertFalse(StatusTransitionRules.canRolePerformTransition(CLERK, ACTIVE, SETTLEMENT))
            assertFalse(StatusTransitionRules.canRolePerformTransition(CLERK, ACTIVE, TRIAL))
            assertFalse(StatusTransitionRules.canRolePerformTransition(CLERK, IN_REVIEW, CLOSED))
        }
        
        @Test
        fun `CLIENT cannot perform any transitions`() {
            assertFalse(StatusTransitionRules.canRolePerformTransition(CLIENT, NEW, ACTIVE))
            assertFalse(StatusTransitionRules.canRolePerformTransition(CLIENT, ACTIVE, CLOSED))
            assertFalse(StatusTransitionRules.canRolePerformTransition(CLIENT, ON_HOLD, ACTIVE))
        }
    }
    
    @Nested
    @DisplayName("Critical Transitions")
    inner class CriticalTransitionsTest {
        
        @Test
        fun `transitions to CLOSED are critical`() {
            assertTrue(StatusTransitionRules.isCriticalTransition(ACTIVE, CLOSED))
            assertTrue(StatusTransitionRules.isCriticalTransition(IN_REVIEW, CLOSED))
            assertTrue(StatusTransitionRules.isCriticalTransition(ON_HOLD, CLOSED))
            assertTrue(StatusTransitionRules.isCriticalTransition(SETTLEMENT, CLOSED))
            assertTrue(StatusTransitionRules.isCriticalTransition(TRIAL, CLOSED))
        }
        
        @Test
        fun `transitions to SETTLEMENT and TRIAL are critical`() {
            assertTrue(StatusTransitionRules.isCriticalTransition(ACTIVE, SETTLEMENT))
            assertTrue(StatusTransitionRules.isCriticalTransition(ACTIVE, TRIAL))
            assertTrue(StatusTransitionRules.isCriticalTransition(IN_REVIEW, SETTLEMENT))
            assertTrue(StatusTransitionRules.isCriticalTransition(TRIAL, SETTLEMENT))
        }
        
        @Test
        fun `regular transitions are not critical`() {
            assertFalse(StatusTransitionRules.isCriticalTransition(NEW, ACTIVE))
            assertFalse(StatusTransitionRules.isCriticalTransition(ACTIVE, IN_REVIEW))
            assertFalse(StatusTransitionRules.isCriticalTransition(ON_HOLD, ACTIVE))
        }
    }
    
    @Nested
    @DisplayName("Transitions Requiring Reason")
    inner class TransitionsRequiringReasonTest {
        
        @Test
        fun `all closures require a reason`() {
            assertTrue(StatusTransitionRules.requiresReason(ACTIVE, CLOSED))
            assertTrue(StatusTransitionRules.requiresReason(IN_REVIEW, CLOSED))
            assertTrue(StatusTransitionRules.requiresReason(ON_HOLD, CLOSED))
            assertTrue(StatusTransitionRules.requiresReason(SETTLEMENT, CLOSED))
            assertTrue(StatusTransitionRules.requiresReason(TRIAL, CLOSED))
        }
        
        @Test
        fun `transitions to ON_HOLD require a reason`() {
            assertTrue(StatusTransitionRules.requiresReason(NEW, ON_HOLD))
            assertTrue(StatusTransitionRules.requiresReason(ACTIVE, ON_HOLD))
        }
        
        @Test
        fun `settlement and trial transitions require a reason`() {
            assertTrue(StatusTransitionRules.requiresReason(ACTIVE, SETTLEMENT))
            assertTrue(StatusTransitionRules.requiresReason(ACTIVE, TRIAL))
            assertTrue(StatusTransitionRules.requiresReason(IN_REVIEW, SETTLEMENT))
            assertTrue(StatusTransitionRules.requiresReason(TRIAL, SETTLEMENT))
        }
        
        @Test
        fun `regular transitions do not require a reason`() {
            assertFalse(StatusTransitionRules.requiresReason(NEW, ACTIVE))
            assertFalse(StatusTransitionRules.requiresReason(ACTIVE, IN_REVIEW))
            assertFalse(StatusTransitionRules.requiresReason(IN_REVIEW, ACTIVE))
        }
    }
    
    @Nested
    @DisplayName("Error Messages")
    inner class ErrorMessagesTest {
        
        @Test
        fun `invalid transition error message`() {
            val error = StatusTransitionRules.getTransitionError(NEW, CLOSED, LAWYER)
            assertEquals("Invalid transition: Cannot move from NEW to CLOSED", error)
        }
        
        @Test
        fun `insufficient permissions error message`() {
            val error = StatusTransitionRules.getTransitionError(ACTIVE, CLOSED, CLERK)
            assertEquals("Insufficient permissions: CLERK cannot perform this status change", error)
        }
        
        @Test
        fun `terminal state error message`() {
            val error = StatusTransitionRules.getTransitionError(CLOSED, ACTIVE, LAWYER)
            assertEquals("Cannot transition from CLOSED status - it is a terminal state", error)
        }
    }
}