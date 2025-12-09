import React from 'react';
import { Spinner } from './Spinner';

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  children: React.ReactNode;
  variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'success' | 'warning';
  size?: 'sm' | 'md' | 'lg';
  loading?: boolean;
}

export const Button: React.FC<ButtonProps> = ({
  children,
  variant = 'primary',
  size = 'md',
  loading = false,
  className = '',
  disabled,
  ...props
}) => {
  const baseStyles = 'font-bold py-2 px-4 rounded-lg transition ease-in-out duration-200 focus:outline-none focus:ring-2 focus:ring-opacity-75';
  let variantStyles = '';
  let sizeStyles = '';

  switch (variant) {
    case 'primary':
      variantStyles = 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500 shadow-md';
      break;
    case 'secondary':
      variantStyles = 'bg-gray-200 text-gray-800 hover:bg-gray-300 focus:ring-gray-400';
      break;
    case 'success':
      variantStyles = 'bg-green-600 text-white hover:bg-green-700 focus:ring-green-500 shadow-md';
      break;
    case 'warning':
      variantStyles = 'bg-yellow-500 text-white hover:bg-yellow-600 focus:ring-yellow-400 shadow-md';
      break;
    case 'danger':
      variantStyles = 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500 shadow-md';
      break;
    case 'ghost':
      variantStyles = 'bg-transparent text-blue-600 hover:bg-blue-50 focus:ring-blue-500';
      break;
  }

  switch (size) {
    case 'sm':
      sizeStyles = 'text-sm py-1.5 px-3';
      break;
    case 'lg':
      sizeStyles = 'text-lg py-3 px-6';
      break;
    case 'md':
    default:
      sizeStyles = 'text-base py-2 px-4';
      break;
  }

  return (
    <button
      className={`${baseStyles} ${variantStyles} ${sizeStyles} ${className} ${disabled || loading ? 'opacity-50 cursor-not-allowed' : ''}`}
      disabled={disabled || loading}
      {...props}
    >
      {loading ? <Spinner size={size} /> : children}
    </button>
  );
};