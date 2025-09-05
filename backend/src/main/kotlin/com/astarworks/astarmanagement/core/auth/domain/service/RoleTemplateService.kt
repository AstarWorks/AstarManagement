package com.astarworks.astarmanagement.core.auth.domain.service

import com.astarworks.astarmanagement.core.auth.domain.exception.RoleManagementException
import com.astarworks.astarmanagement.core.auth.domain.model.*
import com.astarworks.astarmanagement.shared.domain.value.*
import org.slf4j.LoggerFactory
import org.springframework.cache.annotation.Cacheable
import org.springframework.stereotype.Service
import org.springframework.transaction.annotation.Transactional
import java.time.Instant
import java.util.UUID

/**
 * Service for managing role templates and industry-specific configurations.
 * 
 * This service provides functionality for:
 * - Loading and applying predefined role templates
 * - Managing industry-specific role configurations
 * - Custom template creation and management
 * - Template validation and compatibility checking
 * 
 * Templates allow quick setup of role structures for different industries
 * following the Discord-style role system with predefined permissions.
 */
@Service
@Transactional
class RoleTemplateService(
    private val roleManagementService: RoleManagementService,
    private val rolePermissionService: RolePermissionService
) {
    private val logger = LoggerFactory.getLogger(RoleTemplateService::class.java)
    
    /**
     * Gets all available role templates from YAML files.
     * 
     * @return List of available template information
     */
    @Transactional(readOnly = true)
    @Cacheable(value = ["roleTemplates"])
    fun getAvailableTemplates(): List<RoleTemplate> {
        // TODO: Load from YAML templates via TemplateService
        return emptyList()
    }
    
    /**
     * Gets detailed information about a specific template.
     * 
     * @param templateName The template name
     * @return Template details
     * @throws RoleManagementException.TemplateNotFoundException if template not found
     */
    @Transactional(readOnly = true)
    fun getTemplateDetails(templateName: String): RoleTemplate {
        // TODO: Load from YAML templates via TemplateService
        throw RoleManagementException.TemplateNotFoundException(templateName)
    }
    
    /**
     * Applies a template to a tenant.
     * Creates roles and assigns permissions based on the template.
     * 
     * @param tenantId The tenant ID
     * @param templateName The template name to apply
     * @param skipExisting Whether to skip roles that already exist
     * @return Application result with created roles and permissions
     */
    fun applyTemplate(
        tenantId: TenantId,
        templateName: String,
        skipExisting: Boolean = true
    ): TemplateApplicationResult {
        logger.info("Applying template '$templateName' to tenant: $tenantId")
        
        val template = getTemplateDetails(templateName)
        val createdRoles = mutableListOf<DynamicRole>()
        val grantedPermissions = mutableMapOf<UUID, List<String>>()
        val skippedRoles = mutableMapOf<String, String>()
        val errors = mutableListOf<String>()
        
        template.roles.forEach { roleData ->
            try {
                // Check if role already exists
                if (roleManagementService.roleExists(tenantId, roleData.name)) {
                    if (skipExisting) {
                        skippedRoles[roleData.name] = "Role already exists"
                        logger.debug("Skipping existing role: ${roleData.name}")
                    } else {
                        errors.add("Role '${roleData.name}' already exists")
                    }
                } else {
                    // Create the role
                    val role = roleManagementService.createRole(
                        tenantId = tenantId,
                        name = roleData.name,
                        displayName = roleData.displayName,
                        color = roleData.color,
                        position = roleData.position
                    )
                    createdRoles.add(role)
                    
                    // Grant permissions
                    if (roleData.permissions.isNotEmpty()) {
                        val validationResult = rolePermissionService.validatePermissions(roleData.permissions)
                        
                        if (validationResult.invalid.isNotEmpty()) {
                            errors.add("Invalid permissions for role '${roleData.name}': ${validationResult.invalid.keys}")
                        } else {
                            rolePermissionService.grantPermissions(role.id, roleData.permissions)
                            grantedPermissions[role.id.value] = roleData.permissions
                        }
                    }
                }
            } catch (e: Exception) {
                logger.error("Failed to create role '${roleData.name}' from template", e)
                errors.add("Failed to create role '${roleData.name}': ${e.message}")
            }
        }
        
        val result = TemplateApplicationResult(
            templateId = templateName,
            createdRoles = createdRoles,
            grantedPermissions = grantedPermissions,
            skippedRoles = skippedRoles,
            errors = errors,
            appliedAt = Instant.now()
        )
        
        logger.info("Template application completed: ${result.totalRolesCreated} roles created, ${result.totalPermissionsGranted} permissions granted")
        
        return result
    }
    
    /**
     * Validates if a template can be applied to a tenant.
     * 
     * @param tenantId The tenant ID
     * @param templateName The template name
     * @return Validation result with compatibility information
     */
    @Transactional(readOnly = true)
    fun validateTemplateApplication(tenantId: TenantId, templateName: String): ValidationResult {
        val template = getTemplateDetails(templateName)
        val existingRoles = roleManagementService.findByTenantId(tenantId).map { it.name }
        
        val valid = mutableListOf<String>()
        val invalid = mutableMapOf<String, String>()
        val warnings = mutableMapOf<String, String>()
        
        template.roles.forEach { roleData ->
            if (roleData.name in existingRoles) {
                warnings[roleData.name] = "Role already exists and will be skipped"
            } else {
                valid.add(roleData.name)
            }
            
            // Validate permissions
            val permissionValidation = rolePermissionService.validatePermissions(roleData.permissions)
            permissionValidation.invalid.forEach { (permission, error) ->
                invalid["${roleData.name}:$permission"] = error
            }
        }
        
        return ValidationResult(
            valid = valid,
            invalid = invalid,
            warnings = warnings
        )
    }
    
    /**
     * Saves a custom template based on existing roles.
     * 
     * @param tenantId The tenant ID
     * @param templateName Name for the custom template
     * @param roleIds List of role IDs to include in the template
     * @param description Template description
     * @return The created template
     */
    fun saveCustomTemplate(
        tenantId: TenantId,
        templateName: String,
        roleIds: List<UUID>,
        description: String = "Custom template"
    ): RoleTemplate {
        logger.info("Creating custom template '$templateName' from ${roleIds.size} roles")
        
        val roleExports = roleIds.map { roleId ->
            roleManagementService.exportRole(RoleId(roleId))
        }
        
        val template = RoleTemplate(
            id = "custom_${UUID.randomUUID()}",
            name = templateName,
            description = description,
            category = "custom",
            roles = roleExports,
            metadata = mapOf(
                "createdBy" to tenantId.value.toString(),
                "createdAt" to Instant.now().toString()
            )
        )
        
        // TODO: Save template to persistent storage
        logger.info("Custom template created: ${template.id}")
        
        return template
    }
    
}