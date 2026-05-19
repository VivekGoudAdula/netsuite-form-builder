import api from '../api/client';

export interface NetSuiteDatasource {
  id: string;
  name: string;
  key: string;
  type: 'netsuite_restlet';
  scriptId: string;
  deployId: string;
  method: 'GET' | 'POST';
  labelKey: string;
  valueKey: string;
  responseDataPath: string;
  searchFields: string[];
  authType: 'oauth1';
  isActive: boolean;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface DynamicListResponse {
  success: boolean;
  count: number;
  page: number;
  limit: number;
  data: Record<string, unknown>[];
  source?: string;
  datasourceKey?: string;
  message?: string;
  labelKey?: string;
  valueKey?: string;
}

export interface DatasourceSyncStatus {
  datasourceKey: string;
  lastFetchedAt: string | null;
  responseCount: number;
  latencyMs: number | null;
  status: 'ok' | 'error' | 'never';
  message?: string | null;
}

export interface TestConnectionResult {
  success: boolean;
  latencyMs?: number;
  responseCount?: number;
  detectedKeys?: string[];
  suggestedLabelKey?: string;
  suggestedValueKey?: string;
  sample?: unknown[];
  message?: string;
}

export type NetSuiteDatasourcePayload = Omit<
  NetSuiteDatasource,
  'id' | 'createdBy' | 'createdAt' | 'updatedAt'
>;

export async function listDatasources(activeOnly = false): Promise<NetSuiteDatasource[]> {
  const res = await api.get<NetSuiteDatasource[]>('netsuite/datasources', {
    params: { active_only: activeOnly },
  });
  return res.data;
}

export interface RegisterScriptPayload {
  scriptId: string;
  fieldId?: string;
  key?: string;
  name?: string;
  labelKey?: string;
  valueKey?: string;
}

export interface RegisterScriptResult {
  datasource: NetSuiteDatasource;
  test: TestConnectionResult;
}

export async function registerDatasourceScript(
  payload: RegisterScriptPayload,
): Promise<RegisterScriptResult> {
  const res = await api.post<RegisterScriptResult>('netsuite/datasources/register', payload);
  return res.data;
}

export async function createDatasource(
  payload: NetSuiteDatasourcePayload,
): Promise<NetSuiteDatasource> {
  const res = await api.post<NetSuiteDatasource>('netsuite/datasources', payload);
  return res.data;
}

export async function updateDatasource(
  id: string,
  payload: Partial<NetSuiteDatasourcePayload>,
): Promise<NetSuiteDatasource> {
  const res = await api.put<NetSuiteDatasource>(`netsuite/datasources/${id}`, payload);
  return res.data;
}

export async function deleteDatasource(id: string): Promise<void> {
  await api.delete(`netsuite/datasources/${id}`);
}

export async function searchDynamicDatasource(
  datasourceKey: string,
  query: string,
  page = 1,
  limit = 50,
): Promise<DynamicListResponse> {
  const res = await api.get<DynamicListResponse>(
    `netsuite/search/${encodeURIComponent(datasourceKey)}`,
    { params: { query, page, limit } },
  );
  return res.data;
}

export async function fetchDynamicDatasource(
  datasourceKey: string,
  params?: { page?: number; limit?: number; search?: string; refresh?: boolean },
): Promise<DynamicListResponse> {
  const res = await api.get<DynamicListResponse>(
    `netsuite/fetch/${encodeURIComponent(datasourceKey)}`,
    {
      params: {
        page: params?.page ?? 1,
        limit: params?.limit ?? 50,
        search: params?.search || undefined,
        refresh: params?.refresh || undefined,
      },
    },
  );
  return res.data;
}

export async function lookupDynamicRecord(
  datasourceKey: string,
  internalId: string,
): Promise<Record<string, unknown> | null> {
  try {
    const res = await api.get<Record<string, unknown>>(
      `netsuite/lookup/${encodeURIComponent(datasourceKey)}/${encodeURIComponent(internalId)}`,
    );
    return res.data;
  } catch {
    return null;
  }
}

export async function testDatasourceConnection(id: string): Promise<TestConnectionResult> {
  const res = await api.post<TestConnectionResult>(`netsuite/datasources/${id}/test`);
  return res.data;
}

export async function getDatasourceSyncStatus(
  datasourceKey: string,
): Promise<DatasourceSyncStatus> {
  const res = await api.get<DatasourceSyncStatus>(
    `netsuite/datasources/${encodeURIComponent(datasourceKey)}/sync-status`,
  );
  return res.data;
}

export async function refreshDatasourceCache(datasourceKey: string): Promise<void> {
  await api.post(`netsuite/datasources/${encodeURIComponent(datasourceKey)}/refresh-cache`);
}

export function formatDynamicLabel(
  row: Record<string, unknown>,
  labelKey: string,
  valueKey: string,
): string {
  const label = row[labelKey] ?? row.label ?? row[valueKey] ?? row.internalId;
  return String(label ?? 'Unknown');
}
