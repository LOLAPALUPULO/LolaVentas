import React, { useState, useEffect, useCallback } from 'react';
import { saveSale, toTimestamp } from '../services/firebaseService';
import { FeriaConfig, ProductType, PaymentType, SaleTransaction } from '../types';
import Button from './Button';
import { useAudio } from '../hooks/useAudio';
import { DIGITAL_BEEP_SOUND, BILLETE_BEEP_SOUND, USERS } from '../constants';
import Loader from './Loader';
import firebase from 'firebase/compat/app';

interface SalesTerminalProps {
  feriaConfig: FeriaConfig;
  onLogout: () => void; // New prop for logout functionality
}

const SalesTerminal: React.FC<SalesTerminalProps> = ({ feriaConfig, onLogout }) => {
  const [pintaCount, setPintaCount] = useState<number>(0);
  const [litroCount, setLitroCount] = useState<number>(0);
  const [partialAmount, setPartialAmount] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');

  const playDigitalBeep = useAudio(DIGITAL_BEEP_SOUND);
  const playBilleteBeep = useAudio(BILLETE_BEEP_SOUND);

  // Calculate partial amount whenever counts or config values change
  useEffect(() => {
    const calculatedAmount =
      pintaCount * feriaConfig.valorPinta + litroCount * feriaConfig.valorLitro;
    setPartialAmount(calculatedAmount);
  }, [pintaCount, litroCount, feriaConfig.valorPinta, feriaConfig.valorLitro]);

  const handleProductClick = useCallback((type: ProductType) => {
    if (type === ProductType.PINTA) {
      setPintaCount((prev) => prev + 1);
    } else {
      setLitroCount((prev) => prev + 1);
    }
  }, []);

  const handlePayment = useCallback(async (paymentType: PaymentType) => {
    if (partialAmount <= 0) {
      setMessage('No hay productos seleccionados para registrar la venta.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    try {
      setLoading(true);
      setMessage('Cargando...');

      // Grouping all sales into a single batch operation for efficiency and atomicity
      const batch = firebase.firestore().batch();
      const now = firebase.firestore.Timestamp.now();

      if (pintaCount > 0) {
        const pintaSaleRef = firebase.firestore().collection('sales').doc(); // Create new doc reference
        const pintaSale: SaleTransaction = {
          fechaVenta: now,
          tipoUnidad: ProductType.PINTA,
          cantidadUnidades: pintaCount,
          montoTotal: pintaCount * feriaConfig.valorPinta,
          tipoPago: paymentType,
          usuarioVenta: USERS.VENTA_USER,
        };
        batch.set(pintaSaleRef, pintaSale);
      }
      if (litroCount > 0) {
        const litroSaleRef = firebase.firestore().collection('sales').doc(); // Create new doc reference
        const litroSale: SaleTransaction = {
          fechaVenta: now,
          tipoUnidad: ProductType.LITRO,
          cantidadUnidades: litroCount,
          montoTotal: litroCount * feriaConfig.valorLitro,
          tipoPago: paymentType,
          usuarioVenta: USERS.VENTA_USER,
        };
        batch.set(litroSaleRef, litroSale);
      }

      await batch.commit(); // Commit all batched writes

      // Play sound
      if (paymentType === PaymentType.DIGITAL) {
        playDigitalBeep();
      } else {
        playBilleteBeep();
      }

      // Reset counters
      setPintaCount(0);
      setLitroCount(0);
      setMessage('¡Venta Registrada!');
    } catch (error) {
      console.error('Error saving sale:', error);
      setMessage('Error al registrar la venta.');
    } finally {
      setLoading(false);
      setTimeout(() => setMessage(''), 2000); // Clear message after a short delay
    }
  }, [pintaCount, litroCount, partialAmount, feriaConfig, playDigitalBeep, playBilleteBeep]);

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-emerald-50 text-gray-800 p-4 relative">
      {loading && <Loader message="CARGADO" />}
      <h1 className="text-5xl md:text-7xl font-extrabold mb-2 text-yellow-500 font-pitched-battle">VENTA</h1>
      <p className="text-xl md:text-2xl mb-8 text-gray-700">Feria actual: <span className="font-semibold text-teal-600">{feriaConfig.nombreFeria}</span></p>

      <Button
        onClick={onLogout}
        variant="secondary"
        size="sm"
        className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-800 z-10"
      >
        Cerrar Sesión
      </Button>

      {message && !loading && (
        <p className={`mb-4 text-center text-xl font-semibold ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>
          {message}
        </p>
      )}

      <div className="w-full max-w-lg bg-white rounded-xl shadow-2xl p-6 md:p-8 flex flex-col space-y-6">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6">
          {/* Products Section */}
          <div className="flex-1 w-full space-y-4">
            <h2 className="text-2xl font-bold text-gray-700">PRODUCTOS</h2>
            <div className="grid grid-cols-1 gap-4">
              <Button
                size="lg"
                onClick={() => handleProductClick(ProductType.PINTA)}
                className="flex flex-col items-center justify-center h-40 md:h-48 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white text-3xl md:text-4xl rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-150 ease-in-out hover:scale-105"
              >
                <span>PINTA</span>
                <span className="text-xl md:text-2xl mt-2 font-light">({pintaCount})</span>
                <span className="text-base md:text-lg mt-1 font-normal">${feriaConfig.valorPinta.toFixed(2)} c/u</span>
              </Button>
              <Button
                size="lg"
                onClick={() => handleProductClick(ProductType.LITRO)}
                className="flex flex-col items-center justify-center h-40 md:h-48 bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-3xl md:text-4xl rounded-xl shadow-lg hover:shadow-xl transform transition-all duration-150 ease-in-out hover:scale-105"
              >
                <span>LITRO</span>
                <span className="text-xl md:text-2xl mt-2 font-light">({litroCount})</span>
                <span className="text-base md:text-lg mt-1 font-normal">${feriaConfig.valorLitro.toFixed(2)} c/u</span>
              </Button>
            </div>
          </div>

          {/* Payment Section */}
          <div className="flex-1 w-full space-y-4 pt-6 sm:pt-0 border-t sm:border-t-0 sm:border-l border-gray-100 sm:pl-6">
            <h2 className="text-2xl font-bold text-gray-700">PAGO</h2>
            <div className="bg-emerald-100 p-4 rounded-lg text-center shadow-inner">
              <p className="text-xl font-bold text-gray-700">TOTAL:</p>
              <p className="text-5xl font-extrabold text-teal-600 mt-1 animate-pulse">
                ${partialAmount.toFixed(2)}
              </p>
            </div>
            <div className="flex flex-col gap-4">
              <Button
                onClick={() => handlePayment(PaymentType.DIGITAL)}
                className="h-28 md:h-32 bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-gray-800 text-3xl md:text-4xl rounded-xl shadow-md hover:shadow-lg transform transition-all duration-150 ease-in-out hover:scale-105"
                fullWidth
                disabled={partialAmount <= 0}
              >
                $ DIGITAL
              </Button>
              <Button
                onClick={() => handlePayment(PaymentType.BILLETA)}
                className="h-28 md:h-32 bg-gray-300 hover:bg-gray-400 active:bg-gray-500 text-gray-800 text-3xl md:text-4xl rounded-xl shadow-md hover:shadow-lg transform transition-all duration-150 ease-in-out hover:scale-105"
                fullWidth
                disabled={partialAmount <= 0}
              >
                $ BILLETE
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesTerminal;
