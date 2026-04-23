import * as React from 'react';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import { Button, Input, Select, Label } from '../components/ui/Base';
import { Table, THead, TBody, TR, TH, TD, Modal, ConfirmModal } from '../components/ui/Complex';
import {
  FileText,
  Plus,
  Search,
  Trash2,
  Edit,
  Layout,
  ExternalLink,
  Building2,
  Filter,
  CheckCircle2,
  Clock,
  Briefcase,
  Library,
  Users,
  ShieldCheck
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { cn } from '../lib/utils';
import { TransactionType } from '../types';

export default function FormsPage() {
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [deleteConfirmId, setDeleteConfirmId] = React.useState<string | null>(null);

  // Assignment State
  const [assignmentFormId, setAssignmentFormId] = React.useState<string | null>(null);
  const [selectedUserIds, setSelectedUserIds] = React.useState<string[]>([]);

  const {
    user,
    forms,
    companies,
    users,
    fetchForms,
    fetchCompanies,
    fetchUsers,
    assignForm,
    deleteForm,
    isLoading
  } = useStore();

  const isSuperAdmin = user?.role === 'super_admin';
  const isClientAdmin = user?.role === 'client_admin';

  React.useEffect(() => {
    fetchForms(isClientAdmin ? user?.companyId : undefined);
    fetchCompanies();
    fetchUsers();
  }, [fetchForms, fetchCompanies, fetchUsers, isClientAdmin, user?.companyId]);

  const openAssignment = (form: any) => {
    setAssignmentFormId(form.id);
    setSelectedUserIds(form.assignedTo || []);
    setIsModalOpen(true);
  };

  const handleAssign = async () => {
    if (assignmentFormId) {
      await assignForm(assignmentFormId, selectedUserIds);
      setIsModalOpen(false);
      setAssignmentFormId(null);
    }
  };

  const toggleUserSelection = (userId: string) => {
    setSelectedUserIds(prev =>
      prev.includes(userId) ? prev.filter(id => id !== userId) : [...prev, userId]
    );
  };

  const filteredForms = forms.filter(f =>
    f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    f.transactionType.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const activeForm = forms.find(f => f.id === assignmentFormId);
  const relevantUsers = users.filter(u => u.companyId === (activeForm?.customerId || user?.companyId));

  return (
    <AdminLayout>
      <div className="space-y-8">
        {/* Header */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-ns-blue mb-1">
              <ShieldCheck size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                {isSuperAdmin ? 'Global Forms' : 'Entity Form Assignments'}
              </span>
            </div>
            <h1 className="text-3xl font-bold text-ns-text">
              {isSuperAdmin ? 'Manage Forms' : 'Personnel Assignments'}
            </h1>
            <p className="text-sm text-ns-text-muted mt-1">
              {isSuperAdmin
                ? 'Configure and provision transaction schemas for client entities.'
                : 'Assign active form protocols to your authorized personnel.'}
            </p>
          </div>
          {isSuperAdmin && (
            <Button onClick={() => navigate('/templates')} className="gap-2 px-6 h-10 shadow-lg shadow-ns-blue/20">
              <Plus size={18} />
              Provision New Schema
            </Button>
          )}
        </div>

        {/* Global Toolbar */}
        <div className="bg-white p-6 rounded-sm border border-ns-border ns-panel-shadow flex items-center justify-between gap-6">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <Input
              placeholder={isSuperAdmin ? "Filter by blueprint name or type..." : "Filter by assignment name..."}
              className="pl-9 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
            <div className="h-8 w-[1px] bg-ns-border" />
            <Button variant="ghost" size="sm" className="gap-2 text-ns-text-muted">
              <Filter size={14} /> Refine Search
            </Button>
          </div>
        </div>

        {/* Form List Table */}
        <Table>
          <THead>
            <TR>
              <TH>{isSuperAdmin ? 'Blueprint Name' : 'Protocol Name'}</TH>
              {isSuperAdmin && <TH>Company Entity</TH>}
              <TH>Configuration Type</TH>
              <TH>Access List</TH>
              <TH className="text-right px-6">Controls</TH>
            </TR>
          </THead>
          <TBody>
            {filteredForms.map((form) => {
              const company = companies.find(c => c.id === form.customerId);
              return (
                <TR key={form.id} className="group transition-all hover:bg-ns-light-blue/10">
                  <TD className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-ns-text group-hover:text-ns-blue transition-colors">{form.name}</span>
                      <span className="text-[10px] text-ns-text-muted font-mono tracking-tighter uppercase">{form.id}</span>
                    </div>
                  </TD>
                  {isSuperAdmin && (
                    <TD>
                      <div className="flex items-center gap-2">
                        <Building2 size={12} className="text-ns-navy/40" />
                        <span className="text-xs font-semibold text-ns-text">{company?.name || 'Unassigned'}</span>
                      </div>
                    </TD>
                  )}
                  <TD>
                    <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-ns-navy/5 text-ns-navy text-[10px] font-bold border border-ns-navy/10 uppercase tracking-tighter">
                      <Briefcase size={10} />
                      {form.transactionType.replace('_', ' ')}
                    </div>
                  </TD>
                  <TD>
                    <button
                      onClick={() => openAssignment(form)}
                      className="flex items-center gap-1.5 px-2 py-1 rounded-sm bg-ns-blue/5 hover:bg-ns-blue/10 border border-ns-blue/20 text-[10px] font-bold text-ns-blue transition-colors"
                    >
                      <Users size={12} />
                      {form.assignedTo?.length || 0} STAFF
                    </button>
                  </TD>
                  <TD className="px-6">
                    <div className="flex justify-end gap-2">
                      {isSuperAdmin ? (
                        <>
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => navigate('/builder', { state: { formId: form.id } })}
                            className="h-8 px-3 gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                          >
                            <Edit size={12} /> Edit
                          </Button>
                          <Button
                            variant="ghost"
                            size="icon"
                            onClick={() => setDeleteConfirmId(form.id)}
                            className="h-8 w-8 text-ns-text-muted hover:text-red-500 hover:bg-red-50 transition-all rounded-full"
                          >
                            <Trash2 size={13} />
                          </Button>
                        </>
                      ) : (
                        <Button
                          variant="secondary"
                          size="sm"
                          onClick={() => openAssignment(form)}
                          className="h-8 px-3 gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                        >
                          <Users size={12} /> Assign Staff
                        </Button>
                      )}
                    </div>
                  </TD>
                </TR>
              );
            })}
            {filteredForms.length === 0 && (
              <TR>
                <TD colSpan={isSuperAdmin ? 5 : 4} className="py-24 text-center bg-white space-y-4">
                  <div className="opacity-40 flex flex-col items-center">
                    <Library size={48} className="mb-4 text-ns-navy" />
                    <p className="text-xs font-bold uppercase tracking-[0.2em]">Repository Empty</p>
                    <p className="text-[10px] mt-2">Zero matching protocols found in your directory.</p>
                  </div>
                  <Button variant="secondary" size="sm" onClick={() => setSearchTerm('')}>Clear Filtering</Button>
                </TD>
              </TR>
            )}
          </TBody>
        </Table>

        {/* Assignment Modal */}
        {activeForm && (
          <Modal
            isOpen={isModalOpen && !!assignmentFormId}
            onClose={() => setIsModalOpen(false)}
            title="Authorized Personnel Assignment"
            footer={
              <>
                <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
                <Button size="sm" onClick={handleAssign}>Synchronize Access List</Button>
              </>
            }
          >
            <div className="space-y-6">
              <div className="p-4 bg-ns-navy rounded-sm text-white">
                <p className="text-[10px] font-bold uppercase tracking-widest opacity-60 mb-1">Target Protocol</p>
                <h3 className="text-lg font-bold">{activeForm.name}</h3>
                <p className="text-xs opacity-80 mt-1 italic">Assign authorized personnel from {companies.find(c => c.id === (activeForm.customerId || user?.companyId))?.name || 'your entity'}.</p>
              </div>

              <div className="space-y-3 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                {relevantUsers.map(user => (
                  <div
                    key={user.id}
                    onClick={() => toggleUserSelection(user.id)}
                    className={cn(
                      "p-4 rounded-sm border cursor-pointer transition-all flex items-center justify-between group",
                      selectedUserIds.includes(user.id)
                        ? "bg-ns-blue/5 border-ns-blue shadow-inner"
                        : "bg-white border-ns-border hover:border-ns-blue/40"
                    )}
                  >
                    <div className="flex items-center gap-4">
                      <div className={cn(
                        "w-10 h-10 rounded-full flex items-center justify-center transition-colors",
                        selectedUserIds.includes(user.id) ? "bg-ns-blue text-white" : "bg-ns-gray-bg text-ns-navy/40"
                      )}>
                        <Users size={16} />
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ns-text">{user.name}</p>
                        <p className="text-[10px] text-ns-text-muted font-medium uppercase tracking-tight">{user.jobTitle || 'Authorized Staff'}</p>
                      </div>
                    </div>
                    {selectedUserIds.includes(user.id) && (
                      <div className="w-5 h-5 bg-ns-blue rounded-full flex items-center justify-center text-white scale-110 animate-in zoom-in duration-200">
                        <CheckCircle2 size={12} />
                      </div>
                    )}
                  </div>
                ))}
                {relevantUsers.length === 0 && (
                  <div className="p-12 text-center text-ns-text-muted bg-ns-gray-bg rounded-sm border border-dashed border-ns-border">
                    <p className="text-xs font-bold uppercase tracking-widest">No matching personnel recorded for this entity.</p>
                  </div>
                )}
              </div>
            </div>
          </Modal>
        )}

        {/* Delete Confirmation Modal */}
        <ConfirmModal
          isOpen={!!deleteConfirmId}
          onClose={() => setDeleteConfirmId(null)}
          onConfirm={() => {
            if (deleteConfirmId) {
              deleteForm(deleteConfirmId);
              setDeleteConfirmId(null);
            }
          }}
          title="Delete Transaction Layout?"
          message="This will permanently delete this blueprint configuration. This action cannot be undone."
        />
      </div>
    </AdminLayout>
  );
}
