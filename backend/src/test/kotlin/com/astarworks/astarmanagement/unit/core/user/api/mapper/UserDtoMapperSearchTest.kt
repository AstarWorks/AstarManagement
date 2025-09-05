package com.astarworks.astarmanagement.unit.core.user.api.mapper

import com.astarworks.astarmanagement.base.UnitTest
import com.astarworks.astarmanagement.core.user.api.mapper.UserDtoMapper
import com.astarworks.astarmanagement.core.user.domain.model.User
import com.astarworks.astarmanagement.shared.domain.value.UserId
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.BeforeEach
import org.junit.jupiter.api.DisplayName
import org.junit.jupiter.api.Nested
import org.junit.jupiter.api.Test
import java.time.Instant
import java.util.*

/**
 * Unit tests for UserDtoMapper search response conversion functionality.
 * Tests transformations for user search results and pagination.
 */
@UnitTest
@DisplayName("UserDtoMapper Search Tests")
class UserDtoMapperSearchTest {
    
    private lateinit var mapper: UserDtoMapper
    
    @BeforeEach
    fun setup() {
        mapper = UserDtoMapper()
    }
    
    @Nested
    @DisplayName("User Search Response Conversion")
    inner class UserSearchResponseConversion {
        
        @Test
        @DisplayName("Should convert list of users to search response")
        fun `should convert list of users to search response`() {
            // Given
            val users = listOf(
                createTestUser(email = "user1@example.com"),
                createTestUser(email = "user2@example.com"),
                createTestUser(email = "user3@example.com")
            )
            
            // When
            val response = mapper.toSearchResponse(users)
            
            // Then
            assertThat(response).isNotNull
            assertThat(response.users).hasSize(3)
            assertThat(response.totalCount).isEqualTo(3L)
            assertThat(response.hasMore).isFalse
            
            // Verify user details are preserved
            assertThat(response.users[0].email).isEqualTo("user1@example.com")
            assertThat(response.users[1].email).isEqualTo("user2@example.com")
            assertThat(response.users[2].email).isEqualTo("user3@example.com")
        }
        
        @Test
        @DisplayName("Should handle empty user list")
        fun `should handle empty user list`() {
            // Given
            val emptyUserList = emptyList<User>()
            
            // When
            val response = mapper.toSearchResponse(emptyUserList)
            
            // Then
            assertThat(response.users).isEmpty()
            assertThat(response.totalCount).isEqualTo(0L)
            assertThat(response.hasMore).isFalse
        }
        
        @Test
        @DisplayName("Should use provided total count for pagination")
        fun `should use provided total count for pagination`() {
            // Given
            val users = listOf(
                createTestUser(),
                createTestUser()
            )
            val totalCount = 100L // Total in database
            
            // When
            val response = mapper.toSearchResponse(
                users = users,
                totalCount = totalCount,
                hasMore = true
            )
            
            // Then
            assertThat(response.users).hasSize(2)
            assertThat(response.totalCount).isEqualTo(100L)
            assertThat(response.hasMore).isTrue
        }
        
        @Test
        @DisplayName("Should handle has more flag correctly")
        fun `should handle has more flag correctly`() {
            // Given
            val users = listOf(createTestUser())
            
            // When
            val responseWithMore = mapper.toSearchResponse(
                users = users,
                hasMore = true
            )
            val responseWithoutMore = mapper.toSearchResponse(
                users = users,
                hasMore = false
            )
            
            // Then
            assertThat(responseWithMore.hasMore).isTrue
            assertThat(responseWithoutMore.hasMore).isFalse
        }
        
        @Test
        @DisplayName("Should default total count to list size when not provided")
        fun `should default total count to list size when not provided`() {
            // Given
            val users = (1..5).map { createTestUser() }
            
            // When
            val response = mapper.toSearchResponse(users)
            
            // Then
            assertThat(response.totalCount).isEqualTo(5L)
        }
        
        @Test
        @DisplayName("Should handle single user in search response")
        fun `should handle single user in search response`() {
            // Given
            val user = createTestUser(
                auth0Sub = "auth0|single",
                email = "single@example.com"
            )
            
            // When
            val response = mapper.toSearchResponse(listOf(user))
            
            // Then
            assertThat(response.users).hasSize(1)
            assertThat(response.users[0].auth0Sub).isEqualTo("auth0|single")
            assertThat(response.users[0].email).isEqualTo("single@example.com")
            assertThat(response.totalCount).isEqualTo(1L)
        }
        
        @Test
        @DisplayName("Should preserve user order in search response")
        fun `should preserve user order in search response`() {
            // Given
            val userA = createTestUser(email = "a@example.com")
            val userZ = createTestUser(email = "z@example.com")
            val userM = createTestUser(email = "m@example.com")
            val orderedUsers = listOf(userA, userZ, userM)
            
            // When
            val response = mapper.toSearchResponse(orderedUsers)
            
            // Then
            assertThat(response.users[0].email).isEqualTo("a@example.com")
            assertThat(response.users[1].email).isEqualTo("z@example.com")
            assertThat(response.users[2].email).isEqualTo("m@example.com")
        }
        
        @Test
        @DisplayName("Should handle large user lists efficiently")
        fun `should handle large user lists efficiently`() {
            // Given
            val largeUserList = (1..1000).map { index ->
                createTestUser(
                    email = "user$index@example.com",
                    auth0Sub = "auth0|user$index"
                )
            }
            
            // When
            val response = mapper.toSearchResponse(
                users = largeUserList,
                totalCount = 5000L, // Simulating more results in DB
                hasMore = true
            )
            
            // Then
            assertThat(response.users).hasSize(1000)
            assertThat(response.totalCount).isEqualTo(5000L)
            assertThat(response.hasMore).isTrue
            
            // Spot check some users
            assertThat(response.users[0].email).isEqualTo("user1@example.com")
            assertThat(response.users[499].email).isEqualTo("user500@example.com")
            assertThat(response.users[999].email).isEqualTo("user1000@example.com")
        }
    }
    
    @Nested
    @DisplayName("Empty Search Response Creation")
    inner class EmptySearchResponseCreation {
        
        @Test
        @DisplayName("Should create empty search response using helper method")
        fun `should create empty search response using helper method`() {
            // When
            val response = mapper.emptySearchResponse()
            
            // Then
            assertThat(response).isNotNull
            assertThat(response.users).isEmpty()
            assertThat(response.totalCount).isEqualTo(0L)
            assertThat(response.hasMore).isFalse
        }
        
        @Test
        @DisplayName("Should create consistent empty responses")
        fun `should create consistent empty responses`() {
            // When
            val response1 = mapper.emptySearchResponse()
            val response2 = mapper.emptySearchResponse()
            val response3 = mapper.toSearchResponse(emptyList())
            
            // Then
            assertThat(response1.users).isEqualTo(response2.users)
            assertThat(response1.totalCount).isEqualTo(response2.totalCount)
            assertThat(response1.hasMore).isEqualTo(response2.hasMore)
            
            // Direct creation should match helper method
            assertThat(response1.users).isEqualTo(response3.users)
            assertThat(response1.totalCount).isEqualTo(response3.totalCount)
            assertThat(response1.hasMore).isEqualTo(response3.hasMore)
        }
    }
    
    @Nested
    @DisplayName("Response List Conversion")
    inner class ResponseListConversion {
        
        @Test
        @DisplayName("Should convert list of users to response list")
        fun `should convert list of users to response list`() {
            // Given
            val users = listOf(
                createTestUser(auth0Sub = "auth0|1"),
                createTestUser(auth0Sub = "auth0|2"),
                createTestUser(auth0Sub = "auth0|3")
            )
            
            // When
            val responses = mapper.toResponseList(users)
            
            // Then
            assertThat(responses).hasSize(3)
            assertThat(responses[0].auth0Sub).isEqualTo("auth0|1")
            assertThat(responses[1].auth0Sub).isEqualTo("auth0|2")
            assertThat(responses[2].auth0Sub).isEqualTo("auth0|3")
        }
        
        @Test
        @DisplayName("Should handle empty list in toResponseList")
        fun `should handle empty list in to response list`() {
            // Given
            val emptyList = emptyList<User>()
            
            // When
            val responses = mapper.toResponseList(emptyList)
            
            // Then
            assertThat(responses).isEmpty()
        }
        
        @Test
        @DisplayName("Should preserve all user fields in response list")
        fun `should preserve all user fields in response list`() {
            // Given
            val timestamp = Instant.now()
            val userId = UUID.randomUUID()
            val user = User(
                id = UserId(userId),
                auth0Sub = "auth0|detailed",
                email = "detailed@example.com",
                createdAt = timestamp.minusSeconds(3600),
                updatedAt = timestamp
            )
            
            // When
            val responses = mapper.toResponseList(listOf(user))
            
            // Then
            assertThat(responses).hasSize(1)
            val response = responses[0]
            assertThat(response.id).isEqualTo(userId)
            assertThat(response.auth0Sub).isEqualTo("auth0|detailed")
            assertThat(response.email).isEqualTo("detailed@example.com")
            assertThat(response.createdAt).isEqualTo(user.createdAt)
            assertThat(response.updatedAt).isEqualTo(user.updatedAt)
        }
    }
    
    @Nested
    @DisplayName("Pagination Scenarios")
    inner class PaginationScenarios {
        
        @Test
        @DisplayName("Should handle first page of results")
        fun `should handle first page of results`() {
            // Given
            val pageSize = 10
            val firstPageUsers = (1..pageSize).map { index ->
                createTestUser(email = "user$index@example.com")
            }
            
            // When
            val response = mapper.toSearchResponse(
                users = firstPageUsers,
                totalCount = 50L,
                hasMore = true
            )
            
            // Then
            assertThat(response.users).hasSize(10)
            assertThat(response.totalCount).isEqualTo(50L)
            assertThat(response.hasMore).isTrue
        }
        
        @Test
        @DisplayName("Should handle last page of results")
        fun `should handle last page of results`() {
            // Given
            val lastPageUsers = listOf(
                createTestUser(email = "user48@example.com"),
                createTestUser(email = "user49@example.com"),
                createTestUser(email = "user50@example.com")
            )
            
            // When
            val response = mapper.toSearchResponse(
                users = lastPageUsers,
                totalCount = 50L,
                hasMore = false
            )
            
            // Then
            assertThat(response.users).hasSize(3)
            assertThat(response.totalCount).isEqualTo(50L)
            assertThat(response.hasMore).isFalse
        }
        
        @Test
        @DisplayName("Should handle partial page results")
        fun `should handle partial page results`() {
            // Given
            val partialPageUsers = (1..7).map { index ->
                createTestUser(email = "partial$index@example.com")
            }
            
            // When
            val response = mapper.toSearchResponse(
                users = partialPageUsers,
                totalCount = 7L, // Only 7 total items
                hasMore = false
            )
            
            // Then
            assertThat(response.users).hasSize(7)
            assertThat(response.totalCount).isEqualTo(7L)
            assertThat(response.hasMore).isFalse
        }
    }
    
    // Helper methods
    
    private fun createTestUser(
        id: UUID = UUID.randomUUID(),
        auth0Sub: String = "auth0|test${UUID.randomUUID().toString().take(8)}",
        email: String = "test${UUID.randomUUID().toString().take(8)}@example.com",
        createdAt: Instant = Instant.now().minusSeconds(3600),
        updatedAt: Instant = Instant.now()
    ): User {
        return User(
            id = UserId(id),
            auth0Sub = auth0Sub,
            email = email,
            createdAt = createdAt,
            updatedAt = updatedAt
        )
    }
}