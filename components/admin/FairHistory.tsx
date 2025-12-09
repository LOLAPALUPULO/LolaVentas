import React, { useState, useEffect, useCallback } from 'react';
import { Fair } from '../../types';
import { getAllFairs } from '../../services/firebaseService';
import { Button } from '../Button';
import { ActiveFairReport } from './ActiveFairReport';
import { Spinner } from '../Spinner';

interface FairHistoryProps {
  onSelectFair: (fair: Fair) => void;
  isOnline: boolean;
}

export const FairHistory: React.FC<FairHistoryProps> = ({ onSelectFair, isOnline }) => {
  const [fairs, setFairs] = useState<Fair[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedFair, setSelectedFair] = useState<Fair | null>(null);

  const fetchFairs = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetchedFairs = await getAllFairs();
      setFairs(fetchedFairs);
    } catch (e: any) {
      console.error('Error fetching fairs:', e);
      setError('Error al cargar el historial de ferias: ' + e.message + (!isOnline ? ' (Puede estar viendo datos en caché)' : ''));
    } finally {
      setLoading(false);
    }
  }, [isOnline]);

  useEffect(() => {
    fetchFairs();
  }, [fetchFairs]);

  const handleViewReport = (fair: Fair) => {
    setSelectedFair(fair);
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 flex-col">
        <Spinner size="lg" color="text-blue-600" />
        <p className="mt-4 text-gray-700">Cargando historial {isOnline ? '' : '(puede usar datos en caché si no hay conexión)'}...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center p-4 text-lg font-medium">{error}</p>;
  }

  if (selectedFair) {
    return (
      <div className="relative p-2 md:p-4">
        <Button
          onClick={() => setSelectedFair(null)}
          variant="secondary"
          className="mb-4 absolute top-0 left-0 z-10 !py-2 !px-4"
        >
          &larr; Volver al Historial
        </Button>
        <div className="pt-12 md:pt-16"> {/* Add padding to prevent content overlap with back button */}
          <ActiveFairReport fair={selectedFair} onCloseSales={() => { /* No close sales from history */ }} isOnline={isOnline} />
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl mx-auto w-full border border-gray-100">
      <h3 className="text-3xl font-bold mb-6 text-gray-800 text-center">Historial de Ferias</h3>

      {fairs.length === 0 ? (
        <p className="text-gray-600 text-center text-lg">No hay ferias registradas aún.</p>
      ) : (
        <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-100">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Nombre
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha Inicio
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Fecha Fin
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-100">
              {fairs.map((fair, index) => (
                <tr key={fair.id} className={index % 2 === 0 ? 'bg-white' : 'bg-gray-50'}>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                    {fair.nameFeria}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(fair.startDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                    {new Date(fair.endDate).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${fair.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
                      {fair.isActive ? 'Activa' : 'Cerrada'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <Button onClick={() => handleViewReport(fair)} variant="ghost" size="sm" className="text-blue-600 hover:bg-blue-50">
                      Ver Reporte
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};