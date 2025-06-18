import { Page, Locator } from '@playwright/test';
import { BasePage } from './BasePage';

export class MobileMatterPage extends BasePage {
  readonly caseNumberInput: Locator;
  readonly titleInput: Locator;
  readonly clientNameInput: Locator;
  readonly statusSelect: Locator;
  readonly prioritySelect: Locator;
  readonly descriptionTextarea: Locator;
  readonly submitButton: Locator;
  readonly bottomSheet: Locator;

  constructor(page: Page) {
    super(page);
    this.caseNumberInput = page.getByLabel('Case Number');
    this.titleInput = page.getByLabel('Title');
    this.clientNameInput = page.getByLabel('Client Name');
    this.statusSelect = page.getByLabel('Status');
    this.prioritySelect = page.getByLabel('Priority');
    this.descriptionTextarea = page.getByLabel('Description');
    this.submitButton = page.getByRole('button', { name: 'Create Matter' });
    this.bottomSheet = page.getByTestId('mobile-bottom-sheet');
  }

  async gotoNew() {
    await this.page.goto('/matters/new');
    await this.waitForPageLoad();
  }

  async fillQuickCreate(data: {
    caseNumber: string;
    title: string;
    clientName: string;
  }) {
    await this.caseNumberInput.fill(data.caseNumber);
    await this.titleInput.fill(data.title);
    await this.clientNameInput.fill(data.clientName);
  }

  async submit() {
    await this.submitButton.tap();
  }

  async openBottomSheet() {
    // Swipe up from bottom
    const viewport = this.page.viewportSize();
    if (!viewport) throw new Error('No viewport size');
    
    await this.page.touchscreen.swipe({
      startX: viewport.width / 2,
      startY: viewport.height - 20,
      endX: viewport.width / 2,
      endY: viewport.height / 2,
      steps: 10
    });
  }

  async closeBottomSheet() {
    // Swipe down
    const sheetBox = await this.bottomSheet.boundingBox();
    if (!sheetBox) throw new Error('Bottom sheet not found');
    
    await this.page.touchscreen.swipe({
      startX: sheetBox.x + sheetBox.width / 2,
      startY: sheetBox.y + 50,
      endX: sheetBox.x + sheetBox.width / 2,
      endY: sheetBox.y + sheetBox.height - 50,
      steps: 10
    });
  }
}