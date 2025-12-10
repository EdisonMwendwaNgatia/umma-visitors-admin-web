import React from 'react';
import { Box, Button, IconButton, Tooltip, Typography } from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';
import AddIcon from '@mui/icons-material/Add';
import RefreshIcon from '@mui/icons-material/Refresh';

interface UserActionButtonsProps {
  onExportPDF: () => void;
  onExportExcel: () => void;
  onAddUser: () => void;
  onRefresh: () => void;
  loading: boolean;
  filteredCount: number;
  totalCount: number;
}

const UserActionButtons: React.FC<UserActionButtonsProps> = ({
  onExportPDF,
  onExportExcel,
  onAddUser,
  onRefresh,
  loading,
  filteredCount,
  totalCount,
}) => (
  <Box display="flex" justifyContent="space-between" alignItems="center" mb={3}>
    <Box>
      <Typography variant="h5" sx={{ fontWeight: 700, mb: 1 }}>
        System Users
      </Typography>
      <Typography variant="body2" color="text.secondary">
        {filteredCount} user{filteredCount !== 1 ? 's' : ''} showing
        {filteredCount !== totalCount && ` of ${totalCount}`}
      </Typography>
    </Box>
    <Box display="flex" gap={1}>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={onExportPDF}
        sx={{ mr: 1 }}
      >
        PDF
      </Button>
      <Button
        variant="outlined"
        startIcon={<DownloadIcon />}
        onClick={onExportExcel}
        sx={{ mr: 1 }}
      >
        Excel
      </Button>
      <Button
        variant="contained"
        startIcon={<AddIcon />}
        onClick={onAddUser}
        sx={{
          backgroundColor: '#10B981',
          '&:hover': {
            backgroundColor: '#059669',
          }
        }}
      >
        Add User
      </Button>
      <Tooltip title="Refresh Users">
        <IconButton 
          onClick={onRefresh} 
          disabled={loading}
          sx={{
            color: '#6B7280',
            backgroundColor: '#F3F4F6',
            '&:hover': {
              backgroundColor: '#E5E7EB',
            }
          }}
        >
          <RefreshIcon />
        </IconButton>
      </Tooltip>
    </Box>
  </Box>
);

export default UserActionButtons;