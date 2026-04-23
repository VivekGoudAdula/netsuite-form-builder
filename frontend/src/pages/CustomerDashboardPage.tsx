import * as React from 'react';
import { useNavigate } from 'react-router-dom';
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
  FileSearch
} from 'lucide-react';
import { cn } from '../lib/utils';

export default function CustomerDashboardPage() {
  const { user, forms, catalogues, fetchMyForms, isLoading } = useStore();
  const navigate = useNavigate();

  React.useEffect(() => {
    fetchMyForms();
  }, [fetchMyForms]);

  const assignedForms = forms;

  const getSubmissionStatus = (form: any) => {
    return form.status?.toLowerCase() || 'not started';
  };

  const getStatusBadge = (status: string) => {
    switch (status.toLowerCase()) {
      case 'submitted':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-green-100 text-green-700 text-[10px] font-bold uppercase tracking-wider border border-green-200">
            <CheckCircle2 size={10} /> Submitted
          </div>
        );
      case 'pending':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 text-[10px] font-bold uppercase tracking-wider border border-amber-200">
            <Clock size={10} /> Pending
          </div>
        );
      case 'failed':
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-red-100 text-red-700 text-[10px] font-bold uppercase tracking-wider border border-red-200">
            <AlertCircle size={10} /> Failed
          </div>
        );
      default:
        return (
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-gray-100 text-gray-500 text-[10px] font-bold uppercase tracking-wider border border-gray-200">
            <PlayCircle size={10} /> Not Started
          </div>
        );
    }
  };

  return (
    <CustomerLayout>
      <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-3xl font-bold text-ns-navy tracking-tight">Assignment Ledger</h1>
            <div className="flex items-center gap-2 mt-1">
               <p className="text-sm text-ns-text-muted">Authorized transaction layouts pending your validation and submission.</p>
               <span className="text-[10px] bg-ns-blue/10 text-ns-blue px-2 py-0.5 rounded-full font-bold uppercase tracking-widest border border-ns-blue/20">
                  Authorized Entity: {user?.companyName || 'Corporate Participant'}
               </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-white p-6 rounded-sm border border-ns-border shadow-sm flex items-center justify-between group hover:border-ns-blue transition-colors">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-[0.2em]">Pending Forms</p>
              <p className="text-3xl font-bold text-ns-navy">{assignedForms.filter(f => getSubmissionStatus(f) !== 'submitted').length}</p>
            </div>
            <div className="w-12 h-12 bg-ns-blue/5 rounded-full flex items-center justify-center text-ns-blue group-hover:scale-110 transition-transform">
              <FileSearch size={22} />
            </div>
          </div>
          <div className="bg-white p-6 rounded-sm border border-ns-border shadow-sm flex items-center justify-between group hover:border-green-500 transition-colors">
            <div className="space-y-1">
              <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-[0.2em]">Completed Tasks</p>
              <p className="text-3xl font-bold text-ns-navy">{assignedForms.filter(f => getSubmissionStatus(f) === 'submitted').length}</p>
            </div>
            <div className="w-12 h-12 bg-green-50 rounded-full flex items-center justify-center text-green-600 group-hover:scale-110 transition-transform">
              <CheckCircle2 size={22} />
            </div>
          </div>
        </div>

        {/* Assignments Table */}
        <div className="bg-white rounded-sm border border-ns-border shadow-md overflow-hidden">
          <div className="px-6 py-4 bg-ns-gray-bg border-b border-ns-border flex justify-between items-center">
            <span className="text-[10px] font-bold text-ns-navy uppercase tracking-[0.2em]">Assigned Transaction Profiles</span>
            <div className="flex gap-4 text-[10px] font-semibold text-ns-text-muted uppercase">
              <span className="flex items-center gap-1.5"><div className="w-2 h-2 rounded-full bg-ns-blue animate-pulse"/> Direct Entry Enabled</span>
            </div>
          </div>
          <Table>
            <THead>
              <TR>
                <TH>Transaction Profile</TH>
                <TH>Classification</TH>
                <TH className="text-center">Status</TH>
                <TH className="text-center">Current Level</TH>
                <TH>Last Synchronized</TH>
                <TH className="text-right px-6">Directives</TH>
              </TR>
            </THead>
            <TBody>
              {assignedForms.map((form) => {
                const status = getSubmissionStatus(form);
                const isSubmitted = status === 'submitted';
                
                return (
                  <TR key={form.id} className="group hover:bg-ns-light-blue/5 transition-all">
                    <TD className="py-5">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-ns-gray-bg border border-ns-border rounded-sm flex items-center justify-center text-ns-navy/30 group-hover:bg-ns-blue group-hover:text-white transition-all">
                          <FileText size={18} />
                        </div>
                        <div>
                          <p className="text-sm font-bold text-ns-navy">{form.name}</p>
                          <p className="text-[10px] font-medium text-ns-text-muted uppercase tracking-tighter mt-0.5">Reference: SYS-{form.id.substring(0, 6).toUpperCase()}</p>
                        </div>
                      </div>
                    </TD>
                    <TD>
                      <span className="text-[10px] font-bold text-ns-navy/70 uppercase tracking-widest bg-ns-gray-bg px-2 py-1 rounded-xs">
                        {catalogues[form.transactionType].name}
                      </span>
                    </TD>
                    <TD className="text-center">
                      {getStatusBadge(status)}
                    </TD>
                    <TD className="text-center">
                      {form.currentLevel ? (
                        <span className="text-[11px] font-bold text-ns-blue bg-ns-blue/5 px-2 py-0.5 rounded-sm border border-ns-blue/10">
                          Level {form.currentLevel}
                        </span>
                      ) : (
                        <span className="text-[10px] text-ns-text-muted italic">N/A</span>
                      )}
                    </TD>
                    <TD className="text-[11px] text-ns-text-muted font-semibold">
                      {form.updatedAt}
                    </TD>
                    <TD className="px-6 text-right">
                      {status !== 'not started' ? (
                         <Button 
                            variant="secondary" 
                            size="sm" 
                            className="h-9 px-4 gap-2 text-[11px] opacity-60 cursor-not-allowed"
                            disabled
                          >
                            <CheckCircle2 size={14} /> Already Submitted
                          </Button>
                      ) : (
                        <Button 
                          size="sm" 
                          onClick={() => navigate(`/fill/${form.id}`)}
                          className="h-9 px-5 gap-2 text-[11px] font-bold group/btn shadow-ns-blue/10 hover:shadow-lg transition-all"
                        >
                          Fill Form <ExternalLink size={14} className="group-hover/btn:translate-x-0.5 transition-transform" />
                        </Button>
                      )}
                    </TD>
                  </TR>
                );
              })}
              {assignedForms.length === 0 && (
                <TR>
                  <TD colSpan={5} className="py-24 text-center">
                    <div className="flex flex-col items-center max-w-sm mx-auto">
                      <div className="w-16 h-16 bg-ns-gray-bg rounded-full flex items-center justify-center text-ns-text-muted/40 mb-4 border border-dashed border-ns-border">
                        <AlertCircle size={32} />
                      </div>
                      <h3 className="text-lg font-bold text-ns-navy">Zero Assignments Found</h3>
                      <p className="text-sm text-ns-text-muted mt-2">Your profile currently has no authorized transaction forms pending. Please contact your system administrator for provisioning.</p>
                    </div>
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
          
          <div className="px-6 py-4 bg-ns-gray-bg border-t border-ns-border flex justify-center">
            <p className="text-[9px] text-ns-text-muted font-bold tracking-widest uppercase">END OF AUTHORIZED LIST — SECURE TRANSMISSION ESTABLISHED</p>
          </div>
        </div>
      </div>
    </CustomerLayout>
  );
}
