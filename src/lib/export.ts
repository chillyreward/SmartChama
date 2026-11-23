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
  doc.text(`Chama: ${chamaName || 'Akibora Group'}`, 14, 27);
  doc.text(`Generated: ${new Date().toLocaleDateString('en-KE', { dateStyle: 'full' })}`, 14, 33);

  // Table
  autoTable(doc, {
    head: [headers],
    body: rows,
    startY: 38,
    theme: 'grid',
    headStyles: {
      fillColor: [14, 31, 24], // Akibora forest
      textColor: [255, 255, 255],
      fontStyle: 'bold'
    },
    styles: {
      fontSize: 9,
      cellPadding: 3
    },
    alternateRowStyles: {
      fillColor: [238, 243, 238]
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
    [`Chama: ${chamaName || 'Akibora Group'}`],
    [`Generated: ${new Date().toLocaleDateString('en-KE', { dateStyle: 'full' })}`],
    []
  ];

  const ws = XLSX.utils.aoa_to_sheet([...metaRows, headers, ...rows]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, title.replace(/[:\\\/?*\[\]]/g, '').substring(0, 30));
  
  const dateStr = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(wb, `${filename}_${dateStr}.xlsx`);
}

export type PassportData = {
  name: string;
  groupName: string;
  memberSince: string | null;
  score: number;
  parts: { label: string; points: number; max: number; detail: string }[];
  totalSaved: number;
  paidMonths: number;
  monthsActive: number;
  streak: number;
};

/** One-page credit passport a member can choose to share with a lender. */
export async function exportCreditPassport(d: PassportData) {
  const { default: jsPDF } = await import('jspdf');
  const doc = new jsPDF({ unit: 'mm', format: 'a4' });
  const W = 210;
  const ksh = (n: number) => `KSh ${Math.round(n).toLocaleString('en-KE')}`;

  doc.setFillColor(14, 31, 24);
  doc.rect(0, 0, W, 92, 'F');
  doc.setTextColor(124, 227, 166);
  doc.setFontSize(11);
  doc.text('AKIBORA CREDIT PASSPORT', 18, 22);
  doc.setTextColor(238, 244, 239);
  doc.setFont('times', 'normal');
  doc.setFontSize(30);
  doc.text(d.name, 18, 40);
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(11);
  doc.setTextColor(169, 194, 179);
  doc.text(`Member of ${d.groupName}${d.memberSince ? ` since ${d.memberSince}` : ''}`, 18, 49);
  doc.setFont('times', 'normal');
  doc.setFontSize(64);
  doc.setTextColor(124, 227, 166);
  doc.text(String(d.score), W - 18, 72, { align: 'right' });
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(10);
  doc.setTextColor(169, 194, 179);
  doc.text('Trust score, out of 100', W - 18, 80, { align: 'right' });

  // score bar
  const segs = 40, x0 = 18, y0 = 62, bw = 110, gap = 0.8;
  const sw = (bw - gap * (segs - 1)) / segs;
  for (let i = 0; i < segs; i++) {
    const on = i < Math.round((d.score / 100) * segs);
    if (on) doc.setFillColor(...((i < 12 ? [61, 122, 90] : i < 24 ? [91, 178, 135] : [124, 227, 166]) as [number, number, number]));
    else doc.setFillColor(34, 64, 47);
    doc.rect(x0 + i * (sw + gap), y0, sw, 12, 'F');
  }

  let y = 110;
  doc.setTextColor(15, 36, 26);
  doc.setFont('times', 'normal');
  doc.setFontSize(18);
  doc.text('How the score is made', 18, y);
  y += 10;
  doc.setFont('helvetica', 'normal');
  d.parts.forEach((p) => {
    doc.setFontSize(12);
    doc.setTextColor(15, 36, 26);
    doc.text(p.label, 18, y);
    doc.text(`${p.points} of ${p.max} points`, W - 18, y, { align: 'right' });
    doc.setFontSize(10);
    doc.setTextColor(76, 104, 88);
    doc.text(p.detail, 18, y + 6);
    y += 16;
  });

  y += 6;
  doc.setFont('times', 'normal');
  doc.setFontSize(18);
  doc.setTextColor(15, 36, 26);
  doc.text('Record in this group', 18, y);
  y += 12;
  const facts: [string, string][] = [
    ['Saved in total', ksh(d.totalSaved)],
    ['Months with a contribution', `${d.paidMonths} of ${d.monthsActive}`],
    ['Current unbroken streak', `${d.streak} ${d.streak === 1 ? 'month' : 'months'}`],
  ];
  doc.setFont('helvetica', 'normal');
  facts.forEach(([k, v]) => {
    doc.setFontSize(12);
    doc.setTextColor(76, 104, 88);
    doc.text(k, 18, y);
    doc.setTextColor(15, 36, 26);
    doc.text(v, W - 18, y, { align: 'right' });
    doc.setDrawColor(198, 216, 202);
    doc.line(18, y + 4, W - 18, y + 4);
    y += 12;
  });

  doc.setFontSize(9);
  doc.setTextColor(76, 104, 88);
  const note = `Generated by Akibora on ${new Date().toLocaleDateString('en-KE', { dateStyle: 'long' })} at the member's request. ` +
    'Figures come from contributions recorded in the group on Akibora: M-Pesa payments confirmed by Safaricom count fully, cash or bank payments logged by an official count half. ' +
    'This is a record of savings behaviour inside one group, not a credit bureau report.';
  doc.text(doc.splitTextToSize(note, W - 36), 18, 270);

  const blob = doc.output('blob');
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `akibora-credit-passport-${d.name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.pdf`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  setTimeout(() => URL.revokeObjectURL(url), 200);
}
