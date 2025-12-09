import React, { useState, useEffect } from 'react';
import { LoginScreen } from './components/LoginScreen';
import { AdminDashboard } from './components/admin/AdminDashboard';
import { SalesTerminal } from './components/sales/SalesTerminal';
import { UserRole } from './types';
import { initializeFirebase } from './services/firebaseService';

const App: React.FC = () => {
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [currentUsername, setCurrentUsername] = useState<string>('');
  const [activeFairId, setActiveFairId] = useState<string | null>(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    initializeFirebase();
    // Check for persisted session
    const storedRole = localStorage.getItem('userRole') as UserRole | null;
    const storedUsername = localStorage.getItem('username');
    const storedFairId = localStorage.getItem('activeFairId');

    if (storedRole && storedUsername) {
      setUserRole(storedRole);
      setCurrentUsername(storedUsername);
    }
    if (storedFairId) {
      setActiveFairId(storedFairId);
    }

    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const handleLogin = (role: UserRole, username: string) => {
    setUserRole(role);
    setCurrentUsername(username);
    localStorage.setItem('userRole', role);
    localStorage.setItem('username', username);
  };

  const handleLogout = () => {
    setUserRole(null);
    setCurrentUsername('');
    setActiveFairId(null);
    localStorage.removeItem('userRole');
    localStorage.removeItem('username');
    localStorage.removeItem('activeFairId');
  };

  const handleSetActiveFair = (fairId: string | null) => {
    setActiveFairId(fairId);
    if (fairId) {
      localStorage.setItem('activeFairId', fairId);
    } else {
      localStorage.removeItem('activeFairId');
    }
  };

  return (
    <div className="flex flex-col items-center justify-center w-full h-full p-4 bg-gradient-to-br from-indigo-50 to-purple-100">
      {!isOnline && (
        <div className="fixed top-0 left-0 w-full bg-red-500 text-white text-center p-2 z-50 text-sm md:text-base shadow-lg">
          Estás offline. Algunas funcionalidades pueden estar limitadas.
        </div>
      )}
      {userRole === null ? (
        <LoginScreen onLogin={handleLogin} />
      ) : (
        <>
          {userRole === UserRole.Admin && (
            <AdminDashboard
              onLogout={handleLogout}
              onSetActiveFair={handleSetActiveFair}
              activeFairId={activeFairId}
              isOnline={isOnline}
            />
          )}
          {userRole === UserRole.Seller && (
            <SalesTerminal
              onLogout={handleLogout}
              activeFairId={activeFairId}
              sellerName={currentUsername}
              isOnline={isOnline}
            />
          )}
        </>
      )}
    </div>
  );
};

export default App;