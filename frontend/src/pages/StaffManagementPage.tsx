import * as React from 'react';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import { 
  Users, 
  UserPlus, 
  Search, 
  Filter, 
  MoreHorizontal, 
  Shield, 
  Building, 
  Mail, 
  CheckCircle2, 
  XCircle,
  ToggleLeft,
  ToggleRight,
  Trash2,
  Lock,
  Plus,
  AlertCircle
} from 'lucide-react';
import { UserRole, User } from '../types';
import { cn } from '../lib/utils';

export default function StaffManagementPage() {
  const { user: currentUser, users, fetchUsers, companies, fetchCompanies, addUser, deleteUser, updateUserStatus } = useStore();
  const [isAddModalOpen, setIsAddModalOpen] = React.useState(false);
  const [searchTerm, setSearchTerm] = React.useState('');
  const [roleFilter, setRoleFilter] = React.useState<string>('all');
  const [companyFilter, setCompanyFilter] = React.useState<string>('all');
  
  // New User Form State
  const [newUserName, setNewUserName] = React.useState('');
  const [newUserEmail, setNewUserEmail] = React.useState('');
  const [newUserPassword, setNewUserPassword] = React.useState('');
  const [newUserRole, setNewUserRole] = React.useState<UserRole>('user');
  const [newUserCompany, setNewUserCompany] = React.useState('');
  const [newUserEmpId, setNewUserEmpId] = React.useState('');
  const [newUserJobTitle, setNewUserJobTitle] = React.useState('');
  const [isSubmitting, setIsSubmitting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  React.useEffect(() => {
    fetchUsers();
    fetchCompanies();
  }, [fetchUsers, fetchCompanies]);

  const filteredUsers = users.filter(u => {
    const matchesSearch = u.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
                         u.email.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = roleFilter === 'all' || u.role === roleFilter;
    const matchesCompany = companyFilter === 'all' || u.companyId === companyFilter;
    
    // Scoping for Client Admin
    if (currentUser?.role === 'client_admin') {
      return matchesSearch && matchesRole && u.companyId === currentUser.companyId;
    }
    
    return matchesSearch && matchesRole && matchesCompany;
  });

  const handleAddUser = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setErrorMsg(null);
    try {
      await addUser({
        name: newUserName,
        email: newUserEmail,
        password: newUserPassword,
        role: newUserRole,
        empId: newUserEmpId,
        jobTitle: newUserJobTitle,
        companyId: currentUser?.role === 'client_admin' ? currentUser.companyId : (newUserRole === 'super_admin' ? undefined : newUserCompany),
      });
      setIsAddModalOpen(false);
      resetForm();
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to authorize personnel.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNewUserName('');
    setNewUserEmail('');
    setNewUserPassword('');
    setNewUserRole('user');
    setNewUserCompany('');
    setNewUserEmpId('');
    setNewUserJobTitle('');
    setErrorMsg(null);
  };

  const getRoleBadge = (role: UserRole) => {
    switch (role) {
      case 'super_admin': return <span className="bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Super Admin</span>;
      case 'client_admin': return <span className="bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Client Admin</span>;
      case 'manager': return <span className="bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">Manager</span>;
      default: return <span className="bg-gray-100 text-gray-700 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider">User</span>;
    }
  };

  return (
    <AdminLayout>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-bold text-ns-navy flex items-center gap-2">
            <Users className="text-ns-blue" />
            Personnel Protocol
          </h1>
          <p className="text-ns-text-muted text-sm mt-1">Manage entity access, roles, and operational status.</p>
        </div>
        
        {(currentUser?.role === 'super_admin' || currentUser?.role === 'client_admin') && (
          <button 
            onClick={() => setIsAddModalOpen(true)}
            className="bg-ns-blue hover:bg-ns-blue/90 text-white font-bold py-2 px-6 rounded-sm shadow-lg shadow-ns-blue/20 transition-all flex items-center gap-2"
          >
            <UserPlus size={18} />
            Authorize Personnel
          </button>
        )}
      </div>

      {/* Filters */}
      <div className="bg-white p-4 rounded-sm border border-ns-border shadow-sm mb-6 flex flex-wrap items-center gap-4">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-3 top-2.5 text-gray-400" size={16} />
          <input 
            type="text" 
            placeholder="Search by name or email..." 
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue transition-all"
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Filter size={16} className="text-ns-text-muted" />
          <select 
            value={roleFilter}
            onChange={(e) => setRoleFilter(e.target.value)}
            className="bg-ns-gray-bg border border-ns-border rounded-sm text-xs font-bold py-2 px-3 focus:outline-none focus:border-ns-blue transition-all uppercase tracking-wider"
          >
            <option value="all">All Roles</option>
            <option value="super_admin">Super Admin</option>
            <option value="client_admin">Client Admin</option>
            <option value="manager">Manager</option>
            <option value="user">User</option>
          </select>
        </div>

        {currentUser?.role === 'super_admin' && (
          <select 
            value={companyFilter}
            onChange={(e) => setCompanyFilter(e.target.value)}
            className="bg-ns-gray-bg border border-ns-border rounded-sm text-xs font-bold py-2 px-3 focus:outline-none focus:border-ns-blue transition-all uppercase tracking-wider"
          >
            <option value="all">All Entities</option>
            {companies.map(c => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        )}
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-sm border border-ns-border shadow-sm overflow-hidden">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-ns-gray-bg border-b border-ns-border">
              <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-[0.2em]">Personnel</th>
              <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-[0.2em]">Professional Role</th>
              <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-[0.2em]">System Access</th>
              <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-[0.2em]">Status</th>
              <th className="px-6 py-4 text-[10px] font-bold text-ns-text-muted uppercase tracking-[0.2em]">Joined</th>
              <th className="px-6 py-4 text-right"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-ns-border">
            {filteredUsers.length === 0 ? (
              <tr>
                <td colSpan={5} className="px-6 py-12 text-center text-ns-text-muted italic">
                  No personnel found matching the current protocol filters.
                </td>
              </tr>
            ) : (
              filteredUsers.map((u) => (
                <tr key={u.id} className="hover:bg-ns-gray-bg/50 transition-colors group">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-ns-blue/10 flex items-center justify-center text-ns-blue font-bold shadow-inner">
                        {u.name.substring(0, 1)}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ns-navy">{u.name}</p>
                        <p className="text-xs text-ns-text-muted">{u.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-sm font-bold text-ns-navy">{u.jobTitle || 'N/A'}</p>
                    <p className="text-[10px] text-ns-text-muted font-mono uppercase tracking-tighter">{u.employeeId || 'No ID'}</p>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-col gap-1.5">
                      {getRoleBadge(u.role)}
                      {currentUser?.role === 'super_admin' && (
                        <div className="flex items-center gap-1 text-[10px] text-ns-text-muted font-semibold uppercase tracking-wider">
                          <Building size={10} />
                          {u.companyName || 'Global'}
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div 
                      onClick={() => (currentUser?.role === 'super_admin' || currentUser?.role === 'client_admin') && u.id !== currentUser.id && updateUserStatus(u.id, !u.isActive)}
                      className={cn(
                        "relative inline-flex h-5 w-10 items-center rounded-full transition-all duration-300 ease-in-out cursor-pointer",
                        u.isActive ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.3)]" : "bg-slate-300",
                        u.id === currentUser.id && "opacity-50 cursor-not-allowed"
                      )}
                    >
                      <span
                        className={cn(
                          "inline-block h-3.5 w-3.5 transform rounded-full bg-white transition-all duration-300 ease-in-out shadow-sm",
                          u.isActive ? "translate-x-5.5" : "translate-x-1"
                        )}
                      />
                    </div>
                    <span className={cn(
                      "ml-3 text-[10px] font-black uppercase tracking-widest",
                      u.isActive ? "text-emerald-600" : "text-slate-400"
                    )}>
                      {u.isActive ? 'Enabled' : 'Disabled'}
                    </span>
                  </td>
                  <td className="px-6 py-4">
                    <p className="text-xs text-ns-text-muted font-medium">
                      {u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}
                    </p>
                  </td>
                  <td className="px-6 py-4 text-right">
                    {currentUser?.role === 'super_admin' && u.id !== currentUser.id && (
                      <button 
                        onClick={() => {
                          if (confirm(`Are you sure you want to revoke authorization for ${u.name}?`)) {
                            deleteUser(u.id);
                          }
                        }}
                        className="p-2 text-ns-text-muted hover:text-red-500 hover:bg-red-50 rounded-sm transition-all"
                      >
                        <Trash2 size={16} />
                      </button>
                    )}
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Add User Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-ns-navy/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-sm border border-ns-border shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95 duration-200">
            <div className="px-6 py-4 border-b border-ns-border bg-ns-gray-bg flex items-center justify-between">
              <h3 className="font-bold text-ns-navy flex items-center gap-2">
                <UserPlus size={18} className="text-ns-blue" />
                New Personnel Authorization
              </h3>
              <button onClick={() => { setIsAddModalOpen(false); setErrorMsg(null); }} className="text-ns-text-muted hover:text-ns-navy">
                <XCircle size={20} />
              </button>
            </div>
            
            <form onSubmit={handleAddUser} className="p-6 space-y-4">
              {errorMsg && (
                <div className="p-3 bg-red-50 border border-red-200 text-[11px] text-red-600 rounded-sm font-bold flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                  <AlertCircle size={14} />
                  {errorMsg}
                </div>
              )}
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-ns-navy uppercase tracking-widest mb-1">Full Name</label>
                  <input
                    type="text"
                    required
                    value={newUserName}
                    onChange={(e) => setNewUserName(e.target.value)}
                    className="w-full px-3 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue"
                    placeholder="John Doe"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-ns-navy uppercase tracking-widest mb-1">Email Address</label>
                  <input
                    type="email"
                    required
                    value={newUserEmail}
                    onChange={(e) => setNewUserEmail(e.target.value)}
                    className="w-full px-3 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue"
                    placeholder="john@example.com"
                  />
                </div>

                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-ns-navy uppercase tracking-widest mb-1">Employee ID</label>
                  <input
                    type="text"
                    value={newUserEmpId}
                    onChange={(e) => setNewUserEmpId(e.target.value)}
                    className="w-full px-3 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue"
                    placeholder="EMP-123"
                  />
                </div>
                
                <div className="md:col-span-1">
                  <label className="block text-[10px] font-bold text-ns-navy uppercase tracking-widest mb-1">Job Title</label>
                  <input
                    type="text"
                    value={newUserJobTitle}
                    onChange={(e) => setNewUserJobTitle(e.target.value)}
                    className="w-full px-3 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue"
                    placeholder="Manager"
                  />
                </div>

                <div className="md:col-span-2">
                  <label className="block text-[10px] font-bold text-ns-navy uppercase tracking-widest mb-1">Initial Password</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-2.5 text-gray-400" size={14} />
                    <input
                      type="password"
                      required
                      value={newUserPassword}
                      onChange={(e) => setNewUserPassword(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue"
                      placeholder="••••••••"
                    />
                  </div>
                </div>

                {currentUser?.role === 'super_admin' ? (
                  <>
                    <div>
                      <label className="block text-[10px] font-bold text-ns-navy uppercase tracking-widest mb-1">Assigned Role</label>
                      <select
                        value={newUserRole}
                        onChange={(e) => setNewUserRole(e.target.value as UserRole)}
                        className="w-full px-3 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue font-bold"
                      >
                        <option value="user">User</option>
                        <option value="manager">Manager</option>
                        <option value="client_admin">Client Admin</option>
                        <option value="super_admin">Super Admin</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-[10px] font-bold text-ns-navy uppercase tracking-widest mb-1">Entity Association</label>
                      <select
                        disabled={newUserRole === 'super_admin'}
                        required={newUserRole !== 'super_admin'}
                        value={newUserCompany}
                        onChange={(e) => setNewUserCompany(e.target.value)}
                        className="w-full px-3 py-2 bg-ns-gray-bg border border-ns-border rounded-sm text-sm focus:outline-none focus:border-ns-blue disabled:opacity-50"
                      >
                        <option value="">Select Entity...</option>
                        {companies.map(c => (
                          <option key={c.id} value={c.id}>{c.name}</option>
                        ))}
                      </select>
                    </div>
                  </>
                ) : (
                  <div className="md:col-span-2">
                    <div className="p-3 bg-ns-blue/5 border border-ns-blue/10 rounded-sm">
                      <p className="text-[10px] font-bold text-ns-blue uppercase tracking-[0.2em] mb-1">Authorization Context</p>
                      <p className="text-xs text-ns-navy font-semibold">Adding to <span className="underline">{currentUser?.companyName || 'Your Entity'}</span></p>
                    </div>
                  </div>
                )}
              </div>

              <div className="pt-4 border-t border-ns-border flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => { setIsAddModalOpen(false); setErrorMsg(null); }}
                  className="px-4 py-2 text-xs font-bold text-ns-text-muted hover:text-ns-navy uppercase tracking-widest"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="bg-ns-blue hover:bg-ns-blue/90 text-white font-bold py-2 px-6 rounded-sm shadow-lg shadow-ns-blue/20 transition-all flex items-center gap-2 disabled:opacity-50"
                >
                  {isSubmitting ? 'Authorizing...' : 'Grant Access'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}
