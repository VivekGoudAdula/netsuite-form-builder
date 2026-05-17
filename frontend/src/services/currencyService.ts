import type { CurrencyRow, CurrencySyncSummary } from '../types';
import api from '../api/client';

export async function getCurrencies(includeInactive = false): Promise<CurrencyRow[]> {
  const res = await api.get<CurrencyRow[]>('currencies/', {
    params: { include_inactive: includeInactive },
  });
  return res.data;
}

export async function syncCurrencies(): Promise<CurrencySyncSummary> {
  const res = await api.post<CurrencySyncSummary>('currencies/sync');
  return res.data;
}

export async function testSyncCurrencies(): Promise<CurrencySyncSummary> {
  const res = await api.post<CurrencySyncSummary>('currencies/test-sync');
  return res.data;
}

