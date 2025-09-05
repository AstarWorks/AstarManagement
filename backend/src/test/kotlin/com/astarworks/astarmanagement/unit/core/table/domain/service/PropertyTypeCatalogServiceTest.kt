package com.astarworks.astarmanagement.unit.core.table.domain.service

import com.astarworks.astarmanagement.base.UnitTestBase
import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyTypeCatalogDto
import com.astarworks.astarmanagement.core.table.api.dto.property.PropertyTypeCatalogResponse
import com.astarworks.astarmanagement.core.table.api.mapper.PropertyTypeCatalogDtoMapper
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCatalog
import com.astarworks.astarmanagement.core.table.domain.model.PropertyTypeCategory
import com.astarworks.astarmanagement.core.table.domain.repository.PropertyTypeCatalogRepository
import com.astarworks.astarmanagement.core.table.domain.service.PropertyTypeCatalogService
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.kotest.matchers.collections.shouldHaveSize
import io.kotest.matchers.collections.shouldBeEmpty
import io.kotest.matchers.collections.shouldContain
import io.mockk.*
import kotlinx.serialization.json.*
import org.junit.jupiter.api.*

/**
 * PropertyTypeCatalogService Unit Tests
 */
@DisplayName("PropertyTypeCatalogService Unit Tests")
class PropertyTypeCatalogServiceTest : UnitTestBase() {

    // Dependencies - Manual MockK initialization
    private val repository = mockk<PropertyTypeCatalogRepository>()
    private val dtoMapper = mockk<PropertyTypeCatalogDtoMapper>()
    
    // Service instance with manual dependency injection
    private val service = PropertyTypeCatalogService(repository, dtoMapper)
    
    // Test data
    private lateinit var textType: PropertyTypeCatalog
    private lateinit var customType: PropertyTypeCatalog
    private lateinit var numberType: PropertyTypeCatalog
    
    // Mock DTO objects for reuse
    private val mockDto = mockk<PropertyTypeCatalogDto>()
    private val mockResponse = mockk<PropertyTypeCatalogResponse>()
    
    @BeforeEach
    fun setUp() {
        clearMocks(repository, dtoMapper, mockDto, mockResponse)
        setupTestData()
    }
    
    private fun setupTestData() {
        // Create sample property types
        textType = PropertyTypeCatalog(
            id = PropertyTypeCatalog.TEXT,
            category = PropertyTypeCategory.BASIC,
            validationSchema = null,
            defaultConfig = buildJsonObject { put("maxLength", JsonPrimitive(500)) },
            uiComponent = "TextInput",
            icon = "text-icon",
            description = "Single line text input",
            isActive = true,
            isCustom = false
        )
        
        customType = PropertyTypeCatalog(
            id = "custom_rating",
            category = PropertyTypeCategory.ADVANCED,
            validationSchema = buildJsonObject { 
                put("min", JsonPrimitive(1))
                put("max", JsonPrimitive(5))
            },
            defaultConfig = buildJsonObject { put("default", JsonPrimitive(3)) },
            uiComponent = "RatingInput",
            icon = "star-icon",
            description = "Custom rating field",
            isActive = true,
            isCustom = true
        )
        
        numberType = PropertyTypeCatalog(
            id = PropertyTypeCatalog.NUMBER,
            category = PropertyTypeCategory.BASIC,
            validationSchema = null,
            defaultConfig = buildJsonObject { put("precision", JsonPrimitive(2)) },
            uiComponent = "NumberInput",
            icon = "number-icon",
            description = "Numeric value input",
            isActive = true,
            isCustom = false
        )
    }
    
    @Nested
    @DisplayName("CRUD Operations")
    inner class CrudOperationsTest {
        
        @Test
        @DisplayName("Should create new property type successfully")
        fun shouldCreatePropertyTypeSuccessfully() {
            // Arrange
            every { repository.existsById(customType.id) } returns false
            every { repository.save(customType) } returns customType
            
            // Act
            val result = service.createPropertyType(customType)
            
            // Assert
            result shouldBe customType
            verify { repository.existsById(customType.id) }
            verify { repository.save(customType) }
        }
        
        @Test
        @DisplayName("Should throw exception when creating property type with duplicate ID")
        fun shouldThrowExceptionWhenCreatingDuplicateId() {
            // Arrange
            every { repository.existsById(customType.id) } returns true
            
            // Act & Assert
            val exception = assertThrows<IllegalArgumentException> {
                service.createPropertyType(customType)
            }
            
            exception.message shouldBe "Property type with ID '${customType.id}' already exists"
            verify { repository.existsById(customType.id) }
        }
        
        @Test
        @DisplayName("Should get property type by ID successfully")
        fun shouldGetPropertyTypeByIdSuccessfully() {
            // Arrange
            every { repository.findById(textType.id) } returns textType
            
            // Act
            val result = service.getPropertyTypeById(textType.id)
            
            // Assert
            result shouldBe textType
            verify { repository.findById(textType.id) }
        }
        
        @Test
        @DisplayName("Should throw exception when property type not found")
        fun shouldThrowExceptionWhenPropertyTypeNotFound() {
            // Arrange
            val unknownId = "unknown_type"
            every { repository.findById(unknownId) } returns null
            
            // Act & Assert
            val exception = assertThrows<IllegalArgumentException> {
                service.getPropertyTypeById(unknownId)
            }
            
            exception.message shouldBe "Property type with ID '$unknownId' not found"
            verify { repository.findById(unknownId) }
        }
        
        @Test
        @DisplayName("Should get all property types")
        fun shouldGetAllPropertyTypes() {
            // Arrange
            val allTypes = listOf(textType, numberType, customType)
            every { repository.findAll() } returns allTypes
            
            // Act
            val result = service.getAllPropertyTypes()
            
            // Assert
            result shouldHaveSize 3
            result shouldContain textType
            result shouldContain numberType
            result shouldContain customType
            verify { repository.findAll() }
        }
        
        @Test
        @DisplayName("Should get active property types only")
        fun shouldGetActivePropertyTypesOnly() {
            // Arrange
            val inactiveType = textType.copy(isActive = false)
            val activeTypes = listOf(numberType, customType)
            every { repository.findAllActive() } returns activeTypes
            
            // Act
            val result = service.getActivePropertyTypes()
            
            // Assert
            result shouldHaveSize 2
            result shouldContain numberType
            result shouldContain customType
            verify { repository.findAllActive() }
        }
        
        @Test
        @DisplayName("Should get property types by category")
        fun shouldGetPropertyTypesByCategory() {
            // Arrange
            val basicTypes = listOf(textType, numberType)
            every { repository.findByCategory(PropertyTypeCategory.BASIC) } returns basicTypes
            
            // Act
            val result = service.getPropertyTypesByCategory(PropertyTypeCategory.BASIC)
            
            // Assert
            result shouldHaveSize 2
            result shouldContain textType
            result shouldContain numberType
            verify { repository.findByCategory(PropertyTypeCategory.BASIC) }
        }
        
        @Test
        @DisplayName("Should update custom property type successfully")
        fun shouldUpdateCustomPropertyTypeSuccessfully() {
            // Arrange
            val newDescription = "Updated rating field"
            val newIcon = "star-filled-icon"
            
            every { repository.findById(customType.id) } returns customType
            every { repository.save(any()) } answers { firstArg() }
            
            // Act
            val result = service.updatePropertyType(
                id = customType.id,
                description = newDescription,
                icon = newIcon
            )
            
            // Assert
            result.description shouldBe newDescription
            result.icon shouldBe newIcon
            verify { repository.findById(customType.id) }
            verify { repository.save(any()) }
        }
        
        @Test
        @DisplayName("Should prevent updating system property type")
        fun shouldPreventUpdatingSystemPropertyType() {
            // Arrange
            every { repository.findById(textType.id) } returns textType
            
            // Act & Assert
            val exception = assertThrows<IllegalStateException> {
                service.updatePropertyType(
                    id = textType.id,
                    description = "Cannot update"
                )
            }
            
            exception.message shouldBe "Cannot modify system property type: ${textType.id}"
            verify { repository.findById(textType.id) }
        }
        
        @Test
        @DisplayName("Should delete custom property type successfully")
        fun shouldDeleteCustomPropertyTypeSuccessfully() {
            // Arrange
            every { repository.existsById(customType.id) } returns true
            every { repository.deleteById(customType.id) } just Runs
            
            // Act
            service.deletePropertyType(customType.id)
            
            // Assert
            verify { repository.existsById(customType.id) }
            verify { repository.deleteById(customType.id) }
        }
        
        @Test
        @DisplayName("Should prevent deleting system property type")
        fun shouldPreventDeletingSystemPropertyType() {
            // Arrange
            every { repository.existsById(textType.id) } returns true
            
            // Act & Assert
            val exception = assertThrows<IllegalStateException> {
                service.deletePropertyType(textType.id)
            }
            
            exception.message shouldBe "Cannot delete system property type: ${textType.id}"
            verify { repository.existsById(textType.id) }
        }
    }
    
    @Nested
    @DisplayName("Activation Management")
    inner class ActivationManagementTest {
        
        @Test
        @DisplayName("Should activate property type successfully")
        fun shouldActivatePropertyTypeSuccessfully() {
            // Arrange
            val inactiveType = customType.copy(isActive = false)
            every { repository.findById(customType.id) } returns inactiveType
            every { repository.save(any()) } returnsArgument 0
            
            // Act
            val result = service.activatePropertyType(customType.id)
            
            // Assert
            result.isActive shouldBe true
            verify { repository.findById(customType.id) }
            verify { repository.save(any()) }
        }
        
        @Test
        @DisplayName("Should deactivate custom property type successfully")
        fun shouldDeactivateCustomPropertyTypeSuccessfully() {
            // Arrange
            every { repository.findById(customType.id) } returns customType
            every { repository.save(any()) } returnsArgument 0
            
            // Act
            val result = service.deactivatePropertyType(customType.id)
            
            // Assert
            result.isActive shouldBe false
            verify { repository.findById(customType.id) }
            verify { repository.save(any()) }
        }
        
        @Test
        @DisplayName("Should prevent deactivating system property type")
        fun shouldPreventDeactivatingSystemPropertyType() {
            // Arrange
            every { repository.findById(textType.id) } returns textType
            
            // Act & Assert
            val exception = assertThrows<IllegalStateException> {
                service.deactivatePropertyType(textType.id)
            }
            
            exception.message shouldBe "Cannot deactivate system property type: ${textType.id}"
            verify { repository.findById(textType.id) }
        }
        
        @Test
        @DisplayName("Should check if property type is valid")
        fun shouldCheckIfPropertyTypeIsValid() {
            // Arrange
            every { repository.findById(textType.id) } returns textType
            every { repository.findById("inactive_type") } returns textType.copy(isActive = false)
            every { repository.findById("unknown_type") } returns null
            
            // Act & Assert
            service.isValidPropertyType(textType.id) shouldBe true
            service.isValidPropertyType("inactive_type") shouldBe false
            service.isValidPropertyType("unknown_type") shouldBe false
            
            verify(exactly = 3) { repository.findById(any()) }
        }
    }
    
    
    @Nested
    @DisplayName("DTO Conversions")
    inner class DtoConversionsTest {
        
        // Reuse mockDTO objects from the class level
        
        @Test
        @DisplayName("Should get all types as DTOs")
        fun shouldGetAllTypesAsDtos() {
            // Arrange
            val types = listOf(textType, numberType)
            val dtos = listOf(mockDto, mockDto)
            
            every { repository.findAll() } returns types
            every { dtoMapper.toDtoList(any()) } returns dtos
            
            // Act
            val result = service.getAllTypesAsDto()
            
            // Assert
            result shouldBe dtos
            verify { repository.findAll() }
            verify { dtoMapper.toDtoList(any()) }
        }
        
        @Test
        @DisplayName("Should get active types as DTOs")
        fun shouldGetActiveTypesAsDtos() {
            // Arrange
            val activeTypes = listOf(textType, customType)
            val dtos = listOf(mockDto, mockDto)
            
            every { repository.findAllActive() } returns activeTypes
            every { dtoMapper.toDtoList(activeTypes) } returns dtos
            
            // Act
            val result = service.getActiveTypesAsDto()
            
            // Assert
            result shouldBe dtos
            verify { repository.findAllActive() }
            verify { dtoMapper.toDtoList(any()) }
        }
        
        @Test
        @DisplayName("Should get types by category as DTOs - valid category")
        fun shouldGetTypesByCategoryAsDtosValidCategory() {
            // Arrange
            val basicTypes = listOf(textType, numberType)
            val dtos = listOf(mockDto, mockDto)
            
            every { repository.findByCategory(PropertyTypeCategory.BASIC) } returns basicTypes
            every { dtoMapper.toDtoList(any()) } returns dtos
            
            // Act
            val result = service.getTypesByCategoryAsDto("BASIC")
            
            // Assert
            result shouldBe dtos
            verify { repository.findByCategory(PropertyTypeCategory.BASIC) }
            verify { dtoMapper.toDtoList(any()) }
        }
        
        @Test
        @DisplayName("Should return empty list for invalid category")
        fun shouldReturnEmptyListForInvalidCategory() {
            // Act
            val result = service.getTypesByCategoryAsDto("INVALID_CATEGORY")
            
            // Assert
            result.shouldBeEmpty()
            verify(exactly = 0) { repository.findByCategory(any()) }
        }
        
        @Test
        @DisplayName("Should get catalog response with all types")
        fun shouldGetCatalogResponseWithAllTypes() {
            // Arrange
            val allTypes = listOf(textType, numberType, customType)
            
            every { repository.findAll() } returns allTypes
            every { dtoMapper.toCatalogResponse(any()) } returns mockResponse
            
            // Act
            val result = service.getCatalogResponse(activeOnly = false)
            
            // Assert
            result shouldBe mockResponse
            verify { repository.findAll() }
            verify { dtoMapper.toCatalogResponse(any()) }
        }
        
        @Test
        @DisplayName("Should get catalog response with active types only")
        fun shouldGetCatalogResponseWithActiveTypesOnly() {
            // Arrange
            val activeTypes = listOf(textType, customType)
            
            every { repository.findAllActive() } returns activeTypes
            every { dtoMapper.toCatalogResponse(activeTypes) } returns mockResponse
            
            // Act
            val result = service.getCatalogResponse(activeOnly = true)
            
            // Assert
            result shouldBe mockResponse
            verify { repository.findAllActive() }
            verify { dtoMapper.toCatalogResponse(any()) }
        }
        
        @Test
        @DisplayName("Should get type by ID as DTO when exists")
        fun shouldGetTypeByIdAsDtoWhenExists() {
            // Arrange
            every { repository.findById(textType.id) } returns textType
            every { dtoMapper.toDto(any()) } returns mockDto
            
            // Act
            val result = service.getTypeByIdAsDto(textType.id)
            
            // Assert
            result shouldBe mockDto
            verify { repository.findById(textType.id) }
            verify { dtoMapper.toDto(any()) }
        }
        
        @Test
        @DisplayName("Should return null when type not found for DTO conversion")
        fun shouldReturnNullWhenTypeNotFoundForDto() {
            // Arrange
            val unknownId = "unknown"
            every { repository.findById(unknownId) } returns null
            
            // Act
            val result = service.getTypeByIdAsDto(unknownId)
            
            // Assert
            result shouldBe null
            verify { repository.findById(unknownId) }
        }
    }
    
    @Nested
    @DisplayName("Edge Cases and Special Operations")
    inner class EdgeCasesTest {
        
        @Test
        @DisplayName("Should get summary types - active only")
        fun shouldGetSummaryTypesActiveOnly() {
            // Arrange
            val activeTypes = listOf(textType, customType)
            val summaryDtos = listOf(mockDto, mockDto)
            
            every { repository.findAllActive() } returns activeTypes
            every { dtoMapper.toSummaryDtoList(activeTypes) } returns summaryDtos
            
            // Act
            val result = service.getSummaryTypes(activeOnly = true)
            
            // Assert
            result shouldBe summaryDtos
            verify { repository.findAllActive() }
            verify { dtoMapper.toSummaryDtoList(activeTypes) }
        }
        
        @Test
        @DisplayName("Should get summary types - all types")
        fun shouldGetSummaryTypesAll() {
            // Arrange
            val allTypes = listOf(textType, numberType, customType)
            val summaryDtos = listOf(mockDto, mockDto, mockDto)
            
            every { repository.findAll() } returns allTypes
            every { dtoMapper.toSummaryDtoList(allTypes) } returns summaryDtos
            
            // Act
            val result = service.getSummaryTypes(activeOnly = false)
            
            // Assert
            result shouldBe summaryDtos
            verify { repository.findAll() }
            verify { dtoMapper.toSummaryDtoList(allTypes) }
        }
        
        @Test
        @DisplayName("Should get built-in types as DTOs")
        fun shouldGetBuiltInTypesAsDtos() {
            // Arrange
            val allTypes = listOf(textType, numberType, customType)
            val builtInTypes = listOf(textType, numberType) // Non-custom types
            val dtos = listOf(mockDto, mockDto)
            
            every { repository.findAll() } returns allTypes
            every { dtoMapper.toDtoList(builtInTypes) } returns dtos
            
            // Act
            val result = service.getBuiltInTypesAsDto()
            
            // Assert
            result shouldBe dtos
            verify { repository.findAll() }
            verify { dtoMapper.toDtoList(builtInTypes) }
        }
        
        @Test
        @DisplayName("Should get custom types as DTOs")
        fun shouldGetCustomTypesAsDtos() {
            // Arrange
            val allTypes = listOf(textType, numberType, customType)
            val customTypes = listOf(customType) // Custom types only
            val dtos = listOf(mockDto)
            
            every { repository.findAll() } returns allTypes
            every { dtoMapper.toDtoList(customTypes) } returns dtos
            
            // Act
            val result = service.getCustomTypesAsDto()
            
            // Assert
            result shouldBe dtos
            verify { repository.findAll() }
            verify { dtoMapper.toDtoList(customTypes) }
        }
        
    }
}