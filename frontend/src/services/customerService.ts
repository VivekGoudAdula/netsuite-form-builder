import type { CustomerListResponse, CustomerOption, CustomerRow } from '../types';
import api from '../api/client';

export async function fetchCustomersLive(params?: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<CustomerListResponse> {
  const res = await api.get<CustomerListResponse>('customers/live', {
    params: {
      page: params?.page ?? 1,
      limit: params?.limit ?? 50,
      search: params?.search || undefined,
    },
  });
  return res.data;
}

export async function fetchCustomers(params: {
  page?: number;
  limit?: number;
  search?: string;
}): Promise<CustomerListResponse> {
  const res = await api.get<CustomerListResponse>('customers/', {
    params: {
      page: params.page ?? 1,
      limit: params.limit ?? 50,
      search: params.search || undefined,
    },
  });
  return res.data;
}

export async function searchCustomers(
  q: string,
  page = 1,
  limit = 50,
): Promise<CustomerListResponse> {
  const res = await api.get<CustomerListResponse>('customers/search', {
    params: { q, page, limit },
  });
  return res.data;
}

export function rowToCustomerOption(row: CustomerRow): CustomerOption {
  return {
    internalId: row.internalId,
    customerCode: row.customerCode,
    displayName: row.displayName,
    email: row.email ?? '',
    phone: row.phone ?? '',
    subsidiary: row.subsidiary ?? '',
    address: row.address ?? '',
    isPerson: Boolean(row.isPerson),
    companyName: row.companyName ?? '',
    firstName: row.firstName ?? '',
    lastName: row.lastName ?? '',
  };
}

export async function lookupCustomer(internalId: string): Promise<CustomerOption | null> {
  try {
    const res = await api.get<CustomerRow>(
      `customers/lookup/by-internal/${encodeURIComponent(internalId)}`,
    );
    return rowToCustomerOption(res.data);
  } catch {
    return null;
  }
}
