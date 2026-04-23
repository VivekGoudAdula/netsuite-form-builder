import * as React from 'react';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import { Table, THead, TBody, TR, TH, TD, Modal } from '../components/ui/Complex';
import { Database, Search, FileJson, Calendar, Building2, User, FileText, CheckCircle2, XCircle, Clock } from 'lucide-react';
import { Button, Input, Select, Label } from '../components/ui/Base';
import { cn } from '../lib/utils';

export default function AdminSubmissionsPage() {
  const { user, submissions, forms, companies, users, fetchSubmissions, fetchCompanies, fetchUsers, retrySubmission, isLoading } = useStore();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [selectedSubmissionId, setSelectedSubmissionId] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchSubmissions();
    fetchCompanies();
    fetchUsers();
  }, [fetchSubmissions, fetchCompanies, fetchUsers]);

  const getFormName = (sub: any) => sub.formName || 'Deleted Form';
  const getCompanyName = (sub: any) => sub.companyName || 'Unknown Entity';
  const getUserName = (sub: any) => sub.userName || 'Unknown User';

  const filteredSubmissions = submissions.filter(s => {
    const formName = getFormName(s);
    const companyName = getCompanyName(s);
    const userName = getUserName(s);
    
    return formName.toLowerCase().includes(searchTerm.toLowerCase()) || 
           companyName.toLowerCase().includes(searchTerm.toLowerCase()) ||
           userName.toLowerCase().includes(searchTerm.toLowerCase());
  });

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-ns-blue mb-1">
              <Database size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Transaction Audit log</span>
            </div>
            <h1 className="text-3xl font-bold text-ns-text">Incoming Data Entries</h1>
            <p className="text-sm text-ns-text-muted mt-1">
              {user?.role === 'super_admin' 
                ? 'Review finalized submissions from customer environments across all entities.' 
                : 'Review finalized submissions from customer environments within your organizational scope.'}
            </p>
          </div>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-sm border border-ns-border ns-panel-shadow">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <Input 
              placeholder="Search by form, company, or employee..." 
              className="pl-9 h-11"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <Table>
          <THead>
            <TR>
              <TH>Submission Protocol</TH>
               <TH>Source Entity</TH>
               <TH>Submitted By</TH>
               <TH>Workflow Status</TH>
               <TH>Approval Level</TH>
               <TH>Timestamp</TH>
               <TH className="text-right px-6">Administrative Actions</TH>
            </TR>
          </THead>
          <TBody>
            {filteredSubmissions.map((sub) => (
              <TR key={sub.id} className="group hover:bg-ns-light-blue/5 transition-all">
                <TD className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-ns-gray-bg border border-ns-border rounded-sm flex items-center justify-center text-ns-blue shadow-inner group-hover:bg-ns-navy group-hover:text-white transition-all">
                      <FileJson size={18} />
                    </div>
                    <div>
                      <p className="text-sm font-bold text-ns-navy">{getFormName(sub)}</p>
                      <p className="text-[10px] text-ns-text-muted font-mono tracking-tighter uppercase mt-0.5">SUB-{sub.id.substring(0, 8).toUpperCase()}</p>
                    </div>
                  </div>
                </TD>
                 <TD>
                   <div className="flex items-center gap-2 text-xs font-bold text-ns-navy/70">
                     <Building2 size={12} className="opacity-40" />
                     {getCompanyName(sub)}
                   </div>
                 </TD>
                 <TD>
                    <div className="flex items-center gap-2 text-xs font-semibold text-ns-text-muted">
                     <User size={12} className="opacity-40" />
                     {getUserName(sub)}
                   </div>
                 </TD>
                 <TD>
                    <div className="flex flex-col gap-1">
                      <span className={cn(
                        "text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider inline-block w-fit",
                        sub.status === 'submitted' || sub.status === 'approved' ? "bg-green-100 text-green-700" : 
                        sub.status === 'rejected' ? "bg-red-100 text-red-700" :
                        sub.status === 'pending' ? "bg-amber-100 text-amber-700" :
                        "bg-gray-100 text-gray-700"
                      )}>
                        {sub.status === 'submitted' ? 'Synchronized' : sub.status}
                      </span>
                      {sub.netsuiteId && (
                        <span className="text-[9px] font-mono text-ns-text-muted">NS ID: {sub.netsuiteId}</span>
                      )}
                      {sub.errorMessage && (
                        <span className="text-[9px] text-red-500 italic truncate max-w-[150px]">{sub.errorMessage}</span>
                      )}
                    </div>
                 </TD>
                 <TD>
                    {sub.status === 'pending' ? (
                       <div className="flex items-center gap-2">
                          <span className="text-xs font-bold text-ns-navy bg-ns-navy/5 px-2 py-0.5 rounded-sm">L{sub.currentLevel}</span>
                          <div className="flex -space-x-1.5">
                             {sub.approvals?.find((l: any) => l.level === sub.currentLevel)?.approvers.map((a: any) => (
                                <div 
                                   key={a.userId} 
                                   className="w-5 h-5 rounded-full border border-white bg-ns-blue text-white flex items-center justify-center text-[8px] font-bold shadow-sm"
                                   title={a.name}
                                >
                                   {a.name[0]}
                                </div>
                             ))}
                          </div>
                       </div>
                    ) : (
                       <span className="text-[10px] font-bold text-ns-text-muted uppercase opacity-40">Workflow Terminal</span>
                    )}
                 </TD>
                 <TD>
                   <div className="flex items-center gap-2 text-[11px] font-mono font-bold text-ns-text-muted opacity-80">
                     <Calendar size={12} />
                     {sub.submittedAt ? new Date(sub.submittedAt).toLocaleString() : 'N/A'}
                   </div>
                 </TD>
                 <TD className="px-6 text-right">
                    <div className="flex justify-end gap-2">
                      {sub.status === 'failed' && (
                        <Button 
                          onClick={() => retrySubmission(sub.id)}
                          size="sm" 
                          className="h-8 px-3 gap-1 text-[10px] font-bold uppercase tracking-widest bg-amber-500 hover:bg-amber-600 border-none"
                        >
                          Retry Sync <Database size={12} />
                        </Button>
                      )}
                      <Button variant="ghost" size="sm" onClick={() => setSelectedSubmissionId(sub.id)} className="h-8 px-3 gap-2 text-[10px] font-bold uppercase tracking-widest text-ns-blue hover:bg-ns-blue hover:text-white transition-all">
                        View Details <FileText size={12} />
                      </Button>
                    </div>
                 </TD>
              </TR>
            ))}
            {filteredSubmissions.length === 0 && (
              <TR>
                 <TD colSpan={6} className="py-24 text-center">
                    <div className="opacity-40 flex flex-col items-center">
                       <Database size={48} className="text-ns-navy mb-4" />
                       <h3 className="text-lg font-bold uppercase tracking-[0.2em]">Zero Submissions Detected</h3>
                       <p className="text-xs mt-2">Check the filters or ensure customers have finalized their forms.</p>
                    </div>
                 </TD>
              </TR>
            )}
          </TBody>
        </Table>

        {/* Detail Modal */}
        <Modal
          isOpen={!!selectedSubmissionId}
          onClose={() => setSelectedSubmissionId(null)}
          title="Submission Workflow Details"
          className="max-w-xl"
          footer={
             <Button variant="secondary" size="sm" onClick={() => setSelectedSubmissionId(null)}>Close</Button>
          }
        >
          {(() => {
            const activeSub = submissions.find(s => s.id === selectedSubmissionId);
            if (!activeSub) return null;
            
            return (
              <div className="space-y-6">
                <div className="bg-ns-gray-bg p-4 rounded-sm border border-ns-border flex justify-between items-center">
                  <div>
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ns-text-muted">Target Blueprint</p>
                    <p className="font-bold text-ns-navy">{activeSub.formName || 'Unknown'}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] font-bold uppercase tracking-widest text-ns-text-muted">Status</p>
                    <p className="font-bold text-ns-blue uppercase text-sm tracking-wide">{activeSub.status}</p>
                  </div>
                </div>

                <div>
                  <h4 className="text-sm font-bold text-ns-navy mb-4 border-b border-ns-border pb-2">Approval Hierarchy</h4>
                  <div className="space-y-4">
                    {activeSub.approvals?.map((level: any) => (
                      <div key={level.level} className="flex gap-4">
                        <div className="flex flex-col items-center">
                           <div className={cn(
                              "w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs shadow-sm ring-4 ring-white",
                              level.level < (activeSub.currentLevel || 99) || activeSub.status === 'approved' || activeSub.status === 'submitted'
                                 ? "bg-green-100 text-green-700" 
                                 : level.level === activeSub.currentLevel && activeSub.status === 'pending'
                                    ? "bg-ns-blue text-white"
                                    : level.level === activeSub.currentLevel && activeSub.status === 'rejected'
                                       ? "bg-red-100 text-red-700"
                                       : "bg-gray-100 text-gray-400"
                           )}>
                              {level.level < (activeSub.currentLevel || 99) || activeSub.status === 'approved' || activeSub.status === 'submitted' ? <CheckCircle2 size={16} /> : 
                               level.level === activeSub.currentLevel && activeSub.status === 'rejected' ? <XCircle size={16} /> :
                               level.level}
                           </div>
                           {level.level !== activeSub.approvals?.length && (
                              <div className={cn("w-[2px] h-full my-1 rounded-full", level.level < (activeSub.currentLevel || 99) ? "bg-green-200" : "bg-gray-100")} />
                           )}
                        </div>
                        <div className="flex-1 pb-4">
                           <p className="text-xs font-bold text-ns-navy mb-2">Level {level.level} Approvers</p>
                           <div className="space-y-2">
                             {level.approvers.map((approver: any) => (
                                <div key={approver.userId} className="bg-white border border-ns-border rounded-sm p-3 flex justify-between items-center shadow-sm">
                                   <div className="flex items-center gap-2">
                                      <div className="w-6 h-6 rounded-full bg-ns-gray-bg flex items-center justify-center text-[10px] font-bold text-ns-navy">
                                         {approver.name[0]}
                                      </div>
                                      <span className="text-sm font-semibold text-ns-text">{approver.name}</span>
                                   </div>
                                   <div className="flex items-center gap-2">
                                      {approver.status === 'approved' ? (
                                        <span className="text-xs font-bold text-green-600 flex items-center gap-1"><CheckCircle2 size={14} /> Approved</span>
                                      ) : approver.status === 'rejected' ? (
                                        <span className="text-xs font-bold text-red-600 flex items-center gap-1"><XCircle size={14} /> Rejected</span>
                                      ) : (
                                        <span className="text-xs font-bold text-ns-text-muted flex items-center gap-1"><Clock size={14} /> Pending</span>
                                      )}
                                      {approver.actionAt && (
                                        <span className="text-[9px] text-ns-text-muted ml-2">{new Date(approver.actionAt).toLocaleString()}</span>
                                      )}
                                   </div>
                                </div>
                             ))}
                           </div>
                        </div>
                      </div>
                    ))}
                    {(!activeSub.approvals || activeSub.approvals.length === 0) && (
                      <div className="p-8 text-center text-ns-text-muted bg-ns-gray-bg rounded-sm">
                        <p className="text-xs uppercase font-bold tracking-widest">No approval workflow assigned</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })()}
        </Modal>
      </div>
    </AdminLayout>
  );
}
