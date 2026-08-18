const NON_NUMERIC = /[^0-9.]/g;

export function parsePrice(raw: string | null | undefined): number {
  if (!raw) return Number.NaN;
  const cleaned = raw.replace(NON_NUMERIC, '');
  return cleaned === '' ? Number.NaN : Number.parseFloat(cleaned);
}

export function readLabelledValue(block: string, label: string): string {
  const match = block.match(new RegExp(`^\\s*${label}\\s*:\\s*(.*)$`, 'im'));
  return match?.[1]?.trim() ?? '';
}
