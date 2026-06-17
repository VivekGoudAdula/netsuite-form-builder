import * as React from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useStore } from '../../store/useStore';
import {
  Home,
  LogOut,
  Bell,
  Building,
  Settings,
  UserCircle,
  PanelLeftClose,
  PanelLeft,
} from 'lucide-react';
import { cn } from '../../lib/utils';
import { useSidebarExpanded } from '../../lib/useSidebarExpanded';
import { StatusBadge } from '../admin';
import { getAssignedTransactionNavItems } from '../../lib/transactionRegistry';

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
        'flex items-center rounded-ns-sm text-sm font-medium transition-all whitespace-nowrap overflow-hidden',
        isExpanded ? 'py-2 gap-3 pl-[calc(0.75rem-3px)] pr-3' : 'px-0 py-2.5 justify-center',
        isActive ? 'ns-sidebar-active' : 'ns-sidebar-inactive',
      )}
      title={!isExpanded ? item.name : ''}
    >
      <item.icon size={18} className={cn('flex-shrink-0', isActive ? 'text-ns-blue' : 'text-ns-text-muted')} />
      <span className={cn('transition-all duration-300', isExpanded ? 'opacity-100' : 'opacity-0 w-0 overflow-hidden')}>
        {item.name}
      </span>
    </Link>
  );
}

export default function CustomerLayout({ children }: { children: React.ReactNode }) {
  const { user, logout, companies = [], myAssignedForms, fetchMyAssignedForms } = useStore();
  const navigate = useNavigate();
  const location = useLocation();
  const { isExpanded, toggle: toggleSidebar } = useSidebarExpanded('customer-sidebar-expanded');

  const company = user?.companyId ? companies.find(c => c.id === user.companyId) : null;

  const isEmployeeUser = user?.role === 'user' || user?.role === 'manager';

  React.useEffect(() => {
    if (isEmployeeUser) {
      fetchMyAssignedForms();
    }
  }, [isEmployeeUser, user?.id, fetchMyAssignedForms, location.pathname]);

  const handleLogout = () => {
    logout();
    navigate('/');
  };

  const mainNav: NavItem[] = [{ name: 'Overview', icon: Home, path: '/customer-dashboard' }];
  const transactionNav: NavItem[] = React.useMemo(
    () => getAssignedTransactionNavItems(myAssignedForms),
    [myAssignedForms],
  );
  const accountNav: NavItem[] = [{ name: 'Profile', icon: UserCircle, path: '/profile' }];

  const initials =
    user?.name
      ?.split(' ')
      .map(n => n[0])
      .join('')
      .substring(0, 2)
      .toUpperCase() || 'U';

  const renderSection = (label: string, items: NavItem[]) => (
    <>
      <div
        className={cn(
          'pt-4 pb-2 text-[10px] font-semibold text-ns-text-muted uppercase tracking-[0.15em] px-3',
          isExpanded ? 'opacity-100' : 'opacity-0 h-0 pt-0 pb-0 overflow-hidden',
        )}
      >
        {label}
      </div>
      <div className="space-y-0.5">
        {items.map(item => (
          <NavLink
            key={item.path}
            item={item}
            isActive={location.pathname === item.path}
            isExpanded={isExpanded}
          />
        ))}
      </div>
    </>
  );

  return (
    <div className="h-screen bg-ns-page-bg flex overflow-hidden">
      <aside
        className={cn(
          'bg-ns-sidebar-bg h-screen flex-shrink-0 flex flex-col border-r border-ns-sidebar-border z-30 transition-all duration-300',
          isExpanded ? 'w-60' : 'w-16',
        )}
      >
        <div
          className={cn(
            'ns-sidebar-header',
            isExpanded ? 'justify-between gap-2' : 'justify-center',
          )}
        >
          {isExpanded && (
            <div className="flex items-center gap-2.5 min-w-0">
              <div className="w-8 h-8 bg-white/20 border border-white/25 rounded-ns-md flex items-center justify-center text-xs font-bold text-white">
                VP
              </div>
              <div className="min-w-0">
                <p className="font-semibold text-sm text-white truncate">Supplier portal</p>
                <p className="text-[10px] text-white/70 truncate">Powered by NetSuite Forms</p>
              </div>
            </div>
          )}
          <button
            type="button"
            onClick={toggleSidebar}
            className="p-1.5 rounded-ns-md text-white/80 hover:text-white hover:bg-white/10 transition-colors"
            aria-label={isExpanded ? 'Collapse sidebar' : 'Expand sidebar'}
          >
            {isExpanded ? <PanelLeftClose size={18} /> : <PanelLeft size={18} />}
          </button>
        </div>

        <nav className="flex-1 px-3 py-3 overflow-y-auto custom-scrollbar">
          {renderSection('My account', mainNav)}
          {transactionNav.length > 0 && renderSection('Transactions', transactionNav)}
          {renderSection('Help', accountNav)}
        </nav>

        <div className="p-3 border-t border-ns-sidebar-border">
          <div className={cn('flex items-center mb-3', isExpanded ? 'gap-2.5 px-1' : 'justify-center')}>
            <div className="w-8 h-8 rounded-full bg-status-approved text-white flex items-center justify-center text-xs font-semibold">
              {initials}
            </div>
            {isExpanded && (
              <div className="min-w-0">
                <p className="text-xs font-semibold text-ns-text truncate">{user?.name}</p>
                <p className="text-[10px] text-ns-text-muted truncate">{user?.companyName}</p>
              </div>
            )}
          </div>
          {(user?.role === 'super_admin' || user?.role === 'client_admin') && (
            <button
              onClick={() => navigate('/dashboard')}
              className={cn(
                'w-full flex items-center text-ns-blue hover:bg-ns-blue-soft transition-all rounded-ns-md text-xs font-medium mb-2',
                isExpanded ? 'gap-2 py-2 px-3' : 'justify-center py-2',
              )}
            >
              <Settings size={14} />
              {isExpanded && <span>Switch to admin</span>}
            </button>
          )}
          <button
            onClick={handleLogout}
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

      <div className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <header className="h-14 ns-header-bar flex items-center justify-between px-6 z-20">
          <div className="flex items-center gap-3 flex-1 min-w-0">
            <div className="flex items-center gap-2 px-3 py-1.5 bg-white/15 rounded-ns-md border border-white/25">
              <Building size={14} className="text-white" />
              <span className="text-xs font-medium text-white">{company?.name || user?.companyName || 'My company'}</span>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <button className="relative p-2 text-white/80 hover:text-white hover:bg-white/10 rounded-ns-md transition-colors">
              <Bell size={18} />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-status-pending rounded-full border-2 border-ns-blue" />
            </button>
            <StatusBadge variant="synced" dot className="hidden sm:inline-flex bg-white/15 text-white border-white/25">
              Connected to NetSuite
            </StatusBadge>
            <Link
              to="/profile"
              className="w-8 h-8 rounded-full bg-white/20 text-white flex items-center justify-center text-xs font-semibold hover:bg-white/30 transition-colors border border-white/25"
            >
              {initials}
            </Link>
          </div>
        </header>

        <main className="flex-1 overflow-auto bg-ns-page-bg custom-scrollbar">
          <div className="max-w-[1400px] mx-auto p-6 lg:p-8 animate-in fade-in duration-300">{children}</div>
        </main>
      </div>
    </div>
  );
}
