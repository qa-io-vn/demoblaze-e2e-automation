import type { Locator, Page } from '@playwright/test';

import { ModalComponent } from '../../core/base.component';
import type { OrderDetails } from '../../core/types';
import { parsePrice } from '../../utils/parse';

const SELECTORS = {
  root: '#orderModal',
  total: '#totalm',
  name: '#name',
  country: '#country',
  city: '#city',
  creditCard: '#card',
  month: '#month',
  year: '#year',
  purchase: 'button[onclick="purchaseOrder()"]',
} as const;

const TOTAL_LABEL_PREFIX = 'Total: ';

export class OrderModal extends ModalComponent {
  readonly nameInput: Locator;
  readonly countryInput: Locator;
  readonly cityInput: Locator;
  readonly creditCardInput: Locator;
  readonly monthInput: Locator;
  readonly yearInput: Locator;
  readonly purchaseButton: Locator;
  readonly totalLabel: Locator;

  constructor(page: Page) {
    super(page, page.locator(SELECTORS.root));
    this.nameInput = this.root.locator(SELECTORS.name);
    this.countryInput = this.root.locator(SELECTORS.country);
    this.cityInput = this.root.locator(SELECTORS.city);
    this.creditCardInput = this.root.locator(SELECTORS.creditCard);
    this.monthInput = this.root.locator(SELECTORS.month);
    this.yearInput = this.root.locator(SELECTORS.year);
    this.purchaseButton = this.root.locator(SELECTORS.purchase);
    this.totalLabel = this.root.locator(SELECTORS.total);
  }

  async fill(order: Partial<OrderDetails>): Promise<void> {
    await this.waitUntilVisible();
    await this.fillField(this.nameInput, order.name ?? '');
    await this.fillField(this.countryInput, order.country ?? '');
    await this.fillField(this.cityInput, order.city ?? '');
    await this.fillField(this.creditCardInput, order.creditCard ?? '');
    await this.fillField(this.monthInput, order.month ?? '');
    await this.fillField(this.yearInput, order.year ?? '');
  }

  async displayedTotal(): Promise<number> {
    const text = (await this.totalLabel.textContent()) ?? '';
    return parsePrice(text.replace(TOTAL_LABEL_PREFIX, ''));
  }

  async purchase(): Promise<void> {
    await this.purchaseButton.click();
  }
}
