import React from 'react';
import Sidebar from './Sidebar';
import Topbar from './Topbar';
import Breadcrumbs from '../atoms/Breadcrumbs';
import { logout } from '../func/logout';
import { useNavigate } from 'react-router-dom';

type GlobalLayoutProps = {
  children: React.ReactNode;
};

const GlobalLayout: React.FC<GlobalLayoutProps> = ({ children }) => {
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(navigate);
  };

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onLogout={handleLogout} />
        <main className="flex-1 w-full p-8 overflow-auto">
          <Breadcrumbs />
          {children}
        </main>
      </div>
    </div>
  );
};

export default GlobalLayout;