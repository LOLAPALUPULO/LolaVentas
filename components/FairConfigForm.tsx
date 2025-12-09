import React, { useState, useEffect } from 'react';
import { Fair } from '../types';
import { addFair, updateFair } from '../services/firebaseService';
import { format, isValid, parseISO } from 'date-fns';

interface FairConfigFormProps {
  activeFair: Fair | null;
  onFairConfigured: (fair: Fair | null) => void;
}

const FairConfigForm: React.FC<FairConfigFormProps> = ({ activeFair, onFairConfigured }) => {
  const [fairName, setFairName] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');
  const [pintaValue, setPintaValue] = useState<number>(0);
  const [literValue, setLiterValue] = useState<number>(0);
  const [message, setMessage] = useState<{ text: string; type: 'success' | 'error' | '' }>({ text: '', type: '' });
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

  useEffect(() => {
    if (activeFair) {
      setFairName(activeFair.name);
      setStartDate(activeFair.startDate);
      setEndDate(activeFair.endDate);
      setPintaValue(activeFair.pintaValue);
      setLiterValue(activeFair.literValue);
    } else {
      // Clear form for new fair if no active fair
      setFairName('');
      setStartDate('');
      setEndDate('');
      setPintaValue(0);
      setLiterValue(0);
    }
    setMessage({ text: '', type: '' });
  }, [activeFair]);

  const validateForm = () => {
    if (!fairName.trim() || !startDate || !endDate || pintaValue <= 0 || literValue <= 0) {
      setMessage({ text: 'Por favor, completa todos los campos y asegúrate de que los valores sean mayores que cero.', type: 'error' });
      return false;
    }
    if (!isValid(parseISO(startDate)) || !isValid(parseISO(endDate))) {
      setMessage({ text: 'Fechas inválidas. Por favor, usa el formato correcto.', type: 'error' });
      return false;
    }
    if (parseISO(startDate) > parseISO(endDate)) {
      setMessage({ text: 'La fecha de inicio no puede ser posterior a la fecha de fin.', type: 'error' });
      return false;
    }
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validateForm()) {
      return;
    }

    setIsSubmitting(true);
    setMessage({ text: '', type: '' });

    const fairData: Omit<Fair, 'id' | 'isActive'> = {
      name: fairName,
      startDate,
      endDate,
      pintaValue,
      literValue,
    };

    try {
      if (activeFair) {
        await updateFair(activeFair.id, fairData);
        const updatedFair: Fair = { ...activeFair, ...fairData };
        onFairConfigured(updatedFair);
        setMessage({ text: 'Feria actualizada con éxito.', type: 'success' });
      } else {
        const newFair = await addFair(fairData);
        onFairConfigured(newFair);
        setMessage({ text: 'Nueva feria configurada con éxito.', type: 'success' });
        // Reset form for a completely new fair creation experience after successful save
        setFairName('');
        setStartDate('');
        setEndDate('');
        setPintaValue(0);
        setLiterValue(0);
      }
    } catch (error) {
      console.error("Error al guardar la feria:", error);
      setMessage({ text: `Error al guardar la feria: ${(error as Error).message}`, type: 'error' });
    } finally {
      setIsSubmitting(false);
      setTimeout(() => setMessage({ text: '', type: '' }), 5000); // Clear message after 5 seconds
    }
  };

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-pitched-battle text-gray-800 mb-6 border-b pb-2">
        {activeFair ? 'Configurar Feria Actual' : 'Generar Nueva Feria'}
      </h2>

      {activeFair && (
        <div className="bg-blue-50 border-l-4 border-blue-400 text-blue-800 p-4 mb-6 rounded-md" role="alert">
          <p className="font-bold text-xl mb-1">Feria Activa:</p>
          <p className="text-lg">{activeFair.name}</p>
          <p>
            Fechas: {format(parseISO(activeFair.startDate), 'dd/MM/yyyy')} - {format(parseISO(activeFair.endDate), 'dd/MM/yyyy')}
          </p>
          <p>Valor Pinta: ${activeFair.pintaValue}</p>
          <p>Valor Litro: ${activeFair.literValue}</p>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        <div>
          <label htmlFor="fairName" className="block text-lg font-medium text-gray-700 mb-2">
            NOMBRE DE LA FERIA
          </label>
          <input
            type="text"
            id="fairName"
            value={fairName}
            onChange={(e) => setFairName(e.target.value)}
            className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
            required
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="startDate" className="block text-lg font-medium text-gray-700 mb-2">
              FECHA INICIO
            </label>
            <input
              type="date"
              id="startDate"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
              required
            />
          </div>
          <div>
            <label htmlFor="endDate" className="block text-lg font-medium text-gray-700 mb-2">
              FECHA FIN
            </label>
            <input
              type="date"
              id="endDate"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
              required
            />
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label htmlFor="pintaValue" className="block text-lg font-medium text-gray-700 mb-2">
              VALOR PINTA
            </label>
            <input
              type="number"
              id="pintaValue"
              value={pintaValue}
              onChange={(e) => setPintaValue(parseFloat(e.target.value) || 0)}
              min="0.01"
              step="0.01"
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
              required
            />
          </div>
          <div>
            <label htmlFor="literValue" className="block text-lg font-medium text-gray-700 mb-2">
              VALOR LITRO
            </label>
            <input
              type="number"
              id="literValue"
              value={literValue}
              onChange={(e) => setLiterValue(parseFloat(e.target.value) || 0)}
              min="0.01"
              step="0.01"
              className="mt-1 block w-full p-3 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-lg"
              required
            />
          </div>
        </div>

        {message.text && (
          <div
            className={`p-3 rounded-md text-lg font-medium ${message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}
          >
            {message.text}
          </div>
        )}

        <button
          type="submit"
          disabled={isSubmitting}
          className="w-full py-4 px-6 bg-blue-600 hover:bg-blue-700 text-white text-xl font-bold rounded-md shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? 'Guardando...' : (activeFair ? 'Actualizar Feria' : 'Guardar Nueva Feria')}
        </button>
      </form>
    </div>
  );
};

export default FairConfigForm;
