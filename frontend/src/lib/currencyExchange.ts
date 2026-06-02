import type { CurrencyRow } from '../types';

/** Resolve exchange rate from synced currency master; defaults to 1 when unknown. */
export function exchangeRateForCurrency(
  currencyId: string | undefined,
  currencies: CurrencyRow[],
): string {
  if (!currencyId) return '1';
  const row = currencies.find(
    c => c.internalId === currencyId || c._id === currencyId,
  );
  const rate = row?.exchangeRate;
  if (rate === undefined || rate === null || rate === '') return '1';
  const n = Number(rate);
  return Number.isFinite(n) && n > 0 ? String(n) : '1';
}
