import * as dotenv from 'dotenv';

dotenv.config({ quiet: true });

function str(key: string, fallback: string): string {
  const value = process.env[key];
  return value === undefined || value.trim() === '' ? fallback : value.trim();
}

function optionalStr(key: string): string | undefined {
  const value = process.env[key];
  return value === undefined || value.trim() === '' ? undefined : value.trim();
}

function int(key: string, fallback: number): number {
  const raw = optionalStr(key);
  if (raw === undefined) return fallback;
  const parsed = Number.parseInt(raw, 10);
  if (Number.isNaN(parsed)) {
    throw new Error(`Environment variable ${key} must be an integer, received "${raw}"`);
  }
  return parsed;
}

function optionalInt(key: string): number | undefined {
  const raw = optionalStr(key);
  return raw === undefined ? undefined : int(key, 0);
}

function bool(key: string, fallback: boolean): boolean {
  const raw = optionalStr(key)?.toLowerCase();
  if (raw === undefined) return fallback;
  return raw === 'true' || raw === '1' || raw === 'yes';
}

export const isCI = bool('CI', false);

export const env = {
  baseUrl: str('BASE_URL', 'https://www.demoblaze.com'),
  apiBaseUrl: str('API_BASE_URL', 'https://api.demoblaze.com'),

  credentials: {
    username: optionalStr('TEST_USERNAME'),
    password: optionalStr('TEST_PASSWORD'),
  },

  execution: {
    headless: bool('HEADLESS', true),
    workers: optionalInt('WORKERS') ?? 4,
    retries: optionalInt('RETRIES') ?? (isCI ? 2 : 1),
    testTimeoutMs: int('TEST_TIMEOUT_MS', 90_000),
    expectTimeoutMs: int('EXPECT_TIMEOUT_MS', 15_000),
    actionTimeoutMs: int('ACTION_TIMEOUT_MS', 20_000),
    navigationTimeoutMs: int('NAVIGATION_TIMEOUT_MS', 45_000),
  },

  artefacts: {
    trace: str('TRACE', 'on-first-retry'),
    video: str('VIDEO', 'retain-on-failure'),
    screenshot: str('SCREENSHOT', 'only-on-failure'),
  },
} as const;

export const uiEndpoints = {
  home: '/index.html',
  product: '/prod.html',
  cart: '/cart.html',

  productById(id: number): string {
    return `${uiEndpoints.product}?idp_=${id}`;
  },
} as const;

export const apiEndpoints = {
  signup: '/signup',
  login: '/login',
} as const;
