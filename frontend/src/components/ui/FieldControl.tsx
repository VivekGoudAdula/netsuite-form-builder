import * as React from 'react';
import {
  ChevronDown,
  Calendar,
  DollarSign,
  Link as LinkIcon,
  FileText,
  RefreshCcw,
  AlertCircle,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../api/client';
import {
  formatClassOptionLabel,
  formatClassOptionTitle,
  formatDepartmentOptionLabel,
  formatDepartmentOptionTitle,
  formatHsnOptionLabel,
  formatLocationOptionLabel,
  formatLocationOptionTitle,
  isAccountFieldId,
  isItemLineFieldId,
  isClassFieldId,
  isDepartmentFieldId,
  isHsnFetchFieldId,
  isLocationFieldId,
  isTaxNatureFieldId,
  NETSUITE_ACCOUNT_DATA_SOURCE,
  NETSUITE_ITEM_DATA_SOURCE,
  NETSUITE_CLASS_DATA_SOURCE,
  NETSUITE_DEPARTMENT_DATA_SOURCE,
  NETSUITE_HSN_DATA_SOURCE,
  NETSUITE_LOCATION_DATA_SOURCE,
  NETSUITE_TAX_NATURE_DATA_SOURCE,
} from '../../lib/netsuiteMasterData';
import { AccountAsyncSelect } from './AccountAsyncSelect';
import { ItemAsyncSelect } from './ItemAsyncSelect';
import type { DataSource, ItemOption } from '../../types';

const OPTIONS_CACHE_TTL_MS = 5 * 60 * 1000;
const optionsCache = new Map<string, { at: number; opts: { label: string; value: string }[] }>();


function normalizeApiPath(raw: string): string {
  let p = (raw || '').trim();
  if (p.startsWith('/')) p = p.slice(1);
  if (p.startsWith('api/')) p = p.slice(4);
  return p;
}

async function fetchMasterDataListPages(
  listPath: string,
  mapRow: (row: Record<string, unknown>) => { label: string; value: string; title?: string },
  pageLimit = 200,
): Promise<{ label: string; value: string; title?: string }[]> {
  const path = normalizeApiPath(listPath);
  const url = path.endsWith('/') ? path : `${path}/`;
  const out: { label: string; value: string; title?: string }[] = [];
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

function remoteOptionsCacheKey(ds: any): string | null {
  if (!ds) return null;
  if (ds.type === 'netsuite_currency') {
    return 'netsuite_currency|currencies/|name|internalId';
  }
  if (ds.type === 'netsuite_employees') {
    return 'netsuite_employees|netsuite/employees|label|value';
  }
  if (ds.type === 'netsuite_department') {
    return 'netsuite_department|departments/|dept|internalId';
  }
  if (ds.type === 'netsuite_class_live') {
    return 'netsuite_class_live|classes/|class|internalId';
  }
  if (ds.type === 'netsuite_location') {
    return 'netsuite_location|locations/|loc|internalId';
  }
  if (ds.type === 'netsuite_hsn') {
    return 'netsuite_hsn|hsn-codes/|hsn|internalId';
  }
  if (ds.type === 'netsuite_tax_nature_live') {
    return 'netsuite_tax_nature_live|tax-nature/live|name|name';
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
  /** Fired when a NetSuite item row is chosen (line-item auto-fill). */
  onItemMasterSelect?: (item: ItemOption) => void;
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
  onItemMasterSelect,
}: FieldControlProps) {
  const resolvedDataSource = React.useMemo(() => {
    if (dataSource?.type === 'netsuite_hsn') return dataSource;
    if (fieldId && isHsnFetchFieldId(fieldId)) {
      return {
        ...NETSUITE_HSN_DATA_SOURCE,
        ...dataSource,
        type: 'netsuite_hsn' as const,
      };
    }
    if (dataSource?.type === 'netsuite_tax_nature_live') return dataSource;
    if (fieldId && isTaxNatureFieldId(fieldId)) {
      return {
        ...NETSUITE_TAX_NATURE_DATA_SOURCE,
        ...dataSource,
        type: 'netsuite_tax_nature_live' as const,
      };
    }
    if (dataSource?.type === 'netsuite_department') return dataSource;
    if (fieldId && isDepartmentFieldId(fieldId)) {
      return {
        ...NETSUITE_DEPARTMENT_DATA_SOURCE,
        ...dataSource,
        type: 'netsuite_department' as const,
      };
    }
    if (dataSource?.type === 'netsuite_class_live') return dataSource;
    if (fieldId && isClassFieldId(fieldId)) {
      return {
        ...NETSUITE_CLASS_DATA_SOURCE,
        ...dataSource,
        type: 'netsuite_class_live' as const,
      };
    }
    if (dataSource?.type === 'netsuite_account_live') return dataSource;
    if (fieldId && isAccountFieldId(fieldId)) {
      return {
        ...NETSUITE_ACCOUNT_DATA_SOURCE,
        ...dataSource,
        type: 'netsuite_account_live' as const,
      };
    }
    if (dataSource?.type === 'netsuite_item_live') return dataSource;
    if (fieldId && isItemLineFieldId(fieldId)) {
      return {
        ...NETSUITE_ITEM_DATA_SOURCE,
        ...dataSource,
        type: 'netsuite_item_live' as const,
      };
    }
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

  const [options, setOptions] = React.useState<
    { label: string; value: any; title?: string }[]
  >([]);
  const [loading, setLoading] = React.useState(false);
  const [loadError, setLoadError] = React.useState<string | null>(null);

  const fetchRemoteOptions = React.useCallback(async () => {
    if (preview) return;
    const ds = resolvedDataSource;
    if (!ds) return;

    const remoteTypes = [
      'api',
      'netsuite_currency',
      'netsuite_employees',
      'netsuite_department',
      'netsuite_class_live',
      'netsuite_location',
      'netsuite_hsn',
      'netsuite_tax_nature_live',
    ] as const;
    if (!remoteTypes.includes(ds.type as (typeof remoteTypes)[number])) return;
    if (ds.type === 'api' && !ds.apiConfig?.url) return;

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
      let mapped: { label: string; value: string; title?: string }[];

      if (ds.type === 'netsuite_department') {
        mapped = await fetchMasterDataListPages('departments/', row => {
          const r = row as { name?: string; subsidiary?: string; internalId?: string };
          return {
            label: formatDepartmentOptionLabel(r),
            title: formatDepartmentOptionTitle(r),
            value: String(row.internalId ?? ''),
          };
        });
      } else if (ds.type === 'netsuite_class_live') {
        mapped = await fetchMasterDataListPages('classes/', row => {
          const r = row as { name?: string; subsidiary?: string; internalId?: string };
          return {
            label: formatClassOptionLabel(r),
            title: formatClassOptionTitle(r),
            value: String(row.internalId ?? ''),
          };
        });
      } else if (ds.type === 'netsuite_location') {
        mapped = await fetchMasterDataListPages('locations/', row => {
          const r = row as { name?: string; subsidiary?: string; internalId?: string };
          return {
            label: formatLocationOptionLabel(r),
            title: formatLocationOptionTitle(r),
            value: String(row.internalId ?? ''),
          };
        });
      } else if (ds.type === 'netsuite_hsn') {
        mapped = await fetchMasterDataListPages('hsn-codes/', row => ({
          label: formatHsnOptionLabel(
            row as { hsncode?: string; hsndescription?: string; name?: string },
          ),
          value: String(row.internalId ?? ''),
        }));
      } else if (ds.type === 'netsuite_tax_nature_live') {
        const response = await api.get('tax-nature/live');
        if (response.data?.success === false) {
          throw new Error(response.data?.message || 'Unable to fetch tax nature data');
        }
        const rows = response.data?.data;
        if (!Array.isArray(rows)) {
          throw new Error('API response is not a list');
        }
        mapped = rows.map((item: { name?: string }) => ({
          label: String(item.name ?? 'Unknown'),
          value: String(item.name ?? ''),
        }));
      } else {
        const cfg = ds.apiConfig;
        const path =
          ds.type === 'netsuite_currency'
            ? 'currencies/'
            : ds.type === 'netsuite_employees'
              ? 'netsuite/employees'
              : normalizeApiPath(cfg!.url);
        const labelKey = cfg?.labelKey || (ds.type === 'netsuite_currency' ? 'name' : 'label');
        const valueKey =
          cfg?.valueKey ||
          (ds.type === 'netsuite_currency' ? 'internalId' : ds.type === 'netsuite_employees' ? 'value' : 'id');
        const response = await api.get(path);
        const data = response.data;
        if (!Array.isArray(data)) {
          throw new Error('API response is not an array');
        }
        mapped = data.map((item: Record<string, unknown>) => ({
          label: String(item[labelKey] ?? 'Unknown'),
          value: String(item[valueKey] ?? ''),
        }));
      }

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
    if (ds?.type === 'netsuite_account_live' || ds?.type === 'netsuite_item_live') {
      setOptions([]);
      setLoadError(null);
      return;
    }
    if (
      ds?.type === 'api' ||
      ds?.type === 'netsuite_currency' ||
      ds?.type === 'netsuite_employees' ||
      ds?.type === 'netsuite_department' ||
      ds?.type === 'netsuite_class_live' ||
      ds?.type === 'netsuite_location' ||
      ds?.type === 'netsuite_hsn' ||
      ds?.type === 'netsuite_tax_nature_live'
    ) {
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
    if (ds?.type === 'netsuite_item_live') {
      return (
        <ItemAsyncSelect
          value={value}
          onChange={onChange}
          onItemSelect={onItemMasterSelect}
          disabled={disabled}
          preview={preview}
          label={label}
          className={className}
        />
      );
    }
    if (ds?.type === 'netsuite_account_live') {
      return (
        <AccountAsyncSelect
          value={value}
          onChange={onChange}
          disabled={disabled}
          preview={preview}
          label={label}
          className={className}
        />
      );
    }
    const isApiLike =
      ds?.type === 'api' ||
      ds?.type === 'netsuite_currency' ||
      ds?.type === 'netsuite_employees' ||
      ds?.type === 'netsuite_department' ||
      ds?.type === 'netsuite_class_live' ||
      ds?.type === 'netsuite_location' ||
      ds?.type === 'netsuite_hsn' ||
      ds?.type === 'netsuite_tax_nature_live';

    return (
      <div className={cn('relative min-w-0 w-full max-w-full', className)}>
        <div className="relative min-w-0 w-full max-w-full">
          <select
            className={cn(
              'w-full max-w-full min-w-0 h-9 border border-ns-border rounded-sm pl-3 pr-8 text-[12px] text-ns-text bg-white appearance-none truncate',
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
                <option
                  key={`${opt.value}-${i}`}
                  value={opt.value}
                  title={opt.title && opt.title !== opt.label ? opt.title : undefined}
                >
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
