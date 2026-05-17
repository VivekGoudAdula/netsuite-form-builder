import type { DepartmentListResponse, DepartmentRow, DepartmentSyncSummary } from '../types';
import api from '../api/client';

export async function fetchDepartments(params: {
  page?: number;
  limit?: number;
  search?: string;
  subsidiary?: string;
}): Promise<DepartmentListResponse> {
  const res = await api.get<DepartmentListResponse>('departments/', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search || undefined,
      subsidiary: params.subsidiary || undefined,
    },
  });
  return res.data;
}

export async function searchDepartments(
  q: string,
  limit = 50,
  subsidiary?: string,
): Promise<DepartmentRow[]> {
  const res = await api.get<{ success: boolean; count: number; data: DepartmentRow[] }>(
    'departments/search',
    { params: { q, limit, subsidiary: subsidiary || undefined } },
  );
  return res.data.data ?? [];
}

/** Refresh server in-memory cache from NetSuite (no MongoDB write). */
export async function syncDepartments(): Promise<DepartmentSyncSummary> {
  const res = await api.post<DepartmentSyncSummary>('departments/sync');
  return res.data;
}
