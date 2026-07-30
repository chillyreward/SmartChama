import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';

export function exportToPDF(
  title: string,
  chamaName: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const doc = new jsPDF();
  
  // Document Header
  doc.setFontSize(18);
  doc.setTextColor(22, 29, 22);
  doc.text(title, 14, 20);

  doc.setFontSize(10);
  doc.setTextColor(96, 100, 95);
  doc.text(`Chama: ${chamaName || 'SmartChama Group'}`, 14, 27);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-KE', { dateStyle: 'full' })}`, 14, 33);

  // Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 38,
    theme: 'grid',
    headStyles: {
      fillColor: [34, 197, 94], // #22C55E SmartChama Green
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [245, 247, 245]
    }
  });

  doc.save(`${filename}.pdf`);
}

export function exportToExcel(
  title: string,
  chamaName: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const metaRows = [
    [title],
    [`Chama: ${chamaName || 'SmartChama Group'}`],
    [`Generated: ${new Date().toLocaleDateString('en-KE', { dateStyle: 'full' })}`],
    []
  ];

  const ws = XLSX.utils.aoa_to_sheet([...metaRows, headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.replace(/[:\\\/?*\[\]]/g, '').substring(0, 30));
  XLSX.writeFile(wb, `${filename}.xlsx`);
}
