import type { Locator, Page } from '@playwright/test';

import { ModalComponent } from '../../core/base.component';
import type { Credentials } from '../../core/types';

const SELECTORS = {
  root: '#logInModal',
  username: '#loginusername',
  password: '#loginpassword',
  submit: 'button[onclick="logIn()"]',
} as const;

const MODAL_TRANSITION_TIMEOUT_MS = 10_000;

export class LoginModal extends ModalComponent {
  readonly usernameInput: Locator;
  readonly passwordInput: Locator;
  readonly submitButton: Locator;

  constructor(page: Page) {
    super(page, page.locator(SELECTORS.root));
    this.usernameInput = this.root.locator(SELECTORS.username);
    this.passwordInput = this.root.locator(SELECTORS.password);
    this.submitButton = this.root.locator(SELECTORS.submit);
  }

  async fill(credentials: Partial<Credentials>): Promise<void> {
    await this.waitUntilVisible();
    await this.fillField(this.usernameInput, credentials.username ?? '');
    await this.fillField(this.passwordInput, credentials.password ?? '');
  }

  async login(credentials: Credentials): Promise<void> {
    await this.fill(credentials);
    await Promise.all([this.page.waitForLoadState('domcontentloaded'), this.submitButton.click()]);
    await this.waitUntilHidden(MODAL_TRANSITION_TIMEOUT_MS);
  }
}
