package com.astarworks.astarmanagement.core.infrastructure.security.mock

import io.kotest.core.spec.style.DescribeSpec
import io.kotest.matchers.maps.shouldContainKey
import io.kotest.matchers.shouldBe
import io.kotest.matchers.shouldNotBe
import io.mockk.every
import io.mockk.mockk
import org.springframework.http.HttpStatus

class MockAuthControllerTest : DescribeSpec({
    
    describe("MockAuthController") {
        
        val mockAuthService = mockk<MockAuthService>()
        val controller = MockAuthController(mockAuthService)
        
        context("when generating token") {
            
            it("should return token successfully") {
                val expectedToken = "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9.test.signature"
                every { mockAuthService.generateToken() } returns expectedToken
                
                val response = controller.generateToken()
                
                response.statusCode shouldBe HttpStatus.OK
                response.body shouldNotBe null
                response.body!! shouldContainKey "access_token"
                response.body!!["access_token"] shouldBe expectedToken
                response.body!!["token_type"] shouldBe "Bearer"
                response.body!!["expires_in"] shouldBe 3600
            }
            
            it("should handle token generation failure") {
                every { mockAuthService.generateToken() } throws RuntimeException("Key generation failed")
                
                val response = controller.generateToken()
                
                response.statusCode shouldBe HttpStatus.INTERNAL_SERVER_ERROR
                response.body shouldNotBe null
                response.body!! shouldContainKey "error"
                response.body!!["error"] shouldBe "token_generation_failed"
                response.body!! shouldContainKey "message"
            }
        }
        
        context("when getting JWKS") {
            
            it("should return JWKS successfully") {
                val expectedJwks = mapOf(
                    "keys" to listOf(
                        mapOf(
                            "kty" to "RSA",
                            "use" to "sig",
                            "kid" to "mock-key-1"
                        )
                    )
                )
                every { mockAuthService.getJwks() } returns expectedJwks
                
                val jwks = controller.getJwks()
                
                jwks shouldNotBe null
                jwks shouldContainKey "keys"
                jwks shouldBe expectedJwks
            }
        }
    }
})