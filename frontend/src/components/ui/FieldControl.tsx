import * as React from 'react';
import { createPortal } from 'react-dom';
import {
  ChevronDown,
  Calendar,
  DollarSign,
  Link as LinkIcon,
  FileText,
  RefreshCcw,
  AlertCircle,
  Loader2,
  Zap,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../api/client';
import {
  formatHsnOptionLabel,
  formatLocationOptionLabel,
  isLocationFieldId,
  NETSUITE_LOCATION_DATA_SOURCE,
} from '../../lib/netsuiteMasterData';
import type { DataSource } from '../../types';

const OPTIONS_CACHE_TTL_MS = 5 * 60 * 1000;
const optionsCache = new Map<string, { at: number; opts: { label: string; value: string }[] }>();

function HSNAsyncSelect({
  value,
  onChange,
  disabled,
  preview,
  label,
  className,
  dataSource,
}: {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  preview?: boolean;
  label?: string;
  className?: string;
  dataSource?: DataSource;
}) {
  const searchPath =
    dataSource?.apiConfig?.url?.replace(/^\//, '').replace(/^api\//, '') || 'hsn-codes/search';
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLUListElement>(null);
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [results, setResults] = React.useState<
    { internalId: string; name: string; hsncode: string; hsndescription?: string }[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [searchErr, setSearchErr] = React.useState<string | null>(null);
  const [panelRect, setPanelRect] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const updatePanelPosition = React.useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPanelRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 280),
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    const onScrollOrResize = () => updatePanelPosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, updatePanelPosition]);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  React.useEffect(() => {
    if (preview || !value) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.get(
          `hsn-codes/lookup/by-internal/${encodeURIComponent(String(value))}`,
        );
        if (!cancelled && res.data) setInput(formatHsnOptionLabel(res.data));
      } catch {
        if (!cancelled) setInput(String(value));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, preview]);

  React.useEffect(() => {
    if (preview || !open) return;
    const q = input.trim();
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setSearchErr(null);
      try {
        const res = await api.get(searchPath, { params: { q: q || '', limit: 50 } });
        if (!cancelled) {
          setResults(Array.isArray(res.data?.data) ? res.data.data : []);
        }
      } catch {
        if (!cancelled) {
          setSearchErr('Failed to load from NetSuite');
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const delay = q ? 300 : 0;
    const t = window.setTimeout(() => void load(), delay);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [input, open, preview, searchPath]);

  if (preview) {
    return (
      <div
        className={cn(
          'h-9 border border-ns-border rounded-sm px-3 flex items-center bg-white text-[12px] text-gray-400',
          className,
        )}
      >
        — HSN Code —
      </div>
    );
  }

  const dropdownPanel =
    open && !disabled && panelRect
      ? createPortal(
          <ul
            ref={panelRef}
            role="listbox"
            className="max-h-60 overflow-y-auto overflow-x-hidden rounded-sm border border-ns-border bg-white text-[12px] shadow-2xl ring-1 ring-black/5"
            style={{
              position: 'fixed',
              top: panelRect.top,
              left: panelRect.left,
              width: panelRect.width,
              zIndex: 10000,
            }}
          >
            {!input.trim() && !loading && results.length === 0 && (
              <li className="px-3 py-2.5 text-ns-text-muted text-[11px]">
                {searchErr
                  ? 'Could not load from NetSuite'
                  : 'No HSN codes returned — check NetSuite RESTlet'}
              </li>
            )}
            {!input.trim() && !loading && results.length > 0 && (
              <li className="px-3 py-2.5 text-ns-text-muted text-[11px] border-b border-ns-border/50">
                Type to filter, or pick from the list
              </li>
            )}
            {input.trim() && loading && (
              <li className="px-3 py-2.5 text-ns-text-muted text-[11px] flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-ns-blue shrink-0" />
                Searching…
              </li>
            )}
            {searchErr && (
              <li className="px-3 py-2.5 text-red-600 text-[11px]">{searchErr}</li>
            )}
            {input.trim() && !loading && !searchErr && results.length === 0 && (
              <li className="px-3 py-2.5 text-ns-text-muted text-[11px]">No matches</li>
            )}
            {results.map(row => (
              <li key={row.internalId}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2.5 hover:bg-ns-light-blue/40 border-b border-ns-border/50 last:border-0"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    onChange?.(row.internalId);
                    setInput(formatHsnOptionLabel(row));
                    setOpen(false);
                  }}
                >
                  <div className="font-medium text-ns-navy text-[11px] leading-snug whitespace-normal break-words">
                    {formatHsnOptionLabel(row)}
                  </div>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={wrapRef} className={cn('relative min-w-[220px]', className)}>
      <div className="relative flex items-center">
        <input
          type="text"
          className={cn(
            'w-full h-9 border border-ns-border rounded-sm pl-3 pr-9 text-[12px] text-ns-text bg-white',
            'focus:outline-none focus:border-ns-blue focus:ring-2 focus:ring-ns-blue/10',
            open && 'border-ns-blue ring-2 ring-ns-blue/10',
            disabled && 'bg-gray-50 text-gray-400 cursor-not-allowed',
            searchErr && 'border-red-300',
          )}
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            updatePanelPosition();
          }}
          placeholder="Search HSN…"
          disabled={disabled}
          aria-label={label}
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ns-blue">
          {loading ? (
            <Loader2 size={14} className="animate-spin" aria-hidden />
          ) : (
            <ChevronDown
              size={14}
              className={cn('transition-transform', open && 'rotate-180')}
              aria-hidden
            />
          )}
        </div>
      </div>

      {dropdownPanel}
    </div>
  );
}

function LocationAsyncSelect({
  value,
  onChange,
  disabled,
  preview,
  label,
  className,
  dataSource,
  subsidiaryFilter,
  showBadge = true,
}: {
  value?: any;
  onChange?: (value: any) => void;
  disabled?: boolean;
  preview?: boolean;
  label?: string;
  className?: string;
  dataSource?: DataSource;
  subsidiaryFilter?: string;
  showBadge?: boolean;
}) {
  const searchPath =
    dataSource?.apiConfig?.url?.replace(/^\//, '').replace(/^api\//, '') || 'locations/search';
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLUListElement>(null);
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [results, setResults] = React.useState<
    { internalId: string; name: string; subsidiary?: string }[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [searchErr, setSearchErr] = React.useState<string | null>(null);
  const [retryKey, setRetryKey] = React.useState(0);
  const [panelRect, setPanelRect] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const updatePanelPosition = React.useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPanelRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 300),
    });
  }, []);

  React.useLayoutEffect(() => {
    if (!open) return;
    updatePanelPosition();
    const onScrollOrResize = () => updatePanelPosition();
    window.addEventListener('resize', onScrollOrResize);
    window.addEventListener('scroll', onScrollOrResize, true);
    return () => {
      window.removeEventListener('resize', onScrollOrResize);
      window.removeEventListener('scroll', onScrollOrResize, true);
    };
  }, [open, updatePanelPosition]);

  React.useEffect(() => {
    const onDoc = (e: MouseEvent) => {
      const t = e.target as Node;
      if (wrapRef.current?.contains(t) || panelRef.current?.contains(t)) return;
      setOpen(false);
    };
    document.addEventListener('mousedown', onDoc);
    return () => document.removeEventListener('mousedown', onDoc);
  }, []);

  React.useEffect(() => {
    if (preview || !value) return;
    let cancelled = false;
    void (async () => {
      try {
        const res = await api.get(
          `locations/lookup/by-internal/${encodeURIComponent(String(value))}`,
        );
        if (!cancelled && res.data) setInput(formatLocationOptionLabel(res.data));
      } catch {
        if (!cancelled) setInput(String(value));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, preview]);

  React.useEffect(() => {
    if (preview || !open) return;
    const q = input.trim();
    let cancelled = false;

    const loadList = async () => {
      setLoading(true);
      setSearchErr(null);
      try {
        if (q) {
          const res = await api.get(searchPath, {
            params: {
              q,
              limit: 50,
              subsidiary: subsidiaryFilter || undefined,
            },
          });
          if (!cancelled) {
            setResults(Array.isArray(res.data?.data) ? res.data.data : []);
          }
        } else {
          const res = await api.get('locations/', {
            params: {
              limit: 50,
              page: 1,
              subsidiary: subsidiaryFilter || undefined,
            },
          });
          if (!cancelled) {
            setResults(Array.isArray(res.data?.data) ? res.data.data : []);
          }
        }
      } catch {
        if (!cancelled) {
          setSearchErr('Failed to load locations');
          setResults([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    const delay = q ? 300 : 0;
    const t = window.setTimeout(() => void loadList(), delay);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [input, open, preview, searchPath, subsidiaryFilter, retryKey]);

  if (preview) {
    return (
      <div
        className={cn(
          'h-9 border border-ns-border rounded-sm px-3 flex items-center bg-white text-[12px] text-gray-400',
          className,
        )}
      >
        — Location —
      </div>
    );
  }

  const dropdownPanel =
    open && !disabled && panelRect
      ? createPortal(
          <ul
            ref={panelRef}
            role="listbox"
            className="max-h-60 overflow-y-auto overflow-x-hidden rounded-sm border border-ns-border bg-white text-[12px] shadow-2xl ring-1 ring-black/5"
            style={{
              position: 'fixed',
              top: panelRect.top,
              left: panelRect.left,
              width: panelRect.width,
              zIndex: 10000,
            }}
          >
            {!input.trim() && !loading && results.length === 0 && (
              <li className="px-3 py-2.5 text-ns-text-muted text-[11px]">
                {searchErr
                  ? 'Could not load from NetSuite — check OAuth settings and try again'
                  : 'No locations returned from NetSuite — verify RESTlet credentials'}
              </li>
            )}
            {!input.trim() && !loading && results.length > 0 && (
              <li className="px-3 py-2.5 text-ns-text-muted text-[11px] border-b border-ns-border/50">
                Type to filter, or pick from the list below
              </li>
            )}
            {input.trim() && loading && (
              <li className="px-3 py-2.5 text-ns-text-muted text-[11px] flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-ns-blue shrink-0" />
                Searching…
              </li>
            )}
            {searchErr && (
              <li className="px-3 py-2.5 text-red-600 text-[11px] flex items-center justify-between gap-2">
                <span>{searchErr}</span>
                <button
                  type="button"
                  className="text-ns-blue font-semibold flex items-center gap-1"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setRetryKey(k => k + 1)}
                >
                  <RefreshCcw size={12} />
                  Retry
                </button>
              </li>
            )}
            {input.trim() && !loading && !searchErr && results.length === 0 && (
              <li className="px-3 py-2.5 text-ns-text-muted text-[11px]">No matches</li>
            )}
            {results.map(row => (
              <li key={row.internalId}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2.5 hover:bg-ns-light-blue/40 border-b border-ns-border/50 last:border-0"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    onChange?.(row.internalId);
                    setInput(formatLocationOptionLabel(row));
                    setOpen(false);
                  }}
                >
                  <div className="font-medium text-ns-navy text-[11px] leading-snug whitespace-normal break-words">
                    {formatLocationOptionLabel(row)}
                  </div>
                </button>
              </li>
            ))}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={wrapRef} className={cn('relative min-w-[240px]', className)}>
      {showBadge && (
        <span className="absolute -top-2 right-0 z-10 inline-flex items-center gap-0.5 rounded-sm bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-800 uppercase tracking-wide">
          <Zap size={9} className="text-amber-600" aria-hidden />
          NetSuite Powered
        </span>
      )}
      <div className="relative flex items-center">
        <input
          type="text"
          className={cn(
            'w-full h-9 border border-ns-border rounded-sm pl-3 pr-9 text-[12px] text-ns-text bg-white',
            'focus:outline-none focus:border-ns-blue focus:ring-2 focus:ring-ns-blue/10',
            open && 'border-ns-blue ring-2 ring-ns-blue/10',
            disabled && 'bg-gray-50 text-gray-400 cursor-not-allowed',
            searchErr && 'border-red-300',
          )}
          value={input}
          onChange={e => {
            setInput(e.target.value);
            setOpen(true);
          }}
          onFocus={() => {
            setOpen(true);
            updatePanelPosition();
          }}
          placeholder="Search location…"
          disabled={disabled}
          aria-label={label}
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ns-blue">
          {loading ? (
            <Loader2 size={14} className="animate-spin" aria-hidden />
          ) : (
            <ChevronDown
              size={14}
              className={cn('transition-transform', open && 'rotate-180')}
              aria-hidden
            />
          )}
        </div>
      </div>
      {dropdownPanel}
    </div>
  );
}

function normalizeApiPath(raw: string): string {
  let p = (raw || '').trim();
  if (p.startsWith('/')) p = p.slice(1);
  if (p.startsWith('api/')) p = p.slice(4);
  return p;
}

function remoteOptionsCacheKey(ds: any): string | null {
  if (!ds) return null;
  if (ds.type === 'netsuite_currency') {
    return 'netsuite_currency|currencies/|name|internalId';
  }
  if (ds.type === 'netsuite_employees') {
    return 'netsuite_employees|netsuite/employees|label|value';
  }
  if (ds.type === 'netsuite_hsn' || ds.type === 'netsuite_location') {
    return null;
  }
  if (ds.type === 'api' && ds.apiConfig?.url) {
    const path = normalizeApiPath(ds.apiConfig.url);
    const lk = ds.apiConfig.labelKey || 'name';
    const vk = ds.apiConfig.valueKey || 'id';
    return `api|${path}|${lk}|${vk}`;
  }
  return null;
}

interface FieldControlProps {
  /** The field type from NetSuite catalogue (select, text, checkbox, date, etc.) */
  fieldType: string;
  /** Current value of the field */
  value?: any;
  /** Called when value changes */
  onChange?: (value: any) => void;
  /** Placeholder text */
  placeholder?: string;
  /** Whether the field is disabled / read-only */
  disabled?: boolean;
  /** Default value for display */
  defaultValue?: string;
  /** Checkbox checked state default */
  checkBoxDefault?: string;
  /** Additional CSS classes */
  className?: string;
  /** Whether this is just a static preview (no interaction) */
  preview?: boolean;
  /** Data source config for dynamic selects */
  dataSource?: any;
  /** Field label (used for aria) */
  label?: string;
  /** NetSuite field id — used to infer location master-data when dataSource is missing */
  fieldId?: string;
  /** When false, hides API/NetSuite badges and footer hints (e.g. Preview page) */
  showIntegrationHints?: boolean;
}

/**
 * Renders the correct NetSuite-style UI control for a given field type.
 * Use this component in BuilderCanvas, PreviewPage, and FormFillPage
 * to ensure consistent, accurate control rendering across all views.
 */
export function FieldControl({
  fieldType,
  value,
  onChange,
  placeholder,
  disabled = false,
  defaultValue = '',
  checkBoxDefault = 'unchecked',
  className,
  preview = false,
  dataSource,
  label,
  fieldId,
  showIntegrationHints = true,
}: FieldControlProps) {
  const resolvedDataSource = React.useMemo(() => {
    if (dataSource?.type === 'netsuite_location') return dataSource;
    if (fieldId && isLocationFieldId(fieldId)) {
      return { ...NETSUITE_LOCATION_DATA_SOURCE, ...dataSource, type: 'netsuite_location' as const };
    }
    return dataSource;
  }, [dataSource, fieldId]);
  /** Base classes shared by all input-like controls */
  const baseInput = cn(
    'w-full h-9 border border-ns-border rounded-sm px-3 text-[12px] text-ns-text bg-white',
    'focus:outline-none focus:border-ns-blue focus:ring-2 focus:ring-ns-blue/10',
    'transition-all duration-150',
    disabled && 'bg-gray-50 text-gray-400 cursor-not-allowed',
    className
  );

  const [options, setOptions] = React.useState<{ label: string; value: any }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const fetchRemoteOptions = React.useCallback(async () => {
    if (preview) return;
    const ds = resolvedDataSource;
    const isNs = ds?.type === 'netsuite_currency';
    const isNsEmp = ds?.type === 'netsuite_employees';
    const isApi = ds?.type === 'api';
    if (!isNs && !isNsEmp && !isApi) return;
    const cfg = ds?.apiConfig;
    if (!isNs && !isNsEmp && !cfg?.url) return;

    const path = isNs ? 'currencies/' : isNsEmp ? 'netsuite/employees' : normalizeApiPath(cfg!.url);
    const labelKey = cfg?.labelKey || (isNs ? 'name' : isNsEmp ? 'label' : 'name');
    const valueKey = cfg?.valueKey || (isNs ? 'internalId' : isNsEmp ? 'value' : 'id');
    const cacheKey = remoteOptionsCacheKey(ds);
    if (cacheKey) {
      const hit = optionsCache.get(cacheKey);
      if (hit && Date.now() - hit.at < OPTIONS_CACHE_TTL_MS) {
        setOptions(hit.opts);
        setLoadError(null);
        return;
      }
    }

    setLoading(true);
    setLoadError(null);
    try {
      const response = await api.get(path);
      const data = response.data;
      if (!Array.isArray(data)) {
        throw new Error('API response is not an array');
      }
      const mapped = data.map((item: any) => ({
        label: String(item[labelKey] ?? 'Unknown'),
        value: String(item[valueKey] ?? ''),
      }));
      setOptions(mapped);
      if (cacheKey) {
        if (mapped.length > 0) {
          optionsCache.set(cacheKey, { at: Date.now(), opts: mapped });
        } else {
          optionsCache.delete(cacheKey);
        }
      }
    } catch (err) {
      console.error('Failed to fetch field options', err);
      setLoadError('Failed to load options');
      setOptions([]);
    } finally {
      setLoading(false);
    }
  }, [resolvedDataSource, preview]);

  React.useEffect(() => {
    if (preview) {
      setOptions([]);
      setLoadError(null);
      return;
    }
    const ds = resolvedDataSource;
    if (ds?.type === 'static' && Array.isArray(ds.options)) {
      setOptions(ds.options.map((o: { label: string; value: string }) => ({ label: o.label, value: o.value })));
      setLoadError(null);
      return;
    }
    if (ds?.type === 'netsuite_hsn' || ds?.type === 'netsuite_location') {
      setOptions([]);
      setLoadError(null);
      return;
    }
    if (ds?.type === 'api' || ds?.type === 'netsuite_currency' || ds?.type === 'netsuite_employees') {
      void fetchRemoteOptions();
      return;
    }
    setOptions([]);
    setLoadError(null);
  }, [resolvedDataSource, preview, fetchRemoteOptions]);

  const type = fieldType?.toLowerCase() ?? 'text';

  // ─── SELECT / DROPDOWN ────────────────────────────────────────────────────
  if (type === 'select' || type === 'recordref') {
    const ds = resolvedDataSource;
    if (ds?.type === 'netsuite_hsn') {
      return (
        <HSNAsyncSelect
          value={value}
          onChange={onChange}
          disabled={disabled}
          preview={preview}
          label={label}
          className={className}
          dataSource={ds}
        />
      );
    }
    if (ds?.type === 'netsuite_location') {
      return (
        <LocationAsyncSelect
          value={value}
          onChange={onChange}
          disabled={disabled}
          preview={preview}
          label={label}
          className={className}
          dataSource={ds}
          showBadge={showIntegrationHints}
        />
      );
    }
    const isApiLike =
      ds?.type === 'api' || ds?.type === 'netsuite_currency' || ds?.type === 'netsuite_employees';

    return (
      <div className={cn('relative', className)}>
        <div className="relative">
          <select
            className={cn(
              'w-full h-9 border border-ns-border rounded-sm pl-3 pr-8 text-[12px] text-ns-text bg-white appearance-none',
              'focus:outline-none focus:border-ns-blue focus:ring-2 focus:ring-ns-blue/10',
              'transition-all duration-150',
              (disabled || loading) && 'bg-gray-50 text-gray-400 cursor-not-allowed',
              loadError && 'border-red-300'
            )}
            value={value || ''}
            onChange={e => onChange?.(e.target.value)}
            disabled={disabled || preview || loading}
            aria-label={label}
          >
            <option value="">
              {loading ? 'Loading…' : loadError ? 'Failed to load' : '— Select —'}
            </option>
            {options.length > 0 ? (
              options.map((opt, i) => (
                <option key={`${opt.value}-${i}`} value={opt.value}>
                  {opt.label}
                </option>
              ))
            ) : (
              preview && (
                <>
                  <option value="opt1">Option 1</option>
                  <option value="opt2">Option 2</option>
                </>
              )
            )}
          </select>
          <ChevronDown
            size={14}
            className="absolute right-2.5 top-1/2 -translate-y-1/2 text-ns-blue pointer-events-none"
          />
          {isApiLike && showIntegrationHints && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-1 pointer-events-none">
              {loading && (
                <RefreshCcw size={12} className="animate-spin text-ns-blue" aria-hidden />
              )}
              {loadError && <AlertCircle size={12} className="text-red-500" aria-hidden />}
            </div>
          )}
        </div>

        {isApiLike && showIntegrationHints && loadError && (
          <div className="mt-1 flex justify-end">
            <button
              type="button"
              onClick={() => void fetchRemoteOptions()}
              className="text-[9px] text-ns-blue font-bold uppercase hover:underline"
            >
              Retry
            </button>
          </div>
        )}

        {isApiLike &&
          showIntegrationHints &&
          !loading &&
          !loadError &&
          options.length === 0 && (
            <p className="mt-1 text-[10px] text-amber-800 font-medium leading-snug">
              No options returned. Check the API path and keys, then Retry or reload.
            </p>
          )}
      </div>
    );
  }

  // ─── CHECKBOX ─────────────────────────────────────────────────────────────
  if (type === 'checkbox' || type === 'boolean') {
    const isChecked = value !== undefined ? Boolean(value) : checkBoxDefault === 'checked';
    return (
      <div
        className={cn(
          'h-9 flex items-center gap-3 bg-white border border-ns-border rounded-sm px-3',
          disabled && 'bg-gray-50',
          className
        )}
      >
        <input
          type="checkbox"
          checked={isChecked}
          onChange={e => onChange?.(e.target.checked)}
          disabled={disabled || preview}
          className="w-4 h-4 accent-ns-blue rounded-sm border-ns-border cursor-pointer"
          aria-label={label}
        />
        <span className="text-[11px] text-ns-text-muted">
          {isChecked ? 'Yes' : 'No'}
        </span>
      </div>
    );
  }

  // ─── DATE ─────────────────────────────────────────────────────────────────
  if (type === 'date') {
    return (
      <div className={cn('relative', className)}>
        <input
          type="date"
          className={cn(baseInput, 'pr-10')}
          value={value || ''}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled || preview}
          placeholder={placeholder ?? 'DD/MM/YYYY'}
          aria-label={label}
        />
        <Calendar
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-text-muted pointer-events-none"
        />
      </div>
    );
  }

  // ─── DATETIME ─────────────────────────────────────────────────────────────
  if (type === 'datetime') {
    return (
      <div className={cn('relative', className)}>
        <input
          type="datetime-local"
          className={cn(baseInput, 'pr-10')}
          value={value || ''}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled || preview}
          aria-label={label}
        />
        <Calendar
          size={14}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-text-muted pointer-events-none"
        />
      </div>
    );
  }

  // ─── CURRENCY / NUMBER ────────────────────────────────────────────────────
  if (type === 'currency' || type === 'currency2' || type === 'float' || type === 'double' || type === 'percent') {
    return (
      <div className={cn('relative', className)}>
        {(type === 'currency' || type === 'currency2') && (
          <span className="absolute left-3 top-1/2 -translate-y-1/2 text-ns-text-muted text-[12px] font-medium pointer-events-none">
            $
          </span>
        )}
        <input
          type="number"
          step={type === 'percent' ? '0.01' : '0.01'}
          className={cn(
            baseInput,
            (type === 'currency' || type === 'currency2') && 'pl-7'
          )}
          value={value ?? ''}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled || preview}
          placeholder="0.00"
          aria-label={label}
        />
        {type === 'percent' && (
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-ns-text-muted text-[12px] pointer-events-none">
            %
          </span>
        )}
      </div>
    );
  }

  // ─── TEXTAREA ─────────────────────────────────────────────────────────────
  if (type === 'textarea') {
    return (
      <textarea
        className={cn(
          'w-full border border-ns-border rounded-sm px-3 py-2 text-[12px] text-ns-text bg-white resize-none',
          'focus:outline-none focus:border-ns-blue focus:ring-2 focus:ring-ns-blue/10',
          'transition-all duration-150 min-h-[80px]',
          disabled && 'bg-gray-50 text-gray-400 cursor-not-allowed',
          className
        )}
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        disabled={disabled || preview}
        placeholder={placeholder ?? 'Enter text...'}
        aria-label={label}
      />
    );
  }

  // ─── ADDRESS (multi-line read-only box with Map link) ────────────────────
  if (type === 'address') {
    return (
      <div
        className={cn(
          'w-full border border-ns-border rounded-sm px-3 py-2 text-[12px] text-ns-text-muted bg-gray-50 min-h-[80px] relative',
          className
        )}
      >
        {value ? (
          <span className="text-ns-text">{value}</span>
        ) : (
          <span className="italic opacity-50">[Address will appear here]</span>
        )}
        <a
          href="#"
          className="absolute bottom-2 right-3 text-ns-blue text-[10px] font-bold flex items-center gap-1 hover:underline"
          onClick={e => e.preventDefault()}
        >
          <LinkIcon size={10} /> Map
        </a>
      </div>
    );
  }

  // ─── SUMMARY (calculated read-only field) ─────────────────────────────────
  if (type === 'summary') {
    return (
      <div
        className={cn(
          'w-full border border-ns-border/60 rounded-sm px-3 py-2 text-[12px] bg-gray-50 text-ns-text-muted min-h-[80px] italic',
          className
        )}
      >
        {value || '[System Calculated]'}
      </div>
    );
  }

  // ─── EMAILS ───────────────────────────────────────────────────────────────
  if (type === 'emails') {
    return (
      <input
        type="email"
        className={baseInput}
        value={value || ''}
        onChange={e => onChange?.(e.target.value)}
        disabled={disabled || preview}
        placeholder={placeholder ?? 'email@example.com'}
        aria-label={label}
      />
    );
  }

  // ─── DEFAULT: TEXT INPUT ──────────────────────────────────────────────────
  return (
    <input
      type="text"
      className={baseInput}
      value={value ?? defaultValue}
      onChange={e => onChange?.(e.target.value)}
      disabled={disabled || preview}
      placeholder={placeholder ?? ''}
      aria-label={label}
    />
  );
}

/**
 * A compact read-only "badge" preview of a field — used in the BuilderCanvas
 * to show what type of control the field will render as.
 */
export function FieldControlPreview({ fieldType, checkBoxDefault }: { fieldType: string; checkBoxDefault?: string }) {
  const type = fieldType?.toLowerCase() ?? 'text';

  if (type === 'select' || type === 'recordref') {
    return (
      <div className="h-8 border border-ns-border rounded-sm px-3 flex items-center justify-between bg-white text-[11px] text-gray-400 shadow-inner">
        <span>— Select —</span>
        <ChevronDown size={12} className="text-ns-blue shrink-0" />
      </div>
    );
  }

  if (type === 'checkbox' || type === 'boolean') {
    const checked = checkBoxDefault === 'checked';
    return (
      <div className="h-8 border border-ns-border rounded-sm px-3 flex items-center gap-2 bg-white shadow-inner">
        <div className={cn(
          'w-4 h-4 rounded-sm border-2 flex items-center justify-center flex-shrink-0',
          checked ? 'bg-ns-blue border-ns-blue' : 'bg-white border-gray-300'
        )}>
          {checked && <div className="w-2 h-2 bg-white rounded-sm" />}
        </div>
        <span className="text-[11px] text-gray-400">{checked ? 'Checked' : 'Unchecked'}</span>
      </div>
    );
  }

  if (type === 'date' || type === 'datetime') {
    return (
      <div className="h-8 border border-ns-border rounded-sm px-3 flex items-center justify-between bg-white text-[11px] text-gray-400 shadow-inner">
        <span>DD/MM/YYYY</span>
        <Calendar size={12} className="text-gray-400 shrink-0" />
      </div>
    );
  }

  if (type === 'currency' || type === 'currency2' || type === 'float' || type === 'double') {
    return (
      <div className="h-8 border border-ns-border rounded-sm px-3 flex items-center gap-1.5 bg-white text-[11px] text-gray-400 shadow-inner">
        <DollarSign size={12} className="text-gray-300" />
        <span>0.00</span>
      </div>
    );
  }

  if (type === 'percent') {
    return (
      <div className="h-8 border border-ns-border rounded-sm px-3 flex items-center justify-between bg-white text-[11px] text-gray-400 shadow-inner">
        <span>0.00</span>
        <span className="text-gray-400">%</span>
      </div>
    );
  }

  if (type === 'textarea') {
    return (
      <div className="h-12 border border-ns-border rounded-sm px-3 py-1.5 bg-white text-[11px] text-gray-400 shadow-inner leading-tight">
        <span className="opacity-60">Text area...</span>
      </div>
    );
  }

  if (type === 'address' || type === 'summary') {
    return (
      <div className="h-12 border border-ns-border/60 rounded-sm px-3 py-1.5 bg-gray-50 text-[11px] text-gray-400 italic flex items-start gap-2 leading-tight">
        <FileText size={12} className="mt-0.5 text-gray-300 shrink-0" />
        {type === 'address' ? '[Address Block]' : '[System Calculated]'}
      </div>
    );
  }

  if (type === 'emails') {
    return (
      <div className="h-8 border border-ns-border rounded-sm px-3 flex items-center bg-white text-[11px] text-gray-400 shadow-inner">
        <span>email@domain.com</span>
      </div>
    );
  }

  // Default: plain text input preview
  return (
    <div className="h-8 border border-ns-border rounded-sm px-3 flex items-center bg-white text-[11px] text-gray-400 shadow-inner">
      <span>Text Input...</span>
    </div>
  );
}
