import type { Locator, Page } from '@playwright/test';

import { BaseComponent } from '../../core/base.component';
import type { OrderConfirmation } from '../../core/types';
import { parsePrice, readLabelledValue } from '../../utils/parse';

const SELECTORS = {
  root: '.sweet-alert',
  interactive: '.sweet-alert.visible',
  heading: 'h2',
  body: 'p.lead',
  confirm: 'button.confirm',
} as const;

export const CONFIRMATION_HEADING = 'Thank you for your purchase!';

const CONFIRMATION_TIMEOUT_MS = 20_000;
const HOME_URL_PATTERN = /index\.html/;
const LABELS = {
  id: 'Id',
  amount: 'Amount',
  cardNumber: 'Card Number',
  name: 'Name',
  date: 'Date',
} as const;

export class PurchaseConfirmation extends BaseComponent {
  readonly heading: Locator;
  readonly body: Locator;
  readonly confirmButton: Locator;
  readonly interactive: Locator;

  constructor(page: Page) {
    super(page, page.locator(SELECTORS.root));
    this.heading = this.root.locator(SELECTORS.heading);
    this.body = this.root.locator(SELECTORS.body);
    this.confirmButton = this.root.locator(SELECTORS.confirm);
    this.interactive = page.locator(SELECTORS.interactive);
  }

  async waitUntilShown(timeoutMs = CONFIRMATION_TIMEOUT_MS): Promise<void> {
    await this.root.waitFor({ state: 'visible', timeout: timeoutMs });
    await this.interactive.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async headingText(): Promise<string> {
    return ((await this.heading.textContent()) ?? '').trim();
  }

  async details(): Promise<OrderConfirmation> {
    const block = await this.body.innerText();
    return {
      id: readLabelledValue(block, LABELS.id),
      amount: parsePrice(readLabelledValue(block, LABELS.amount)),
      cardNumber: readLabelledValue(block, LABELS.cardNumber),
      name: readLabelledValue(block, LABELS.name),
      date: readLabelledValue(block, LABELS.date),
    };
  }

  async confirm(): Promise<void> {
    await this.waitUntilShown();

    await Promise.all([
      this.page.waitForURL(HOME_URL_PATTERN, { timeout: CONFIRMATION_TIMEOUT_MS }),
      this.confirmButton.click(),
    ]);
  }
}
