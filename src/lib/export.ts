export async function exportToPDF(
  title: string,
  chamaName: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const { default: jsPDF } = await import('jspdf');
  const { default: autoTable } = await import('jspdf-autotable');
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

  // Force direct browser file download instead of triggering print/preview
  const dateStr = new Date().toISOString().slice(0, 10);
  const cleanFilename = `${filename}_${dateStr}.pdf`;

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = cleanFilename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  setTimeout(() => URL.revokeObjectURL(url), 100);
}

export async function exportToExcel(
  title: string,
  chamaName: string,
  headers: string[],
  rows: (string | number)[][],
  filename: string
) {
  const XLSX = await import('xlsx');

  const metaRows = [
    [title],
    [`Chama: ${chamaName || 'SmartChama Group'}`],
    [`Generated: ${new Date().toLocaleDateString('en-KE', { dateStyle: 'full' })}`],
    []
  ];

  const ws = XLSX.utils.aoa_to_sheet([...metaRows, headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.replace(/[:\\\/?*\[\]]/g, '').substring(0, 30));
  
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${dateStr}.xlsx`);
}
