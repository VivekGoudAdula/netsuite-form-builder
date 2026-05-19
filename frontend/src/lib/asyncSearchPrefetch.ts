import type { AccountRow, CustomerRow, ItemRow, VendorRow } from '../types';

const TTL_MS = 5 * 60 * 1000;

type CacheEntry<T> = { rows: T[]; total: number; at: number };

const accountCache = new Map<string, CacheEntry<AccountRow>>();
const itemCache = new Map<string, CacheEntry<ItemRow>>();
const vendorCache = new Map<string, CacheEntry<VendorRow>>();
const customerCache = new Map<string, CacheEntry<CustomerRow>>();

function cacheKey(q: string, page: number) {
  return `${q.trim().toLowerCase()}|${page}`;
}

export function setPrefetchedAccountSearch(q: string, page: number, rows: AccountRow[], total: number) {
  accountCache.set(cacheKey(q, page), { rows, total, at: Date.now() });
}

export function getPrefetchedAccountSearch(q: string, page: number): CacheEntry<AccountRow> | null {
  const hit = accountCache.get(cacheKey(q, page));
  if (!hit || Date.now() - hit.at >= TTL_MS) return null;
  return hit;
}

export function setPrefetchedItemSearch(q: string, page: number, rows: ItemRow[], total: number) {
  itemCache.set(cacheKey(q, page), { rows, total, at: Date.now() });
}

export function getPrefetchedItemSearch(q: string, page: number): CacheEntry<ItemRow> | null {
  const hit = itemCache.get(cacheKey(q, page));
  if (!hit || Date.now() - hit.at >= TTL_MS) return null;
  return hit;
}

export function setPrefetchedVendorSearch(q: string, page: number, rows: VendorRow[], total: number) {
  vendorCache.set(cacheKey(q, page), { rows, total, at: Date.now() });
}

export function getPrefetchedVendorSearch(q: string, page: number): CacheEntry<VendorRow> | null {
  const hit = vendorCache.get(cacheKey(q, page));
  if (!hit || Date.now() - hit.at >= TTL_MS) return null;
  return hit;
}

export function setPrefetchedCustomerSearch(
  q: string,
  page: number,
  rows: CustomerRow[],
  total: number,
) {
  customerCache.set(cacheKey(q, page), { rows, total, at: Date.now() });
}

export function getPrefetchedCustomerSearch(
  q: string,
  page: number,
): CacheEntry<CustomerRow> | null {
  const hit = customerCache.get(cacheKey(q, page));
  if (!hit || Date.now() - hit.at >= TTL_MS) return null;
  return hit;
}

export function clearAsyncSearchPrefetch(): void {
  accountCache.clear();
  itemCache.clear();
  vendorCache.clear();
  customerCache.clear();
}
