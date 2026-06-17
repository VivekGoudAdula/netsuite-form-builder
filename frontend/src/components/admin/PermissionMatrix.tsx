import * as React from 'react';
import { Check, X } from 'lucide-react';
import { Card, CardHeader } from './Card';
import { cn } from '../../lib/utils';

type Permission = {
  label: string;
  super_admin: boolean | 'own';
  client_admin: boolean | 'own';
  manager: boolean | 'own';
  user: boolean | 'own';
};

const PERMISSIONS: Permission[] = [
  { label: 'Create transactions', super_admin: true, client_admin: true, manager: true, user: true },
  { label: 'Approve transactions', super_admin: true, client_admin: true, manager: true, user: false },
  { label: 'Manage users', super_admin: true, client_admin: true, manager: false, user: false },
  { label: 'Set up approvals', super_admin: true, client_admin: true, manager: false, user: false },
  { label: 'NetSuite settings', super_admin: true, client_admin: false, manager: false, user: false },
  { label: 'View submission history', super_admin: true, client_admin: true, manager: false, user: false },
  { label: 'View own submissions', super_admin: true, client_admin: true, manager: true, user: 'own' },
  { label: 'Company management', super_admin: true, client_admin: false, manager: false, user: false },
];

const COLUMNS = [
  { key: 'super_admin' as const, label: 'Admin' },
  { key: 'client_admin' as const, label: 'Client Admin' },
  { key: 'manager' as const, label: 'Approver' },
  { key: 'user' as const, label: 'User' },
];

function Cell({ value }: { value: boolean | 'own' }) {
  if (value === 'own') {
    return (
      <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-status-approved">
        <Check size={12} /> Own records only
      </span>
    );
  }
  if (value) {
    return <Check size={14} className="text-status-approved mx-auto" />;
  }
  return <X size={14} className="text-status-rejected/60 mx-auto" />;
}

export function PermissionMatrix({ className }: { className?: string }) {
  return (
    <Card padding="none" className={cn('overflow-hidden', className)}>
      <div className="p-5 border-b border-ns-border">
        <CardHeader title="Permissions by role" subtitle="Access levels by role" />
      </div>
      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="bg-ns-page-bg border-b border-ns-border">
              <th className="text-left px-5 py-3 text-[11px] font-semibold text-ns-text-muted uppercase tracking-wider">
                Permission
              </th>
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  className="text-center px-4 py-3 text-[11px] font-semibold text-ns-text-muted uppercase tracking-wider min-w-[90px]"
                >
                  {col.label}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-ns-border/60">
            {PERMISSIONS.map(row => (
              <tr key={row.label} className="hover:bg-ns-page-bg/50 transition-colors">
                <td className="px-5 py-3 text-sm text-ns-text font-medium">{row.label}</td>
                {COLUMNS.map(col => (
                  <td key={col.key} className="px-4 py-3 text-center">
                    <Cell value={row[col.key]} />
                  </td>
                ))}
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </Card>
  );
}
