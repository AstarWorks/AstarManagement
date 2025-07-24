import { BasePage } from './BasePage'
import type { Page } from '@playwright/test'

export class MatterPage extends BasePage {
  // Selectors
  private readonly titleInput = 'input[name="title"]'
  private readonly caseNumberInput = 'input[name="caseNumber"]'
  private readonly descriptionTextarea = 'textarea[name="description"]'
  private readonly prioritySelect = 'select[name="priority"], [data-testid="priority-select"]'
  private readonly statusSelect = 'select[name="status"], [data-testid="status-select"]'
  private readonly assigneeSelect = 'select[name="assignedLawyerId"], [data-testid="assignee-select"]'
  private readonly dueDateInput = 'input[name="dueDate"]'
  private readonly clientNameInput = 'input[name="clientName"]'
  private readonly opponentNameInput = 'input[name="opponentName"]'
  private readonly tagsInput = 'input[name="tags"]'
  private readonly saveButton = 'button:has-text("Save")'
  private readonly cancelButton = 'button:has-text("Cancel")'
  private readonly deleteButton = 'button:has-text("Delete")'
  private readonly backButton = 'a:has-text("Back"), button:has-text("Back")'
  private readonly validationError = '.error-message, [role="alert"]'

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to create matter page
   */
  async gotoCreate() {
    await super.goto('/matters/new')
    await this.waitForFormLoad()
  }

  /**
   * Navigate to edit matter page
   */
  async gotoEdit(matterId: string) {
    await super.goto(`/matters/${matterId}/edit`)
    await this.waitForFormLoad()
  }

  /**
   * Navigate to matter details page
   */
  async gotoDetails(matterId: string) {
    await super.goto(`/matters/${matterId}`)
    await this.waitForPageLoad()
  }

  /**
   * Wait for form to load
   */
  async waitForFormLoad() {
    await this.waitForElement(this.titleInput)
  }

  /**
   * Fill matter form
   */
  async fillMatterForm(data: {
    title: string
    caseNumber?: string
    description?: string
    priority?: 'urgent' | 'high' | 'normal' | 'low'
    status?: string
    assignedLawyerId?: string
    dueDate?: string
    clientName?: string
    opponentName?: string
    tags?: string[]
  }) {
    await this.fillInput(this.titleInput, data.title)
    
    if (data.caseNumber) {
      await this.fillInput(this.caseNumberInput, data.caseNumber)
    }
    
    if (data.description) {
      await this.fillInput(this.descriptionTextarea, data.description)
    }
    
    if (data.priority) {
      await this.selectOption(this.prioritySelect, data.priority)
    }
    
    if (data.status) {
      await this.selectOption(this.statusSelect, data.status)
    }
    
    if (data.assignedLawyerId) {
      await this.selectOption(this.assigneeSelect, data.assignedLawyerId)
    }
    
    if (data.dueDate) {
      await this.fillInput(this.dueDateInput, data.dueDate)
    }
    
    if (data.clientName) {
      await this.fillInput(this.clientNameInput, data.clientName)
    }
    
    if (data.opponentName) {
      await this.fillInput(this.opponentNameInput, data.opponentName)
    }
    
    if (data.tags && data.tags.length > 0) {
      await this.fillInput(this.tagsInput, data.tags.join(', '))
    }
  }

  /**
   * Select option from dropdown
   */
  private async selectOption(selector: string, value: string) {
    const element = this.page.locator(selector)
    
    // Check if it's a native select or custom component
    if (await element.evaluate(el => el.tagName === 'SELECT')) {
      await element.selectOption(value)
    } else {
      // Custom select component
      await element.click()
      await this.page.click(`[role="option"][data-value="${value}"]`)
    }
  }

  /**
   * Save matter
   */
  async saveMatter() {
    await this.clickElement(this.saveButton)
    
    // Wait for either success navigation or validation error
    await Promise.race([
      this.waitForNavigation(),
      this.waitForElement(this.validationError, 5000).catch(() => {})
    ])
  }

  /**
   * Cancel form
   */
  async cancel() {
    await this.clickElement(this.cancelButton)
  }

  /**
   * Delete matter
   */
  async deleteMatter() {
    await this.clickElement(this.deleteButton)
    
    // Confirm deletion in dialog
    await this.acceptDialog()
    
    // Wait for navigation after deletion
    await this.waitForNavigation('/kanban')
  }

  /**
   * Get validation errors
   */
  async getValidationErrors(): Promise<string[]> {
    const errors = await this.page.locator(this.validationError).all()
    const errorMessages: string[] = []
    
    for (const error of errors) {
      const text = await error.textContent()
      if (text) errorMessages.push(text)
    }
    
    return errorMessages
  }

  /**
   * Assert form has validation error
   */
  async assertHasValidationError(fieldName?: string) {
    await this.assertElementVisible(this.validationError)
    
    if (fieldName) {
      const fieldError = this.page.locator(`[data-field="${fieldName}"] ${this.validationError}`)
      await this.assertElementVisible(`[data-field="${fieldName}"] ${this.validationError}`)
    }
  }

  /**
   * Create new matter
   */
  async createMatter(data: Parameters<typeof MatterPage.prototype.fillMatterForm>[0]) {
    await this.gotoCreate()
    await this.fillMatterForm(data)
    await this.saveMatter()
  }

  /**
   * Update existing matter
   */
  async updateMatter(matterId: string, data: Parameters<typeof MatterPage.prototype.fillMatterForm>[0]) {
    await this.gotoEdit(matterId)
    await this.fillMatterForm(data)
    await this.saveMatter()
  }

  /**
   * Assert matter details
   */
  async assertMatterDetails(expected: {
    title?: string
    caseNumber?: string
    priority?: string
    status?: string
    clientName?: string
  }) {
    if (expected.title) {
      await this.assertElementContainsText('[data-testid="matter-title"]', expected.title)
    }
    
    if (expected.caseNumber) {
      await this.assertElementContainsText('[data-testid="case-number"]', expected.caseNumber)
    }
    
    if (expected.priority) {
      await this.assertElementContainsText('[data-testid="priority"]', expected.priority)
    }
    
    if (expected.status) {
      await this.assertElementContainsText('[data-testid="status"]', expected.status)
    }
    
    if (expected.clientName) {
      await this.assertElementContainsText('[data-testid="client-name"]', expected.clientName)
    }
  }

  /**
   * Go back to previous page
   */
  async goBack() {
    await this.clickElement(this.backButton)
  }

  /**
   * Navigate to matter page by ID (alias for gotoDetails)
   */
  override async goto(matterId: string) {
    await this.gotoDetails(matterId)
  }

  /**
   * Submit form (alias for saveMatter)
   */
  async submitForm() {
    await this.saveMatter()
  }
}