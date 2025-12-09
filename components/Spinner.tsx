import React from 'react';

interface SpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  color?: string;
}

export const Spinner: React.FC<SpinnerProps> = ({ size = 'md', color = 'text-white' }) => {
  let spinnerSize = 'w-5 h-5';
  let borderWidth = 'border-2';

  switch (size) {
    case 'sm':
      spinnerSize = 'w-4 h-4';
      borderWidth = 'border';
      break;
    case 'lg':
      spinnerSize = 'w-6 h-6';
      borderWidth = 'border-4';
      break;
    case 'md':
    default:
      spinnerSize = 'w-5 h-5';
      borderWidth = 'border-2';
      break;
  }

  return (
    <div
      className={`inline-block animate-spin rounded-full ${spinnerSize} ${borderWidth} border-solid border-current border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite] ${color}`}
      role="status"
    >
      <span className="!absolute !-m-px !h-px !w-px !overflow-hidden !whitespace-nowrap !border-0 !p-0 ![clip:rect(0,0,0,0)]">
        Loading...
      </span>
    </div>
  );
};
