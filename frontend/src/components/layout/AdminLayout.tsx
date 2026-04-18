import * as React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import { 
  LayoutDashboard, 
  Building2, 
  FileText, 
  Library, 
  Database,
  LogOut,
  User,
  Settings,
  Bell,
  Search
} from 'lucide-react';
import { cn } from '../../lib/utils';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const menuItems = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Companies', icon: Building2, path: '/companies' },
    { name: 'Forms', icon: FileText, path: '/dashboard' }, // Reusing dashboard for forms list
    { name: 'Templates', icon: Library, path: '/templates' },
    { name: 'Submissions', icon: Database, path: '/submissions' },
  ];

  return (
    <div className="min-h-screen bg-ns-gray-bg flex overflow-hidden">
      {/* Sidebar */}
      <aside className="w-64 bg-ns-navy flex-shrink-0 flex flex-col shadow-2xl z-30">
        <div className="p-6 flex items-center gap-3">
          <div className="w-8 h-8 bg-ns-blue rounded-sm flex items-center justify-center font-bold text-lg shadow-inner text-white">N</div>
          <span className="font-bold text-lg tracking-tight text-white italic">FormBridge</span>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1">
          <div className="text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-3 mb-4">Management Console</div>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path || (item.path === '/dashboard' && location.pathname === '/dashboard');
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center gap-3 px-3 py-2.5 rounded-sm text-sm font-semibold transition-all group",
                  isActive 
                    ? "bg-ns-blue text-white shadow-lg shadow-ns-blue/20" 
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
              >
                <item.icon size={18} className={cn(isActive ? "text-white" : "text-white/40 group-hover:text-white")} />
                {item.name}
              </Link>
            );
          })}
        </nav>
        
        <div className="p-4 bg-black/20 mt-auto border-t border-white/5">
          <div className="flex items-center gap-3 mb-4 px-2">
            <div className="w-9 h-9 rounded-full bg-ns-blue/20 border border-ns-blue/30 flex items-center justify-center text-ns-blue">
              <User size={18} />
            </div>
            <div className="flex flex-col overflow-hidden">
              <span className="text-xs font-bold text-white truncate">{user?.name}</span>
              <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider">System Admin</span>
            </div>
          </div>
          <button 
            onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 py-2 text-xs font-bold text-white/60 hover:text-white bg-white/5 hover:bg-white/10 transition-all rounded-sm border border-white/5"
          >
            <LogOut size={14} />
            Sign Out
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        {/* Header */}
        <header className="h-16 bg-white border-b border-ns-border flex items-center justify-between px-8 z-20">
          <div className="flex items-center gap-4 flex-1">
            <div className="relative max-w-md w-full">
              <Search className="absolute left-3 top-2.5 text-gray-400" size={14} />
              <input 
                type="text" 
                placeholder="Search resources, forms, or users..." 
                className="w-full pl-9 pr-4 py-2 text-xs bg-ns-gray-bg border border-ns-border rounded-sm focus:outline-none focus:border-ns-blue transition-all"
              />
            </div>
          </div>
          
          <div className="flex items-center gap-6">
            <button className="text-ns-text-muted hover:text-ns-blue transition-colors p-1 relative">
              <Bell size={18} />
              <span className="absolute top-0 right-0 w-2 h-2 bg-ns-blue rounded-full border-2 border-white"></span>
            </button>
            <div className="h-4 w-[1px] bg-ns-border" />
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest leading-none">Internal Protocol</span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            <button className="text-ns-text-muted hover:text-ns-navy transition-colors">
              <Settings size={18} />
            </button>
          </div>
        </header>

        {/* Viewport */}
        <main className="flex-1 overflow-auto p-8 bg-[#f5f7f9] custom-scrollbar">
          <div className="max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-2 duration-500">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
