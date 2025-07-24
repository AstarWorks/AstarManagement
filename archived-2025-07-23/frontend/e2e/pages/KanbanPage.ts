import { BasePage } from './BasePage'
import type { Page, Locator } from '@playwright/test'

export class KanbanPage extends BasePage {
  // Selectors
  private readonly kanbanBoard = '[data-testid="kanban-board"]'
  private readonly kanbanColumn = '[data-testid^="kanban-column-"]'
  private readonly matterCard = '[data-testid^="matter-card-"]'
  private readonly addMatterButton = 'button:has-text("Add Matter")'
  private readonly searchInput = 'input[placeholder*="Search"]'
  private readonly filterButton = 'button:has-text("Filters")'
  private readonly columnDropZone = '[data-testid="drop-zone"]'
  private readonly loadingSpinner = '[data-testid="loading-spinner"]'
  private readonly emptyState = '[data-testid="empty-state"]'

  constructor(page: Page) {
    super(page)
  }

  /**
   * Navigate to kanban board
   */
  override async goto() {
    await super.goto('/kanban')
    await this.waitForBoardToLoad()
  }

  /**
   * Wait for board to load
   */
  async waitForBoardToLoad() {
    await this.waitForElement(this.kanbanBoard)
    // Wait for loading to complete
    await this.page.waitForSelector(this.loadingSpinner, { state: 'hidden' })
  }

  /**
   * Get all columns
   */
  async getColumns(): Promise<string[]> {
    const columns = await this.page.locator(this.kanbanColumn).all()
    const columnNames: string[] = []
    
    for (const column of columns) {
      const name = await column.getAttribute('data-column-name') || ''
      columnNames.push(name)
    }
    
    return columnNames
  }

  /**
   * Get matters in a specific column
   */
  async getMattersInColumn(columnName: string): Promise<string[]> {
    const column = this.page.locator(`[data-testid="kanban-column-${columnName}"]`)
    const cards = await column.locator(this.matterCard).all()
    const matterIds: string[] = []
    
    for (const card of cards) {
      const id = await card.getAttribute('data-matter-id') || ''
      matterIds.push(id)
    }
    
    return matterIds
  }

  /**
   * Drag matter to another column
   */
  async dragMatterToColumn(matterId: string, targetColumnName: string) {
    const card = this.page.locator(`[data-testid="matter-card-${matterId}"]`)
    const targetColumn = this.page.locator(`[data-testid="kanban-column-${targetColumnName}"]`)
    
    // Perform drag and drop
    await card.hover()
    await this.page.mouse.down()
    await targetColumn.hover()
    await this.page.mouse.up()
    
    // Wait for the drop animation
    await this.page.waitForTimeout(500)
  }

  /**
   * Click on a matter card
   */
  async clickMatterCard(matterId: string) {
    await this.clickElement(`[data-testid="matter-card-${matterId}"]`)
  }

  /**
   * Search for matters
   */
  async searchMatters(query: string) {
    await this.fillInput(this.searchInput, query)
    // Wait for search results
    await this.page.waitForTimeout(300) // Debounce delay
  }

  /**
   * Clear search
   */
  async clearSearch() {
    const input = this.page.locator(this.searchInput)
    await input.clear()
    await this.page.waitForTimeout(300) // Debounce delay
  }

  /**
   * Open filters
   */
  async openFilters() {
    await this.clickElement(this.filterButton)
  }

  /**
   * Click add matter button
   */
  async clickAddMatter() {
    await this.clickElement(this.addMatterButton)
  }

  /**
   * Get matter count in column
   */
  async getMatterCountInColumn(columnName: string): Promise<number> {
    const matters = await this.getMattersInColumn(columnName)
    return matters.length
  }

  /**
   * Assert matter is in column
   */
  async assertMatterInColumn(matterId: string, columnName: string) {
    const matters = await this.getMattersInColumn(columnName)
    if (!matters.includes(matterId)) {
      throw new Error(`Matter ${matterId} not found in column ${columnName}`)
    }
  }

  /**
   * Assert empty board
   */
  async assertEmptyBoard() {
    await this.assertElementVisible(this.emptyState)
  }

  /**
   * Get matter card details
   */
  async getMatterCardDetails(matterId: string) {
    const card = this.page.locator(`[data-testid="matter-card-${matterId}"]`)
    
    return {
      title: await card.locator('[data-testid="matter-title"]').textContent() || '',
      caseNumber: await card.locator('[data-testid="case-number"]').textContent() || '',
      priority: await card.getAttribute('data-priority') || '',
      assignee: await card.locator('[data-testid="assignee"]').textContent() || '',
      dueDate: await card.locator('[data-testid="due-date"]').textContent() || ''
    }
  }

  /**
   * Filter by priority
   */
  async filterByPriority(priority: 'urgent' | 'high' | 'normal' | 'low') {
    await this.openFilters()
    await this.clickElement(`input[value="${priority}"]`)
    // Close filters
    await this.page.keyboard.press('Escape')
  }

  /**
   * Get visible matter count
   */
  async getVisibleMatterCount(): Promise<number> {
    const cards = await this.page.locator(this.matterCard).all()
    return cards.length
  }

  /**
   * Check if board is in mobile view
   */
  async isMobileView(): Promise<boolean> {
    return this.isMobile()
  }

  /**
   * Swipe to next column (mobile)
   */
  async swipeToNextColumn() {
    if (!await this.isMobileView()) {
      throw new Error('Swipe is only available in mobile view')
    }
    
    const board = this.page.locator(this.kanbanBoard)
    const box = await board.boundingBox()
    if (!box) return
    
    // Simulate swipe gesture by dragging
    await this.page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2)
    await this.page.mouse.down()
    await this.page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2)
    await this.page.mouse.up()
  }
}