import { useLocation, Link } from 'react-router-dom';
import { Home, Book, GraduationCap, Settings, HelpCircle, Users, Calendar } from 'lucide-react';

const navigation = [
  { name: 'Home', icon: Home, href: '/' },
  { name: 'Corsi', icon: Book, href: '/courses' },
  { name: 'Il Mio Percorso', icon: GraduationCap, href: '/my-learning' },
  { name: 'Community', icon: Users, href: '/community' },
  { name: 'Calendario', icon: Calendar, href: '/calendar' },
  { name: 'Admin Panel', icon: Settings, href: '/admin/courses', admin: true },
  { name: 'Aiuto', icon: HelpCircle, href: '/help' }
];

export default function Sidebar({ isOpen, onClose, user }) {
  const location = useLocation();

  const isActive = (href) => location.pathname === href;

  return (
    <>
      {/* Overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 z-40 bg-gray-600 bg-opacity-75 transition-opacity lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <div
        className={`fixed inset-y-0 left-0 z-50 w-64 transform overflow-y-auto bg-white 
                   dark:bg-gray-900 transition duration-200 ease-in-out lg:static lg:translate-x-0
                   ${isOpen ? 'translate-x-0' : '-translate-x-full'}`}
      >
        <div className="flex h-full flex-col">
          {/* Logo */}
          <div className="flex h-16 shrink-0 items-center px-4">
            <img
              className="h-8 w-auto"
              src="/logo.svg"
              alt="CodeLearning"
            />
          </div>

          {/* Navigation */}
          <nav className="flex-1 space-y-1 px-2 py-4">
            {navigation.map((item) => {
              if (item.admin && user?.role !== 'admin') return null;

              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`group flex items-center rounded-lg px-3 py-2 text-sm font-medium
                            transition-colors duration-200
                            ${isActive(item.href)
                              ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/50 dark:text-blue-400'
                              : 'text-gray-700 hover:bg-gray-50 dark:text-gray-300 dark:hover:bg-gray-800'
                            }`}
                >
                  <item.icon className={`mr-3 h-5 w-5 flex-shrink-0 
                    ${isActive(item.href)
                      ? 'text-blue-600 dark:text-blue-400'
                      : 'text-gray-400 group-hover:text-gray-500 dark:text-gray-500 dark:group-hover:text-gray-400'
                    }`}
                  />
                  {item.name}
                </Link>
              );
            })}
          </nav>

          {/* User Info */}
          <div className="border-t border-gray-200 dark:border-gray-700 p-4">
            <div className="flex items-center">
              <div className="flex-shrink-0">
                <div className="h-10 w-10 rounded-full bg-blue-100 dark:bg-blue-900 flex items-center justify-center">
                  <span className="text-blue-600 dark:text-blue-400 font-medium">
                    {user?.name?.[0]?.toUpperCase()}
                  </span>
                </div>
              </div>
              <div className="ml-3">
                <p className="text-sm font-medium text-gray-700 dark:text-gray-300">
                  {user?.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {user?.email}
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
