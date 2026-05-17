import type { ClassListResponse, ClassOption, ClassRow } from '../types';
import api from '../api/client';

export async function fetchClassesLive(params?: {
  page?: number;
  limit?: number;
  search?: string;
  subsidiary?: string;
}): Promise<ClassListResponse> {
  const res = await api.get<ClassListResponse>('classes/live', {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 200,
      search: params?.search || undefined,
      subsidiary: params?.subsidiary || undefined,
    },
  });
  return res.data;
}

export async function fetchClasses(params: {
  page?: number;
  limit?: number;
  search?: string;
  subsidiary?: string;
}): Promise<ClassListResponse> {
  const res = await api.get<ClassListResponse>('classes/', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search || undefined,
      subsidiary: params.subsidiary || undefined,
    },
  });
  return res.data;
}

export async function searchClasses(
  q: string,
  limit = 50,
  subsidiary?: string,
): Promise<ClassRow[]> {
  const res = await api.get<{ success: boolean; count: number; data: ClassRow[] }>(
    'classes/search',
    { params: { q, limit, subsidiary: subsidiary || undefined } },
  );
  return res.data.data ?? [];
}

export async function lookupClass(internalId: string): Promise<ClassOption | null> {
  try {
    const res = await api.get<ClassRow>(
      `classes/lookup/by-internal/${encodeURIComponent(internalId)}`,
    );
    const row = res.data;
    return {
      internalId: row.internalId,
      name: row.name,
      subsidiary: row.subsidiary ?? '',
    };
  } catch {
    return null;
  }
}
