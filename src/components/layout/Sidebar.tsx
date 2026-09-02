import { useLocation, Link } from 'react-router-dom';
import { useCollapsibleSidebar } from '../func/collapsible';

type NavItem = { label: string; icon: string; path: string; count?: number };

const generalItems: NavItem[] = [
  { label: 'Dashboard', icon: 'fa-house', path: '/dashboard' },
  { label: 'Layanan', icon: 'fa-layer-group', path: '/halaman' },
  { label: 'Artikel', icon: 'fa-newspaper', path: '/artikel' },
  { label: 'Media', icon: 'fa-images', path: '/media' },
];

const masterItems: NavItem[] = [{ label: 'Kategori', icon: 'fa-tags', path: '/category' }];

/**
 * Flat navigation on the page background, the way Shopify's is: no card, no
 * elevation, and an active state that is a soft grey pill rather than a
 * saturated fill.
 */
const Sidebar = () => {
  const { pathname } = useLocation();
  const { collapsed, toggleCollapsed } = useCollapsibleSidebar();

  const renderItem = (item: NavItem) => {
    const active = pathname === item.path || pathname.startsWith(`${item.path}/`);
    return (
      <li key={item.path}>
        <Link
          to={item.path}
          title={collapsed ? item.label : undefined}
          className={`group flex items-center gap-2.5 rounded-lg px-2 py-1.5 text-[0.8125rem] transition-colors ${
            active
              ? 'bg-[var(--p-nav-active)] font-semibold text-[var(--p-text)]'
              : 'text-[var(--p-text)] hover:bg-[#e7e7e7]'
          }`}
        >
          <i
            className={`fa ${item.icon} w-4 text-center text-[0.8125rem] ${
              active ? 'text-[var(--p-text)]' : 'text-[var(--p-text-secondary)]'
            }`}
            aria-hidden="true"
          />
          {!collapsed && <span className="truncate">{item.label}</span>}
          {!collapsed && item.count !== undefined && (
            <span className="ml-auto text-xs text-[var(--p-text-secondary)]">{item.count}</span>
          )}
        </Link>
      </li>
    );
  };

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-56'} shrink-0 border-r border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-3 transition-all duration-200`}
    >
      <nav className="sticky top-3 space-y-5">
        <ul className="space-y-0.5">{generalItems.map(renderItem)}</ul>

        <div>
          {!collapsed && (
            <div className="px-2 pb-1 text-[0.6875rem] font-medium uppercase tracking-wide text-[var(--p-text-disabled)]">
              Master
            </div>
          )}
          <ul className="space-y-0.5">{masterItems.map(renderItem)}</ul>
        </div>

        <button
          type="button"
          onClick={toggleCollapsed}
          aria-label={collapsed ? 'Lebarkan navigasi' : 'Ciutkan navigasi'}
          className="flex w-full items-center gap-2.5 rounded-lg px-2 py-1.5 text-[0.8125rem] text-[var(--p-text-secondary)] hover:bg-[#e7e7e7]"
        >
          <i
            className={`fa ${collapsed ? 'fa-chevron-right' : 'fa-chevron-left'} w-4 text-center text-xs`}
            aria-hidden="true"
          />
          {!collapsed && <span>Ciutkan</span>}
        </button>
      </nav>
    </aside>
  );
};

export default Sidebar;
