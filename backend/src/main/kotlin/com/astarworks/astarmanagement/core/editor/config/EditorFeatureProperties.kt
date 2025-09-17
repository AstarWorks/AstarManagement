package com.astarworks.astarmanagement.core.editor.config

import org.springframework.boot.context.properties.ConfigurationProperties

@ConfigurationProperties(prefix = "app.features.editor")
data class EditorFeatureProperties(
    val enabled: Boolean = false,
)
