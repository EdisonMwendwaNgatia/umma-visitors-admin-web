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
  Avatar,
  Divider,
  Grid,
  IconButton,
  Tooltip,
  Paper,
  Alert,
} from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import PersonIcon from '@mui/icons-material/Person';
import EmailIcon from '@mui/icons-material/Email';
import BadgeIcon from '@mui/icons-material/Badge';
import ComputerIcon from '@mui/icons-material/Computer';
import PhoneIphoneIcon from '@mui/icons-material/PhoneIphone';
import CalendarTodayIcon from '@mui/icons-material/CalendarToday';
import AccessTimeIcon from '@mui/icons-material/AccessTime';
import HistoryIcon from '@mui/icons-material/History';
import DeviceHubIcon from '@mui/icons-material/DeviceHub';
import SecurityIcon from '@mui/icons-material/Security';
import { User } from '../types';

interface UserDetailsDialogProps {
  open: boolean;
  onClose: () => void;
  user: User | null;
}

const UserDetailsDialog: React.FC<UserDetailsDialogProps> = ({
  open,
  onClose,
  user,
}) => {
  const formatDate = (dateString?: string) => {
    if (!dateString) return 'Never';
    try {
      const date = new Date(dateString);
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    } catch (error) {
      return 'Invalid date';
    }
  };

  const formatRelativeTime = (date?: Date | null) => {
    if (!date) return 'Never active';
    
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMins / 60);
    const diffDays = Math.floor(diffHours / 24);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins} minutes ago`;
    if (diffHours < 24) return `${diffHours} hours ago`;
    if (diffDays < 30) return `${diffDays} days ago`;
    
    return formatDate(date.toISOString());
  };

  const parseDeviceInfo = (deviceInfo?: string) => {
    if (!deviceInfo) return null;
    
    try {
      return JSON.parse(deviceInfo);
    } catch (error) {
      // If it's already a string, return it as is
      return deviceInfo;
    }
  };

  const deviceData = parseDeviceInfo(user?.deviceInfo);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          borderRadius: 3,
          maxWidth: 700,
        }
      }}
    >
      <DialogTitle sx={{ 
        backgroundColor: '#F8FAFC',
        borderBottom: '1px solid',
        borderColor: 'divider',
        fontWeight: 700,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        gap: 2
      }}>
        <Box display="flex" alignItems="center" gap={2}>
          <PersonIcon color="primary" />
          <Typography variant="h6">
            User Details: {user?.displayName || user?.email || 'User'}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ mt: 2 }}>
        {user && (
          <Box sx={{ p: 1 }}>
            {/* Header Section */}
            <Box sx={{ mb: 4 }}>
              <Box display="flex" alignItems="center" gap={3} mb={2}>
                <Avatar
                  sx={{
                    width: 64,
                    height: 64,
                    bgcolor: user.isOnline ? '#D1FAE5' : '#E5E7EB',
                    color: user.isOnline ? '#059669' : '#6B7280',
                    fontSize: '1.5rem',
                    fontWeight: 'bold',
                  }}
                >
                  {user.displayName ? user.displayName.charAt(0).toUpperCase() : user.email.charAt(0).toUpperCase()}
                </Avatar>
                
                <Box flex={1}>
                  <Typography variant="h5" fontWeight={700}>
                    {user.displayName || user.email.split('@')[0]}
                  </Typography>
                  <Typography variant="body1" color="text.secondary">
                    {user.email}
                  </Typography>
                  <Box display="flex" gap={1} mt={1} flexWrap="wrap">
                    <Chip
                      icon={<BadgeIcon />}
                      label={user.role === 'admin' ? 'Administrator' : 'User'}
                      color={user.role === 'admin' ? 'primary' : 'default'}
                      size="small"
                      sx={{ fontWeight: 600 }}
                    />
                    <Chip
                      icon={user.platform === 'mobile' ? <PhoneIphoneIcon /> : <ComputerIcon />}
                      label={user.platform === 'mobile' ? 'Mobile App' : 'Web Platform'}
                      variant="outlined"
                      size="small"
                    />
                    <Chip
                      icon={user.isOnline ? <DeviceHubIcon /> : <AccessTimeIcon />}
                      label={user.isOnline ? 'Online Now' : 'Offline'}
                      color={user.isOnline ? 'success' : 'default'}
                      variant="outlined"
                      size="small"
                    />
                  </Box>
                </Box>
              </Box>
            </Box>

            <Divider sx={{ my: 3 }} />

            {/* Details Grid */}
            <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', md: '1fr 1fr' }, gap: 3 }}>
              {/* Left Column - Basic Info */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#374151' }}>
                  <PersonIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Basic Information
                </Typography>
                
                <Paper sx={{ p: 3, borderRadius: 2, backgroundColor: '#F9FAFB' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        User ID
                      </Typography>
                      <Typography variant="body2" sx={{ fontFamily: 'monospace' }}>
                        {user.uid}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Email Address
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <EmailIcon fontSize="small" />
                        {user.email}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Display Name
                      </Typography>
                      <Typography variant="body2">
                        {user.displayName || 'Not set'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        User Role
                      </Typography>
                      <Typography variant="body2">
                        {user.role === 'admin' ? 'Administrator' : 'Regular User'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Access Level
                      </Typography>
                      <Typography variant="body2">
                        {user.role === 'admin' ? 'Full System Access' : 'Limited Access'}
                      </Typography>
                    </Box>
                  </Box>
                </Paper>
              </Box>

              {/* Right Column - Activity & Device Info */}
              <Box>
                <Typography variant="h6" gutterBottom sx={{ fontWeight: 600, color: '#374151' }}>
                  <HistoryIcon sx={{ mr: 1, fontSize: '1rem' }} />
                  Activity & Device
                </Typography>
                
                <Paper sx={{ p: 3, borderRadius: 2, backgroundColor: '#F9FAFB' }}>
                  <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Account Created
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <CalendarTodayIcon fontSize="small" />
                        {formatDate(user.createdAt)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Last Login
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        <AccessTimeIcon fontSize="small" />
                        {user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never logged in'}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Last Seen
                      </Typography>
                      <Typography variant="body2">
                        {formatRelativeTime(user.lastSeen)}
                      </Typography>
                    </Box>

                    <Box>
                      <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                        Platform
                      </Typography>
                      <Typography variant="body2" sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                        {user.platform === 'mobile' ? (
                          <>
                            <PhoneIphoneIcon fontSize="small" />
                            Mobile Application
                          </>
                        ) : (
                          <>
                            <ComputerIcon fontSize="small" />
                            Web Browser
                          </>
                        )}
                      </Typography>
                    </Box>

                    {deviceData && (
                      <Box>
                        <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                          Device Information
                        </Typography>
                        {typeof deviceData === 'object' ? (
                          <Box sx={{ fontFamily: 'monospace', fontSize: '0.875rem' }}>
                            {Object.entries(deviceData).map(([key, value]) => (
                              <div key={key}>
                                <strong>{key}:</strong> {String(value)}
                              </div>
                            ))}
                          </Box>
                        ) : (
                          <Typography variant="body2">{deviceData}</Typography>
                        )}
                      </Box>
                    )}
                  </Box>
                </Paper>
              </Box>
            </Box>

            {/* Status Summary */}
            <Paper sx={{ mt: 4, p: 3, borderRadius: 2, backgroundColor: user.isOnline ? '#F0FDF4' : '#F8FAFC' }}>
              <Box sx={{ display: 'grid', gridTemplateColumns: { xs: '1fr', sm: '1fr 1fr' }, gap: 2 }}>
                <Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Current Status
                    </Typography>
                    <Chip
                      label={user.isOnline ? 'ACTIVE NOW' : 'OFFLINE'}
                      color={user.isOnline ? 'success' : 'default'}
                      size="medium"
                      sx={{
                        fontWeight: 700,
                        fontSize: '0.875rem',
                        px: 2,
                      }}
                    />
                  </Box>
                </Box>
                <Box>
                  <Box sx={{ textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
                      Session Duration
                    </Typography>
                    <Typography variant="body1" fontWeight={600}>
                      {user.isOnline ? 'Active Session' : 'No Active Session'}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>

            {user.role === 'admin' && (
              <Alert severity="info" sx={{ mt: 3, borderRadius: 2 }}>
                <Typography variant="body2">
                  <strong>Administrator Note:</strong> This user has full access to all system features including user management, settings, and data export.
                </Typography>
              </Alert>
            )}
          </Box>
        )}
      </DialogContent>

      <DialogActions sx={{ p: 3, gap: 1 }}>
        <Button 
          onClick={onClose} 
          variant="outlined"
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default UserDetailsDialog;