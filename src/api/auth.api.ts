import { apiEndpoints } from '../config/env';
import type { ApiErrorBody, Credentials } from '../core/types';
import { ApiClient, type ApiResult } from './api.client';

const SIGNUP_SUCCESS_BODY = '';
const USER_ALREADY_EXISTS = 'This user already exist.';

type SignupBody = string | ApiErrorBody;

function encodePassword(password: string): string {
  return Buffer.from(password, 'utf-8').toString('base64');
}

export class AuthApi {
  constructor(private readonly client: ApiClient) {}

  async signup(credentials: Credentials): Promise<ApiResult<SignupBody>> {
    return this.client.post<SignupBody>(apiEndpoints.signup, {
      username: credentials.username,
      password: encodePassword(credentials.password),
    });
  }

  async register(credentials: Credentials): Promise<void> {
    const response = await this.signup(credentials);
    const alreadyExists =
      isErrorBody(response.body) && response.body.errorMessage === USER_ALREADY_EXISTS;

    if (response.body !== SIGNUP_SUCCESS_BODY && !alreadyExists) {
      throw new Error(`Signup failed for "${credentials.username}": ${response.rawBody}`);
    }
  }
}

function isErrorBody(body: unknown): body is ApiErrorBody {
  return typeof body === 'object' && body !== null && 'errorMessage' in body;
}
