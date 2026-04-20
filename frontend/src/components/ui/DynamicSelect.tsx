import * as React from 'react';
import { Select } from './Base';
import { Field } from '../../types';
import { RefreshCcw, AlertCircle } from 'lucide-react';
import { cn } from '../../lib/utils';
import api from '../../api/client';

interface DynamicSelectProps {
  field: Field;
  className?: string;
  value?: string;
  onChange?: (value: string) => void;
  disabled?: boolean;
}

export const DynamicSelect: React.FC<DynamicSelectProps> = ({ field, className, value, onChange, disabled }) => {
  const [options, setOptions] = React.useState<{ label: string; value: string }[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const fetchOptions = React.useCallback(async () => {
    if (field.dataSource?.type !== 'api' || !field.dataSource.apiConfig) {
      setOptions(field.dataSource?.options || []);
      return;
    }

    const { url, labelKey, valueKey } = field.dataSource.apiConfig;
    setLoading(true);
    setError(null);

    try {
      const response = await api.get(url);
      const data = response.data;
      
      if (Array.isArray(data)) {
        const mappedOptions = data.map((item: any) => ({
          label: item[labelKey] || 'Unknown',
          value: String(item[valueKey] || '')
        }));
        setOptions([{ label: field.defaultValue || 'Select an option...', value: '' }, ...mappedOptions]);
      } else {
        throw new Error('API response is not an array');
      }
    } catch (err: any) {
      console.error('Error fetching dynamic options:', err);
      setError('Failed to load options');
      setOptions([{ label: 'Failed to load options', value: '' }]);
    } finally {
      setLoading(false);
    }
  }, [field.dataSource, field.defaultValue]);

  React.useEffect(() => {
    fetchOptions();
  }, [fetchOptions]);

  return (
    <div className="relative group">
      <Select 
        className={cn(
          className, 
          loading && "opacity-70",
          error && "border-red-300"
        )}
        options={options}
        value={value}
        onChange={(e) => onChange?.(e.target.value)}
        disabled={disabled || loading}
      />
      
      <div className="absolute right-8 top-1/2 -translate-y-1/2 flex items-center gap-2 pointer-events-none">
        {loading && (
          <RefreshCcw size={12} className="animate-spin text-ns-blue" />
        )}
        {error && (
          <AlertCircle size={12} className="text-red-500" />
        )}
        {field.dataSource?.type === 'api' && !loading && !error && (
          <div className="bg-ns-blue text-white text-[8px] font-bold px-1.5 py-0.5 rounded-sm uppercase tracking-tighter shadow-sm">
            API
          </div>
        )}
      </div>

      {field.dataSource?.type === 'api' && (
        <div className="mt-1 flex items-center justify-between">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] text-ns-blue font-bold tracking-tight uppercase">⚡ API Powered</span>
          </div>
          {error && (
            <button 
              onClick={(e) => { e.preventDefault(); fetchOptions(); }}
              className="text-[9px] text-ns-blue font-bold uppercase hover:underline pointer-events-auto"
            >
              Retry
            </button>
          )}
        </div>
      )}
    </div>
  );
};
