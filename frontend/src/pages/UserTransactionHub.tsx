import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import CustomerLayout from '../components/layout/CustomerLayout';
import { Button } from '../components/ui/Base';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Complex';
import {
  FileText,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileSearch,
  PlusCircle,
  LayoutGrid,
} from 'lucide-react';
import { PageHeader, KPICard, StatusBadge, Card, CardHeader } from '../components/admin';
import { cn } from '../lib/utils';
import { slugToTransactionType, TRANSACTION_REGISTRY } from '../lib/transactionRegistry';
import { TransactionType } from '../types';

export default function UserTransactionHub() {
  const { type } = useParams<{ type: string }>();
  const { forms, submissions, fetchMyForms, fetchMyAssignedForms, fetchMySubmissions, fetchMyStats } = useStore();
  const navigate = useNavigate();
  const [accessChecked, setAccessChecked] = React.useState(false);
  const [stats, setStats] = React.useState<{
    total: number;
    approved: number;
    pending: number;
    rejected: number;
    drafts?: number;
  } | null>(null);

  const transactionType = slugToTransactionType(type) as TransactionType;
  const meta = TRANSACTION_REGISTRY[transactionType];
  const fullTitle = meta.name;
  const statLabels = meta.statLabels;

  React.useEffect(() => {
    fetchMyAssignedForms().then(assignedForms => {
      const hasAccess = assignedForms.some(form => form.transactionType === transactionType);
      if (!hasAccess) {
        navigate('/customer-dashboard', { replace: true });
        return;
      }
      setAccessChecked(true);
    });
  }, [transactionType, fetchMyAssignedForms, navigate]);

  React.useEffect(() => {
    if (!accessChecked) return;
    fetchMyForms(transactionType);
    fetchMySubmissions(transactionType);
    fetchMyStats(transactionType).then(setStats);
  }, [transactionType, accessChecked, fetchMyForms, fetchMySubmissions, fetchMyStats]);

  if (!accessChecked) {
    return null;
  }

  const mapStatusVariant = (status: string) => {
    const s = status.toLowerCase();
    if (['submitted', 'synced_to_netsuite', 'completed', 'approved'].includes(s)) return 'approved' as const;
    if (s === 'pending') return 'pending' as const;
    if (['rejected', 'failed', 'netsuite_sync_failed'].includes(s)) return 'rejected' as const;
    return 'draft' as const;
  };

  const getStatusLabel = (status: string) => {
    const s = status.toLowerCase();
    if (s === 'submitted' || s === 'synced_to_netsuite') return 'Completed';
    if (s === 'pending') return 'Pending';
    if (s === 'rejected') return 'Rejected';
    if (s === 'netsuite_sync_failed') return 'Sync failed';
    if (s === 'failed') return 'Failed';
    return status;
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Transactions"
          title={fullTitle}
          subtitle={`Create and track your ${fullTitle.toLowerCase()} submissions.`}
        />

        <div className={cn('grid grid-cols-1 gap-4', statLabels?.drafts ? 'sm:grid-cols-2 lg:grid-cols-5' : 'sm:grid-cols-2 lg:grid-cols-4')}>
          <KPICard label={statLabels?.total ?? 'Total submissions'} value={stats?.total || 0} subtextVariant="neutral" icon={LayoutGrid} />
          <KPICard label={statLabels?.pending ?? 'Pending'} value={stats?.pending || 0} subtextVariant="warning" icon={Clock} />
          <KPICard label={statLabels?.approved ?? 'Approved'} value={stats?.approved || 0} subtextVariant="success" icon={CheckCircle2} />
          <KPICard label={statLabels?.rejected ?? 'Rejected'} value={stats?.rejected || 0} subtextVariant="danger" icon={AlertCircle} />
          {statLabels?.drafts && (
            <KPICard label={statLabels.drafts} value={stats?.drafts || 0} subtextVariant="info" icon={FileSearch} />
          )}
        </div>

        <section className="space-y-4">
          <CardHeader title="Forms" subtitle="Select a form to start a new submission" />
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {forms.map((form: { id: string; name: string; lastUsed?: string }) => (
              <Card key={form.id} className="group hover:border-ns-blue/30 transition-colors">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-9 h-9 bg-ns-blue-soft rounded-ns-md flex items-center justify-center text-ns-blue group-hover:bg-ns-blue group-hover:text-white transition-colors">
                    <FileText size={18} />
                  </div>
                </div>
                <h3 className="text-sm font-semibold text-ns-text mb-1">{form.name}</h3>
                <p className="text-xs text-ns-text-muted mb-4">Last used: {form.lastUsed || 'Never'}</p>
                <Button className="w-full gap-2" size="sm" onClick={() => navigate(`/user/forms/${form.id}/new`)}>
                  <PlusCircle size={14} />
                  New submission
                </Button>
              </Card>
            ))}
            {forms.length === 0 && (
              <Card className="col-span-full py-12 flex flex-col items-center justify-center text-ns-text-muted border-dashed">
                <LayoutGrid size={32} className="opacity-30 mb-2" />
                <p className="text-sm">No forms assigned for {fullTitle.toLowerCase()}</p>
              </Card>
            )}
          </div>
        </section>

        <Card padding="none">
          <div className="p-5 border-b border-ns-border">
            <CardHeader title="Submission history" subtitle="Your past submissions for this transaction type" />
          </div>
          <Table className="border-0 shadow-none rounded-none">
            <THead>
              <TR>
                <TH>Form name</TH>
                <TH className="text-center">Status</TH>
                <TH className="text-center">Current level</TH>
                <TH>Submitted at</TH>
                <TH>NetSuite ID</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {submissions.map(sub => (
                <TR key={sub.id}>
                  <TD>
                    <p className="text-sm font-semibold text-ns-text">{sub.formName}</p>
                    <p className="text-xs text-ns-text-muted">SUB-{sub.id.substring(0, 6).toUpperCase()}</p>
                  </TD>
                  <TD className="text-center">
                    <StatusBadge variant={mapStatusVariant(sub.status)} dot>
                      {getStatusLabel(sub.status)}
                    </StatusBadge>
                  </TD>
                  <TD className="text-center">
                    {sub.currentLevel ? (
                      <span className="text-xs font-semibold text-ns-blue bg-ns-blue-soft px-2 py-0.5 rounded-ns-md border border-ns-border">
                        Level {sub.currentLevel}
                      </span>
                    ) : (
                      <span className="text-xs text-ns-text-muted italic">N/A</span>
                    )}
                  </TD>
                  <TD className="text-xs text-ns-text-muted">
                    {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : '—'}
                  </TD>
                  <TD className="text-xs font-mono text-ns-text">
                    {sub.billId || sub.poId || sub.netsuiteId || (sub.status === 'pending' ? 'Processing…' : 'N/A')}
                  </TD>
                  <TD className="text-right">
                    <Button variant="ghost" size="sm" className="h-8 px-2" title="View details">
                      <FileSearch size={14} />
                    </Button>
                  </TD>
                </TR>
              ))}
              {submissions.length === 0 && (
                <TR>
                  <TD colSpan={6} className="py-12 text-center text-ns-text-muted text-sm">
                    No submissions found yet.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </Card>
      </div>
    </CustomerLayout>
  );
}
