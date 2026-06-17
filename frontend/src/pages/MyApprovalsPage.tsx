import * as React from 'react';
import { useStore } from '../store/useStore';
import { useNavigate } from 'react-router-dom';
import AdminLayout from '../components/layout/AdminLayout';
import CustomerLayout from '../components/layout/CustomerLayout';
import { Button } from '../components/ui/Base';
import {
  CheckCircle2,
  XCircle,
  Clock,
  User,
  FileText,
  Building2,
  ChevronRight,
  AlertCircle
} from 'lucide-react';
import { Submission } from '../types';
import { PageHeader, Card, StatusBadge } from '../components/admin';

export default function MyApprovalsPage() {
  const { user, fetchPendingApprovals, approveSubmission, rejectSubmission, isLoading } = useStore();
  const navigate = useNavigate();
  const [pendingSubmissions, setPendingSubmissions] = React.useState<Submission[]>([]);

  const loadApprovals = React.useCallback(async () => {
    const data = await fetchPendingApprovals();
    setPendingSubmissions(data);
  }, [fetchPendingApprovals]);

  React.useEffect(() => {
    // Allow Super Admin to view the page if they navigate here
    loadApprovals();
  }, [loadApprovals, user, navigate]);

  const handleApprove = async (id: string) => {
    try {
      await approveSubmission(id);
      alert('Approved successfully');
      loadApprovals();
    } catch (err: any) {
      alert(err.message || 'Approval failed');
    }
  };

  const handleReject = async (id: string) => {
    try {
      await rejectSubmission(id);
      alert('Rejected successfully');
      loadApprovals();
    } catch (err: any) {
      alert(err.message || 'Rejection failed');
    }
  };

  const Layout = (user?.role === 'super_admin' || user?.role === 'client_admin') ? AdminLayout : CustomerLayout;

  return (
    <Layout>
      <div className="space-y-6">
        <PageHeader
          eyebrow="Approval center"
          title="My pending approvals"
          subtitle="Review and approve or reject pending submissions."
        />

        <div className="grid grid-cols-1 gap-4">
          {pendingSubmissions.length === 0 && !isLoading ? (
            <Card className="py-12 flex flex-col items-center justify-center text-center">
              <div className="w-14 h-14 bg-ns-page-bg rounded-full flex items-center justify-center text-ns-text-muted mb-4 border border-ns-border">
                <Clock size={28} />
              </div>
              <h3 className="text-sm font-semibold text-ns-text">No pending approvals</h3>
              <p className="text-sm text-ns-text-muted max-w-xs mx-auto mt-2">
                You have no pending approval requests at this time.
              </p>
            </Card>
          ) : (
            pendingSubmissions.map(submission => (
              <Card key={submission.id} padding="none" className="overflow-hidden">
                <div className="flex flex-col md:flex-row">
                  <div className="md:w-1 bg-ns-blue" />
                  <div className="flex-1 p-5">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-2">
                        <div className="flex items-center gap-2 flex-wrap">
                          <StatusBadge variant="pending">Level {submission.currentLevel}</StatusBadge>
                          <span className="text-xs text-ns-text-muted">
                            Submitted {new Date(submission.submittedAt || '').toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-base font-semibold text-ns-text flex items-center gap-2">
                          {submission.formName}
                          <ChevronRight size={16} className="text-ns-text-muted" />
                        </h3>
                        <div className="flex flex-wrap gap-4">
                          <div className="flex items-center gap-1.5 text-xs text-ns-text-muted">
                            <User size={14} className="text-ns-blue" />
                            <span>{submission.userName}</span>
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-ns-text-muted">
                            <Building2 size={14} className="text-ns-blue" />
                            <span>{submission.companyId}</span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="secondary"
                          className="border-status-rejected/25 text-status-rejected hover:bg-status-rejected-bg gap-2"
                          onClick={() => handleReject(submission.id)}
                        >
                          <XCircle size={16} />
                          Reject
                        </Button>
                        <Button className="gap-2" onClick={() => handleApprove(submission.id)}>
                          <CheckCircle2 size={16} />
                          Approve
                        </Button>
                      </div>
                    </div>

                    <div className="mt-5 pt-5 border-t border-ns-border flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex -space-x-2">
                          {submission.approvals?.find(l => l.level === submission.currentLevel)?.approvers.map(a => (
                            <div
                              key={a.userId}
                              className="w-8 h-8 rounded-full border-2 border-white bg-ns-blue-soft flex items-center justify-center text-[10px] font-semibold text-ns-blue"
                              title={a.name}
                            >
                              {a.name.substring(0, 1)}
                            </div>
                          ))}
                        </div>
                        <span className="text-xs text-ns-text-muted">Other approvers at this step</span>
                      </div>
                      <button className="text-xs font-medium text-ns-blue hover:underline flex items-center gap-1">
                        <FileText size={12} />
                        View details
                      </button>
                    </div>
                  </div>
                </div>
              </Card>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
