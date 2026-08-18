import { randomBytes } from 'node:crypto';

import type { Credentials, OrderDetails } from '../core/types';

const ACCOUNT_PREFIX = 'qa_demo';
const RANDOM_SUFFIX_BYTES = 3;
const PASSWORD_PREFIX = 'Pw';
const PASSWORD_SUFFIX = '!1';

export const DEMO_PRODUCT = { title: 'Samsung galaxy s6' } as const;

const VALID_ORDER: OrderDetails = {
  name: 'Alex Morgan',
  country: 'Switzerland',
  city: 'Zurich',
  creditCard: '4111111111111111',
  month: '12',
  year: '2030',
};

export function buildOrder(overrides: Partial<OrderDetails> = {}): OrderDetails {
  return { ...VALID_ORDER, ...overrides };
}

export function buildUniqueCredentials(prefix = ACCOUNT_PREFIX): Credentials {
  const suffix = `${Date.now().toString(36)}${randomBytes(RANDOM_SUFFIX_BYTES).toString('hex')}`;
  return {
    username: `${prefix}_${suffix}`,
    password: `${PASSWORD_PREFIX}${suffix}${PASSWORD_SUFFIX}`,
  };
}
