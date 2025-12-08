import React, { useState, useEffect, useCallback } from 'react';
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
  Male as MaleIcon,
  Female as FemaleIcon,
  Transgender as OtherIcon,
  QuestionMark as QuestionMarkIcon,
  LocalOffer as TagIcon,
  History as HistoryIcon,
  Search as SearchIcon,
} from '@mui/icons-material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import { collection, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';
import { db } from '../config/firebase';
import { Visitor, User } from '../types';
import { generateVisitorsPDF } from '../utils/pdfGenerator';
import { updateVisitorField } from '../utils/firebaseUtils';
import { EditableCell } from '../components/EditableCell';
import { EditHistoryDialog } from '../components/EditHistoryDialog';
import VisitorSearchBar from '../components/VisitorSearchBar';
import CheckoutComponent from '../components/CheckoutComponent';
import { useAuth } from '../contexts/AuthContext';

const Visitors: React.FC = () => {
  const [visitors, setVisitors] = useState<Visitor[]>([]);
  const [filteredVisitors, setFilteredVisitors] = useState<Visitor[]>([]);
  const [groupedVisitors, setGroupedVisitors] = useState<{ [key: string]: Visitor[] }>({});
  const [groupedFilteredVisitors, setGroupedFilteredVisitors] = useState<{ [key: string]: Visitor[] }>({});
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [downloadMenuAnchor, setDownloadMenuAnchor] = useState<null | HTMLElement>(null);
  const [editHistoryDialog, setEditHistoryDialog] = useState<{
    open: boolean;
    editHistory: any[];
    visitorName?: string;
  }>({ open: false, editHistory: [] });
  const [isSearching, setIsSearching] = useState(false);
  const [searchResultCount, setSearchResultCount] = useState(0);

  const { user: currentUser, userRole } = useAuth();
  const currentUserUid = currentUser?.uid || '';
  const currentUserEmail = currentUser?.email || '';
  const isAdmin = userRole === 'admin';

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

  // Fetch both users and visitors with edit history
  const fetchUsersAndVisitors = useCallback(async () => {
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
          gender: d.gender || 'N/A',
          tagNumber: d.tagNumber || 'N/A',
          tagNotGiven: d.tagNotGiven || false,
          checkedInBy: d.checkedInBy || '',
          checkedOutBy: d.checkedOutBy || '',
          isCheckedOut: isCheckedOut,
          timeIn: safeDate(d.timeIn),
          timeOut: isCheckedOut ? safeDate(d.timeOut ?? d.timeout ?? d.time_out) : undefined,
          // Edit tracking fields
          editedBy: d.editedBy || '',
          lastEditedAt: d.lastEditedAt ? safeDate(d.lastEditedAt) : undefined,
          editHistory: d.editHistory || [],
        };
      });

      setVisitors(visitorsData);
      setFilteredVisitors(visitorsData);
      setGroupedVisitors(groupVisitorsByDate(visitorsData));
      setGroupedFilteredVisitors(groupVisitorsByDate(visitorsData));
      setSearchResultCount(visitorsData.length);
    } catch (err) {
      console.error('Error fetching data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  // Handle search results
  const handleSearchResults = (filteredVisitors: Visitor[]) => {
    setFilteredVisitors(filteredVisitors);
    setGroupedFilteredVisitors(groupVisitorsByDate(filteredVisitors));
    setIsSearching(true);
    setSearchResultCount(filteredVisitors.length);
  };

  // Handle clear search
  const handleClearSearch = () => {
    setFilteredVisitors(visitors);
    setGroupedFilteredVisitors(groupVisitorsByDate(visitors));
    setIsSearching(false);
    setSearchResultCount(visitors.length);
  };

// Handle field update
const handleFieldUpdate = async (field: string, newValue: any, visitorData: Visitor) => {
  console.log('handleFieldUpdate called:', { field, newValue, visitorData: visitorData.id });
  
  if (!isAdmin) {
    alert('Only admins can edit visitor information.');
    return false;
  }

  try {
    const oldValue = visitorData[field as keyof Visitor];
    console.log('Old value:', oldValue);

    // Call the update function
    const success = await updateVisitorField(
      visitorData.id,
      field,
      newValue,
      oldValue,
      currentUserUid,
      visitorData
    );

    if (!success) {
      throw new Error('Failed to update field in Firebase');
    }

    // Update local state
    const updatedVisitor = {
      ...visitorData,
      [field]: newValue,
      editedBy: currentUserUid,
      lastEditedAt: new Date(),
      editHistory: [
        ...(visitorData.editHistory || []),
        {
          field,
          oldValue,
          newValue,
          editedBy: currentUserUid,
          editedAt: new Date(),
        }
      ]
    };

    // Update visitors state
    setVisitors(prev => prev.map(v => v.id === visitorData.id ? updatedVisitor : v));

    // Update filtered visitors if in search mode
    if (isSearching) {
      setFilteredVisitors(prev => prev.map(v => v.id === visitorData.id ? updatedVisitor : v));
    }

    // Update grouped visitors
    setGroupedVisitors(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(date => {
        updated[date] = updated[date].map(v => v.id === visitorData.id ? updatedVisitor : v);
      });
      return updated;
    });

    // Update grouped filtered visitors
    if (isSearching) {
      setGroupedFilteredVisitors(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(date => {
          updated[date] = updated[date].map(v => v.id === visitorData.id ? updatedVisitor : v);
        });
        return updated;
      });
    }

    console.log('Local state updated successfully');
    return true;
  } catch (error) {
    console.error('Error updating field:', error);
    alert(`Failed to update field: ${error instanceof Error ? error.message : 'Unknown error'}`);
    return false;
  }
};

  // Handle checkout success
  const handleCheckoutSuccess = (updatedVisitor: Visitor) => {
    // Update local state
    setVisitors(prev => prev.map(v => v.id === updatedVisitor.id ? updatedVisitor : v));
    
    // Update filtered visitors if in search mode
    if (isSearching) {
      setFilteredVisitors(prev => prev.map(v => v.id === updatedVisitor.id ? updatedVisitor : v));
    }

    // Update grouped visitors
    setGroupedVisitors(prev => {
      const updated = { ...prev };
      Object.keys(updated).forEach(date => {
        updated[date] = updated[date].map(v => v.id === updatedVisitor.id ? updatedVisitor : v);
      });
      return updated;
    });

    // Update grouped filtered visitors if in search mode
    if (isSearching) {
      setGroupedFilteredVisitors(prev => {
        const updated = { ...prev };
        Object.keys(updated).forEach(date => {
          updated[date] = updated[date].map(v => v.id === updatedVisitor.id ? updatedVisitor : v);
        });
        return updated;
      });
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

  // Helper function for tag display - Simplified to only show tag number or N/A
  const getTagDisplay = (tagNumber: string, tagNotGiven: boolean) => {
    if (tagNumber && tagNumber !== 'N/A') {
      return (
        <Chip
          icon={<TagIcon />}
          label={`#${tagNumber}`}
          color="success"
          size="small"
          variant="filled"
          sx={{ 
            minWidth: 80,
            '& .MuiChip-icon': {
              marginLeft: '4px',
              marginRight: '2px',
            }
          }}
        />
      );
    }
    
    return (
      <Chip
        label="N/A"
        size="small"
        variant="outlined"
        sx={{ minWidth: 80 }}
      />
    );
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

  // Show edit history
  const showEditHistory = (visitor: Visitor) => {
    setEditHistoryDialog({
      open: true,
      editHistory: visitor.editHistory || [],
      visitorName: visitor.visitorName,
    });
  };

  const columns: GridColDef[] = [
    { 
      field: 'visitorName', 
      headerName: 'Visitor Name', 
      width: 200, 
      flex: 1,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <EditableCell
          value={params.value}
          field="visitorName"
          visitorId={params.row.id || ''}
          visitorData={params.row}
          onSave={handleFieldUpdate}
          currentUserUid={currentUserUid}
          userRole={userRole || ''}
          readOnly={!isAdmin}
        />
      ),
    },
    { 
      field: 'phoneNumber', 
      headerName: 'Phone', 
      width: 150,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <EditableCell
          value={params.value}
          field="phoneNumber"
          visitorId={params.row.id || ''}
          visitorData={params.row}
          onSave={handleFieldUpdate}
          type="text"
          currentUserUid={currentUserUid}
          userRole={userRole || ''}
          readOnly={!isAdmin}
        />
      ),
    },
    { 
      field: 'idNumber', 
      headerName: 'ID Number', 
      width: 150,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <EditableCell
          value={params.value}
          field="idNumber"
          visitorId={params.row.id || ''}
          visitorData={params.row}
          onSave={handleFieldUpdate}
          currentUserUid={currentUserUid}
          userRole={userRole || ''}
          readOnly={!isAdmin}
        />
      ),
    },
    {
      field: 'gender',
      headerName: 'Gender',
      width: 120,
      renderCell: (params: GridRenderCellParams<Visitor>) => {
        const gender = params.value as string || 'N/A';
        return (
          <EditableCell
            value={gender}
            field="gender"
            visitorId={params.row.id || ''}
            visitorData={params.row}
            onSave={handleFieldUpdate}
            type="select"
            options={[
              { value: 'Male', label: 'Male' },
              { value: 'Female', label: 'Female' },
              { value: 'Other', label: 'Other' },
              { value: 'N/A', label: 'N/A' },
            ]}
            currentUserUid={currentUserUid}
            userRole={userRole || ''}
            readOnly={!isAdmin}
          />
        );
      },
    },
    {
      field: 'tagInfo',
      headerName: 'Tag',
      width: 120,
      renderCell: (params: GridRenderCellParams<Visitor>) => {
        const tagNumber = params.row.tagNumber || 'N/A';
        
        if (isAdmin) {
          return (
            <EditableCell
              value={tagNumber}
              field="tagNumber"
              visitorId={params.row.id || ''}
              visitorData={params.row}
              onSave={handleFieldUpdate}
              currentUserUid={currentUserUid}
              userRole={userRole || ''}
              placeholder="Tag number"
            />
          );
        }
        
        return getTagDisplay(tagNumber, false);
      },
    },
    {
      field: 'visitorType',
      headerName: 'Type',
      width: 120,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <EditableCell
          value={params.value}
          field="visitorType"
          visitorId={params.row.id || ''}
          visitorData={params.row}
          onSave={handleFieldUpdate}
          type="select"
          options={[
            { value: 'foot', label: 'Foot' },
            { value: 'vehicle', label: 'Vehicle' },
          ]}
          currentUserUid={currentUserUid}
          userRole={userRole || ''}
          readOnly={!isAdmin}
        />
      ),
    },
    {
      field: 'refNumber',
      headerName: 'Vehicle Plate',
      width: 150,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <EditableCell
          value={params.value}
          field="refNumber"
          visitorId={params.row.id || ''}
          visitorData={params.row}
          onSave={handleFieldUpdate}
          currentUserUid={currentUserUid}
          userRole={userRole || ''}
          readOnly={!isAdmin}
        />
      ),
    },
    { 
      field: 'residence', 
      headerName: 'Residence', 
      width: 180, 
      flex: 1,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <EditableCell
          value={params.value}
          field="residence"
          visitorId={params.row.id || ''}
          visitorData={params.row}
          onSave={handleFieldUpdate}
          multiline
          currentUserUid={currentUserUid}
          userRole={userRole || ''}
          readOnly={!isAdmin}
        />
      ),
    },
    { 
      field: 'institutionOccupation', 
      headerName: 'Occupation', 
      width: 180, 
      flex: 1,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <EditableCell
          value={params.value}
          field="institutionOccupation"
          visitorId={params.row.id || ''}
          visitorData={params.row}
          onSave={handleFieldUpdate}
          multiline
          currentUserUid={currentUserUid}
          userRole={userRole || ''}
          readOnly={!isAdmin}
        />
      ),
    },
    { 
      field: 'purposeOfVisit', 
      headerName: 'Purpose', 
      width: 200, 
      flex: 1,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <EditableCell
          value={params.value}
          field="purposeOfVisit"
          visitorId={params.row.id || ''}
          visitorData={params.row}
          onSave={handleFieldUpdate}
          multiline
          currentUserUid={currentUserUid}
          userRole={userRole || ''}
          readOnly={!isAdmin}
        />
      ),
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
      width: 180,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <CheckoutComponent
          visitor={params.row}
          currentUserUid={currentUserUid}
          currentUserEmail={currentUserEmail}
          onCheckoutSuccess={handleCheckoutSuccess}
          isAdmin={isAdmin}
          isVisitorOverdue={isVisitorOverdue}
          formatDateTime={formatDateTime}
        />
      ),
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
    {
      field: 'editedBy',
      headerName: 'Last Edited By',
      width: 180,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <Tooltip title={`Last edited at: ${params.row.lastEditedAt ? formatDateTime(params.row.lastEditedAt) : 'Never'}`}>
          <span>
            {params.row.editedBy ? getDisplayNameFromUUID(params.row.editedBy) : '-'}
          </span>
        </Tooltip>
      ),
    },
    {
      field: 'actions',
      headerName: 'History',
      width: 100,
      renderCell: (params: GridRenderCellParams<Visitor>) => (
        <Tooltip title="View Edit History">
          <IconButton
            size="small"
            onClick={() => showEditHistory(params.row)}
            disabled={!params.row.editHistory || params.row.editHistory.length === 0}
          >
            <HistoryIcon fontSize="small" />
          </IconButton>
        </Tooltip>
      ),
    },
  ];

  // Get the visitors to display (either filtered or all)
  const displayGroupedVisitors = isSearching ? groupedFilteredVisitors : groupedVisitors;
  const displayVisitors = isSearching ? filteredVisitors : visitors;

  return (
    <Box>
      <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
        <Box>
          <Typography variant="h4" gutterBottom>
            All Visitors {isAdmin && <Chip label="Admin Mode" size="small" color="primary" sx={{ ml: 1 }} />}
            {isSearching && (
              <Chip 
                label={`Search Results: ${searchResultCount} found`} 
                color="info" 
                size="small" 
                sx={{ ml: 1 }}
                icon={<SearchIcon />}
              />
            )}
          </Typography>
          <Typography variant="body1" color="text.secondary">
            Total: {displayVisitors.length} visitors • {displayVisitors.filter(v => !v.isCheckedOut).length} active • {displayVisitors.filter(v => isVisitorOverdue(v)).length} overdue
            {isSearching && visitors.length !== displayVisitors.length && (
              <span style={{ marginLeft: 8 }}>
                (Filtered from {visitors.length} total)
              </span>
            )}
          </Typography>
          {isAdmin && (
            <Alert severity="info" sx={{ mt: 1, maxWidth: 600 }}>
              You are in admin mode. Click on any field to edit. All changes are tracked.
            </Alert>
          )}
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
            {isSearching && (
              <MenuItem onClick={() => handleDownloadPDF(filteredVisitors)}>
                <PdfIcon sx={{ mr: 1 }} />
                Download Search Results ({filteredVisitors.length})
              </MenuItem>
            )}
          </Menu>
          <Tooltip title="Refresh">
            <IconButton onClick={fetchUsersAndVisitors} disabled={loading}>
              <RefreshIcon />
            </IconButton>
          </Tooltip>
        </Box>
      </Box>

      {/* Search Bar */}
      <VisitorSearchBar
        visitors={visitors}
        onSearchResults={handleSearchResults}
        onClearSearch={handleClearSearch}
      />

      {Object.keys(displayGroupedVisitors).length === 0 && !loading ? (
        <Alert severity="info" sx={{ mb: 2 }}>
          {isSearching ? 'No visitors found matching your search criteria.' : 'No visitor data found.'}
        </Alert>
      ) : (
        Object.keys(displayGroupedVisitors)
          .sort((a, b) => new Date(b).getTime() - new Date(a).getTime())
          .map(date => {
            const dateVisitors = displayGroupedVisitors[date];
            const stats = getDateStats(dateVisitors);
            
            return (
              <Accordion 
                key={date} 
                defaultExpanded={date === new Date().toDateString() && !isSearching}
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
                          label={`${stats.overdue} overdue`} 
                          color="error" 
                          size="small" 
                        />
                      )}
                      {isSearching && dateVisitors.length > 0 && (
                        <Chip 
                          label={`${dateVisitors.length} match${dateVisitors.length > 1 ? 'es' : ''}`} 
                          color="info" 
                          size="small" 
                          variant="outlined"
                        />
                      )}
                    </Box>
                    <Box display="flex" gap={1}>
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
                        '& .overdue-row': {
                          backgroundColor: 'rgba(244, 67, 54, 0.08)',
                          '&:hover': {
                            backgroundColor: 'rgba(244, 67, 54, 0.12)',
                          },
                        },
                        '& .search-highlight-row': {
                          backgroundColor: 'rgba(255, 245, 204, 0.3)',
                          '&:hover': {
                            backgroundColor: 'rgba(255, 245, 204, 0.5)',
                          },
                        },
                      }}
                      getRowClassName={(params) => {
                        const classes = [];
                        if (isVisitorOverdue(params.row)) classes.push('overdue-row');
                        if (isSearching) classes.push('search-highlight-row');
                        return classes.join(' ');
                      }}
                    />
                  </Paper>
                </AccordionDetails>
              </Accordion>
            );
          })
      )}

      <EditHistoryDialog
        open={editHistoryDialog.open}
        onClose={() => setEditHistoryDialog({ open: false, editHistory: [] })}
        editHistory={editHistoryDialog.editHistory}
        users={users}
        visitorName={editHistoryDialog.visitorName}
      />
    </Box>
  );
};

export default Visitors;