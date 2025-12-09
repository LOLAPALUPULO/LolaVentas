// Declare jspdf and html2canvas globally as they would be loaded via CDN or local scripts
declare const jspdf: any;
declare const html2canvas: any;

interface ReportData {
  fairName: string;
  startDate: string;
  endDate: string;
  totalPintas: number;
  totalLitros: number;
  totalRecaudado: number;
  totalDigital: number;
  totalBillete: number;
  sales: {
    date: string;
    type: string;
    quantity: number;
    amount: number;
    payment: string;
    user: string;
  }[];
}

export const generateReportPdf = (data: ReportData) => {
  const doc = new jspdf.jsPDF();
  let yPos = 20;
  const margin = 15;
  const lineHeight = 7;

  doc.setFontSize(22);
  doc.text(`Reporte de Feria: ${data.fairName}`, margin, yPos);
  yPos += lineHeight * 2;

  doc.setFontSize(12);
  doc.text(`Fechas: ${data.startDate} - ${data.endDate}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Total Pintas Vendidas: ${data.totalPintas}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Total Litros Vendidos: ${data.totalLitros}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`Monto Total Recaudado: $${data.totalRecaudado.toFixed(2)}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`  - $ Digital: $${data.totalDigital.toFixed(2)}`, margin, yPos);
  yPos += lineHeight;
  doc.text(`  - $ Billete: $${data.totalBillete.toFixed(2)}`, margin, yPos);
  yPos += lineHeight * 2;

  doc.setFontSize(16);
  doc.text("Detalle de Ventas:", margin, yPos);
  yPos += lineHeight * 1.5;

  const headers = ['Fecha', 'Tipo Unidad', 'Cantidad', 'Monto', 'Pago', 'Usuario'];
  const tableData = data.sales.map(sale => [
    sale.date,
    sale.type,
    sale.quantity.toString(),
    `$${sale.amount.toFixed(2)}`,
    sale.payment,
    sale.user
  ]);

  // @ts-ignore - autoTable is a plugin
  doc.autoTable({
    startY: yPos,
    head: [headers],
    body: tableData,
    margin: { horizontal: margin },
    styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' },
    headStyles: { fillColor: [41, 128, 185], textColor: 255, fontStyle: 'bold' },
    alternateRowStyles: { fillColor: [240, 240, 240] },
    theme: 'grid',
  });

  doc.save(`reporte-${data.fairName.replace(/\s/g, '_')}.pdf`);
};
