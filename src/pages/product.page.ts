import type { Locator, Page } from '@playwright/test';

import { uiEndpoints } from '../config/env';
import { BasePage } from '../core/base.page';
import { captureDialog } from '../utils/dialog';
import { parsePrice } from '../utils/parse';
import { NavbarComponent } from './components/navbar.component';

const SELECTORS = {
  name: 'h2.name',
  price: 'h3.price-container',
  addToCart: 'a:has-text("Add to cart")',
} as const;

export const AddToCartAlerts = {
  authenticated: 'Product added.',
  guest: 'Product added',
} as const;

const PRICE_SUFFIX = '*includes tax';

export class ProductPage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly nameHeading: Locator;
  readonly priceHeading: Locator;
  readonly addToCartButton: Locator;

  constructor(page: Page) {
    super(page);
    this.navbar = new NavbarComponent(page);
    this.nameHeading = page.locator(SELECTORS.name);
    this.priceHeading = page.locator(SELECTORS.price);
    this.addToCartButton = page.locator(SELECTORS.addToCart);
  }

  protected get path(): string {
    return uiEndpoints.product;
  }

  protected get landmarks(): Locator[] {
    return [this.nameHeading, this.addToCartButton];
  }

  async productName(): Promise<string> {
    return ((await this.nameHeading.textContent()) ?? '').trim();
  }

  async price(): Promise<number> {
    const raw = (await this.priceHeading.textContent()) ?? '';
    return parsePrice(raw.replace(PRICE_SUFFIX, ''));
  }

  async addToCart(): Promise<string> {
    const dialog = await captureDialog(this.page, () => this.addToCartButton.click());
    return dialog.message;
  }
}
