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
  Search,
  ShoppingCart,
  Tag,
  CreditCard,
  Receipt,
  Users,
  GitBranch,
  UserCircle,
  DollarSign,
  Hash,
  MapPin,
} from 'lucide-react';
import { cn } from '../../lib/utils';

function MasterDataNav({
  isExpanded,
  pathname,
}: {
  isExpanded: boolean;
  pathname: string;
}) {
  const items = [
    { name: 'Employees', path: '/employees', icon: Users },
    { name: 'Currency', path: '/master-data/currencies', icon: DollarSign },
    { name: 'HSN Codes', path: '/master-data/hsn-codes', icon: Hash },
    { name: 'Locations', path: '/master-data/locations', icon: MapPin },
  ];
  return (
    <>
      <MasterDataNavHeader isExpanded={isExpanded} />
      {items.map(item => {
        const isActive = pathname === item.path;
        return (
          <Link
            key={item.name}
            to={item.path}
            className={cn(
              'flex items-center rounded-sm text-sm font-semibold transition-all group/item whitespace-nowrap overflow-hidden relative',
              isExpanded ? 'px-3 py-2.5 gap-3' : 'px-0 py-3 justify-center gap-0',
              isActive
                ? 'bg-ns-blue text-white shadow-lg shadow-ns-blue/20'
                : 'text-white/60 hover:text-white hover:bg-white/5',
            )}
            title={!isExpanded ? item.name : ''}
          >
            <item.icon
              size={18}
              className={cn(
                'flex-shrink-0 transition-colors',
                isActive ? 'text-white' : 'text-white/40 group-hover/item:text-white',
              )}
            />
            <span
              className={cn(
                'transition-all duration-300 origin-left overflow-hidden',
                isExpanded ? 'opacity-100 w-auto' : 'opacity-0 w-0',
              )}
            >
              {item.name}
            </span>
          </Link>
        );
      })}
    </>
  );
}

function MasterDataNavHeader({ isExpanded }: { isExpanded: boolean }) {
  return (
    <div
      className={cn(
        'pt-6 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-3 mb-4 transition-all duration-300 whitespace-nowrap overflow-hidden',
        isExpanded ? 'opacity-100' : 'opacity-0',
      )}
    >
      Master Data
    </div>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const [isExpanded, setIsExpanded] = React.useState(false);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const superAdminMenu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Companies', icon: Building2, path: '/companies' },
    { name: 'Forms', icon: FileText, path: '/forms' },
    { name: 'Templates', icon: Library, path: '/templates' },
    { name: 'Submissions', icon: Database, path: '/submissions' },
  ];

  const clientAdminMenu = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Employees', icon: Users, path: '/employees' },
    { name: 'Assign Forms', icon: FileText, path: '/assign-forms' },
    { name: 'Workflow', icon: GitBranch, path: '/workflow' },
    { name: 'Submissions', icon: Database, path: '/submissions' },
    { name: 'Profile', icon: UserCircle, path: '/profile' },
  ];

  const menuItems = user?.role === 'super_admin' ? superAdminMenu : clientAdminMenu;

  return (
    <div className="h-screen bg-ns-gray-bg flex overflow-hidden">
      {/* Sidebar */}
      <aside
        onMouseEnter={() => setIsExpanded(true)}
        onMouseLeave={() => setIsExpanded(false)}
        className={cn(
          "bg-ns-navy h-screen flex-shrink-0 flex flex-col shadow-2xl z-30 transition-all duration-500 ease-[cubic-bezier(0.2,0,0,1)] relative group/sidebar",
          isExpanded ? "w-64" : "w-16"
        )}
      >
        <div className={cn("p-6 flex items-center gap-3 transition-all duration-300", !isExpanded && "px-6")}>
          <div className="w-8 h-8 bg-ns-blue rounded-sm flex-shrink-0 flex items-center justify-center font-bold text-lg shadow-inner text-white">N</div>
          <span className={cn(
            "font-bold text-lg tracking-tight text-white italic transition-all duration-300 origin-left overflow-hidden",
            isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
          )}>
            FormBridge
          </span>
        </div>

        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto custom-scrollbar overflow-x-hidden">
          <div className={cn(
            "pt-2 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-3 mb-4 transition-all duration-300 whitespace-nowrap overflow-hidden",
            isExpanded ? "opacity-100" : "opacity-0"
          )}>
            {user?.role === 'super_admin' ? 'Global Management' : 'Company Admin'}
          </div>
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.name}
                to={item.path}
                className={cn(
                  "flex items-center rounded-sm text-sm font-semibold transition-all group/item whitespace-nowrap overflow-hidden relative",
                  isExpanded ? "px-3 py-2.5 gap-3" : "px-0 py-3 justify-center gap-0",
                  isActive
                    ? "bg-ns-blue text-white shadow-lg shadow-ns-blue/20"
                    : "text-white/60 hover:text-white hover:bg-white/5"
                )}
                title={!isExpanded ? item.name : ""}
              >
                <item.icon size={18} className={cn("flex-shrink-0 transition-colors", isActive ? "text-white" : "text-white/40 group-hover/item:text-white")} />
                <span className={cn(
                  "transition-all duration-300 origin-left overflow-hidden",
                  isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                )}>
                  {item.name}
                </span>
              </Link>
            );
          })}

          {(user?.role === 'super_admin' || user?.role === 'client_admin') && (
            <MasterDataNav isExpanded={isExpanded} pathname={location.pathname} />
          )}

          {user?.role === 'super_admin' && (
            <>
              <div className={cn(
                "pt-6 text-[10px] font-bold text-white/40 uppercase tracking-[0.2em] px-3 mb-4 transition-all duration-300 whitespace-nowrap overflow-hidden",
                isExpanded ? "opacity-100" : "opacity-0"
              )}>
                Catalogue
              </div>
              {[
                { name: 'Purchase Order', path: '/catalogue/purchase-order', icon: ShoppingCart },
                { name: 'Sales Order', path: '/catalogue/sales-order', icon: Tag },
                { name: 'Accounts Payable', path: '/catalogue/ap', icon: CreditCard },
                { name: 'Accounts Receivable', path: '/catalogue/ar', icon: Receipt },
              ].map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <Link
                    key={item.name}
                    to={item.path}
                    className={cn(
                      "flex items-center rounded-sm text-sm font-semibold transition-all group/item whitespace-nowrap overflow-hidden relative",
                      isExpanded ? "px-3 py-2.5 gap-3" : "px-0 py-3 justify-center gap-0",
                      isActive
                        ? "bg-ns-blue text-white shadow-lg shadow-ns-blue/20"
                        : "text-white/60 hover:text-white hover:bg-white/5"
                    )}
                    title={!isExpanded ? item.name : ""}
                  >
                    <item.icon size={18} className={cn("flex-shrink-0 transition-colors", isActive ? "text-white" : "text-white/40 group-hover/item:text-white")} />
                    <span className={cn(
                      "transition-all duration-300 origin-left overflow-hidden",
                      isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
                    )}>
                      {item.name}
                    </span>
                  </Link>
                );
              })}
            </>
          )}
        </nav>

        <div className="p-4 bg-black/20 mt-auto border-t border-white/5 overflow-hidden">
          <div className={cn("flex items-center mb-4 transition-all duration-300", isExpanded ? "gap-3 px-2" : "gap-0 px-0 justify-center")}>
            <div className="w-9 h-9 flex-shrink-0 rounded-full bg-ns-blue/20 border border-ns-blue/30 flex items-center justify-center text-ns-blue">
              <User size={18} />
            </div>
            <div className={cn(
              "flex flex-col overflow-hidden transition-all duration-300 origin-left",
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}>
              <span className="text-xs font-bold text-white truncate">{user?.name}</span>
              <span className="text-[10px] text-white/40 font-semibold uppercase tracking-wider truncate">
                {user?.role === 'super_admin' ? 'Super Admin' : 'Client Admin'}
              </span>
            </div>
          </div>
          <button
            onClick={handleLogout}
            className={cn(
              "w-full flex items-center justify-center transition-all rounded-sm border border-white/5",
              isExpanded ? "gap-2 py-2 px-4 shadow-inner bg-white/5" : "gap-0 py-3 px-0 bg-transparent border-none"
            )}
            title={!isExpanded ? "Sign Out" : ""}
          >
            <LogOut size={14} className="text-white/60" />
            <span className={cn(
              "text-xs font-bold text-white/60 transition-all duration-300 overflow-hidden",
              isExpanded ? "opacity-100 w-auto" : "opacity-0 w-0"
            )}>
              Sign Out
            </span>
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
              <span className="text-[10px] font-bold text-ns-text-muted uppercase tracking-widest leading-none">
                {user?.role === 'super_admin' ? 'Super Admin' : 'Client Admin'}
              </span>
              <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            </div>
            {user?.role === 'super_admin' && (
              <Link to="/profile" className="text-ns-text-muted hover:text-ns-navy transition-colors">
                <Settings size={18} />
              </Link>
            )}
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
