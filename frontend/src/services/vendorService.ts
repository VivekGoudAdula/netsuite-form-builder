import type { VendorListResponse, VendorOption, VendorRow } from '../types';
import api from '../api/client';

export async function fetchVendorsLive(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<VendorListResponse> {
  const res = await api.get<VendorListResponse>('vendors/live', {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 50,
      search: params?.search || undefined,
    },
  });
  return res.data;
}

export async function fetchVendors(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<VendorListResponse> {
  const res = await api.get<VendorListResponse>('vendors/', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search || undefined,
    },
  });
  return res.data;
}

export async function searchVendors(
  q: string,
  page = 1,
  limit = 50,
): Promise<VendorListResponse> {
  const res = await api.get<VendorListResponse>('vendors/search', {
    params: { q, page, limit },
  });
  return res.data;
}

export function rowToVendorOption(row: VendorRow): VendorOption {
  return {
    internalId: row.internalId,
    vendorCode: row.vendorCode,
    displayName: row.displayName,
    email: row.email ?? '',
    phone: row.phone ?? '',
    subsidiary: row.subsidiary ?? '',
    subsidiaryId: row.subsidiaryId ?? '',
    address: row.address ?? '',
    isPerson: Boolean(row.isPerson),
    companyName: row.companyName ?? '',
    firstName: row.firstName ?? '',
    lastName: row.lastName ?? '',
  };
}

export async function lookupVendor(internalId: string): Promise<VendorOption | null> {
  try {
    const res = await api.get<VendorRow>(
      `vendors/lookup/by-internal/${encodeURIComponent(internalId)}`,
    );
    return rowToVendorOption(res.data);
  } catch {
    return null;
  }
}
