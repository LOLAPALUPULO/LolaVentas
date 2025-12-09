import React, { useState, useEffect } from 'react';
import AuthScreen from './components/AuthScreen';
import AdminDashboard from './components/AdminDashboard';
import SalesPOS from './components/SalesPOS';
import { UserRole } from './types';
import { ADMIN_USER, SALES_USER } from './constants';
import { getActiveFair } from './services/firebaseService';
import { Fair } from './types';

const App: React.FC = () => {
  const [loggedInUser, setLoggedInUser] = useState<string | null>(null);
  const [userRole, setUserRole] = useState<UserRole | null>(null);
  const [activeFair, setActiveFair] = useState<Fair | null>(null);
  const [isLoadingFair, setIsLoadingFair] = useState<boolean>(true);

  useEffect(() => {
    const fetchActiveFair = async () => {
      setIsLoadingFair(true);
      try {
        const fair = await getActiveFair();
        setActiveFair(fair);
      } catch (error) {
        console.error("Error fetching active fair:", error);
      } finally {
        setIsLoadingFair(false);
      }
    };
    fetchActiveFair();
  }, []);

  const handleLogin = (username: string) => {
    setLoggedInUser(username);
    if (username === ADMIN_USER) {
      setUserRole(UserRole.Admin);
    } else if (username === SALES_USER) {
      setUserRole(UserRole.Sales);
    }
  };

  const handleLogout = () => {
    setLoggedInUser(null);
    setUserRole(null);
  };

  const handleFairUpdate = (fair: Fair | null) => {
    setActiveFair(fair);
  };

  if (loggedInUser === null) {
    return (
      <AuthScreen onLogin={handleLogin} />
    );
  }

  if (isLoadingFair) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-center text-gray-700">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-xl">Cargando datos de la feria...</p>
      </div>
    );
  }

  return (
    <div className="w-full">
      <header className="mb-6 py-4 bg-blue-600 text-white rounded-t-lg shadow-md flex justify-between items-center px-6">
        <h1 className="text-4xl font-pitched-battle tracking-wide">LOLA VENTA</h1>
        <div className="flex items-center space-x-4">
          <span className="text-lg">Usuario: {loggedInUser}</span>
          <button
            onClick={handleLogout}
            className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition duration-200"
          >
            Cerrar Sesión
          </button>
        </div>
      </header>

      <main className="min-h-[70vh]">
        {userRole === UserRole.Admin && (
          <AdminDashboard activeFair={activeFair} onFairUpdate={handleFairUpdate} />
        )}
        {userRole === UserRole.Sales && activeFair && (
          <SalesPOS activeFair={activeFair} onFairUpdate={handleFairUpdate} />
        )}
        {userRole === UserRole.Sales && !activeFair && (
          <div className="text-center text-red-600 text-2xl mt-12 p-6 bg-red-100 rounded-lg shadow-inner">
            <p>¡Atención! No hay una feria activa configurada.</p>
            <p className="text-lg mt-2">Por favor, espera a que el administrador configure una feria.</p>
          </div>
        )}
      </main>
    </div>
  );
};

export default App;
