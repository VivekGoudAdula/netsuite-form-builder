import * as React from 'react';
import { cn } from '../../lib/utils';

// Table
export const Table = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <div className="w-full overflow-auto border border-ns-border rounded-ns-card bg-white ns-panel-shadow">
    <table className={cn('w-full text-sm text-left border-collapse', className)}>{children}</table>
  </div>
);

export const THead = ({ children }: { children: React.ReactNode }) => (
  <thead className="bg-ns-page-bg border-b border-ns-border">{children}</thead>
);

export const TBody = ({ children }: { children: React.ReactNode }) => (
  <tbody className="bg-white divide-y divide-ns-border/60">{children}</tbody>
);

export const TR = ({ children, className, onClick, ...props }: { children: React.ReactNode; className?: string; onClick?: () => void; [key: string]: any }) => (
  <tr className={cn('hover:bg-ns-blue-soft/40 transition-colors', onClick && 'cursor-pointer', className)} onClick={onClick} {...props}>
    {children}
  </tr>
);

export const TH = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <th className={cn('px-4 py-2.5 font-semibold text-ns-text-muted uppercase text-[11px] tracking-wide', className)} {...props}>{children}</th>
);

export const TD = ({ children, className, ...props }: { children: React.ReactNode; className?: string; [key: string]: any }) => (
  <td className={cn('px-4 py-2.5 text-sm text-ns-text', className)} {...props}>{children}</td>
);

// Tabs
export const Tabs = ({ tabs, activeTab, onChange }: { tabs: { id: string; label: string }[]; activeTab: string; onChange: (id: string) => void }) => (
  <div className="flex border-b border-ns-border bg-white">
    {tabs.map((tab) => (
      <button
        key={tab.id}
        onClick={() => onChange(tab.id)}
        className={cn(
          'px-5 py-2.5 text-sm transition-all',
          activeTab === tab.id ? 'ns-active-tab' : 'ns-inactive-tab'
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
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-ns-navy/40 backdrop-blur-sm">
      <div className={cn("bg-white rounded-ns-card shadow-2xl w-full mx-4 overflow-hidden border border-ns-border", className || "max-w-md")}>
        <div className="px-5 py-4 border-b border-ns-border flex justify-between items-center">
          <h3 className="font-semibold text-ns-text text-sm">{title}</h3>
          <button onClick={onClose} className="text-ns-text-muted hover:text-ns-text transition-colors text-lg leading-none">×</button>
        </div>
        <div className="p-6">{children}</div>
        {footer && <div className="px-5 py-4 border-t border-ns-border bg-ns-page-bg flex justify-end gap-2">{footer}</div>}
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
              isDanger ? "bg-status-rejected hover:opacity-90" : "bg-ns-blue hover:bg-ns-blue-dark"
            )}
          >
            {confirmText}
          </button>
        </>
      }
    >
      <div className="flex flex-col items-center text-center py-2">
        {isDanger && (
          <div className="w-12 h-12 rounded-full bg-status-rejected-bg flex items-center justify-center text-status-rejected mb-4">
            <span className="text-xl">⚠</span>
          </div>
        )}
        <p className="text-sm text-ns-text leading-relaxed">
          {message}
        </p>
      </div>
    </Modal>
  );
};
