// components/VisitorDetailsModal.tsx
import React from 'react';
import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Box,
  Typography,
  Chip,
  Grid,
  Paper,
  Avatar,
  IconButton,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import PhoneIcon from '@mui/icons-material/Phone';
import BadgeIcon from '@mui/icons-material/Badge';
import HomeIcon from '@mui/icons-material/Home';
import WorkIcon from '@mui/icons-material/Work';
import CarIcon from '@mui/icons-material/DirectionsCar';
import WalkIcon from '@mui/icons-material/DirectionsWalk';
import ScheduleIcon from '@mui/icons-material/Schedule';
import CheckCircleIcon from '@mui/icons-material/CheckCircle';
import MaleIcon from '@mui/icons-material/Male';
import FemaleIcon from '@mui/icons-material/Female';
import OtherIcon from '@mui/icons-material/Transgender';
import QuestionMarkIcon from '@mui/icons-material/QuestionMark';
import TagIcon from '@mui/icons-material/LocalOffer';
import HistoryIcon from '@mui/icons-material/History';
import EditIcon from '@mui/icons-material/Edit';
import { Visitor, User } from '../types';

interface VisitorDetailsModalProps {
  open: boolean;
  onClose: () => void;
  visitor: Visitor | null;
  users: User[];
  isAdmin: boolean;
  onEditClick?: (visitor: Visitor) => void;
  onViewHistoryClick?: (visitor: Visitor) => void;
  formatDateTime: (date: Date | string | undefined) => string;
  getDisplayNameFromUUID: (uuid: string) => string;
  getGenderIcon: (gender: string) => React.ReactNode;
  getTagDisplay: (tagNumber: string, tagNotGiven: boolean) => React.ReactNode;
}

const VisitorDetailsModal: React.FC<VisitorDetailsModalProps> = ({
  open,
  onClose,
  visitor,
  users,
  isAdmin,
  onEditClick,
  onViewHistoryClick,
  formatDateTime,
  getDisplayNameFromUUID,
  getGenderIcon,
  getTagDisplay,
}) => {
  if (!visitor) return null;

  const getVisitorTypeIcon = () => {
    return visitor.visitorType === 'vehicle' ? <CarIcon /> : <WalkIcon />;
  };

  const getStatusIcon = () => {
    if (visitor.isCheckedOut) {
      return <CheckCircleIcon color="success" />;
    }
    return <ScheduleIcon color="action" />;
  };

  const formatDuration = () => {
    if (!visitor.timeOut || !visitor.isCheckedOut) return 'Active';
    
    const timeIn = visitor.timeIn instanceof Date ? visitor.timeIn : new Date(visitor.timeIn);
    const timeOut = visitor.timeOut instanceof Date ? visitor.timeOut : new Date(visitor.timeOut);
    const duration = timeOut.getTime() - timeIn.getTime();
    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));
    
    if (hours === 0) return `${minutes}m`;
    if (minutes === 0) return `${hours}h`;
    return `${hours}h ${minutes}m`;
  };

  const getGenderText = (gender: string) => {
    if (!gender || gender === 'N/A' || gender.toLowerCase() === 'na') {
      return 'N/A';
    }
    return gender.charAt(0).toUpperCase() + gender.slice(1).toLowerCase();
  };

  // Helper function to safely call formatDateTime
  const safeFormatDateTime = (date: Date | string | undefined): string => {
    if (!date) return '-';
    try {
      return formatDateTime(date);
    } catch (error) {
      console.error('Error formatting date:', error);
      return '-';
    }
  };

  // Safe getDisplayNameFromUUID wrapper
  const safeGetDisplayNameFromUUID = (uuid: string | undefined): string => {
    if (!uuid) return '-';
    try {
      return getDisplayNameFromUUID(uuid);
    } catch (error) {
      console.error('Error getting display name:', error);
      return 'Unknown';
    }
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 2,
        }
      }}
    >
      <DialogTitle>
        <Box display="flex" justifyContent="space-between" alignItems="center">
          <Box display="flex" alignItems="center" gap={2}>
            <Avatar sx={{ bgcolor: 'primary.main' }}>
              <PersonIcon />
            </Avatar>
            <Box>
              <Typography variant="h5" component="div">
                {visitor.visitorName}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Visitor Details
              </Typography>
            </Box>
          </Box>
          <IconButton onClick={onClose} size="small">
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent dividers>
        <Grid container spacing={3}>
          {/* Basic Information */}
          <Grid size={{ xs: 12 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <PersonIcon fontSize="small" />
                Basic Information
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Phone Number
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <PhoneIcon fontSize="small" color="action" />
                    {visitor.phoneNumber || '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    ID Number
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <BadgeIcon fontSize="small" color="action" />
                    {visitor.idNumber || '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Gender
                  </Typography>
                  <Box display="flex" alignItems="center" gap={1}>
                    {getGenderIcon(visitor.gender)}
                    <Typography variant="body1">
                      {getGenderText(visitor.gender)}
                    </Typography>
                  </Box>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Visitor Type
                  </Typography>
                  <Chip
                    icon={getVisitorTypeIcon()}
                    label={visitor.visitorType === 'vehicle' ? 'Vehicle' : 'Foot'}
                    color={visitor.visitorType === 'vehicle' ? 'primary' : 'default'}
                    size="small"
                    variant="outlined"
                  />
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Visit Details */}
          <Grid size={{ xs: 12 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <ScheduleIcon fontSize="small" />
                Visit Details
              </Typography>
              <Grid container spacing={2}>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Purpose of Visit
                  </Typography>
                  <Typography variant="body1">
                    {visitor.purposeOfVisit || '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Residence
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HomeIcon fontSize="small" color="action" />
                    {visitor.residence || '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Occupation/Institution
                  </Typography>
                  <Typography variant="body1" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <WorkIcon fontSize="small" color="action" />
                    {visitor.institutionOccupation || '-'}
                  </Typography>
                </Grid>
                <Grid size={{ xs: 12, sm: 6 }}>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Vehicle Plate
                  </Typography>
                  <Typography variant="body1">
                    {visitor.refNumber || '-'}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>

          {/* Timing & Status */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                {getStatusIcon()}
                Timing & Status
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Check In
                  </Typography>
                  <Typography variant="body1">
                    {safeFormatDateTime(visitor.timeIn)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Check Out
                  </Typography>
                  <Typography variant="body1">
                    {visitor.isCheckedOut ? safeFormatDateTime(visitor.timeOut) : '-'}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Duration
                  </Typography>
                  <Typography variant="body1">
                    {formatDuration()}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Status
                  </Typography>
                  <Chip
                    label={visitor.isCheckedOut ? 'Checked Out' : 'Active'}
                    color={visitor.isCheckedOut ? 'default' : 'success'}
                    variant={visitor.isCheckedOut ? 'outlined' : 'filled'}
                    size="small"
                  />
                </Box>
              </Box>
            </Paper>
          </Grid>

          {/* Tag & Personnel */}
          <Grid size={{ xs: 12, sm: 6 }}>
            <Paper variant="outlined" sx={{ p: 2, borderRadius: 2, height: '100%' }}>
              <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <TagIcon fontSize="small" />
                Tag & Personnel
              </Typography>
              <Box display="flex" flexDirection="column" gap={2}>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Tag Number
                  </Typography>
                  <Box mt={0.5}>
                    {getTagDisplay(visitor.tagNumber || '', visitor.tagNotGiven || false)}
                  </Box>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Checked In By
                  </Typography>
                  <Typography variant="body1">
                    {safeGetDisplayNameFromUUID(visitor.checkedInBy)}
                  </Typography>
                </Box>
                <Box>
                  <Typography variant="caption" color="text.secondary" display="block">
                    Checked Out By
                  </Typography>
                  <Typography variant="body1">
                    {visitor.checkedOutBy ? safeGetDisplayNameFromUUID(visitor.checkedOutBy) : '-'}
                  </Typography>
                </Box>
                {visitor.editedBy && (
                  <Box>
                    <Typography variant="caption" color="text.secondary" display="block">
                      Last Edited By
                    </Typography>
                    <Typography variant="body1">
                      {safeGetDisplayNameFromUUID(visitor.editedBy)}
                      {visitor.lastEditedAt && (
                        <Typography variant="caption" color="text.secondary" sx={{ ml: 1 }}>
                          ({safeFormatDateTime(visitor.lastEditedAt)})
                        </Typography>
                      )}
                    </Typography>
                  </Box>
                )}
              </Box>
            </Paper>
          </Grid>

          {/* Edit History */}
          {visitor.editHistory && visitor.editHistory.length > 0 && (
            <Grid size={{ xs: 12 }}>
              <Paper variant="outlined" sx={{ p: 2, borderRadius: 2 }}>
                <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                  <Typography variant="h6" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    <HistoryIcon fontSize="small" />
                    Edit History ({visitor.editHistory.length})
                  </Typography>
                  {onViewHistoryClick && (
                    <Button
                      size="small"
                      startIcon={<HistoryIcon />}
                      onClick={() => onViewHistoryClick(visitor)}
                    >
                      View Full History
                    </Button>
                  )}
                </Box>
                <Box sx={{ maxHeight: 150, overflow: 'auto' }}>
                  {visitor.editHistory.slice(-3).reverse().map((edit, index) => (
                    <Box key={index} mb={1} p={1} bgcolor="action.hover" borderRadius={1}>
                      <Typography variant="caption" display="block">
                        <strong>{edit.field}</strong> • {safeGetDisplayNameFromUUID(edit.editedBy)}
                      </Typography>
                      <Typography variant="caption" color="text.secondary" display="block">
                        {edit.oldValue || '(empty)'} → {edit.newValue || '(empty)'}
                      </Typography>
                    </Box>
                  ))}
                </Box>
              </Paper>
            </Grid>
          )}
        </Grid>
      </DialogContent>

      <DialogActions sx={{ p: 2, pt: 0 }}>
        <Button onClick={onClose} color="inherit">
          Close
        </Button>
        {onViewHistoryClick && visitor.editHistory && visitor.editHistory.length > 0 && (
          <Button
            variant="contained"
            startIcon={<HistoryIcon />}
            onClick={() => onViewHistoryClick(visitor)}
          >
            View Full History
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

export default VisitorDetailsModal;