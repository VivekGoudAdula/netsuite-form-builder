import * as React from 'react';
import { ChevronDown, Calendar, DollarSign, Link as LinkIcon, FileText } from 'lucide-react';
import { cn } from '../../lib/utils';

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
}: FieldControlProps) {
  /** Base classes shared by all input-like controls */
  const baseInput = cn(
    'w-full h-9 border border-ns-border rounded-sm px-3 text-[12px] text-ns-text bg-white',
    'focus:outline-none focus:border-ns-blue focus:ring-2 focus:ring-ns-blue/10',
    'transition-all duration-150',
    disabled && 'bg-gray-50 text-gray-400 cursor-not-allowed',
    className
  );

  const [options, setOptions] = React.useState<{label: string, value: any}[]>([]);
  const [loading, setLoading] = React.useState(false);

  React.useEffect(() => {
    if (dataSource?.type === 'api' && dataSource.apiConfig) {
      const fetchOptions = async () => {
        setLoading(true);
        try {
          const baseUrl = 'http://localhost:8000'; // Target the backend
          let url = dataSource.apiConfig.url;
          
          // Fix legacy or incorrect mock URLs that lack the /api prefix
          if (url.startsWith('/mock/')) {
            url = `/api${url}`;
          }
          
          const response = await fetch(`${baseUrl}${url}`);
          const data = await response.json();
          
          if (Array.isArray(data)) {
            const mappedOptions = data.map((item: any) => ({
              label: item[dataSource.apiConfig.labelKey || 'name'],
              value: item[dataSource.apiConfig.valueKey || 'id']
            }));
            setOptions(mappedOptions);
          }
        } catch (error) {
          console.error('Failed to fetch field options', error);
        } finally {
          setLoading(false);
        }
      };
      fetchOptions();
    }
  }, [dataSource]);

  const type = fieldType?.toLowerCase() ?? 'text';

  // ─── SELECT / DROPDOWN ────────────────────────────────────────────────────
  if (type === 'select' || type === 'recordref') {
    return (
      <div className={cn('relative', className)}>
        <select
          className={cn(
            'w-full h-9 border border-ns-border rounded-sm pl-3 pr-8 text-[12px] text-ns-text bg-white appearance-none',
            'focus:outline-none focus:border-ns-blue focus:ring-2 focus:ring-ns-blue/10',
            'transition-all duration-150',
            (disabled || loading) && 'bg-gray-50 text-gray-400 cursor-not-allowed'
          )}
          value={value || ''}
          onChange={e => onChange?.(e.target.value)}
          disabled={disabled || preview || loading}
          aria-label={label}
        >
          <option value="">{loading ? 'Loading...' : '— Select —'}</option>
          {options.length > 0 ? (
            options.map((opt, i) => (
              <option key={i} value={opt.value}>{opt.label}</option>
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
