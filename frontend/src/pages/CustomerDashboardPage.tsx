import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import CustomerLayout from '../components/layout/CustomerLayout';
import { Button } from '../components/ui/Base';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Complex';
import {
  FileText,
  ExternalLink,
  CheckCircle2,
  AlertCircle,
  FileSearch,
} from 'lucide-react';
import { PageHeader, KPICard, StatusBadge, Card, CardHeader } from '../components/admin';
import { TransactionType } from '../types';

export default function CustomerDashboardPage() {
  const { user, myAssignedForms, catalogues, fetchMyAssignedForms, isLoading } = useStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchMyAssignedForms();
  }, [fetchMyAssignedForms]);

  const assignedForms = React.useMemo(() => (myAssignedForms || []).filter(f => !!f), [myAssignedForms]);

  const getSubmissionStatus = (form: any) => {
    if (!form) return 'not started';
    return form.status?.toLowerCase() || 'not started';
  };

  const getStatusBadge = (status: string) => {
    const s = status?.toLowerCase() || 'not started';
    switch (s) {
      case 'submitted':
        return <StatusBadge variant="approved">Submitted</StatusBadge>;
      case 'pending':
        return <StatusBadge variant="pending">Pending</StatusBadge>;
      case 'failed':
        return <StatusBadge variant="rejected">Failed</StatusBadge>;
      default:
        return <StatusBadge variant="draft">Not started</StatusBadge>;
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Overview"
          title={`Overview — ${user?.companyName || 'My company'}`}
          subtitle="Forms assigned to you that need to be completed."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <KPICard
            label="Pending forms"
            value={assignedForms.filter(f => getSubmissionStatus(f) !== 'submitted').length}
            subtext="Awaiting action"
            subtextVariant="warning"
            icon={FileSearch}
          />
          <KPICard
            label="Completed tasks"
            value={assignedForms.filter(f => getSubmissionStatus(f) === 'submitted').length}
            subtext="Submitted successfully"
            subtextVariant="success"
            icon={CheckCircle2}
          />
        </div>

        <Card padding="none">
          <div className="p-5 border-b border-ns-border">
            <CardHeader
              title="My forms"
              subtitle="Forms assigned to your account"
            />
          </div>
          <Table className="border-0 shadow-none rounded-none">
            <THead>
              <TR>
                <TH>Form</TH>
                <TH>Type</TH>
                <TH className="text-center">Status</TH>
                <TH className="text-center">Current step</TH>
                <TH>Last updated</TH>
                <TH className="text-right">Actions</TH>
              </TR>
            </THead>
            <TBody>
              {assignedForms.map(form => {
                if (!form?.id) return null;
                const status = getSubmissionStatus(form);

                return (
                  <TR key={form.id}>
                    <TD>
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 bg-ns-blue-soft border border-ns-border rounded-ns-md flex items-center justify-center text-ns-blue">
                          <FileText size={16} />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-ns-text">{form.name || 'Untitled form'}</p>
                          <p className="text-xs text-ns-text-muted">Ref: {form.id.substring(0, 6).toUpperCase()}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <span className="text-xs font-medium text-ns-text-muted">
                        {catalogues?.[form.transactionType as TransactionType]?.name || form.transactionType || 'Unknown'}
                      </span>
                    </TD>
                    <TD className="text-center">{getStatusBadge(status)}</TD>
                    <TD className="text-center">
                      {form.currentLevel ? (
                        <span className="text-xs font-semibold text-ns-blue bg-ns-blue-soft px-2 py-0.5 rounded-ns-md border border-ns-border">
                          Level {form.currentLevel}
                        </span>
                      ) : (
                        <span className="text-xs text-ns-text-muted italic">N/A</span>
                      )}
                    </TD>
                    <TD className="text-xs text-ns-text-muted">{form.updatedAt || 'N/A'}</TD>
                    <TD className="text-right">
                      {status !== 'not started' ? (
                        <Button variant="secondary" size="sm" disabled className="gap-2 opacity-60">
                          <CheckCircle2 size={14} />
                          Submitted
                        </Button>
                      ) : (
                        <Button size="sm" onClick={() => navigate(`/fill/${form.id}`)} className="gap-2">
                          Fill form
                          <ExternalLink size={14} />
                        </Button>
                      )}
                    </TD>
                  </TR>
                );
              })}
              {assignedForms.length === 0 && !isLoading && (
                <TR>
                  <TD colSpan={6} className="py-16 text-center">
                    <div className="flex flex-col items-center max-w-sm mx-auto">
                      <div className="w-14 h-14 bg-ns-page-bg rounded-full flex items-center justify-center text-ns-text-muted mb-4 border border-ns-border">
                        <AlertCircle size={28} />
                      </div>
                      <h3 className="text-sm font-semibold text-ns-text">No assignments found</h3>
                      <p className="text-sm text-ns-text-muted mt-2">
                        Your account has no assigned forms. Contact your administrator for access.
                      </p>
                    </div>
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
