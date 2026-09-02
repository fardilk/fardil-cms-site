import React from 'react';
import { useNavigate } from 'react-router-dom';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import { logout } from '../func/logout';

type GlobalLayoutProps = {
  children: React.ReactNode;
  /** Kept for callers that still pass it; rendered above the content. */
  breadcrumbRight?: React.ReactNode;
  /** Wide pages (tables, galleries) can opt out of the reading-width cap. */
  wide?: boolean;
};

const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children, breadcrumbRight, wide = false }) => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-screen flex-col overflow-hidden bg-[var(--p-bg)]">
      {/* The bar spans the full width above the navigation, framing the app. */}
      <Topbar onLogout={() => logout(navigate)} />
      <div className="flex min-h-0 flex-1">
        <Sidebar />
        <main className="min-w-0 flex-1 overflow-auto">
          <div className={`mx-auto px-6 py-6 ${wide ? 'max-w-[1400px]' : 'max-w-[1000px]'}`}>
            {breadcrumbRight && <div className="mb-4 flex justify-end">{breadcrumbRight}</div>}
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default GlobalLayout;
