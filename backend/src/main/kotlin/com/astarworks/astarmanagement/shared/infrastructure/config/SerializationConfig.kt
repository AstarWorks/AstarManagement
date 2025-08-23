package com.astarworks.astarmanagement.shared.infrastructure.config

import kotlinx.serialization.json.Json
import kotlinx.serialization.modules.SerializersModule
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import java.util.UUID

@Configuration
class SerializationConfig {

    @Bean
    fun json(): Json = Json {
        // 基本設定
        prettyPrint = false
        isLenient = true
        ignoreUnknownKeys = true
        coerceInputValues = true

        // カスタムシリアライザーの登録
        serializersModule = SerializersModule {
            contextual(UUID::class, UUIDSerializer)
        }
    }
}
