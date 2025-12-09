import React, { useState } from 'react';
import { ADMIN_USER, SALES_USER } from '../constants';

interface AuthScreenProps {
  onLogin: (username: string) => void;
}

const AuthScreen: React.FC<AuthScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState<string>('');
  const [error, setError] = useState<string>('');

  const handleLoginAttempt = (role: 'admin' | 'sales') => {
    if (username.toLowerCase() === ADMIN_USER && role === 'admin') {
      onLogin(username.toLowerCase());
    } else if (username.toLowerCase() === SALES_USER && role === 'sales') {
      onLogin(username.toLowerCase());
    } else {
      setError('Usuario o rol incorrecto.');
    }
  };

  const isButtonEnabled = username.toLowerCase() === ADMIN_USER || username.toLowerCase() === SALES_USER;

  return (
    <div className="flex flex-col items-center justify-center p-6 sm:p-8 md:p-10 min-h-[70vh]">
      <h1 className="text-6xl sm:text-7xl md:text-8xl font-pitched-battle text-blue-700 mb-8 sm:mb-10">LOLA VENTA</h1>
      <div className="w-full max-w-sm">
        <input
          type="text"
          placeholder="USUARIO"
          value={username}
          onChange={(e) => {
            setUsername(e.target.value);
            setError(''); // Clear error on input change
          }}
          className="w-full p-4 border border-gray-300 rounded-lg text-center text-xl sm:text-2xl mb-6 focus:ring-2 focus:ring-blue-400 outline-none transition duration-200"
        />
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div className="grid grid-cols-1 gap-4">
          <button
            onClick={() => handleLoginAttempt('admin')}
            disabled={!isButtonEnabled || username.toLowerCase() !== ADMIN_USER}
            className={`w-full py-4 text-white text-xl sm:text-2xl rounded-lg font-bold transition duration-200
              ${isButtonEnabled && username.toLowerCase() === ADMIN_USER
                ? 'bg-blue-600 hover:bg-blue-700 active:bg-blue-800'
                : 'bg-gray-400 cursor-not-allowed'}`}
          >
            INGRESAR ADMINISTRADOR
          </button>
          <button
            onClick={() => handleLoginAttempt('sales')}
            disabled={!isButtonEnabled || username.toLowerCase() !== SALES_USER}
            className={`w-full py-4 text-white text-xl sm:text-2xl rounded-lg font-bold transition duration-200
              ${isButtonEnabled && username.toLowerCase() === SALES_USER
                ? 'bg-green-600 hover:bg-green-700 active:bg-green-800'
                : 'bg-gray-400 cursor-not-allowed'}`}
          >
            INGRESAR VENTA
          </button>
        </div>
      </div>
    </div>
  );
};

export default AuthScreen;
