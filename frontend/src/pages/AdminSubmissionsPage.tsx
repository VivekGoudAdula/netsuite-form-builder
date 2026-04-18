import * as React from 'react';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import { Table, THead, TBody, TR, TH, TD } from '../components/ui/Complex';
import { Database, Search, FileJson, Calendar, Building2, User } from 'lucide-react';
import { Button, Input, Select, Label } from '../components/ui/Base';
import { cn } from '../lib/utils';

export default function AdminSubmissionsPage() {
  const { submissions, forms, companies, users, fetchSubmissions, fetchCompanies, fetchUsers, retrySubmission, isLoading } = useStore();
  const [searchTerm, setSearchTerm] = React.useState('');

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
            <p className="text-sm text-ns-text-muted mt-1">Review finalized submissions from customer environments across all entities.</p>
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
               <TH>NetSuite Status</TH>
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
                        sub.status === 'submitted' ? "bg-green-100 text-green-700" : "bg-red-100 text-red-700"
                      )}>
                        {sub.status === 'submitted' ? 'Synchronized' : 'Sync Failed'}
                      </span>
                      {sub.netsuiteId && (
                        <span className="text-[9px] font-mono text-ns-text-muted">ID: {sub.netsuiteId}</span>
                      )}
                      {sub.errorMessage && (
                        <span className="text-[9px] text-red-500 italic truncate max-w-[150px]">{sub.errorMessage}</span>
                      )}
                    </div>
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
                      <Button variant="ghost" size="sm" className="h-8 px-3 gap-2 text-[10px] font-bold uppercase tracking-widest text-ns-blue hover:bg-ns-blue hover:text-white transition-all">
                        View Payload <FileJson size={12} />
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
      </div>
    </AdminLayout>
  );
}
