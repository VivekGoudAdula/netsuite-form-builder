import * as React from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useStore } from '../store/useStore';
import CustomerLayout from '../components/layout/CustomerLayout';
import { Button } from '../components/ui/Base';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Complex';
import { 
  FileText, 
  ExternalLink, 
  Clock, 
  CheckCircle2, 
  AlertCircle,
  PlayCircle,
  FileSearch,
  PlusCircle,
  LayoutGrid,
  History
} from 'lucide-react';
import { cn } from '../lib/utils';
import { TransactionType } from '../types';

export default function UserTransactionHub() {
  const { type } = useParams<{ type: string }>();
  const { user, forms, submissions, fetchMyForms, fetchMySubmissions, fetchMyStats, isLoading } = useStore();
  const navigate = useNavigate();
  const [stats, setStats] = React.useState<{ total: number, approved: number, pending: number, rejected: number } | null>(null);

  const transactionType = (type === 'po' ? 'purchase_order' : 
                          type === 'so' ? 'sales_order' : 
                          type === 'ap' ? 'accounts_payable' : 
                          type === 'ar' ? 'accounts_receivable' : 'purchase_order') as TransactionType;

  const title = type?.toUpperCase() || 'Transactions';
  const fullTitle = transactionType.split('_').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');

  React.useEffect(() => {
    fetchMyForms(transactionType);
    fetchMySubmissions(transactionType);
    fetchMyStats(transactionType).then(setStats);
  }, [transactionType, fetchMyForms, fetchMySubmissions, fetchMyStats]);

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
      case 'completed':
      case 'approved':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-200">
            <CheckCircle2 size={10} /> {status === 'submitted' ? 'Completed' : 'Approved'}
          </div>
        );
      case 'pending':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
            <Clock size={10} /> Pending
          </div>
        );
      case 'rejected':
      case 'failed':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-200">
            <AlertCircle size={10} /> {status === 'rejected' ? 'Rejected' : 'Failed'}
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider border border-gray-200">
            <PlayCircle size={10} /> {status}
          </div>
        );
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-ns-navy tracking-tight">{fullTitle} Hub</h1>
            <p className="text-sm text-ns-text-muted mt-1">Manage and submit {fullTitle.toLowerCase()} transactions using authorized templates.</p>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="bg-white p-6 rounded-sm border border-ns-border shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-[0.2em]">Total Submissions</p>
              <p className="text-3xl font-bold text-ns-navy">{stats?.total || 0}</p>
            </div>
            <div className="w-12 h-12 bg-ns-blue/5 rounded-full flex items-center justify-center text-ns-blue">
              <LayoutGrid size={22} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-sm border border-ns-border shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-[0.2em]">Approved</p>
              <p className="text-3xl font-bold text-ns-navy">{stats?.approved || 0}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600">
              <CheckCircle2 size={22} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-sm border border-ns-border shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-[0.2em]">Pending</p>
              <p className="text-3xl font-bold text-ns-navy">{stats?.pending || 0}</p>
            </div>
            <div className="w-12 h-12 bg-amber-50 rounded-full flex items-center justify-center text-amber-600">
              <Clock size={22} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-sm border border-ns-border shadow-sm flex items-center justify-between">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-[0.2em]">Rejected</p>
              <p className="text-3xl font-bold text-ns-navy">{stats?.rejected || 0}</p>
            </div>
            <div className="w-12 h-12 bg-red-50 rounded-full flex items-center justify-center text-red-600">
              <AlertCircle size={22} />
            </div>
          </div>
        </div>

        {/* Form Templates Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <LayoutGrid size={18} className="text-ns-blue" />
            <h2 className="text-lg font-bold text-ns-navy uppercase tracking-wider">Available Templates</h2>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {forms.map((form: any) => (
              <div key={form.id} className="bg-white p-6 rounded-sm border border-ns-border shadow-sm hover:border-ns-blue transition-all group">
                <div className="flex justify-between items-start mb-4">
                  <div className="w-10 h-10 bg-ns-gray-bg rounded-sm flex items-center justify-center text-ns-navy group-hover:bg-ns-blue group-hover:text-white transition-all">
                    <FileText size={20} />
                  </div>
                </div>
                <h3 className="font-bold text-ns-navy mb-1">{form.name}</h3>
                <p className="text-[10px] text-ns-text-muted font-bold uppercase tracking-widest mb-4">Last Used: {form.lastUsed || 'Never'}</p>
                <Button 
                  className="w-full gap-2 font-bold text-xs" 
                  onClick={() => navigate(`/user/forms/${form.id}/new`)}
                >
                  <PlusCircle size={14} /> Fill New
                </Button>
              </div>
            ))}
            {forms.length === 0 && (
              <div className="col-span-full py-12 bg-ns-gray-bg border border-dashed border-ns-border rounded-sm flex flex-col items-center justify-center text-ns-text-muted">
                <LayoutGrid size={32} className="opacity-20 mb-2" />
                <p className="text-sm font-medium">No templates assigned for {fullTitle.toLowerCase()}</p>
              </div>
            )}
          </div>
        </section>

        {/* Submission History Section */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <History size={18} className="text-ns-blue" />
            <h2 className="text-lg font-bold text-ns-navy uppercase tracking-wider">Submission History</h2>
          </div>

          <div className="bg-white rounded-sm border border-ns-border shadow-md overflow-hidden">
            <Table>
              <THead>
                <TR>
                  <TH>Form Name</TH>
                  <TH className="text-center">Status</TH>
                  <TH className="text-center">Current Level</TH>
                  <TH>Submitted At</TH>
                  <TH>NetSuite ID</TH>
                  <TH className="text-right px-6">Actions</TH>
                </TR>
              </THead>
              <TBody>
                {submissions.map((sub) => (
                  <TR key={sub.id} className="hover:bg-ns-light-blue/5 transition-all">
                    <TD className="py-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-ns-navy text-sm">{sub.formName}</span>
                        <span className="text-[10px] text-ns-text-muted uppercase tracking-tighter">SUB-{sub.id.substring(0, 6).toUpperCase()}</span>
                      </div>
                    </TD>
                    <TD className="text-center">
                      {getStatusBadge(sub.status)}
                    </TD>
                    <TD className="text-center">
                      {sub.currentLevel ? (
                        <span className="text-[11px] font-bold text-ns-blue bg-ns-blue/5 px-2 py-0.5 rounded-sm border border-ns-blue/10">
                          Level {sub.currentLevel}
                        </span>
                      ) : (
                        <span className="text-[10px] text-ns-text-muted italic">N/A</span>
                      )}
                    </TD>
                    <TD className="text-[11px] text-ns-text-muted font-semibold">
                      {new Date(sub.submittedAt!).toLocaleString()}
                    </TD>
                    <TD className="text-[11px] font-mono text-ns-navy">
                      {sub.netsuiteId || (sub.status === 'pending' ? 'Processing...' : 'N/A')}
                    </TD>
                    <TD className="px-6 text-right">
                      <Button variant="ghost" size="sm" className="h-8 px-2 hover:bg-ns-blue/10 hover:text-ns-blue" title="View Details">
                        <FileSearch size={14} />
                      </Button>
                    </TD>
                  </TR>
                ))}
                {submissions.length === 0 && (
                  <TR>
                    <TD colSpan={6} className="py-12 text-center text-ns-text-muted">
                      No submissions found yet.
                    </TD>
                  </TR>
                )}
              </TBody>
            </Table>
          </div>
        </section>
      </div>
    </CustomerLayout>
  );
}
