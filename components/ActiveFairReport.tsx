import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { Fair, Sale, UnitType, PaymentType } from '../types';
import { getSalesForFair, closeFairSales } from '../services/firebaseService';
import { format, parseISO } from 'date-fns';
import { generateReportPdf } from '../utils/pdfGenerator';
import { shareOnWhatsApp } from '../utils/whatsappUtils';

interface ActiveFairReportProps {
  fair: Fair;
  onFairClosed: (fair: Fair | null) => void;
  initialSales?: Sale[]; // For historical fairs
  hideCloseButton?: boolean;
  isLoadingSales?: boolean;
}

const ActiveFairReport: React.FC<ActiveFairReportProps> = ({ fair, onFairClosed, initialSales, hideCloseButton = false, isLoadingSales = false }) => {
  const [sales, setSales] = useState<Sale[]>(initialSales || []);
  const [loading, setLoading] = useState<boolean>(!initialSales && fair.isActive);
  const [isClosing, setIsClosing] = useState<boolean>(false);
  const [closeMessage, setCloseMessage] = useState<string>('');

  const fetchSales = useCallback(async () => {
    setLoading(true);
    try {
      const fetchedSales = await getSalesForFair(fair.id);
      setSales(fetchedSales);
    } catch (error) {
      console.error("Error fetching sales for fair:", error);
      // Handle error display
    } finally {
      setLoading(false);
    }
  }, [fair.id]);

  useEffect(() => {
    if (!initialSales && fair.isActive) { // Only fetch if not provided and fair is active
      fetchSales();
    } else if (initialSales) {
      setSales(initialSales); // Use provided initial sales for historical
      setLoading(false); // If initialSales provided, we are not loading
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [fair.id, initialSales, fair.isActive]); // Added fair.isActive as a dependency to refetch if fair status changes

  // Recalculate totals whenever sales change
  const {
    totalPintas,
    totalLitros,
    totalDigital,
    totalBillete,
    totalRecaudado
  } = useMemo(() => {
    let pintas = 0;
    let litros = 0;
    let digital = 0;
    let billete = 0;

    sales.forEach(sale => {
      if (sale.unitType === UnitType.Pinta) {
        pintas += sale.quantity;
      } else if (sale.unitType === UnitType.Litro) {
        litros += sale.quantity;
      }

      if (sale.paymentType === PaymentType.Digital) {
        digital += sale.totalAmount;
      } else if (sale.paymentType === PaymentType.Billete) {
        billete += sale.totalAmount;
      }
    });

    return {
      totalPintas: pintas,
      totalLitros: litros,
      totalDigital: digital,
      totalBillete: billete,
      totalRecaudado: digital + billete
    };
  }, [sales]);

  const handleCloseFair = async () => {
    if (!window.confirm('¿Estás seguro de que quieres cerrar las ventas de esta feria? Esta acción no se puede deshacer.')) {
      return;
    }

    setIsClosing(true);
    setCloseMessage('');
    try {
      await closeFairSales(fair.id);
      onFairClosed(null); // Notify parent to clear active fair
      setCloseMessage('Ventas de la feria cerradas con éxito.');
    } catch (error) {
      console.error("Error al cerrar las ventas de la feria:", error);
      setCloseMessage(`Error al cerrar las ventas: ${(error as Error).message}`);
    } finally {
      setIsClosing(false);
      setTimeout(() => setCloseMessage(''), 5000); // Clear message after 5 seconds
    }
  };

  const reportData = useMemo(() => {
    return {
      fairName: fair.name,
      startDate: format(parseISO(fair.startDate), 'dd/MM/yyyy'),
      endDate: format(parseISO(fair.endDate), 'dd/MM/yyyy'),
      totalPintas,
      totalLitros,
      totalRecaudado,
      totalDigital,
      totalBillete,
      sales: sales.map(s => ({
        date: format(s.saleDate.toDate(), 'dd/MM/yyyy HH:mm'),
        type: s.unitType,
        quantity: s.quantity,
        amount: s.totalAmount,
        payment: s.paymentType,
        user: s.userName
      }))
    };
  }, [fair, totalPintas, totalLitros, totalRecaudado, totalDigital, totalBillete, sales]);

  const handleDownloadPdf = () => {
    generateReportPdf(reportData);
  };

  const handleShareWhatsApp = () => {
    const message = `*Reporte de Feria: ${fair.name}*\n` +
                    `Fechas: ${reportData.startDate} - ${reportData.endDate}\n\n` +
                    `Total Pintas vendidas: ${reportData.totalPintas}\n` +
                    `Total Litros vendidos: ${reportData.totalLitros}\n\n` +
                    `*Monto Total Recaudado: $${reportData.totalRecaudado.toFixed(2)}*\n` +
                    `  - $ Digital: $${reportData.totalDigital.toFixed(2)}\n` +
                    `  - $ Billete: $${reportData.totalBillete.toFixed(2)}\n\n` +
                    `¡Consulta el reporte completo en PDF para más detalles!`;
    shareOnWhatsApp(message);
  };

  if (loading || isLoadingSales) {
    return (
      <div className="flex flex-col items-center justify-center p-8 text-center text-blue-600">
        <div className="animate-spin rounded-full h-12 w-12 border-t-4 border-b-4 border-blue-500 mb-4"></div>
        <p className="text-xl">Cargando reporte de ventas...</p>
      </div>
    );
  }

  return (
    <div className="p-4 sm:p-6 bg-white rounded-lg shadow-md">
      <h2 className="text-3xl font-pitched-battle text-gray-800 mb-6 border-b pb-2">Reporte de Feria: {fair.name}</h2>
      <div className="mb-6 grid grid-cols-1 md:grid-cols-2 gap-4 text-lg">
        <p className="font-semibold">Fechas: <span className="font-normal">{format(parseISO(fair.startDate), 'dd/MM/yyyy')} - {format(parseISO(fair.endDate), 'dd/MM/yyyy')}</span></p>
        <p className="font-semibold">Valor Pinta: <span className="font-normal">${fair.pintaValue.toFixed(2)}</span></p>
        <p className="font-semibold">Valor Litro: <span className="font-normal">${fair.literValue.toFixed(2)}</span></p>
        <p className="font-semibold">Estado: <span className={`font-normal ${fair.isActive ? 'text-green-600' : 'text-red-600'}`}>{fair.isActive ? 'Activa' : 'Cerrada'}</span></p>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-blue-50 p-4 rounded-lg shadow-sm border border-blue-200">
          <h3 className="text-xl font-semibold text-blue-800">Pintas Vendidas</h3>
          <p className="text-4xl font-bold text-blue-600 mt-2">{totalPintas}</p>
        </div>
        <div className="bg-green-50 p-4 rounded-lg shadow-sm border border-green-200">
          <h3 className="text-xl font-semibold text-green-800">Litros Vendidos</h3>
          <p className="text-4xl font-bold text-green-600 mt-2">{totalLitros}</p>
        </div>
        <div className="bg-purple-50 p-4 rounded-lg shadow-sm border border-purple-200">
          <h3 className="text-xl font-semibold text-purple-800">Total Recaudado</h3>
          <p className="text-4xl font-bold text-purple-600 mt-2">${totalRecaudado.toFixed(2)}</p>
        </div>
      </div>

      <div className="mb-8 p-4 bg-gray-50 rounded-lg shadow-inner">
        <h3 className="text-2xl font-semibold text-gray-800 mb-4">Detalle por Tipo de Pago</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div className="bg-gray-100 p-3 rounded-md border border-gray-200">
            <p className="text-lg font-medium text-gray-700">Digital:</p>
            <p className="text-3xl font-bold text-blue-500 mt-1">${totalDigital.toFixed(2)}</p>
          </div>
          <div className="bg-gray-100 p-3 rounded-md border border-gray-200">
            <p className="text-lg font-medium text-gray-700">Billete:</p>
            <p className="text-3xl font-bold text-green-500 mt-1">${totalBillete.toFixed(2)}</p>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 mb-8">
        <button
          onClick={handleDownloadPdf}
          className="flex-1 py-3 px-6 bg-red-600 hover:bg-red-700 text-white text-lg font-bold rounded-md shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Descargar Reporte (PDF)
        </button>
        <button
          onClick={handleShareWhatsApp}
          className="flex-1 py-3 px-6 bg-green-500 hover:bg-green-600 text-white text-lg font-bold rounded-md shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Compartir Reporte (WhatsApp)
        </button>
      </div>

      {fair.isActive && !hideCloseButton && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <button
            onClick={handleCloseFair}
            disabled={isClosing}
            className="w-full py-4 px-6 bg-orange-500 hover:bg-orange-600 text-white text-xl font-bold rounded-md shadow-lg transition duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isClosing ? 'Cerrando Ventas...' : 'Cerrar Ventas de la Feria'}
          </button>
          {closeMessage && (
            <p className={`mt-4 text-center text-lg ${closeMessage.includes('Error') ? 'text-red-600' : 'text-green-600'}`}>
              {closeMessage}
            </p>
          )}
        </div>
      )}

      {sales.length > 0 && (
        <div className="mt-8 pt-6 border-t border-gray-200">
          <h3 className="text-2xl font-semibold text-gray-800 mb-4">Detalle de Ventas ({sales.length} transacciones)</h3>
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded-lg shadow-sm border border-gray-200">
              <thead className="bg-gray-100 border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Fecha</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Tipo Unidad</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Cantidad</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Monto</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Pago</th>
                  <th className="py-3 px-4 text-left text-sm font-medium text-gray-600 uppercase tracking-wider">Usuario</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {sales.map((sale) => (
                  <tr key={sale.id} className="hover:bg-gray-50">
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{format(sale.saleDate.toDate(), 'dd/MM/yyyy HH:mm')}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{sale.unitType}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{sale.quantity}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">${sale.totalAmount.toFixed(2)}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{sale.paymentType}</td>
                    <td className="py-3 px-4 whitespace-nowrap text-sm text-gray-800">{sale.userName}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default ActiveFairReport;
