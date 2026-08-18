import type { Locator, Page } from '@playwright/test';

const OPAQUE = '1';
const SHOWN_CLASS = 'show';
const ANIMATION_SETTLE_TIMEOUT_MS = 2_000;

export abstract class BaseComponent {
  protected constructor(
    protected readonly page: Page,
    readonly root: Locator,
  ) {}

  async waitUntilVisible(timeoutMs?: number): Promise<void> {
    await this.root.waitFor({ state: 'visible', timeout: timeoutMs });
  }

  async waitUntilHidden(timeoutMs?: number): Promise<void> {
    await this.root.waitFor({ state: 'hidden', timeout: timeoutMs });
  }
}

export abstract class ModalComponent extends BaseComponent {
  protected constructor(page: Page, root: Locator) {
    super(page, root);
  }

  override async waitUntilVisible(timeoutMs?: number): Promise<void> {
    await this.root.waitFor({ state: 'visible', timeout: timeoutMs });
    await this.waitUntilAnimationSettled();
  }

  protected async fillField(field: Locator, value: string): Promise<void> {
    await field.fill(value);

    if ((await field.inputValue()) !== value) {
      await field.fill(value);
    }
  }

  private async waitUntilAnimationSettled(): Promise<void> {
    await this.root.evaluate(
      (element, { opaque, shownClass, settleTimeout }) =>
        new Promise<void>((resolve) => {
          const settled = (): boolean =>
            element.classList.contains(shownClass) &&
            window.getComputedStyle(element).opacity === opaque;

          if (settled()) {
            resolve();
            return;
          }

          const timer = window.setTimeout(resolve, settleTimeout);
          element.addEventListener(
            'transitionend',
            () => {
              window.clearTimeout(timer);
              resolve();
            },
            { once: true },
          );
        }),
      { opaque: OPAQUE, shownClass: SHOWN_CLASS, settleTimeout: ANIMATION_SETTLE_TIMEOUT_MS },
    );
  }
}
