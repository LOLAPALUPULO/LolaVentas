import React, { useState, useEffect, useCallback } from 'react';
import { Fair, UnitType, PaymentType } from '../types';
import { addSale } from '../services/firebaseService';
import { playBeep } from '../utils/audioUtils';
import { SALES_USER } from '../constants';

interface SalesPOSProps {
  activeFair: Fair;
  onFairUpdate: (fair: Fair | null) => void;
}

const SalesPOS: React.FC<SalesPOSProps> = ({ activeFair, onFairUpdate }) => {
  const [pintaCount, setPintaCount] = useState<number>(0);
  const [literCount, setLiterCount] = useState<number>(0);
  const [partialTotal, setPartialTotal] = useState<number>(0);
  const [message, setMessage] = useState<string>('');
  const [isProcessing, setIsProcessing] = useState<boolean>(false);

  useEffect(() => {
    const total = (pintaCount * activeFair.pintaValue) + (literCount * activeFair.literValue);
    setPartialTotal(total);
  }, [pintaCount, literCount, activeFair.pintaValue, activeFair.literValue]);

  const handleUnitIncrement = (unit: UnitType) => {
    if (unit === UnitType.Pinta) {
      setPintaCount(prev => prev + 1);
    } else {
      setLiterCount(prev => prev + 1);
    }
  };

  const handleUnitDecrement = (unit: UnitType) => {
    if (unit === UnitType.Pinta && pintaCount > 0) {
      setPintaCount(prev => prev - 1);
    } else if (unit === UnitType.Litro && literCount > 0) {
      setLiterCount(prev => prev - 1);
    }
  };

  const resetCounters = useCallback(() => {
    setPintaCount(0);
    setLiterCount(0);
    setPartialTotal(0);
  }, []);

  const handlePayment = async (paymentType: PaymentType) => {
    if (partialTotal <= 0 || (pintaCount === 0 && literCount === 0)) {
      setMessage('No hay ventas para registrar.');
      setTimeout(() => setMessage(''), 3000);
      return;
    }

    setIsProcessing(true);
    setMessage('');
    try {
      if (paymentType === PaymentType.Digital) {
        playBeep(440, 100); // Beep for Digital
      } else {
        playBeep(660, 100); // Higher beep for Billete
      }

      const salesToRecord = [];
      if (pintaCount > 0) {
        salesToRecord.push({
          fairId: activeFair.id,
          unitType: UnitType.Pinta,
          quantity: pintaCount,
          totalAmount: pintaCount * activeFair.pintaValue,
          paymentType,
          userName: SALES_USER,
        });
      }
      if (literCount > 0) {
        salesToRecord.push({
          fairId: activeFair.id,
          unitType: UnitType.Litro,
          quantity: literCount,
          totalAmount: literCount * activeFair.literValue,
          paymentType,
          userName: SALES_USER,
        });
      }

      // Record each item as a separate sale for detailed tracking
      // Or combine into one sale if preferred, depends on exact data granularity needed
      await Promise.all(salesToRecord.map(sale => addSale(sale)));

      setMessage('CARGADO');
      resetCounters();
      setTimeout(() => setMessage(''), 2000);
    } catch (error) {
      console.error("Error al registrar la venta:", error);
      setMessage(`Error: ${(error as Error).message}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="flex flex-col items-center p-4 sm:p-6 bg-white rounded-lg shadow-md min-h-[70vh]">
      <h2 className="text-4xl font-pitched-battle text-gray-800 mb-6 border-b pb-2 w-full text-center">
        Punto de Venta: {activeFair.name}
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-2xl mb-8">
        {/* Product Buttons */}
        <div className="col-span-1 bg-blue-50 p-6 rounded-lg shadow-inner flex flex-col justify-between items-center text-center">
          <h3 className="text-2xl font-semibold text-blue-800 mb-4">VENTA PINTA</h3>
          <p className="text-6xl font-bold text-blue-600 mb-4">{pintaCount}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => handleUnitDecrement(UnitType.Pinta)}
              disabled={pintaCount === 0 || isProcessing}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-3xl font-bold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <button
              onClick={() => handleUnitIncrement(UnitType.Pinta)}
              disabled={isProcessing}
              className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white text-3xl font-bold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          <p className="mt-4 text-xl text-gray-700">($ {activeFair.pintaValue.toFixed(2)} c/u)</p>
        </div>

        <div className="col-span-1 bg-green-50 p-6 rounded-lg shadow-inner flex flex-col justify-between items-center text-center">
          <h3 className="text-2xl font-semibold text-green-800 mb-4">VENTA LITRO</h3>
          <p className="text-6xl font-bold text-green-600 mb-4">{literCount}</p>
          <div className="flex space-x-4">
            <button
              onClick={() => handleUnitDecrement(UnitType.Litro)}
              disabled={literCount === 0 || isProcessing}
              className="px-6 py-3 bg-red-500 hover:bg-red-600 text-white text-3xl font-bold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              -
            </button>
            <button
              onClick={() => handleUnitIncrement(UnitType.Litro)}
              disabled={isProcessing}
              className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white text-3xl font-bold rounded-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              +
            </button>
          </div>
          <p className="mt-4 text-xl text-gray-700">($ {activeFair.literValue.toFixed(2)} c/u)</p>
        </div>
      </div>

      {/* Partial Total and Payment Buttons */}
      <div className="w-full max-w-2xl bg-purple-50 p-6 rounded-lg shadow-lg text-center mb-8">
        <h3 className="text-2xl font-semibold text-purple-800">CÁLCULO PARCIAL</h3>
        <p className="text-6xl font-bold text-purple-600 mt-2">$ {partialTotal.toFixed(2)}</p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 w-full max-w-2xl">
        <button
          onClick={() => handlePayment(PaymentType.Digital)}
          disabled={isProcessing || partialTotal === 0}
          className="w-full py-6 bg-indigo-600 hover:bg-indigo-700 text-white text-3xl font-bold rounded-lg shadow-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          $ DIGITAL
        </button>
        <button
          onClick={() => handlePayment(PaymentType.Billete)}
          disabled={isProcessing || partialTotal === 0}
          className="w-full py-6 bg-orange-600 hover:bg-orange-700 text-white text-3xl font-bold rounded-lg shadow-xl transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          $ BILLETE
        </button>
      </div>

      {message && (
        <div className={`mt-8 px-6 py-3 rounded-lg text-2xl font-bold ${message === 'CARGADO' ? 'bg-green-500 text-white' : 'bg-red-500 text-white'}`}>
          {message}
        </div>
      )}
    </div>
  );
};

export default SalesPOS;
