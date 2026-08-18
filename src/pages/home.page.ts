import type { Locator, Page } from '@playwright/test';

import { uiEndpoints } from '../config/env';
import { BasePage } from '../core/base.page';
import { LoginModal } from './components/login.modal';
import { NavbarComponent } from './components/navbar.component';

const SELECTORS = {
  catalog: '#tbodyid',
  card: '.card',
  cardTitleLink: '.card-title a',
  carousel: '#carouselExampleIndicators',
} as const;

const CATALOG_TIMEOUT_MS = 20_000;

export class HomePage extends BasePage {
  readonly navbar: NavbarComponent;
  readonly loginModal: LoginModal;
  readonly catalog: Locator;
  readonly productCards: Locator;

  constructor(page: Page) {
    super(page);
    this.navbar = new NavbarComponent(page);
    this.loginModal = new LoginModal(page);
    this.catalog = page.locator(SELECTORS.catalog);
    this.productCards = this.catalog.locator(SELECTORS.card);
  }

  protected get path(): string {
    return uiEndpoints.home;
  }

  protected get landmarks(): Locator[] {
    return [this.catalog, this.page.locator(SELECTORS.carousel)];
  }

  async waitForCatalog(timeoutMs = CATALOG_TIMEOUT_MS): Promise<void> {
    await this.productCards.first().waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async openProduct(title: string): Promise<void> {
    await Promise.all([
      this.page.waitForURL(new RegExp(`${uiEndpoints.product}\\?idp_=\\d+`)),
      this.catalog.locator(SELECTORS.cardTitleLink, { hasText: title }).first().click(),
    ]);
  }
}
