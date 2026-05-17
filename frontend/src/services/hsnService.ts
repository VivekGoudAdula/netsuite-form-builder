import type { HSNListResponse, HSNRow, HSNSyncSummary } from '../types';
import api from '../api/client';

export async function fetchHSNCodes(params: {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
}): Promise<HSNListResponse> {
  const res = await api.get<HSNListResponse>('hsn-codes/', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search || undefined,
      include_inactive: params.includeInactive ?? false,
    },
  });
  return res.data;
}

export async function searchHSNCodes(q: string, limit = 50): Promise<HSNRow[]> {
  const res = await api.get<{ success: boolean; count: number; data: HSNRow[] }>(
    'hsn-codes/search',
    { params: { q, limit } },
  );
  return res.data.data ?? [];
}

export async function syncHSNCodes(): Promise<HSNSyncSummary> {
  const res = await api.post<HSNSyncSummary>('hsn-codes/sync');
  return res.data;
}

export async function testSyncHSNCodes(): Promise<HSNSyncSummary> {
  const res = await api.post<HSNSyncSummary>('hsn-codes/test-sync');
  return res.data;
}

