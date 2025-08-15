package com.astarworks.astarmanagement.modules.financial.expense

import org.springframework.context.annotation.ComponentScan
import org.springframework.context.annotation.Configuration

/**
 * Expense module configuration
 * 
 * This configuration class sets up the expense management module
 * following clean architecture principles.
 */
@Configuration
@ComponentScan(basePackages = ["com.astarworks.astarmanagement.modules.financial.expense"])
class ExpenseModuleConfig {
    // Module-specific beans will be added here as needed
}