import React, { useState, useEffect, useCallback } from 'react';
import { Fair, Sale } from '../types';
import FairConfigForm from './FairConfigForm';
import ActiveFairReport from './ActiveFairReport';
import { getFairs, getSalesForFair } from '../services/firebaseService';
import { format } from 'date-fns';

interface AdminDashboardProps {
  activeFair: Fair | null;
  onFairUpdate: (fair: Fair | null) => void;
}

enum AdminView {
  Config = 'Configurar Feria',
  ActiveReport = 'Reporte de Feria Activa',
  History = 'Historial de Ferias',
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ activeFair, onFairUpdate }) => {
  const [currentView, setCurrentView] = useState<AdminView>(AdminView.Config);
  const [fairHistory, setFairHistory] = useState<Fair[]>([]);
  const [selectedHistoricalFair, setSelectedHistoricalFair] = useState<Fair | null>(null);
  const [historicalSales, setHistoricalSales] = useState<Sale[]>([]);
  const [isLoadingHistory, setIsLoadingHistory] = useState<boolean>(false);
  const [isLoadingSales, setIsLoadingSales] = useState<boolean>(false);

  const fetchFairHistory = useCallback(async () => {
    setIsLoadingHistory(true);
    try {
      const fairs = await getFairs();
      setFairHistory(fairs.filter(f => f.id !== activeFair?.id)); // Exclude active fair from history
    } catch (error) {
      console.error("Error fetching fair history:", error);
    } finally {
      setIsLoadingHistory(false);
    }
  }, [activeFair?.id]);

  useEffect(() => {
    // eslint-disable-next-line react-hooks/exhaustive-deps
    fetchFairHistory();
  }, [fetchFairHistory, activeFair]); // Re-fetch history if activeFair changes

  const handleSelectHistoricalFair = useCallback(async (fair: Fair) => {
    setSelectedHistoricalFair(fair);
    setIsLoadingSales(true);
    try {
      const sales = await getSalesForFair(fair.id);
      setHistoricalSales(sales);
    } catch (error) {
      console.error("Error fetching historical sales:", error);
    } finally {
      setIsLoadingSales(false);
    }
  }, []);

  const clearSelectedHistoricalFair = useCallback(() => {
    setSelectedHistoricalFair(null);
    setHistoricalSales([]);
  }, []);

  return (
    <div className="flex flex-col">
      <nav className="mb-6 flex flex-wrap justify-center sm:justify-start gap-2 sm:gap-4 p-4 bg-gray-50 rounded-lg shadow-inner">
        {Object.values(AdminView).map((view) => (
          <button
            key={view}
            onClick={() => {
              setCurrentView(view);
              clearSelectedHistoricalFair(); // Clear history selection when changing view
            }}
            className={`px-4 py-2 rounded-lg text-lg font-semibold transition duration-200 ease-in-out
              ${currentView === view
                ? 'bg-blue-500 text-white shadow-md'
                : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
              }`}
          >
            {view}
          </button>
        ))}
      </nav>

      <div className="bg-white p-6 rounded-lg shadow-md min-h-[50vh]">
        {currentView === AdminView.Config && (
          <FairConfigForm activeFair={activeFair} onFairConfigured={onFairUpdate} />
        )}

        {currentView === AdminView.ActiveReport && (
          activeFair ? (
            <ActiveFairReport fair={activeFair} onFairClosed={onFairUpdate} />
          ) : (
            <div className="text-center text-xl text-gray-600 p-8 bg-yellow-50 rounded-lg">
              No hay una feria activa para mostrar el reporte. Por favor, configura una nueva feria.
            </div>
          )
        )}

        {currentView === AdminView.History && (
          <div>
            <h2 className="text-3xl font-pitched-battle text-gray-800 mb-6 border-b pb-2">Historial de Ferias</h2>
            {isLoadingHistory ? (
              <div className="flex items-center justify-center text-blue-500">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500 mr-3"></div>
                Cargando historial de ferias...
              </div>
            ) : fairHistory.length === 0 ? (
              <p className="text-gray-600 text-center text-lg">No hay ferias en el historial.</p>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {fairHistory.map((fair) => (
                  <button
                    key={fair.id}
                    onClick={() => handleSelectHistoricalFair(fair)}
                    className={`block w-full text-left p-4 rounded-lg shadow-sm border
                      ${selectedHistoricalFair?.id === fair.id
                        ? 'bg-blue-100 border-blue-400 ring-2 ring-blue-300'
                        : 'bg-white border-gray-200 hover:bg-gray-50 hover:shadow-md'
                      } transition duration-200`}
                  >
                    <h3 className="text-xl font-semibold text-gray-800">{fair.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">
                      {format(new Date(fair.startDate), 'dd/MM/yyyy')} - {format(new Date(fair.endDate), 'dd/MM/yyyy')}
                    </p>
                    <p className="text-xs text-gray-500">ID: {fair.id.substring(0, 8)}...</p>
                  </button>
                ))}
              </div>
            )}

            {selectedHistoricalFair && (
              <div className="mt-8 pt-8 border-t border-gray-200">
                <h3 className="text-2xl font-pitched-battle text-gray-800 mb-4">Reporte de Feria Histórica: {selectedHistoricalFair.name}</h3>
                <button
                  onClick={clearSelectedHistoricalFair}
                  className="mb-4 px-4 py-2 bg-gray-300 hover:bg-gray-400 text-gray-800 rounded-lg transition duration-200"
                >
                  &larr; Volver al Historial
                </button>
                <ActiveFairReport fair={selectedHistoricalFair} initialSales={historicalSales} onFairClosed={onFairUpdate} hideCloseButton={true} isLoadingSales={isLoadingSales} />
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
