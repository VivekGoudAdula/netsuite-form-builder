import * as React from 'react';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import { Button, Input, Label } from '../components/ui/Base';
import { Table, THead, TBody, TR, TH, TD, Modal } from '../components/ui/Complex';
import { Building2, Plus, Users, Search, MoreHorizontal, ArrowRight, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';

export default function CompaniesPage() {
  const { companies, users, addCompany, deleteCompany, fetchCompanies, fetchUsers, isLoading } = useStore();
  const navigate = useNavigate();
  const [searchTerm, setSearchTerm] = React.useState('');
  const [isModalOpen, setIsModalOpen] = React.useState(false);
  const [newCompanyName, setNewCompanyName] = React.useState('');

  React.useEffect(() => {
    fetchCompanies();
    fetchUsers();
  }, [fetchCompanies, fetchUsers]);

  const filteredCompanies = companies.filter(c => 
    c.name.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getEmployeeCount = (companyId: string) => {
    return users.filter(u => u.companyId === companyId).length;
  };

  const handleAddCompany = async () => {
    if (!newCompanyName.trim()) return;
    await addCompany(newCompanyName);
    setNewCompanyName('');
    setIsModalOpen(false);
  };

  return (
    <AdminLayout>
      <div className="space-y-8">
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-ns-blue mb-1">
              <Building2 size={16} />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Organization Management</span>
            </div>
            <h1 className="text-3xl font-bold text-ns-text">Client Companies</h1>
            <p className="text-sm text-ns-text-muted mt-1">Manage corporate entities and their authorized personnel.</p>
          </div>
          <Button onClick={() => setIsModalOpen(true)} className="gap-2 px-6 h-10">
            <Plus size={18} />
            Register Company
          </Button>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-6 rounded-sm border border-ns-border ns-panel-shadow">
          <div className="relative">
            <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
            <Input 
              placeholder="Search by company name..." 
              className="pl-9 h-10"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
        </div>

        {/* Table */}
        <Table>
          <THead>
            <TR>
              <TH className="w-16 text-center">ID</TH>
              <TH>Company Entity</TH>
              <TH className="text-center">Staff Count</TH>
              <TH>Establishment Date</TH>
              <TH className="text-right px-6">Operations</TH>
            </TR>
          </THead>
          <TBody>
            {filteredCompanies.map((company, index) => (
              <TR key={company.id} className="group transition-all hover:bg-ns-light-blue/10">
                <TD className="text-center text-gray-400 font-mono text-[11px]">{index + 1}</TD>
                <TD className="py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-sm bg-ns-gray-bg border border-ns-border flex items-center justify-center text-ns-navy/40 font-bold text-xs uppercase">
                      {company.name.substring(0, 2)}
                    </div>
                    <div>
                      <button 
                        onClick={() => navigate(`/companies/${company.id}`)}
                        className="text-sm font-bold text-ns-text group-hover:text-ns-blue transition-colors text-left block"
                      >
                        {company.name}
                      </button>
                      <span className="text-[10px] text-ns-text-muted font-mono tracking-tighter uppercase">{company.id}</span>
                    </div>
                  </div>
                </TD>
                <TD className="text-center">
                  <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-ns-blue/10 text-ns-blue text-[10px] font-bold border border-ns-blue/20">
                    <Users size={10} />
                    {getEmployeeCount(company.id)} Employees
                  </div>
                </TD>
                <TD className="text-[11px] text-ns-text-muted font-semibold">{company.createdAt}</TD>
                <TD className="px-6">
                  <div className="flex justify-end gap-2">
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      onClick={() => navigate(`/companies/${company.id}`)}
                      className="h-8 px-3 gap-1.5 text-[10px] font-bold uppercase tracking-widest"
                    >
                      Staff Management <ArrowRight size={12} />
                    </Button>
                    <Button 
                      variant="ghost" 
                      size="icon" 
                      onClick={() => { if(confirm('Delete company and all associated users?')) deleteCompany(company.id); }}
                      className="h-8 w-8 text-red-400 hover:bg-red-500 hover:text-white rounded-full transition-all"
                    >
                      <Trash2 size={13} />
                    </Button>
                  </div>
                </TD>
              </TR>
            ))}
            {filteredCompanies.length === 0 && (
              <TR>
                <TD colSpan={5} className="py-20 text-center bg-white">
                  <div className="opacity-40 flex flex-col items-center">
                    <Building2 size={40} className="mb-4 text-ns-navy" />
                    <p className="text-sm font-bold uppercase tracking-[0.2em]">Zero Entities Matched</p>
                    <p className="text-xs mt-2">Adjust your search parameters or register a new company.</p>
                  </div>
                </TD>
              </TR>
            )}
          </TBody>
        </Table>

        {/* Modal */}
        <Modal
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          title="Register New Client Entity"
          footer={
            <>
              <Button variant="secondary" size="sm" onClick={() => setIsModalOpen(false)}>Cancel</Button>
              <Button size="sm" onClick={handleAddCompany} disabled={!newCompanyName}>Authorize Registration</Button>
            </>
          }
        >
          <div className="space-y-4">
            <p className="text-xs text-ns-text-muted leading-relaxed italic border-l-2 border-ns-blue pl-3 py-1 bg-ns-blue/5">
              Warning: Creating a new company allows for separate data siloing and unique user role assignments.
            </p>
            <div>
              <Label mandatory>Official Company Name</Label>
              <Input 
                autoFocus
                placeholder="e.g. Acme Corp India Pvt Ltd" 
                value={newCompanyName}
                onChange={(e) => setNewCompanyName(e.target.value)}
              />
            </div>
          </div>
        </Modal>
      </div>
    </AdminLayout>
  );
}
