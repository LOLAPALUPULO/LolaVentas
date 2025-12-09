import React, { useState } from 'react';
import { Button } from './Button';
import { Input } from './Input';
import { UserRole } from '../types';

interface LoginScreenProps {
  onLogin: (role: UserRole, username: string) => void;
}

export const LoginScreen: React.FC<LoginScreenProps> = ({ onLogin }) => {
  const [username, setUsername] = useState('');

  const isButtonEnabled = (requiredUsername: string) => {
    return username.toLowerCase() === requiredUsername.toLowerCase(); // Case-insensitive check
  };

  return (
    <div className="flex flex-col items-center justify-center p-8 md:p-12 bg-white rounded-2xl shadow-2xl max-w-sm w-full border border-gray-100">
      <h1 className="text-5xl md:text-6xl font-extrabold text-gray-900 mb-8 tracking-tight" style={{ fontFamily: 'Pitched Battle, monospace' }}>
        LOLA VENTA
      </h1>

      <Input
        id="username"
        label="USUARIO"
        placeholder="Ingrese su usuario"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="text-center text-lg px-6 py-3"
      />

      <div className="flex flex-col space-y-4 w-full mt-6">
        <Button
          onClick={() => onLogin(UserRole.Admin, username)}
          disabled={!isButtonEnabled('regis')}
          variant="primary"
          className="w-full text-lg py-3"
        >
          INGRESAR ADMINISTRADOR
        </Button>
        <Button
          onClick={() => onLogin(UserRole.Seller, username)}
          disabled={!isButtonEnabled('lol')}
          variant="success"
          className="w-full text-lg py-3"
        >
          INGRESAR VENTA
        </Button>
      </div>
    </div>
  );
};