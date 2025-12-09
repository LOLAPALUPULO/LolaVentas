import React, { useState } from 'react';
import Button from './Button';
import { UserLevel } from '../types';

interface AuthScreenProps {
  onLoginAttempt: (level: UserLevel, username: string) => void;
  loginError: string | null;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLoginAttempt, loginError }) => {
  const [usernameInput, setUsernameInput] = useState('');

  const handleLoginClick = (level: UserLevel) => {
    if (usernameInput) {
      onLoginAttempt(level, usernameInput);
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-emerald-50 text-gray-800 p-4">
      <h1 className="text-5xl md:text-7xl font-extrabold mb-12 text-teal-600 text-center leading-tight font-pitched-battle">
        LolaVentas App
      </h1>
      <p className="text-xl md:text-2xl mb-10 text-gray-600 text-center max-w-2xl">
        Ingrese su usuario y seleccione su nivel de acceso:
      </p>

      <div className="w-full max-w-sm p-8 bg-white rounded-lg shadow-xl flex flex-col gap-6">
        {loginError && (
          <p className="text-red-500 text-center text-sm">{loginError}</p>
        )}
        <div>
          <label htmlFor="username" className="block text-gray-700 text-lg font-bold mb-2">Usuario</label>
          <input
            type="text"
            id="username"
            value={usernameInput}
            onChange={(e) => setUsernameInput(e.target.value)}
            onKeyPress={(e) => { if (e.key === 'Enter') handleLoginClick(UserLevel.ADMIN); }} // Default to admin on Enter, but buttons are primary interaction
            className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-100"
            placeholder="Ingrese su usuario"
            autoFocus
          />
        </div>
        <div className="flex flex-col gap-4">
          <Button
            onClick={() => handleLoginClick(UserLevel.ADMIN)}
            variant="primary"
            fullWidth
            size="lg"
            disabled={!usernameInput}
            className="py-5 text-2xl"
          >
            INGRESAR <br /> ADMINISTRADOR
          </Button>
          <Button
            onClick={() => handleLoginClick(UserLevel.VENTA)}
            variant="success"
            fullWidth
            size="lg"
            disabled={!usernameInput}
            className="py-5 text-2xl"
          >
            INGRESAR <br /> VENTA
          </Button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;