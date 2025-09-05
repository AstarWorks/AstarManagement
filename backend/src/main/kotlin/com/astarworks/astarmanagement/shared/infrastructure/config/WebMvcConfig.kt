package com.astarworks.astarmanagement.shared.infrastructure.config

import com.fasterxml.jackson.databind.SerializationFeature
import com.fasterxml.jackson.databind.json.JsonMapper
import kotlinx.serialization.json.Json
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.http.converter.HttpMessageConverter
import org.springframework.http.converter.HttpMessageConverters
import org.springframework.http.converter.json.KotlinSerializationJsonHttpMessageConverter
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import java.text.SimpleDateFormat


@Configuration
class WebMvcConfig(
    private val json: Json
) : WebMvcConfigurer {

    private val converter = KotlinSerializationJsonHttpMessageConverter(json)
    
    @Bean
    fun kotlinSerialization() = converter

    @Bean
    fun kotlinSerializationJsonHttpMessageConverter(): HttpMessageConverter<*> {
        println("====== CREATING HTTP MESSAGE CONVERTER ======")
        println("Using Json Bean with SerializersModule: ${json.serializersModule}")
        val converter = converter
        println("Created converter: ${converter::class.java.simpleName}")
        println("====== HTTP MESSAGE CONVERTER CREATION COMPLETED ======")
        return converter
    }

    override fun configureMessageConverters(builder: HttpMessageConverters.ServerBuilder) {
        builder.jsonMessageConverter(converter)
    }
}