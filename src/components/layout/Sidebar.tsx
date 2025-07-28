import { useLocation, Link } from 'react-router-dom';
import { FaTachometerAlt, FaFileAlt, FaNewspaper, FaPhotoVideo, FaTags, FaChevronLeft, FaChevronRight } from 'react-icons/fa';
import { useCollapsibleSidebar } from '../func/collapsible';

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
  const { collapsed, toggleCollapsed } = useCollapsibleSidebar();

  return (
    <aside className={`${collapsed ? "w-20" : "w-64"} bg-[#f5f8ff] text-[#1e293b] flex flex-col min-h-screen px-4 py-6 border-r border-gray-200 transition-all duration-300`}>
      <button
        className="mb-4 rounded hover:bg-blue-100 w-8 h-8 flex items-center justify-center"
        onClick={toggleCollapsed}
        aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
      >
        {collapsed ? <FaChevronRight /> : <FaChevronLeft />}
      </button>
      {/* Logo */}
      <div className="mb-8 flex items-center justify-center">
        <img
          src="/logo.svg"
          alt="Logo"
          className={collapsed ? "h-8 w-8" : "h-8 mr-2 w-auto"}
          style={collapsed ? { borderRadius: '8px' } : {}}
        />
      </div>
      {/* Profile */}
      <div className="flex items-center mb-8 bg-white rounded-xl shadow justify-center">
        <img
          src="/profile.png"
          alt="User"
          className="h-12 w-12 aspect-square rounded-full border-2 border-blue-200 object-cover"
          style={{ minHeight: '3rem', minWidth: '3rem', maxHeight: '3rem', maxWidth: '3rem' }}
        />
        {!collapsed && (
          <div className="ml-3 flex flex-col justify-center py-2">
            <div className="font-normal text-[#1e293b]">Carlota Monteiro</div>
            <div className="text-sm text-blue-500">Admin</div>
          </div>
        )}
      </div>
      {/* Sticky Menu */}
      <nav className="flex-1 sticky top-0">
        <div className="mb-4">
          {!collapsed && <div className="uppercase text-xs text-blue-400 mb-2 tracking-wider">General</div>}
          <ul>
            {navItems.map(item => (
              <li className="mb-2" key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition font-normal relative ${
                    activePath === item.path
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-transparent text-[#1e293b] hover:bg-blue-100 hover:text-blue-500'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="mr-2 flex justify-center w-6">
                    {item.icon && <item.icon className={activePath === item.path ? 'text-white' : 'text-blue-400'} />}
                  </span>
                  {!collapsed && item.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
        <div>
          {!collapsed && <div className="uppercase text-xs text-blue-400 mb-2 tracking-wider">Master</div>}
          <ul>
            {masterItems.map(item => (
              <li className="mb-2" key={item.path}>
                <Link
                  to={item.path}
                  className={`flex items-center px-3 py-2 rounded-lg transition font-normal relative ${
                    activePath === item.path
                      ? 'bg-blue-600 text-white font-semibold'
                      : 'bg-transparent text-[#1e293b] hover:bg-blue-100 hover:text-blue-700'
                  }`}
                  title={collapsed ? item.label : undefined}
                >
                  <span className="mr-2 flex justify-center w-6">
                    {item.icon && <item.icon className={activePath === item.path ? 'text-white' : 'text-blue-400'} />}
                  </span>
                  {!collapsed && item.label}
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