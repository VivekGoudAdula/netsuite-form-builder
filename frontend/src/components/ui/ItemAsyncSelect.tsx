import * as React from 'react';
import { createPortal } from 'react-dom';
import { AlertCircle, ChevronDown, Loader2, RefreshCcw } from 'lucide-react';
import { cn } from '../../lib/utils';
import {
  formatItemOptionLabel,
  formatItemOptionTitle,
} from '../../lib/netsuiteMasterData';
import { lookupItem, rowToItemOption, searchItems } from '../../services/itemService';
import type { ItemOption, ItemRow } from '../../types';

const PAGE_SIZE = 50;
const DEBOUNCE_MS = 300;

export function ItemAsyncSelect({
  value,
  onChange,
  onItemSelect,
  disabled,
  preview,
  label,
  className,
}: {
  value?: string;
  onChange?: (value: string) => void;
  onItemSelect?: (item: ItemOption) => void;
  disabled?: boolean;
  preview?: boolean;
  label?: string;
  className?: string;
}) {
  const wrapRef = React.useRef<HTMLDivElement>(null);
  const panelRef = React.useRef<HTMLUListElement>(null);
  const listEndRef = React.useRef<HTMLLIElement>(null);
  const [open, setOpen] = React.useState(false);
  const [input, setInput] = React.useState('');
  const [results, setResults] = React.useState<ItemRow[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [loadingMore, setLoadingMore] = React.useState(false);
  const [searchErr, setSearchErr] = React.useState<string | null>(null);
  const [page, setPage] = React.useState(1);
  const [total, setTotal] = React.useState(0);
  const [retryKey, setRetryKey] = React.useState(0);
  const [panelRect, setPanelRect] = React.useState<{
    top: number;
    left: number;
    width: number;
  } | null>(null);

  const hasMore = results.length < total;

  const updatePanelPosition = React.useCallback(() => {
    const el = wrapRef.current;
    if (!el) return;
    const rect = el.getBoundingClientRect();
    setPanelRect({
      top: rect.bottom + 4,
      left: rect.left,
      width: Math.max(rect.width, 360),
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
      const item = await lookupItem(String(value));
      if (!cancelled && item) {
        setInput(formatItemOptionLabel(item));
      } else if (!cancelled) {
        setInput(String(value));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [value, preview]);

  const loadPage = React.useCallback(async (q: string, pageNum: number, append: boolean) => {
    if (append) setLoadingMore(true);
    else setLoading(true);
    setSearchErr(null);
    try {
      const res = await searchItems(q, pageNum, PAGE_SIZE);
      if (res.success === false) {
        setSearchErr(res.message || 'Unable to fetch item data');
        if (!append) setResults([]);
        return;
      }
      const rows = res.data ?? [];
      setTotal(res.count ?? rows.length);
      setPage(pageNum);
      setResults(prev => (append ? [...prev, ...rows] : rows));
    } catch {
      setSearchErr('Unable to fetch item data');
      if (!append) setResults([]);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  React.useEffect(() => {
    if (preview || !open) return;
    const q = input.trim();
    let cancelled = false;
    const run = () => {
      if (cancelled) return;
      void loadPage(q, 1, false);
    };
    const delay = q ? DEBOUNCE_MS : 0;
    const t = window.setTimeout(run, delay);
    return () => {
      cancelled = true;
      window.clearTimeout(t);
    };
  }, [input, open, preview, retryKey, loadPage]);

  React.useEffect(() => {
    if (!open || !listEndRef.current || !hasMore || loading || loadingMore) return;
    const root = panelRef.current;
    if (!root) return;
    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && hasMore && !loading && !loadingMore) {
          void loadPage(input.trim(), page + 1, true);
        }
      },
      { root, threshold: 0.1 },
    );
    observer.observe(listEndRef.current);
    return () => observer.disconnect();
  }, [open, hasMore, loading, loadingMore, page, input, loadPage]);

  if (preview) {
    return (
      <div
        className={cn(
          'h-9 border border-ns-border rounded-sm px-3 flex items-center bg-white text-[12px] text-gray-400 min-w-[200px]',
          className,
        )}
      >
        — Item —
      </div>
    );
  }

  const dropdownPanel =
    open && !disabled && panelRect
      ? createPortal(
          <ul
            ref={panelRef}
            role="listbox"
            className="max-h-72 overflow-y-auto overflow-x-hidden rounded-sm border border-ns-border bg-white text-[12px] shadow-2xl ring-1 ring-black/5"
            style={{
              position: 'fixed',
              top: panelRect.top,
              left: panelRect.left,
              width: panelRect.width,
              zIndex: 10000,
            }}
          >
            {searchErr && (
              <li className="px-3 py-2.5 text-amber-800 text-[11px] flex items-center justify-between gap-2 bg-amber-50/80">
                <span className="flex items-center gap-1.5">
                  <AlertCircle size={12} className="shrink-0" aria-hidden />
                  {searchErr}
                </span>
                <button
                  type="button"
                  className="text-ns-blue font-semibold flex items-center gap-1 shrink-0"
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => setRetryKey(k => k + 1)}
                >
                  <RefreshCcw size={12} />
                  Retry
                </button>
              </li>
            )}
            {!searchErr && loading && results.length === 0 && (
              <li className="px-3 py-2.5 text-ns-text-muted text-[11px] flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-ns-blue shrink-0" />
                Loading items…
              </li>
            )}
            {!searchErr && !loading && results.length === 0 && (
              <li className="px-3 py-2.5 text-ns-text-muted text-[11px]">No items found</li>
            )}
            {results.map(row => (
              <li key={row.internalId}>
                <button
                  type="button"
                  className="w-full text-left px-3 py-2.5 hover:bg-ns-light-blue/40 border-b border-ns-border/50 last:border-0"
                  title={formatItemOptionTitle(row)}
                  onMouseDown={e => e.preventDefault()}
                  onClick={() => {
                    const opt = rowToItemOption(row);
                    onChange?.(row.internalId);
                    onItemSelect?.(opt);
                    setInput(formatItemOptionLabel(row));
                    setOpen(false);
                  }}
                >
                  <div className="font-medium text-ns-navy text-[11px] leading-snug truncate">
                    {formatItemOptionLabel(row)}
                  </div>
                  {(row.itemCategory || row.hsnCode) && (
                    <div className="text-[10px] text-ns-text-muted mt-0.5 truncate">
                      {[row.itemCategory, row.hsnCode, row.gstRate].filter(Boolean).join(' · ')}
                    </div>
                  )}
                </button>
              </li>
            ))}
            {hasMore && (
              <li ref={listEndRef} className="h-8 flex items-center justify-center">
                {loadingMore && (
                  <Loader2 size={14} className="animate-spin text-ns-blue" aria-hidden />
                )}
              </li>
            )}
          </ul>,
          document.body,
        )
      : null;

  return (
    <div ref={wrapRef} className={cn('relative min-w-0 w-full max-w-full min-w-[220px]', className)}>
      <div className="relative flex items-center min-w-0">
        <input
          type="text"
          className={cn(
            'w-full max-w-full min-w-0 h-9 border border-ns-border rounded-sm pl-3 pr-9 text-[12px] text-ns-text bg-white truncate',
            'focus:outline-none focus:border-ns-blue focus:ring-2 focus:ring-ns-blue/10',
            open && 'border-ns-blue ring-2 ring-ns-blue/10',
            disabled && 'bg-gray-50 text-gray-400 cursor-not-allowed',
            searchErr && 'border-amber-300',
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
          placeholder="Search item name or ID…"
          disabled={disabled}
          aria-label={label}
          aria-expanded={open}
          aria-autocomplete="list"
          autoComplete="off"
        />
        <div className="absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none text-ns-blue">
          {loading && !open ? (
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
