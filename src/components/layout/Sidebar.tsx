import { useLocation, Link } from 'react-router-dom';
import React from 'react';
import { useCollapsibleSidebar } from '../func/collapsible';
import { apiFetch } from '@/lib/api';

type NavItem = { label: string; icon: string; path: string; count?: number };

const generalItems: NavItem[] = [
  { label: 'Dashboard', icon: 'fa-house', path: '/dashboard' },
  { label: 'Pesan Masuk', icon: 'fa-inbox', path: '/pesan' },
  { label: 'Layanan', icon: 'fa-layer-group', path: '/halaman' },
  { label: 'Artikel', icon: 'fa-newspaper', path: '/artikel' },
  { label: 'Media', icon: 'fa-images', path: '/media' },
];

const transactionItems: NavItem[] = [
  { label: 'Permintaan', icon: 'fa-clipboard-list', path: '/transaksi/permintaan' },
  { label: 'Peserta', icon: 'fa-user-check', path: '/transaksi/peserta' },
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

  // Unread enquiries, shown the way Shopify counts orders. The list endpoint
  // returns the count, so this costs no extra request beyond the first.
  const [newLeads, setNewLeads] = React.useState<number | undefined>(undefined);

  // Registrations waiting on payment, counted the same way.
  const [pending, setPending] = React.useState<number | undefined>(undefined);

  React.useEffect(() => {
    let cancelled = false;

    apiFetch('/api/leads?kind=enquiry&limit=1', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.new_count === 'number') {
          setNewLeads(data.new_count || undefined);
        }
      })
      .catch(() => undefined);

    apiFetch('/api/leads?stage=permintaan&limit=1', { credentials: 'include' })
      .then((res) => (res.ok ? res.json() : null))
      .then((data) => {
        if (!cancelled && data && typeof data.total === 'number') {
          setPending(data.total || undefined);
        }
      })
      .catch(() => undefined);

    return () => {
      cancelled = true;
    };
  }, [pathname]);

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

  const items = generalItems.map((item) =>
    item.path === '/pesan' ? { ...item, count: newLeads } : item,
  );

  return (
    <aside
      className={`${collapsed ? 'w-16' : 'w-56'} shrink-0 border-r border-[var(--p-border)] bg-[var(--p-bg)] px-3 py-3 transition-all duration-200`}
    >
      <nav className="sticky top-3 space-y-5">
        <ul className="space-y-0.5">{items.map(renderItem)}</ul>

        <div>
          {!collapsed && (
            <div className="px-2 pb-1 text-[0.6875rem] font-medium uppercase tracking-wide text-[var(--p-text-disabled)]">
              Transaksi
            </div>
          )}
          <ul className="space-y-0.5">
            {transactionItems
              .map((item) =>
                item.path === '/transaksi/permintaan' ? { ...item, count: pending } : item,
              )
              .map(renderItem)}
          </ul>
        </div>

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
