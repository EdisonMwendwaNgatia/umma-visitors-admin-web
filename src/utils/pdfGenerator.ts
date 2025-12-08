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
  // Use A2 format - 420mm x 594mm (landscape will be 594mm x 420mm)
  const doc = new jsPDF({
    orientation: 'landscape',
    unit: 'mm',
    format: 'a2' // Changed from 'a3' to 'a2'
  });

  const now = new Date();

  // Updated color scheme for better visibility
  const colors = {
    primary: [16, 185, 129] as [number, number, number],
    secondary: [5, 150, 105] as [number, number, number],
    accent: [52, 211, 153] as [number, number, number],
    header: [31, 41, 55] as [number, number, number],
    text: {
      dark: [31, 41, 55] as [number, number, number],
      medium: [75, 85, 99] as [number, number, number],
      light: [156, 163, 175] as [number, number, number]
    },
    status: {
      active: [34, 197, 94] as [number, number, number],
      overdue: [239, 68, 68] as [number, number, number],
      checkedOut: [107, 114, 128] as [number, number, number]
    },
    tag: {
      given: [34, 197, 94] as [number, number, number],
      na: [107, 114, 128] as [number, number, number]
    },
    background: {
      light: [249, 250, 251] as [number, number, number]
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
    
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const isOverdue = (visitor: Visitor): boolean => {
    if (visitor.isCheckedOut) return false;
    const hoursSinceCheckIn = (now.getTime() - visitor.timeIn.getTime()) / (1000 * 60 * 60);
    return hoursSinceCheckIn > 12;
  };

  const getTagDisplay = (tagNumber?: string): string => {
    if (tagNumber && tagNumber !== 'N/A') {
      return `#${tagNumber}`;
    }
    return 'N/A';
  };

  const formatGender = (gender?: string): string => {
    if (!gender || gender === 'N/A' || gender.toLowerCase() === 'na') {
      return 'N/A';
    }
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  // Process data for PDF
  const pdfData: PDFVisitor[] = visitors.map(visitor => ({
    ...visitor,
    checkedInByName: getDisplayName(visitor.checkedInBy),
    checkedOutByName: visitor.checkedOutBy ? getDisplayName(visitor.checkedOutBy) : '-',
    status: visitor.isCheckedOut ? 'Checked Out' : isOverdue(visitor) ? 'Overdue' : 'Active',
    duration: calculateDuration(visitor.timeIn, visitor.timeOut),
  }));

  // Sort by check-in time (most recent first)
  pdfData.sort((a, b) => b.timeIn.getTime() - a.timeIn.getTime());

  const pageWidth = doc.internal.pageSize.width; // 594mm for A2 landscape
  const pageHeight = doc.internal.pageSize.height; // 420mm for A2 landscape

  // ================= HEADER SECTION =================
  // Background gradient/color for header
  doc.setFillColor(colors.header[0], colors.header[1], colors.header[2]);
  doc.rect(0, 0, pageWidth, 45, 'F');

  // Logo/Company Name
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.roundedRect(20, 12, 30, 30, 4, 4, 'F');
  
  doc.setFontSize(18);
  doc.setTextColor(255, 255, 255);
  doc.setFont('helvetica', 'bold');
  doc.text('UMMA', 35, 30, { align: 'center' });

  // Main Title
  doc.setFontSize(24);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(255, 255, 255);
  doc.text('VISITORS MANAGEMENT SYSTEM', 60, 25);

  // Subtitle
  doc.setFontSize(14);
  doc.setFont('helvetica', 'normal');
  doc.text('Detailed Visitor Report', 60, 35);

  // Report Info Section
  doc.setFontSize(11);
  doc.text(`Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`, pageWidth - 20, 25, { align: 'right' });
  doc.text(`Total Visitors: ${visitors.length}`, pageWidth - 20, 35, { align: 'right' });

  // Statistics Box
  const activeVisitors = visitors.filter(v => !v.isCheckedOut).length;
  const overdueVisitors = visitors.filter(v => !v.isCheckedOut && isOverdue(v)).length;
  const checkedOutVisitors = visitors.filter(v => v.isCheckedOut).length;

  doc.setFillColor(colors.background.light[0], colors.background.light[1], colors.background.light[2]);
  doc.roundedRect(60, 45, pageWidth - 80, 15, 3, 3, 'F');
  
  doc.setFontSize(10);
  doc.setTextColor(colors.text.dark[0], colors.text.dark[1], colors.text.dark[2]);
  doc.setFont('helvetica', 'bold');
  
  const statsX = 65;
  const statsY = 55;
  const statsSpacing = 100;
  
  // Active visitors
  doc.setFillColor(colors.status.active[0], colors.status.active[1], colors.status.active[2]);
  doc.circle(statsX, statsY - 3, 3, 'F');
  doc.text(`Active: ${activeVisitors}`, statsX + 10, statsY);
  
  // Overdue visitors
  doc.setFillColor(colors.status.overdue[0], colors.status.overdue[1], colors.status.overdue[2]);
  doc.circle(statsX + statsSpacing, statsY - 3, 3, 'F');
  doc.text(`Overdue: ${overdueVisitors}`, statsX + statsSpacing + 10, statsY);
  
  // Checked out visitors
  doc.setFillColor(colors.status.checkedOut[0], colors.status.checkedOut[1], colors.status.checkedOut[2]);
  doc.circle(statsX + statsSpacing * 2, statsY - 3, 3, 'F');
  doc.text(`Checked Out: ${checkedOutVisitors}`, statsX + statsSpacing * 2 + 10, statsY);
  
  // Today's visitors
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const todayVisitors = visitors.filter(v => {
    const visitorDate = new Date(v.timeIn);
    visitorDate.setHours(0, 0, 0, 0);
    return visitorDate.getTime() === today.getTime();
  }).length;
  
  doc.setFillColor(colors.primary[0], colors.primary[1], colors.primary[2]);
  doc.circle(statsX + statsSpacing * 3, statsY - 3, 3, 'F');
  doc.text(`Today: ${todayVisitors}`, statsX + statsSpacing * 3 + 10, statsY);

  // ================= TABLE SECTION =================
  const tableData = pdfData.map(visitor => [
    visitor.visitorName || '-',
    visitor.phoneNumber || '-',
    visitor.idNumber || '-',
    formatGender(visitor.gender),
    getTagDisplay(visitor.tagNumber),
    visitor.visitorType.charAt(0).toUpperCase() + visitor.visitorType.slice(1) || '-',
    visitor.refNumber || '-',
    visitor.residence || '-',
    visitor.institutionOccupation || '-',
    visitor.purposeOfVisit || '-',
    visitor.timeIn ? visitor.timeIn.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '') : '-',
    visitor.timeOut ? visitor.timeOut.toLocaleString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    }).replace(',', '') : '-',
    visitor.status,
    visitor.duration,
    visitor.checkedInByName,
    visitor.checkedOutByName,
  ]);

  // Calculate optimal column widths for A2 landscape (594mm width)
  // More generous spacing for A2
  autoTable(doc, {
    head: [[
      'Visitor Name',
      'Phone',
      'ID Number',
      'Gender',
      'Tag',
      'Type',
      'Vehicle Plate',
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
    startY: 70, // Start after header and stats
    theme: 'grid',
    styles: {
      fontSize: 9, // Slightly larger font for A2
      cellPadding: 4, // More padding for better readability
      overflow: 'linebreak',
      lineColor: [229, 231, 235],
      lineWidth: 0.25, // Thinner lines
      textColor: colors.text.dark,
      font: 'helvetica',
      minCellHeight: 8,
      valign: 'middle'
    },
    headStyles: {
      fillColor: colors.header,
      textColor: [255, 255, 255],
      fontStyle: 'bold',
      fontSize: 10,
      cellPadding: 6,
      halign: 'left',
      minCellHeight: 12,
      valign: 'middle'
    },
    alternateRowStyles: {
      fillColor: colors.background.light
    },
    // Optimized column widths for A2 landscape (594mm total width)
    columnStyles: {
      0: { cellWidth: 40 },  // Visitor Name
      1: { cellWidth: 35 },  // Phone
      2: { cellWidth: 35 },  // ID Number
      3: { cellWidth: 25 },  // Gender
      4: { cellWidth: 25 },  // Tag
      5: { cellWidth: 25 },  // Type
      6: { cellWidth: 35 },  // Vehicle Plate
      7: { cellWidth: 45 },  // Residence
      8: { cellWidth: 50 },  // Occupation/Institution
      9: { cellWidth: 45 },  // Purpose
      10: { cellWidth: 40 }, // Check In
      11: { cellWidth: 40 }, // Check Out
      12: { cellWidth: 30, halign: 'center' }, // Status
      13: { cellWidth: 25, halign: 'center' }, // Duration
      14: { cellWidth: 40 }, // Checked In By
      15: { cellWidth: 40 }  // Checked Out By
    },
    margin: { left: 15, right: 15 }, // More margin for A2
    tableWidth: 'auto',
    didParseCell: (data) => {
      // Color code status column
      if (data.column.index === 12 && data.section === 'body') {
        const status = data.cell.raw as string;
        
        if (status === 'Active') {
          data.cell.styles.fillColor = [colors.status.active[0], colors.status.active[1], colors.status.active[2]];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.cellPadding = 5;
        } else if (status === 'Overdue') {
          data.cell.styles.fillColor = [colors.status.overdue[0], colors.status.overdue[1], colors.status.overdue[2]];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.cellPadding = 5;
        } else if (status === 'Checked Out') {
          data.cell.styles.fillColor = [colors.status.checkedOut[0], colors.status.checkedOut[1], colors.status.checkedOut[2]];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.cellPadding = 5;
        }
      }

      // Color code tag column
      if (data.column.index === 4 && data.section === 'body') {
        const visitor = pdfData[data.row.index];
        const tagNumber = visitor.tagNumber;

        if (tagNumber && tagNumber !== 'N/A') {
          data.cell.styles.fillColor = [colors.tag.given[0], colors.tag.given[1], colors.tag.given[2]];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.fontStyle = 'bold';
          data.cell.styles.cellPadding = 5;
        } else {
          data.cell.styles.fillColor = [colors.tag.na[0], colors.tag.na[1], colors.tag.na[2]];
          data.cell.styles.textColor = [255, 255, 255];
          data.cell.styles.cellPadding = 5;
        }
      }

      // Format date columns
      if ((data.column.index === 10 || data.column.index === 11) && data.section === 'body') {
        data.cell.styles.font = 'courier';
        data.cell.styles.fontSize = 8;
      }

      // Truncate very long text with ellipsis
      if (data.cell.raw && typeof data.cell.raw === 'string') {
        const maxLength = data.column.index === 7 || data.column.index === 8 || data.column.index === 9 ? 50 : 30;
        if (data.cell.raw.length > maxLength) {
          data.cell.text = [data.cell.raw.substring(0, maxLength) + '...'];
        }
      }
    },
    willDrawCell: (data) => {
      // Add subtle shading to header cells
      if (data.section === 'head') {
        data.cell.styles.lineWidth = 0.5;
        data.cell.styles.lineColor = [255, 255, 255];
      }
    },
    didDrawPage: (data) => {
      // Footer with page numbers and info
      const footerY = pageHeight - 15;
      
      // Footer background
      doc.setFillColor(colors.header[0], colors.header[1], colors.header[2]);
      doc.rect(0, footerY, pageWidth, 15, 'F');
      
      // Footer text
      doc.setFontSize(9);
      doc.setTextColor(200, 200, 200);
      doc.setFont('helvetica', 'normal');
      
      // Left: System name
      doc.text('UMMA Visitors Management System', 20, footerY + 10);
      
      // Center: Page info
      const pageCount = (doc as any).getNumberOfPages?.() || 1;
      doc.text(
        `Page ${data.pageNumber || 1} of ${pageCount} | ${visitors.length} visitors total`,
        pageWidth / 2,
        footerY + 10,
        { align: 'center' }
      );
      
      // Right: Generation info
      doc.text(
        `Generated: ${now.toLocaleDateString()} ${now.toLocaleTimeString()}`,
        pageWidth - 20,
        footerY + 10,
        { align: 'right' }
      );
      
      // Add page numbers to non-first pages
      if (data.pageNumber > 1) {
        doc.setFontSize(10);
        doc.setTextColor(colors.text.medium[0], colors.text.medium[1], colors.text.medium[2]);
        doc.text(
          `Page ${data.pageNumber}`,
          pageWidth - 20,
          30,
          { align: 'right' }
        );
      }
    },
  });

  // Add summary page if there are many visitors
  if (visitors.length > 50) {
    doc.addPage('a2', 'landscape');
    
    // Summary header
    doc.setFillColor(colors.header[0], colors.header[1], colors.header[2]);
    doc.rect(0, 0, pageWidth, 45, 'F');
    
    doc.setFontSize(20);
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.text('VISITORS REPORT SUMMARY', pageWidth / 2, 25, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text(`Generated: ${now.toLocaleDateString()}`, pageWidth / 2, 35, { align: 'center' });
    
    // Summary statistics
    const summaryY = 70;
    const summaryWidth = pageWidth - 100;
    const summaryHeight = 200;
    
    // Summary box
    doc.setFillColor(colors.background.light[0], colors.background.light[1], colors.background.light[2]);
    doc.roundedRect(50, summaryY, summaryWidth, summaryHeight, 5, 5, 'F');
    
    doc.setFontSize(16);
    doc.setTextColor(colors.text.dark[0], colors.text.dark[1], colors.text.dark[2]);
    doc.setFont('helvetica', 'bold');
    doc.text('Report Summary', pageWidth / 2, summaryY + 25, { align: 'center' });
    
    // Summary statistics in a grid
    const statsGridY = summaryY + 50;
    const gridSpacingX = summaryWidth / 2;
    const gridSpacingY = 40;
    
    // Column 1
    let yPos = statsGridY;
    
    doc.setFontSize(12);
    doc.setFont('helvetica', 'bold');
    doc.text('Total Visitors:', 70, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(visitors.length.toString(), 70 + 60, yPos);
    
    yPos += gridSpacingY;
    doc.setFont('helvetica', 'bold');
    doc.text('Active Visitors:', 70, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(activeVisitors.toString(), 70 + 60, yPos);
    
    yPos += gridSpacingY;
    doc.setFont('helvetica', 'bold');
    doc.text('Overdue Visitors:', 70, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(overdueVisitors.toString(), 70 + 60, yPos);
    
    yPos += gridSpacingY;
    doc.setFont('helvetica', 'bold');
    doc.text('Checked Out Today:', 70, yPos);
    doc.setFont('helvetica', 'normal');
    const todayCheckedOut = visitors.filter(v => {
      if (!v.timeOut || !v.isCheckedOut) return false;
      const checkoutDate = new Date(v.timeOut);
      return checkoutDate.toDateString() === today.toDateString();
    }).length;
    doc.text(todayCheckedOut.toString(), 70 + 60, yPos);
    
    // Column 2
    yPos = statsGridY;
    
    doc.setFont('helvetica', 'bold');
    doc.text('Today\'s Visitors:', 70 + gridSpacingX, yPos);
    doc.setFont('helvetica', 'normal');
    doc.text(todayVisitors.toString(), 70 + gridSpacingX + 60, yPos);
    
    yPos += gridSpacingY;
    doc.setFont('helvetica', 'bold');
    doc.text('Foot Visitors:', 70 + gridSpacingX, yPos);
    doc.setFont('helvetica', 'normal');
    const footVisitors = visitors.filter(v => v.visitorType === 'foot').length;
    doc.text(footVisitors.toString(), 70 + gridSpacingX + 60, yPos);
    
    yPos += gridSpacingY;
    doc.setFont('helvetica', 'bold');
    doc.text('Vehicle Visitors:', 70 + gridSpacingX, yPos);
    doc.setFont('helvetica', 'normal');
    const vehicleVisitors = visitors.filter(v => v.visitorType === 'vehicle').length;
    doc.text(vehicleVisitors.toString(), 70 + gridSpacingX + 60, yPos);
    
    yPos += gridSpacingY;
    doc.setFont('helvetica', 'bold');
    doc.text('Average Duration:', 70 + gridSpacingX, yPos);
    doc.setFont('helvetica', 'normal');
    const checkedOutVisitorsList = visitors.filter(v => v.isCheckedOut && v.timeOut);
    const avgDuration = checkedOutVisitorsList.length > 0 
      ? checkedOutVisitorsList.reduce((sum, v) => {
          const duration = v.timeOut!.getTime() - v.timeIn.getTime();
          return sum + duration;
        }, 0) / checkedOutVisitorsList.length
      : 0;
    const avgHours = Math.floor(avgDuration / (1000 * 60 * 60));
    const avgMinutes = Math.floor((avgDuration % (1000 * 60 * 60)) / (1000 * 60));
    doc.text(`${avgHours}h ${avgMinutes}m`, 70 + gridSpacingX + 60, yPos);
    
    // Add note
    doc.setFontSize(10);
    doc.setTextColor(colors.text.medium[0], colors.text.medium[1], colors.text.medium[2]);
    doc.text(
      'Note: This is a summary report. Detailed information can be found in the following pages.',
      pageWidth / 2,
      summaryY + summaryHeight - 20,
      { align: 'center' }
    );
  }

  // Save the PDF with timestamp
  const timestamp = now.toISOString()
    .replace(/[:.]/g, '-')
    .replace('T', '_')
    .split('.')[0];
  
  const filename = `umma-visitors-report-${timestamp}.pdf`;
  doc.save(filename);
};