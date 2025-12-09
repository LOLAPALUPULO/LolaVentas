import React from 'react';
import { Button } from './Button';

interface ModalProps {
  isOpen: boolean;
  onClose?: () => void;
  title?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}

export const Modal: React.FC<ModalProps> = ({ isOpen, onClose, title, children, footer }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center overflow-x-hidden overflow-y-auto outline-none focus:outline-none bg-black bg-opacity-50 backdrop-blur-sm p-4">
      <div className="relative w-auto my-6 mx-auto max-w-lg md:max-w-xl lg:max-w-2xl">
        {/*content*/}
        <div className="border-0 rounded-xl shadow-2xl relative flex flex-col w-full bg-white outline-none focus:outline-none animate-scale-in">
          {/*header*/}
          <div className="flex items-center justify-between p-5 border-b border-solid border-gray-200 rounded-t-xl bg-gradient-to-r from-blue-50 to-indigo-50">
            <h3 className="text-2xl font-semibold text-gray-800">
              {title}
            </h3>
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="!p-2 !rounded-full text-gray-600 hover:text-gray-900 hover:bg-gray-100"
                aria-label="Cerrar modal"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </Button>
            )}
          </div>
          {/*body*/}
          <div className="relative p-6 flex-auto text-gray-700">
            {children}
          </div>
          {/*footer*/}
          {footer && (
            <div className="flex items-center justify-end p-5 border-t border-solid border-gray-200 rounded-b-xl bg-gray-50">
              {footer}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};