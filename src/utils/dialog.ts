import type { Dialog, Page } from '@playwright/test';

const DEFAULT_DIALOG_TIMEOUT_MS = 15_000;

export interface CapturedDialog {
  message: string;
  type: string;
}

export async function captureDialog(
  page: Page,
  action: () => Promise<unknown>,
  timeoutMs = DEFAULT_DIALOG_TIMEOUT_MS,
): Promise<CapturedDialog> {
  let settle: (value: CapturedDialog) => void = () => undefined;
  let fail: (reason: Error) => void = () => undefined;
  const captured = new Promise<CapturedDialog>((resolve, reject) => {
    settle = resolve;
    fail = reject;
  });

  captured.catch(() => undefined);

  const handler = async (dialog: Dialog): Promise<void> => {
    const payload: CapturedDialog = { message: dialog.message(), type: dialog.type() };
    await dialog.accept().catch(() => undefined);
    settle(payload);
  };

  page.once('dialog', handler);
  const timer = setTimeout(
    () => fail(new Error(`No dialog appeared within ${timeoutMs} ms`)),
    timeoutMs,
  );

  const running = action();
  running.catch(() => undefined);

  try {
    const [, result] = await Promise.all([running, captured]);
    return result;
  } finally {
    clearTimeout(timer);
    page.off('dialog', handler);
  }
}
