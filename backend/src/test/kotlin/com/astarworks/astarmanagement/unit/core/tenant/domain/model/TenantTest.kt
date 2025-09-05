package com.astarworks.astarmanagement.unit.core.tenant.domain.model

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.fixture.builder.DomainModelTestBuilder
import com.astarworks.astarmanagement.shared.domain.value.EntityId
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import org.junit.jupiter.params.provider.ValueSource
import java.time.Instant
import java.util.UUID
import java.util.stream.Stream

@UnitTest
@DisplayName("Tenant Domain Model Tests")
class TenantTest {
    
    companion object {
        @JvmStatic
        fun invalidSlugCases(): Stream<String> {
            return DomainModelTestBuilder.invalidSlugs().stream()
        }
        
        @JvmStatic
        fun validSlugCases(): Stream<String> {
            return Stream.of(
                "valid",
                "valid-slug",
                "slug123",
                "123-slug",
                "a",
                "a".repeat(100) // exactly at limit
            )
        }
        
        @JvmStatic
        fun invalidNameCases(): Stream<String> {
            return Stream.of("", "   ", "\t", "\n")
        }
        
        @JvmStatic
        fun invalidAuth0OrgIdCases(): Stream<String> {
            return Stream.of("", "   ", "\t", "\n")
        }
    }
    
    @Nested
    @DisplayName("Construction and Validation Tests")
    inner class ConstructionTests {
        
        @Test
        @DisplayName("Should create tenant with valid parameters")
        fun `should create tenant with valid parameters`() {
            // Given
            val slug = "test-tenant"
            val name = "Test Tenant"
            val auth0OrgId = "org_123456"
            
            // When
            val tenant = DomainModelTestBuilder.tenant(
                slug = slug,
                name = name,
                auth0OrgId = auth0OrgId
            )
            
            // Then
            assertEquals(slug, tenant.slug)
            assertEquals(name, tenant.name)
            assertEquals(auth0OrgId, tenant.auth0OrgId)
            assertTrue(tenant.isActive)
            assertNotNull(tenant.id)
            assertNotNull(tenant.createdAt)
            assertNotNull(tenant.updatedAt)
        }
        
        @Test
        @DisplayName("Should create tenant with default values")
        fun `should create tenant with default values`() {
            // When
            val tenant = DomainModelTestBuilder.tenant(
                slug = "test",
                name = "Test"
            )
            
            // Then
            assertEquals("test", tenant.slug)
            assertEquals("Test", tenant.name)
            assertNull(tenant.auth0OrgId)
            assertTrue(tenant.isActive)
        }
        
        @Test
        @DisplayName("Should generate unique ID automatically")
        fun `should generate unique ID automatically`() {
            // When
            val tenant1 = DomainModelTestBuilder.tenant(slug = "tenant1", name = "Tenant 1")
            val tenant2 = DomainModelTestBuilder.tenant(slug = "tenant2", name = "Tenant 2")
            
            // Then
            assertNotNull(tenant1.id)
            assertNotNull(tenant2.id)
            assertNotEquals(tenant1.id, tenant2.id)
        }
        
        @ParameterizedTest(name = "Should accept valid slug: ''{0}''")
        @MethodSource("com.astarworks.astarmanagement.unit.core.tenant.domain.model.TenantTest#validSlugCases")
        fun `should accept valid slugs`(validSlug: String) {
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.tenant(slug = validSlug, name = "Valid Tenant")
            }
        }
        
        @ParameterizedTest(name = "Should reject invalid slug: ''{0}''")
        @MethodSource("com.astarworks.astarmanagement.unit.core.tenant.domain.model.TenantTest#invalidSlugCases")
        fun `should reject invalid slugs`(invalidSlug: String) {
            // When & Then
            assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.tenant(slug = invalidSlug, name = "Invalid Tenant")
            }
        }
        
        @ParameterizedTest(name = "Should reject blank name: ''{0}''")
        @MethodSource("com.astarworks.astarmanagement.unit.core.tenant.domain.model.TenantTest#invalidNameCases")
        fun `should reject blank names`(invalidName: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.tenant(slug = "valid", name = invalidName)
            }
            assertEquals("Tenant name cannot be blank", exception.message)
        }
        
        @Test
        @DisplayName("Should reject slug over 100 characters")
        fun `should reject slug over 100 characters`() {
            // Given
            val tooLongSlug = "a".repeat(101)
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.tenant(slug = tooLongSlug, name = "Valid Name")
            }
            assertEquals("Tenant slug cannot exceed 100 characters", exception.message)
        }
        
        @Test
        @DisplayName("Should reject name over 255 characters")
        fun `should reject name over 255 characters`() {
            // Given
            val tooLongName = "a".repeat(256)
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.tenant(slug = "valid", name = tooLongName)
            }
            assertEquals("Tenant name cannot exceed 255 characters", exception.message)
        }
        
        @Test
        @DisplayName("Should accept name at 255 character limit")
        fun `should accept name at 255 character limit`() {
            // Given
            val nameAt255 = "a".repeat(255)
            
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.tenant(slug = "valid", name = nameAt255)
            }
        }
    }
    
    @Nested
    @DisplayName("Slug Validation Tests")
    inner class SlugValidationTests {
        
        @ParameterizedTest
        @ValueSource(strings = ["UPPER", "MiXeD", "CamelCase"])
        @DisplayName("Should reject uppercase letters in slug")
        fun `should reject uppercase letters in slug`(invalidSlug: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.tenant(slug = invalidSlug, name = "Valid Name")
            }
            assertTrue(exception.message?.contains("can only contain lowercase letters, numbers, and hyphens") == true)
        }
        
        @ParameterizedTest
        @ValueSource(strings = ["with spaces", "with\ttab", "with\nnewline"])
        @DisplayName("Should reject whitespace in slug")
        fun `should reject whitespace in slug`(invalidSlug: String) {
            // When & Then
            assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.tenant(slug = invalidSlug, name = "Valid Name")
            }
        }
        
        @ParameterizedTest
        @ValueSource(strings = ["with_underscore", "with.dot", "with@symbol", "with#hash", "with%percent"])
        @DisplayName("Should reject special characters except hyphens in slug")
        fun `should reject special characters except hyphens in slug`(invalidSlug: String) {
            // When & Then
            assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.tenant(slug = invalidSlug, name = "Valid Name")
            }
        }
        
        @Test
        @DisplayName("Should accept hyphens in slug")
        fun `should accept hyphens in slug`() {
            // Given
            val slugsWithHyphens = listOf(
                "slug-with-hyphens",
                "start-hyphen",
                "hyphen-end",
                "multiple-hyphens-here",
                "123-456-789"
            )
            
            // When & Then
            slugsWithHyphens.forEach { slug ->
                assertDoesNotThrow {
                    DomainModelTestBuilder.tenant(slug = slug, name = "Valid Name")
                }
            }
        }
        
        @Test
        @DisplayName("Should accept numbers in slug")
        fun `should accept numbers in slug`() {
            // Given
            val slugsWithNumbers = listOf(
                "123",
                "slug123",
                "123slug",
                "slug123slug",
                "test-123-tenant"
            )
            
            // When & Then
            slugsWithNumbers.forEach { slug ->
                assertDoesNotThrow {
                    DomainModelTestBuilder.tenant(slug = slug, name = "Valid Name")
                }
            }
        }
    }
    
    @Nested
    @DisplayName("Activation and Deactivation Tests")
    inner class ActivationTests {
        
        @Test
        @DisplayName("Should deactivate tenant and update timestamp")
        fun `should deactivate tenant and update timestamp`() {
            // Given
            val activeTenant = DomainModelTestBuilder.tenant(slug = "active", name = "Active Tenant")
            val originalUpdatedAt = activeTenant.updatedAt
            assertTrue(activeTenant.isActive)
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val deactivatedTenant = activeTenant.deactivate()
            
            // Then
            assertFalse(deactivatedTenant.isActive)
            assertEquals(activeTenant.id, deactivatedTenant.id)
            assertEquals(activeTenant.slug, deactivatedTenant.slug)
            assertEquals(activeTenant.name, deactivatedTenant.name)
            assertEquals(activeTenant.createdAt, deactivatedTenant.createdAt)
            assertTrue(deactivatedTenant.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @Test
        @DisplayName("Should activate tenant and update timestamp")
        fun `should activate tenant and update timestamp`() {
            // Given
            val inactiveTenant = DomainModelTestBuilder.tenant(
                slug = "inactive",
                name = "Inactive Tenant",
                isActive = false
            )
            val originalUpdatedAt = inactiveTenant.updatedAt
            assertFalse(inactiveTenant.isActive)
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val activatedTenant = inactiveTenant.activate()
            
            // Then
            assertTrue(activatedTenant.isActive)
            assertEquals(inactiveTenant.id, activatedTenant.id)
            assertTrue(activatedTenant.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @Test
        @DisplayName("Should preserve immutability when deactivating")
        fun `should preserve immutability when deactivating`() {
            // Given
            val originalTenant = DomainModelTestBuilder.tenant()
            val originalIsActive = originalTenant.isActive
            
            // When
            val deactivatedTenant = originalTenant.deactivate()
            
            // Then
            assertEquals(originalIsActive, originalTenant.isActive) // Original unchanged
            assertFalse(deactivatedTenant.isActive)
            assertNotSame(originalTenant, deactivatedTenant) // Different instances
        }
    }
    
    @Nested
    @DisplayName("Name Update Tests")
    inner class NameUpdateTests {
        
        @Test
        @DisplayName("Should update name and timestamp")
        fun `should update name and timestamp`() {
            // Given
            val originalTenant = DomainModelTestBuilder.tenant(name = "Original Name")
            val originalUpdatedAt = originalTenant.updatedAt
            val newName = "Updated Name"
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val updatedTenant = originalTenant.updateName(newName)
            
            // Then
            assertEquals(newName, updatedTenant.name)
            assertEquals(originalTenant.id, updatedTenant.id)
            assertEquals(originalTenant.slug, updatedTenant.slug)
            assertEquals(originalTenant.createdAt, updatedTenant.createdAt)
            assertTrue(updatedTenant.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @Test
        @DisplayName("Should reject blank name in update")
        fun `should reject blank name in update`() {
            // Given
            val tenant = DomainModelTestBuilder.tenant()
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                tenant.updateName("")
            }
            assertEquals("Tenant name cannot be blank", exception.message)
        }
        
        @Test
        @DisplayName("Should reject too long name in update")
        fun `should reject too long name in update`() {
            // Given
            val tenant = DomainModelTestBuilder.tenant()
            val tooLongName = "a".repeat(256)
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                tenant.updateName(tooLongName)
            }
            assertEquals("Tenant name cannot exceed 255 characters", exception.message)
        }
        
        @Test
        @DisplayName("Should preserve immutability when updating name")
        fun `should preserve immutability when updating name`() {
            // Given
            val originalTenant = DomainModelTestBuilder.tenant(name = "Original")
            val originalName = originalTenant.name
            
            // When
            val updatedTenant = originalTenant.updateName("Updated")
            
            // Then
            assertEquals(originalName, originalTenant.name) // Original unchanged
            assertEquals("Updated", updatedTenant.name)
            assertNotSame(originalTenant, updatedTenant) // Different instances
        }
    }
    
    @Nested
    @DisplayName("Auth0 Organization Integration Tests")
    inner class Auth0IntegrationTests {
        
        @Test
        @DisplayName("Should link Auth0 organization and update timestamp")
        fun `should link Auth0 organization and update timestamp`() {
            // Given
            val tenant = DomainModelTestBuilder.tenant()
            val originalUpdatedAt = tenant.updatedAt
            val auth0OrgId = "org_1234567890abcdef"
            assertNull(tenant.auth0OrgId)
            
            // When
            Thread.sleep(1) // Ensure timestamp difference
            val linkedTenant = tenant.linkAuth0Organization(auth0OrgId)
            
            // Then
            assertEquals(auth0OrgId, linkedTenant.auth0OrgId)
            assertEquals(tenant.id, linkedTenant.id)
            assertTrue(linkedTenant.updatedAt.isAfter(originalUpdatedAt))
        }
        
        @ParameterizedTest(name = "Should reject blank Auth0 org ID: ''{0}''")
        @MethodSource("com.astarworks.astarmanagement.unit.core.tenant.domain.model.TenantTest#invalidAuth0OrgIdCases")
        fun `should reject blank Auth0 org ID`(invalidAuth0OrgId: String) {
            // Given
            val tenant = DomainModelTestBuilder.tenant()
            
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                tenant.linkAuth0Organization(invalidAuth0OrgId)
            }
            assertEquals("Auth0 Organization ID cannot be blank", exception.message)
        }
        
        @Test
        @DisplayName("Should handle different Auth0 organization ID formats")
        fun `should handle different Auth0 organization ID formats`() {
            // Given
            val tenant = DomainModelTestBuilder.tenant()
            val validAuth0OrgIds = listOf(
                "org_1234567890abcdef",
                "org_ABCDEFGHIJKLmnop",
                "org_mix3d_Ch4rs_123",
                "ORG_UPPERCASE_12345"
            )
            
            // When & Then
            validAuth0OrgIds.forEach { orgId ->
                assertDoesNotThrow {
                    tenant.linkAuth0Organization(orgId)
                }
            }
        }
        
        @Test
        @DisplayName("Should update existing Auth0 organization link")
        fun `should update existing Auth0 organization link`() {
            // Given
            val tenant = DomainModelTestBuilder.tenant(auth0OrgId = "org_old123")
            val newAuth0OrgId = "org_new456"
            
            // When
            val updatedTenant = tenant.linkAuth0Organization(newAuth0OrgId)
            
            // Then
            assertEquals(newAuth0OrgId, updatedTenant.auth0OrgId)
            assertNotEquals("org_old123", updatedTenant.auth0OrgId)
        }
    }
    
    @Nested
    @DisplayName("Data Class Behavior Tests")
    inner class DataClassBehaviorTests {
        
        @Test
        @DisplayName("Should implement equals and hashCode correctly")
        fun `should implement equals and hashCode correctly`() {
            // Given
            val id = TenantId(UUID.randomUUID())
            val slug = "same-slug"
            val name = "Same Name"
            val timestamp = Instant.now()
            
            val tenant1 = DomainModelTestBuilder.tenant(
                id = id,
                slug = slug,
                name = name,
                createdAt = timestamp,
                updatedAt = timestamp
            )
            val tenant2 = DomainModelTestBuilder.tenant(
                id = id,
                slug = slug,
                name = name,
                createdAt = timestamp,
                updatedAt = timestamp
            )
            
            // Then
            assertEquals(tenant1, tenant2)
            assertEquals(tenant1.hashCode(), tenant2.hashCode())
        }
        
        @Test
        @DisplayName("Should not be equal with different properties")
        fun `should not be equal with different properties`() {
            // Given
            val baseTenant = DomainModelTestBuilder.tenant()
            val differentIdTenant = baseTenant.copy(id = TenantId(UUID.randomUUID()))
            val differentSlugTenant = baseTenant.copy(slug = "different-slug")
            val differentNameTenant = baseTenant.copy(name = "Different Name")
            
            // Then
            assertNotEquals(baseTenant, differentIdTenant)
            assertNotEquals(baseTenant, differentSlugTenant)
            assertNotEquals(baseTenant, differentNameTenant)
        }
        
        @Test
        @DisplayName("Should support copy with parameter changes")
        fun `should support copy with parameter changes`() {
            // Given
            val originalTenant = DomainModelTestBuilder.tenant(
                slug = "original-slug",
                name = "Original Name"
            )
            
            // When
            val copiedTenant = originalTenant.copy(
                slug = "copied-slug",
                name = "Copied Name",
                isActive = false
            )
            
            // Then
            assertEquals("copied-slug", copiedTenant.slug)
            assertEquals("Copied Name", copiedTenant.name)
            assertFalse(copiedTenant.isActive)
            assertEquals(originalTenant.id, copiedTenant.id) // ID preserved
        }
    }
    
    @Nested
    @DisplayName("Edge Cases and Integration Tests")
    inner class EdgeCasesTests {
        
        @Test
        @DisplayName("Should handle Unicode characters in name")
        fun `should handle Unicode characters in name`() {
            // Given
            val unicodeName = "テスト企業 🏢 José María & Associates"
            
            // When & Then
            val tenant = DomainModelTestBuilder.tenant(slug = "unicode-test", name = unicodeName)
            
            assertEquals(unicodeName, tenant.name)
        }
        
        @Test
        @DisplayName("Should handle multiple sequential operations")
        fun `should handle multiple sequential operations`() {
            // Given
            val originalTenant = DomainModelTestBuilder.tenant(slug = "test", name = "Test")
            
            // When
            val finalTenant = originalTenant
                .deactivate()
                .updateName("Updated Name")
                .activate()
                .linkAuth0Organization("org_123456")
            
            // Then
            assertTrue(finalTenant.isActive)
            assertEquals("Updated Name", finalTenant.name)
            assertEquals("org_123456", finalTenant.auth0OrgId)
            assertEquals(originalTenant.id, finalTenant.id) // ID preserved through all operations
        }
        
        @Test
        @DisplayName("Should handle rapid successive updates")
        fun `should handle rapid successive updates`() {
            // Given
            val tenant = DomainModelTestBuilder.tenant()
            
            // When
            var currentTenant = tenant
            repeat(10) { i ->
                currentTenant = currentTenant.updateName("Name $i")
            }
            
            // Then
            assertEquals("Name 9", currentTenant.name)
            assertTrue(currentTenant.updatedAt.isAfter(tenant.updatedAt))
        }
        
        @Test
        @DisplayName("Should preserve slug immutability")
        fun `should preserve slug immutability`() {
            // Given
            val originalSlug = "immutable-slug"
            val tenant = DomainModelTestBuilder.tenant(slug = originalSlug, name = "Test")
            
            // When - Various operations that modify other fields
            val modifiedTenant = tenant
                .updateName("New Name")
                .deactivate()
                .linkAuth0Organization("org_123")
            
            // Then - Slug should remain unchanged
            assertEquals(originalSlug, modifiedTenant.slug)
        }
        
        @Test
        @DisplayName("Should handle boundary values correctly")
        fun `should handle boundary values correctly`() {
            // Given
            val boundarySlug = "a".repeat(100) // Max length
            val boundaryName = "a".repeat(255) // Max length
            
            // When & Then
            val tenant = DomainModelTestBuilder.tenant(slug = boundarySlug, name = boundaryName)
            
            assertEquals(boundarySlug, tenant.slug)
            assertEquals(boundaryName, tenant.name)
        }
    }
}