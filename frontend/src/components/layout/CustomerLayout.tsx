import * as React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { 
  Home, 
  FileText, 
  Clock,
  CheckCircle,
  LogOut,
  User,
  Bell,
  Building
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, companies } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const company = companies.find(c => c.id === user?.companyId);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard', icon: Home, path: '/customer-dashboard' },
    { name: 'My Assignments', icon: FileText, path: '/customer-dashboard' },
    { name: 'My Approvals', icon: CheckCircle, path: '/my-approvals' },
  ];

  return (
    <div className="min-h-screen bg-[#f8fafc] flex flex-col">
      {/* Top Navigation */}
      <header className="h-16 bg-white border-b border-ns-border flex items-center justify-between px-8 sticky top-0 z-40 shadow-sm">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 bg-ns-navy rounded-sm flex items-center justify-center font-bold text-lg shadow-lg text-white">N</div>
            <div className="flex flex-col">
              <span className="font-bold text-sm tracking-tight text-ns-navy leading-none">NetSuite Mobile</span>
              <span className="text-[10px] text-ns-text-muted font-bold uppercase tracking-widest mt-0.5">Customer Portal</span>
            </div>
          </div>
          
          <div className="h-6 w-[1px] bg-ns-border mx-2" />
          
          <div className="flex items-center gap-2 px-3 py-1.5 bg-ns-gray-bg rounded-sm border border-ns-border">
            <Building size={14} className="text-ns-blue" />
            <span className="text-xs font-bold text-ns-navy">{company?.name || 'Authorized Entity'}</span>
          </div>
        </div>

        <div className="flex items-center gap-6">
          <button className="text-ns-text-muted hover:text-ns-blue transition-colors relative">
            <Bell size={18} />
            <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-red-500 rounded-full border-2 border-white"></span>
          </button>
          
          <div className="flex items-center gap-3 pl-6 border-l border-ns-border">
            <div className="text-right hidden sm:block">
              <p className="text-xs font-bold text-ns-navy leading-none">{user?.name}</p>
              <p className="text-[10px] text-ns-text-muted mt-1 uppercase font-bold tracking-tighter">{user?.jobTitle}</p>
            </div>
            <div className="w-10 h-10 rounded-full bg-ns-blue text-white flex items-center justify-center font-bold shadow-md border-2 border-white">
              {user?.name?.substring(0, 1)}
            </div>
            <button 
              onClick={handleLogout}
              className="p-2 text-ns-text-muted hover:text-red-500 hover:bg-red-50 rounded-full transition-all"
              title="End Session"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <div className="flex-1 flex overflow-hidden">
        {/* Sidebar Mini */}
        <aside className="w-20 bg-ns-navy flex-shrink-0 flex flex-col items-center py-8 gap-6 shadow-xl z-30">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "w-12 h-12 flex flex-col items-center justify-center rounded-sm transition-all group relative",
                  isActive ? "bg-ns-blue text-white" : "text-white/40 hover:text-white hover:bg-white/5"
                )}
                title={item.name}
              >
                <item.icon size={22} />
                {isActive && <div className="absolute left-0 w-1 h-6 bg-white rounded-r-full" />}
              </Link>
            );
          })}
        </aside>

        {/* Viewport */}
        <main className="flex-1 overflow-auto bg-[#f8fafc] custom-scrollbar">
          <div className="p-8 max-w-6xl mx-auto">
            {children}
          </div>
        </main>
      </div>
      
      {/* Footer Info */}
      <footer className="bg-white border-t border-ns-border py-2 px-8 flex justify-between items-center text-[10px] text-ns-text-muted font-bold uppercase tracking-widest">
        <div className="flex gap-4">
          <span>Security Token: AX-9902</span>
          <span>Environment: Production 2024.1</span>
        </div>
        <span>Oracle Corporate Identity Provider</span>
      </footer>
    </div>
  );
}
