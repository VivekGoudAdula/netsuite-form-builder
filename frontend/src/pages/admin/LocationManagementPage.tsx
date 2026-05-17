import * as React from 'react';
import AdminLayout from '../../components/layout/AdminLayout';
import { useStore } from '../../store/useStore';
import { formatLocationOptionLabel } from '../../lib/netsuiteMasterData';
import { MapPin, RefreshCw, Search, Zap } from 'lucide-react';
import { cn } from '../../lib/utils';

export default function LocationManagementPage() {
  const {
    locations,
    locationListCount,
    locationListPage,
    locationListLimit,
    loadingLocations,
    fetchLocations,
    syncLocations,
  } = useStore();
  const [refreshing, setRefreshing] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [debouncedSearch, setDebouncedSearch] = React.useState('');
  const [message, setMessage] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(search.trim()), 350);
    return () => clearTimeout(t);
  }, [search]);

  React.useEffect(() => {
    void fetchLocations({
      page: 1,
      limit: locationListLimit,
      search: debouncedSearch || undefined,
    });
  }, [debouncedSearch, fetchLocations, locationListLimit]);

  const handleRefreshNetSuite = async () => {
    setRefreshing(true);
    setMessage(null);
    setError(null);
    try {
      const res = await syncLocations();
      if (res) {
        setMessage(`Loaded ${res.fetched} locations live from NetSuite (not stored in MongoDB).`);
      }
    } catch (e: any) {
      setError(e.response?.data?.detail || e.message || 'NetSuite request failed');
    } finally {
      setRefreshing(false);
    }
  };

  const totalPages = Math.max(1, Math.ceil(locationListCount / locationListLimit));

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ns-navy flex items-center gap-2">
            <MapPin className="text-ns-blue" />
            Locations
          </h1>
          <p className="text-ns-text-muted text-sm mt-1 max-w-xl">
            Live NetSuite RESTlet data. MongoDB stores form metadata only — not location records.
          </p>
        </div>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() =>
              fetchLocations({
                page: locationListPage,
                limit: locationListLimit,
                search: debouncedSearch || undefined,
              })
            }
            disabled={loadingLocations}
            className="border border-ns-border bg-white text-ns-navy font-bold py-2 px-4 rounded-sm flex items-center gap-2 text-xs uppercase tracking-wider hover:bg-ns-gray-bg"
          >
            <RefreshCw size={16} className={cn(loadingLocations && 'animate-spin')} />
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
              placeholder="Filter by name, subsidiary, or internal ID…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-full pl-9 pr-3 py-2 text-xs border border-ns-border rounded-sm focus:outline-none focus:border-ns-blue"
            />
          </div>
          <span className="text-[11px] text-ns-text-muted font-semibold">
            {locationListCount.toLocaleString()} from NetSuite
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-gray-50 border-b border-ns-border text-ns-text-muted uppercase tracking-wider">
              <tr>
                <th className="px-4 py-3 font-bold min-w-[280px]">Location</th>
                <th className="px-4 py-3 font-bold">Subsidiary</th>
                <th className="px-4 py-3 font-bold">Internal ID</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ns-border">
              {loadingLocations && locations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-ns-text-muted">
                    Loading from NetSuite…
                  </td>
                </tr>
              ) : locations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="px-4 py-8 text-center text-ns-text-muted">
                    No locations returned. Check NetSuite OAuth / RESTlet, then Refresh from NetSuite.
                  </td>
                </tr>
              ) : (
                locations.map(row => (
                  <tr key={row._id} className="hover:bg-ns-gray-bg/50">
                    <td className="px-4 py-2 text-ns-navy font-medium">
                      {formatLocationOptionLabel(row)}
                    </td>
                    <td className="px-4 py-2 text-ns-text-muted">{row.subsidiary || '—'}</td>
                    <td className="px-4 py-2 font-mono text-ns-text-muted">{row.internalId}</td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="p-3 border-t border-ns-border flex flex-wrap items-center justify-between gap-2 text-[11px]">
          <span className="text-ns-text-muted">
            Page {locationListPage} of {totalPages}
          </span>
          <div className="flex gap-2">
            <button
              type="button"
              disabled={locationListPage <= 1 || loadingLocations}
              onClick={() =>
                fetchLocations({
                  page: locationListPage - 1,
                  limit: locationListLimit,
                  search: debouncedSearch || undefined,
                })
              }
              className="px-3 py-1 rounded-sm border border-ns-border bg-white disabled:opacity-40"
            >
              Previous
            </button>
            <button
              type="button"
              disabled={locationListPage >= totalPages || loadingLocations}
              onClick={() =>
                fetchLocations({
                  page: locationListPage + 1,
                  limit: locationListLimit,
                  search: debouncedSearch || undefined,
                })
              }
              className="px-3 py-1 rounded-sm border border-ns-border bg-white disabled:opacity-40"
            >
              Next
            </button>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
