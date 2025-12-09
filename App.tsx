import React, { useState, useEffect, useCallback } from 'react';
import AuthScreen from './components/AuthScreen';
import AdminDashboard from './components/AdminDashboard';
import SalesTerminal from './components/SalesTerminal';
import { UserLevel, FeriaConfig } from './types';
import { getFeriaConfig } from './services/firebaseService';
import Button from './components/Button';
import { USERS } from './constants'; // Import USERS for validation

const App: React.FC = () => {
  const [currentUserLevel, setCurrentUserLevel] = useState<UserLevel | null>(null);
  const [feriaConfig, setFeriaConfig] = useState<FeriaConfig | null>(null);
  const [loadingInitialConfig, setLoadingInitialConfig] = useState(true);
  const [loginError, setLoginError] = useState<string | null>(null); // New state for login errors

  // Load feria config on initial app load
  useEffect(() => {
    const loadInitialConfig = async () => {
      setLoadingInitialConfig(true);
      try {
        const config = await getFeriaConfig();
        setFeriaConfig(config);
      } catch (error) {
        console.error("Error loading initial feria config:", error);
      } finally {
        setLoadingInitialConfig(false);
      }
    };
    loadInitialConfig();
  }, []);

  const handleLoginAttempt = useCallback((level: UserLevel, username: string) => {
    setLoginError(null); // Clear previous errors
    if (level === UserLevel.ADMIN && username === USERS.ADMIN_USER) {
      setCurrentUserLevel(level);
    } else if (level === UserLevel.VENTA && username === USERS.VENTA_USER) {
      setCurrentUserLevel(level);
    } else {
      setLoginError('Usuario incorrecto. Intente nuevamente.');
    }
  }, []);

  const handleFeriaConfigured = useCallback((config: FeriaConfig | null) => {
    setFeriaConfig(config);
  }, []);

  const handleLogout = useCallback(() => {
    setCurrentUserLevel(null);
    setLoginError(null); // Clear any login errors on logout
  }, []);

  if (loadingInitialConfig) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-emerald-50 text-gray-800">
        <div className="animate-spin rounded-full h-20 w-20 border-t-4 border-b-4 border-teal-500"></div>
        <p className="ml-6 text-2xl">Cargando aplicación...</p>
      </div>
    );
  }

  // If no user level selected, show auth screen
  if (!currentUserLevel) {
    return (
      <AuthScreen
        onLoginAttempt={handleLoginAttempt}
        loginError={loginError} // Pass login error
      />
    );
  }

  // If admin, show admin dashboard
  if (currentUserLevel === UserLevel.ADMIN) {
    return (
      <AdminDashboard
        onFeriaConfigured={handleFeriaConfigured}
        currentFeriaConfig={feriaConfig}
        onLogout={handleLogout}
      />
    );
  }

  // If sales, check if feria is configured
  if (currentUserLevel === UserLevel.VENTA) {
    if (feriaConfig) {
      return <SalesTerminal feriaConfig={feriaConfig} onLogout={handleLogout} />;
    } else {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-red-100 text-red-800 p-4 text-center">
          <h1 className="text-5xl md:text-7xl font-extrabold mb-6 text-red-700 font-pitched-battle">LolaVentas App</h1>
          <p className="text-2xl mb-8">
            La Feria aún no ha sido configurada por un administrador.
            <br />Por favor, pida a un administrador que configure la feria primero.
          </p>
          <Button
            onClick={handleLogout} // Allow user to go back to login screen
            variant="danger"
            size="lg"
            className="bg-red-600 hover:bg-red-700 text-white"
          >
            Volver a Selección de Nivel
          </Button>
        </div>
      );
    }
  }

  return null; // Should not reach here
};

export default App;
