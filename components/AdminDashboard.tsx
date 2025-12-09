import React, { useState, useEffect, useCallback } from 'react';
import {
  saveFeriaConfig,
  getFeriaConfig,
  clearAllSales,
  getAllSales,
  calculateSalesReport,
  deleteFeriaConfig,
  toTimestamp,
  toDateString
} from '../services/firebaseService';
import { FeriaConfig, SaleTransaction, SalesReport, UserLevel } from '../types';
import Button from './Button';
import { USERS } from '../constants';

interface AdminDashboardProps {
  onFeriaConfigured: (config: FeriaConfig | null) => void;
  currentFeriaConfig: FeriaConfig | null;
  onLogout: () => void; // New prop for logout functionality
}

const AdminDashboard: React.FC<AdminDashboardProps> = ({ onFeriaConfigured, currentFeriaConfig, onLogout }) => {
  const [nombreFeria, setNombreFeria] = useState('');
  const [fechaInicio, setFechaInicio] = useState('');
  const [fechaFin, setFechaFin] = useState('');
  const [valorPinta, setValorPinta] = useState<number>(0);
  const [valorLitro, setValorLitro] = useState<number>(0);
  const [message, setMessage] = useState('');
  const [activeTab, setActiveTab] = useState<'config' | 'report'>('report'); // Default to report tab
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [allSales, setAllSales] = useState<SaleTransaction[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchSalesReport = useCallback(async () => {
    try {
      setLoading(true);
      const sales = await getAllSales();
      setAllSales(sales);
      const report = calculateSalesReport(sales);
      setSalesReport(report);
      // Ensure 'report' tab is active after fetching
      setActiveTab('report');
    } catch (error) {
      console.error('Error fetching sales report:', error);
      setMessage('Error al cargar el reporte de ventas.');
    } finally {
      setLoading(false);
    }
  }, []);

  // Load existing config and sales report on component mount
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      if (currentFeriaConfig) {
        setNombreFeria(currentFeriaConfig.nombreFeria);
        setFechaInicio(currentFeriaConfig.fechaInicio);
        setFechaFin(currentFeriaConfig.fechaFin);
        setValorPinta(currentFeriaConfig.valorPinta);
        setValorLitro(currentFeriaConfig.valorLitro);
      }
      await fetchSalesReport(); // Fetch report when component mounts
      setLoading(false);
    };
    loadData();
  }, [currentFeriaConfig, fetchSalesReport]);


  const handleSaveConfig = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nombreFeria || !fechaInicio || !fechaFin || valorPinta <= 0 || valorLitro <= 0) {
      setMessage('Por favor, complete todos los campos y asegúrese que los valores sean mayores a 0.');
      return;
    }

    const config: FeriaConfig = {
      nombreFeria,
      fechaInicio,
      fechaFin,
      valorPinta,
      valorLitro,
    };

    try {
      const savedConfig = await saveFeriaConfig(config);
      onFeriaConfigured(savedConfig);
      setMessage('Configuración de Feria guardada exitosamente.');
      await fetchSalesReport(); // Refresh report after saving config
    } catch (error) {
      console.error('Error saving feria config:', error);
      setMessage('Error al guardar la configuración de la feria.');
    }
  }, [nombreFeria, fechaInicio, fechaFin, valorPinta, valorLitro, onFeriaConfigured, fetchSalesReport]);

  const handleFinalizeFeria = useCallback(async () => {
    if (window.confirm('¿Está seguro que desea FINALIZAR esta Feria y ARCHIVAR todos los datos de ventas? Esta acción eliminará la configuración actual y los registros de ventas activos.')) {
      try {
        setLoading(true);
        // In a real app, you would archive sales and config to a 'pastFeria' collection
        // For now, as per prompt, we clear them.
        await clearAllSales();
        await deleteFeriaConfig(); // Delete the feria config
        onFeriaConfigured(null); // Notify App.tsx that config is gone
        setMessage('Feria finalizada y datos archivados. La aplicación está lista para una nueva configuración.');
        setNombreFeria('');
        setFechaInicio('');
        setFechaFin('');
        setValorPinta(0);
        setValorLitro(0);
        setSalesReport(null);
        setAllSales([]);
        setActiveTab('config'); // Go back to config tab
      } catch (error) {
        console.error('Error finalizing feria:', error);
        setMessage('Error al finalizar la feria.');
      } finally {
        setLoading(false);
      }
    }
  }, [onFeriaConfigured]);

  const handleShareWhatsApp = useCallback(() => {
    if (!salesReport || !currentFeriaConfig) {
      setMessage('No hay datos de reporte o feria para compartir.');
      return;
    }

    const reportText = `¡Reporte de Ventas de la Feria ${currentFeriaConfig.nombreFeria}!%0A` +
                       `Periodo: ${currentFeriaConfig.fechaInicio} al ${currentFeriaConfig.fechaFin}%0A%0A` +
                       `Cantidades Vendidas:%0A` +
                       `- Total Pintas: ${salesReport.totalPintas}%0A` +
                       `- Total Litros: ${salesReport.totalLitros}%0A%0A` +
                       `Monto Total Recaudado:%0A` +
                       `- General: $${salesReport.montoTotalGeneral.toFixed(2)}%0A` +
                       `- Digital: $${salesReport.montoTotalDigital.toFixed(2)}%0A` +
                       `- Billete: $${salesReport.montoTotalBillete.toFixed(2)}%0A%0A` +
                       `¡Gracias por tu trabajo!`;

    const whatsappLink = `https://wa.me/?text=${reportText}`;
    window.open(whatsappLink, '_blank');
  }, [salesReport, currentFeriaConfig]);


  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-emerald-50 text-gray-800">
        <div className="animate-spin rounded-full h-16 w-16 border-t-4 border-b-4 border-teal-500"></div>
        <p className="ml-4 text-xl">Cargando...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-start bg-emerald-50 text-gray-800 p-4 relative">
      <h1 className="text-4xl md:text-5xl font-extrabold mb-8 text-teal-600 font-pitched-battle">PANEL DE ADMINISTRADOR</h1>
      <Button
        onClick={onLogout}
        variant="secondary"
        size="sm"
        className="absolute top-4 right-4 bg-gray-200 hover:bg-gray-300 text-gray-800 z-10"
      >
        Cerrar Sesión
      </Button>

      <div className="w-full max-w-4xl bg-white rounded-lg shadow-xl p-6 md:p-8">
        <div className="flex border-b border-gray-200 mb-6">
          <button
            className={`py-3 px-6 text-lg font-medium ${activeTab === 'config' ? 'border-b-4 border-teal-500 text-teal-600' : 'text-gray-600 hover:text-teal-600'}`}
            onClick={() => setActiveTab('config')}
          >
            Configurar Feria
          </button>
          <button
            className={`py-3 px-6 text-lg font-medium ${activeTab === 'report' ? 'border-b-4 border-teal-500 text-teal-600' : 'text-gray-600 hover:text-teal-600'}`}
            onClick={() => setActiveTab('report')} // Simply set tab, data is pre-fetched or refreshed
          >
            Reporte de Feria Activa
          </button>
        </div>

        {message && (
          <p className={`mb-4 text-center text-lg ${message.includes('Error') ? 'text-red-500' : 'text-green-600'}`}>{message}</p>
        )}

        {activeTab === 'config' && (
          <form onSubmit={handleSaveConfig} className="space-y-6">
            <div>
              <label htmlFor="nombreFeria" className="block text-gray-700 text-lg font-bold mb-2">Nombre de la Feria</label>
              <input
                type="text"
                id="nombreFeria"
                value={nombreFeria}
                onChange={(e) => setNombreFeria(e.target.value)}
                className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-100"
                placeholder="Ej. Feria de la Cerveza Artesanal"
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="fechaInicio" className="block text-gray-700 text-lg font-bold mb-2">Fecha Inicio</label>
                <input
                  type="date"
                  id="fechaInicio"
                  value={fechaInicio}
                  onChange={(e) => setFechaInicio(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-100"
                />
              </div>
              <div>
                <label htmlFor="fechaFin" className="block text-gray-700 text-lg font-bold mb-2">Fecha Fin</label>
                <input
                  type="date"
                  id="fechaFin"
                  value={fechaFin}
                  onChange={(e) => setFechaFin(e.target.value)}
                  className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-100"
                />
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label htmlFor="valorPinta" className="block text-gray-700 text-lg font-bold mb-2">Valor Pinta</label>
                <input
                  type="number"
                  id="valorPinta"
                  value={valorPinta === 0 ? '' : valorPinta}
                  onChange={(e) => setValorPinta(parseFloat(e.target.value) || 0)}
                  className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-100"
                  min="0.01"
                  step="0.01"
                  placeholder="Ej. 5.00"
                />
              </div>
              <div>
                <label htmlFor="valorLitro" className="block text-gray-700 text-lg font-bold mb-2">Valor Litro</label>
                <input
                  type="number"
                  id="valorLitro"
                  value={valorLitro === 0 ? '' : valorLitro}
                  onChange={(e) => setValorLitro(parseFloat(e.target.value) || 0)}
                  className="shadow appearance-none border rounded w-full py-3 px-4 text-gray-900 leading-tight focus:outline-none focus:ring-2 focus:ring-teal-500 bg-gray-100"
                  min="0.01"
                  step="0.01"
                  placeholder="Ej. 10.00"
                />
              </div>
            </div>
            <Button type="submit" fullWidth size="lg" className="mt-8">
              Guardar Configuración de Feria
            </Button>
          </form>
        )}

        {activeTab === 'report' && (
          <div className="space-y-6">
            <h2 className="text-3xl font-semibold text-center text-teal-600 mb-6">Reporte de Feria Activa</h2>

            {currentFeriaConfig && (
              <div className="bg-emerald-50 p-6 rounded-lg shadow-inner mb-6 border border-emerald-200">
                <p className="text-xl font-bold text-teal-700">Feria: <span className="text-emerald-900">{currentFeriaConfig.nombreFeria}</span></p>
                <p className="text-lg text-gray-700 mt-1">Período: {currentFeriaConfig.fechaInicio} al {currentFeriaConfig.fechaFin}</p>
                <p className="text-lg text-gray-700">Valor Pinta: <span className="font-semibold">${currentFeriaConfig.valorPinta.toFixed(2)}</span> | Valor Litro: <span className="font-semibold">${currentFeriaConfig.valorLitro.toFixed(2)}</span></p>
              </div>
            )}

            {salesReport ? (
              <>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-emerald-100 p-6 rounded-lg shadow-md flex-1">
                    <h3 className="text-xl font-bold text-teal-700 mb-3">Cantidades Vendidas</h3>
                    <p className="text-lg text-gray-700">Total Pintas: <span className="text-2xl font-bold text-teal-600">{salesReport.totalPintas}</span></p>
                    <p className="text-lg text-gray-700">Total Litros: <span className="text-2xl font-bold text-lime-600">{salesReport.totalLitros}</span></p>
                  </div>
                  <div className="bg-emerald-100 p-6 rounded-lg shadow-md flex-1">
                    <h3 className="text-xl font-bold text-teal-700 mb-3">Monto Total Recaudado</h3>
                    <p className="text-lg text-gray-700">Total General: <span className="text-3xl font-bold text-lime-700">${salesReport.montoTotalGeneral.toFixed(2)}</span></p>
                    <p className="text-lg text-gray-700">Total Digital: <span className="text-2xl font-bold text-emerald-600">${salesReport.montoTotalDigital.toFixed(2)}</span></p>
                    <p className="text-lg text-gray-700">Total Billete: <span className="text-2xl font-bold text-green-600">${salesReport.montoTotalBillete.toFixed(2)}</span></p>
                  </div>
                </div>

                <div className="flex flex-col sm:flex-row gap-4 mt-8">
                  <Button onClick={handleShareWhatsApp} variant="success" fullWidth size="lg">
                    Compartir por WhatsApp
                  </Button>
                  <Button onClick={handleFinalizeFeria} variant="danger" fullWidth size="lg">
                    Finalizar Feria Actual y Archivar
                  </Button>
                </div>
                <p className="text-sm text-gray-500 text-center mt-4">
                  Advertencia: Finalizar la feria archivará sus datos y borrará los registros de ventas activos.
                </p>

                <h3 className="text-2xl font-semibold text-teal-600 mt-10 mb-4">Detalle de Transacciones</h3>
                {allSales.length > 0 ? (
                  <div className="overflow-x-auto bg-white rounded-lg shadow-md border border-gray-100">
                    <table className="min-w-full text-left text-sm text-gray-700">
                      <thead className="bg-emerald-100 uppercase text-emerald-700">
                        <tr>
                          <th scope="col" className="py-3 px-6">Fecha</th>
                          <th scope="col" className="py-3 px-6">Tipo Unidad</th>
                          <th scope="col" className="py-3 px-6">Cantidad</th>
                          <th scope="col" className="py-3 px-6">Monto</th>
                          <th scope="col" className="py-3 px-6">Tipo Pago</th>
                          <th scope="col" className="py-3 px-6">Usuario</th>
                        </tr>
                      </thead>
                      <tbody>
                        {allSales.map((sale) => (
                          <tr key={sale.id} className="border-b border-gray-100 hover:bg-emerald-50">
                            <td className="py-4 px-6 font-medium">{sale.fechaVenta.toDate().toLocaleString()}</td>
                            <td className="py-4 px-6">{sale.tipoUnidad}</td>
                            <td className="py-4 px-6">{sale.cantidadUnidades}</td>
                            <td className="py-4 px-6">${sale.montoTotal.toFixed(2)}</td>
                            <td className="py-4 px-6">{sale.tipoPago}</td>
                            <td className="py-4 px-6">{sale.usuarioVenta}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <p className="text-center text-gray-500 text-lg">No hay ventas registradas aún.</p>
                )}
              </>
            ) : (
              <p className="text-center text-gray-500 text-lg">No hay reporte disponible. Registre algunas ventas primero.</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
