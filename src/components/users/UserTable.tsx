import React from 'react';
import {
  Card,
  CardContent,
  Paper,
  Divider,
  Box,
  Typography,
  Button,
  IconButton,
  Tooltip,
} from '@mui/material';
import { DataGrid, GridColDef, GridRenderCellParams } from '@mui/x-data-grid';
import AdminIcon from '@mui/icons-material/AdminPanelSettings';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import ComputerIcon from '@mui/icons-material/Computer';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import EmailIcon from '@mui/icons-material/Email';
import VisibilityIcon from '@mui/icons-material/Visibility';
import { User } from '../../types';
import UserPresenceStatus from '../UserPresenceStatus';

interface UserTableProps {
  users: User[];
  filteredUsers: User[];
  loading: boolean;
  editingUser: User | null;
  onRowClick?: (user: User) => void;
  currentUserUid?: string;
  onEditDisplayName: (user: User) => void;
  onOpenRoleDialog: (user: User) => void;
  onOpenDeleteDialog: (user: User) => void;
  onOpenMessageDialog: (user: User) => void;
  onOpenDetailsDialog: (user: User) => void;
  onSaveDisplayName: () => void;
  onCancelEdit: () => void;
  setEditingUser: (user: User | null) => void;
}

const UserTable: React.FC<UserTableProps> = ({
  users,
  filteredUsers,
  loading,
  editingUser,
  currentUserUid,
  onEditDisplayName,
  onOpenRoleDialog,
  onOpenDeleteDialog,
  onOpenMessageDialog,
  onOpenDetailsDialog,
  onSaveDisplayName,
  onCancelEdit,
  setEditingUser,
}) => {
  const columns: GridColDef[] = [
    {
      field: 'user',
      headerName: 'User',
      width: 300,
      flex: 1,
      renderCell: (params: GridRenderCellParams<User>) => (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, width: '100%' }}>
          {/* User row content would go here - extracted to UserTableRow component */}
        </Box>
      ),
    },
    {
      field: 'role',
      headerName: 'Role',
      width: 120,
      renderCell: (params) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: params.value === 'admin' ? '#10B98120' : '#6B728020',
            border: `1px solid ${params.value === 'admin' ? '#10B98140' : '#6B728040'}`,
          }}
        >
          {params.value === 'admin' ? <AdminIcon sx={{ fontSize: 16, color: '#10B981' }} /> : <PersonIcon sx={{ fontSize: 16, color: '#6B7280' }} />}
          <Typography variant="body2" sx={{ fontWeight: 600, color: params.value === 'admin' ? '#10B981' : '#6B7280' }}>
            {params.value || 'user'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'platform',
      headerName: 'Platform',
      width: 120,
      renderCell: (params) => (
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 1,
            px: 1.5,
            py: 0.5,
            borderRadius: 1,
            backgroundColor: params.value === 'mobile' ? '#8B5CF620' : '#3B82F620',
            border: `1px solid ${params.value === 'mobile' ? '#8B5CF640' : '#3B82F640'}`,
          }}
        >
          {params.value === 'mobile' ? <PhoneIphoneIcon sx={{ fontSize: 16, color: '#8B5CF6' }} /> : <ComputerIcon sx={{ fontSize: 16, color: '#3B82F6' }} />}
          <Typography variant="body2" sx={{ fontWeight: 600, color: params.value === 'mobile' ? '#8B5CF6' : '#3B82F6' }}>
            {params.value === 'mobile' ? 'Mobile' : 'Web'}
          </Typography>
        </Box>
      ),
    },
    {
      field: 'status',
      headerName: 'Status',
      width: 150,
      renderCell: (params: GridRenderCellParams<User>) => {
        return <UserPresenceStatus user={params.row} />;
      },
    },
    {
      field: 'lastSeen',
      headerName: 'Last Active',
      width: 180,
      renderCell: (params: GridRenderCellParams<User>) => {
        if (!params.row.lastSeen) return 'Never';
        
        const date = new Date(params.row.lastSeen);
        const now = new Date();
        const diffMs = now.getTime() - date.getTime();
        const diffMins = Math.floor(diffMs / 60000);
        
        if (diffMins < 1) return 'Just now';
        if (diffMins < 60) return `${diffMins} min ago`;
        if (diffMins < 1440) return `${Math.floor(diffMins / 60)} hours ago`;
        
        return date.toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric',
          hour: '2-digit',
          minute: '2-digit'
        });
      },
    },
    {
      field: 'createdAt',
      headerName: 'Created',
      width: 120,
      renderCell: (params: GridRenderCellParams<User>) => {
        if (!params.row.createdAt) return 'N/A';
        try {
          const date = new Date(params.row.createdAt);
          return date.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
          });
        } catch (error) {
          return 'Invalid date';
        }
      },
    },
    {
      field: 'actions',
      headerName: 'Actions',
      width: 200,
      renderCell: (params: GridRenderCellParams<User>) => (
        <Box sx={{ display: 'flex', gap: 1 }}>
          {editingUser?.uid === params.row.uid ? (
            <>
              <Button
                size="small"
                variant="contained"
                color="primary"
                onClick={onSaveDisplayName}
                startIcon={<CheckCircleIcon />}
                sx={{
                  backgroundColor: '#10B981',
                  '&:hover': {
                    backgroundColor: '#059669',
                  }
                }}
              >
                Save
              </Button>
              <Button
                size="small"
                variant="outlined"
                onClick={onCancelEdit}
              >
                Cancel
              </Button>
            </>
          ) : (
            <>
              <Tooltip title="Send Message">
                <IconButton 
                  size="small"
                  onClick={() => onOpenMessageDialog(params.row)}
                  sx={{ 
                    color: '#6B7280',
                    '&:hover': {
                      color: '#3B82F6',
                      backgroundColor: 'rgba(59, 130, 246, 0.1)'
                    }
                  }}
                >
                  <EmailIcon fontSize="small" />
                </IconButton>
              </Tooltip>
              <Tooltip title="View Details">
                <IconButton 
                  size="small"
                  onClick={() => onOpenDetailsDialog(params.row)}
                  sx={{ 
                    color: '#6B7280',
                    '&:hover': {
                      color: '#10B981',
                      backgroundColor: 'rgba(16, 185, 129, 0.1)'
                    }
                  }}
                >
                  <VisibilityIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </>
          )}
        </Box>
      ),
    },
  ];

  return (
    <Card 
      sx={{ 
        borderRadius: 3,
        boxShadow: '0 4px 20px rgba(0,0,0,0.08)',
        border: '1px solid',
        borderColor: 'divider'
      }}
    >
      <CardContent sx={{ p: 3 }}>
        <Divider sx={{ mb: 3 }} />
        <Paper sx={{ width: '100%', border: 'none' }} elevation={0}>
          <DataGrid
            rows={filteredUsers}
            columns={columns}
            loading={loading && users.length === 0}
            autoHeight
            pageSizeOptions={[10, 25, 50, 100]}
            getRowId={(row) => row.uid}
            initialState={{
              pagination: {
                paginationModel: { pageSize: 10, page: 0 },
              },
              sorting: {
                sortModel: [{ field: 'isOnline', sort: 'desc' }, { field: 'lastSeen', sort: 'desc' }],
              },
            }}
            sx={{
              border: 'none',
              '& .MuiDataGrid-cell': {
                borderBottom: '1px solid',
                borderColor: 'divider',
              },
              '& .MuiDataGrid-columnHeaders': {
                backgroundColor: '#F8FAFC',
                borderBottom: '2px solid',
                borderColor: 'divider',
              },
              '& .MuiDataGrid-row:hover': {
                backgroundColor: 'rgba(16, 185, 129, 0.04)',
              },
              '& .MuiDataGrid-row--online': {
                backgroundColor: 'rgba(16, 185, 129, 0.02)',
              },
            }}
            getRowClassName={(params) => 
              params.row.isOnline ? 'MuiDataGrid-row--online' : ''
            }
          />
        </Paper>
      </CardContent>
    </Card>
  );
};

export default UserTable;