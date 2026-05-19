import api from '../api/client';
import {
  formatClassOptionLabel,
  formatClassOptionTitle,
  formatDepartmentOptionLabel,
  formatDepartmentOptionTitle,
  formatHsnOptionLabel,
  formatLocationOptionLabel,
  formatLocationOptionTitle,
} from './netsuiteMasterData';

export const OPTIONS_CACHE_TTL_MS = 5 * 60 * 1000;

export type CachedSelectOption = { label: string; value: string; title?: string };

const optionsCache = new Map<string, { at: number; opts: CachedSelectOption[] }>();

export function getCachedSelectOptions(key: string): CachedSelectOption[] | null {
  const hit = optionsCache.get(key);
  if (!hit || Date.now() - hit.at >= OPTIONS_CACHE_TTL_MS) return null;
  return hit.opts;
}

export function setCachedSelectOptions(key: string, opts: CachedSelectOption[]): void {
  if (opts.length > 0) {
    optionsCache.set(key, { at: Date.now(), opts });
  } else {
    optionsCache.delete(key);
  }
}

export function clearMasterDataOptionsCache(): void {
  optionsCache.clear();
}

function normalizeApiPath(raw: string): string {
  let p = (raw || '').trim();
  if (p.startsWith('/')) p = p.slice(1);
  if (p.startsWith('api/')) p = p.slice(4);
  return p;
}

export async function fetchMasterDataListPages(
  listPath: string,
  mapRow: (row: Record<string, unknown>) => CachedSelectOption,
  pageLimit = 200,
): Promise<CachedSelectOption[]> {
  const path = normalizeApiPath(listPath);
  const url = path.endsWith('/') ? path : `${path}/`;
  const out: CachedSelectOption[] = [];
  let page = 1;
  for (;;) {
    const res = await api.get(url, { params: { page, limit: pageLimit } });
    const body = res.data;
    const rows = Array.isArray(body) ? body : Array.isArray(body?.data) ? body.data : null;
    if (!rows) {
      throw new Error('API response is not a list');
    }
    const total = typeof body?.count === 'number' ? body.count : rows.length;
    for (const row of rows) {
      const mapped = mapRow(row as Record<string, unknown>);
      if (mapped.value) out.push(mapped);
    }
    if (rows.length < pageLimit || out.length >= total) break;
    page += 1;
    if (page > 100) break;
  }
  return out;
}

export const SELECT_CACHE_KEYS = {
  currency: 'netsuite_currency|currencies/|name|internalId',
  employees: 'netsuite_employees|netsuite/employees|label|value',
  department: 'netsuite_department|departments/|dept|internalId',
  class: 'netsuite_class_live|classes/|class|internalId',
  location: 'netsuite_location|locations/|loc|internalId',
  hsn: 'netsuite_hsn|hsn-codes/|hsn|internalId',
  taxNature: 'netsuite_tax_nature_live|tax-nature/live|name|name',
} as const;

const PREFETCH_STEP_DELAY_MS = 400;

async function runPrefetchSteps(steps: (() => Promise<void>)[]): Promise<void> {
  for (const step of steps) {
    try {
      await step();
    } catch (err) {
      console.warn('Master data prefetch step failed', err);
    }
    await new Promise(resolve => setTimeout(resolve, PREFETCH_STEP_DELAY_MS));
  }
}

/** Populate shared select cache for native dropdowns (FieldControl). Runs sequentially to avoid NetSuite rate limits. */
export async function prefetchMasterDataSelectOptions(): Promise<void> {
  await runPrefetchSteps([
    async () => {
      const data = await api.get('currencies/');
      if (!Array.isArray(data.data)) return;
      const opts = data.data.map((item: Record<string, unknown>) => ({
        label: String(item.name ?? 'Unknown'),
        value: String(item.internalId ?? ''),
      }));
      setCachedSelectOptions(SELECT_CACHE_KEYS.currency, opts);
    },
    async () => {
      const data = await api.get('netsuite/employees');
      if (!Array.isArray(data.data)) return;
      const opts = data.data.map((item: Record<string, unknown>) => ({
        label: String(item.label ?? 'Unknown'),
        value: String(item.value ?? ''),
      }));
      setCachedSelectOptions(SELECT_CACHE_KEYS.employees, opts);
    },
    async () => {
      const opts = await fetchMasterDataListPages('departments/', row => {
        const r = row as { name?: string; subsidiary?: string; internalId?: string };
        return {
          label: formatDepartmentOptionLabel(r),
          title: formatDepartmentOptionTitle(r),
          value: String(row.internalId ?? ''),
        };
      });
      setCachedSelectOptions(SELECT_CACHE_KEYS.department, opts);
    },
    async () => {
      const opts = await fetchMasterDataListPages('classes/', row => {
        const r = row as { name?: string; subsidiary?: string; internalId?: string };
        return {
          label: formatClassOptionLabel(r),
          title: formatClassOptionTitle(r),
          value: String(row.internalId ?? ''),
        };
      });
      setCachedSelectOptions(SELECT_CACHE_KEYS.class, opts);
    },
    async () => {
      const opts = await fetchMasterDataListPages('locations/', row => {
        const r = row as { name?: string; subsidiary?: string; internalId?: string };
        return {
          label: formatLocationOptionLabel(r),
          title: formatLocationOptionTitle(r),
          value: String(row.internalId ?? ''),
        };
      });
      setCachedSelectOptions(SELECT_CACHE_KEYS.location, opts);
    },
    async () => {
      const opts = await fetchMasterDataListPages('hsn-codes/', row => ({
        label: formatHsnOptionLabel(
          row as { hsncode?: string; hsndescription?: string; name?: string },
        ),
        value: String(row.internalId ?? ''),
      }));
      setCachedSelectOptions(SELECT_CACHE_KEYS.hsn, opts);
    },
    async () => {
      const response = await api.get('tax-nature/live');
      if (response.data?.success === false) return;
      const rows = response.data?.data;
      if (!Array.isArray(rows)) return;
      const opts = rows.map((item: { name?: string }) => ({
        label: String(item.name ?? 'Unknown'),
        value: String(item.name ?? ''),
      }));
      setCachedSelectOptions(SELECT_CACHE_KEYS.taxNature, opts);
    },
  ]);
}
