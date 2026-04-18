import * as React from 'react';
import { useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import { CustomForm, TransactionType, FormTemplate } from '../types';
import { Button, Input, Select, Label } from '../components/ui/Base';
import { Table, THead, TBody, TR, TH, TD, Modal } from '../components/ui/Complex';
import { Plus, Search, Copy, Trash2, Edit2, LogOut, Settings2, Filter, User as UserIcon, Layout, Zap, Award, FileCode, Check, ChevronRight, ArrowLeft, Building2, Users } from 'lucide-react';
import { cn } from '../lib/utils';
import AdminLayout from '../components/layout/AdminLayout';

export default function DashboardPage() {
  const { 
    forms, user, logout, deleteForm, cloneForm, setCurrentForm, 
    catalogues, companies, users, createForm, templates, assignUsers,
    fetchForms, fetchCompanies, fetchUsers, isLoading 
  } = useStore();
  const navigate = useNavigate();
  const [search, setSearch] = React.useState('');
  const [typeFilter, setTypeFilter] = React.useState<string>('all');
  const [companyFilter, setCompanyFilter] = React.useState<string>('all');
  
  React.useEffect(() => {
    fetchForms();
    fetchCompanies();
    fetchUsers();
  }, [fetchForms, fetchCompanies, fetchUsers]);

  const [isCreateModalOpen, setIsCreateModalOpen] = React.useState(false);
  const [createStep, setCreateStep] = React.useState<1 | 2 | 3>(1);
  const [creationMethod, setCreationMethod] = React.useState<'scratch' | 'template'>('scratch');
  const [newFormDetails, setNewFormDetails] = React.useState({
    name: '',
    customerId: companies[0]?.id || '',
    transactionType: 'purchase_order' as TransactionType,
    templateId: undefined as string | undefined
  });

  const [assignModal, setAssignModal] = React.useState<{ isOpen: boolean; formId: string | null; companyId: string }>({
    isOpen: false,
    formId: null,
    companyId: ''
  });

  const [selectedEmployees, setSelectedEmployees] = React.useState<string[]>([]);
  const [templatePreview, setTemplatePreview] = React.useState<FormTemplate | null>(null);

  const filteredForms = forms.filter(f => {
    const company = companies.find(c => c.id === f.customerId);
    const matchesSearch = f.name.toLowerCase().includes(search.toLowerCase()) || 
                         (company?.name.toLowerCase().includes(search.toLowerCase()));
    const matchesType = typeFilter === 'all' || f.transactionType === typeFilter;
    const matchesCompany = companyFilter === 'all' || f.customerId === companyFilter;
    
    return matchesSearch && matchesType && matchesCompany;
  });

  const handleEdit = (form: CustomForm) => {
    setCurrentForm(form);
    navigate('/builder');
  };

  const handleCreateSubmit = async (template?: FormTemplate) => {
    if (!newFormDetails.name) {
      alert('Please provide a configuration name.');
      return;
    }
    
    await createForm(
      newFormDetails.name, 
      newFormDetails.customerId, 
      newFormDetails.transactionType,
      template?.tabs
    );
    
    setIsCreateModalOpen(false);
    setCreateStep(1);
    navigate('/builder');
  };

  const openAssignModal = (form: CustomForm) => {
    setAssignModal({ isOpen: true, formId: form.id, companyId: form.customerId });
    setSelectedEmployees(form.assignedTo || []);
  };

  const handleSaveAssignment = async () => {
    if (assignModal.formId) {
      await assignUsers(assignModal.formId, selectedEmployees);
      setAssignModal({ ...assignModal, isOpen: false });
    }
  };

  const getCompanyName = (id: string) => companies.find(c => c.id === id)?.name || 'Unknown';
  const getEmployeesForCompany = (companyId: string) => users.filter(u => u.companyId === companyId);

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-ns-blue mb-1">
              <Settings2 size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Global Form Repository</span>
            </div>
            <h1 className="text-3xl font-bold text-ns-text">Transaction Layouts</h1>
            <p className="text-sm text-ns-text-muted mt-1">Configure, template, and assign business forms to corporate clients.</p>
          </div>
          <Button onClick={() => setIsCreateModalOpen(true)} className="h-10 px-6 gap-2">
            <Plus size={18} />
            Initialize Form
          </Button>
        </div>

        {/* Filters */}
        <div className="bg-white p-6 rounded-sm border border-ns-border ns-panel-shadow flex gap-6 items-end">
          <div className="flex-1">
            <Label className="flex items-center gap-2"><Search size={12}/> Repository Lookup</Label>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <Input 
                placeholder="Search by layout identifier or entity..." 
                className="pl-9 h-10"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
          </div>
          <div className="w-56">
            <Label className="flex items-center gap-2"><Filter size={12}/> Transaction Class</Label>
            <Select 
              className="h-10"
              value={typeFilter}
              onChange={(e) => setTypeFilter(e.target.value)}
              options={[
                { label: 'All Transaction Types', value: 'all' },
                ...Object.keys(catalogues).map(type => ({ 
                  label: catalogues[type as TransactionType].name, 
                  value: type 
                }))
              ]} 
            />
          </div>
          <div className="w-56">
            <Label className="flex items-center gap-2"><Building2 size={12}/> Select Company</Label>
            <Select 
              className="h-10"
              value={companyFilter}
              onChange={(e) => setCompanyFilter(e.target.value)}
              options={[
                { label: 'All Client Entities', value: 'all' },
                ...companies.map(c => ({ label: c.name, value: c.id }))
              ]} 
            />
          </div>
        </div>

        {/* Table */}
        <div className="space-y-4">
          <Table>
            <THead>
              <TR>
                <TH>Layout Name / UUID</TH>
                <TH>Category</TH>
                <TH className="text-center">Assignment</TH>
                <TH>Client Company</TH>
                <TH>Last Synchronization</TH>
                <TH className="text-right px-6">Directives</TH>
              </TR>
            </THead>
            <TBody>
              {filteredForms.map((form) => (
                <TR key={form.id} className="group transition-all hover:bg-ns-light-blue/10">
                  <TD className="py-4">
                    <div className="flex flex-col">
                      <button 
                        className="text-sm font-bold text-ns-text group-hover:text-ns-blue transition-colors text-left" 
                        onClick={() => handleEdit(form)}
                      >
                        {form.name}
                      </button>
                      <div className="flex items-center gap-2 mt-0.5">
                        <span className="text-[10px] text-ns-text-muted font-mono tracking-tighter uppercase whitespace-nowrap">ID: {form.id.substring(0, 8)}</span>
                        <span className={cn(
                          "text-[8px] font-bold px-1 py-0.5 rounded-sm uppercase tracking-tighter whitespace-nowrap",
                          form.source === 'template' ? "bg-green-100 text-green-700" : "bg-ns-gray-bg text-ns-text-muted border border-ns-border"
                        )}>
                          {form.source}
                        </span>
                      </div>
                    </div>
                  </TD>
                  <TD>
                    <span className="text-[10px] font-bold text-ns-navy/70 bg-ns-light-blue/30 px-2 py-1 rounded-sm uppercase tracking-wider">
                      {catalogues[form.transactionType].name}
                    </span>
                  </TD>
                  <TD className="text-center">
                    <button 
                      onClick={() => openAssignModal(form)}
                      className="inline-flex items-center gap-1.5 px-2 py-1 rounded-sm bg-ns-navy/5 border border-ns-border hover:border-ns-blue hover:text-ns-blue transition-all"
                    >
                      <Users size={12} className="opacity-60" />
                      <span className="text-[10px] font-bold uppercase tracking-widest leading-none">
                        {form.assignedTo?.length || 0} Users
                      </span>
                    </button>
                  </TD>
                  <TD>
                    <span className="text-[11px] font-semibold text-ns-text-muted">
                      {getCompanyName(form.customerId)}
                    </span>
                  </TD>
                  <TD className="text-[11px] text-ns-text-muted">{form.updatedAt}</TD>
                  <TD className="px-6">
                    <div className="flex justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Button variant="ghost" size="icon" onClick={() => handleEdit(form)} title="Open in Designer" className="h-8 w-8 hover:bg-ns-blue hover:text-white rounded-full transition-all">
                        <Edit2 size={13} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openAssignModal(form)} title="Manage Entitlements" className="h-8 w-8 hover:bg-ns-navy hover:text-white rounded-full transition-all">
                        <Users size={13} />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => deleteForm(form.id)} className="h-8 w-8 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-all" title="Purge Record">
                        <Trash2 size={13} />
                      </Button>
                    </div>
                  </TD>
                </TR>
              ))}
            </TBody>
          </Table>
        </div>
      </div>

      {/* Assignment Modal */}
      <Modal
        isOpen={assignModal.isOpen}
        onClose={() => setAssignModal({ ...assignModal, isOpen: false })}
        title="Form Entitlement & User Mapping"
        footer={
          <>
            <Button variant="secondary" size="sm" onClick={() => setAssignModal({ ...assignModal, isOpen: false })}>Discard</Button>
            <Button size="sm" onClick={handleSaveAssignment}>Commit Assignments</Button>
          </>
        }
      >
        <div className="space-y-6">
          <div className="p-4 bg-ns-blue/5 border border-ns-blue/10 rounded-sm">
            <h4 className="text-[10px] font-bold text-ns-blue uppercase tracking-widest mb-1">Authorization Context</h4>
            <p className="text-xs text-ns-navy font-bold">{getCompanyName(assignModal.companyId)}</p>
          </div>
          
          <div className="space-y-3">
            <Label>Select Authorized Employees</Label>
            <div className="bg-ns-gray-bg border border-ns-border rounded-sm max-h-60 overflow-auto custom-scrollbar p-2 space-y-1">
              {getEmployeesForCompany(assignModal.companyId).map(emp => (
                <label 
                  key={emp.id} 
                  className={cn(
                    "flex items-center gap-3 p-3 rounded-sm border cursor-pointer transition-all",
                    selectedEmployees.includes(emp.id) ? "bg-white border-ns-blue shadow-sm" : "border-transparent opacity-60 hover:opacity-100"
                  )}
                >
                  <input 
                    type="checkbox"
                    className="w-4 h-4 rounded border-ns-border text-ns-blue focus:ring-ns-blue"
                    checked={selectedEmployees.includes(emp.id)}
                    onChange={(e) => {
                      if (e.target.checked) setSelectedEmployees([...selectedEmployees, emp.id]);
                      else setSelectedEmployees(selectedEmployees.filter(id => id !== emp.id));
                    }}
                  />
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-ns-navy leading-none">{emp.name}</span>
                    <span className="text-[10px] text-ns-text-muted mt-1">{emp.jobTitle}</span>
                  </div>
                </label>
              ))}
              {getEmployeesForCompany(assignModal.companyId).length === 0 && (
                <div className="py-8 text-center text-xs text-ns-text-muted italic">
                  No personnel detected for this entity. Onboard staff in Settings.
                </div>
              )}
            </div>
          </div>
        </div>
      </Modal>

      {/* Modals from previous version (Simplified/Reintegrated) */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => { setIsCreateModalOpen(false); setCreateStep(1); }}
        title={`Initialize Transaction Blueprint - Step ${createStep} of 3`}
        footer={
          <div className="flex justify-between w-full">
            {createStep > 1 && <Button variant="ghost" size="sm" onClick={() => setCreateStep(createStep - 1 as any)}><ArrowLeft size={14} className="mr-2"/> Back</Button>}
            <div className="flex gap-2 ml-auto">
              <Button variant="secondary" size="sm" onClick={() => setIsCreateModalOpen(false)}>Abort</Button>
              {createStep === 1 && <Button size="sm" onClick={() => setCreateStep(2)} disabled={!newFormDetails.name}>Proceed <ChevronRight size={14} className="ml-1"/></Button>}
              {createStep === 2 && creationMethod === 'scratch' && <Button size="sm" onClick={() => handleCreateSubmit()}>Finalize Initial View</Button>}
            </div>
          </div>
        }
      >
        {/* Content same as before but using companies */}
        <div className="min-h-[300px]">
          {createStep === 1 && (
            <div className="space-y-6">
              <div>
                <Label mandatory>Target Client Entity</Label>
                <Select 
                  value={newFormDetails.customerId}
                  onChange={(e) => setNewFormDetails({...newFormDetails, customerId: e.target.value})}
                  options={companies.map(c => ({ label: c.name, value: c.id }))}
                />
              </div>
              <div>
                <Label mandatory>Transaction Schema</Label>
                <Select 
                  value={newFormDetails.transactionType}
                  onChange={(e) => setNewFormDetails({...newFormDetails, transactionType: e.target.value as TransactionType})}
                  options={Object.keys(catalogues).map(type => ({ 
                    label: catalogues[type as TransactionType].name, 
                    value: type 
                  }))}
                />
              </div>
              <div>
                <Label mandatory>Configuration Identifier</Label>
                <Input 
                  placeholder="e.g. Standard PO v2.0" 
                  value={newFormDetails.name}
                  onChange={(e) => setNewFormDetails({...newFormDetails, name: e.target.value})}
                  autoFocus
                />
              </div>
            </div>
          )}
          {createStep === 2 && (
            <div className="grid grid-cols-2 gap-4">
              <button 
                onClick={() => setCreationMethod('scratch')}
                className={cn("p-6 border-2 rounded-sm text-left transition-all", creationMethod === 'scratch' ? "border-ns-blue bg-ns-blue/5" : "border-ns-border")}
              >
                <FileCode size={20} className="mb-2 text-ns-blue" />
                <h4 className="font-bold text-sm">Blank Canvas</h4>
                <p className="text-[10px] text-ns-text-muted mt-1 leading-relaxed">Initialize without predefined components.</p>
              </button>
              <button 
                onClick={() => { setCreationMethod('template'); setCreateStep(3); }}
                className={cn("p-6 border-2 rounded-sm text-left transition-all", creationMethod === 'template' ? "border-ns-blue bg-ns-blue/5" : "border-ns-border")}
              >
                <Layout size={20} className="mb-2 text-green-600" />
                <h4 className="font-bold text-sm">Use Blueprint</h4>
                <p className="text-[10px] text-ns-text-muted mt-1 leading-relaxed">Clone standard industry configurations.</p>
              </button>
            </div>
          )}
          {createStep === 3 && (
            <div className="space-y-2 max-h-[350px] overflow-auto pr-1 custom-scrollbar">
              {templates.filter(t => t.transactionType === newFormDetails.transactionType).map(t => (
                <div key={t.id} className="p-4 border border-ns-border rounded-sm hover:border-ns-blue transition-all bg-white flex justify-between items-center group">
                  <div className="flex flex-col">
                    <span className="text-sm font-bold text-ns-navy">{t.name}</span>
                    <span className="text-[10px] text-ns-text-muted truncate max-w-[250px] italic">{t.description}</span>
                  </div>
                  <Button size="xs" onClick={() => handleCreateSubmit(t)} className="h-8 px-4">Apply</Button>
                </div>
              ))}
            </div>
          )}
        </div>
      </Modal>

    </AdminLayout>
  );
}
