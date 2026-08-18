import { expect, request as playwrightRequest, test as base } from '@playwright/test';

import { ApiClient } from '../api/api.client';
import { AuthApi } from '../api/auth.api';
import { env } from '../config/env';
import type { Credentials } from '../core/types';
import { buildUniqueCredentials } from '../data/test-data';
import { CartPage } from '../pages/cart.page';
import { HomePage } from '../pages/home.page';
import { ProductPage } from '../pages/product.page';

const WORKER_ACCOUNT_PREFIX = 'qa_w';

export interface WorkerFixtures {
  account: Credentials;
}

export interface TestFixtures {
  homePage: HomePage;
  productPage: ProductPage;
  cartPage: CartPage;
}

export const test = base.extend<TestFixtures, WorkerFixtures>({
  account: [
    async ({}, use, workerInfo) => {
      const { username, password } = env.credentials;
      const pinned = Boolean(username && password);

      const credentials: Credentials = pinned
        ? { username: username as string, password: password as string }
        : buildUniqueCredentials(`${WORKER_ACCOUNT_PREFIX}${workerInfo.workerIndex}`);

      if (!pinned) {
        const context = await playwrightRequest.newContext();
        await new AuthApi(new ApiClient(context)).register(credentials);
        await context.dispose();
      }

      await use(credentials);
    },
    { scope: 'worker' },
  ],

  homePage: async ({ page }, use) => {
    await use(new HomePage(page));
  },

  productPage: async ({ page }, use) => {
    await use(new ProductPage(page));
  },

  cartPage: async ({ page }, use) => {
    await use(new CartPage(page));
  },
});

export { expect };
