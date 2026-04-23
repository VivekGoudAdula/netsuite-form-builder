import * as React from 'react';
import { useStore } from '../store/useStore';
import AdminLayout from '../components/layout/AdminLayout';
import {
  Building2,
  FileText,
  Users,
  CheckCircle2,
  TrendingUp,
  Activity,
  ArrowUpRight,
  Clock,
  Briefcase,
  ShieldCheck,
  Building
} from 'lucide-react';
import { cn } from '../lib/utils';
import { useNavigate } from 'react-router-dom';

export default function AdminDashboardPage() {
  const { user, companies, users, forms, submissions, fetchCompanies, fetchUsers, fetchForms, fetchSubmissions } = useStore();
  const navigate = useNavigate();

  const isSuperAdmin = user?.role === 'super_admin';
  const isClientAdmin = user?.role === 'client_admin';

  React.useEffect(() => {
    if (isSuperAdmin) {
      fetchCompanies();
      fetchUsers();
      fetchForms();
      fetchSubmissions();
    } else if (isClientAdmin) {
      fetchUsers(); // fetchUsers already filters or handles based on role in backend/store? 
      // Actually fetchUsers in store calls GET /users which I updated to return company users for client admin.
      fetchForms(user?.companyId);
      fetchSubmissions(); // fetchSubmissions in store calls GET /submissions which I updated to scope by company.
    }
  }, [isSuperAdmin, isClientAdmin, user?.companyId, fetchCompanies, fetchUsers, fetchForms, fetchSubmissions]);

  // Statistics Calculation
  const stats = [
    {
      label: isSuperAdmin ? 'Partner Companies' : 'My Entity',
      value: isSuperAdmin ? companies.length : 1,
      icon: Building2,
      color: 'text-ns-blue',
      bg: 'bg-ns-blue/10',
      trend: isSuperAdmin ? '+12%' : 'Active',
      path: isSuperAdmin ? '/companies' : '/profile'
    },
    {
      label: 'Active Protocols',
      value: forms.length,
      icon: FileText,
      color: 'text-ns-blue',
      bg: 'bg-ns-blue/10',
      trend: '+5%',
      path: isSuperAdmin ? '/forms' : '/assign-forms'
    },
    {
      label: isSuperAdmin ? 'Global Staff' : 'Entity Personnel',
      value: isSuperAdmin ? users.length : users.filter(u => u.companyId === user?.companyId).length,
      icon: Users,
      color: 'text-ns-blue',
      bg: 'bg-ns-blue/10',
      trend: '+8%',
      path: isSuperAdmin ? '/staff' : '/employees'
    },
    {
      label: 'Total Submissions',
      value: submissions.length,
      icon: CheckCircle2,
      color: 'text-ns-blue',
      bg: 'bg-ns-blue/10',
      trend: '+24%',
      path: '/submissions'
    }
  ];

  return (
    <AdminLayout>
      <div className="space-y-10 pb-12">
        {/* Header Section */}
        <div className="flex justify-between items-end">
          <div>
            <div className="flex items-center gap-2 text-ns-blue mb-1">
              <ShieldCheck size={16} className="animate-pulse" />
              <span className="text-[10px] font-bold uppercase tracking-[0.2em]">
                {isSuperAdmin ? 'Global Intelligence Protocol' : 'Entity Command Protocol'}
              </span>
            </div>
            <h1 className="text-3xl font-black text-ns-text tracking-tight">
              {isSuperAdmin ? 'Executive Overview' : `${user?.companyName || 'Entity'} Command Center`}
            </h1>
            <p className="text-sm text-ns-text-muted mt-2 max-w-lg">
              {isSuperAdmin 
                ? "Monitoring ecosystem health, corporate synchronization, and transaction lifecycle metrics."
                : "Managing organizational workflows, employee authorization, and form processing synchronization."}
            </p>
          </div>
          <div className="flex gap-2">
            <div className="px-4 py-2 bg-white border border-ns-border rounded-sm ns-panel-shadow flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
              <span className="text-[10px] font-bold text-ns-text uppercase tracking-widest">
                {isSuperAdmin ? 'Cloud Infrastructure Secure' : 'Entity Access Authorized'}
              </span>
            </div>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              onClick={() => navigate(stat.path)}
              className="bg-white p-6 rounded-sm border border-ns-border ns-panel-shadow group hover:border-ns-blue transition-all cursor-pointer relative overflow-hidden"
            >
              <div className="flex justify-between items-start mb-4">
                <div className={cn("p-3 rounded-sm", stat.bg, stat.color)}>
                  <stat.icon size={20} />
                </div>
                <span className={cn(
                  "text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1",
                  stat.trend.includes('%') ? "text-green-600 bg-green-50" : "text-ns-blue bg-ns-blue/5"
                )}>
                  {stat.trend.includes('%') && <TrendingUp size={10} />} {stat.trend}
                </span>
              </div>
              <div className="space-y-1">
                <h3 className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest">{stat.label}</h3>
                <div className="flex items-baseline gap-2">
                  <p className="text-3xl font-black text-ns-navy">{stat.value}</p>
                  <ArrowUpRight size={14} className="text-gray-300 group-hover:text-ns-blue transition-colors" />
                </div>
              </div>
              <div className="absolute bottom-0 left-0 w-full h-[2px] bg-ns-blue scale-x-0 group-hover:scale-x-100 transition-transform origin-left" />
            </div>
          ))}
        </div>

        {/* Bottom Detailed Sections */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Recent Forms */}
          <div className="lg:col-span-2 space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-[11px] font-black text-ns-text uppercase tracking-[0.2em] flex items-center gap-2">
                <Briefcase size={14} className="text-ns-blue" />
                {isSuperAdmin ? 'Global Transaction Templates' : 'Active Personnel Protocols'}
              </h3>
              <button
                onClick={() => navigate(isSuperAdmin ? '/forms' : '/assign-forms')}
                className="text-[10px] font-bold text-ns-blue hover:underline uppercase tracking-widest"
              >
                View All
              </button>
            </div>
            <div className="bg-white rounded-sm border border-ns-border ns-panel-shadow overflow-hidden">
              <div className="divide-y divide-gray-100">
                {forms.slice(0, 5).map(form => (
                  <div key={form.id} className="p-5 flex items-center justify-between hover:bg-ns-light-blue/5 transition-colors group">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 bg-ns-gray-bg border border-ns-border rounded-sm flex items-center justify-center text-ns-navy/40 font-bold text-xs">
                        {form.transactionType.substring(0, 2).toUpperCase()}
                      </div>
                      <div>
                        <p className="text-sm font-bold text-ns-text group-hover:text-ns-blue transition-colors">{form.name}</p>
                        <p className="text-[10px] text-ns-text-muted font-medium uppercase tracking-wider">
                          {form.transactionType.replace('_', ' ')} • {isSuperAdmin ? `Entity: ${form.companyName || 'N/A'}` : `Assigned to ${form.assignedTo?.length || 0} users`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-ns-text-muted uppercase tracking-tighter">
                        {form.createdAt ? new Date(form.createdAt).toLocaleDateString() : 'N/A'}
                      </p>
                      <p className="text-[9px] text-gray-400 italic">ID: {form.id.substring(0, 8)}</p>
                    </div>
                  </div>
                ))}
                {forms.length === 0 && (
                  <div className="p-12 text-center text-ns-text-muted flex flex-col items-center">
                    <Activity size={32} className="opacity-20 mb-3" />
                    <p className="text-xs font-bold uppercase tracking-widest">No active forms detected</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Activity Feed */}
          <div className="space-y-6">
            <h3 className="text-[11px] font-black text-ns-text uppercase tracking-[0.2em] flex items-center gap-2">
              <Clock size={14} className="text-ns-blue" />
              Pulse Audit Log
            </h3>
            <div className="bg-white p-6 rounded-sm border border-ns-border ns-panel-shadow min-h-[400px]">
              <div className="space-y-8 relative before:absolute before:left-[11px] before:top-2 before:bottom-0 before:w-[1px] before:bg-gray-100">
                {submissions.slice(0, 6).map((sub, idx) => (
                  <div key={idx} className="relative pl-8">
                    <div className="absolute left-0 top-1 w-6 h-6 rounded-full bg-white border border-ns-border flex items-center justify-center z-10">
                      <div className={cn(
                        "w-2 h-2 rounded-full",
                        sub.status === 'approved' ? 'bg-green-500' : sub.status === 'rejected' ? 'bg-red-500' : 'bg-ns-blue'
                      )} />
                    </div>
                    <p className="text-[11px] font-bold text-ns-text">
                      {sub.status === 'approved' ? 'Sync Successful' : sub.status === 'rejected' ? 'Protocol Denied' : 'Submission Recorded'}
                    </p>
                    <p className="text-[10px] text-ns-text-muted mt-0.5 leading-relaxed">
                      {sub.userName} submitted <span className="text-ns-navy font-bold">{sub.formName}</span>
                    </p>
                    <p className="text-[9px] text-ns-blue font-bold uppercase tracking-widest mt-2">
                      {sub.submittedAt ? new Date(sub.submittedAt).toLocaleTimeString() : 'Recent'}
                    </p>
                  </div>
                ))}
                {submissions.length === 0 && (
                  <div className="opacity-40 italic text-xs py-10 text-center flex flex-col items-center gap-2">
                    <Clock size={24} />
                    <span>No recent activity detected.</span>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </AdminLayout>
  );
}
