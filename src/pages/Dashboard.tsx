import { useNavigate } from 'react-router-dom';
import { logout } from '../components/func/logout';
import Sidebar from '../components/layout/Sidebar';
import Topbar from '../components/layout/Topbar';
import Breadcrumbs from '../components/atoms/Breadcrumbs';

const Dashboard = () => {
  const navigate = useNavigate();

  return (
    <div className="flex h-screen w-screen bg-gray-100 overflow-hidden">
      <Sidebar />
      <div className="flex flex-col flex-1 min-w-0">
        <Topbar onLogout={() => logout(navigate)} />
        <main className="flex-1 w-full p-8 overflow-auto">
          <Breadcrumbs />
          <div className="bg-white rounded-xl shadow p-8 w-full h-full min-h-[calc(100vh-96px)]">
            <h1 className="text-4xl font-bold mb-4">General Dashboard</h1>
            <div className="text-gray-400">Selamat datang di dashboard</div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default Dashboard;