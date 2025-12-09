import React, { useEffect, useState } from 'react';

interface LoaderProps {
  message: string;
  duration?: number; // Duration in milliseconds before it fades out
  onComplete?: () => void;
}

const Loader: React.FC<LoaderProps> = ({ message, duration = 1500, onComplete }) => {
  const [visible, setVisible] = useState(true);
  const [fading, setFading] = useState(false);

  useEffect(() => {
    setVisible(true); // Ensure it's visible when component mounts/re-renders
    setFading(false); // Reset fading state

    const timer = setTimeout(() => {
      setFading(true); // Start fade-out
    }, duration - 500); // Start fading 500ms before disappearing

    const hideTimer = setTimeout(() => {
      setVisible(false);
      if (onComplete) {
        onComplete();
      }
    }, duration);

    return () => {
      clearTimeout(timer);
      clearTimeout(hideTimer);
    };
  }, [message, duration, onComplete]);

  if (!visible) return null;

  return (
    <div className={`fixed inset-0 bg-emerald-700 bg-opacity-70 flex items-center justify-center transition-opacity duration-500 z-50 ${fading ? 'opacity-0' : 'opacity-100'}`}>
      <div className="bg-white p-6 rounded-lg shadow-xl text-center">
        <p className="text-3xl font-bold text-emerald-800 animate-pulse">{message}</p>
      </div>
    </div>
  );
};

export default Loader;