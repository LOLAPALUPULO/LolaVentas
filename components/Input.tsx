import React from 'react';

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  id: string;
  type?: 'text' | 'number' | 'date';
  className?: string;
}

export const Input: React.FC<InputProps> = ({ label, id, type = 'text', className = '', ...props }) => {
  const baseStyles = 'block w-full px-4 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 transition ease-in-out duration-200';

  return (
    <div className="mb-4">
      {label && (
        <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1">
          {label}
        </label>
      )}
      <input
        type={type}
        id={id}
        className={`${baseStyles} ${className}`}
        {...props}
      />
    </div>
  );
};