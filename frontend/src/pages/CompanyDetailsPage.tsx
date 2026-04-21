import * as React from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import { Button, Input, Select, Label } from '../components/ui/Base';
import { Table, THead, TBody, TR, TH, TD, Modal, ConfirmModal } from '../components/ui/Complex';
import { Users, Plus, Mail, IdCard, Briefcase, Trash2, ArrowLeft, Shield } from 'lucide-react';

export default function CompanyDetailsPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { companies, users, addUser, deleteUser, fetchCompanies, fetchUsers, isLoading } = useStore();
  
  React.useEffect(() => {
    fetchCompanies();
    fetchUsers();
  }, [fetchCompanies, fetchUsers]);

  const company = companies.find(c => c.id === id);
  const companyEmployees = users.filter(u => u.companyId === id);

  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newEmployee, setNewEmployee] = React.useState({
    name: '',
    email: '',
    empId: '',
    jobTitle: '',
    password: 'password123'
  });
  const [deleteUserId, setDeleteUserId] = React.useState<string | null>(null);

  if (!company) {
    return (
      <AdminLayout>
        <div className="text-center py-20">
          <p className="text-ns-text-muted">Entity not found.</p>
          <Button variant="secondary" onClick={() => navigate('/companies')} className="mt-4">Return to Directory</Button>
        </div>
      </AdminLayout>
    );
  }

  const handleAddEmployee = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEmployee.name || !newEmployee.email) return;

    await addUser({
      name: newEmployee.name,
      email: newEmployee.email,
      empId: newEmployee.empId,
      jobTitle: newEmployee.jobTitle,
      password: newEmployee.password,
      role: 'customer',
      companyId: company.id
    });

    setNewEmployee({ name: '', email: '', empId: '', jobTitle: '', password: 'password123' });
    setIsModalOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex flex-col gap-4">
          <button 
            onClick={() => navigate('/companies')}
            className="flex items-center gap-2 text-xs font-bold text-ns-text-muted hover:text-ns-blue transition-colors uppercase tracking-widest"
          >
            <ArrowLeft size={14} /> Back to Directory
          </button>
          
          <div className="flex justify-between items-end">
            <div className="flex items-center gap-5">
              <div className="w-16 h-16 rounded-sm bg-ns-navy text-white flex items-center justify-center font-bold text-2xl shadow-xl">
                {company.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <div className="flex items-center gap-2 text-ns-blue mb-1">
                  <Shield size={14} />
                  <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Authorized Client Environment</span>
                </div>
                <h1 className="text-3xl font-bold text-ns-text">{company.name}</h1>
                <p className="text-sm text-ns-text-muted mt-1">Personnel Ledger & Access Token Management</p>
              </div>
            </div>
            <Button onClick={() => setIsModalOpen(true)} className="gap-2 px-6 h-10">
              <Plus size={18} />
              Onboard Employee
            </Button>
          </div>
        </div>

        {/* Info Grid */}
        <div className="grid grid-cols-3 gap-6">
          <div className="bg-white p-6 border border-ns-border rounded-sm ns-panel-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-ns-blue/10 rounded-full flex items-center justify-center text-ns-blue">
              <Users size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest mb-0.5">Active Staff</p>
              <p className="text-2xl font-bold text-ns-navy tracking-tight">{companyEmployees.length}</p>
            </div>
          </div>
          <div className="bg-white p-6 border border-ns-border rounded-sm ns-panel-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600">
              <IdCard size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest mb-0.5">Auth Status</p>
              <p className="text-2xl font-bold text-ns-navy tracking-tight">Synchronized</p>
            </div>
          </div>
          <div className="bg-white p-6 border border-ns-border rounded-sm ns-panel-shadow flex items-center gap-4">
            <div className="w-12 h-12 bg-amber-100 rounded-full flex items-center justify-center text-amber-600">
              <Briefcase size={22} />
            </div>
            <div>
              <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest mb-0.5">Sub-Entity ID</p>
              <p className="text-lg font-mono font-bold text-ns-navy tracking-tighter uppercase">{company.id}</p>
            </div>
          </div>
        </div>

        {/* Employee Table */}
        <div className="space-y-4">
          <div className="flex justify-between items-center text-[10px] font-bold text-ns-text-muted uppercase tracking-[0.2em] px-1">
            <span>Corporate Personnel Ledger</span>
            <span>Last Updated: {new Date().toLocaleDateString()}</span>
          </div>
          <Table>
            <THead>
              <TR>
                <TH>Name / Employee ID</TH>
                <TH>Email Address</TH>
                <TH>Functional Role</TH>
                <TH className="text-right px-6">Administrative Controls</TH>
              </TR>
            </THead>
            <TBody>
              {companyEmployees.map(emp => (
                <TR key={emp.id} className="group">
                  <TD className="py-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-bold text-ns-text">{emp.name}</span>
                      <span className="text-[10px] text-ns-text-muted font-mono tracking-tighter uppercase">ID: {emp.empId || 'N/A'}</span>
                    </div>
                  </TD>
                  <TD>
                    <div className="flex items-center gap-2 text-xs font-semibold text-ns-text-muted underline">
                      <Mail size={12} />
                      {emp.email}
                    </div>
                  </TD>
                  <TD>
                    <span className="text-[10px] bg-ns-gray-bg border border-ns-border px-2 py-1 rounded-sm font-bold text-ns-navy grayscale">
                      {emp.jobTitle || 'Unassigned'}
                    </span>
                  </TD>
                  <TD className="px-6 text-right">
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => setDeleteUserId(emp.id)}
                      className="h-8 w-8 text-ns-text-muted hover:text-red-500 hover:bg-red-50 transition-all rounded-full"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </TD>
                </TR>
              ))}
              {companyEmployees.length === 0 && (
                <TR>
                  <TD colSpan={4} className="py-20 text-center bg-white italic text-ns-text-muted text-sm tracking-wide">
                    Zero synchronized personnel records found.
                  </TD>
                </TR>
              )}
            </TBody>
          </Table>
        </div>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Personnel Onboarding"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddEmployee} disabled={!newEmployee.name || !newEmployee.email}>Synchronize User Identity</Button>
            </>
          }
        >
          <form className="space-y-5" onSubmit={handleAddEmployee}>
            <div className="p-3 bg-amber-50 border border-amber-200 text-[11px] text-amber-800 rounded-sm italic">
              Generating new user identity automatically activates Corporate Dashboard access for this entity.
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label mandatory>Full Legal Name</Label>
                <Input 
                  placeholder="e.g. Rahul Sharma" 
                  value={newEmployee.name}
                  onChange={(e) => setNewEmployee({...newEmployee, name: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label mandatory>Corporate Email</Label>
                <Input 
                  type="email"
                  placeholder="name@company.com" 
                  value={newEmployee.email}
                  onChange={(e) => setNewEmployee({...newEmployee, email: e.target.value})}
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Employee Serial ID</Label>
                <Input 
                  placeholder="e.g. EMP-2024-001" 
                  value={newEmployee.empId}
                  onChange={(e) => setNewEmployee({...newEmployee, empId: e.target.value})}
                />
              </div>
              <div className="space-y-2">
                <Label>Functional Job Title</Label>
                <Input 
                  placeholder="e.g. Senior Buyer" 
                  value={newEmployee.jobTitle}
                  onChange={(e) => setNewEmployee({...newEmployee, jobTitle: e.target.value})}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label>System Password (Mock)</Label>
              <Input 
                value={newEmployee.password}
                onChange={(e) => setNewEmployee({...newEmployee, password: e.target.value})}
              />
              <p className="text-[10px] text-ns-text-muted italic">Used for simulated user authentication.</p>
            </div>
          </form>
        </Modal>
      </div>
      <ConfirmModal
        isOpen={!!deleteUserId}
        onClose={() => setDeleteUserId(null)}
        onConfirm={() => { if(deleteUserId) deleteUser(deleteUserId); }}
        title="Revoke User Access?"
        message="This will permanently delete this user account. The employee will lose all access to their corporate dashboard."
      />
    </AdminLayout>
  );
}
