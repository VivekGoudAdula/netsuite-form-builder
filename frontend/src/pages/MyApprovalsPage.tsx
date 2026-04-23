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
      <div className="space-y-8">
        <div>
          <div className="flex items-center gap-2 text-ns-blue mb-1">
            <CheckCircle2 size={16} />
            <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Approval Workflow Engine</span>
          </div>
          <h1 className="text-3xl font-bold text-ns-text">My Pending Approvals</h1>
          <p className="text-sm text-ns-text-muted mt-1">
            Review and act on submissions requiring your authorization.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-6">
          {pendingSubmissions.length === 0 && !isLoading ? (
            <div className="bg-white border border-ns-border rounded-sm p-12 flex flex-col items-center justify-center text-center space-y-4 shadow-sm">
              <div className="w-16 h-16 bg-ns-gray-bg rounded-full flex items-center justify-center text-ns-text-muted">
                <Clock size={32} />
              </div>
              <div>
                <h3 className="text-lg font-bold text-ns-navy">Queue Empty</h3>
                <p className="text-sm text-ns-text-muted max-w-xs mx-auto">
                  Excellent! You have no pending approval requests at this time.
                </p>
              </div>
            </div>
          ) : (
            pendingSubmissions.map((submission) => (
              <div key={submission.id} className="bg-white rounded-sm p-0 overflow-hidden border border-ns-border hover:shadow-lg transition-shadow">
                <div className="flex flex-col md:flex-row">
                  {/* Status Sidebar */}
                  <div className="md:w-2 bg-ns-blue" />

                  <div className="flex-1 p-6">
                    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="px-2 py-0.5 bg-ns-navy/5 text-ns-navy text-[10px] font-bold rounded-full uppercase border border-ns-navy/10">
                            Level {submission.currentLevel}
                          </span>
                          <span className="text-xs text-ns-text-muted font-medium">
                            Submitted on {new Date(submission.submittedAt || '').toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-xl font-bold text-ns-navy flex items-center gap-2">
                          {submission.formName}
                          <ChevronRight size={16} className="text-ns-text-muted" />
                        </h3>
                        <div className="flex flex-wrap gap-4 pt-2">
                          <div className="flex items-center gap-1.5 text-xs text-ns-text font-medium">
                            <User size={14} className="text-ns-blue" />
                            <span className="text-ns-text-muted">By:</span> {submission.userName}
                          </div>
                          <div className="flex items-center gap-1.5 text-xs text-ns-text font-medium">
                            <Building2 size={14} className="text-ns-blue" />
                            <span className="text-ns-text-muted">Entity:</span> {submission.companyId}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <Button
                          variant="secondary"
                          className="border-red-200 text-red-600 hover:bg-red-50 gap-2 h-11 px-6 font-bold"
                          onClick={() => handleReject(submission.id)}
                        >
                          <XCircle size={18} />
                          Reject
                        </Button>
                        <Button
                          className="bg-green-600 hover:bg-green-700 shadow-lg shadow-green-600/20 gap-2 h-11 px-8 font-bold"
                          onClick={() => handleApprove(submission.id)}
                        >
                          <CheckCircle2 size={18} />
                          Approve
                        </Button>
                      </div>
                    </div>

                    <div className="mt-6 pt-6 border-t border-ns-border flex items-center justify-between">
                      <div className="flex items-center gap-4">
                        <div className="flex -space-x-2">
                          {submission.approvals?.find(l => l.level === submission.currentLevel)?.approvers.map((a, i) => (
                            <div
                              key={a.userId}
                              className="w-8 h-8 rounded-full border-2 border-white bg-ns-gray-bg flex items-center justify-center text-[10px] font-bold text-ns-navy ring-1 ring-ns-border"
                              title={a.name}
                            >
                              {a.name.substring(0, 1)}
                            </div>
                          ))}
                        </div>
                        <span className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest">
                          Shared Approval Level
                        </span>
                      </div>
                      <button className="text-[10px] font-bold text-ns-blue uppercase tracking-widest hover:underline flex items-center gap-1">
                        <FileText size={12} />
                        View Full Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </Layout>
  );
}
