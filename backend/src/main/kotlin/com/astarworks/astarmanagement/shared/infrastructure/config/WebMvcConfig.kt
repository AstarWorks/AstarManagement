package com.astarworks.astarmanagement.shared.infrastructure.config

import kotlinx.serialization.json.Json
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.converter.HttpMessageConverter
import org.springframework.http.converter.HttpMessageConverters
import org.springframework.http.converter.KotlinSerializationStringHttpMessageConverter
import org.springframework.http.converter.json.KotlinSerializationJsonHttpMessageConverter
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer


@Configuration
class WebMvcConfig(
    private val json: Json
) : WebMvcConfigurer {

    private val converter = KotlinSerializationJsonHttpMessageConverter(json)

    @Bean
    fun kotlinSerialization() = converter

    @Bean
    fun kotlinSerializationJsonHttpMessageConverter(): HttpMessageConverter<*> = converter

    @Bean
    fun ktxMessageConverterWithMediaType() : KotlinSerializationStringHttpMessageConverter<Json> = converter
    

    override fun configureMessageConverters(builder: HttpMessageConverters.ServerBuilder) {
        builder.jsonMessageConverter(converter)
        builder.stringMessageConverter(converter)
    }
}