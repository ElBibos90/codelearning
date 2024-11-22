import { Menu, Transition } from '@headlessui/react';
import { useNavigate } from 'react-router-dom';
import { LogOut, User } from 'lucide-react';
import { authService } from '../../services/authService';

const AccountMenu = ({ user }) => {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      await authService.logout();
    } catch (error) {
      console.error('Errore durante il logout:', error);
    }
  };

  return (
    <Menu as="div" className="relative">
      {/* Menu Button */}
      <Menu.Button className="flex items-center space-x-2 rounded-full p-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
        <div className="h-8 w-8 rounded-full bg-blue-100 flex items-center justify-center">
          <span className="text-sm font-medium text-blue-600">
            {user?.name?.[0]?.toUpperCase() || 'U'}
          </span>
        </div>
      </Menu.Button>

      {/* Dropdown Menu */}
      <Transition
        enter="transition ease-out duration-100"
        enterFrom="transform opacity-0 scale-95"
        enterTo="transform opacity-100 scale-100"
        leave="transition ease-in duration-75"
        leaveFrom="transform opacity-100 scale-100"
        leaveTo="transform opacity-0 scale-95"
      >
        <Menu.Items className="absolute right-0 mt-2 w-48 origin-top-right rounded-md bg-white shadow-lg ring-1 ring-black ring-opacity-5 focus:outline-none z-50">
          {/* User Info */}
          <div className="px-4 py-3 border-b border-gray-100">
            <p className="text-sm text-gray-500">Logged in as</p>
            <p className="truncate text-sm font-medium text-gray-900">
              {user?.email}
            </p>
          </div>

          {/* Profile */}
          <div className="py-1">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={() => navigate('/profile')}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center px-4 py-2 text-sm text-gray-700`}
                >
                  <User className="mr-3 h-4 w-4" />
                  Il Mio Profilo
                </button>
              )}
            </Menu.Item>
          </div>

          {/* Logout */}
          <div className="py-1 border-t border-gray-100">
            <Menu.Item>
              {({ active }) => (
                <button
                  onClick={handleLogout}
                  className={`${
                    active ? 'bg-gray-100' : ''
                  } flex w-full items-center px-4 py-2 text-sm text-red-600`}
                >
                  <LogOut className="mr-3 h-4 w-4" />
                  Logout
                </button>
              )}
            </Menu.Item>
          </div>
        </Menu.Items>
      </Transition>
    </Menu>
  );
};

export default AccountMenu;