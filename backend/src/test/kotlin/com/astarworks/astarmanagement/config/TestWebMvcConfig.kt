package com.astarworks.astarmanagement.config

import kotlinx.serialization.json.Json
import org.springframework.boot.test.context.TestConfiguration
import org.springframework.context.annotation.Bean
import org.springframework.http.converter.HttpMessageConverter
import org.springframework.http.converter.HttpMessageConverters
import org.springframework.http.converter.json.KotlinSerializationJsonHttpMessageConverter
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer

/**
 * Test configuration for MockMvc with Kotlin Serialization support.
 * 
 * This configuration ensures that MockMvc uses the same KotlinSerializationJsonHttpMessageConverter
 * as the production code, allowing tests to properly serialize/deserialize DTOs with @Serializable.
 * 
 * This works by implementing WebMvcConfigurer which will be picked up by
 * Spring's test context when MockMvc is auto-configured.
 */
@TestConfiguration
class TestWebMvcConfig(private val json: Json) : WebMvcConfigurer {

    private val converter = KotlinSerializationJsonHttpMessageConverter(json)

    @Bean
    fun testKotlinSerializationConverter(): KotlinSerializationJsonHttpMessageConverter =
        converter

    override fun configureMessageConverters(builder: HttpMessageConverters.ServerBuilder) {
        builder.jsonMessageConverter(converter)
    }
}