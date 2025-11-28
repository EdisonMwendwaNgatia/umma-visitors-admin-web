import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Visitor, User } from '../types';

interface PDFVisitor extends Visitor {
  checkedInByName: string;
  checkedOutByName: string;
  status: string;
  duration: string;
}

export const generateVisitorsPDF = (visitors: Visitor[], users: User[]) => {
  const doc = new jsPDF('landscape'); // Landscape for better table fit
  const now = new Date();
  
  // Color palette
  const colors = {
    primary: [16, 185, 129] as [number, number, number],
    secondary: [5, 150, 105] as [number, number, number],
    accent: [52, 211, 153] as [number, number, number],
    text: {
      dark: [31, 41, 55] as [number, number, number],
      medium: [75, 85, 99] as [number, number, number],
      light: [156, 163, 175] as [number, number, number]
    },
    status: {
      active: [34, 197, 94] as [number, number, number],
      overdue: [239, 68, 68] as [number, number, number],
      checkedOut: [107, 114, 128] as [number, number, number]
    }
  };

  // Helper function to get display name
  const getDisplayName = (uuid: string): string => {
    if (!uuid) return '-';
    const user = users.find(u => u.uid === uuid);
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return uuid;
  };

  // Calculate duration
  const calculateDuration = (timeIn: Date, timeOut?: Date): string => {
    if (!timeOut) return 'Active';
    const diff = timeOut.getTime() - timeIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  // Check if overdue (12+ hours)
  const isOverdue = (visitor: Visitor): boolean => {
    if (visitor.isCheckedOut) return false;
    const hoursSinceCheckIn = (now.getTime() - visitor.timeIn.getTime()) / (1000 * 60 * 60);
    return hoursSinceCheckIn > 12;
  };

  // Prepare data for PDF
  const pdfData: PDFVisitor[] = visitors.map(visitor => ({
    ...visitor,
    checkedInByName: getDisplayName(visitor.checkedInBy),
    checkedOutByName: visitor.checkedOutBy ? getDisplayName(visitor.checkedOutBy) : '-',
    status: visitor.isCheckedOut ? 'Checked Out' : isOverdue(visitor) ? 'Overdue' : 'Active',
    duration: calculateDuration(visitor.timeIn, visitor.timeOut),
  }));

  // Stats
  const activeCount = visitors.filter(v => !v.isCheckedOut).length;
  const overdueCount = visitors.filter(v => isOverdue(v)).length;
  const checkedOutCount = visitors.filter(v => v.isCheckedOut).length;

  // === HEADER SECTION ===
  const pageWidth = doc.internal.pageSize.width;
  
  // Header background
  doc.setFillColor(...colors.primary);
  doc.rect(0, 0, pageWidth, 45, 'F');
  
  // Company logo area (placeholder - you can add actual logo)
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(14, 10, 25, 25, 3, 3, 'F');
  doc.setFontSize(16);
  doc.setTextColor(...colors.primary);
  doc.setFont('helvetica', 'bold');
  doc.text('UV', 26.5, 26, { align: 'center' });
  
  // Title
  doc.setFontSize(24);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('UMMA VISITORS REPORT', 45, 22);
  
  // Subtitle
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 45, 30);
  
  // === STATISTICS CARDS ===
  const cardY = 55;
  const cardWidth = 65;
  const cardHeight = 28;
  const cardSpacing = 10;
  const startX = (pageWidth - (cardWidth * 4 + cardSpacing * 3)) / 2;

  // Card 1: Total Visitors
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(startX, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setDrawColor(...colors.text.light);
  doc.setLineWidth(0.5);
  doc.roundedRect(startX, cardY, cardWidth, cardHeight, 3, 3, 'S');
  
  doc.setFillColor(...colors.primary);
  doc.circle(startX + 12, cardY + 14, 8, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('👥', startX + 8, cardY + 17);
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.text.dark);
  doc.text(visitors.length.toString(), startX + 25, cardY + 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.text.medium);
  doc.text('Total Visitors', startX + 25, cardY + 23);

  // Card 2: Active
  const card2X = startX + cardWidth + cardSpacing;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setDrawColor(...colors.text.light);
  doc.roundedRect(card2X, cardY, cardWidth, cardHeight, 3, 3, 'S');
  
  doc.setFillColor(...colors.status.active);
  doc.circle(card2X + 12, cardY + 14, 8, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('✓', card2X + 8.5, cardY + 17);
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.text.dark);
  doc.text(activeCount.toString(), card2X + 25, cardY + 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.text.medium);
  doc.text('Active', card2X + 25, cardY + 23);

  // Card 3: Overdue
  const card3X = card2X + cardWidth + cardSpacing;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setDrawColor(...colors.text.light);
  doc.roundedRect(card3X, cardY, cardWidth, cardHeight, 3, 3, 'S');
  
  doc.setFillColor(...colors.status.overdue);
  doc.circle(card3X + 12, cardY + 14, 8, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('⚠', card3X + 8, cardY + 17);
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.text.dark);
  doc.text(overdueCount.toString(), card3X + 25, cardY + 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.text.medium);
  doc.text('Overdue', card3X + 25, cardY + 23);

  // Card 4: Checked Out
  const card4X = card3X + cardWidth + cardSpacing;
  doc.setFillColor(255, 255, 255);
  doc.roundedRect(card4X, cardY, cardWidth, cardHeight, 3, 3, 'F');
  doc.setDrawColor(...colors.text.light);
  doc.roundedRect(card4X, cardY, cardWidth, cardHeight, 3, 3, 'S');
  
  doc.setFillColor(...colors.status.checkedOut);
  doc.circle(card4X + 12, cardY + 14, 8, 'F');
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.text('←', card4X + 8, cardY + 17);
  
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...colors.text.dark);
  doc.text(checkedOutCount.toString(), card4X + 25, cardY + 16);
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...colors.text.medium);
  doc.text('Checked Out', card4X + 25, cardY + 23);

  // === TABLE SECTION ===
  const tableData = pdfData.map(visitor => [
    visitor.visitorName || '-',
    visitor.phoneNumber || '-',
    visitor.idNumber || '-',
    visitor.visitorType || '-',
    visitor.refNumber || '-',
    visitor.purposeOfVisit || '-',
    visitor.timeIn ? visitor.timeIn.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : '-',
    visitor.timeOut ? visitor.timeOut.toLocaleString('en-US', { 
      month: 'short', 
      day: 'numeric', 
      hour: '2-digit', 
      minute: '2-digit' 
    }) : '-',
    visitor.status,
    visitor.duration,
    visitor.checkedInByName,
    visitor.checkedOutByName,
  ]);

  autoTable(doc, {
    head: [[
      'Visitor Name', 
      'Phone', 
      'ID Number', 
      'Type', 
      'Vehicle', 
      'Purpose', 
      'Check In', 
      'Check Out', 
      'Status', 
      'Duration', 
      'Checked In By', 
      'Checked Out By'
    ]],
    body: tableData,
    startY: 95,
    theme: 'grid',
    styles: { 
      fontSize: 9,
      cellPadding: 4,
      overflow: 'linebreak',
      lineColor: [229, 231, 235],
      lineWidth: 0.5,
      textColor: colors.text.dark,
      font: 'helvetica'
    },
    headStyles: { 
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 9,
      cellPadding: 5,
      halign: 'left'
    },
    alternateRowStyles: { 
      fillColor: [249, 250, 251]
    },
    columnStyles: {
      0: { cellWidth: 25, fontStyle: 'bold' },
      1: { cellWidth: 22 },
      2: { cellWidth: 24 },
      3: { cellWidth: 18 },
      4: { cellWidth: 20 },
      5: { cellWidth: 28 },
      6: { cellWidth: 28 },
      7: { cellWidth: 28 },
      8: { cellWidth: 22, halign: 'center' },
      9: { cellWidth: 18, halign: 'center' },
      10: { cellWidth: 24 },
      11: { cellWidth: 24 }
    },
    didParseCell: (data) => {
      // Color code status column
      if (data.column.index === 8 && data.section === 'body') {
        const status = data.cell.raw as string;
        if (status === 'Active') {
          data.cell.styles.textColor = colors.status.active;
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'Overdue') {
          data.cell.styles.textColor = colors.status.overdue;
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'Checked Out') {
          data.cell.styles.textColor = colors.status.checkedOut;
        }
      }
    },
    didDrawPage: (data) => {
      // Footer
      const pageHeight = doc.internal.pageSize.height;
      
      // Footer line
      doc.setDrawColor(...colors.text.light);
      doc.setLineWidth(0.5);
      doc.line(14, pageHeight - 20, pageWidth - 14, pageHeight - 20);
      
      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(...colors.text.medium);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Umma Visitors Management System',
        14,
        pageHeight - 12
      );
      doc.text(
        `Page ${data.pageNumber}`,
        pageWidth / 2,
        pageHeight - 12,
        { align: 'center' }
      );
      doc.text(
        `Generated: ${now.toLocaleDateString()}`,
        pageWidth - 14,
        pageHeight - 12,
        { align: 'right' }
      );
    },
  });

  // Save the PDF
  const filename = `umma-visitors-report-${now.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};