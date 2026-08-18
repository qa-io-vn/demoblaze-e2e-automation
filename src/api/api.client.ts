import type { APIRequestContext, APIResponse } from '@playwright/test';

import { env } from '../config/env';

const JSON_CONTENT_TYPE = 'application/json';

export interface ApiResult<T> {
  status: number;
  ok: boolean;
  body: T;
  rawBody: string;
  durationMs: number;
  headers: Record<string, string>;
}

export class ApiClient {
  constructor(
    private readonly request: APIRequestContext,
    private readonly baseUrl: string = env.apiBaseUrl,
  ) {}

  async post<T = unknown>(path: string, payload: unknown): Promise<ApiResult<T>> {
    return this.send<T>('POST', path, payload);
  }

  async get<T = unknown>(path: string): Promise<ApiResult<T>> {
    return this.send<T>('GET', path);
  }

  private async send<T>(
    method: 'GET' | 'POST',
    path: string,
    payload?: unknown,
  ): Promise<ApiResult<T>> {
    const url = this.resolve(path);
    const startedAt = performance.now();

    const response: APIResponse =
      method === 'GET'
        ? await this.request.get(url)
        : await this.request.post(url, {
            data: payload ?? {},
            headers: { 'Content-Type': JSON_CONTENT_TYPE },
          });

    const durationMs = Math.round(performance.now() - startedAt);
    const rawBody = await response.text();

    return {
      status: response.status(),
      ok: response.ok(),
      body: parseBody<T>(rawBody),
      rawBody,
      durationMs,
      headers: response.headers(),
    };
  }

  private resolve(path: string): string {
    return path.startsWith('http') ? path : `${this.baseUrl}${path}`;
  }
}

function parseBody<T>(raw: string): T {
  if (raw.trim() === '') return '' as unknown as T;
  try {
    return JSON.parse(raw) as T;
  } catch {
    return raw as unknown as T;
  }
}
