package com.astarworks.astarmanagement.unit.core.table.domain.model

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.table.domain.model.SelectOption
import com.astarworks.astarmanagement.fixture.builder.DomainModelTestBuilder
import org.junit.jupiter.api.Assertions.*
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import org.junit.jupiter.params.ParameterizedTest
import org.junit.jupiter.params.provider.MethodSource
import org.junit.jupiter.params.provider.ValueSource
import java.util.stream.Stream

@UnitTest
@DisplayName("SelectOption Domain Model Tests")
class SelectOptionTest {
    
    companion object {
        @JvmStatic
        fun invalidValueCases(): Stream<String> {
            return Stream.of("", "   ", "\t", "\n")
        }
        
        @JvmStatic
        fun invalidLabelCases(): Stream<String> {
            return Stream.of("", "   ", "\t", "\n")
        }
        
        @JvmStatic
        fun invalidColorCases(): Stream<String> {
            return DomainModelTestBuilder.invalidColors().stream()
        }
        
        @JvmStatic
        fun validColorCases(): Stream<String> {
            return DomainModelTestBuilder.validColors().stream()
        }
    }
    
    @Nested
    @DisplayName("Construction and Validation Tests")
    inner class ConstructionTests {
        
        @Test
        @DisplayName("Should create SelectOption with valid parameters")
        fun `should create SelectOption with valid parameters`() {
            // Given
            val value = "option1"
            val label = "Option 1"
            val color = "#FF5733"
            
            // When
            val option = DomainModelTestBuilder.selectOption(
                value = value,
                label = label,
                color = color
            )
            
            // Then
            assertEquals(value, option.value)
            assertEquals(label, option.label)
            assertEquals(color, option.color)
        }
        
        @Test
        @DisplayName("Should create SelectOption without color")
        fun `should create SelectOption without color`() {
            // Given
            val value = "option1"
            val label = "Option 1"
            
            // When
            val option = DomainModelTestBuilder.selectOption(
                value = value,
                label = label,
                color = null
            )
            
            // Then
            assertEquals(value, option.value)
            assertEquals(label, option.label)
            assertNull(option.color)
        }
        
        @ParameterizedTest(name = "Should reject blank value: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.SelectOptionTest#invalidValueCases")
        fun `should reject blank value`(invalidValue: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.selectOption(value = invalidValue, label = "Valid Label")
            }
            assertEquals("Option value must not be blank", exception.message)
        }
        
        @ParameterizedTest(name = "Should reject blank label: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.SelectOptionTest#invalidLabelCases")
        fun `should reject blank label`(invalidLabel: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.selectOption(value = "valid_value", label = invalidLabel)
            }
            assertEquals("Option label must not be blank", exception.message)
        }
        
        @ParameterizedTest(name = "Should reject invalid color: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.SelectOptionTest#invalidColorCases")
        fun `should reject invalid color`(invalidColor: String) {
            // When & Then
            val exception = assertThrows(IllegalArgumentException::class.java) {
                DomainModelTestBuilder.selectOption(
                    value = "valid_value", 
                    label = "Valid Label", 
                    color = invalidColor
                )
            }
            assertEquals("Color must be a valid hex color code (e.g., #FF5733)", exception.message)
        }
        
        @ParameterizedTest(name = "Should accept valid color: '{0}'")
        @MethodSource("com.astarworks.astarmanagement.unit.core.table.domain.model.SelectOptionTest#validColorCases")
        fun `should accept valid colors`(validColor: String) {
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.selectOption(
                    value = "valid_value",
                    label = "Valid Label",
                    color = validColor
                )
            }
        }
        
        @Test
        @DisplayName("Should handle special characters in value")
        fun `should handle special characters in value`() {
            // Given
            val specialValues = listOf(
                "option_with_underscore",
                "option-with-hyphen",
                "option.with.dots",
                "option@with@symbols",
                "option with spaces",
                "UPPERCASE_OPTION",
                "123numeric456",
                "オプション日本語",
                "option/with/slashes"
            )
            
            // When & Then
            specialValues.forEach { value ->
                assertDoesNotThrow {
                    DomainModelTestBuilder.selectOption(
                        value = value,
                        label = "Valid Label"
                    )
                }
            }
        }
        
        @Test
        @DisplayName("Should handle Unicode characters in label")
        fun `should handle Unicode characters in label`() {
            // Given
            val unicodeLabel = "オプション 🎯 José María"
            
            // When
            val option = DomainModelTestBuilder.selectOption(
                value = "unicode_test",
                label = unicodeLabel
            )
            
            // Then
            assertEquals(unicodeLabel, option.label)
        }
        
        @Test
        @DisplayName("Should handle long values and labels")
        fun `should handle long values and labels`() {
            // Given
            val longValue = "very_long_option_value_" + "a".repeat(1000)
            val longLabel = "Very Long Label " + "b".repeat(1000)
            
            // When & Then
            val option = DomainModelTestBuilder.selectOption(
                value = longValue,
                label = longLabel
            )
            
            assertEquals(longValue, option.value)
            assertEquals(longLabel, option.label)
        }
    }
    
    @Nested
    @DisplayName("Color Validation Tests")
    inner class ColorValidationTests {
        
        @Test
        @DisplayName("Should accept standard hex colors")
        fun `should accept standard hex colors`() {
            // Given
            val standardColors = listOf(
                "#FF0000", // red
                "#00FF00", // green
                "#0000FF", // blue
                "#FFFFFF", // white
                "#000000", // black
                "#808080"  // gray
            )
            
            // When & Then
            standardColors.forEach { color ->
                assertDoesNotThrow {
                    DomainModelTestBuilder.selectOption(
                        value = "test",
                        label = "Test",
                        color = color
                    )
                }
            }
        }
        
        @Test
        @DisplayName("Should accept both uppercase and lowercase hex")
        fun `should accept both uppercase and lowercase hex`() {
            // Given
            val upperCase = "#FF5733"
            val lowerCase = "#ff5733"
            val mixedCase = "#Ff5733"
            
            // When & Then
            assertDoesNotThrow {
                DomainModelTestBuilder.selectOption(color = upperCase)
            }
            assertDoesNotThrow {
                DomainModelTestBuilder.selectOption(color = lowerCase)
            }
            assertDoesNotThrow {
                DomainModelTestBuilder.selectOption(color = mixedCase)
            }
        }
        
        @Test
        @DisplayName("Should reject colors without hash prefix")
        fun `should reject colors without hash prefix`() {
            // Given
            val colorsWithoutHash = listOf("FF5733", "ff5733", "123456")
            
            // When & Then
            colorsWithoutHash.forEach { color ->
                assertThrows(IllegalArgumentException::class.java) {
                    DomainModelTestBuilder.selectOption(color = color)
                }
            }
        }
        
        @Test
        @DisplayName("Should reject colors with wrong length")
        fun `should reject colors with wrong length`() {
            // Given
            val wrongLengthColors = listOf(
                "#FF",      // too short
                "#FFFF",    // still too short
                "#FFFFF",   // almost right
                "#FFFFFFF", // too long
                "#FFFFFFFF" // way too long
            )
            
            // When & Then
            wrongLengthColors.forEach { color ->
                assertThrows(IllegalArgumentException::class.java) {
                    DomainModelTestBuilder.selectOption(color = color)
                }
            }
        }
        
        @Test
        @DisplayName("Should reject colors with invalid hex characters")
        fun `should reject colors with invalid hex characters`() {
            // Given
            val invalidHexColors = listOf(
                "#GG5733", // invalid G
                "#FF5Z33", // invalid Z
                "#FF573X", // invalid X
                "#@#5733", // special characters
                "#FF 733"  // space
            )
            
            // When & Then
            invalidHexColors.forEach { color ->
                assertThrows(IllegalArgumentException::class.java) {
                    DomainModelTestBuilder.selectOption(color = color)
                }
            }
        }
    }
    
    @Nested
    @DisplayName("Data Class Behavior Tests")
    inner class DataClassBehaviorTests {
        
        @Test
        @DisplayName("Should implement equals and hashCode correctly")
        fun `should implement equals and hashCode correctly`() {
            // Given
            val value = "same_value"
            val label = "Same Label"
            val color = "#FF5733"
            
            val option1 = DomainModelTestBuilder.selectOption(
                value = value,
                label = label,
                color = color
            )
            val option2 = DomainModelTestBuilder.selectOption(
                value = value,
                label = label,
                color = color
            )
            
            // Then
            assertEquals(option1, option2)
            assertEquals(option1.hashCode(), option2.hashCode())
        }
        
        @Test
        @DisplayName("Should not be equal with different properties")
        fun `should not be equal with different properties`() {
            // Given
            val baseOption = DomainModelTestBuilder.selectOption()
            val differentValue = baseOption.copy(value = "different_value")
            val differentLabel = baseOption.copy(label = "Different Label")
            val differentColor = baseOption.copy(color = "#33FF57")
            
            // Then
            assertNotEquals(baseOption, differentValue)
            assertNotEquals(baseOption, differentLabel)
            assertNotEquals(baseOption, differentColor)
        }
        
        @Test
        @DisplayName("Should implement toString with all properties")
        fun `should implement toString with all properties`() {
            // Given
            val option = DomainModelTestBuilder.selectOption(
                value = "test_value",
                label = "Test Label",
                color = "#FF5733"
            )
            
            // When
            val toString = option.toString()
            
            // Then
            assertTrue(toString.contains("test_value"))
            assertTrue(toString.contains("Test Label"))
            assertTrue(toString.contains("#FF5733"))
        }
        
        @Test
        @DisplayName("Should support copy with parameter changes")
        fun `should support copy with parameter changes`() {
            // Given
            val originalOption = DomainModelTestBuilder.selectOption(
                value = "original_value",
                label = "Original Label",
                color = "#FF5733"
            )
            
            // When
            val copiedOption = originalOption.copy(
                value = "copied_value",
                label = "Copied Label",
                color = "#33FF57"
            )
            
            // Then
            assertEquals("copied_value", copiedOption.value)
            assertEquals("Copied Label", copiedOption.label)
            assertEquals("#33FF57", copiedOption.color)
            // Original should remain unchanged
            assertEquals("original_value", originalOption.value)
        }
        
        @Test
        @DisplayName("Should handle null color in copy")
        fun `should handle null color in copy`() {
            // Given
            val optionWithColor = DomainModelTestBuilder.selectOption(color = "#FF5733")
            
            // When
            val optionWithoutColor = optionWithColor.copy(color = null)
            
            // Then
            assertNull(optionWithoutColor.color)
            assertEquals(optionWithColor.value, optionWithoutColor.value)
            assertEquals(optionWithColor.label, optionWithoutColor.label)
        }
    }
    
    @Nested
    @DisplayName("Edge Cases Tests")
    inner class EdgeCasesTests {
        
        @Test
        @DisplayName("Should handle minimum viable option")
        fun `should handle minimum viable option`() {
            // Given & When
            val option = DomainModelTestBuilder.selectOption(
                value = "a",
                label = "A"
            )
            
            // Then
            assertEquals("a", option.value)
            assertEquals("A", option.label)
            assertNull(option.color)
        }
        
        @Test
        @DisplayName("Should handle identical value and label")
        fun `should handle identical value and label`() {
            // Given & When
            val option = DomainModelTestBuilder.selectOption(
                value = "same",
                label = "same"
            )
            
            // Then
            assertEquals("same", option.value)
            assertEquals("same", option.label)
        }
        
        @Test
        @DisplayName("Should handle all valid hex color formats")
        fun `should handle all valid hex color formats`() {
            // Given
            val hexFormats = mapOf(
                "all_uppercase" to "#ABCDEF",
                "all_lowercase" to "#abcdef",
                "mixed_case" to "#AbCdEf",
                "with_numbers" to "#123456",
                "mixed_alpha_numeric" to "#A1B2C3"
            )
            
            // When & Then
            hexFormats.forEach { (description, color) ->
                val option = DomainModelTestBuilder.selectOption(color = color)
                assertEquals(color, option.color)
            }
        }
        
        @Test
        @DisplayName("Should handle extreme boundary values")
        fun `should handle extreme boundary values`() {
            // Given
            val extremeValues = mapOf(
                "numeric" to "123456789",
                "special_chars" to "!@#$%^&*()",
                "mixed" to "aA1!bB2@",
                "unicode" to "値選択肢🎯",
                "emoji_only" to "🔴🟡🟢",
                "url_like" to "https://example.com/option"
            )
            
            // When & Then
            extremeValues.forEach { (description, value) ->
                assertDoesNotThrow {
                    DomainModelTestBuilder.selectOption(
                        value = value,
                        label = "Label for $description"
                    )
                }
            }
        }
    }
}