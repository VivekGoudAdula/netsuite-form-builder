import * as React from 'react';
import {
  Plug,
  Plus,
  RefreshCcw,
  Trash2,
  Zap,
  Activity,
  Eye,
  Pencil,
} from 'lucide-react';
import AdminLayout from '../components/layout/AdminLayout';
import { Button, Input, Label, Select } from '../components/ui/Base';
import { Table, THead, TBody, TR, TH, TD, Modal, ConfirmModal } from '../components/ui/Complex';
import {
  createDatasource,
  deleteDatasource,
  getDatasourceSyncStatus,
  listDatasources,
  registerDatasourceScript,
  testDatasourceConnection,
  updateDatasource,
  type DatasourceSyncStatus,
  type NetSuiteDatasource,
  type NetSuiteDatasourcePayload,
  type TestConnectionResult,
} from '../services/netsuiteDatasourceService';

const emptyForm: NetSuiteDatasourcePayload = {
  name: '',
  key: '',
  type: 'netsuite_restlet',
  scriptId: '',
  deployId: '1',
  method: 'GET',
  labelKey: 'displayName',
  valueKey: 'internalId',
  responseDataPath: 'data',
  searchFields: [],
  authType: 'oauth1',
  isActive: true,
};

export default function NetSuiteDatasourceManagementPage() {
  const [items, setItems] = React.useState<NetSuiteDatasource[]>([]);
  const [loading, setLoading] = React.useState(true);
  const [modalOpen, setModalOpen] = React.useState(false);
  const [editing, setEditing] = React.useState<NetSuiteDatasource | null>(null);
  const [form, setForm] = React.useState<NetSuiteDatasourcePayload>(emptyForm);
  const [searchFieldsText, setSearchFieldsText] = React.useState('');
  const [deleteTarget, setDeleteTarget] = React.useState<NetSuiteDatasource | null>(null);
  const [testResult, setTestResult] = React.useState<TestConnectionResult | null>(null);
  const [testing, setTesting] = React.useState(false);
  const [syncMap, setSyncMap] = React.useState<Record<string, DatasourceSyncStatus>>({});

  const load = React.useCallback(async () => {
    setLoading(true);
    try {
      const rows = await listDatasources();
      setItems(rows);
      const statuses = await Promise.all(
        rows.map(async r => {
          try {
            const s = await getDatasourceSyncStatus(r.key);
            return [r.key, s] as const;
          } catch {
            return [r.key, null] as const;
          }
        }),
      );
      const map: Record<string, DatasourceSyncStatus> = {};
      for (const [k, s] of statuses) {
        if (s) map[k] = s;
      }
      setSyncMap(map);
    } finally {
      setLoading(false);
    }
  }, []);

  React.useEffect(() => {
    void load();
  }, [load]);

  const openCreate = () => {
    setEditing(null);
    setForm(emptyForm);
    setSearchFieldsText('');
    setTestResult(null);
    setModalOpen(true);
  };

  const openEdit = (row: NetSuiteDatasource) => {
    setEditing(row);
    setForm({
      name: row.name,
      key: row.key,
      type: row.type,
      scriptId: row.scriptId,
      deployId: row.deployId,
      method: row.method,
      labelKey: row.labelKey,
      valueKey: row.valueKey,
      responseDataPath: row.responseDataPath,
      searchFields: row.searchFields,
      authType: row.authType,
      isActive: row.isActive,
    });
    setSearchFieldsText(row.searchFields.join(', '));
    setTestResult(null);
    setModalOpen(true);
  };

  const handleSave = async () => {
    if (!form.scriptId.trim()) return;
    const payload: NetSuiteDatasourcePayload = {
      ...form,
      deployId: '1',
      authType: 'oauth1',
      method: 'GET',
      searchFields: searchFieldsText
        .split(',')
        .map(s => s.trim())
        .filter(Boolean),
    };
    if (editing) {
      await updateDatasource(editing.id, payload);
    } else if (!form.key.trim()) {
      await registerDatasourceScript({
        scriptId: form.scriptId.trim(),
        name: form.name || form.scriptId,
        labelKey: form.labelKey,
        valueKey: form.valueKey,
      });
    } else {
      await createDatasource(payload);
    }
    setModalOpen(false);
    await load();
  };

  const handleTest = async () => {
    if (!editing) return;
    setTesting(true);
    setTestResult(null);
    try {
      const res = await testDatasourceConnection(editing.id);
      setTestResult(res);
    } finally {
      setTesting(false);
    }
  };

  const statusBadge = (key: string) => {
    const s = syncMap[key];
    if (!s || s.status === 'never') {
      return <span className="text-[10px] text-gray-400">Not synced</span>;
    }
    if (s.status === 'error') {
      return <span className="text-[10px] text-red-600 font-semibold">Error</span>;
    }
    return (
      <span className="text-[10px] text-green-600 font-semibold">
        OK · {s.responseCount} rows · {s.latencyMs ?? '—'}ms
      </span>
    );
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-ns-blue mb-1">
              <Plug size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Master Data</span>
            </div>
            <h1 className="text-3xl font-bold text-ns-text">NetSuite Connectors</h1>
            <p className="text-sm text-ns-text-muted mt-1">
              Configure RESTlet script IDs and field mappings without code changes.
            </p>
          </div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void load()} className="gap-2">
              <RefreshCcw size={16} />
              Refresh
            </Button>
            <Button onClick={openCreate} className="gap-2 px-6">
              <Plus size={18} />
              Add Connector
            </Button>
          </div>
        </div>

        <Table>
          <THead>
            <TR>
              <TH>Name</TH>
              <TH>Key</TH>
              <TH>Script / Deploy</TH>
              <TH>Mapping</TH>
              <TH>Sync Status</TH>
              <TH className="text-right">Actions</TH>
            </TR>
          </THead>
          <TBody>
            {loading && (
              <TR>
                <TD colSpan={6} className="text-center py-8 text-ns-text-muted">
                  Loading connectors…
                </TD>
              </TR>
            )}
            {!loading &&
              items.map(row => (
                <TR key={row.id}>
                  <TD className="font-semibold">{row.name}</TD>
                  <TD>
                    <code className="text-[11px] bg-gray-100 px-1.5 py-0.5 rounded">{row.key}</code>
                  </TD>
                  <TD className="text-[11px] text-ns-text-muted max-w-[200px] truncate">
                    {row.scriptId} / {row.deployId}
                  </TD>
                  <TD className="text-[11px]">
                    {row.labelKey} → {row.valueKey}
                  </TD>
                  <TD>
                    <div className="flex items-center gap-1.5">
                      <Activity size={12} className="text-ns-blue" />
                      {statusBadge(row.key)}
                    </div>
                  </TD>
                  <TD className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => openEdit(row)} title="Edit">
                      <Pencil size={14} />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => setDeleteTarget(row)}
                      title="Delete"
                    >
                      <Trash2 size={14} className="text-red-500" />
                    </Button>
                  </TD>
                </TR>
              ))}
          </TBody>
        </Table>
      </div>

      <Modal
        isOpen={modalOpen}
        onClose={() => setModalOpen(false)}
        title={editing ? 'Edit NetSuite Connector' : 'New NetSuite Connector'}
      >
        <div className="space-y-4 max-h-[70vh] overflow-y-auto pr-1">
          <motionPlaceholder>
            <Label>Datasource Name</Label>
            <Input
              value={form.name}
              onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
              placeholder="NetSuite Vendors"
            />
          </motionPlaceholder>
          <motionPlaceholder>
            <Label>Datasource Key</Label>
            <Input
              value={form.key}
              disabled={!!editing}
              onChange={e =>
                setForm(f => ({ ...f, key: e.target.value.toLowerCase().replace(/\s+/g, '-') }))
              }
              placeholder="vendors"
            />
            <p className="text-[10px] text-ns-text-muted mt-1">
              Used in forms as <code>netsuite_dynamic</code> → <code>{form.key || 'key'}</code>
            </p>
          </motionPlaceholder>
          <div className="grid grid-cols-2 gap-3">
            <motionPlaceholder>
              <Label>Script ID</Label>
              <Input
                value={form.scriptId}
                onChange={e => setForm(f => ({ ...f, scriptId: e.target.value }))}
              />
            </motionPlaceholder>
            <motionPlaceholder>
              <Label>Deploy ID</Label>
              <Input value="1" disabled className="bg-gray-50 text-gray-500" />
              <p className="text-[9px] text-ns-text-muted mt-1">Fixed · OAuth from .env</p>
            </motionPlaceholder>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <motionPlaceholder>
              <Label>Label Key</Label>
              <Input
                value={form.labelKey}
                onChange={e => setForm(f => ({ ...f, labelKey: e.target.value }))}
              />
            </motionPlaceholder>
            <motionPlaceholder>
              <Label>Value Key</Label>
              <Input
                value={form.valueKey}
                onChange={e => setForm(f => ({ ...f, valueKey: e.target.value }))}
              />
            </motionPlaceholder>
          </div>
          <motionPlaceholder>
            <Label>Response Data Path</Label>
            <Input
              value={form.responseDataPath}
              onChange={e => setForm(f => ({ ...f, responseDataPath: e.target.value }))}
              placeholder="data"
            />
          </motionPlaceholder>
          <motionPlaceholder>
            <Label>Search Fields (comma-separated)</Label>
            <Input
              value={searchFieldsText}
              onChange={e => setSearchFieldsText(e.target.value)}
              placeholder="displayName, email, subsidiary"
            />
          </motionPlaceholder>
          <motionPlaceholder className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={e => setForm(f => ({ ...f, isActive: e.target.checked }))}
              id="ds-active"
            />
            <label htmlFor="ds-active" className="text-sm font-medium">
              Active
            </label>
          </motionPlaceholder>

          {editing && (
            <div className="border border-ns-border rounded-sm p-3 bg-ns-light-blue/20 space-y-2">
              <div className="flex items-center justify-between">
                <span className="text-[11px] font-bold uppercase tracking-wider text-ns-blue flex items-center gap-1">
                  <Zap size={12} /> Test Connection
                </span>
                <Button variant="secondary" size="sm" disabled={testing} onClick={() => void handleTest()}>
                  {testing ? 'Testing…' : 'Run Test'}
                </Button>
              </div>
              {testResult && (
                <div className="text-[11px] space-y-1">
                  <p className={testResult.success ? 'text-green-700' : 'text-red-700'}>
                    {testResult.success ? 'Connection OK' : testResult.message}
                    {testResult.latencyMs != null && ` · ${testResult.latencyMs}ms`}
                    {testResult.responseCount != null && ` · ${testResult.responseCount} records`}
                  </p>
                  {testResult.detectedKeys && testResult.detectedKeys.length > 0 && (
                    <p className="text-ns-text-muted">
                      Keys: {testResult.detectedKeys.join(', ')}
                    </p>
                  )}
                  {testResult.sample && testResult.sample.length > 0 && (
                    <pre className="text-[10px] bg-white p-2 rounded border overflow-auto max-h-32">
                      {JSON.stringify(testResult.sample, null, 2)}
                    </pre>
                  )}
                </div>
              )}
            </div>
          )}

          <motionPlaceholder className="flex justify-end gap-2 pt-2">
            <Button variant="secondary" onClick={() => setModalOpen(false)}>
              Cancel
            </Button>
            <Button onClick={() => void handleSave()}>Save Connector</Button>
          </motionPlaceholder>
        </div>
      </Modal>

      <ConfirmModal
        isOpen={!!deleteTarget}
        onClose={() => setDeleteTarget(null)}
        onConfirm={async () => {
          if (deleteTarget) {
            await deleteDatasource(deleteTarget.id);
            setDeleteTarget(null);
            await load();
          }
        }}
        title="Delete Connector"
        message={`Remove "${deleteTarget?.name}"? Fields using key "${deleteTarget?.key}" will stop loading.`}
      />
    </AdminLayout>
  );
}

function motionPlaceholder({
  children,
  className,
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return <div className={className}>{children}</div>;
}
