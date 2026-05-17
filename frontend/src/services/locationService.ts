import type { LocationListResponse, LocationRow, LocationSyncSummary } from '../types';
import api from '../api/client';

export async function fetchLocations(params: {
  page?: number;
  limit?: number;
  search?: string;
  includeInactive?: boolean;
  subsidiary?: string;
}): Promise<LocationListResponse> {
  const res = await api.get<LocationListResponse>('locations/', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search || undefined,
      include_inactive: params.includeInactive ?? false,
      subsidiary: params.subsidiary || undefined,
    },
  });
  return res.data;
}

export async function searchLocations(
  q: string,
  limit = 50,
  subsidiary?: string,
): Promise<LocationRow[]> {
  const res = await api.get<{ success: boolean; count: number; data: LocationRow[] }>(
    'locations/search',
    { params: { q, limit, subsidiary: subsidiary || undefined } },
  );
  return res.data.data ?? [];
}

export async function syncLocations(): Promise<LocationSyncSummary> {
  const res = await api.post<LocationSyncSummary>('locations/sync');
  return res.data;
}

/** Refresh server in-memory cache from NetSuite (no MongoDB write). */
export async function refreshLocationsFromNetSuite(): Promise<LocationSyncSummary> {
  return syncLocations();
}
