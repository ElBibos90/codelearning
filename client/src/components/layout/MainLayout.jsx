import { useState } from 'react';
import { useSelector } from 'react-redux';
import { useNavigate, Link, useLocation } from 'react-router-dom';
import { Settings } from 'lucide-react';
import Header from './Header';

export default function MainLayout({ children }) {
  const navigate = useNavigate();
  const location = useLocation();
  const user = useSelector(state => state.auth.user);
  const isAdmin = user?.role === 'admin';

  const navigation = [
    { name: 'Home', href: '/' },
    { name: 'Corsi', href: '/courses' },
    { name: 'Il Mio Percorso', href: '/my-learning' },
    // Mostra il link admin solo se l'utente è admin
    ...(isAdmin ? [{ name: 'Admin Panel', href: '/admin/courses' }] : [])
  ];

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 justify-between items-center">
            <div className="flex items-center">
              <Link to="/" className="text-xl font-bold text-blue-600">
                CodeLearning
              </Link>
              
              <nav className="ml-10 flex space-x-4">
                {navigation.map((item) => (
                  <Link
                    key={item.name}
                    to={item.href}
                    className={`${
                      location.pathname === item.href
                        ? 'text-blue-600'
                        : 'text-gray-600 hover:text-gray-900'
                    } px-3 py-2 rounded-md text-sm font-medium ${
                      item.name === 'Admin Panel' ? 'flex items-center' : ''
                    }`}
                  >
                    {item.name === 'Admin Panel' && (
                      <Settings className="w-4 h-4 mr-1" />
                    )}
                    {item.name}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="flex items-center">
              {user ? (
                <Header user={user} />
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

      {/* Main content */}
      <main>
        <div className="mx-auto max-w-7xl py-6 sm:px-6 lg:px-8">
          {children}
        </div>
      </main>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 mt-auto">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="py-8">
            <p className="text-center text-sm text-gray-500">
              © 2024 CodeLearning. Tutti i diritti riservati.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}