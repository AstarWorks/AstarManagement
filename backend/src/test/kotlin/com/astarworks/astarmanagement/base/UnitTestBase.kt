package com.astarworks.astarmanagement.base

import org.junit.jupiter.api.Tag

/**
 * Base class for unit tests.
 * 
 * Unit tests should:
 * - Test individual classes/methods in isolation
 * - Use MockK for all dependencies
 * - Run extremely fast (milliseconds)
 * - Make up 70-80% of all tests
 * 
 * Note: MockK does not require @ExtendWith annotation
 */
@Tag("unit")
abstract class UnitTestBase