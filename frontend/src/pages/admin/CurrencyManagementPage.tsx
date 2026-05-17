import * as React from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { useStore } from '../../store/useStore';
import { Coins, RefreshCw, Search, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CurrencyManagementPage() {
  const { currencies, loadingCurrencies, fetchCurrencies, syncCurrencies } = useStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    void fetchCurrencies();
  }, [fetchCurrencies]);

  const handleRefreshNetSuite = async () => {
    setRefreshing(true);
    setMessage(null);
    setError(null);
    try {
      const res = await syncCurrencies();
      if (res) {
        setMessage(`Loaded ${res.fetched} currencies live from NetSuite (not stored in MongoDB).`);
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'NetSuite request failed');
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = currencies.filter(
    r =>
      r.name.toLowerCase().includes(search.toLowerCase()) ||
      r.internalId.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ns-navy flex items-center gap-2">
            <Coins className="text-ns-blue" />
            Currencies
          </h1>
          <p className="text-ns-text-muted text-sm mt-1 max-w-xl">
            Live NetSuite RESTlet data. Form dropdowns call the API directly — nothing is saved to MongoDB.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => fetchCurrencies()}
            disabled={loadingCurrencies}
            className="border border-ns-border bg-white text-ns-navy font-bold py-2 px-4 rounded-sm flex items-center gap-2 text-xs uppercase tracking-wider hover:bg-ns-gray-bg"
          >
            <RefreshCw size={16} className={cn(loadingCurrencies && 'animate-spin')} />
            Reload list
          </button>
          <button
            type="button"
            onClick={handleRefreshNetSuite}
            disabled={refreshing}
            className="bg-ns-blue hover:bg-ns-blue/90 text-white font-bold py-2 px-6 rounded-sm shadow-lg shadow-ns-blue/20 flex items-center gap-2 text-xs uppercase tracking-wider"
          >
            <Zap size={16} className={cn(refreshing && 'animate-pulse')} />
            {refreshing ? 'Calling NetSuite…' : 'Refresh from NetSuite'}
          </button>
        </div>
      </div>

      {message && (
        <div className="mb-4 p-3 rounded-sm border border-green-200 bg-green-50 text-green-900 text-xs font-semibold">
          {message}
        </div>
      )}
      {error && (
        <div className="mb-4 p-3 rounded-sm border border-red-200 bg-red-50 text-red-900 text-xs font-semibold">
          {error}
        </div>
      )}

      <div className="bg-white border border-ns-border rounded-sm ns-panel-shadow overflow-hidden">
        <div className="p-4 border-b border-ns-border flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
          <div className="relative max-w-md w-full">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <input
              type="text"
              placeholder="Filter by name or internal ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-ns-border rounded-sm focus:outline-none focus:border-ns-blue"
            />
          </div>
          <span className="text-[11px] text-ns-text-muted font-semibold">
            {filtered.length.toLocaleString()} from NetSuite
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-ns-border text-ns-text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-bold">Internal ID</th>
                <th className="px-4 py-3 font-bold">Currency</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ns-border">
              {loadingCurrencies && filtered.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-ns-text-muted">
                    Loading from NetSuite…
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={2} className="px-4 py-8 text-center text-ns-text-muted">
                    No currencies returned. Check NetSuite OAuth / RESTlet, then Refresh from NetSuite.
                  </td>
                </tr>
              ) : (
                filtered.map(row => (
                  <tr key={row._id} className="hover:bg-ns-gray-bg/50">
                    <td className="px-4 py-2 font-mono text-ns-text-muted">{row.internalId}</td>
                    <td className="px-4 py-2 font-semibold text-ns-navy">{row.name}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </AdminLayout>
  );
}
