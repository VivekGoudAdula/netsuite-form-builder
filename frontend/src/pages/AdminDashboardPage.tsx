import * as React from 'react';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import {
  Building2,
  FileText,
  Users,
  CheckCircle2,
  Activity,
  Clock,
  AlertTriangle,
  RefreshCw,
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';
import {
  KPICard,
  PageHeader,
  Card,
  CardHeader,
  StatusBadge,
  AlertPanel,
  submissionStatusVariant,
} from '../components/admin';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Complex';

export default function AdminDashboardPage() {
  const { user, companies, users, forms, submissions, fetchCompanies, fetchUsers, fetchForms, fetchSubmissions } = useStore();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'super_admin';
  const isClientAdmin = user?.role === 'client_admin';

  React.useEffect(() => {
    if (isSuperAdmin) {
      fetchCompanies();
      fetchUsers();
      fetchForms();
      fetchSubmissions();
    } else if (isClientAdmin) {
      fetchUsers();
      fetchForms(user?.companyId);
      fetchSubmissions();
    }
  }, [isSuperAdmin, isClientAdmin, user?.companyId, fetchCompanies, fetchUsers, fetchForms, fetchSubmissions]);

  const pendingApprovals = submissions.filter(s => s.status === 'pending').length;
  const criticalPending = submissions.filter(
    s => s.status === 'pending' && s.currentLevel && s.currentLevel > 2,
  ).length;
  const syncFailed = submissions.filter(s => s.status === 'NETSUITE_SYNC_FAILED').length;
  const recentSubmissions = submissions.slice(0, 8);
  const approvalQueue = submissions.filter(s => s.status === 'pending').slice(0, 5);

  if (isSuperAdmin) {
    return (
      <AdminLayout>
        <div className="space-y-6">
          <PageHeader
            eyebrow="Operations overview"
            title="Operations overview"
            subtitle="Track submissions, approvals, and NetSuite sync status across your organization."
            actions={
              <StatusBadge variant="synced" dot>
                Connected to NetSuite
              </StatusBadge>
            }
          />

          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            <KPICard
              label="Purchase requests awaiting approval"
              value={pendingApprovals}
              subtext={criticalPending > 0 ? `${criticalPending} overdue` : 'On track'}
              subtextVariant={criticalPending > 0 ? 'warning' : 'success'}
              onClick={() => navigate('/submissions')}
            />
            <KPICard
              label="Active forms"
              value={forms.length}
              subtext={`${new Set(forms.map(f => f.transactionType)).size} transaction types`}
              subtextVariant="success"
              icon={FileText}
              onClick={() => navigate('/forms')}
            />
            <KPICard
              label="Companies"
              value={companies.length}
              subtext={`${users.filter(u => u.isActive).length} active users`}
              subtextVariant="info"
              icon={Building2}
              onClick={() => navigate('/companies')}
            />
            <KPICard
              label="Total submissions"
              value={submissions.length}
              subtext={`${submissions.filter(s => s.status === 'SYNCED_TO_NETSUITE' || s.status === 'approved' || s.status === 'submitted').length} completed`}
              subtextVariant="info"
              icon={CheckCircle2}
              onClick={() => navigate('/submissions')}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <Card padding="none">
                <div className="p-5 border-b border-ns-border">
                  <CardHeader
                    title="Recent transactions"
                    action={
                      <button
                        onClick={() => navigate('/submissions')}
                        className="text-xs font-medium text-ns-blue hover:underline"
                      >
                        {forms.length} transaction types active
                      </button>
                    }
                  />
                </div>
                <Table className="border-0 shadow-none rounded-none">
                  <THead>
                    <TR>
                      <TH>Submission #</TH>
                      <TH>Type</TH>
                      <TH>Created by</TH>
                      <TH>Status</TH>
                      <TH>Sent to NetSuite</TH>
                    </TR>
                  </THead>
                  <TBody>
                    {recentSubmissions.length === 0 ? (
                      <TR>
                        <TD colSpan={5} className="text-center py-10 text-ns-text-muted">
                          No recent transactions
                        </TD>
                      </TR>
                    ) : (
                      recentSubmissions.map(sub => (
                        <TR key={sub.id}>
                          <TD className="font-mono text-xs text-ns-text-muted">
                            SUB-{sub.id.substring(0, 6).toUpperCase()}
                          </TD>
                          <TD className="font-medium text-ns-text">{sub.formName || '—'}</TD>
                          <TD className="text-ns-text-muted">{sub.userName || '—'}</TD>
                          <TD>
                            <StatusBadge variant={submissionStatusVariant(sub.status)}>
                              {sub.status === 'SYNCED_TO_NETSUITE'
                                ? 'Approved'
                                : sub.status === 'pending'
                                  ? 'Pending approval'
                                  : sub.status === 'rejected'
                                    ? 'Rejected'
                                    : sub.status === 'draft'
                                      ? 'Draft'
                                      : sub.status}
                            </StatusBadge>
                          </TD>
                          <TD>
                            {sub.status === 'SYNCED_TO_NETSUITE' || sub.netsuiteId ? (
                              <StatusBadge variant="synced">Synced</StatusBadge>
                            ) : sub.status === 'NETSUITE_SYNC_FAILED' ? (
                              <StatusBadge variant="pending">Pending sync</StatusBadge>
                            ) : (
                              <span className="text-xs text-ns-text-muted">—</span>
                            )}
                          </TD>
                        </TR>
                      ))
                    )}
                  </TBody>
                </Table>
              </Card>
            </div>

            <div className="space-y-6">
              <Card>
                <CardHeader
                  title="Approval queue"
                  badge={
                    approvalQueue.length > 0 ? (
                      <StatusBadge variant="pending">{approvalQueue.length} pending</StatusBadge>
                    ) : undefined
                  }
                />
                <div className="space-y-3">
                  {approvalQueue.length === 0 ? (
                    <p className="text-sm text-ns-text-muted py-4 text-center">No pending approvals</p>
                  ) : (
                    approvalQueue.map(sub => (
                      <div
                        key={sub.id}
                        className="flex items-center justify-between py-2 border-b border-ns-border/60 last:border-0"
                      >
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-ns-text truncate">{sub.formName}</p>
                          <p className="text-xs text-ns-text-muted">Level {sub.currentLevel || 1}</p>
                        </div>
                        <StatusBadge variant="pending">Pending</StatusBadge>
                      </div>
                    ))
                  )}
                </div>
              </Card>

              <Card>
                <CardHeader
                  title="NetSuite sync status"
                  action={<RefreshCw size={14} className="text-ns-text-muted" />}
                />
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ns-text-muted">Synced today</span>
                    <span className="font-semibold text-status-approved">
                      {submissions.filter(s => s.status === 'SYNCED_TO_NETSUITE' || s.status === 'approved').length}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ns-text-muted">Queue pending</span>
                    <span className="font-semibold text-status-pending">{syncFailed + pendingApprovals}</span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-ns-text-muted">Connection status</span>
                    <StatusBadge variant="synced" dot>
                      Connected
                    </StatusBadge>
                  </div>
                </div>
              </Card>
            </div>
          </div>

          <Card>
            <CardHeader
              title="Alerts"
              badge={<StatusBadge variant="pending">5 active</StatusBadge>}
            />
            <div className="space-y-3">
              {criticalPending > 0 && (
                <AlertPanel
                  severity="critical"
                  icon={AlertTriangle}
                  title={`${criticalPending} critical approvals — overdue`}
                  description={approvalQueue
                    .slice(0, 2)
                    .map(s => `SUB-${s.id.substring(0, 6).toUpperCase()}`)
                    .join(', ')}
                />
              )}
              {syncFailed > 0 && (
                <AlertPanel
                  severity="warning"
                  icon={RefreshCw}
                  title={`${syncFailed} NetSuite sync failures`}
                  description="Review failed submissions and retry sync."
                />
              )}
              {pendingApprovals > 0 && (
                <AlertPanel
                  severity="warning"
                  title={`${pendingApprovals} requests past due date`}
                  description="Submissions awaiting approver action across all companies."
                />
              )}
              <AlertPanel
                severity="info"
                icon={Activity}
                title="Items waiting to sync"
                description={`${pendingApprovals + syncFailed} items in the sync queue`}
              />
            </div>
          </Card>
        </div>
      </AdminLayout>
    );
  }


  return (
    <AdminLayout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Company overview"
          title={`${user?.companyName || 'Company'} overview`}
          subtitle="Manage forms, users, and approvals for your organization."
        />

        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
          <KPICard
            label="Active forms"
            value={forms.length}
            subtext="Assigned to users"
            subtextVariant="info"
            icon={FileText}
            onClick={() => navigate('/assign-forms')}
          />
          <KPICard
            label="Team members"
            value={users.filter(u => u.companyId === user?.companyId).length}
            subtext="Registered users"
            subtextVariant="neutral"
            icon={Users}
            onClick={() => navigate('/employees')}
          />
          <KPICard
            label="Total submissions"
            value={submissions.length}
            subtext={`${pendingApprovals} pending approval`}
            subtextVariant={pendingApprovals > 0 ? 'warning' : 'success'}
            icon={CheckCircle2}
            onClick={() => navigate('/submissions')}
          />
          <KPICard
            label="Approval queue"
            value={pendingApprovals}
            subtext={pendingApprovals > 0 ? 'Requires attention' : 'All clear'}
            subtextVariant={pendingApprovals > 0 ? 'warning' : 'success'}
            icon={Clock}
            onClick={() => navigate('/approvals')}
          />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2">
            <Card padding="none">
              <div className="p-5 border-b border-ns-border">
                <CardHeader
                  title="Active form assignments"
                  subtitle="Forms available to your team"
                  action={
                    <button
                      onClick={() => navigate('/assign-forms')}
                      className="text-xs font-medium text-ns-blue hover:underline"
                    >
                      View all
                    </button>
                  }
                />
              </div>
              <div className="divide-y divide-ns-border/60">
                {forms.slice(0, 5).map(form => (
                  <div
                    key={form.id}
                    className="p-4 flex items-center justify-between hover:bg-ns-blue-soft/40 transition-colors"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-ns-blue-soft border border-ns-border rounded-ns-md flex items-center justify-center text-ns-blue font-bold text-[10px]">
                        {form.transactionType.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-semibold text-ns-text">{form.name}</p>
                        <p className="text-xs text-ns-text-muted">
                          {form.transactionType.replace(/_/g, ' ')} · {form.assignedTo?.length || 0} users assigned
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
                {forms.length === 0 && (
                  <div className="p-12 text-center text-ns-text-muted flex flex-col items-center">
                    <Activity size={32} className="opacity-30 mb-3" />
                    <p className="text-xs font-medium">No active forms configured</p>
                  </div>
                )}
              </div>
            </Card>
          </div>

          <Card>
            <CardHeader title="Recent activity" subtitle="Latest submissions from your team" />
            <div className="space-y-4">
              {submissions.slice(0, 6).map((sub, idx) => (
                <div key={idx} className="flex gap-3">
                  <div
                    className={cn(
                      'w-2 h-2 rounded-full mt-1.5 flex-shrink-0',
                      sub.status === 'approved' ? 'bg-status-approved' : sub.status === 'rejected' ? 'bg-status-rejected' : 'bg-ns-blue',
                    )}
                  />
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-ns-text truncate">{sub.formName}</p>
                    <p className="text-[11px] text-ns-text-muted mt-0.5">
                      {sub.userName} · <StatusBadge variant={submissionStatusVariant(sub.status)}>{sub.status}</StatusBadge>
                    </p>
                  </div>
                </div>
              ))}
              {submissions.length === 0 && (
                <p className="text-xs text-ns-text-muted text-center py-6">No recent submissions</p>
              )}
            </div>
          </Card>
        </div>
      </div>
    </AdminLayout>
  );
}
