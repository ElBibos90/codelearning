import { useNavigate } from 'react-router-dom';
import { Menu as MenuIcon } from 'lucide-react';
import AccountMenu from '../ui/AccountMenu';

export default function Header({ user, onOpenSidebar }) {
  const navigate = useNavigate();

  return (
    <header className="bg-white shadow">
      <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-16 justify-between items-center">
          <div className="flex items-center">
            <button
              onClick={onOpenSidebar}
              className="rounded-lg p-2 hover:bg-gray-100 lg:hidden"
            >
              <MenuIcon className="h-5 w-5" />
            </button>
          </div>

          <div className="flex items-center">
            {user ? (
              <AccountMenu user={user} />
            ) : (
              <button
                onClick={() => navigate('/login')}
                className="ml-3 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700"
              >
                Accedi
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}