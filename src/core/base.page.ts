import type { Locator, Page, Response } from '@playwright/test';

import { env } from '../config/env';

const LANDMARK_TIMEOUT_MS = env.execution.actionTimeoutMs;

export abstract class BasePage {
  protected constructor(protected readonly page: Page) {}

  protected abstract get path(): string;

  protected abstract get landmarks(): Locator[];

  async open(pathOverride?: string): Promise<Response | null> {
    const target = pathOverride ?? this.path;
    const response = await this.page.goto(target, { waitUntil: 'domcontentloaded' });
    await this.waitUntilLoaded();
    return response;
  }

  async waitUntilLoaded(timeoutMs = LANDMARK_TIMEOUT_MS): Promise<void> {
    const landmarks = this.landmarks;
    if (landmarks.length === 0) return;

    const firstVisible = await Promise.race([
      ...landmarks.map(async (landmark) => {
        await landmark.first().waitFor({ state: 'visible', timeout: timeoutMs });
        return true;
      }),
      new Promise<false>((resolve) => setTimeout(() => resolve(false), timeoutMs)),
    ]).catch(() => false);

    if (!firstVisible) {
      throw new Error(`${this.constructor.name} did not load within ${timeoutMs} ms`);
    }
  }

  async reload(): Promise<void> {
    await this.page.reload({ waitUntil: 'domcontentloaded' });
    await this.waitUntilLoaded();
  }
}
