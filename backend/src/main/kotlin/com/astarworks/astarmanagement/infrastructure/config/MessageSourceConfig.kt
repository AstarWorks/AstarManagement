package com.astarworks.astarmanagement.infrastructure.config

import org.springframework.context.MessageSource
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.context.support.ResourceBundleMessageSource
import org.springframework.web.servlet.LocaleResolver
import org.springframework.web.servlet.i18n.AcceptHeaderLocaleResolver
import java.util.*

/**
 * Configuration for internationalization support
 */
@Configuration
class MessageSourceConfig {
    
    @Bean
    fun messageSource(): MessageSource {
        val messageSource = ResourceBundleMessageSource()
        messageSource.setBasename("messages/errors")
        messageSource.setDefaultEncoding("UTF-8")
        messageSource.setUseCodeAsDefaultMessage(true)
        return messageSource
    }
    
    @Bean
    fun localeResolver(): LocaleResolver {
        val localeResolver = AcceptHeaderLocaleResolver()
        localeResolver.supportedLocales = listOf(
            Locale.ENGLISH,
            Locale.JAPANESE
        )
        localeResolver.setDefaultLocale(Locale.ENGLISH)
        return localeResolver
    }
}