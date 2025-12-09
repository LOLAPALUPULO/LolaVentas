import React, { useState, useEffect, useCallback } from 'react';
import { Button } from '../Button';
import { FairConfigForm } from './FairConfigForm';
import { ActiveFairReport } from './ActiveFairReport';
import { FairHistory } from './FairHistory';
import { Fair } from '../../types';
import { getActiveFair, getFair, updateFair } from '../../services/firebaseService';
import { Modal } from '../Modal';
import { Spinner } from '../Spinner';

interface AdminDashboardProps {
  onLogout: () => void;
  onSetActiveFair: (fairId: string | null) => void;
  activeFairId: string | null;
  isOnline: boolean;
}

enum AdminView {
  ConfigFair = 'Configurar Feria',
  ActiveFairReport = 'Reporte de Feria Activa',
  FairHistory = 'Historial de Ferias',
}

export const AdminDashboard: React.FC<AdminDashboardProps> = ({ onLogout, onSetActiveFair, activeFairId, isOnline }) => {
  const [currentView, setCurrentView] = useState<AdminView>(AdminView.ConfigFair);
  const [fairData, setFairData] = useState<Fair | null>(null);
  const [loadingFair, setLoadingFair] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);
  const [showConfirmCloseModal, setShowConfirmCloseModal] = useState<boolean>(false);

  const fetchActiveFair = useCallback(async () => {
    setLoadingFair(true);
    setError(null);
    try {
      let fetchedFair: Fair | null = null;
      if (activeFairId) {
        fetchedFair = await getFair(activeFairId);
      } else {
        fetchedFair = await getActiveFair();
      }

      if (fetchedFair) {
        setFairData(fetchedFair);
        onSetActiveFair(fetchedFair.id || null);
        // If there's an active fair, default to its report; otherwise, go to config.
        setCurrentView(fetchedFair.isActive ? AdminView.ActiveFairReport : AdminView.FairHistory);
      } else {
        setFairData(null);
        onSetActiveFair(null);
        setCurrentView(AdminView.ConfigFair); // Default to config if no active fair
      }
    } catch (e: any) {
      console.error("Error fetching active fair:", e);
      setError("Error al cargar la feria activa: " + e.message + (isOnline ? '' : ' (Estás offline, los datos pueden no estar actualizados)'));
      setFairData(null);
      onSetActiveFair(null);
      setCurrentView(AdminView.ConfigFair);
    } finally {
      setLoadingFair(false);
    }
  }, [activeFairId, onSetActiveFair, isOnline]);

  useEffect(() => {
    fetchActiveFair();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeFairId, isOnline]); // Re-fetch if activeFairId or online status changes

  const handleFairSaved = (fair: Fair) => {
    setFairData(fair);
    onSetActiveFair(fair.id || null);
    setCurrentView(AdminView.ActiveFairReport);
  };

  const handleCloseSales = async () => {
    if (!fairData || !fairData.id) return;
    if (!isOnline) {
      setError("Necesitas conexión a internet para cerrar las ventas.");
      setShowConfirmCloseModal(false);
      return;
    }
    setLoadingFair(true);
    try {
      await updateFair(fairData.id, { isActive: false, closedDate: new Date().toISOString() });
      setFairData(prev => prev ? { ...prev, isActive: false, closedDate: new Date().toISOString() } : null);
      onSetActiveFair(null); // No active fair after closing
      setShowConfirmCloseModal(false);
      setCurrentView(AdminView.FairHistory); // Move to history after closing
    } catch (e: any) {
      console.error("Error closing fair:", e);
      setError("Error al cerrar las ventas: " + e.message);
    } finally {
      setLoadingFair(false);
    }
  };

  if (loadingFair) {
    return (
      <div className="flex flex-col items-center justify-center p-8 bg-white rounded-xl shadow-2xl max-w-lg w-full">
        <Spinner size="lg" color="text-blue-600" />
        <p className="mt-4 text-gray-700">Cargando feria...</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col bg-white rounded-2xl shadow-2xl p-4 md:p-8 w-full max-w-6xl h-auto min-h-[80vh] border border-gray-100">
      <div className="flex flex-col md:flex-row justify-between items-center mb-6 pb-4 border-b border-gray-200">
        <h2 className="text-4xl font-extrabold text-gray-900">Panel de Administración</h2>
        <Button onClick={onLogout} variant="secondary" className="mt-4 md:mt-0 px-6 py-2">
          CERRAR SESIÓN
        </Button>
      </div>

      {error && <p className="text-red-500 text-center mb-4 text-sm font-semibold">{error}</p>}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Button
          onClick={() => setCurrentView(AdminView.ConfigFair)}
          variant={currentView === AdminView.ConfigFair ? 'primary' : 'secondary'}
          size="lg"
        >
          {AdminView.ConfigFair}
        </Button>
        <Button
          onClick={() => setCurrentView(AdminView.ActiveFairReport)}
          variant={currentView === AdminView.ActiveFairReport ? 'primary' : 'secondary'}
          disabled={!fairData || !fairData.isActive}
          size="lg"
        >
          {AdminView.ActiveFairReport}
        </Button>
        <Button
          onClick={() => setCurrentView(AdminView.FairHistory)}
          variant={currentView === AdminView.FairHistory ? 'primary' : 'secondary'}
          size="lg"
        >
          {AdminView.FairHistory}
        </Button>
      </div>

      <div className="flex-grow bg-gray-50 p-6 rounded-xl shadow-inner border border-gray-100">
        {currentView === AdminView.ConfigFair && (
          <FairConfigForm
            onFairSaved={handleFairSaved}
            initialFair={fairData && fairData.isActive ? fairData : null}
            isOnline={isOnline}
          />
        )}
        {currentView === AdminView.ActiveFairReport && fairData && fairData.isActive && (
          <ActiveFairReport
            fair={fairData}
            onCloseSales={() => setShowConfirmCloseModal(true)}
            isOnline={isOnline}
          />
        )}
        {currentView === AdminView.ActiveFairReport && (!fairData || !fairData.isActive) && (
          <div className="text-center p-8 text-gray-600">
            <p className="text-2xl font-semibold mb-4">No hay feria activa para reportar.</p>
            <p className="text-lg">Por favor, configura una nueva feria en la pestaña "Configurar Feria" para empezar.</p>
          </div>
        )}
        {currentView === AdminView.FairHistory && (
          <FairHistory onSelectFair={handleFairSaved} isOnline={isOnline} />
        )}
      </div>

      <Modal
        isOpen={showConfirmCloseModal}
        onClose={() => setShowConfirmCloseModal(false)}
        title="Confirmar Cierre de Ventas"
        footer={
          <div className="flex justify-end gap-3">
            <Button variant="secondary" onClick={() => setShowConfirmCloseModal(false)}>
              Cancelar
            </Button>
            <Button variant="danger" onClick={handleCloseSales} loading={loadingFair} disabled={!isOnline}>
              Confirmar y Cerrar
            </Button>
          </div>
        }
      >
        <p className="text-gray-700 text-lg">
          ¿Estás seguro de que quieres cerrar las ventas de la feria actual ({fairData?.nameFeria})?
          Esto finalizará la feria y generará el reporte final. No se podrán registrar más ventas para esta feria.
          {!isOnline && <span className="block mt-2 font-medium text-red-600">Necesitas conexión a internet para cerrar las ventas.</span>}
        </p>
      </Modal>
    </div>
  );
};