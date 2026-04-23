import * as React from 'react';
import { cn } from '../../lib/utils';
import { Info } from 'lucide-react';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost' | 'danger';
  size?: 'sm' | 'md' | 'lg' | 'icon';
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant = 'primary', size = 'md', ...props }, ref) => {
    const variants = {
      primary: 'bg-ns-blue text-white hover:bg-[#4a5d7a] border border-[#4a5d7a] shadow-sm active:shadow-inner',
      secondary: 'bg-white text-ns-text hover:bg-gray-50 border border-ns-border shadow-sm active:bg-gray-100',
      outline: 'bg-transparent text-ns-blue border border-ns-blue hover:bg-ns-blue/5',
      ghost: 'bg-transparent text-ns-text hover:bg-gray-100',
      danger: 'bg-[#d9534f] text-white hover:bg-[#c9302c] border border-[#ac2925] shadow-sm',
    };

    const sizes = {
      sm: 'px-2.5 py-1 text-[11px] h-7',
      md: 'px-3.5 py-1.5 text-xs h-8',
      lg: 'px-5 py-2 text-sm h-10',
      icon: 'p-1.5 w-8 h-8',
    };

    return (
      <button
        ref={ref}
        className={cn(
          'inline-flex items-center justify-center rounded-sm transition-all focus:outline-none focus:ring-2 focus:ring-ns-blue/30 disabled:opacity-50 disabled:pointer-events-none font-semibold uppercase tracking-wide',
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      />
    );
  }
);
Button.displayName = 'Button';

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {}

export const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, ...props }, ref) => {
    return (
      <input
        ref={ref}
        className={cn(
          'flex h-8 w-full rounded-sm border border-ns-border bg-white px-3 py-1 text-xs transition-all placeholder:text-gray-400 focus:outline-none focus:border-ns-blue focus:ring-1 focus:ring-ns-blue/20 disabled:cursor-not-allowed disabled:bg-gray-50 disabled:text-gray-500',
          className
        )}
        {...props}
      />
    );
  }
);
Input.displayName = 'Input';

export interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  options?: { label: string; value: string }[];
}

export const Select = React.forwardRef<HTMLSelectElement, SelectProps>(
  ({ className, options, children, ...props }, ref) => {
    return (
      <select
        ref={ref}
        className={cn(
          'flex h-8 w-full rounded-sm border border-ns-border bg-white px-3 py-1 text-xs transition-all focus:outline-none focus:border-ns-blue focus:ring-1 focus:ring-ns-blue/20 disabled:cursor-not-allowed disabled:bg-gray-50 appearance-none bg-[url("data:image/svg+xml;charset=UTF-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20width%3D%2212%22%20height%3D%2212%22%20viewBox%3D%220%200%2024%2024%20fill%3D%22none%22%20stroke%3D%22%23666%22%20stroke-width%3D%222%22%20stroke-linecap%3D%22round%22%20stroke-linejoin%3D%22round%22%3E%3Cpolyline%20points%3D%226%209%2012%2015%2018%209%22%3E%3C%2Fpolyline%3E%3C%2Fsvg%3E")] bg-[length:12px_12px] bg-[right_8px_center] bg-no-repeat pr-8',
          className
        )}
        {...props}
      >
        {options ? options.map((opt) => (
          <option key={opt.value} value={opt.value}>
            {opt.label}
          </option>
        )) : children}
      </select>
    );
  }
);
Select.displayName = 'Select';

export const Checkbox = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(
  ({ className, ...props }, ref) => {
    return (
      <input
        type="checkbox"
        ref={ref}
        className={cn(
          'h-3.5 w-3.5 rounded-sm border-ns-border text-ns-blue focus:ring-ns-blue transition-all cursor-pointer accent-ns-blue',
          className
        )}
        {...props}
      />
    );
  }
);
Checkbox.displayName = 'Checkbox';

export const Label = ({ children, className, mandatory, helpText }: { children: React.ReactNode; className?: string; mandatory?: boolean; helpText?: string }) => (
  <div className="flex items-center gap-1.5 mb-1.5">
    <label className={cn('text-[11px] font-bold text-ns-text-muted block uppercase tracking-wider mb-0', className)}>
      {children}
      {mandatory && <span className="text-red-500 ml-1">*</span>}
    </label>
    {helpText && (
      <div className="group relative flex items-center">
        <div className="text-gray-300 hover:text-ns-blue transition-colors cursor-help">
          <Info size={11} strokeWidth={3} />
        </div>
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-56 p-2.5 bg-[#2d3e50] text-white text-[10px] font-medium leading-relaxed rounded shadow-2xl opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-50 text-center">
          {helpText}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-[#2d3e50]" />
        </div>
      </div>
    )}
  </div>
);
