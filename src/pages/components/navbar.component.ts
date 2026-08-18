import type { Locator, Page } from '@playwright/test';

import { BaseComponent } from '../../core/base.component';

const SELECTORS = {
  root: '.navbar',
  cart: '#cartur',
  login: '#login2',
  logout: '#logout2',
  loggedInUser: '#nameofuser',
} as const;

const WELCOME_PREFIX = 'Welcome ';
const LOGIN_STATE_TIMEOUT_MS = 15_000;

export class NavbarComponent extends BaseComponent {
  readonly cartLink: Locator;
  readonly loginLink: Locator;
  readonly logoutLink: Locator;
  readonly userLabel: Locator;

  constructor(page: Page) {
    super(page, page.locator(SELECTORS.root));
    this.cartLink = this.root.locator(SELECTORS.cart);
    this.loginLink = this.root.locator(SELECTORS.login);
    this.logoutLink = this.root.locator(SELECTORS.logout);
    this.userLabel = this.root.locator(SELECTORS.loggedInUser);
  }

  async openLoginModal(): Promise<void> {
    await this.loginLink.click();
  }

  async goToCart(): Promise<void> {
    await this.cartLink.click();
  }

  async waitForLoggedIn(timeoutMs = LOGIN_STATE_TIMEOUT_MS): Promise<void> {
    await this.userLabel.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async loggedInUsername(): Promise<string> {
    const text = (await this.userLabel.textContent()) ?? '';
    return text.replace(WELCOME_PREFIX, '').trim();
  }
}
