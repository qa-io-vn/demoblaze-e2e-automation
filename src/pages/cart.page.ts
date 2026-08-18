import type { Locator, Page } from '@playwright/test';

import { uiEndpoints } from '../config/env';
import { BasePage } from '../core/base.page';
import type { CartRow } from '../core/types';
import { parsePrice } from '../utils/parse';
import { NavbarComponent } from './components/navbar.component';
import { OrderModal } from './components/order.modal';
import { PurchaseConfirmation } from './components/purchase-confirmation.component';

const SELECTORS = {
  row: '#tbodyid tr',
  placeOrder: 'button[data-target="#orderModal"]',
  total: '#totalp',
} as const;

const COLUMN = {
  title: 2,
  price: 3,
} as const;

const CART_SYNC_TIMEOUT_MS = 30_000;
const CART_POLL_INTERVAL_MS = 300;
const RELOAD_AFTER_ATTEMPTS = 4;
const MODAL_TRANSITION_TIMEOUT_MS = 10_000;

export class CartPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly orderModal: OrderModal;
  readonly confirmation: PurchaseConfirmation;
  readonly rows: Locator;
  readonly placeOrderButton: Locator;
  readonly totalLabel: Locator;

  constructor(page: Page) {
    super(page);
    this.navbar = new NavbarComponent(page);
    this.orderModal = new OrderModal(page);
    this.confirmation = new PurchaseConfirmation(page);
    this.rows = page.locator(SELECTORS.row);
    this.placeOrderButton = page.locator(SELECTORS.placeOrder);
    this.totalLabel = page.locator(SELECTORS.total);
  }

  protected get path(): string {
    return uiEndpoints.cart;
  }

  protected get landmarks(): Locator[] {
    return [this.placeOrderButton];
  }

  async itemCount(): Promise<number> {
    return this.rows.count();
  }

  async items(): Promise<CartRow[]> {
    const count = await this.rows.count();
    const items: CartRow[] = [];

    for (let index = 0; index < count; index += 1) {
      const row = this.rows.nth(index);
      const title = await row.locator(`td:nth-child(${COLUMN.title})`).textContent();
      const price = await row.locator(`td:nth-child(${COLUMN.price})`).textContent();
      items.push({ title: (title ?? '').trim(), price: parsePrice(price) });
    }
    return items;
  }

  async total(): Promise<number> {
    return parsePrice(await this.totalLabel.textContent());
  }

  async waitForItemCount(expected: number, timeoutMs = CART_SYNC_TIMEOUT_MS): Promise<void> {
    const deadline = Date.now() + timeoutMs;
    let attempts = 0;

    while (Date.now() < deadline) {
      if ((await this.itemCount()) === expected) return;

      attempts += 1;
      if (attempts % RELOAD_AFTER_ATTEMPTS === 0) {
        await this.reload();
      } else {
        await this.page.waitForTimeout(CART_POLL_INTERVAL_MS);
      }
    }

    throw new Error(
      `Cart still shows ${await this.itemCount()} item(s), expected ${expected} within ${timeoutMs} ms`,
    );
  }

  async placeOrder(): Promise<OrderModal> {
    await this.placeOrderButton.click();
    await this.orderModal.waitUntilVisible(MODAL_TRANSITION_TIMEOUT_MS);
    return this.orderModal;
  }
}
