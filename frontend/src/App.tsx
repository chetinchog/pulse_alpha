import { useEffect, useState, useRef } from 'react';
import { useAuth } from './contexts/AuthContext';
import Dashboard from './components/Dashboard';
import DarkModeToggle from './components/DarkModeToggle';
import LoginPage from './components/LoginPage';
import BlockedPage from './components/BlockedPage';
import { registerBlockedCallback } from './services/api';

function AppContent() {
  const { user, isEnabled, isLoading, isBlocked, setBlocked, signOut } = useAuth();
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsMenuOpen(false);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Register the 418 callback so the api service can trigger blocked state
  useEffect(() => {
    registerBlockedCallback(() => setBlocked(true));
  }, [setBlocked]);

  // Show blank screen while Firebase resolves auth state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-indigo-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  // Not logged in → Login page
  if (!user) {
    return <LoginPage />;
  }

  // Logged in but blocked by 418 from backend OR is_enabled=false from Firestore
  if (isBlocked || !isEnabled) {
    return <BlockedPage />;
  }

  // Fully authenticated and enabled → main app
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200 animate-fadeIn">
      <header className="gradient-header shadow-soft-lg dark:shadow-gray-900/50 transition-all duration-200 border-b border-gray-200/50 dark:border-gray-700/50">
        <div className="max-w-7xl mx-auto py-6 px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between animate-slideDown">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-indigo-600 to-indigo-700 dark:from-indigo-500 dark:to-indigo-600 rounded-lg flex items-center justify-center shadow-soft">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <h1 className="text-3xl font-bold bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                Pulse Alpha
              </h1>
            </div>
            <div className="flex items-center gap-3">
              <DarkModeToggle />
              {/* User avatar + dropdown */}
              <div className="relative" ref={menuRef}>
                <button
                  onClick={() => setIsMenuOpen(!isMenuOpen)}
                  className="flex items-center justify-center w-10 h-10 rounded-full border-2 border-transparent hover:border-indigo-500 focus:outline-none focus:border-indigo-500 transition-colors duration-200"
                >
                  {user.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || 'User'}
                      className="w-full h-full rounded-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full rounded-full bg-indigo-100 dark:bg-indigo-900 flex items-center justify-center text-indigo-800 dark:text-indigo-200 font-bold">
                      {user.email?.charAt(0).toUpperCase()}
                    </div>
                  )}
                </button>

                {isMenuOpen && (
                  <div className="absolute right-0 mt-2 w-48 rounded-2xl shadow-soft-xl py-1 bg-white/90 dark:bg-gray-800/90 backdrop-blur-md border border-gray-100 dark:border-gray-700/50 z-50 animate-scaleIn origin-top-right">
                    <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700/50">
                      <p className="text-sm font-medium text-gray-900 dark:text-white truncate">
                        {user.displayName || 'Usuario'}
                      </p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="p-1">
                      <button
                        onClick={() => {
                          setIsMenuOpen(false);
                          signOut();
                        }}
                        className="w-full text-left px-3 py-2 text-sm text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-500/10 transition-colors rounded-xl flex items-center justify-between group"
                      >
                        Salir
                        <svg className="w-4 h-4 text-red-400 dark:text-red-500 group-hover:-translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                        </svg>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>
      <main>
        <div className="max-w-7xl mx-auto py-6 sm:px-6 lg:px-8">
          <Dashboard />
        </div>
      </main>

      {/* Footer with version and credits */}
      <footer className="fixed bottom-4 right-4 z-10">
        <div className="bg-white/80 dark:bg-gray-800/80 backdrop-blur-sm rounded-lg shadow-soft border border-gray-200/50 dark:border-gray-700/50 px-4 py-2 transition-all duration-300 opacity-30 hover:opacity-100 hover:shadow-soft-lg">
          <div className="text-right space-y-0.5">
            <p className="text-xs font-semibold text-indigo-600 dark:text-indigo-400">
              v1.2.0
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">
              By iCTG
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-500 flex items-center justify-end gap-1">
              Powered by
              <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                <path d="M12 2L2 7v10c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V7l-10-5z" />
              </svg>
              Antigravity
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}

function App() {
  return <AppContent />;
}

export default App;
