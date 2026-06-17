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
  PanelLeftClose,
  PanelLeft,
  Shield,
  Calendar,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSidebarExpanded } from '../../lib/useSidebarExpanded';
import { StatusBadge } from '../admin';

type NavItem = { name: string; icon: React.ElementType; path: string };

function NavLink({
  item,
  isActive,
  isExpanded,
}: {
  item: NavItem;
  isActive: boolean;
  isExpanded: boolean;
}) {
  return (
    <Link
      to={item.path}
      className={cn(
        'flex items-center rounded-ns-sm text-sm font-medium transition-all group/item whitespace-nowrap overflow-hidden',
        isExpanded ? 'py-2 gap-3 pl-[calc(0.75rem-3px)] pr-3' : 'px-0 py-2.5 justify-center',
        isActive ? 'ns-sidebar-active' : 'ns-sidebar-inactive',
      )}
      title={!isExpanded ? item.name : ''}
    >
      <item.icon
        size={18}
        className={cn(
          'flex-shrink-0',
          isActive ? 'text-ns-blue' : 'text-ns-text-muted group-hover/item:text-ns-text',
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
}

function NavSection({
  label,
  items,
  isExpanded,
  pathname,
}: {
  label: string;
  items: NavItem[];
  isExpanded: boolean;
  pathname: string;
}) {
  return (
    <>
      <div
        className={cn(
          'pt-4 pb-2 text-[10px] font-semibold text-ns-text-muted uppercase tracking-[0.15em] px-3 transition-all duration-300 whitespace-nowrap overflow-hidden',
          isExpanded ? 'opacity-100' : 'opacity-0 h-0 pt-0 pb-0',
        )}
      >
        {label}
      </div>
      <div className="space-y-0.5">
        {items.map(item => (
          <NavLink
            key={item.path}
            item={item}
            isActive={pathname === item.path || pathname.startsWith(item.path + '/')}
            isExpanded={isExpanded}
          />
        ))}
      </div>
    </>
  );
}

function SuperAdminSidebar({
  isExpanded,
  toggleSidebar,
  pathname,
  user,
  onLogout,
}: {
  isExpanded: boolean;
  toggleSidebar: () => void;
  pathname: string;
  user: { name?: string } | null;
  onLogout: () => void;
}) {
  const coreNav: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Companies', icon: Building2, path: '/companies' },
    { name: 'Forms', icon: FileText, path: '/forms' },
    { name: 'Templates', icon: Library, path: '/templates' },
    { name: 'Submissions', icon: Database, path: '/submissions' },
  ];

  const masterDataNav: NavItem[] = [
    { name: 'Purchase Order', path: '/catalogue/purchase-order', icon: ShoppingCart },
    { name: 'Sales Order', path: '/catalogue/sales-order', icon: Tag },
    { name: 'Accounts Payable', path: '/catalogue/ap', icon: CreditCard },
    { name: 'Accounts Receivable', path: '/catalogue/ar', icon: Receipt },
    { name: 'Item Receipt', path: '/catalogue/item-receipt', icon: Receipt },
    { name: 'Vendor Bill', path: '/catalogue/vendor-bill', icon: Receipt },
  ];

  return (
    <aside
      className={cn(
        'bg-ns-sidebar-bg h-screen flex-shrink-0 flex flex-col border-r border-ns-sidebar-border z-30 transition-all duration-300',
        isExpanded ? 'w-60' : 'w-16',
      )}
    >
      <div
        className={cn(
          'ns-sidebar-header transition-all',
          isExpanded ? 'justify-between gap-2' : 'justify-center',
        )}
      >
        {isExpanded && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-white/20 border border-white/25 rounded-ns-md flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
              NS
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">NetSuite Forms</p>
              <p className="text-[10px] text-white/70 truncate">Admin</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex-shrink-0 p-1.5 rounded-ns-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <NavSection label="Main menu" items={coreNav} isExpanded={isExpanded} pathname={pathname} />
        <NavSection label="Field library" items={masterDataNav} isExpanded={isExpanded} pathname={pathname} />
      </nav>

      <div className="p-3 border-t border-ns-sidebar-border">
        <div
          className={cn(
            'flex items-center mb-3',
            isExpanded ? 'gap-2.5 px-1' : 'justify-center',
          )}
        >
          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-ns-blue text-white flex items-center justify-center text-xs font-semibold">
            {user?.name?.substring(0, 2).toUpperCase() || 'SA'}
          </div>
          {isExpanded && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ns-text truncate">{user?.name}</p>
              <p className="text-[10px] text-ns-text-muted">Super Admin</p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className={cn(
            'w-full flex items-center text-ns-text-muted hover:text-ns-text hover:bg-ns-page-bg transition-all rounded-ns-md text-xs font-medium',
            isExpanded ? 'gap-2 py-2 px-3' : 'justify-center py-2',
          )}
          title="Sign out"
        >
          <LogOut size={14} />
          {isExpanded && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

function ClientAdminSidebar({
  isExpanded,
  toggleSidebar,
  pathname,
  user,
  onLogout,
}: {
  isExpanded: boolean;
  toggleSidebar: () => void;
  pathname: string;
  user: { name?: string } | null;
  onLogout: () => void;
}) {
  const menuItems: NavItem[] = [
    { name: 'Dashboard', icon: LayoutDashboard, path: '/dashboard' },
    { name: 'Employees', icon: Users, path: '/employees' },
    { name: 'Assign Forms', icon: FileText, path: '/assign-forms' },
    { name: 'Workflow', icon: GitBranch, path: '/workflow' },
    { name: 'Submissions', icon: Database, path: '/submissions' },
    { name: 'Profile', icon: UserCircle, path: '/profile' },
  ];

  return (
    <aside
      className={cn(
        'bg-ns-sidebar-bg h-screen flex-shrink-0 flex flex-col border-r border-ns-sidebar-border z-30 transition-all duration-300',
        isExpanded ? 'w-60' : 'w-16',
      )}
    >
      <div
        className={cn(
          'ns-sidebar-header transition-all',
          isExpanded ? 'justify-between gap-2' : 'justify-center',
        )}
      >
        {isExpanded && (
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 bg-white/20 border border-white/25 rounded-ns-md flex-shrink-0 flex items-center justify-center text-xs font-bold text-white">
              FB
            </div>
            <div className="min-w-0">
              <p className="font-semibold text-sm text-white truncate">FormBridge</p>
              <p className="text-[10px] text-white/70 truncate">Company admin</p>
            </div>
          </div>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          className="flex-shrink-0 p-1.5 rounded-ns-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
          title={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
        >
          {isExpanded ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
        </button>
      </div>

      <nav className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar overflow-x-hidden">
        <NavSection label="Company admin" items={menuItems} isExpanded={isExpanded} pathname={pathname} />
      </nav>

      <div className="p-3 border-t border-ns-sidebar-border">
        <div className={cn('flex items-center mb-3', isExpanded ? 'gap-2.5 px-1' : 'justify-center')}>
          <div className="w-8 h-8 flex-shrink-0 rounded-full bg-ns-blue text-white flex items-center justify-center text-xs font-semibold">
            {user?.name?.substring(0, 2).toUpperCase() || 'CA'}
          </div>
          {isExpanded && (
            <div className="min-w-0">
              <p className="text-xs font-semibold text-ns-text truncate">{user?.name}</p>
              <p className="text-[10px] text-ns-text-muted">Client Admin</p>
            </div>
          )}
        </div>
        <button
          onClick={onLogout}
          className={cn(
            'w-full flex items-center text-ns-text-muted hover:text-ns-text hover:bg-ns-page-bg transition-all rounded-ns-md text-xs font-medium',
            isExpanded ? 'gap-2 py-2 px-3' : 'justify-center py-2',
          )}
        >
          <LogOut size={14} />
          {isExpanded && <span>Sign out</span>}
        </button>
      </div>
    </aside>
  );
}

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { user, logout } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { isExpanded, toggle: toggleSidebar } = useSidebarExpanded('admin-sidebar-expanded');
  const isSuperAdmin = user?.role === 'super_admin';

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const initials = user?.name
    ?.split(' ')
    .map(n => n[0])
    .join('')
    .substring(0, 2)
    .toUpperCase() || 'U';

  return (
    <div className="h-screen bg-ns-page-bg flex overflow-hidden">
      {isSuperAdmin ? (
        <SuperAdminSidebar
          isExpanded={isExpanded}
          toggleSidebar={toggleSidebar}
          pathname={location.pathname}
          user={user}
          onLogout={handleLogout}
        />
      ) : (
        <ClientAdminSidebar
          isExpanded={isExpanded}
          toggleSidebar={toggleSidebar}
          pathname={location.pathname}
          user={user}
          onLogout={handleLogout}
        />
      )}

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 ns-header-bar flex items-center justify-between px-6 z-20 flex-shrink-0">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            {isSuperAdmin ? (
              <div className="hidden sm:flex items-center gap-2 text-white/80">
                <Shield size={14} className="text-white" />
                <span className="text-xs font-medium">NetSuite Forms · Admin</span>
              </div>
            ) : (
              <div className="relative max-w-md w-full">
                <Search className="absolute left-3 top-2.5 text-ns-text-muted" size={14} />
                <input
                  type="text"
                  placeholder="Search forms, companies, or users…"
                  className="w-full pl-9 pr-4 py-2 text-xs bg-white border border-ns-border rounded-ns-md focus:outline-none focus:border-ns-tab-selected text-ns-text"
                />
              </div>
            )}
          </div>

          <div className="flex items-center gap-3">
            {isSuperAdmin && (
              <>
                <button
                  type="button"
                  className="hidden md:flex items-center gap-2 px-3 py-1.5 text-xs text-white/90 border border-white/25 rounded-ns-md hover:bg-white/10 transition-colors"
                >
                  <Calendar size={14} />
                  {new Date().toLocaleDateString('en-US', { month: 'short', year: 'numeric' })}
                </button>
                <button className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-ns-md transition-colors">
                  <Bell size={18} />
                  <span className="absolute top-1.5 right-1.5 min-w-[16px] h-4 px-1 bg-status-pending text-white text-[9px] font-bold rounded-full flex items-center justify-center">
                    5
                  </span>
                </button>
                <StatusBadge variant="pending" dot className="hidden sm:inline-flex bg-white/15 text-white border-white/25">
                  Connected to NetSuite
                </StatusBadge>
              </>
            )}
            {!isSuperAdmin && (
              <>
                <button className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-ns-md transition-colors">
                  <Bell size={18} />
                  <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-pending rounded-full border-2 border-ns-blue" />
                </button>
                <span className="text-xs font-medium text-white/80 hidden sm:inline">Client Admin</span>
              </>
            )}
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-semibold hover:bg-white/30 transition-colors border border-white/25"
              title="Profile"
            >
              {initials}
            </Link>
            {isSuperAdmin && (
              <Link
                to="/profile"
                className="p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-ns-md transition-colors"
              >
                <Settings size={18} />
              </Link>
            )}
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-ns-page-bg custom-scrollbar">
          <div className="max-w-[1400px] mx-auto p-6 lg:p-8 animate-in fade-in duration-300">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
