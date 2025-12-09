import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Button } from '../Button';
import { Fair, Sale, UnitType, PaymentType } from '../../types';
import { getFair, addSale } from '../../services/firebaseService';
import { BILLETE_PAYMENT_SOUND_URL, DIGITAL_PAYMENT_SOUND_URL } from '../../constants';
import { Spinner } from '../Spinner';
import { Modal } from '../Modal';

interface SalesTerminalProps {
  onLogout: () => void;
  activeFairId: string | null;
  sellerName: string;
  isOnline: boolean;
}

export const SalesTerminal: React.FC<SalesTerminalProps> = ({ onLogout, activeFairId, sellerName, isOnline }) => {
  const [fair, setFair] = useState<Fair | null>(null);
  const [quantityPintas, setQuantityPintas] = useState(0);
  const [quantityLitros, setQuantityLitros] = useState(0);
  const [partialTotal, setPartialTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [savingSale, setSavingSale] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [showLoadedModal, setShowLoadedModal] = useState(false);

  const digitalSound = useRef(new Audio(DIGITAL_PAYMENT_SOUND_URL));
  const billeteSound = useRef(new Audio(BILLETE_PAYMENT_SOUND_URL));

  const fetchFair = useCallback(async () => {
    setLoading(true);
    setMessage(null);
    if (activeFairId) {
      try {
        const fetchedFair = await getFair(activeFairId);
        if (fetchedFair && fetchedFair.isActive) {
          setFair(fetchedFair);
        } else {
          setFair(null);
          setMessage('No hay una feria activa. Por favor, espere a que un administrador configure una.');
        }
      } catch (e: any) {
        console.error('Error fetching fair:', e);
        setMessage('Error al cargar la feria activa: ' + e.message + (!isOnline ? ' (Estás offline, los datos pueden no estar actualizados)' : ''));
      }
    } else {
      setMessage('No hay una feria activa. Por favor, espere a que un administrador configure una.');
    }
    setLoading(false);
  }, [activeFairId, isOnline]);

  useEffect(() => {
    fetchFair();
  }, [fetchFair]);

  useEffect(() => {
    if (fair) {
      const calculatedPartialTotal =
        (quantityPintas * fair.pintaPrice) +
        (quantityLitros * fair.literPrice);
      setPartialTotal(calculatedPartialTotal);
    }
  }, [quantityPintas, quantityLitros, fair]);

  const handleAddUnit = (unitType: UnitType) => {
    if (unitType === UnitType.Pinta) {
      setQuantityPintas(prev => prev + 1);
    } else {
      setQuantityLitros(prev => prev + 1);
    }
  };

  const resetCounters = () => {
    setQuantityPintas(0);
    setQuantityLitros(0);
    setPartialTotal(0);
  };

  const handleRegisterSale = async (paymentType: PaymentType) => {
    if (!fair || (!quantityPintas && !quantityLitros)) {
      setMessage('No hay productos seleccionados para registrar la venta.');
      return;
    }

    setSavingSale(true);
    setMessage(null);

    const salesToRegister: Omit<Sale, 'id'>[] = [];

    if (quantityPintas > 0) {
      salesToRegister.push({
        fairId: fair.id!,
        saleDate: new Date().toISOString(),
        unitType: UnitType.Pinta,
        quantityUnits: quantityPintas,
        totalAmount: quantityPintas * fair.pintaPrice,
        paymentType,
        sellerUser: sellerName,
      });
    }

    if (quantityLitros > 0) {
      salesToRegister.push({
        fairId: fair.id!,
        saleDate: new Date().toISOString(),
        unitType: UnitType.Litro,
        quantityUnits: quantityLitros,
        totalAmount: quantityLitros * fair.literPrice,
        paymentType,
        sellerUser: sellerName,
      });
    }

    try {
      for (const sale of salesToRegister) {
        await addSale(sale); // Firestore's persistence will queue this if offline
      }
      resetCounters();
      setShowLoadedModal(true);
      if (paymentType === PaymentType.Digital) {
        digitalSound.current.play();
      } else {
        billeteSound.current.play();
      }
      setTimeout(() => setShowLoadedModal(false), 1500); // Clear message after 1.5 seconds
    } catch (e: any) {
      console.error('Error registering sale:', e);
      setMessage('Error al registrar la venta: ' + e.message + (isOnline ? '' : ' (Se intentará sincronizar cuando estés online)'));
    } finally {
      setSavingSale(false);
    }
  };

  const paymentButtonsDisabled = savingSale || (!quantityPintas && !quantityLitros) || !fair;

  if (loading) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-2xl max-w-md w-full border border-gray-100">
        <Spinner size="lg" color="text-blue-600" />
        <p className="mt-4 text-gray-700 text-lg">Cargando feria activa {isOnline ? '' : '(puede usar datos en caché si no hay conexión)'}...</p>
      </div>
    );
  }

  if (!fair) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-2xl shadow-2xl max-w-md w-full text-center border border-gray-100">
        <h2 className="text-3xl font-bold text-gray-800 mb-4">Terminal de Ventas</h2>
        <p className="text-gray-600 mb-6 text-lg">
          {message || 'No se encontró una feria activa. Contacte al administrador.'}
        </p>
        <Button onClick={onLogout} variant="secondary" className="mt-4 px-8 py-3 text-lg">
          CERRAR SESIÓN
        </Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-2xl p-4 md:p-8 w-full max-w-md h-auto min-h-[80vh] relative border border-gray-100">
      <div className="flex justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-3xl font-bold text-gray-800">Terminal de Ventas</h2>
        <Button onClick={onLogout} variant="secondary" className="px-6 py-2">
          CERRAR SESIÓN
        </Button>
      </div>

      <div className="flex-grow flex flex-col justify-between">
        {!isOnline && (
          <p className="text-red-500 text-center mb-4 text-sm font-semibold">
            Estás offline. Las ventas se registrarán localmente y se sincronizarán cuando recuperes la conexión.
          </p>
        )}
        {/* Product Buttons */}
        <div className="grid grid-cols-1 gap-4 mb-6">
          <Button
            onClick={() => handleAddUnit(UnitType.Pinta)}
            className="w-full h-28 bg-blue-600 hover:bg-blue-700 text-white text-2xl md:text-3xl font-extrabold flex flex-col justify-center items-center"
          >
            PINTA ($ {fair.pintaPrice.toFixed(2)})
            <span className="text-5xl mt-2">{quantityPintas}</span>
          </Button>
          <Button
            onClick={() => handleAddUnit(UnitType.Litro)}
            className="w-full h-28 bg-green-600 hover:bg-green-700 text-white text-2xl md:text-3xl font-extrabold flex flex-col justify-center items-center"
          >
            LITRO ($ {fair.literPrice.toFixed(2)})
            <span className="text-5xl mt-2">{quantityLitros}</span>
          </Button>
        </div>

        {/* Partial Total */}
        <div className="bg-gray-100 p-4 md:p-6 rounded-xl shadow-inner mb-6 text-center border border-gray-200">
          <p className="text-gray-700 text-xl font-semibold mb-2">Cálculo Parcial</p>
          <p className="text-6xl md:text-7xl font-extrabold text-indigo-700">$ {partialTotal.toFixed(2)}</p>
        </div>

        {/* Payment Buttons */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Button
            onClick={() => handleRegisterSale(PaymentType.Digital)}
            disabled={paymentButtonsDisabled}
            variant="warning"
            className="w-full h-24 text-2xl md:text-3xl"
            loading={savingSale}
          >
            $ DIGITAL
          </Button>
          <Button
            onClick={() => handleRegisterSale(PaymentType.Billete)}
            disabled={paymentButtonsDisabled}
            variant="primary"
            className="w-full h-24 text-2xl md:text-3xl bg-purple-600 hover:bg-purple-700" // Custom color for Billete
            loading={savingSale}
          >
            $ BILLETE
          </Button>
        </div>
      </div>

      <Modal isOpen={showLoadedModal} title="Venta Registrada">
        <p className="text-center text-green-600 text-3xl font-bold animate-pulse">¡CARGADO!</p>
      </Modal>
      {message && !showLoadedModal && ( // Only show error/info messages, not 'CARGADO'
        <Modal isOpen={true} onClose={() => setMessage(null)} title="Atención">
          <p className="text-center text-red-500 text-lg">{message}</p>
          <div className="flex justify-center mt-6">
            <Button onClick={() => setMessage(null)} variant="secondary">Cerrar</Button>
          </div>
        </Modal>
      )}
    </div>
  );
};