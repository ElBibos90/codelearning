import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { 
  LayoutGrid, 
  BookOpen, 
  Users, 
  Settings, 
  BarChart, 
  Menu as MenuIcon,
  X
} from 'lucide-react';

const navigation = [
  { name: 'Dashboard', href: '/admin', icon: LayoutGrid },
  { name: 'Gestione Corsi', href: '/admin/courses', icon: BookOpen },
  { name: 'Utenti', href: '/admin/users', icon: Users },
  { name: 'Statistiche', href: '/admin/stats', icon: BarChart },
  { name: 'Impostazioni', href: '/admin/settings', icon: Settings },
];

export default function AdminLayout({ children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();

  const isCurrentPath = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Mobile sidebar */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div 
            className="fixed inset-0 bg-gray-600 bg-opacity-75"
            onClick={() => setSidebarOpen(false)}
          ></div>
          <div className="fixed inset-y-0 left-0 flex max-w-xs w-full bg-white">
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex items-center justify-between h-16 px-4 bg-white border-b">
                <span className="text-xl font-semibold">Admin Panel</span>
                <button onClick={() => setSidebarOpen(false)}>
                  <X className="h-6 w-6" />
                </button>
              </div>
              <nav className="flex-1 px-2 py-4 space-y-1">
                {navigation.map((item) => {
                  const isActive = isCurrentPath(item.href);
                  return (
                    <a
                      key={item.name}
                      href={item.href}
                      className={`${
                        isActive
                          ? 'bg-blue-50 text-blue-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      } group flex items-center px-2 py-2 text-base font-medium rounded-md`}
                    >
                      <item.icon
                        className={`${
                          isActive ? 'text-blue-600' : 'text-gray-400'
                        } mr-4 flex-shrink-0 h-6 w-6`}
                      />
                      {item.name}
                    </a>
                  );
                })}
              </nav>
            </div>
          </div>
        </div>
      )}

      {/* Static sidebar for desktop */}
      <div className="hidden md:flex md:w-64 md:flex-col md:fixed md:inset-y-0">
        <div className="flex flex-col flex-grow border-r border-gray-200 bg-white overflow-y-auto">
          <div className="flex items-center h-16 flex-shrink-0 px-4 bg-white border-b">
            <span className="text-xl font-semibold">Admin Panel</span>
          </div>
          <div className="flex-grow flex flex-col">
            <nav className="flex-1 px-2 py-4 space-y-1">
              {navigation.map((item) => {
                const isActive = isCurrentPath(item.href);
                return (
                  <a
                    key={item.name}
                    href={item.href}
                    className={`${
                      isActive
                        ? 'bg-blue-50 text-blue-600'
                        : 'text-gray-600 hover:bg-gray-50'
                    } group flex items-center px-2 py-2 text-sm font-medium rounded-md`}
                  >
                    <item.icon
                      className={`${
                        isActive ? 'text-blue-600' : 'text-gray-400'
                      } mr-3 flex-shrink-0 h-5 w-5`}
                    />
                    {item.name}
                  </a>
                );
              })}
            </nav>
          </div>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64">
        <div className="sticky top-0 z-10 flex h-16 flex-shrink-0 bg-white shadow">
          <button
            type="button"
            className="border-r border-gray-200 px-4 text-gray-500 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-blue-500 md:hidden"
            onClick={() => setSidebarOpen(true)}
          >
            <span className="sr-only">Open sidebar</span>
            <MenuIcon className="h-6 w-6" />
          </button>
        </div>

        <main className="py-6">
          <div className="mx-auto max-w-7xl px-4 sm:px-6 md:px-8">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
