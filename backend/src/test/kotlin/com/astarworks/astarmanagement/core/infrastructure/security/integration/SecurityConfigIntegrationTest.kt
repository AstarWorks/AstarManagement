package com.astarworks.astarmanagement.core.infrastructure.security.integration

import com.astarworks.astarmanagement.base.IntegrationTest
import com.astarworks.astarmanagement.core.infrastructure.security.JwtAuthenticationConverter
import org.assertj.core.api.Assertions.assertThat
import org.junit.jupiter.api.Test
import org.junit.jupiter.api.DisplayName
import org.springframework.beans.factory.annotation.Autowired
import org.springframework.boot.test.context.SpringBootTest
import org.springframework.context.ApplicationContext
import org.springframework.security.oauth2.jwt.JwtDecoder
import org.springframework.security.oauth2.jwt.NimbusJwtDecoder
import org.springframework.security.web.SecurityFilterChain
import org.springframework.test.context.ActiveProfiles

/**
 * Integration tests for SecurityConfig configuration.
 * Tests that Spring Security components are properly configured.
 */
@SpringBootTest
@ActiveProfiles("test")
class SecurityConfigIntegrationTest : IntegrationTest() {
    
    @Autowired
    private lateinit var applicationContext: ApplicationContext
    
    @Test
    @DisplayName("SecurityConfig - SecurityFilterChain is configured")
    fun `should have security filter chain configured`() {
        val context = applicationContext.getBean(SecurityFilterChain::class.java)
        assertThat(context).isNotNull
    }
    
    @Test
    @DisplayName("JWT decoder configuration")
    fun `should have JWT decoder configured`() {
        val jwtDecoder = applicationContext.getBean(JwtDecoder::class.java)
        assertThat(jwtDecoder).isInstanceOf(NimbusJwtDecoder::class.java)
    }
    
    @Test
    @DisplayName("Custom authentication converter")
    fun `should use custom JWT authentication converter`() {
        val converter = applicationContext.getBean(JwtAuthenticationConverter::class.java)
        assertThat(converter).isNotNull
    }
    
    @Test
    @DisplayName("Security beans are properly wired")
    fun `should have all required security beans configured`() {
        // Check that custom security components are registered
        assertThat(applicationContext.containsBean("jwtAuthenticationConverter")).isTrue
        assertThat(applicationContext.containsBean("customAuthenticationEntryPoint")).isTrue
        assertThat(applicationContext.containsBean("customAccessDeniedHandler")).isTrue
        
        // Check that standard Spring Security beans exist
        assertThat(applicationContext.containsBean("jwtDecoder")).isTrue
        assertThat(applicationContext.containsBean("securityFilterChain")).isTrue
    }
    
    @Test
    @DisplayName("Method security is enabled")
    fun `should have method security enabled`() {
        // This test verifies that @EnableMethodSecurity is working
        // by checking if the required beans for method security are present
        val beanNames = applicationContext.beanDefinitionNames.toList()
        
        // In Spring Security 6.x, look for method security related beans
        val hasMethodSecurityBeans = beanNames.any { beanName ->
            beanName.contains("methodSecurityAdvisor") ||
            beanName.contains("preFilterAuthorizationMethodInterceptor") ||
            beanName.contains("postFilterAuthorizationMethodInterceptor") ||
            beanName.contains("preAuthorizeAuthorizationManager") ||
            beanName.contains("methodSecurityMetadataSource") ||
            beanName.contains("methodSecurityInterceptor")
        }
        
        assertThat(hasMethodSecurityBeans)
            .`as`("Method security beans should be present. Found beans: ${beanNames.filter { it.contains("method") || it.contains("security") }}")
            .isTrue()
    }
}