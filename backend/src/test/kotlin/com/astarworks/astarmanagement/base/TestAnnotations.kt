package com.astarworks.astarmanagement.base

import org.junit.jupiter.api.Tag
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.boot.test.autoconfigure.web.servlet.AutoConfigureMockMvc
import org.springframework.boot.test.autoconfigure.web.servlet.WebMvcTest
import org.springframework.boot.test.autoconfigure.data.jdbc.DataJdbcTest
import org.springframework.test.context.ActiveProfiles
import org.springframework.boot.test.autoconfigure.jdbc.AutoConfigureTestDatabase
import kotlin.annotation.AnnotationTarget.*
import kotlin.annotation.AnnotationRetention.*

/**
 * Annotation for unit tests.
 * Use MockK for mocking (no extension needed).
 */
@Target(CLASS)
@Retention(RUNTIME)
@MustBeDocumented
@Tag("unit")
annotation class UnitTest

/**
 * Annotation for integration tests.
 * Loads full Spring context with TestContainers.
 */
@Target(CLASS)
@Retention(RUNTIME)
@MustBeDocumented
@Tag("integration")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.MOCK)
@AutoConfigureMockMvc
@ActiveProfiles("integration")
annotation class IntegrationTest

/**
 * Annotation for web layer tests.
 * Only loads web layer with MockMvc.
 */
@Target(CLASS)
@Retention(RUNTIME)
@MustBeDocumented
@Tag("web")
@WebMvcTest
@ActiveProfiles("unit")
annotation class WebTest

/**
 * Annotation for service layer tests.
 * Loads Spring context without web layer.
 */
@Target(CLASS)
@Retention(RUNTIME)
@MustBeDocumented
@Tag("service")
@SpringBootTest(webEnvironment = SpringBootTest.WebEnvironment.NONE)
@ActiveProfiles("unit")
annotation class ServiceTest

/**
 * Annotation for repository tests.
 * Configures Spring Data JDBC test slice with real database.
 */
@Target(CLASS)
@Retention(RUNTIME)
@MustBeDocumented
@Tag("repository")
@DataJdbcTest
@AutoConfigureTestDatabase(replace = AutoConfigureTestDatabase.Replace.NONE)
@ActiveProfiles("integration")
annotation class RepositoryTest