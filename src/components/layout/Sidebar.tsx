// If Sidebar is defined in this file, ensure it is exported:

import { useLocation, Link } from 'react-router-dom';
import { FaTachometerAlt, FaFileAlt, FaNewspaper, FaPhotoVideo, FaTags } from 'react-icons/fa';

const navItems = [
  { label: 'Dashboard', icon: FaTachometerAlt, path: '/dashboard' },
  { label: 'Halaman', icon: FaFileAlt, path: '/halaman' },
  { label: 'Artikel', icon: FaNewspaper, path: '/artikel' },
  { label: 'Media', icon: FaPhotoVideo, path: '/media' },
];
const masterItems = [
  { label: 'Kategori', icon: FaTags, path: '/category' },
];

const Sidebar = () => {
  const location = useLocation();
  const activePath = location.pathname;
  return (
    <aside className="w-64 bg-[#f5f8ff] text-[#1e293b] flex flex-col min-h-screen px-4 py-6 border-r border-gray-200">
      {/* Logo */}
      <div className="mb-8 flex items-center">
        <img src="/logo.svg" alt="Logo" className="h-8 mr-2" />
      </div>
      {/* User Info */}
      <div className="flex items-center mb-8 bg-white rounded-xl p-4 shadow">
        <img src="/profile.png" alt="User" className="h-12 w-12 rounded-full mr-3 border-2 border-blue-200" />
        <div>
          <div className="font-normal text-[#1e293b]">Carlota Monteiro</div>
          <div className="text-sm text-blue-500">Admin</div>
        </div>
      </div>
      {/* Navigation */}
      <nav className="flex-1">
        <div className="mb-4">
          <div className="uppercase text-xs text-blue-400 mb-2 tracking-wider">General</div>
          <ul>
            {navItems.map(item => (
              <li className="mb-2" key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition font-normal ${
                    activePath === item.path
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-transparent text-[#1e293b] hover:bg-blue-100 hover:text-blue-500'
                  }`}
                >
                  <span className="mr-2">
                    {item.icon && <item.icon className={activePath === item.path ? 'text-white' : 'text-blue-400'} />}
                  </span> {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          <div className="uppercase text-xs text-blue-400 mb-2 tracking-wider">Master</div>
          <ul>
            {masterItems.map(item => (
              <li className="mb-2" key={item.path}>
                <Link
                  to={item.path}
                  className={
                    `flex items-center px-3 py-2 rounded-lg transition font-normal ` +
                    (activePath === item.path
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-transparent text-[#1e293b] hover:bg-blue-100 hover:text-blue-700')
                  }
                >
                  <span className="mr-2">{item.icon && <item.icon className={activePath === item.path ? 'text-white' : 'text-blue-400'} />}</span> {item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </nav>
    </aside>
  );
};

export default Sidebar;