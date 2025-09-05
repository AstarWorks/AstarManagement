package com.astarworks.astarmanagement.shared.infrastructure.config

import com.astarworks.astarmanagement.shared.domain.value.*
import com.fasterxml.jackson.core.JsonGenerator
import com.fasterxml.jackson.core.JsonParser
import com.fasterxml.jackson.databind.*
import com.fasterxml.jackson.databind.module.SimpleModule
import org.springframework.context.annotation.Bean
import org.springframework.context.annotation.Configuration
import org.springframework.core.convert.converter.Converter
import org.springframework.format.FormatterRegistry
import org.springframework.web.servlet.config.annotation.WebMvcConfigurer
import java.util.UUID

/**
 * Configuration for serializing and deserializing strongly-typed ID value objects.
 * 
 * Handles:
 * 1. Jackson JSON serialization/deserialization
 * 2. Spring MVC path variable and request parameter conversion
 * 3. URL parameter binding
 */
@Configuration
class ValueTypeSerializationConfig : WebMvcConfigurer {
    
    /**
     * Jackson module for serializing value types as their underlying UUID strings.
     */
    @Bean
    fun valueTypeModule(): SimpleModule {
        val module = SimpleModule("ValueTypeModule")
        
        // Generic serializer for all EntityId types
        module.addSerializer(EntityId::class.java, EntityIdSerializer())
        
        // Generic deserializer for all EntityId types
        module.addDeserializer(TableId::class.java, TableIdDeserializer())
        module.addDeserializer(RecordId::class.java, RecordIdDeserializer())
        module.addDeserializer(UserId::class.java, UserIdDeserializer())
        module.addDeserializer(UserProfileId::class.java, UserProfileIdDeserializer())
        module.addDeserializer(TenantId::class.java, TenantIdDeserializer())
        module.addDeserializer(WorkspaceId::class.java, WorkspaceIdDeserializer())
        module.addDeserializer(RoleId::class.java, RoleIdDeserializer())
        module.addDeserializer(UserRoleId::class.java, UserRoleIdDeserializer())
        module.addDeserializer(RolePermissionId::class.java, RolePermissionIdDeserializer())
        module.addDeserializer(ResourceGroupId::class.java, ResourceGroupIdDeserializer())
        module.addDeserializer(ResourceGroupMembershipId::class.java, ResourceGroupMembershipIdDeserializer())
        module.addDeserializer(TenantMembershipId::class.java, TenantMembershipIdDeserializer())
        module.addDeserializer(TenantUserId::class.java, TenantUserIdDeserializer())
        
        return module
    }
    
    /**
     * Register converters for Spring MVC path variables and request parameters.
     */
    override fun addFormatters(registry: FormatterRegistry) {
        registry.addConverter(StringToTableIdConverter())
        registry.addConverter(StringToRecordIdConverter())
        registry.addConverter(StringToUserIdConverter())
        registry.addConverter(StringToUserProfileIdConverter())
        registry.addConverter(StringToTenantIdConverter())
        registry.addConverter(StringToWorkspaceIdConverter())
        registry.addConverter(StringToRoleIdConverter())
        registry.addConverter(StringToUserRoleIdConverter())
        registry.addConverter(StringToRolePermissionIdConverter())
        registry.addConverter(StringToResourceGroupIdConverter())
        registry.addConverter(StringToResourceGroupMembershipIdConverter())
        registry.addConverter(StringToTenantMembershipIdConverter())
        registry.addConverter(StringToTenantUserIdConverter())
    }
}

/**
 * Generic Jackson serializer for EntityId value types.
 */
class EntityIdSerializer : JsonSerializer<EntityId<*>>() {
    override fun serialize(value: EntityId<*>, gen: JsonGenerator, serializers: SerializerProvider) {
        gen.writeString(value.value.toString())
    }
}

// Individual deserializers for each type alias
class TableIdDeserializer : JsonDeserializer<TableId>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): TableId {
        return TableId(UUID.fromString(p.text))
    }
}

class RecordIdDeserializer : JsonDeserializer<RecordId>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): RecordId {
        return RecordId(UUID.fromString(p.text))
    }
}

class UserIdDeserializer : JsonDeserializer<UserId>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): UserId {
        return UserId(UUID.fromString(p.text))
    }
}

class UserProfileIdDeserializer : JsonDeserializer<UserProfileId>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): UserProfileId {
        return UserProfileId(UUID.fromString(p.text))
    }
}

class TenantIdDeserializer : JsonDeserializer<TenantId>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): TenantId {
        return TenantId(UUID.fromString(p.text))
    }
}

class WorkspaceIdDeserializer : JsonDeserializer<WorkspaceId>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): WorkspaceId {
        return WorkspaceId(UUID.fromString(p.text))
    }
}

class RoleIdDeserializer : JsonDeserializer<RoleId>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): RoleId {
        return RoleId(UUID.fromString(p.text))
    }
}

class UserRoleIdDeserializer : JsonDeserializer<UserRoleId>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): UserRoleId {
        return UserRoleId(UUID.fromString(p.text))
    }
}

class RolePermissionIdDeserializer : JsonDeserializer<RolePermissionId>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): RolePermissionId {
        return RolePermissionId(UUID.fromString(p.text))
    }
}

class ResourceGroupIdDeserializer : JsonDeserializer<ResourceGroupId>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): ResourceGroupId {
        return ResourceGroupId(UUID.fromString(p.text))
    }
}

class ResourceGroupMembershipIdDeserializer : JsonDeserializer<ResourceGroupMembershipId>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): ResourceGroupMembershipId {
        return ResourceGroupMembershipId(UUID.fromString(p.text))
    }
}

class TenantMembershipIdDeserializer : JsonDeserializer<TenantMembershipId>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): TenantMembershipId {
        return TenantMembershipId(UUID.fromString(p.text))
    }
}

class TenantUserIdDeserializer : JsonDeserializer<TenantUserId>() {
    override fun deserialize(p: JsonParser, ctxt: DeserializationContext): TenantUserId {
        return TenantUserId(UUID.fromString(p.text))
    }
}

// Spring MVC Converters for path variables and request parameters
class StringToTableIdConverter : Converter<String, TableId> {
    override fun convert(source: String): TableId {
        return TableId(UUID.fromString(source))
    }
}

class StringToRecordIdConverter : Converter<String, RecordId> {
    override fun convert(source: String): RecordId {
        return RecordId(UUID.fromString(source))
    }
}

class StringToUserIdConverter : Converter<String, UserId> {
    override fun convert(source: String): UserId {
        return UserId(UUID.fromString(source))
    }
}

class StringToUserProfileIdConverter : Converter<String, UserProfileId> {
    override fun convert(source: String): UserProfileId {
        return UserProfileId(UUID.fromString(source))
    }
}

class StringToTenantIdConverter : Converter<String, TenantId> {
    override fun convert(source: String): TenantId {
        return TenantId(UUID.fromString(source))
    }
}

class StringToWorkspaceIdConverter : Converter<String, WorkspaceId> {
    override fun convert(source: String): WorkspaceId {
        return WorkspaceId(UUID.fromString(source))
    }
}

class StringToRoleIdConverter : Converter<String, RoleId> {
    override fun convert(source: String): RoleId {
        return RoleId(UUID.fromString(source))
    }
}

class StringToUserRoleIdConverter : Converter<String, UserRoleId> {
    override fun convert(source: String): UserRoleId {
        return UserRoleId(UUID.fromString(source))
    }
}

class StringToRolePermissionIdConverter : Converter<String, RolePermissionId> {
    override fun convert(source: String): RolePermissionId {
        return RolePermissionId(UUID.fromString(source))
    }
}

class StringToResourceGroupIdConverter : Converter<String, ResourceGroupId> {
    override fun convert(source: String): ResourceGroupId {
        return ResourceGroupId(UUID.fromString(source))
    }
}

class StringToResourceGroupMembershipIdConverter : Converter<String, ResourceGroupMembershipId> {
    override fun convert(source: String): ResourceGroupMembershipId {
        return ResourceGroupMembershipId(UUID.fromString(source))
    }
}

class StringToTenantMembershipIdConverter : Converter<String, TenantMembershipId> {
    override fun convert(source: String): TenantMembershipId {
        return TenantMembershipId(UUID.fromString(source))
    }
}

class StringToTenantUserIdConverter : Converter<String, TenantUserId> {
    override fun convert(source: String): TenantUserId {
        return TenantUserId(UUID.fromString(source))
    }
}