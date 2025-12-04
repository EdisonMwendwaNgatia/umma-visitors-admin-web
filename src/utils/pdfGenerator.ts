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
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a3'
  });

  const now = new Date();

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
      checkedOut: [34, 197, 94] as [number, number, number]
    },
    tag: {
      given: [34, 197, 94] as [number, number, number],
      notGiven: [245, 158, 11] as [number, number, number],
      na: [107, 114, 128] as [number, number, number]
    }
  };

  const getDisplayName = (uuid: string): string => {
    if (!uuid) return '-';
    const user = users.find(u => u.uid === uuid);
    if (user?.displayName) return user.displayName;
    if (user?.email) return user.email.split('@')[0];
    return uuid;
  };

  const calculateDuration = (timeIn: Date, timeOut?: Date): string => {
    if (!timeOut) return 'Active';
    const diff = timeOut.getTime() - timeIn.getTime();
    const hours = Math.floor(diff / (1000 * 60 * 60));
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${hours}h ${minutes}m`;
  };

  const isOverdue = (visitor: Visitor): boolean => {
    if (visitor.isCheckedOut) return false;
    const hoursSinceCheckIn = (now.getTime() - visitor.timeIn.getTime()) / (1000 * 60 * 60);
    return hoursSinceCheckIn > 12;
  };

  const getTagDisplay = (tagNumber?: string, tagNotGiven?: boolean): string => {
    if (tagNotGiven) {
      return 'Not Given';
    }
    if (tagNumber && tagNumber !== 'N/A') {
      return `Tag #${tagNumber}`;
    }
    return 'N/A';
  };


  const formatGender = (gender?: string): string => {
    if (!gender || gender === 'N/A' || gender.toLowerCase() === 'na') {
      return 'N/A';
    }
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  const pdfData: PDFVisitor[] = visitors.map(visitor => ({
    ...visitor,
    checkedInByName: getDisplayName(visitor.checkedInBy),
    checkedOutByName: visitor.checkedOutBy ? getDisplayName(visitor.checkedOutBy) : '-',
    status: visitor.isCheckedOut ? 'Checked Out' : isOverdue(visitor) ? 'Overdue' : 'Active',
    duration: calculateDuration(visitor.timeIn, visitor.timeOut),
  }));

  const pageWidth = doc.internal.pageSize.width;


  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.rect(0, 0, pageWidth, 40, 'F');

  doc.setFillColor(255, 255, 255);
  doc.roundedRect(20, 10, 25, 25, 3, 3, 'F');
  doc.setFontSize(16);
  doc.setTextColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.setFont('helvetica', 'bold');
  doc.text('UMMA', 32.5, 24, { align: 'center' });

  doc.setFontSize(20);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('UMMA VISITORS MANAGEMENT SYSTEM', 55, 18);

  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text(`Detailed Visitor Report | Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, 55, 26);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.text(`Total Visitors: ${visitors.length}`, 55, 35);

  // Reset text color
  doc.setTextColor(255, 255, 255);
  // Reset for footer
  doc.setTextColor(255, 255, 255);


  const tableData = pdfData.map(visitor => [
    visitor.visitorName || '-',
    visitor.phoneNumber || '-',
    visitor.idNumber || '-',
    formatGender(visitor.gender),
    getTagDisplay(visitor.tagNumber, visitor.tagNotGiven),
    visitor.visitorType || '-',
    visitor.refNumber || '-',
    visitor.residence || '-',
    visitor.institutionOccupation || '-',
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

  let totalPages = 1;

  // Optimize column widths for A3 landscape (420mm width)
  autoTable(doc, {
    head: [[
      'Visitor Name',
      'Phone',
      'ID Number',
      'Gender',
      'Tag',
      'Type',
      'Vehicle',
      'Residence',
      'Occupation/Institution',
      'Purpose',
      'Check In',
      'Check Out',
      'Status',
      'Duration',
      'Checked In By',
      'Checked Out By'
    ]],
    body: tableData,
    startY: 50, // Start table after header
    theme: 'grid',
    styles: {
      fontSize: 8, // Comfortable font size for A3
      cellPadding: 3,
      overflow: 'linebreak',
      lineColor: [229, 231, 235],
      lineWidth: 0.3,
      textColor: colors.text.dark,
      font: 'helvetica',
      minCellHeight: 6
    },
    headStyles: {
      fillColor: colors.primary,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 8,
      cellPadding: 4,
      halign: 'left',
      minCellHeight: 10
    },
    alternateRowStyles: {
      fillColor: [249, 250, 251]
    },
    // Optimized column widths for A3 landscape (420mm total)
    columnStyles: {
      0: { cellWidth: 30 }, // Visitor Name
      1: { cellWidth: 25 }, // Phone
      2: { cellWidth: 25 }, // ID Number
      3: { cellWidth: 18 }, // Gender
      4: { cellWidth: 20 }, // Tag
      5: { cellWidth: 20 }, // Type
      6: { cellWidth: 25 }, // Vehicle
      7: { cellWidth: 30 }, // Residence
      8: { cellWidth: 35 }, // Occupation/Institution
      9: { cellWidth: 30 }, // Purpose
      10: { cellWidth: 28 }, // Check In
      11: { cellWidth: 28 }, // Check Out
      12: { cellWidth: 20, halign: 'center' }, // Status
      13: { cellWidth: 20, halign: 'center' }, // Duration
      14: { cellWidth: 28 }, // Checked In By
      15: { cellWidth: 28 } // Checked Out By
    },
    margin: { left: 10, right: 10 },
    tableWidth: 'auto',
    didParseCell: (data) => {
      // Color code status column
      if (data.column.index === 12 && data.section === 'body') {
        const status = data.cell.raw as string;
        if (status === 'Active') {
          // FIXED: Pass array elements individually
          data.cell.styles.textColor = [colors.status.active[0], colors.status.active[1], colors.status.active[2]];
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'Overdue') {
          data.cell.styles.textColor = [colors.status.overdue[0], colors.status.overdue[1], colors.status.overdue[2]];
          data.cell.styles.fontStyle = 'bold';
        } else if (status === 'Checked Out') {
          data.cell.styles.textColor = [colors.status.checkedOut[0], colors.status.checkedOut[1], colors.status.checkedOut[2]];
        }
      }

      // Color code tag column
      if (data.column.index === 4 && data.section === 'body') {
        const visitor = pdfData[data.row.index];

        if (visitor.tagNotGiven) {
          data.cell.styles.textColor = [colors.tag.notGiven[0], colors.tag.notGiven[1], colors.tag.notGiven[2]];
          data.cell.styles.fontStyle = 'bold';
        } else if (visitor.tagNumber && visitor.tagNumber !== 'N/A') {
          data.cell.styles.textColor = [colors.tag.given[0], colors.tag.given[1], colors.tag.given[2]];
          data.cell.styles.fontStyle = 'bold';
        } else {
          data.cell.styles.textColor = [colors.tag.na[0], colors.tag.na[1], colors.tag.na[2]];
        }
      }

      // Truncate very long text to prevent overflow
      if (data.cell.raw && typeof data.cell.raw === 'string' && data.cell.raw.length > 60) {
        data.cell.text = [data.cell.raw.substring(0, 60) + '...'];
      }
    },
    didDrawPage: (data) => {
      // Store total pages from the final page
      if (data.pageNumber) {
        totalPages = data.pageNumber;
      }

      // Footer
      const pageHeight = doc.internal.pageSize.height;

      // Footer text
      doc.setFontSize(8);
      doc.setTextColor(colors.text.medium[0], colors.text.medium[1], colors.text.medium[2]);
      doc.setFont('helvetica', 'normal');
      doc.text(
        'Umma Visitors Management System - Confidential',
        20,
        pageHeight - 12
      );

      // FIXED: Get page count from doc internal method
      const pageCount = (doc as any).getNumberOfPages?.() || 1;

      doc.text(
        `Page ${data.pageNumber || 1} of ${pageCount} | ${visitors.length} visitors total`,
        pageWidth / 2,
        pageHeight - 12,
        { align: 'center' }
      );
      doc.text(
        `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        pageWidth - 20,
        pageHeight - 12,
        { align: 'right' }
      );
    },
  });

  // Save the PDF
  const filename = `umma-visitors-report-${now.toISOString().split('T')[0]}.pdf`;
  doc.save(filename);
};