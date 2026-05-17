import type { ItemListResponse, ItemOption, ItemRow } from '../types';
import api from '../api/client';

export async function fetchItemsLive(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ItemListResponse> {
  const res = await api.get<ItemListResponse>('items/live', {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 50,
      search: params?.search || undefined,
    },
  });
  return res.data;
}

export async function fetchItems(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<ItemListResponse> {
  const res = await api.get<ItemListResponse>('items/', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search || undefined,
    },
  });
  return res.data;
}

export async function searchItems(
  q: string,
  page = 1,
  limit = 50,
): Promise<ItemListResponse> {
  const res = await api.get<ItemListResponse>('items/search', {
    params: { q, page, limit },
  });
  return res.data;
}

export function rowToItemOption(row: ItemRow): ItemOption {
  return {
    internalId: row.internalId,
    displayName: row.displayName,
    itemCategory: row.itemCategory ?? '',
    department: row.department ?? '',
    className: row.className ?? '',
    location: row.location ?? '',
    hsnCode: row.hsnCode ?? '',
    gstRate: row.gstRate ?? '',
  };
}

export async function lookupItem(internalId: string): Promise<ItemOption | null> {
  try {
    const res = await api.get<ItemRow>(
      `items/lookup/by-internal/${encodeURIComponent(internalId)}`,
    );
    return rowToItemOption(res.data);
  } catch {
    return null;
  }
}
