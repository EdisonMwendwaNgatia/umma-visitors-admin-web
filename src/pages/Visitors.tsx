import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Chip,
  IconButton,
  Tooltip,
  Button,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Alert,
  Menu,
  MenuItem,
} from '@mui/material';
import {
  Refresh as RefreshIcon,
  ExpandMore as ExpandMoreIcon,
  Download as DownloadIcon,
  PictureAsPdf as PdfIcon,
  Warning as WarningIcon,
  Male as MaleIcon,
  Female as FemaleIcon,
  Transgender as OtherIcon,
  QuestionMark as QuestionMarkIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Visitor, User } from '../types';
import { generateVisitorsPDF } from '../utils/pdfGenerator';

const Visitors: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [groupedVisitors, setGroupedVisitors] = useState<{ [key: string]: Visitor[] }>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);

  useEffect(() => {
    fetchUsersAndVisitors();
  }, []);

  // Group visitors by date
  const groupVisitorsByDate = (visitors: Visitor[]) => {
    const grouped: { [key: string]: Visitor[] } = {};
    
    visitors.forEach(visitor => {
      const date = visitor.timeIn.toDateString();
      if (!grouped[date]) {
        grouped[date] = [];
      }
      grouped[date].push(visitor);
    });

    return grouped;
  };

  // Check if visitor is overdue (12+ hours)
  const isVisitorOverdue = (visitor: Visitor): boolean => {
    if (visitor.isCheckedOut) return false;
    
    const now = new Date();
    const timeIn = visitor.timeIn;
    const hoursSinceCheckIn = (now.getTime() - timeIn.getTime()) / (1000 * 60 * 60);
    
    return hoursSinceCheckIn > 12;
  };

  // Fetch both users and visitors
  const fetchUsersAndVisitors = async () => {
    setLoading(true);
    try {
      // Fetch users first
      const usersQuery = query(collection(db, 'users'));
      const usersSnapshot = await getDocs(usersQuery);
      const usersData: User[] = usersSnapshot.docs.map(doc => {
        const data = doc.data();
        return {
          uid: doc.id,
          email: data.email || '',
          displayName: data.displayName,
          role: data.role,
        };
      });
      setUsers(usersData);

      // Then fetch visitors
      const visitorsQuery = query(collection(db, 'visitors'), orderBy('timeIn', 'desc'));
      const visitorsSnapshot = await getDocs(visitorsQuery);

      const visitorsData: Visitor[] = visitorsSnapshot.docs.map((doc) => {
        const d = doc.data();
        const isCheckedOut = d.isCheckedOut ?? false;

        return {
          id: doc.id,
          visitorName: d.visitorName || '',
          phoneNumber: d.phoneNumber || '',
          idNumber: d.idNumber || '',
          visitorType: (d.visitorType === 'foot' || d.visitorType === 'vehicle') 
            ? d.visitorType 
            : 'foot',
          refNumber: d.refNumber || '',
          purposeOfVisit: d.purposeOfVisit || '',
          residence: d.residence ?? d.Residence ?? d.resdience ?? d.resdence ?? '',
          institutionOccupation: 
            d.institutionOccupation ??
            d.institutionalOccupation ??
            d.institutionoccupation ??
            d.insttutlnOccupation ??
            d.institution_occupation ??
            '',
          gender: d.gender || 'N/A', // Handle missing gender
          checkedInBy: d.checkedInBy || '',
          checkedOutBy: d.checkedOutBy || '',
          isCheckedOut: isCheckedOut,
          timeIn: safeDate(d.timeIn),
          timeOut: isCheckedOut ? safeDate(d.timeOut ?? d.timeout ?? d.time_out) : undefined,
        };
      });

      setVisitors(visitorsData);
      setGroupedVisitors(groupVisitorsByDate(visitorsData));
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  };

  // Helper function to get display name from UUID
  const getDisplayNameFromUUID = (uuid: string): string => {
    if (!uuid) return '-';
    
    const user = users.find(u => u.uid === uuid);
    if (user) {
      if (user.displayName && user.displayName !== '--' && user.displayName.trim() !== '') {
        return user.displayName;
      }
      
      if (user.email) {
        const atIndex = user.email.indexOf('@');
        if (atIndex > 0) {
          return user.email.substring(0, atIndex);
        }
        return user.email;
      }
    }
    
    return uuid;
  };

  // Helper function to get gender icon
  const getGenderIcon = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return <MaleIcon fontSize="small" />;
      case 'female':
        return <FemaleIcon fontSize="small" />;
      case 'other':
        return <OtherIcon fontSize="small" />;
      default:
        return <QuestionMarkIcon fontSize="small" />;
    }
  };

  // Helper function to get gender chip color
  const getGenderColor = (gender: string) => {
    switch (gender?.toLowerCase()) {
      case 'male':
        return 'primary';
      case 'female':
        return 'secondary';
      case 'other':
        return 'info';
      default:
        return 'default';
    }
  };

  // Helper function to format gender display text
  const formatGenderText = (gender: string) => {
    if (!gender || gender === 'N/A' || gender.toLowerCase() === 'na') {
      return 'N/A';
    }
    return gender;
  };

  const safeDate = (value: any): Date => {
    if (!value) return new Date();
    
    if (value instanceof Timestamp) {
      return value.toDate();
    }
    
    if (typeof value.toDate === 'function') {
      return value.toDate();
    }
    
    if (value instanceof Date) {
      return value;
    }
    
    if (typeof value === 'string') {
      const parsed = new Date(value);
      if (!isNaN(parsed.getTime())) {
        return parsed;
      }
    }
    
    if (typeof value === 'number') {
      return new Date(value);
    }
    
    return new Date();
  };

  const formatDateTime = (date: Date | undefined): string => {
    if (!date) return '-';
    return date.toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      hour12: true
    });
  };

  const formatDateHeader = (dateString: string): string => {
    const date = new Date(dateString);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    }
  };

  const getDateStats = (visitors: Visitor[]) => {
    const total = visitors.length;
    const active = visitors.filter(v => !v.isCheckedOut).length;
    const overdue = visitors.filter(v => isVisitorOverdue(v)).length;
    
    return { total, active, overdue };
  };

  // Download handlers
  const handleDownloadMenuOpen = (event: React.MouseEvent<HTMLElement>) => {
    setDownloadMenuAnchor(event.currentTarget);
  };

  const handleDownloadMenuClose = () => {
    setDownloadMenuAnchor(null);
  };

  const handleDownloadPDF = (visitorsToDownload?: Visitor[]) => {
    const data = visitorsToDownload || visitors;
    generateVisitorsPDF(data, users);
    handleDownloadMenuClose();
  };

  const handleDownloadAllPDF = () => {
    handleDownloadPDF();
  };

  const handleDownloadTodayPDF = () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    const todayVisitors = visitors.filter(visitor => {
      const visitorDate = new Date(visitor.timeIn);
      visitorDate.setHours(0, 0, 0, 0);
      return visitorDate.getTime() === today.getTime();
    });
    
    handleDownloadPDF(todayVisitors);
  };

  const columns: GridColDef[] = [
    { 
      field: 'visitorName', 
      headerName: 'Visitor Name', 
      width: 200, 
      flex: 1 
    },
    { 
      field: 'phoneNumber', 
      headerName: 'Phone', 
      width: 150 
    },
    { 
      field: 'idNumber', 
      headerName: 'ID Number', 
      width: 150 
    },
    {
      field: 'gender',
      headerName: 'Gender',
      width: 120,
      renderCell: (params: GridRenderCellParams<Visitor>) => {
        const gender = params.value as string || 'N/A';
        return (
          <Chip
            icon={getGenderIcon(gender)}
            label={formatGenderText(gender)}
            color={getGenderColor(gender) as any}
            size="small"
            variant="outlined"
            sx={{ 
              minWidth: 80,
              '& .MuiChip-icon': {
                marginLeft: '4px',
                marginRight: '2px',
              }
            }}
          />
        );
      },
    },
    {
      field: 'visitorType',
      headerName: 'Type',
      width: 120,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <Chip
          label={params.value}
          color={params.value === 'vehicle' ? 'primary' : 'default'}
          size="small"
          variant="outlined"
        />
      ),
    },
    {
      field: 'refNumber',
      headerName: 'Vehicle Plate',
      width: 150,
      renderCell: (params: GridRenderCellParams<Visitor>) => 
        params.value || '-',
    },
    { 
      field: 'residence', 
      headerName: 'Residence', 
      width: 180, 
      flex: 1 
    },
    { 
      field: 'institutionOccupation', 
      headerName: 'Occupation', 
      width: 180, 
      flex: 1 
    },
    { 
      field: 'purposeOfVisit', 
      headerName: 'Purpose', 
      width: 200, 
      flex: 1 
    },
    {
      field: 'timeIn',
      headerName: 'Check In',
      width: 200,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {formatDateTime(params.value as Date)}
        </Typography>
      ),
    },
    {
      field: 'timeOut',
      headerName: 'Check Out',
      width: 200,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <Typography variant="body2" sx={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
          {params.row.isCheckedOut ? formatDateTime(params.value as Date) : '-'}
        </Typography>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 130,
      renderCell: (params: GridRenderCellParams<Visitor>) => {
        const visitor = params.row as Visitor;
        
        if (visitor.isCheckedOut) {
          return (
            <Chip
              label="Checked Out"
              color="default"
              variant="outlined"
              size="small"
            />
          );
        } else if (isVisitorOverdue(visitor)) {
          return (
            <Chip
              icon={<WarningIcon />}
              label="Overdue"
              color="error"
              variant="filled"
              size="small"
            />
          );
        } else {
          return (
            <Chip
              label="Active"
              color="success"
              variant="filled"
              size="small"
            />
          );
        }
      },
    },
    { 
      field: 'checkedInBy', 
      headerName: 'Checked In By', 
      width: 180,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <Tooltip title={`UID: ${params.value || 'N/A'}`}>
          <span>{getDisplayNameFromUUID(params.value as string)}</span>
        </Tooltip>
      ),
    },
    {
      field: 'checkedOutBy',
      headerName: 'Checked Out By',
      width: 180,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <Tooltip title={`UID: ${params.value || 'N/A'}`}>
          <span>{params.value ? getDisplayNameFromUUID(params.value as string) : '-'}</span>
        </Tooltip>
      ),
    },
  ];

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            All Visitors
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Total: {visitors.length} visitors • {visitors.filter(v => !v.isCheckedOut).length} active • {visitors.filter(v => isVisitorOverdue(v)).length} overdue
          </Typography>
        </Box>
        <Box display="flex" gap={1}>
          <Button
            variant="outlined"
            startIcon={<DownloadIcon />}
            onClick={handleDownloadMenuOpen}
          >
            Export
          </Button>
          <Menu
            anchorEl={downloadMenuAnchor}
            open={Boolean(downloadMenuAnchor)}
            onClose={handleDownloadMenuClose}
          >
            <MenuItem onClick={handleDownloadAllPDF}>
              <PdfIcon sx={{ mr: 1 }} />
              Download All as PDF
            </MenuItem>
            <MenuItem onClick={handleDownloadTodayPDF}>
              <PdfIcon sx={{ mr: 1 }} />
              Download Today's Report
            </MenuItem>
          </Menu>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchUsersAndVisitors} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {Object.keys(groupedVisitors).length === 0 && !loading ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          No visitor data found.
        </Alert>
      ) : (
        Object.keys(groupedVisitors)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          .map(date => {
            const dateVisitors = groupedVisitors[date];
            const stats = getDateStats(dateVisitors);
            
            return (
              <Accordion 
                key={date} 
                defaultExpanded={date === new Date().toDateString()}
                sx={{ mb: 2 }}
              >
                <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                  <Box display="flex" alignItems="center" justifyContent="space-between" width="100%">
                    <Box display="flex" alignItems="center" gap={2}>
                      <Typography variant="h6" sx={{ fontWeight: 600 }}>
                        {formatDateHeader(date)}
                      </Typography>
                      <Chip 
                        label={`${stats.total} visitors`} 
                        size="small" 
                        variant="outlined"
                      />
                      {stats.active > 0 && (
                        <Chip 
                          label={`${stats.active} active`} 
                          color="success" 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                      {stats.overdue > 0 && (
                        <Chip 
                          icon={<WarningIcon />}
                          label={`${stats.overdue} overdue`} 
                          color="error" 
                          size="small" 
                        />
                      )}
                    </Box>
                    <Button
                      size="small"
                      startIcon={<PdfIcon />}
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDownloadPDF(dateVisitors);
                      }}
                    >
                      PDF
                    </Button>
                  </Box>
                </AccordionSummary>
                <AccordionDetails sx={{ p: 0 }}>
                  <Paper sx={{ width: '100%' }}>
                    <DataGrid
                      rows={dateVisitors}
                      columns={columns}
                      loading={loading}
                      autoHeight
                      pageSizeOptions={[10, 25, 50]}
                      initialState={{
                        pagination: {
                          paginationModel: { pageSize: 10, page: 0 },
                        },
                      }}
                      sx={{
                        '& .MuiDataGrid-cell': {
                          borderBottom: '1px solid #f0f0f0',
                        },
                        '& .MuiDataGrid-row:hover': {
                          backgroundColor: 'rgba(0, 0, 0, 0.04)',
                        },
                      }}
                      getRowClassName={(params) => 
                        isVisitorOverdue(params.row) ? 'overdue-row' : ''
                      }
                    />
                  </Paper>
                </AccordionDetails>
              </Accordion>
            );
          })
      )}
    </Box>
  );
};

export default Visitors;