import * as React from 'react';
import { cn } from '../../lib/utils';

// Table
export const Table = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className="w-full overflow-auto border border-ns-border rounded-sm bg-white ns-panel-shadow">
    <table className={cn('w-full text-[13px] text-left border-collapse', className)}>{children}</table>
  </div>
);

export const THead = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-[#f5f5f5] border-b border-ns-border">{children}</thead>
);

export const TBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="bg-white divide-y divide-gray-100">{children}</tbody>
);

export const TR = ({ children, className, onClick, ...props }: { children: React.ReactNode; className?: string; onClick?: () => void; [key: string]: any }) => (
  <tr className={cn('hover:bg-ns-light-blue/30 transition-colors', onClick && 'cursor-pointer', className)} onClick={onClick} {...props}>
    {children}
  </tr>
);

export const TH = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <th className={cn('px-4 py-2.5 font-bold text-ns-text uppercase text-[11px] tracking-wider border-r border-ns-border last:border-r-0', className)} {...props}>{children}</th>
);

export const TD = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <td className={cn('px-4 py-2 border-r border-gray-50 last:border-r-0', className)} {...props}>{children}</td>
);

// Tabs
export const Tabs = ({ tabs, activeTab, onChange }: { tabs: { id: string; label: string }[]; activeTab: string; onChange: (id: string) => void }) => (
  <div className="flex border-b border-ns-border bg-ns-light-blue/50">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          'px-5 py-2.5 text-[11px] font-bold uppercase tracking-widest transition-all border-r border-ns-border last:border-r-0',
          activeTab === tab.id
            ? 'ns-active-tab -mb-[1px]'
            : 'ns-inactive-tab'
        )}
      >
        {tab.label}
      </button>
    ))}
  </div>
);

// Modal
export const Modal = ({ isOpen, onClose, title, children, footer, className }: { isOpen: boolean; onClose: () => void; title: string; children: React.ReactNode; footer?: React.ReactNode; className?: string }) => {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ns-navy/40 backdrop-blur-[1px]">
      <div className={cn("bg-white rounded-sm shadow-2xl w-full mx-4 overflow-hidden border border-ns-border", className || "max-w-md")}>
        <div className="px-4 py-3 border-b border-ns-border flex justify-between items-center ns-header-gradient">
          <h3 className="font-bold text-ns-text text-sm uppercase tracking-wide">{title}</h3>
          <button onClick={onClose} className="text-ns-text-muted hover:text-ns-text transition-colors">✕</button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="px-4 py-3 border-t border-ns-border bg-gray-50 flex justify-end gap-2">{footer}</div>}
      </div>
    </div>
  );
};
