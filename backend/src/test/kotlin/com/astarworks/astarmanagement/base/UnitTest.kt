package com.astarworks.astarmanagement.base

import io.mockk.clearAllMocks
import io.mockk.confirmVerified
import io.mockk.junit5.MockKExtension
import org.junit.jupiter.api.AfterEach
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.extension.ExtendWith

/**
 * Base class for unit tests using MockK
 */
@ExtendWith(MockKExtension::class)
abstract class UnitTest {
    @BeforeEach
    fun setupMocks() {
        clearAllMocks()
    }
    
    @AfterEach
    fun verifyMocks() {
        confirmVerified()
    }
}