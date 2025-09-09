package com.astarworks.astarmanagement.shared.infrastructure.config

import com.astarworks.astarmanagement.shared.domain.value.*
import com.astarworks.astarmanagement.core.table.infrastructure.persistence.converter.*
import org.springframework.core.convert.converter.Converter
import org.springframework.data.convert.ReadingConverter
import org.springframework.data.convert.WritingConverter
import org.springframework.data.jdbc.core.convert.JdbcCustomConversions
import org.springframework.data.jdbc.repository.config.AbstractJdbcConfiguration
import org.springframework.stereotype.Component
import java.time.Instant
import java.util.UUID

/**
 * Spring Data JDBC configuration with custom converters for EntityId value types.
 * This enables automatic conversion between EntityId<T> and UUID for database operations.
 */
@Component
class EntityIdJdbcConfiguration : AbstractJdbcConfiguration() {
    
    override fun jdbcCustomConversions(): JdbcCustomConversions {
        val converters = mutableListOf(
                // Reading converters (UUID -> EntityId<T>)
                UUIDToTenantIdConverter(),
                UUIDToUserIdConverter(),
                UUIDToWorkspaceIdConverter(),
                UUIDToRoleIdConverter(),
                UUIDToUserRoleIdConverter(),
                UUIDToRolePermissionIdConverter(),
                UUIDToResourceGroupIdConverter(),
                UUIDToResourceGroupMembershipIdConverter(),
                UUIDToTableIdConverter(),
                UUIDToRecordIdConverter(),
                UUIDToUserProfileIdConverter(),
                UUIDToTenantMembershipIdConverter(),
                UUIDToTeamIdConverter(),
                
                // Writing converters (EntityId<T> -> UUID)
                TenantIdToUUIDConverter(),
                UserIdToUUIDConverter(),
                WorkspaceIdToUUIDConverter(),
                RoleIdToUUIDConverter(),
                UserRoleIdToUUIDConverter(),
                RolePermissionIdToUUIDConverter(),
                ResourceGroupIdToUUIDConverter(),
                ResourceGroupMembershipIdToUUIDConverter(),
                TableIdToUUIDConverter(),
                RecordIdToUUIDConverter(),
                UserProfileIdToUUIDConverter(),
                TenantMembershipIdToUUIDConverter(),
                TeamIdToUUIDConverter(),
                
                // Instant converters for PostgreSQL timestamp handling
                TimestampToInstantConverter(),
                InstantToTimestampConverter()
        )
        
        // Add Table module converters
        converters.addAll(
            listOf(
                // String to/from JSONB converters (for Record.data)
                StringToJsonbConverter(),
                JsonbToStringConverter(),  // Added to handle PGobject -> String conversion
                
//                 JsonObjectReadingConverter(),
//                 JsonObjectWritingConverter(),
                
                // PropertyDefinition Map converters (disabled - using PGobject directly)
//                 PropertyDefinitionMapReadingConverter(),
//                 PropertyDefinitionMapWritingConverter(),
                
                // String List converters for PostgreSQL arrays
                StringListReadingConverter(),
                StringListWritingConverter()
            )
        )
        
        return JdbcCustomConversions(converters)
    }
}

// Reading Converters (UUID -> EntityId<T>)
@ReadingConverter
class UUIDToTenantIdConverter : Converter<UUID, TenantId> {
    override fun convert(source: UUID): TenantId = TenantId(source)
}

@ReadingConverter
class UUIDToUserIdConverter : Converter<UUID, UserId> {
    override fun convert(source: UUID): UserId = UserId(source)
}

@ReadingConverter
class UUIDToWorkspaceIdConverter : Converter<UUID, WorkspaceId> {
    override fun convert(source: UUID): WorkspaceId = WorkspaceId(source)
}

@ReadingConverter
class UUIDToRoleIdConverter : Converter<UUID, RoleId> {
    override fun convert(source: UUID): RoleId = RoleId(source)
}

@ReadingConverter
class UUIDToUserRoleIdConverter : Converter<UUID, UserRoleId> {
    override fun convert(source: UUID): UserRoleId = UserRoleId(source)
}

@ReadingConverter
class UUIDToRolePermissionIdConverter : Converter<UUID, RolePermissionId> {
    override fun convert(source: UUID): RolePermissionId = RolePermissionId(source)
}

@ReadingConverter
class UUIDToResourceGroupIdConverter : Converter<UUID, ResourceGroupId> {
    override fun convert(source: UUID): ResourceGroupId = ResourceGroupId(source)
}

@ReadingConverter
class UUIDToResourceGroupMembershipIdConverter : Converter<UUID, ResourceGroupMembershipId> {
    override fun convert(source: UUID): ResourceGroupMembershipId = ResourceGroupMembershipId(source)
}

@ReadingConverter
class UUIDToTableIdConverter : Converter<UUID, TableId> {
    override fun convert(source: UUID): TableId = TableId(source)
}

@ReadingConverter
class UUIDToRecordIdConverter : Converter<UUID, RecordId> {
    override fun convert(source: UUID): RecordId = RecordId(source)
}

@ReadingConverter
class UUIDToUserProfileIdConverter : Converter<UUID, UserProfileId> {
    override fun convert(source: UUID): UserProfileId = UserProfileId(source)
}

@ReadingConverter
class UUIDToTenantMembershipIdConverter : Converter<UUID, TenantMembershipId> {
    override fun convert(source: UUID): TenantMembershipId = TenantMembershipId(source)
}

@ReadingConverter
class UUIDToTeamIdConverter : Converter<UUID, TeamId> {
    override fun convert(source: UUID): TeamId = TeamId(source)
}

// Writing Converters (EntityId<T> -> UUID)
@WritingConverter
class TenantIdToUUIDConverter : Converter<TenantId, UUID> {
    override fun convert(source: TenantId): UUID = source.value
}

@WritingConverter
class UserIdToUUIDConverter : Converter<UserId, UUID> {
    override fun convert(source: UserId): UUID = source.value
}

@WritingConverter
class WorkspaceIdToUUIDConverter : Converter<WorkspaceId, UUID> {
    override fun convert(source: WorkspaceId): UUID = source.value
}

@WritingConverter
class RoleIdToUUIDConverter : Converter<RoleId, UUID> {
    override fun convert(source: RoleId): UUID = source.value
}

@WritingConverter
class UserRoleIdToUUIDConverter : Converter<UserRoleId, UUID> {
    override fun convert(source: UserRoleId): UUID = source.value
}

@WritingConverter
class RolePermissionIdToUUIDConverter : Converter<RolePermissionId, UUID> {
    override fun convert(source: RolePermissionId): UUID = source.value
}

@WritingConverter
class ResourceGroupIdToUUIDConverter : Converter<ResourceGroupId, UUID> {
    override fun convert(source: ResourceGroupId): UUID = source.value
}

@WritingConverter
class ResourceGroupMembershipIdToUUIDConverter : Converter<ResourceGroupMembershipId, UUID> {
    override fun convert(source: ResourceGroupMembershipId): UUID = source.value
}

@WritingConverter
class TableIdToUUIDConverter : Converter<TableId, UUID> {
    override fun convert(source: TableId): UUID = source.value
}

@WritingConverter
class RecordIdToUUIDConverter : Converter<RecordId, UUID> {
    override fun convert(source: RecordId): UUID = source.value
}

@WritingConverter
class UserProfileIdToUUIDConverter : Converter<UserProfileId, UUID> {
    override fun convert(source: UserProfileId): UUID = source.value
}

@WritingConverter
class TenantMembershipIdToUUIDConverter : Converter<TenantMembershipId, UUID> {
    override fun convert(source: TenantMembershipId): UUID = source.value
}

@WritingConverter
class TeamIdToUUIDConverter : Converter<TeamId, UUID> {
    override fun convert(source: TeamId): UUID = source.value
}

// Instant Converters for PostgreSQL timestamp handling
@ReadingConverter
class TimestampToInstantConverter : Converter<java.sql.Timestamp, Instant> {
    override fun convert(source: java.sql.Timestamp): Instant = source.toInstant()
}

@WritingConverter
class InstantToTimestampConverter : Converter<Instant, java.sql.Timestamp> {
    override fun convert(source: Instant): java.sql.Timestamp = java.sql.Timestamp.from(source)
}