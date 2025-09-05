package com.astarworks.astarmanagement.unit.core.tenant.infrastructure.persistence.mapper

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.tenant.domain.model.Tenant
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.entity.SpringDataJdbcTenantTable
import com.astarworks.astarmanagement.core.tenant.infrastructure.persistence.mapper.SpringDataJdbcTenantMapper
import com.astarworks.astarmanagement.shared.domain.value.TenantId
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.UUID

@DisplayName("SpringDataJdbcTenantMapper - Tenant Entity Mapping")
class SpringDataJdbcTenantMapperTest : UnitTestBase() {
    
    private val mapper = SpringDataJdbcTenantMapper()
    
    @Nested
    @DisplayName("Domain to Entity Conversion")
    inner class DomainToEntityConversion {
        
        @Test
        @DisplayName("Should convert Tenant domain to SpringDataJdbcTenantTable entity")
        fun shouldConvertTenantToTable() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val slug = "test-tenant"
            val name = "Test Tenant Organization"
            val auth0OrgId = "org_123456789"
            val isActive = true
            val createdAt = Instant.now().minusSeconds(3600)
            val updatedAt = Instant.now()
            
            val tenant = Tenant(
                id = tenantId,
                slug = slug,
                name = name,
                auth0OrgId = auth0OrgId,
                isActive = isActive,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val result = mapper.toTable(tenant)
            
            // Then
            assertNotNull(result)
            assertEquals(tenantId, result.id)
            assertEquals(slug, result.slug)
            assertEquals(name, result.name)
            assertEquals(auth0OrgId, result.auth0OrgId)
            assertEquals(isActive, result.isActive)
            assertEquals(createdAt, result.createdAt)
            assertEquals(updatedAt, result.updatedAt)
            assertNull(result.version) // New entity has null version
        }
        
        @Test
        @DisplayName("Should handle Tenant without Auth0 Organization ID")
        fun shouldHandleTenantWithoutAuth0OrgId() {
            // Given
            val tenant = Tenant(
                slug = "no-auth0",
                name = "No Auth0 Tenant",
                auth0OrgId = null
            )
            
            // When
            val result = mapper.toTable(tenant)
            
            // Then
            assertEquals("no-auth0", result.slug)
            assertEquals("No Auth0 Tenant", result.name)
            assertNull(result.auth0OrgId)
            assertTrue(result.isActive)
            assertNull(result.version)
        }
        
        @Test
        @DisplayName("Should preserve Value Object TenantId during conversion")
        fun shouldPreserveTenantIdValueObject() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val tenant = Tenant(
                id = tenantId,
                slug = "test-slug",
                name = "Test Name"
            )
            
            // When
            val result = mapper.toTable(tenant)
            
            // Then
            assertEquals(tenantId, result.id)
            assertEquals(tenantId.value, result.id.value)
        }
        
        @Test
        @DisplayName("Should handle inactive tenant")
        fun shouldHandleInactiveTenant() {
            // Given
            val tenant = Tenant(
                slug = "inactive-tenant",
                name = "Inactive Tenant",
                isActive = false
            )
            
            // When
            val result = mapper.toTable(tenant)
            
            // Then
            assertFalse(result.isActive)
        }
        
        @Test
        @DisplayName("Should convert list of Tenants to table entities")
        fun shouldConvertTenantListToTableList() {
            // Given
            val tenants = listOf(
                Tenant(slug = "tenant-1", name = "Tenant One"),
                Tenant(slug = "tenant-2", name = "Tenant Two", auth0OrgId = "org_abc"),
                Tenant(slug = "tenant-3", name = "Tenant Three", isActive = false)
            )
            
            // When
            val result = mapper.toTableList(tenants)
            
            // Then
            assertEquals(3, result.size)
            assertEquals("tenant-1", result[0].slug)
            assertEquals("Tenant One", result[0].name)
            assertNull(result[0].auth0OrgId)
            assertEquals("tenant-2", result[1].slug)
            assertEquals("org_abc", result[1].auth0OrgId)
            assertEquals("tenant-3", result[2].slug)
            assertFalse(result[2].isActive)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion to table")
        fun shouldHandleEmptyListToTable() {
            // Given
            val tenants = emptyList<Tenant>()
            
            // When
            val result = mapper.toTableList(tenants)
            
            // Then
            assertTrue(result.isEmpty())
        }
    }
    
    @Nested
    @DisplayName("Entity to Domain Conversion")
    inner class EntityToDomainConversion {
        
        @Test
        @DisplayName("Should convert SpringDataJdbcTenantTable entity to Tenant domain")
        fun shouldConvertTableToTenant() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val slug = "entity-tenant"
            val name = "Entity Tenant Organization"
            val auth0OrgId = "org_987654321"
            val isActive = true
            val createdAt = Instant.now().minusSeconds(7200)
            val updatedAt = Instant.now()
            
            val table = SpringDataJdbcTenantTable(
                id = tenantId,
                version = 3L,
                slug = slug,
                name = name,
                auth0OrgId = auth0OrgId,
                isActive = isActive,
                createdAt = createdAt,
                updatedAt = updatedAt
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNotNull(result)
            assertEquals(tenantId, result.id)
            assertEquals(slug, result.slug)
            assertEquals(name, result.name)
            assertEquals(auth0OrgId, result.auth0OrgId)
            assertEquals(isActive, result.isActive)
            assertEquals(createdAt, result.createdAt)
            assertEquals(updatedAt, result.updatedAt)
        }
        
        @Test
        @DisplayName("Should handle entity with null Auth0 Organization ID")
        fun shouldHandleEntityWithNullAuth0OrgId() {
            // Given
            val table = SpringDataJdbcTenantTable(
                id = TenantId(UUID.randomUUID()),
                version = 0L,
                slug = "no-auth0-entity",
                name = "No Auth0 Entity",
                auth0OrgId = null,
                isActive = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertNull(result.auth0OrgId)
            assertEquals("no-auth0-entity", result.slug)
        }
        
        @Test
        @DisplayName("Should preserve TenantId Value Object from entity")
        fun shouldPreserveTenantIdFromEntity() {
            // Given
            val tenantId = TenantId(UUID.randomUUID())
            val table = SpringDataJdbcTenantTable(
                id = tenantId,
                version = null,
                slug = "preserve-test",
                name = "Preserve Test",
                isActive = true,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertEquals(tenantId, result.id)
            assertEquals(tenantId.value, result.id.value)
        }
        
        @Test
        @DisplayName("Should handle inactive entity")
        fun shouldHandleInactiveEntity() {
            // Given
            val table = SpringDataJdbcTenantTable(
                id = TenantId(UUID.randomUUID()),
                version = 1L,
                slug = "inactive-entity",
                name = "Inactive Entity",
                isActive = false,
                createdAt = Instant.now(),
                updatedAt = Instant.now()
            )
            
            // When
            val result = mapper.toDomain(table)
            
            // Then
            assertFalse(result.isActive)
        }
        
        @Test
        @DisplayName("Should convert list of table entities to Tenants")
        fun shouldConvertTableListToTenantList() {
            // Given
            val tables = listOf(
                SpringDataJdbcTenantTable(
                    id = TenantId(UUID.randomUUID()),
                    version = 1L,
                    slug = "entity-1",
                    name = "Entity One",
                    auth0OrgId = "org_1",
                    isActive = true,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                ),
                SpringDataJdbcTenantTable(
                    id = TenantId(UUID.randomUUID()),
                    version = null,
                    slug = "entity-2",
                    name = "Entity Two",
                    auth0OrgId = null,
                    isActive = false,
                    createdAt = Instant.now(),
                    updatedAt = Instant.now()
                )
            )
            
            // When
            val result = mapper.toDomainList(tables)
            
            // Then
            assertEquals(2, result.size)
            assertEquals("entity-1", result[0].slug)
            assertEquals("org_1", result[0].auth0OrgId)
            assertTrue(result[0].isActive)
            assertEquals("entity-2", result[1].slug)
            assertNull(result[1].auth0OrgId)
            assertFalse(result[1].isActive)
        }
        
        @Test
        @DisplayName("Should handle empty list conversion from table")
        fun shouldHandleEmptyListFromTable() {
            // Given
            val tables = emptyList<SpringDataJdbcTenantTable>()
            
            // When
            val result = mapper.toDomainList(tables)
            
            // Then
            assertTrue(result.isEmpty())
        }
    }
    
    @Nested
    @DisplayName("Bidirectional Conversion")
    inner class BidirectionalConversion {
        
        @Test
        @DisplayName("Should maintain data integrity in round-trip conversion (Domain -> Entity -> Domain)")
        fun shouldMaintainIntegrityDomainToEntityToDomain() {
            // Given
            val originalTenant = Tenant(
                id = TenantId(UUID.randomUUID()),
                slug = "round-trip",
                name = "Round Trip Tenant",
                auth0OrgId = "org_roundtrip",
                isActive = true,
                createdAt = Instant.now().minusSeconds(1000),
                updatedAt = Instant.now()
            )
            
            // When
            val table = mapper.toTable(originalTenant)
            val resultTenant = mapper.toDomain(table)
            
            // Then
            assertEquals(originalTenant.id, resultTenant.id)
            assertEquals(originalTenant.slug, resultTenant.slug)
            assertEquals(originalTenant.name, resultTenant.name)
            assertEquals(originalTenant.auth0OrgId, resultTenant.auth0OrgId)
            assertEquals(originalTenant.isActive, resultTenant.isActive)
            assertEquals(originalTenant.createdAt, resultTenant.createdAt)
            assertEquals(originalTenant.updatedAt, resultTenant.updatedAt)
        }
        
        @Test
        @DisplayName("Should maintain data integrity with null Auth0 ID")
        fun shouldMaintainIntegrityWithNullAuth0Id() {
            // Given
            val originalTenant = Tenant(
                slug = "no-auth0-trip",
                name = "No Auth0 Trip",
                auth0OrgId = null
            )
            
            // When
            val table = mapper.toTable(originalTenant)
            val resultTenant = mapper.toDomain(table)
            
            // Then
            assertEquals(originalTenant.slug, resultTenant.slug)
            assertEquals(originalTenant.name, resultTenant.name)
            assertNull(resultTenant.auth0OrgId)
        }
        
        @Test
        @DisplayName("Should handle Tenant.deactivate method")
        fun shouldHandleDeactivateMethod() {
            // Given
            val originalTenant = Tenant(
                slug = "active-tenant",
                name = "Active Tenant",
                isActive = true
            )
            val deactivatedTenant = originalTenant.deactivate()
            
            // When
            val table = mapper.toTable(deactivatedTenant)
            val resultTenant = mapper.toDomain(table)
            
            // Then
            assertFalse(resultTenant.isActive)
            assertEquals(originalTenant.slug, resultTenant.slug)
            assertEquals(originalTenant.name, resultTenant.name)
            assertTrue(resultTenant.updatedAt.isAfter(originalTenant.updatedAt))
        }
        
        @Test
        @DisplayName("Should handle Tenant.activate method")
        fun shouldHandleActivateMethod() {
            // Given
            val originalTenant = Tenant(
                slug = "inactive-tenant",
                name = "Inactive Tenant",
                isActive = false
            )
            val activatedTenant = originalTenant.activate()
            
            // When
            val table = mapper.toTable(activatedTenant)
            val resultTenant = mapper.toDomain(table)
            
            // Then
            assertTrue(resultTenant.isActive)
            assertTrue(resultTenant.updatedAt.isAfter(originalTenant.updatedAt))
        }
        
        @Test
        @DisplayName("Should handle Tenant.updateName method")
        fun shouldHandleUpdateNameMethod() {
            // Given
            val originalTenant = Tenant(
                slug = "update-name",
                name = "Old Name"
            )
            val updatedTenant = originalTenant.updateName("New Name")
            
            // When
            val table = mapper.toTable(updatedTenant)
            val resultTenant = mapper.toDomain(table)
            
            // Then
            assertEquals("New Name", resultTenant.name)
            assertEquals(originalTenant.slug, resultTenant.slug)
            assertTrue(resultTenant.updatedAt.isAfter(originalTenant.updatedAt))
        }
        
        @Test
        @DisplayName("Should handle Tenant.linkAuth0Organization method")
        fun shouldHandleLinkAuth0OrganizationMethod() {
            // Given
            val originalTenant = Tenant(
                slug = "link-auth0",
                name = "Link Auth0 Tenant",
                auth0OrgId = null
            )
            val linkedTenant = originalTenant.linkAuth0Organization("org_new123")
            
            // When
            val table = mapper.toTable(linkedTenant)
            val resultTenant = mapper.toDomain(table)
            
            // Then
            assertEquals("org_new123", resultTenant.auth0OrgId)
            assertEquals(originalTenant.slug, resultTenant.slug)
            assertTrue(resultTenant.updatedAt.isAfter(originalTenant.updatedAt))
        }
    }
    
    @Nested
    @DisplayName("Special Cases and Edge Cases")
    inner class SpecialCases {
        
        @Test
        @DisplayName("Should handle Tenant with maximum length slug")
        fun shouldHandleMaxLengthSlug() {
            // Given
            val maxLengthSlug = "a".repeat(75) + "-" + "b".repeat(24)  // Total 100 chars
            val tenant = Tenant(
                slug = maxLengthSlug,
                name = "Max Slug Tenant"
            )
            
            // When
            val table = mapper.toTable(tenant)
            val resultTenant = mapper.toDomain(table)
            
            // Then
            assertEquals(maxLengthSlug, resultTenant.slug)
            assertEquals(100, resultTenant.slug.length)
        }
        
        @Test
        @DisplayName("Should handle Tenant with maximum length name")
        fun shouldHandleMaxLengthName() {
            // Given
            val maxLengthName = "T".repeat(255)
            val tenant = Tenant(
                slug = "max-name",
                name = maxLengthName
            )
            
            // When
            val table = mapper.toTable(tenant)
            val resultTenant = mapper.toDomain(table)
            
            // Then
            assertEquals(maxLengthName, resultTenant.name)
            assertEquals(255, resultTenant.name.length)
        }
        
        @Test
        @DisplayName("Should handle Tenant with hyphenated slug")
        fun shouldHandleHyphenatedSlug() {
            // Given
            val hyphenatedSlug = "test-tenant-with-many-hyphens-123"
            val tenant = Tenant(
                slug = hyphenatedSlug,
                name = "Hyphenated Tenant"
            )
            
            // When
            val table = mapper.toTable(tenant)
            val resultTenant = mapper.toDomain(table)
            
            // Then
            assertEquals(hyphenatedSlug, resultTenant.slug)
        }
        
        @Test
        @DisplayName("Should preserve exact Instant timestamps")
        fun shouldPreserveExactTimestamps() {
            // Given
            val preciseCreatedAt = Instant.parse("2024-01-15T10:30:45.123456789Z")
            val preciseUpdatedAt = Instant.parse("2024-01-15T14:25:30.987654321Z")
            
            val tenant = Tenant(
                slug = "timestamp-test",
                name = "Timestamp Test",
                createdAt = preciseCreatedAt,
                updatedAt = preciseUpdatedAt
            )
            
            // When
            val table = mapper.toTable(tenant)
            val resultTenant = mapper.toDomain(table)
            
            // Then
            assertEquals(preciseCreatedAt, resultTenant.createdAt)
            assertEquals(preciseUpdatedAt, resultTenant.updatedAt)
        }
        
        @Test
        @DisplayName("Should handle multiple conversions of the same object")
        fun shouldHandleMultipleConversions() {
            // Given
            val tenant = Tenant(
                slug = "multiple-test",
                name = "Multiple Test Tenant"
            )
            
            // When
            val table1 = mapper.toTable(tenant)
            val table2 = mapper.toTable(tenant)
            val table3 = mapper.toTable(tenant)
            
            // Then
            assertEquals(table1.id, table2.id)
            assertEquals(table2.id, table3.id)
            assertEquals(table1.slug, table2.slug)
            assertEquals(table2.slug, table3.slug)
            assertEquals(table1.name, table2.name)
            assertEquals(table2.name, table3.name)
        }
        
        @Test
        @DisplayName("Should handle numeric slug")
        fun shouldHandleNumericSlug() {
            // Given
            val numericSlug = "12345-67890"
            val tenant = Tenant(
                slug = numericSlug,
                name = "Numeric Slug Tenant"
            )
            
            // When
            val table = mapper.toTable(tenant)
            val resultTenant = mapper.toDomain(table)
            
            // Then
            assertEquals(numericSlug, resultTenant.slug)
        }
    }
}