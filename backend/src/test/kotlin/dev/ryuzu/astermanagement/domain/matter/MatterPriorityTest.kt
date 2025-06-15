package dev.ryuzu.astermanagement.domain.matter

import org.junit.jupiter.api.Test
import kotlin.test.assertEquals

/**
 * Unit tests for MatterPriority enum and business logic
 */
class MatterPriorityTest {

    @Test
    fun `should have correct display names`() {
        assertEquals("Low", MatterPriority.LOW.displayName)
        assertEquals("Medium", MatterPriority.MEDIUM.displayName)
        assertEquals("High", MatterPriority.HIGH.displayName)
        assertEquals("Urgent", MatterPriority.URGENT.displayName)
    }

    @Test
    fun `should have correct priority weights`() {
        assertEquals(1, MatterPriority.LOW.weight)
        assertEquals(2, MatterPriority.MEDIUM.weight)
        assertEquals(3, MatterPriority.HIGH.weight)
        assertEquals(4, MatterPriority.URGENT.weight)
    }

    @Test
    fun `should have ascending priority order`() {
        val priorities = MatterPriority.values()
        for (i in 0 until priorities.size - 1) {
            val current = priorities[i]
            val next = priorities[i + 1]
            assert(current.weight < next.weight) {
                "${current.name} should have lower weight than ${next.name}"
            }
        }
    }
}