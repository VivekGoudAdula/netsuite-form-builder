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

// Confirm Modal
export const ConfirmModal = ({ 
  isOpen, 
  onClose, 
  onConfirm, 
  title = "Confirm Action", 
  message = "Are you sure you want to proceed? This action cannot be undone.",
  confirmText = "Delete",
  type = "danger"
}: { 
  isOpen: boolean; 
  onClose: () => void; 
  onConfirm: () => void; 
  title?: string; 
  message?: string;
  confirmText?: string;
  type?: "danger" | "warning" | "info"
}) => {
  if (!isOpen) return null;
  const isDanger = type === "danger";

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      className="max-w-sm"
      footer={
        <>
          <button 
            onClick={onClose}
            className="px-4 py-2 text-xs font-bold text-ns-text-muted hover:text-ns-text transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={() => { onConfirm(); onClose(); }}
            className={cn(
              "px-6 py-2 text-xs font-extrabold uppercase tracking-widest text-white rounded-none shadow-sm",
              isDanger ? "bg-red-600 hover:bg-red-700" : "bg-ns-blue hover:opacity-90"
            )}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center py-2">
        {isDanger && (
          <div className="w-12 h-12 rounded-full bg-red-100 flex items-center justify-center text-red-600 mb-4">
            <span className="text-xl">⚠️</span>
          </div>
        )}
        <p className="text-sm text-ns-text leading-relaxed">
          {message}
        </p>
      </div>
    </Modal>
  );
};
