import type { TaxNatureListResponse, TaxNatureOption } from '../types';
import api from '../api/client';

export async function fetchTaxNature(): Promise<TaxNatureListResponse> {
  const res = await api.get<TaxNatureListResponse>('tax-nature/live');
  return res.data;
}

export async function searchTaxNature(q: string): Promise<TaxNatureOption[]> {
  const res = await api.get<TaxNatureListResponse>('tax-nature/search', {
    params: { q },
  });
  if (!res.data.success) return [];
  return res.data.data ?? [];
}
