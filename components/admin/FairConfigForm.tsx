import React, { useState, useEffect } from 'react';
import { Button } from '../Button';
import { Input } from '../Input';
import { createFair, updateFair } from '../../services/firebaseService';
import { Fair } from '../../types';

interface FairConfigFormProps {
  onFairSaved: (fair: Fair) => void;
  initialFair: Fair | null;
  isOnline: boolean;
}

export const FairConfigForm: React.FC<FairConfigFormProps> = ({ onFairSaved, initialFair, isOnline }) => {
  const [nameFeria, setNameFeria] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [pintaPrice, setPintaPrice] = useState<number>(0);
  const [literPrice, setLiterPrice] = useState<number>(0);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [isEditMode, setIsEditMode] = useState(false);

  useEffect(() => {
    if (initialFair) {
      setNameFeria(initialFair.nameFeria);
      setStartDate(initialFair.startDate);
      setEndDate(initialFair.endDate);
      setPintaPrice(initialFair.pintaPrice);
      setLiterPrice(initialFair.literPrice);
      setIsEditMode(true);
      setMessage(null);
    } else {
      resetForm();
      setIsEditMode(false);
    }
  }, [initialFair]);

  const resetForm = () => {
    setNameFeria('');
    setStartDate('');
    setEndDate('');
    setPintaPrice(0);
    setLiterPrice(0);
    setMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nameFeria || !startDate || !endDate || pintaPrice <= 0 || literPrice <= 0) {
      setMessage('Por favor, complete todos los campos y asegúrese que los precios son mayores a 0.');
      return;
    }

    if (!isOnline) {
      setMessage('Estás offline. Necesitas conexión a internet para guardar o actualizar la feria.');
      return;
    }

    setLoading(true);
    setMessage(null);

    const newFairData: Omit<Fair, 'id' | 'createdAt' | 'updatedAt'> = { // Exclude timestamps for initial object
      nameFeria,
      startDate,
      endDate,
      pintaPrice,
      literPrice,
      isActive: true,
    };

    try {
      if (isEditMode && initialFair?.id) {
        await updateFair(initialFair.id, newFairData);
        onFairSaved({ ...initialFair, ...newFairData });
        setMessage('Feria actualizada exitosamente!');
      } else {
        const createdFair = await createFair(newFairData);
        onFairSaved(createdFair);
        setMessage('Feria creada exitosamente y activada!');
        resetForm();
      }
    } catch (error: any) {
      console.error('Error saving fair:', error);
      setMessage(`Error al guardar la feria: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-2xl mx-auto border border-gray-100">
      <h3 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        {isEditMode ? 'Editar Configuración de Feria' : 'Configurar Nueva Feria'}
      </h3>
      {!isOnline && (
        <p className="text-red-500 text-center mb-4 text-sm font-semibold">
          Estás offline. No puedes configurar/actualizar la feria sin conexión.
        </p>
      )}
      <form onSubmit={handleSubmit} className="space-y-5">
        <Input
          id="nameFeria"
          label="NOMBRE DE LA FERIA"
          value={nameFeria}
          onChange={(e) => setNameFeria(e.target.value)}
          placeholder="Ej: Feria de Cerveza Artesanal"
          required
        />
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="startDate"
            label="FECHA DE INICIO"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
          <Input
            id="endDate"
            label="FECHA DE FIN"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Input
            id="pintaPrice"
            label="VALOR PINTA"
            type="number"
            value={pintaPrice === 0 ? '' : pintaPrice}
            onChange={(e) => setPintaPrice(parseFloat(e.target.value) || 0)}
            min="0.01"
            step="0.01"
            required
          />
          <Input
            id="literPrice"
            label="VALOR LITRO"
            type="number"
            value={literPrice === 0 ? '' : literPrice}
            onChange={(e) => setLiterPrice(parseFloat(e.target.value) || 0)}
            min="0.01"
            step="0.01"
            required
          />
        </div>
        {message && (
          <p className={`text-center text-base mt-4 ${message.startsWith('Error') ? 'text-red-600' : 'text-green-600'}`}>
            {message}
          </p>
        )}
        <div className="flex justify-center mt-6">
          <Button type="submit" loading={loading} className="w-full md:w-2/3 lg:w-1/2" size="lg" disabled={!isOnline || loading}>
            {isEditMode ? 'Actualizar Feria' : 'Guardar y Activar Feria'}
          </Button>
        </div>
      </form>
    </div>
  );
};