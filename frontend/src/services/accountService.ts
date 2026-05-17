import type { AccountListResponse, AccountOption, AccountRow } from '../types';
import api from '../api/client';

export async function fetchAccountsLive(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<AccountListResponse> {
  const res = await api.get<AccountListResponse>('accounts/live', {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 50,
      search: params?.search || undefined,
    },
  });
  return res.data;
}

export async function fetchAccounts(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<AccountListResponse> {
  const res = await api.get<AccountListResponse>('accounts/', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search || undefined,
    },
  });
  return res.data;
}

export async function searchAccounts(
  q: string,
  page = 1,
  limit = 50,
): Promise<AccountListResponse> {
  const res = await api.get<AccountListResponse>('accounts/search', {
    params: { q, page, limit },
  });
  return res.data;
}

export async function lookupAccount(internalId: string): Promise<AccountOption | null> {
  try {
    const res = await api.get<AccountRow>(
      `accounts/lookup/by-internal/${encodeURIComponent(internalId)}`,
    );
    const row = res.data;
    return {
      internalId: row.internalId,
      number: row.number,
      name: row.name,
      type: row.type ?? '',
      generalratetype: row.generalratetype ?? '',
      cashflowratetype: row.cashflowratetype ?? '',
    };
  } catch {
    return null;
  }
}
