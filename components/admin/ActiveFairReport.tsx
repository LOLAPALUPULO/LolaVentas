import React, { useState, useEffect, useCallback } from 'react';
import { Fair, Sale, ReportSummary, UnitType, PaymentType } from '../../types';
import { getSalesForFair } from '../../services/firebaseService';
import { Button } from '../Button';
import { Spinner } from '../Spinner';

// Declare jspdf and html2canvas on the window object
declare global {
  interface Window {
    jspdf: {
      jsPDF: typeof import('jspdf').jsPDF;
    };
    html2canvas: typeof import('html2canvas');
  }
}

interface ActiveFairReportProps {
  fair: Fair;
  onCloseSales: () => void;
  isOnline: boolean;
}

export const ActiveFairReport: React.FC<ActiveFairReportProps> = ({ fair, onCloseSales, isOnline }) => {
  const [sales, setSales] = useState<Sale[]>([]);
  const [reportSummary, setReportSummary] = useState<ReportSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesAndGenerateReport = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      if (!fair.id) {
        throw new Error('Fair ID is missing.');
      }
      const fetchedSales = await getSalesForFair(fair.id);
      setSales(fetchedSales);
      generateReportSummary(fetchedSales);
    } catch (e: any) {
      console.error('Error fetching sales or generating report:', e);
      setError('Error al cargar ventas o generar reporte: ' + e.message + (!isOnline ? ' (Puede estar viendo datos en caché)' : ''));
    } finally {
      setLoading(false);
    }
  }, [fair, isOnline]);

  useEffect(() => {
    fetchSalesAndGenerateReport();
  }, [fetchSalesAndGenerateReport]);

  const generateReportSummary = (fetchedSales: Sale[]) => {
    let totalPintas = 0;
    let totalLitros = 0;
    let digitalRevenue = 0;
    let billeteRevenue = 0;

    fetchedSales.forEach(sale => {
      if (sale.unitType === UnitType.Pinta) {
        totalPintas += sale.quantityUnits;
      } else if (sale.unitType === UnitType.Litro) {
        totalLitros += sale.quantityUnits;
      }

      if (sale.paymentType === PaymentType.Digital) {
        digitalRevenue += sale.totalAmount;
      } else if (sale.paymentType === PaymentType.Billete) {
        billeteRevenue += sale.totalAmount;
      }
    });

    setReportSummary({
      totalPintas,
      totalLitros,
      totalRevenue: digitalRevenue + billeteRevenue,
      digitalRevenue,
      billeteRevenue,
      pintaPrice: fair.pintaPrice,
      literPrice: fair.literPrice,
    });
  };

  const handleDownloadPDF = async () => {
    if (!window.jspdf || !window.html2canvas) {
      alert('Las librerías para PDF no están cargadas. Por favor, intente de nuevo más tarde.');
      return;
    }

    const { jsPDF } = window.jspdf;
    const input = document.getElementById('report-content');
    if (!input) {
      alert('No se pudo encontrar el contenido del reporte.');
      return;
    }

    try {
      // Temporarily hide elements not meant for PDF or adjust styles for PDF
      const actionButtons = input.querySelectorAll('.report-actions-hidden');
      actionButtons.forEach(btn => (btn as HTMLElement).style.display = 'none');

      const canvas = await window.html2canvas(input, { scale: 2 });
      const imgData = canvas.toDataURL('image/png');
      const pdf = new jsPDF({
        orientation: 'portrait',
        unit: 'pt', // Use points for more control
        format: 'a4',
      });

      const imgWidth = pdf.internal.pageSize.getWidth() - 40; // Subtract padding
      const imgHeight = (canvas.height * imgWidth) / canvas.width;

      pdf.addImage(imgData, 'PNG', 20, 20, imgWidth, imgHeight); // Add padding

      pdf.save(`Reporte_Ventas_${fair.nameFeria}_${new Date().toLocaleDateString()}.pdf`);

      // Restore elements after PDF generation
      actionButtons.forEach(btn => (btn as HTMLElement).style.display = '');

    } catch (e) {
      console.error('Error generating PDF:', e);
      alert('Error al generar el PDF. Intente de nuevo.');
    }
  };

  const handleShareWhatsApp = () => {
    if (!reportSummary) return;

    const message = `*Reporte de Ventas - ${fair.nameFeria}*\n` +
      `Fechas: ${new Date(fair.startDate).toLocaleDateString()} - ${new Date(fair.endDate).toLocaleDateString()}\n\n` +
      `Pintas Vendidas: ${reportSummary.totalPintas}\n` +
      `Litros Vendidos: ${reportSummary.totalLitros}\n\n` +
      `Recaudación Total: $${reportSummary.totalRevenue.toFixed(2)}\n` +
      `  - Digital: $${reportSummary.digitalRevenue.toFixed(2)}\n` +
      `  - Billete: $${reportSummary.billeteRevenue.toFixed(2)}\n\n` +
      `Precios:\n` +
      `  - Pinta: $${fair.pintaPrice.toFixed(2)}\n` +
      `  - Litro: $${fair.literPrice.toFixed(2)}`;

    const whatsappUrl = `https://wa.me/?text=${encodeURIComponent(message)}`;
    window.open(whatsappUrl, '_blank');
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64 flex-col">
        <Spinner size="lg" color="text-blue-600" />
        <p className="mt-4 text-gray-700">Cargando reporte {isOnline ? '' : '(puede usar datos en caché si no hay conexión)'}...</p>
      </div>
    );
  }

  if (error) {
    return <p className="text-red-500 text-center p-4 text-lg font-medium">{error}</p>;
  }

  if (!reportSummary && sales.length === 0) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md max-w-4xl mx-auto w-full border border-gray-100">
        <h3 className="text-2xl font-semibold mb-6 text-gray-800 text-center">
          Reporte de Feria: {fair.nameFeria}
        </h3>
        <p className="text-gray-600 text-center text-lg">No hay datos de ventas disponibles para esta feria aún.</p>
        <p className="text-gray-500 text-center mt-2">Empiece a registrar ventas en el terminal de ventas para ver el reporte.</p>
        {fair.isActive && (
          <div className="flex justify-center mt-8 report-actions-hidden">
            <Button onClick={onCloseSales} variant="danger" className="w-auto px-8 py-3 text-lg" disabled={!isOnline}>
              Cerrar las Ventas
            </Button>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="bg-white p-6 rounded-xl shadow-md max-w-4xl mx-auto w-full border border-gray-100">
      <h3 className="text-3xl font-bold mb-6 text-gray-800 text-center">
        Reporte de Feria: {fair.nameFeria}
      </h3>
      <div id="report-content" className="p-4 bg-gray-50 rounded-xl mb-6 shadow-inner">
        <p className="text-gray-700 mb-2 text-md">
          <span className="font-semibold">Fechas:</span> {new Date(fair.startDate).toLocaleDateString()} - {new Date(fair.endDate).toLocaleDateString()}
        </p>
        <p className="text-gray-700 mb-4 text-md">
          <span className="font-semibold">Estado:</span>{' '}
          <span className={`font-bold ${fair.isActive ? 'text-green-600' : 'text-red-600'}`}>
            {fair.isActive ? 'ACTIVA' : `CERRADA el ${new Date(fair.closedDate || '').toLocaleDateString()}`}
          </span>
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          <div className="bg-blue-50 p-5 rounded-lg shadow-sm border border-blue-100">
            <p className="text-blue-800 text-base font-semibold">Pintas Vendidas</p>
            <p className="text-4xl font-extrabold text-blue-900">{reportSummary?.totalPintas}</p>
          </div>
          <div className="bg-green-50 p-5 rounded-lg shadow-sm border border-green-100">
            <p className="text-green-800 text-base font-semibold">Litros Vendidos</p>
            <p className="text-4xl font-extrabold text-green-900">{reportSummary?.totalLitros}</p>
          </div>
        </div>

        <div className="bg-indigo-50 p-5 rounded-lg shadow-md mb-4 border border-indigo-100">
          <p className="text-indigo-800 text-base font-semibold">Monto Total Recaudado</p>
          <p className="text-5xl font-extrabold text-indigo-900">$ {reportSummary?.totalRevenue.toFixed(2)}</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="bg-yellow-50 p-5 rounded-lg shadow-sm border border-yellow-100">
            <p className="text-yellow-800 text-base font-semibold">Recaudación Digital</p>
            <p className="text-3xl font-extrabold text-yellow-900">$ {reportSummary?.digitalRevenue.toFixed(2)}</p>
          </div>
          <div className="bg-purple-50 p-5 rounded-lg shadow-sm border border-purple-100">
            <p className="text-purple-800 text-base font-semibold">Recaudación Billete</p>
            <p className="text-3xl font-extrabold text-purple-900">$ {reportSummary?.billeteRevenue.toFixed(2)}</p>
          </div>
        </div>

        <div className="mt-8 p-4 border-t border-gray-200 bg-gray-100 rounded-lg">
          <h4 className="text-xl font-semibold text-gray-800 mb-3">Detalle de Precios:</h4>
          <p className="text-gray-700 text-lg">- Valor Pinta: <span className="font-bold text-blue-700">$ {fair.pintaPrice.toFixed(2)}</span></p>
          <p className="text-gray-700 text-lg">- Valor Litro: <span className="font-bold text-green-700">$ {fair.literPrice.toFixed(2)}</span></p>
        </div>
      </div>

      <div className="flex flex-col md:flex-row justify-between gap-4 mt-8 report-actions-hidden">
        <Button onClick={handleDownloadPDF} variant="secondary" className="flex-1 py-3 text-lg">
          Descargar Reporte (PDF)
        </Button>
        <Button onClick={handleShareWhatsApp} variant="success" className="flex-1 py-3 text-lg">
          Compartir Reporte (WhatsApp)
        </Button>
        {fair.isActive && (
          <Button onClick={onCloseSales} variant="danger" className="flex-1 py-3 text-lg" disabled={!isOnline}>
            Cerrar las Ventas
          </Button>
        )}
      </div>
    </div>
  );
};