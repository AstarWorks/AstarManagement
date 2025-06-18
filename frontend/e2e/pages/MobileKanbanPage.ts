import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MobileKanbanPage extends BasePage {
  readonly tabBar: Locator;
  readonly swipeArea: Locator;
  readonly columnContainer: Locator;

  constructor(page: Page) {
    super(page);
    this.tabBar = page.getByTestId('mobile-kanban-tabs');
    this.swipeArea = page.getByTestId('mobile-swipe-area');
    this.columnContainer = page.getByTestId('mobile-column-container');
  }

  async goto() {
    await this.page.goto('/kanban');
    await this.waitForPageLoad();
  }

  getCurrentColumn() {
    return this.page.getByTestId('mobile-current-column');
  }

  getColumn(status: string) {
    return this.page.getByTestId(`column-${status}`);
  }

  async swipeLeft() {
    const swipeBox = await this.swipeArea.boundingBox();
    if (!swipeBox) throw new Error('Swipe area not found');
    
    await this.page.mouse.move(swipeBox.x + swipeBox.width - 50, swipeBox.y + swipeBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(swipeBox.x + 50, swipeBox.y + swipeBox.height / 2, { steps: 10 });
    await this.page.mouse.up();
    
    // Wait for animation
    await this.page.waitForTimeout(300);
  }

  async swipeRight() {
    const swipeBox = await this.swipeArea.boundingBox();
    if (!swipeBox) throw new Error('Swipe area not found');
    
    await this.page.mouse.move(swipeBox.x + 50, swipeBox.y + swipeBox.height / 2);
    await this.page.mouse.down();
    await this.page.mouse.move(swipeBox.x + swipeBox.width - 50, swipeBox.y + swipeBox.height / 2, { steps: 10 });
    await this.page.mouse.up();
    
    // Wait for animation
    await this.page.waitForTimeout(300);
  }

  async selectTab(status: string) {
    await this.tabBar.getByRole('tab', { name: status }).click();
    await this.page.waitForTimeout(300); // Wait for animation
  }

  async dragMatterToColumn(matterCard: Locator, targetStatus: string) {
    // On mobile, long press to initiate drag
    await matterCard.tap({ delay: 1000 });
    
    // Then navigate to target column
    await this.selectTab(targetStatus);
    
    // Drop zone should be highlighted
    const dropZone = this.page.getByTestId(`drop-zone-${targetStatus}`);
    await dropZone.tap();
  }
}